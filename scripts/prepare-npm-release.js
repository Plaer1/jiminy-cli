/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(rootDir, filePath), 'utf-8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(
    path.resolve(rootDir, filePath),
    JSON.stringify(data, null, 2),
  );
}

// Copy bundle directory into packages/cli
const sourceBundleDir = path.resolve(rootDir, 'bundle');
const destBundleDir = path.resolve(rootDir, 'packages/cli/bundle');

if (fs.existsSync(sourceBundleDir)) {
  fs.rmSync(destBundleDir, { recursive: true, force: true });
  fs.cpSync(sourceBundleDir, destBundleDir, { recursive: true });
  console.log('Copied bundle/ directory to packages/cli/');
} else {
  console.error(
    'Error: bundle/ directory not found at project root. Please run `npm run bundle` first.',
  );
  process.exit(1);
}

// Inherit optionalDependencies from root package.json, excluding dev-only packages.
const rootPkg = readJson('package.json');
const optionalDependencies = { ...(rootPkg.optionalDependencies || {}) };
delete optionalDependencies['jiminy-cli-devtools'];

// Update @plaer1/jiminy-cli package.json for bundled npm release
const cliPkgPath = 'packages/cli/package.json';
const cliPkg = readJson(cliPkgPath);

cliPkg.files = ['bundle/'];
cliPkg.bin = {
  jiminy: 'bundle/jiminy.js',
};

delete cliPkg.dependencies;
delete cliPkg.devDependencies;
delete cliPkg.scripts;
delete cliPkg.main;
delete cliPkg.config;

cliPkg.optionalDependencies = optionalDependencies;

writeJson(cliPkgPath, cliPkg);

// Update @plaer1/jiminy-cli-a2a-server to depend on the published core package
// instead of a workspace-local file path.
const a2aPkgPath = 'packages/a2a-server/package.json';
const a2aPkg = readJson(a2aPkgPath);
const publishedCoreVersion =
  readJson('packages/core/package.json').version || rootPkg.version;

if (a2aPkg.dependencies?.['@plaer1/jiminy-cli-core']) {
  a2aPkg.dependencies['@plaer1/jiminy-cli-core'] = publishedCoreVersion;
}

writeJson(a2aPkgPath, a2aPkg);

console.log('Updated packages/cli/package.json for bundled npm release.');
console.log(
  'Updated packages/a2a-server/package.json to depend on published core version.',
);
console.log(
  'optionalDependencies:',
  JSON.stringify(optionalDependencies, null, 2),
);
console.log('Successfully prepared packages for npm release.');
