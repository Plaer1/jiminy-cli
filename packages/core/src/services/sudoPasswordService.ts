/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExecutionLifecycleService } from './executionLifecycleService.js';

const SUDO_PASSWORD_PROMPT_PATTERN =
  /\[sudo\] password for .+:|Password:|password for .+:/i;
const SUDO_FAILURE_PATTERN =
  /Sorry, try again|incorrect password|Authentication failure/i;

/**
 * Session-scoped service that caches a sudo password in memory and
 * automatically feeds it to sudo prompts detected in shell output.
 *
 * Only active when YOLO mode is on and sandbox is disabled.
 */
export class SudoPasswordService {
  private cachedPassword: string | null = null;
  private sudoRetryCount = 0;
  private _skipForSession = false;
  private static readonly MAX_RETRIES = 3;

  /** True if the user chose "don't ask again this session". */
  get skipForSession(): boolean {
    return this._skipForSession;
  }

  setSkipForSession(): void {
    this._skipForSession = true;
  }

  /**
   * Callback registered by the UI layer to prompt the user for a password.
   * Must render a masked input and resolve with the entered password,
   * or null if the user cancels.
   */
  private passwordPrompter: (() => Promise<string | null>) | null = null;

  getCachedPassword(): string | null {
    return this.cachedPassword;
  }

  setCachedPassword(password: string): void {
    this.cachedPassword = password;
    this.sudoRetryCount = 0;
  }

  clearCachedPassword(): void {
    this.cachedPassword = null;
  }

  /**
   * Register a callback that the UI layer provides for prompting the user
   * for their sudo password via a masked input.
   */
  registerPasswordPrompter(
    prompter: (() => Promise<string | null>) | null,
  ): void {
    this.passwordPrompter = prompter;
  }

  isSudoPasswordPrompt(output: string): boolean {
    return SUDO_PASSWORD_PROMPT_PATTERN.test(output);
  }

  isSudoFailure(output: string): boolean {
    return SUDO_FAILURE_PATTERN.test(output);
  }

  /**
   * Returns true if the given command (after stripping whitespace) starts
   * with `sudo`.
   */
  isSudoCommand(command: string): boolean {
    return /^\s*sudo\b/.test(command);
  }

  /**
   * Ensure a password is cached, prompting the user if needed.
   * Call this before starting a sudo command so the password is ready
   * to be written the moment sudo's prompt appears in output.
   *
   * Returns true if a password is now cached, false if user cancelled.
   */
  async ensurePassword(): Promise<boolean> {
    if (this.cachedPassword) {
      return true;
    }
    if (this._skipForSession || !this.passwordPrompter) {
      return false;
    }
    const password = await this.passwordPrompter();
    if (!password) {
      return false;
    }
    this.cachedPassword = password;
    return true;
  }

  /**
   * Handle a detected sudo password prompt by either using the cached
   * password or prompting the user for one, then writing it to the process.
   *
   * Returns true if password was written, false if user cancelled or
   * max retries exceeded.
   */
  async handleSudoPasswordPrompt(pid: number): Promise<boolean> {
    if (this.sudoRetryCount >= SudoPasswordService.MAX_RETRIES) {
      this.clearCachedPassword();
      return false;
    }

    let password = this.cachedPassword;

    if (!password) {
      if (!this.passwordPrompter) {
        return false;
      }
      password = await this.passwordPrompter();
      if (!password) {
        return false;
      }
      this.cachedPassword = password;
    }

    ExecutionLifecycleService.writeInput(pid, password + '\n');
    return true;
  }

  /**
   * Called when sudo output indicates an authentication failure.
   * Clears the cached password and increments retry count so the user
   * will be re-prompted on the next password prompt detection.
   */
  handleSudoFailure(): void {
    this.clearCachedPassword();
    this.sudoRetryCount++;
  }

  /**
   * Reset retry counter. Should be called at the start of each new
   * sudo command execution.
   */
  resetRetryCount(): void {
    this.sudoRetryCount = 0;
  }
}
