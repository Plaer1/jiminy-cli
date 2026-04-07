/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import * as fs from 'node:fs/promises';
import { useState, useEffect, useCallback } from 'react';
import { Box } from 'ink';
import {
  ApprovalMode,
  MessageBusType,
  MODES_BY_PERMISSIVENESS,
  SHELL_TOOL_NAME,
} from '@plaer1/jiminy-cli-core';
import toml from '@iarna/toml';
import { Notifications } from '../components/Notifications.js';
import { MainContent } from '../components/MainContent.js';
import { DialogManager } from '../components/DialogManager.js';
import { Composer } from '../components/Composer.js';
import { ExitWarning } from '../components/ExitWarning.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useFlickerDetector } from '../hooks/useFlickerDetector.js';
import { useAlternateBuffer } from '../hooks/useAlternateBuffer.js';
import { CopyModeWarning } from '../components/CopyModeWarning.js';
import { BackgroundShellDisplay } from '../components/BackgroundShellDisplay.js';
import { StreamingState } from '../types.js';
import {
  SUDO_CHOICE_ASK_LATER,
  SUDO_CHOICE_NEVER,
  SudoPasswordPrompt,
  SUDO_CHOICE_SKIP,
} from '../components/SudoPasswordPrompt.js';
import type {
  SudoPromptStage,
  SudoChoice,
} from '../components/SudoPasswordPrompt.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useKeypress, type Key } from '../hooks/useKeypress.js';
import { KeypressPriority } from '../contexts/KeypressContext.js';
import { useSettings } from '../contexts/SettingsContext.js';

const SUDO_POLICY_COMMAND_PREFIX = 'sudo';

interface PersistedTomlRule {
  toolName?: string;
  decision?: string;
  commandPrefix?: string | string[];
  modes?: string[];
}

interface PersistedTomlPolicyFile {
  rule?: PersistedTomlRule[];
}

function matchesPersistedSudoApprovalRule(
  rule: PersistedTomlRule,
  currentMode: ApprovalMode,
): boolean {
  if (
    rule.toolName !== SHELL_TOOL_NAME ||
    rule.decision !== 'allow' ||
    rule.commandPrefix === undefined
  ) {
    return false;
  }

  const commandPrefixes = Array.isArray(rule.commandPrefix)
    ? rule.commandPrefix
    : [rule.commandPrefix];

  if (!commandPrefixes.includes(SUDO_POLICY_COMMAND_PREFIX)) {
    return false;
  }

  return (
    !rule.modes || rule.modes.length === 0 || rule.modes.includes(currentMode)
  );
}

export function hasPersistedSudoApprovalRuleFromToml(
  content: string,
  currentMode: ApprovalMode,
): boolean {
  const parsed = toml.parse(content) as PersistedTomlPolicyFile;
  return (
    Array.isArray(parsed.rule) &&
    parsed.rule.some((rule) =>
      matchesPersistedSudoApprovalRule(rule, currentMode),
    )
  );
}

async function hasPersistedSudoApprovalRuleAtPath(
  policyPath: string,
  currentMode: ApprovalMode,
): Promise<boolean> {
  try {
    const content = await fs.readFile(policyPath, 'utf-8');
    return hasPersistedSudoApprovalRuleFromToml(content, currentMode);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false;
    }

    return false;
  }
}

export const DefaultAppLayout: React.FC = () => {
  const uiState = useUIState();
  const config = useConfig();
  const settings = useSettings();
  const isAlternateBuffer = useAlternateBuffer();
  const allowPermanentSudoApproval =
    settings.merged.security.enablePermanentToolApproval &&
    !config.getDisableAlwaysAllow() &&
    config.isTrustedFolder();

  const shouldSkipSudoChoicePrompt = useCallback(async (): Promise<boolean> => {
    if (!allowPermanentSudoApproval) {
      return false;
    }

    const currentMode = config.getApprovalMode();
    const policyPaths = [config.storage.getAutoSavedPolicyPath()];

    if (config.getWorkspacePoliciesDir() !== undefined) {
      policyPaths.unshift(config.storage.getWorkspaceAutoSavedPolicyPath());
    }

    for (const policyPath of policyPaths) {
      if (await hasPersistedSudoApprovalRuleAtPath(policyPath, currentMode)) {
        return true;
      }
    }

    return false;
  }, [allowPermanentSudoApproval, config]);

  const persistSudoApproval = useCallback(async (): Promise<void> => {
    const currentMode = config.getApprovalMode();
    const modeIndex = MODES_BY_PERMISSIVENESS.indexOf(currentMode);
    const modes =
      modeIndex === -1
        ? [ApprovalMode.YOLO]
        : MODES_BY_PERMISSIVENESS.slice(modeIndex);
    const persistScope =
      config.isTrustedFolder() && config.getWorkspacePoliciesDir() !== undefined
        ? 'workspace'
        : 'user';

    await config.getMessageBus().publish({
      type: MessageBusType.UPDATE_POLICY,
      toolName: SHELL_TOOL_NAME,
      commandPrefix: SUDO_POLICY_COMMAND_PREFIX,
      persist: true,
      persistScope,
      modes,
    });
  }, [config]);

  // Sudo password prompt state — owned here so there's one always-active
  // registration regardless of which branch of the dialog conditional renders.
  const [sudoStage, setSudoStage] = useState<SudoPromptStage | null>(null);
  const [sudoPassword, setSudoPassword] = useState('');
  const [sudoConfirm, setSudoConfirm] = useState('');
  const [sudoMismatch, setSudoMismatch] = useState(false);
  const [sudoResolver, setSudoResolver] = useState<
    ((value: string | null) => void) | null
  >(null);

  const cancelSudo = useCallback(
    (resolver: ((value: string | null) => void) | null) => {
      setSudoStage(null);
      setSudoPassword('');
      setSudoConfirm('');
      setSudoMismatch(false);
      resolver?.(null);
      setSudoResolver(null);
    },
    [],
  );

  useEffect(() => {
    config.sudoPasswordService.registerPasswordPrompter(
      () =>
        new Promise<string | null>((resolve) => {
          setSudoPassword('');
          setSudoConfirm('');
          setSudoMismatch(false);
          setSudoResolver(() => resolve);

          void shouldSkipSudoChoicePrompt()
            .then((skipChoicePrompt) => {
              setSudoStage(skipChoicePrompt ? 'enter' : 'choice');
            })
            .catch(() => {
              setSudoStage('choice');
            });
        }),
    );
    return () => {
      config.sudoPasswordService.registerPasswordPrompter(null);
    };
  }, [config.sudoPasswordService, shouldSkipSudoChoicePrompt]);

  // Handle the RadioButtonSelect choice (stage: 'choice')
  const handleSudoChoice = useCallback(
    (choice: SudoChoice) => {
      if (choice === SUDO_CHOICE_SKIP) {
        config.sudoPasswordService.setSkipForSession();
        cancelSudo(sudoResolver);
      } else if (choice === SUDO_CHOICE_NEVER) {
        void persistSudoApproval();
        setSudoStage('enter');
      } else if (choice === SUDO_CHOICE_ASK_LATER) {
        cancelSudo(sudoResolver);
      } else {
        setSudoStage('enter');
      }
    },
    [sudoResolver, cancelSudo, config.sudoPasswordService, persistSudoApproval],
  );

  // Handle keypresses during 'enter' and 'confirm' stages
  const handleSudoKeyPress = useCallback(
    (key: Key) => {
      if (sudoStage !== 'enter' && sudoStage !== 'confirm') return false;

      if (key.name === 'escape') {
        cancelSudo(sudoResolver);
        return true;
      }

      if (key.name === 'enter' || key.name === 'return') {
        if (sudoStage === 'enter') {
          if (sudoPassword.length > 0) {
            setSudoStage('confirm');
          }
          return true;
        }
        // confirm stage — check match
        if (sudoConfirm === sudoPassword) {
          setSudoStage(null);
          sudoResolver?.(sudoPassword);
          setSudoResolver(null);
          setSudoPassword('');
          setSudoConfirm('');
          setSudoMismatch(false);
        } else {
          setSudoMismatch(true);
          setSudoConfirm('');
        }
        return true;
      }

      if (key.name === 'backspace' || key.name === 'delete') {
        if (sudoStage === 'enter') {
          setSudoPassword((prev: string) => prev.slice(0, -1));
        } else {
          setSudoConfirm((prev: string) => prev.slice(0, -1));
        }
        return true;
      }

      if (key.insertable && !key.ctrl && !key.alt) {
        if (sudoStage === 'enter') {
          setSudoPassword((prev: string) => prev + key.sequence);
        } else {
          setSudoConfirm((prev: string) => prev + key.sequence);
        }
        return true;
      }

      return false;
    },
    [sudoStage, sudoPassword, sudoConfirm, sudoResolver, cancelSudo],
  );

  useKeypress(handleSudoKeyPress, {
    isActive: sudoStage === 'enter' || sudoStage === 'confirm',
    priority: KeypressPriority.Critical,
  });

  const { rootUiRef, terminalHeight } = uiState;
  useFlickerDetector(rootUiRef, terminalHeight);
  // If in alternate buffer mode, need to leave room to draw the scrollbar on
  // the right side of the terminal.
  return (
    <Box
      flexDirection="column"
      width={uiState.terminalWidth}
      height={isAlternateBuffer ? terminalHeight : undefined}
      flexShrink={0}
      flexGrow={0}
      overflow="hidden"
      ref={uiState.rootUiRef}
    >
      <MainContent />

      {uiState.isBackgroundShellVisible &&
        uiState.backgroundShells.size > 0 &&
        uiState.activeBackgroundShellPid &&
        uiState.backgroundShellHeight > 0 &&
        uiState.streamingState !== StreamingState.WaitingForConfirmation && (
          <Box height={uiState.backgroundShellHeight} flexShrink={0}>
            <BackgroundShellDisplay
              shells={uiState.backgroundShells}
              activePid={uiState.activeBackgroundShellPid}
              width={uiState.terminalWidth}
              height={uiState.backgroundShellHeight}
              isFocused={
                uiState.embeddedShellFocused && !uiState.dialogsVisible
              }
              isListOpenProp={uiState.isBackgroundShellListOpen}
            />
          </Box>
        )}
      <Box
        flexDirection="column"
        ref={uiState.mainControlsRef}
        flexShrink={0}
        flexGrow={0}
        width={uiState.terminalWidth}
      >
        <Notifications />
        <CopyModeWarning />

        {uiState.customDialog ? (
          uiState.customDialog
        ) : uiState.dialogsVisible ? (
          <DialogManager
            terminalWidth={uiState.terminalWidth}
            addItem={uiState.historyManager.addItem}
          />
        ) : sudoStage !== null ? (
          <SudoPasswordPrompt
            stage={sudoStage}
            password={sudoStage === 'confirm' ? sudoConfirm : sudoPassword}
            mismatch={sudoMismatch}
            showNeverAskAgain={allowPermanentSudoApproval}
            onChoice={handleSudoChoice}
          />
        ) : (
          <Composer isFocused={true} />
        )}

        <ExitWarning />
      </Box>
    </Box>
  );
};
