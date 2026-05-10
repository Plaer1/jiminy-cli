# ROBONOTES — Jiminy CLI

## Current State

- **Version:** 0.41.2 (up-to-date with upstream Gemini CLI v0.41.2 stable)
- **Branch:** `jiminy-rebase` (based on upstream tag `v0.41.2`)
- **Previous branch:** `main` (based on v0.36.0-preview era, now stale)
- **CVE Status:** PATCHED — v0.41.2 includes the CVSS 10.0 fix (GHSA-wpqr-6v78-jr5g)

## What Was Done (2026-05-10)

Full rebase from upstream Gemini CLI v0.36.0-preview → v0.41.2. Re-applied all jiminy features on top.

### Rebrand (Gemini → Jiminy)
- Package names: `@plaer1/jiminy-cli`, `@plaer1/jiminy-cli-core`
- Binary: `jiminy` (bundle entry: `bundle/jiminy.js`)
- All imports, display names, model selector labels, settings paths updated
- 1107 files changed

### Features Re-applied

1. **Sudo Password Service** — `packages/core/src/services/sudoPasswordService.ts`
   - Session-scoped password caching for YOLO mode without sandbox
   - Detects `[sudo]` prompts in shell output
   - Proactive password prompting before sudo commands
   - Max 3 retries, integrated into `shell.ts`
   - UI component NOT yet ported (needs AppContainer/DefaultAppLayout work for v0.41.2's new UI structure)

2. **Quiet YOLO No Conseca Mode** — `packages/cli/src/quietCli.ts`
   - `--quiet-yolo-no-conseca` flag
   - No TUI, plain text I/O, auto-YOLO, sandbox disabled
   - Custom terse system prompt with data safety rules
   - Universal directive injected into ALL prompts (quiet and normal)
   - Random vibe-based startup phrase

3. **Flipped Defaults** (per README claims):
   - Folder trust bypassed in quiet mode
   - `--skip-trust` flag added (from upstream CVE fix)

4. **Build Config**
   - esbuild outputs `jiminy.js` instead of `gemini.js`
   - Package names updated for npm publishing under `@plaer1`

### Upstream Changes Absorbed (v0.36.0 → v0.41.2)

- **CVE fix:** Workspace trust enforcement in headless mode
- **New features:** Session export/import, voice mode, Gemma 4 support, context management, agent history, many more
- **483 upstream commits** merged in

## Known Gaps / TODO

1. **Sudo UI component** — The `SudoPasswordPrompt.tsx` component needs to be ported to work with v0.41.2's refactored AppContainer/DefaultAppLayout. The core service works but there's no UI prompt for the user to enter their password interactively.
2. **Eval/test `.gemini` directory references** — Many evals and integration tests still reference `.gemini` directory. These need updating to `.jiminy` for tests to pass.
3. **Some `Gemini` references remain** in comments, evals, and the a2a-server — mostly non-functional (comments, test assertions, etc.)
4. **Model IDs** — Config keys renamed to `jiminy-*` but actual API model strings remain `gemini-*` (correct behavior — API needs real model names)

## File Inventory

### New files (jiminy-specific)
- `packages/core/src/services/sudoPasswordService.ts`
- `packages/core/src/services/sudoPasswordService.test.ts`
- `packages/cli/src/quietCli.ts`
- `AGENT-WORKFLOW.md`, `human-notes.md`

### Key modified files
- `packages/core/src/config/config.ts` — quietMode, sudoPasswordService
- `packages/core/src/tools/shell.ts` — sudo integration
- `packages/core/src/prompts/snippets.ts` — quiet mode prompts
- `packages/core/src/prompts/promptProvider.ts` — universal directive
- `packages/cli/src/config/config.ts` — quiet-yolo-no-conseca flag
- `packages/cli/src/jiminy.tsx` — quiet mode entry point
- `esbuild.config.js` — jiminy.js output
- `package.json` — jiminy binary name
