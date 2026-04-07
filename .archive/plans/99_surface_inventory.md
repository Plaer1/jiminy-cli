# User-Visible `Gemini` Surface Inventory

This file is the shared output for the sequential audit.

- Read `plans/00_rules.md` before editing.
- Use the schema from `plans/01_schema.md`.
- Keep the section headings exactly as written below.
- Replace placeholder lines with YAML entry blocks as work is completed.

## CLI help and launch
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
source_line: 164
reconstructed_from_source: false
notes: ""
```

```yaml
id: cli-help-extensions-describe
surface_family: cli_help
surface_name: Extensions command description
trigger_commands:
  - gemini extensions --help
trigger_context: View the help output for the extensions command.
exact_text: |-
  Manage Gemini CLI extensions.
source_path: packages/cli/src/commands/extensions.tsx
source_line: 24
reconstructed_from_source: false
notes: ""
```

```yaml
id: cli-help-hooks-describe
surface_family: cli_help
surface_name: Hooks command description
trigger_commands:
  - gemini hooks --help
trigger_context: View the help output for the hooks command.
exact_text: |-
  Manage Gemini CLI hooks.
source_path: packages/cli/src/commands/hooks.tsx
source_line: 14
reconstructed_from_source: false
notes: ""
```

```yaml
id: cli-help-mcp-add-usage
surface_family: cli_help
surface_name: MCP add usage banner
trigger_commands:
  - gemini mcp add --help
trigger_context: View help for the mcp add subcommand.
exact_text: |-
  Usage: gemini mcp add [options] <name> <commandOrUrl> [args...]
source_path: packages/cli/src/commands/mcp/add.ts
source_line: 145
reconstructed_from_source: false
notes: ""
```

```yaml
id: cli-help-mcp-remove-usage
surface_family: cli_help
surface_name: MCP remove usage banner
trigger_commands:
  - gemini mcp remove --help
trigger_context: View help for the mcp remove subcommand.
exact_text: |-
  Usage: gemini mcp remove [options] <name>
source_path: packages/cli/src/commands/mcp/remove.ts
source_line: 44
reconstructed_from_source: false
notes: ""
```

## Slash commands and in-app views
```yaml
id: slash-help-description
surface_family: slash_command
surface_name: /help description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI and open the slash command list; description shown for /help.
exact_text: |-
  For help on gemini-cli
source_path: packages/cli/src/ui/commands/helpCommand.ts
source_line: 13
reconstructed_from_source: false
notes: ""
```

```yaml
id: slash-docs-description
surface_family: slash_command
surface_name: /docs description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI and open the slash command list; description shown for /docs.
exact_text: |-
  Open full Gemini CLI documentation in your browser
source_path: packages/cli/src/ui/commands/docsCommand.ts
source_line: 18
reconstructed_from_source: false
notes: ""
```

```yaml
id: slash-settings-description
surface_family: slash_command
surface_name: /settings description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI and open the slash command list; description shown for /settings.
exact_text: |-
  View and edit Gemini CLI settings
source_path: packages/cli/src/ui/commands/settingsCommand.ts
source_line: 15
reconstructed_from_source: false
notes: ""
```

```yaml
id: slash-tools-description
surface_family: slash_command
surface_name: /tools description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI and open the slash command list; description shown for /tools.
exact_text: |-
  List available Gemini CLI tools. Use /tools desc to include descriptions.
source_path: packages/cli/src/ui/commands/toolsCommand.ts
source_line: 65
reconstructed_from_source: false
notes: ""
```

```yaml
id: slash-tools-list-description
surface_family: slash_command
surface_name: /tools list description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI, open slash commands, and expand /tools subcommands to view /list description.
exact_text: |-
  List available Gemini CLI tools.
source_path: packages/cli/src/ui/commands/toolsCommand.ts
source_line: 46
reconstructed_from_source: false
notes: ""
```

```yaml
id: slash-tools-desc-description
surface_family: slash_command
surface_name: /tools desc description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI, open slash commands, and expand /tools subcommands to view /desc description.
exact_text: |-
  List available Gemini CLI tools with descriptions.
source_path: packages/cli/src/ui/commands/toolsCommand.ts
source_line: 56
reconstructed_from_source: false
notes: ""
```

```yaml
id: slash-skills-description
surface_family: slash_command
surface_name: /skills description
trigger_commands:
  - gemini
trigger_context: Launch Gemini CLI and open the slash command list; description shown for /skills.
exact_text: |-
  List, enable, disable, or reload Gemini CLI agent skills. Usage: /skills [list | disable <name> | enable <name> | reload]
source_path: packages/cli/src/ui/commands/skillsCommand.ts
source_line: 367
reconstructed_from_source: false
notes: ""
```

## Dialogs and auth

_No entries recorded yet._

## Warnings and notifications

_No entries recorded yet._

## Command-hint outputs
```yaml
id: command-hint-resume-session
surface_family: command_hint
surface_name: Session resume hint
trigger_commands:
  - gemini
trigger_context: After ending a session, view the session summary footer shown in the terminal.
exact_text: |-
  To resume this session: gemini --resume ${escapedSessionId}
source_path: packages/cli/src/ui/components/SessionSummaryDisplay.tsx
source_line: 27
reconstructed_from_source: true
notes: ""
```

```yaml
id: command-hint-worktree-resume
surface_family: command_hint
surface_name: Worktree resume and cleanup hint
trigger_commands:
  - gemini
trigger_context: After ending a session that used a worktree, view the session summary footer shown in the terminal.
exact_text: |-
  To resume work in this worktree: cd ${escapeShellArg(worktreeSettings.path, shell)} && gemini --resume ${escapedSessionId}
  To remove manually: git worktree remove ${escapeShellArg(worktreeSettings.path, shell)}
source_path: packages/cli/src/ui/components/SessionSummaryDisplay.tsx
source_line: 31
reconstructed_from_source: true
notes: ""
```

## Settings-visible branded text

_No entries recorded yet._
