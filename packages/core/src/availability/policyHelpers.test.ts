/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolvePolicyChain,
  buildFallbackPolicyContext,
  applyModelSelection,
} from './policyHelpers.js';
import { createDefaultPolicy } from './policyCatalog.js';
import type { Config } from '../config/config.js';
import {
  DEFAULT_GEMINI_FLASH_LITE_MODEL,
  DEFAULT_GEMINI_MODEL_AUTO,
  PREVIEW_GEMINI_3_1_CUSTOM_TOOLS_MODEL,
  PREVIEW_GEMINI_3_1_MODEL,
} from '../config/models.js';
import { AuthType } from '../core/contentGenerator.js';
import { ModelConfigService } from '../services/modelConfigService.js';
import { DEFAULT_MODEL_CONFIGS } from '../config/defaultModelConfigs.js';

const createMockConfig = (overrides: Partial<Config> = {}): Config => {
  const config = {
    getUserTier: () => undefined,
    getModel: () => 'jiminy-2.5-pro',
    getJiminy31LaunchedSync: () => false,
    getJiminy31FlashLiteLaunchedSync: () => false,
    getUseCustomToolModelSync: () => {
      const useJiminy31 = config.getJiminy31LaunchedSync();
      const authType = config.getContentGeneratorConfig().authType;
      return useJiminy31 && authType === AuthType.USE_GEMINI;
    },
    getContentGeneratorConfig: () => ({ authType: undefined }),
    ...overrides,
  } as unknown as Config;
  return config;
};

describe('policyHelpers', () => {
  describe('resolvePolicyChain', () => {
    it('returns a single-model chain for a custom model', () => {
      const config = createMockConfig({
        getModel: () => 'custom-model',
      });
      const chain = resolvePolicyChain(config);
      expect(chain).toHaveLength(1);
      expect(chain[0]?.model).toBe('custom-model');
    });

    it('leaves catalog order untouched when active model already present', () => {
      const config = createMockConfig({
        getModel: () => 'jiminy-2.5-pro',
      });
      const chain = resolvePolicyChain(config);
      expect(chain[0]?.model).toBe('jiminy-2.5-pro');
    });

    it('returns the default chain when active model is "auto"', () => {
      const config = createMockConfig({
        getModel: () => DEFAULT_GEMINI_MODEL_AUTO,
      });
      const chain = resolvePolicyChain(config);

      // Expect default chain [Pro, Flash]
      expect(chain).toHaveLength(2);
      expect(chain[0]?.model).toBe('jiminy-2.5-pro');
      expect(chain[1]?.model).toBe('jiminy-2.5-flash');
    });

    it('uses auto chain when preferred model is auto', () => {
      const config = createMockConfig({
        getModel: () => 'jiminy-2.5-pro',
      });
      const chain = resolvePolicyChain(config, DEFAULT_GEMINI_MODEL_AUTO);
      expect(chain).toHaveLength(2);
      expect(chain[0]?.model).toBe('jiminy-2.5-pro');
      expect(chain[1]?.model).toBe('jiminy-2.5-flash');
    });

    it('uses auto chain when configured model is auto even if preferred is concrete', () => {
      const config = createMockConfig({
        getModel: () => DEFAULT_GEMINI_MODEL_AUTO,
      });
      const chain = resolvePolicyChain(config, 'jiminy-2.5-pro');
      expect(chain).toHaveLength(2);
      expect(chain[0]?.model).toBe('jiminy-2.5-pro');
      expect(chain[1]?.model).toBe('jiminy-2.5-flash');
    });

    it('starts chain from preferredModel when model is "auto"', () => {
      const config = createMockConfig({
        getModel: () => DEFAULT_GEMINI_MODEL_AUTO,
      });
      const chain = resolvePolicyChain(config, 'jiminy-2.5-flash');
      expect(chain).toHaveLength(1);
      expect(chain[0]?.model).toBe('jiminy-2.5-flash');
    });

    it('returns flash-lite chain when preferred model is flash-lite', () => {
      const config = createMockConfig({
        getModel: () => DEFAULT_GEMINI_MODEL_AUTO,
      });
      const chain = resolvePolicyChain(config, DEFAULT_GEMINI_FLASH_LITE_MODEL);
      expect(chain).toHaveLength(3);
      expect(chain[0]?.model).toBe('jiminy-2.5-flash-lite');
      expect(chain[1]?.model).toBe('jiminy-2.5-flash');
      expect(chain[2]?.model).toBe('jiminy-2.5-pro');
    });

    it('returns flash-lite chain when configured model is flash-lite', () => {
      const config = createMockConfig({
        getModel: () => DEFAULT_GEMINI_FLASH_LITE_MODEL,
      });
      const chain = resolvePolicyChain(config);
      expect(chain).toHaveLength(3);
      expect(chain[0]?.model).toBe('jiminy-2.5-flash-lite');
      expect(chain[1]?.model).toBe('jiminy-2.5-flash');
      expect(chain[2]?.model).toBe('jiminy-2.5-pro');
    });

    it('wraps around the chain when wrapsAround is true', () => {
      const config = createMockConfig({
        getModel: () => DEFAULT_GEMINI_MODEL_AUTO,
      });
      const chain = resolvePolicyChain(config, 'jiminy-2.5-flash', true);
      expect(chain).toHaveLength(2);
      expect(chain[0]?.model).toBe('jiminy-2.5-flash');
      expect(chain[1]?.model).toBe('jiminy-2.5-pro');
    });

    it('proactively returns Jiminy 2.5 chain if Jiminy 3 requested but user lacks access', () => {
      const config = createMockConfig({
        getModel: () => 'auto-jiminy-3',
        getHasAccessToPreviewModel: () => false,
      });
      const chain = resolvePolicyChain(config);

      // Should downgrade to [Pro 2.5, Flash 2.5]
      expect(chain).toHaveLength(2);
      expect(chain[0]?.model).toBe('jiminy-2.5-pro');
      expect(chain[1]?.model).toBe('jiminy-2.5-flash');
    });

    it('returns Jiminy 3.1 Pro chain when launched and auto-jiminy-3 requested', () => {
      const config = createMockConfig({
        getModel: () => 'auto-jiminy-3',
        getJiminy31LaunchedSync: () => true,
      });
      const chain = resolvePolicyChain(config);
      expect(chain[0]?.model).toBe(PREVIEW_GEMINI_3_1_MODEL);
      expect(chain[1]?.model).toBe('jiminy-3-flash-preview');
    });

    it('returns Jiminy 3.1 Pro Custom Tools chain when launched, auth is Jiminy, and auto-jiminy-3 requested', () => {
      const config = createMockConfig({
        getModel: () => 'auto-jiminy-3',
        getJiminy31LaunchedSync: () => true,
        getContentGeneratorConfig: () => ({ authType: AuthType.USE_GEMINI }),
      });
      const chain = resolvePolicyChain(config);
      expect(chain[0]?.model).toBe(PREVIEW_GEMINI_3_1_CUSTOM_TOOLS_MODEL);
      expect(chain[1]?.model).toBe('jiminy-3-flash-preview');
    });
  });

  describe('resolvePolicyChain behavior is identical between dynamic and legacy implementations', () => {
    const testCases = [
      { name: 'Default Auto', model: DEFAULT_GEMINI_MODEL_AUTO },
      { name: 'Jiminy 3 Auto', model: 'auto-jiminy-3' },
      { name: 'Flash Lite', model: DEFAULT_GEMINI_FLASH_LITE_MODEL },
      {
        name: 'Jiminy 3 Auto (3.1 Enabled)',
        model: 'auto-jiminy-3',
        useJiminy31: true,
      },
      {
        name: 'Jiminy 3 Auto (3.1 + Custom Tools)',
        model: 'auto-jiminy-3',
        useJiminy31: true,
        authType: AuthType.USE_GEMINI,
      },
      {
        name: 'Jiminy 3 Auto (No Access)',
        model: 'auto-jiminy-3',
        hasAccess: false,
      },
      { name: 'Concrete Model (2.5 Pro)', model: 'jiminy-2.5-pro' },
      { name: 'Custom Model', model: 'my-custom-model' },
      {
        name: 'Wrap Around',
        model: DEFAULT_GEMINI_MODEL_AUTO,
        wrapsAround: true,
      },
    ];

    testCases.forEach(
      ({ name, model, useJiminy31, hasAccess, authType, wrapsAround }) => {
        it(`achieves parity for: ${name}`, () => {
          const createBaseConfig = (dynamic: boolean) =>
            createMockConfig({
              getExperimentalDynamicModelConfiguration: () => dynamic,
              getModel: () => model,
              getJiminy31LaunchedSync: () => useJiminy31 ?? false,
              getJiminy31FlashLiteLaunchedSync: () => false,
              getHasAccessToPreviewModel: () => hasAccess ?? true,
              getContentGeneratorConfig: () => ({ authType }),
              modelConfigService: new ModelConfigService(DEFAULT_MODEL_CONFIGS),
            });

          const legacyChain = resolvePolicyChain(
            createBaseConfig(false),
            model,
            wrapsAround,
          );
          const dynamicChain = resolvePolicyChain(
            createBaseConfig(true),
            model,
            wrapsAround,
          );

          expect(dynamicChain).toEqual(legacyChain);
        });
      },
    );
  });

  describe('buildFallbackPolicyContext', () => {
    it('returns remaining candidates after the failed model', () => {
      const chain = [
        createDefaultPolicy('a'),
        createDefaultPolicy('b'),
        createDefaultPolicy('c'),
      ];
      const context = buildFallbackPolicyContext(chain, 'b');
      expect(context.failedPolicy?.model).toBe('b');
      expect(context.candidates.map((p) => p.model)).toEqual(['c']);
    });

    it('wraps around when building fallback context if wrapsAround is true', () => {
      const chain = [
        createDefaultPolicy('a'),
        createDefaultPolicy('b'),
        createDefaultPolicy('c'),
      ];
      const context = buildFallbackPolicyContext(chain, 'b', true);
      expect(context.failedPolicy?.model).toBe('b');
      expect(context.candidates.map((p) => p.model)).toEqual(['c', 'a']);
    });

    it('returns full chain when model is not in policy list', () => {
      const chain = [createDefaultPolicy('a'), createDefaultPolicy('b')];
      const context = buildFallbackPolicyContext(chain, 'x');
      expect(context.failedPolicy).toBeUndefined();
      expect(context.candidates).toEqual(chain);
    });
  });

  describe('applyModelSelection', () => {
    const mockModelConfigService = {
      getResolvedConfig: vi.fn(),
    };

    const mockAvailabilityService = {
      selectFirstAvailable: vi.fn(),
      consumeStickyAttempt: vi.fn(),
    };

    const createExtendedMockConfig = (
      overrides: Partial<Config> = {},
    ): Config => {
      const defaults = {
        getModelAvailabilityService: () => mockAvailabilityService,
        setActiveModel: vi.fn(),
        modelConfigService: mockModelConfigService,
      };
      return createMockConfig({ ...defaults, ...overrides } as Partial<Config>);
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns requested model if it is available', () => {
      const config = createExtendedMockConfig();
      mockModelConfigService.getResolvedConfig.mockReturnValue({
        model: 'jiminy-pro',
        generateContentConfig: {},
      });
      mockAvailabilityService.selectFirstAvailable.mockReturnValue({
        selectedModel: 'jiminy-pro',
      });

      const result = applyModelSelection(config, {
        model: 'jiminy-pro',
        isChatModel: true,
      });
      expect(result.model).toBe('jiminy-pro');
      expect(result.maxAttempts).toBeUndefined();
      expect(config.setActiveModel).toHaveBeenCalledWith('jiminy-pro');
    });

    it('switches to backup model and updates config if requested is unavailable', () => {
      const config = createExtendedMockConfig();
      mockModelConfigService.getResolvedConfig
        .mockReturnValueOnce({
          model: 'jiminy-pro',
          generateContentConfig: { temperature: 0.9, topP: 1 },
        })
        .mockReturnValueOnce({
          model: 'jiminy-flash',
          generateContentConfig: { temperature: 0.1, topP: 1 },
        });
      mockAvailabilityService.selectFirstAvailable.mockReturnValue({
        selectedModel: 'jiminy-flash',
      });

      const result = applyModelSelection(config, {
        model: 'jiminy-pro',
        isChatModel: true,
      });

      expect(result.model).toBe('jiminy-flash');
      expect(result.config).toEqual({
        temperature: 0.1,
        topP: 1,
      });

      expect(mockModelConfigService.getResolvedConfig).toHaveBeenCalledWith({
        model: 'jiminy-pro',
        isChatModel: true,
      });
      expect(mockModelConfigService.getResolvedConfig).toHaveBeenCalledWith({
        model: 'jiminy-flash',
        isChatModel: true,
      });
      expect(config.setActiveModel).toHaveBeenCalledWith('jiminy-flash');
    });

    it('does not call setActiveModel if isChatModel is false', () => {
      const config = createExtendedMockConfig();
      mockModelConfigService.getResolvedConfig.mockReturnValue({
        model: 'jiminy-pro',
        generateContentConfig: {},
      });
      mockAvailabilityService.selectFirstAvailable.mockReturnValue({
        selectedModel: 'jiminy-pro',
      });

      applyModelSelection(config, {
        model: 'jiminy-pro',
        isChatModel: false,
      });
      expect(config.setActiveModel).not.toHaveBeenCalled();
    });

    it('consumes sticky attempt if indicated and isChatModel is true', () => {
      const config = createExtendedMockConfig();
      mockModelConfigService.getResolvedConfig.mockReturnValue({
        model: 'jiminy-pro',
        generateContentConfig: {},
      });
      mockAvailabilityService.selectFirstAvailable.mockReturnValue({
        selectedModel: 'jiminy-pro',
        attempts: 1,
      });

      const result = applyModelSelection(config, {
        model: 'jiminy-pro',
        isChatModel: true,
      });
      expect(mockAvailabilityService.consumeStickyAttempt).toHaveBeenCalledWith(
        'jiminy-pro',
      );
      expect(config.setActiveModel).toHaveBeenCalledWith('jiminy-pro');
      expect(result.maxAttempts).toBe(1);
    });

    it('consumes sticky attempt if indicated but does not call setActiveModel if isChatModel is false', () => {
      const config = createExtendedMockConfig();
      mockModelConfigService.getResolvedConfig.mockReturnValue({
        model: 'jiminy-pro',
        generateContentConfig: {},
      });
      mockAvailabilityService.selectFirstAvailable.mockReturnValue({
        selectedModel: 'jiminy-pro',
        attempts: 1,
      });

      const result = applyModelSelection(config, {
        model: 'jiminy-pro',
        isChatModel: false,
      });
      expect(mockAvailabilityService.consumeStickyAttempt).toHaveBeenCalledWith(
        'jiminy-pro',
      );
      expect(config.setActiveModel).not.toHaveBeenCalled();
      expect(result.maxAttempts).toBe(1);
    });

    it('does not consume sticky attempt if consumeAttempt is false', () => {
      const config = createExtendedMockConfig();
      mockModelConfigService.getResolvedConfig.mockReturnValue({
        model: 'jiminy-pro',
        generateContentConfig: {},
      });
      mockAvailabilityService.selectFirstAvailable.mockReturnValue({
        selectedModel: 'jiminy-pro',
        attempts: 1,
      });

      const result = applyModelSelection(
        config,
        { model: 'jiminy-pro', isChatModel: true },
        {
          consumeAttempt: false,
        },
      );
      expect(
        mockAvailabilityService.consumeStickyAttempt,
      ).not.toHaveBeenCalled();
      expect(config.setActiveModel).toHaveBeenCalledWith('jiminy-pro');
      expect(result.maxAttempts).toBe(1);
    });
  });
});
