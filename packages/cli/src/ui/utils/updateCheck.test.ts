/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkForUpdates } from './updateCheck.js';
import type { LoadedSettings } from '../../config/settings.js';

const getPackageJson = vi.hoisted(() => vi.fn());
const debugLogger = vi.hoisted(() => ({
  warn: vi.fn(),
}));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@google/jiminy-cli-core', () => ({
  getPackageJson,
  debugLogger,
}));

describe('checkForUpdates', () => {
  let mockSettings: LoadedSettings;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    // Clear DEV environment variable before each test
    delete process.env['DEV'];

    mockSettings = {
      merged: {
        general: {
          enableAutoUpdateNotification: true,
        },
      },
    } as LoadedSettings;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockFetchResponse = (tagName: string, ok = true) => {
    fetchMock.mockResolvedValue({
      ok,
      json: vi.fn().mockResolvedValue({ tag_name: tagName }),
    });
  };

  it('should return null if enableAutoUpdateNotification is false', async () => {
    mockSettings.merged.general.enableAutoUpdateNotification = false;
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
    expect(getPackageJson).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return null when running from source (DEV=true)', async () => {
    process.env['DEV'] = 'true';
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
    });
    mockFetchResponse('v1.1.0');
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
    expect(getPackageJson).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return null if package.json is missing', async () => {
    getPackageJson.mockResolvedValue(null);
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  it('should return null if there is no update', async () => {
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
    });
    mockFetchResponse('v1.0.0');
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  it('should return a message if a newer version is available', async () => {
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
    });
    mockFetchResponse('v1.1.0');

    const result = await checkForUpdates(mockSettings);
    expect(result?.message).toContain('1.0.0 → 1.1.0');
    expect(result?.update.current).toEqual('1.0.0');
    expect(result?.update.latest).toEqual('1.1.0');
    expect(result?.update.name).toEqual('test-package');
  });

  it('should return null if the latest version is the same as the current version', async () => {
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
    });
    mockFetchResponse('v1.0.0');
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  it('should return null if the latest version is older than the current version', async () => {
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.1.0',
    });
    mockFetchResponse('v1.0.0');
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  it('should return null if the GitHub API request fails', async () => {
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
    });
    fetchMock.mockRejectedValue(new Error('Timeout'));

    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  it('should return null if the GitHub API responds with an error', async () => {
    getPackageJson.mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
    });
    mockFetchResponse('v1.1.0', false);

    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    getPackageJson.mockRejectedValue(new Error('test error'));
    const result = await checkForUpdates(mockSettings);
    expect(result).toBeNull();
  });

  describe('nightly updates', () => {
    it('should notify for a newer nightly version when current is nightly', async () => {
      getPackageJson.mockResolvedValue({
        name: 'test-package',
        version: '1.2.3-nightly.1',
      });
      mockFetchResponse('v1.2.3-nightly.2');

      const result = await checkForUpdates(mockSettings);
      expect(result?.message).toContain('1.2.3-nightly.1 → 1.2.3-nightly.2');
      expect(result?.update.latest).toBe('1.2.3-nightly.2');
    });
  });
});
