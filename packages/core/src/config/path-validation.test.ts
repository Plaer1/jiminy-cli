/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Config } from './config.js';
import * as path from 'node:path';
import * as os from 'node:os';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    statSync: vi.fn().mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(true),
    }),
    realpathSync: vi.fn((p) => p),
  };
});

vi.mock('../utils/paths.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/paths.js')>();
  return {
    ...actual,
    resolveToRealPath: vi.fn((p) => p),
    isSubpath: (parent: string, child: string) => child.startsWith(parent),
  };
});

describe('Config Path Validation', () => {
  let config: Config;
  const targetDir = '/mock/workspace';
  const globalJiminyDir = path.join(os.homedir(), '.jiminy');

  beforeEach(() => {
    config = new Config({
      targetDir,
      sessionId: 'test-session',
      debugMode: false,
      cwd: targetDir,
      model: 'test-model',
    });
  });

  it('should allow access to ~/.jiminy if it is added to the workspace', () => {
    const jiminyMdPath = path.join(globalJiminyDir, 'GEMINI.md');

    // Before adding, it should be denied
    expect(config.isPathAllowed(jiminyMdPath)).toBe(false);

    // Add to workspace
    config.getWorkspaceContext().addDirectory(globalJiminyDir);

    // Now it should be allowed
    expect(config.isPathAllowed(jiminyMdPath)).toBe(true);
    expect(config.validatePathAccess(jiminyMdPath, 'read')).toBeNull();
    expect(config.validatePathAccess(jiminyMdPath, 'write')).toBeNull();
  });

  it('should still allow project workspace paths', () => {
    const workspacePath = path.join(targetDir, 'src/index.ts');
    expect(config.isPathAllowed(workspacePath)).toBe(true);
    expect(config.validatePathAccess(workspacePath, 'read')).toBeNull();
  });
});
