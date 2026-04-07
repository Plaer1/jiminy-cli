/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import {
  RadioButtonSelect,
  type RadioSelectItem,
} from './shared/RadioButtonSelect.js';

export type SudoPromptStage = 'choice' | 'enter' | 'confirm';

export const SUDO_CHOICE_ENTER = 'enter';
export const SUDO_CHOICE_ASK_LATER = 'ask-later';
export const SUDO_CHOICE_NEVER = 'never';
export const SUDO_CHOICE_SKIP = 'skip';
export type SudoChoice =
  | typeof SUDO_CHOICE_ENTER
  | typeof SUDO_CHOICE_ASK_LATER
  | typeof SUDO_CHOICE_NEVER
  | typeof SUDO_CHOICE_SKIP;

export function getSudoChoiceItems(
  showNeverAskAgain = false,
): Array<RadioSelectItem<SudoChoice>> {
  const items: Array<RadioSelectItem<SudoChoice>> = [
    {
      key: SUDO_CHOICE_ENTER,
      label: 'Yes, remember my sudo password for this session',
      value: SUDO_CHOICE_ENTER,
    },
    {
      key: SUDO_CHOICE_ASK_LATER,
      label: 'Ask me next time',
      value: SUDO_CHOICE_ASK_LATER,
    },
    {
      key: SUDO_CHOICE_SKIP,
      label: "No, don't ask me again this session",
      value: SUDO_CHOICE_SKIP,
    },
  ];

  if (showNeverAskAgain) {
    items.push({
      key: SUDO_CHOICE_NEVER,
      label: 'Never ask me again',
      value: SUDO_CHOICE_NEVER,
      sublabel: 'Saves a persistent sudo approval rule for future sessions.',
    });
  }

  return items;
}

export interface SudoPasswordPromptProps {
  stage: SudoPromptStage;
  password: string;
  mismatch?: boolean;
  showNeverAskAgain?: boolean;
  onChoice: (choice: SudoChoice) => void;
}

export const SudoPasswordPrompt: React.FC<SudoPasswordPromptProps> = ({
  stage,
  password,
  mismatch = false,
  showNeverAskAgain = false,
  onChoice,
}: SudoPasswordPromptProps) => (
  <Box
    borderStyle="round"
    borderColor={theme.border.default}
    flexDirection="column"
    paddingX={2}
    paddingY={1}
  >
    <Text color={theme.status.warning}>
      Would you like me to remember your sudo password for this session?
    </Text>

    {stage === 'choice' && (
      <Box marginTop={1}>
        <RadioButtonSelect
          items={getSudoChoiceItems(showNeverAskAgain)}
          onSelect={onChoice}
          showNumbers={true}
          priority={true}
        />
      </Box>
    )}

    {(stage === 'enter' || stage === 'confirm') && (
      <>
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>
            {stage === 'enter' ? 'Password:       ' : 'Confirm password:'}
          </Text>
          <Text>{'\u2022'.repeat(password.length)}</Text>
          <Text color={theme.text.secondary}>_</Text>
        </Box>
        {mismatch && (
          <Box marginTop={1}>
            <Text color={theme.status.error}>
              Passwords do not match. Please try again.
            </Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>Enter to continue · Escape to cancel</Text>
        </Box>
      </>
    )}

    <Box marginTop={1}>
      <Text dimColor>⚠ Stored in memory only - cleared when Jiminy exits.</Text>
    </Box>
  </Box>
);
