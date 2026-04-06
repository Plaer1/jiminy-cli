/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Box } from 'ink';
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
import type {
  SUDO_CHOICE_ENTER,
  SudoPasswordPrompt,
  SUDO_CHOICE_SKIP,
  type SudoPromptStage,
} from '../components/SudoPasswordPrompt.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useKeypress, type Key } from '../hooks/useKeypress.js';
import { KeypressPriority } from '../contexts/KeypressContext.js';

export const DefaultAppLayout: React.FC = () => {
  const uiState = useUIState();
  const config = useConfig();
  const isAlternateBuffer = useAlternateBuffer();

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
          setSudoStage('choice');
        }),
    );
    return () => {
      config.sudoPasswordService.registerPasswordPrompter(null);
    };
  }, [config.sudoPasswordService]);

  // Handle the RadioButtonSelect choice (stage: 'choice')
  const handleSudoChoice = useCallback(
    (choice: typeof SUDO_CHOICE_ENTER | typeof SUDO_CHOICE_SKIP) => {
      if (choice === SUDO_CHOICE_SKIP) {
        config.sudoPasswordService.setSkipForSession();
        cancelSudo(sudoResolver);
      } else {
        setSudoStage('enter');
      }
    },
    [sudoResolver, cancelSudo, config.sudoPasswordService],
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
