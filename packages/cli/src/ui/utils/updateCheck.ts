/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { getPackageJson, debugLogger } from '@google/gemini-cli-core';
import type { LoadedSettings } from '../../config/settings.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FETCH_TIMEOUT_MS = 2000;

const GITHUB_REPO = 'Plaer1/jiminy-cli';
const GITHUB_RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Replicating the bits of UpdateInfo we need from update-notifier
export interface UpdateInfo {
  latest: string;
  current: string;
  name: string;
  type?: semver.ReleaseType;
}

export interface UpdateObject {
  message: string;
  update: UpdateInfo;
}

/**
 * Fetches the latest release version from GitHub Releases.
 * Returns a clean semver string (strips leading "v"), or null on failure.
 */
async function getLatestGitHubVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (
      typeof data !== 'object' ||
      data === null ||
      !('tag_name' in data) ||
      typeof data.tag_name !== 'string'
    ) {
      return null;
    }
    const tag = data.tag_name;
    return tag.startsWith('v') ? tag.slice(1) : tag;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkForUpdates(
  settings: LoadedSettings,
): Promise<UpdateObject | null> {
  try {
    if (!settings.merged.general.enableAutoUpdateNotification) {
      return null;
    }
    // Skip update check when running from source (development mode)
    if (process.env['DEV'] === 'true') {
      return null;
    }
    const packageJson = await getPackageJson(__dirname);
    if (!packageJson || !packageJson.name || !packageJson.version) {
      return null;
    }

    const { name, version: currentVersion } = packageJson;

    const latestVersion = await getLatestGitHubVersion();
    if (!latestVersion) return null;

    if (semver.gt(latestVersion, currentVersion)) {
      const type = semver.diff(latestVersion, currentVersion) || undefined;
      const message = `A new version of Jiminy CLI is available! ${currentVersion} → ${latestVersion}`;
      return {
        message,
        update: {
          latest: latestVersion,
          current: currentVersion,
          name,
          type,
        },
      };
    }

    return null;
  } catch (e) {
    debugLogger.warn('Failed to check for updates: ' + e);
    return null;
  }
}
