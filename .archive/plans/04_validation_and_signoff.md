# Phase 04: Validation And Signoff

## Mission
Audit `plans/99_surface_inventory.md` for completeness, exactness, casing safety, and section placement. Fix verified errors only.

## Read first
- `plans/00_rules.md`
- `plans/01_schema.md`
- `plans/99_surface_inventory.md`

## Validation checklist
- Confirm every entry is from a runtime, user-visible surface in `packages/cli/src` or `packages/core/src`.
- Confirm no entry comes from:
  - docs
  - tests
  - snapshots
  - comments
  - imports
  - package metadata not shown to users
  - internal prompts
- Confirm every entry uses the schema exactly.
- Confirm every entry has:
  - a stable `id`
  - at least one concrete `trigger_commands` item or a precise stateful access path
  - a repo-relative `source_path`
  - a single numeric `source_line`
  - the correct `reconstructed_from_source` value

## Casing and punctuation audit
Perform a deliberate pass for these failure modes:

- `Gemini CLI` rewritten as anything else
- `gemini-cli` rewritten as anything else
- `Gemini CLI Companion` rewritten as anything else
- model IDs title-cased or normalized
- slash commands missing their leading `/`
- command examples missing leading `gemini`
- line breaks flattened in help banners
- straight quotes changed to curly quotes or the reverse
- hyphens removed from model IDs or command names

## Duplicate policy
- Keep duplicates when the same exact text appears in different user-visible surfaces.
- Remove only true accidental duplicates where the same occurrence was entered twice for the same surface and trigger.

## Section-placement rules
- `CLI help and launch`
  - top-level help
  - subcommand help
  - launch blurbs
- `Slash commands and in-app views`
  - slash-command descriptions
  - about, hooks, tools, docs, and similar in-app views
- `Dialogs and auth`
  - dialogs, restart prompts, IDE install prompts, auth notices
- `Warnings and notifications`
  - warnings, notifications, update notices, startup and compatibility warnings
- `Command-hint outputs`
  - visible strings that tell the user to run `gemini ...`
- `Settings-visible branded text`
  - branded descriptions shown in settings UI

## Final pass
- If a string was reconstructed from multiple literals, compare the final `exact_text` to the rendered result one more time.
- If a borderline item remains uncertain, prefer removing it and leaving a short explanatory note in `notes`.
- Leave the file ready for a human reader with no placeholder ambiguity.
