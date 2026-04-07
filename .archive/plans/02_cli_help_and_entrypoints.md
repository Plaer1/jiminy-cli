# Phase 02: CLI Help And Entrypoints

## Mission
Populate `plans/99_surface_inventory.md` with every branded, user-visible string occurrence reachable from CLI help, launch surfaces, slash-command discovery text, and explicit command-hint outputs.

## Read first
- `plans/00_rules.md`
- `plans/01_schema.md`
- `plans/99_surface_inventory.md`

## Sections you own
- `CLI help and launch`
- `Slash commands and in-app views`
- `Command-hint outputs`

## What to include
- Top-level help banners and launch blurbs.
- Help text for concrete CLI subcommands where branded text appears.
- Slash-command descriptions visible after launching `gemini`.
- Command-hint outputs that literally tell the user to run `gemini ...` or show branded launch/resume commands.

## What to exclude
- Internal-only command modules with no user-visible string.
- ACP or protocol payload text unless it is clearly surfaced in a normal user workflow.
- Example README files and docs.

## Primary source files to inspect
- `packages/cli/src/config/config.ts`
- `packages/cli/src/commands/extensions.tsx`
- `packages/cli/src/commands/hooks.tsx`
- `packages/cli/src/commands/hooks/migrate.ts`
- `packages/cli/src/commands/mcp/add.ts`
- `packages/cli/src/commands/mcp/remove.ts`
- `packages/cli/src/ui/commands/helpCommand.ts`
- `packages/cli/src/ui/commands/docsCommand.ts`
- `packages/cli/src/ui/commands/settingsCommand.ts`
- `packages/cli/src/ui/commands/toolsCommand.ts`
- `packages/cli/src/ui/commands/skillsCommand.ts`
- `packages/cli/src/ui/components/SessionSummaryDisplay.tsx`
- `packages/cli/src/commands/extensions/new.ts`
- `packages/cli/src/commands/extensions/update.ts`
- `packages/cli/src/config/extension-manager.ts`
- `packages/cli/src/commands/mcp/enableDisable.ts`
- `packages/cli/src/config/mcp/mcpServerEnablement.ts`
- `packages/core/src/tools/mcp-client.ts`
- `packages/cli/src/gemini.tsx`

## Known access paths to verify
- `gemini --help`
- `gemini extensions --help`
- `gemini hooks --help`
- `gemini hooks migrate --help`
- `gemini mcp add --help`
- `gemini mcp remove --help`
- Launch `gemini`, then inspect slash-command descriptions for:
  - `/help`
  - `/docs`
  - `/settings`
  - `/tools`
  - `/skills`
- Launch `gemini`, then inspect session summary and command-hint outputs.

## Entry rules specific to this phase
- Record each branded string occurrence separately, even within the same help surface.
- If a message contains both a branded command and branded prose, record the exact displayed text as one entry if it is a single visible string block.
- If the same exact command appears in multiple distinct outputs, record separate entries.

## Done criteria
- Every branded help or launch occurrence in your owned surfaces is represented.
- Every entry has a concrete trigger command or exact runtime access path.
- No entries from docs, tests, or comments were added.
