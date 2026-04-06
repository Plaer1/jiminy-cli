/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionLifecycleService } from './executionLifecycleService.js';
import { SudoPasswordService } from './sudoPasswordService.js';

describe('SudoPasswordService', () => {
  let service: SudoPasswordService;

  beforeEach(() => {
    service = new SudoPasswordService();
    vi.restoreAllMocks();
  });

  it('caches a prompted password for the session', async () => {
    service.registerPasswordPrompter(async () => 'secret');

    await expect(service.ensurePassword()).resolves.toBe(true);
    expect(service.getCachedPassword()).toBe('secret');
  });

  it('respects skip for session when no password is cached', async () => {
    service.registerPasswordPrompter(async () => 'secret');
    service.setSkipForSession();

    await expect(service.ensurePassword()).resolves.toBe(false);
    expect(service.getCachedPassword()).toBeNull();
  });

  it('writes the cached password to the running process', async () => {
    const writeInputSpy = vi
      .spyOn(ExecutionLifecycleService, 'writeInput')
      .mockImplementation(() => {});

    service.setCachedPassword('secret');

    await expect(service.handleSudoPasswordPrompt(42)).resolves.toBe(true);
    expect(writeInputSpy).toHaveBeenCalledWith(42, 'secret\n');
  });

  it('re-prompts after an authentication failure', async () => {
    const writeInputSpy = vi
      .spyOn(ExecutionLifecycleService, 'writeInput')
      .mockImplementation(() => {});
    const prompter = vi.fn().mockResolvedValue('second-secret');

    service.setCachedPassword('first-secret');
    service.handleSudoFailure();
    service.registerPasswordPrompter(prompter);

    await expect(service.handleSudoPasswordPrompt(7)).resolves.toBe(true);
    expect(prompter).toHaveBeenCalledOnce();
    expect(writeInputSpy).toHaveBeenCalledWith(7, 'second-secret\n');
    expect(service.getCachedPassword()).toBe('second-secret');
  });

  it('stops prompting after too many failures', async () => {
    const prompter = vi.fn().mockResolvedValue('secret');
    service.registerPasswordPrompter(prompter);

    service.handleSudoFailure();
    service.handleSudoFailure();
    service.handleSudoFailure();

    await expect(service.handleSudoPasswordPrompt(9)).resolves.toBe(false);
    expect(prompter).not.toHaveBeenCalled();
    expect(service.getCachedPassword()).toBeNull();
  });
});
