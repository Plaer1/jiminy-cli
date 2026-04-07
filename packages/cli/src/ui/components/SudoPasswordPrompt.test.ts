/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  getSudoChoiceItems,
  SUDO_CHOICE_ASK_LATER,
  SUDO_CHOICE_ENTER,
  SUDO_CHOICE_NEVER,
  SUDO_CHOICE_SKIP,
} from './SudoPasswordPrompt.js';

describe('getSudoChoiceItems', () => {
  it('returns the non-persistent choices by default', () => {
    expect(getSudoChoiceItems()).toEqual([
      expect.objectContaining({
        key: SUDO_CHOICE_ENTER,
        value: SUDO_CHOICE_ENTER,
      }),
      expect.objectContaining({
        key: SUDO_CHOICE_ASK_LATER,
        value: SUDO_CHOICE_ASK_LATER,
      }),
      expect.objectContaining({
        key: SUDO_CHOICE_SKIP,
        value: SUDO_CHOICE_SKIP,
      }),
    ]);
  });

  it('includes the persistent never-ask-again choice when enabled', () => {
    expect(getSudoChoiceItems(true)).toEqual([
      expect.objectContaining({
        key: SUDO_CHOICE_ENTER,
        value: SUDO_CHOICE_ENTER,
      }),
      expect.objectContaining({
        key: SUDO_CHOICE_ASK_LATER,
        value: SUDO_CHOICE_ASK_LATER,
      }),
      expect.objectContaining({
        key: SUDO_CHOICE_SKIP,
        value: SUDO_CHOICE_SKIP,
      }),
      expect.objectContaining({
        key: SUDO_CHOICE_NEVER,
        value: SUDO_CHOICE_NEVER,
        label: 'Never ask me again',
      }),
    ]);
  });
});
