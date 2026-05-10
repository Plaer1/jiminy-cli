# Stable Patch Release Runbook

## Purpose

This file is a plan only. Do not execute it automatically.

It describes how one subagent should, in a strict linear order:

1. run the relevant tests,
2. increment the version in an npm-safe way,
3. push the release through GitHub,
4. publish the release to npm `latest`,
5. verify the result.

This repo is not a Gradle or Minecraft mod repo. It is one GitHub repo, `Plaer1/jiminy-cli`, that publishes three npm packages:

- `@plaer1/jiminy-cli`
- `@plaer1/jiminy-cli-core`
- `@plaer1/jiminy-cli-a2a-server`

## Release Strategy

- Release type: stable patch release only
- GitHub repo count: one
- npm package count: three
- Canonical release path: GitHub Actions workflow, not direct local `npm publish`
- npm-safe version format for packages: bare semver `X.Y.Z`
- Git tag / workflow version format: `vX.Y.Z`
- Current repo version at planning time: `0.36.3`
- Next patch version at planning time: `0.36.4`

## Preconditions

The subagent must stop immediately if any of these are false:

- `gh` is installed and authenticated for the target repo
- npm dependencies can be installed with `npm ci`
- the intended release commit already exists locally and is the exact code to release
- required credentials for the GitHub workflow already exist in GitHub secrets and environments
- the operator wants a stable patch release to npm `latest`

The subagent must not improvise a different release path. If the GitHub workflow path is unavailable, stop and report that the plan cannot proceed without revision.

## Linear Execution Order

### 1. Confirm the release target and current state

Run these commands from the repo root:

```fish
pwd
git remote -v
git status --short
node -v
cat .nvmrc
npm --version
```

Then capture the exact release commit:

```fish
git rev-parse HEAD
git branch --show-current
```

Stop if:

- the working tree contains unrelated changes that should not be released,
- the target branch or commit is unclear,
- the environment is missing Node or npm.

### 2. Install dependencies cleanly

Run:

```fish
npm ci
```

Stop if dependency installation fails.

### 3. Run the release-candidate test sequence

Run the same checks the repo release automation expects before publication:

```fish
npm run build
npm run test:ci
npm run test:integration:sandbox:none
npm run test:integration:sandbox:docker
```

Notes:

- `npm run test:ci` already fans out to workspace package test suites plus the root script tests.
- These are the unit/integration checks this repo uses for release gating.
- Do not bump versions before this stage passes.

Stop if any command fails.

### 4. Compute the npm-safe patch version

Read the current root version:

```fish
node -p "require('./package.json').version"
```

Rules:

- package versions must stay bare semver, for example `0.36.4`
- do not put the `v` prefix into `package.json`
- use the `v` prefix only for tags and workflow inputs, for example `v0.36.4`
- for this plan, keep doing patch releases only

At planning time the current version is `0.36.3`, so the next patch is `0.36.4`.

If the current version is still `0.36.3`, use:

- package version: `0.36.4`
- workflow/tag version: `v0.36.4`

If the current version has changed before execution, recompute the next patch from that newer stable version and continue using the same rules.

### 5. Apply the version bump locally for validation

Run:

```fish
npm run release:version 0.36.4
```

Expected effects based on the repo scripts:

- root `package.json` version is updated
- workspace package versions are updated
- `sandboxImageUri` version references are updated where present
- `package-lock.json` is updated

Immediately verify the result:

```fish
node -p "require('./package.json').version"
node -p "require('./packages/cli/package.json').version"
node -p "require('./packages/core/package.json').version"
node -p "require('./packages/a2a-server/package.json').version"
git diff -- package.json package-lock.json packages/cli/package.json packages/core/package.json packages/a2a-server/package.json
```

Stop if:

- any published package version does not match `0.36.4`,
- the bump script writes an invalid prerelease or prefixed version,
- the lockfile or package metadata update looks inconsistent.

### 6. Re-run the fast validation after the bump

Run:

```fish
npm run build
npm run test:ci
```

This is a post-bump sanity pass. The GitHub workflow will run release tests again, but the subagent should still verify the local versioned state before handing off to GitHub.

Stop if any command fails.

### 7. Push the intended source commit to GitHub if needed

If the release commit is not yet on the remote branch the workflow should use, push it first:

```fish
git push origin HEAD
```

Use the branch or SHA that now contains the release-ready code. Do not create an alternative release process locally.

Stop if the push fails.

### 8. Trigger the GitHub Actions dry run

Use the repo’s canonical workflow:

- workflow file: `.github/workflows/release-manual.yml`

Trigger it with a dry run first:

```fish
gh workflow run release-manual.yml \
  --ref main \
  --field version=v0.36.4 \
  --field ref=main \
  --field release_channel=latest \
  --field dry_run=true \
  --field force_skip_tests=false \
  --field skip_github_release=false \
  --field environment=prod
```

Then identify and watch the resulting run:

```fish
gh run list --workflow release-manual.yml --limit 5
gh run watch
```

Dry-run success criteria:

- the workflow starts successfully,
- the release branch creation step succeeds,
- the version update step succeeds,
- the build and packaging steps succeed,
- the publish steps complete as dry-run simulation,
- no unexpected version conflict appears.

Stop if the dry run fails. Do not continue to the live release.

### 9. Trigger the live GitHub release

Only after the dry run succeeds, trigger the same workflow live:

```fish
gh workflow run release-manual.yml \
  --ref main \
  --field version=v0.36.4 \
  --field ref=main \
  --field release_channel=latest \
  --field dry_run=false \
  --field force_skip_tests=false \
  --field skip_github_release=false \
  --field environment=prod
```

Again watch the run:

```fish
gh run list --workflow release-manual.yml --limit 5
gh run watch
```

Expected GitHub-side behavior from the existing workflow:

- create `release/v0.36.4`
- run tests
- apply `npm run release:version 0.36.4` in the workflow checkout
- commit release version changes
- push the release branch to origin
- build packages
- bundle release artifacts
- prepare publishable package metadata
- publish the three npm packages
- apply the npm `latest` tag
- create the GitHub release `v0.36.4`

Stop if the workflow fails at any step. Do not attempt a manual local npm publish as a fallback unless the plan is explicitly rewritten.

### 10. Verify GitHub outputs

After the live run succeeds, verify GitHub state:

```fish
gh release view v0.36.4
git ls-remote --heads origin release/v0.36.4
```

Success criteria:

- GitHub release `v0.36.4` exists
- remote branch `release/v0.36.4` exists

### 11. Verify npm publication

Verify the published versions:

```fish
npm view @plaer1/jiminy-cli version --tag=latest
npm view @plaer1/jiminy-cli-core version --tag=latest
npm view @plaer1/jiminy-cli-a2a-server version --tag=latest
```

Each command must return:

```text
0.36.4
```

Stop if any package resolves to a different version.

### 12. Verify install and runtime smoke behavior

Run the same basic checks the repo’s verification flow is designed around:

```fish
jiminy --version
npx --prefer-online @plaer1/jiminy-cli@0.36.4 --version
```

Both commands must report:

```text
0.36.4
```

If the local machine does not already have the newly published CLI on `PATH`, use:

```fish
npx --prefer-online @plaer1/jiminy-cli@latest --version
```

The returned version must still be `0.36.4`.

## Files and Systems This Plan Depends On

- `/home/e/source/repos/jiminy/package.json`
- `/home/e/source/repos/jiminy/scripts/version.js`
- `/home/e/source/repos/jiminy/scripts/prepare-npm-release.js`
- `/home/e/source/repos/jiminy/.github/workflows/release-manual.yml`
- `/home/e/source/repos/jiminy/.github/actions/publish-release/action.yml`
- `/home/e/source/repos/jiminy/.github/actions/run-tests/action.yml`
- `/home/e/source/repos/jiminy/.github/actions/verify-release/action.yml`
- GitHub repo `Plaer1/jiminy-cli`
- npm registry entries for the three published packages

## Hard Rules for the Later Subagent

- Follow the steps in order without reordering them.
- Stop on the first failed command.
- Do not switch from patch releases to minor or preview releases.
- Do not write `v0.36.4` into any `package.json`.
- Do not replace the GitHub Actions release path with local manual publishing.
- Do not skip tests unless a human explicitly edits this runbook first.
- Do not publish anything if the dry run fails.

## Expected Final State

If the later subagent executes this plan successfully, the final state should be:

- one GitHub repo remains the source of truth,
- three npm packages are published at `0.36.4`,
- npm `latest` points to `0.36.4`,
- GitHub release `v0.36.4` exists,
- release branch `release/v0.36.4` exists,
- the published CLI reports version `0.36.4`.
