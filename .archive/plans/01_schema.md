# Shared Output Schema

## File to edit
- `plans/99_surface_inventory.md`

## Entry shape
Every inventory item must be written as a fenced YAML block with these fields:

- `id`
- `surface_family`
- `surface_name`
- `trigger_commands`
- `trigger_context`
- `exact_text`
- `source_path`
- `source_line`
- `reconstructed_from_source`
- `notes`

## Field rules
- `id`
  - Lowercase kebab-case.
  - Stable after first creation.
  - Good pattern: `<section>-<surface>-<short-slug>`.
- `surface_family`
  - One of:
    - `cli_help`
    - `launch_surface`
    - `slash_command`
    - `view`
    - `dialog`
    - `warning`
    - `notification`
    - `settings_description`
    - `command_hint`
    - `title_bar`
- `surface_name`
  - Human-readable label for the exact occurrence, not a whole subsystem.
  - Example: `Top-level help usage banner`.
- `trigger_commands`
  - YAML list of literal user commands.
  - Use backticks only in surrounding Markdown prose, not inside YAML values.
  - If the user launches the app and then reaches a state without a second typed command, include the launch command and explain the rest in `trigger_context`.
- `trigger_context`
  - One concise sentence describing the exact state needed to see the text.
- `exact_text`
  - Always use a YAML block scalar with `|-`, even for one-line strings.
  - Preserve exact line breaks.
- `source_path`
  - Repo-relative path.
- `source_line`
  - Single 1-based line number.
- `reconstructed_from_source`
  - `true` only when the rendered text had to be reconstructed from multiple literals.
- `notes`
  - Empty string if no note is needed.

## Example entry

```yaml
id: cli-help-top-level-usage-banner
surface_family: cli_help
surface_name: Top-level help usage banner
trigger_commands:
  - gemini --help
trigger_context: Run the top-level CLI help in any terminal session.
exact_text: |-
  Usage: gemini [options] [command]

  Gemini CLI - Defaults to interactive mode. Use -p/--prompt for non-interactive (headless) mode.
source_path: packages/cli/src/config/config.ts
source_line: 165
reconstructed_from_source: false
notes: ""
```

## Formatting rules
- Put one blank line between YAML blocks.
- Do not use Markdown tables.
- Do not wrap long YAML strings unless the rendered text itself wraps.
- Do not add prose between entries inside a section.
