# Sequential Inventory Rules

## Purpose
These rules govern a sequential audit of runtime, user-visible branded strings in this repo. The output must identify every place a user can see branded `Gemini` text in actual product surfaces.

## Required reading order
1. Read this file.
2. Read your assigned phase file.
3. Read the current contents of `plans/99_surface_inventory.md` before editing it.

## Non-negotiable constraints
- Do not create, edit, move, or delete files outside `plans/`.
- Do not spawn agents.
- Do not edit source code.
- Do not restyle or reorganize existing entries in `plans/99_surface_inventory.md` unless you are correcting a verified mistake.
- Do not collapse duplicate-looking entries if they come from different user-visible surfaces.
- If one dialog or view shows two branded strings, record two separate entries.

## Exact-text rules
- Copy displayed text exactly as shown in source.
- Preserve capitalization, spacing, punctuation, quotes, apostrophes, ellipses, slashes, hyphens, and line breaks.
- Never normalize case.
- Never "improve" wording.
- Never expand, abbreviate, or re-titlecase branded text.
- If a rendered string is assembled from multiple literals, reconstruct the final displayed text exactly and set `reconstructed_from_source: true`.
- If the string is a single literal already present in source, set `reconstructed_from_source: false`.

## Canonical spelling guardrail
Treat the following tokens as exact literals. Do not rewrite them.

- `Gemini CLI`
- `gemini`
- `gemini-cli`
- `Gemini CLI Companion`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-3-pro`
- `gemini-3-flash`
- `gemini-3.1-pro`
- `gemini-3.1-flash`
- `/help`
- `/docs`
- `/settings`
- `/tools`
- `/skills`

## Common capitalization failures to avoid
- `Gemini CLI` is not `Gemini Cli`, `gemini CLI`, or `Gemini`.
- `gemini-cli` is not `gemini cli` or `Gemini-CLI`.
- `Gemini CLI Companion` is not `Gemini companion`.
- `gemini-3-pro` is not `Gemini-3-Pro`.
- `/help` is not `help`.
- `--prompt` is not `prompt`.

## Inclusion rules
Include only runtime, user-visible surfaces in `packages/cli/src` or `packages/core/src`, including:

- CLI help and launch output
- slash-command descriptions shown in the app
- app header and title-bar text
- dialogs, warnings, notifications, and restart prompts
- in-app settings descriptions
- session summaries and command-hint messages
- IDE integration errors or install prompts that are surfaced to users

## Exclusion rules
Do not record entries from:

- `docs/**`
- `README*`
- `SECURITY.md`
- `GEMINI.md`
- `integration-tests/**`
- `**/*.test.*`
- `**/__snapshots__/**`
- comments only
- imports only
- package metadata that is not shown to users
- telemetry-only labels
- internal model or system prompt files such as `packages/core/src/prompts/**`
- agent-only instructional text that is never surfaced directly to end users

## Output rules
- Use the schema in `plans/01_schema.md` exactly.
- Add entries only under the existing section headings in `plans/99_surface_inventory.md`.
- Use one fenced YAML block per entry.
- Keep `source_path` repo-relative.
- Keep `source_line` as a single 1-based line number.
- If no direct shell command exists, use `trigger_context` to explain the state transition precisely.
- Prefer concrete access paths over vague descriptions.

## Handoff rules
- Append new entries to the appropriate section.
- Do not reorder earlier entries just for style.
- If you fix an existing entry, keep the original `id` unless it is plainly wrong.
- If you are unsure whether a string is user-visible, exclude it rather than guessing.
- If you exclude a borderline case that a later agent should review, leave that note in your phase file worklog or in `notes` only if it helps the final auditor.

## Files outside `plans/`
- This task should not create files outside `plans/`.
- If a future revision truly requires a new file outside `plans/`, add an exact repo-root ignore rule for that path in `.gitignore` in the same change.
