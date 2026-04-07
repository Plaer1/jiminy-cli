# Jiminy CLI cheatsheet

This page provides a reference for commonly used Jiminy CLI commands, options,
and parameters.

## CLI commands

| Command                            | Description                        | Example                                                      |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `jiminy`                           | Start interactive REPL             | `jiminy`                                                     |
| `jiminy -p "query"`                | Query non-interactively            | `jiminy -p "summarize README.md"`                            |
| `jiminy "query"`                   | Query and continue interactively   | `jiminy "explain this project"`                              |
| `cat file \| jiminy`               | Process piped content              | `cat logs.txt \| jiminy`<br>`Get-Content logs.txt \| jiminy` |
| `jiminy -i "query"`                | Execute and continue interactively | `jiminy -i "What is the purpose of this project?"`           |
| `jiminy -r "latest"`               | Continue most recent session       | `jiminy -r "latest"`                                         |
| `jiminy -r "latest" "query"`       | Continue session with a new prompt | `jiminy -r "latest" "Check for type errors"`                 |
| `jiminy -r "<session-id>" "query"` | Resume session by ID               | `jiminy -r "abc123" "Finish this PR"`                        |
| `jiminy update`                    | Update to latest version           | `jiminy update`                                              |
| `jiminy extensions`                | Manage extensions                  | See [Extensions Management](#extensions-management)          |
| `jiminy mcp`                       | Configure MCP servers              | See [MCP Server Management](#mcp-server-management)          |

### Positional arguments

| Argument | Type              | Description                                                                                                |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `query`  | string (variadic) | Positional prompt. Defaults to interactive mode in a TTY. Use `-p/--prompt` for non-interactive execution. |

## Interactive commands

These commands are available within the interactive REPL.

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `/skills reload`     | Reload discovered skills from disk       |
| `/agents reload`     | Reload the agent registry                |
| `/commands reload`   | Reload custom slash commands             |
| `/memory reload`     | Reload context files (e.g., `GEMINI.md`) |
| `/mcp reload`        | Restart and reload MCP servers           |
| `/extensions reload` | Reload all active extensions             |
| `/help`              | Show help for all commands               |
| `/quit`              | Exit the interactive session             |

## CLI Options

| Option                           | Alias | Type    | Default   | Description                                                                                                                                                            |
| -------------------------------- | ----- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--debug`                        | `-d`  | boolean | `false`   | Run in debug mode with verbose logging                                                                                                                                 |
| `--version`                      | `-v`  | -       | -         | Show CLI version number and exit                                                                                                                                       |
| `--help`                         | `-h`  | -       | -         | Show help information                                                                                                                                                  |
| `--model`                        | `-m`  | string  | `auto`    | Model to use. See [Model Selection](#model-selection) for available values.                                                                                            |
| `--prompt`                       | `-p`  | string  | -         | Prompt text. Appended to stdin input if provided. Forces non-interactive mode.                                                                                         |
| `--prompt-interactive`           | `-i`  | string  | -         | Execute prompt and continue in interactive mode                                                                                                                        |
| `--worktree`                     | `-w`  | string  | -         | Start Jiminy in a new git worktree. If no name is provided, one is generated automatically. Requires `experimental.worktrees: true` in settings.                       |
| `--sandbox`                      | `-s`  | boolean | `false`   | Run in a sandboxed environment for safer execution                                                                                                                     |
| `--approval-mode`                | -     | string  | `default` | Approval mode for tool execution. Choices: `default`, `auto_edit`, `yolo`                                                                                              |
| `--yolo`                         | `-y`  | boolean | `false`   | **Deprecated.** Auto-approve all actions. Use `--approval-mode=yolo` instead.                                                                                          |
| `--experimental-acp`             | -     | boolean | -         | Start in ACP (Agent Code Pilot) mode. **Experimental feature.**                                                                                                        |
| `--experimental-zed-integration` | -     | boolean | -         | Run in Zed editor integration mode. **Experimental feature.**                                                                                                          |
| `--allowed-mcp-server-names`     | -     | array   | -         | Allowed MCP server names (comma-separated or multiple flags)                                                                                                           |
| `--allowed-tools`                | -     | array   | -         | **Deprecated.** Use the [Policy Engine](../reference/policy-engine.md) instead. Tools that are allowed to run without confirmation (comma-separated or multiple flags) |
| `--extensions`                   | `-e`  | array   | -         | List of extensions to use. If not provided, all extensions are enabled (comma-separated or multiple flags)                                                             |
| `--list-extensions`              | `-l`  | boolean | -         | List all available extensions and exit                                                                                                                                 |
| `--resume`                       | `-r`  | string  | -         | Resume a previous session. Use `"latest"` for most recent or index number (e.g. `--resume 5`)                                                                          |
| `--list-sessions`                | -     | boolean | -         | List available sessions for the current project and exit                                                                                                               |
| `--delete-session`               | -     | string  | -         | Delete a session by index number (use `--list-sessions` to see available sessions)                                                                                     |
| `--include-directories`          | -     | array   | -         | Additional directories to include in the workspace (comma-separated or multiple flags)                                                                                 |
| `--screen-reader`                | -     | boolean | -         | Enable screen reader mode for accessibility                                                                                                                            |
| `--output-format`                | `-o`  | string  | `text`    | The format of the CLI output. Choices: `text`, `json`, `stream-json`                                                                                                   |

## Model selection

The `--model` (or `-m`) flag lets you specify which Jiminy model to use. You can
use either model aliases (user-friendly names) or concrete model names.

### Model aliases

These are convenient shortcuts that map to specific models:

| Alias        | Resolves To                                | Description                                                                                                               |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `auto`       | `jiminy-2.5-pro` or `jiminy-3-pro-preview` | **Default.** Resolves to the preview model if preview features are enabled, otherwise resolves to the standard pro model. |
| `pro`        | `jiminy-2.5-pro` or `jiminy-3-pro-preview` | For complex reasoning tasks. Uses preview model if enabled.                                                               |
| `flash`      | `jiminy-2.5-flash`                         | Fast, balanced model for most tasks.                                                                                      |
| `flash-lite` | `jiminy-2.5-flash-lite`                    | Fastest model for simple tasks.                                                                                           |

## Extensions management

| Command                                            | Description                                  | Example                                                                        |
| -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `jiminy extensions install <source>`               | Install extension from Git URL or local path | `jiminy extensions install https://github.com/user/my-extension`               |
| `jiminy extensions install <source> --ref <ref>`   | Install from specific branch/tag/commit      | `jiminy extensions install https://github.com/user/my-extension --ref develop` |
| `jiminy extensions install <source> --auto-update` | Install with auto-update enabled             | `jiminy extensions install https://github.com/user/my-extension --auto-update` |
| `jiminy extensions uninstall <name>`               | Uninstall one or more extensions             | `jiminy extensions uninstall my-extension`                                     |
| `jiminy extensions list`                           | List all installed extensions                | `jiminy extensions list`                                                       |
| `jiminy extensions update <name>`                  | Update a specific extension                  | `jiminy extensions update my-extension`                                        |
| `jiminy extensions update --all`                   | Update all extensions                        | `jiminy extensions update --all`                                               |
| `jiminy extensions enable <name>`                  | Enable an extension                          | `jiminy extensions enable my-extension`                                        |
| `jiminy extensions disable <name>`                 | Disable an extension                         | `jiminy extensions disable my-extension`                                       |
| `jiminy extensions link <path>`                    | Link local extension for development         | `jiminy extensions link /path/to/extension`                                    |
| `jiminy extensions new <path>`                     | Create new extension from template           | `jiminy extensions new ./my-extension`                                         |
| `jiminy extensions validate <path>`                | Validate extension structure                 | `jiminy extensions validate ./my-extension`                                    |

See [Extensions Documentation](../extensions/index.md) for more details.

## MCP server management

| Command                                                       | Description                     | Example                                                                                              |
| ------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `jiminy mcp add <name> <command>`                             | Add stdio-based MCP server      | `jiminy mcp add github npx -y @modelcontextprotocol/server-github`                                   |
| `jiminy mcp add <name> <url> --transport http`                | Add HTTP-based MCP server       | `jiminy mcp add api-server http://localhost:3000 --transport http`                                   |
| `jiminy mcp add <name> <command> --env KEY=value`             | Add with environment variables  | `jiminy mcp add slack node server.js --env SLACK_TOKEN=xoxb-xxx`                                     |
| `jiminy mcp add <name> <command> --scope user`                | Add with user scope             | `jiminy mcp add db node db-server.js --scope user`                                                   |
| `jiminy mcp add <name> <command> --include-tools tool1,tool2` | Add with specific tools         | `jiminy mcp add github npx -y @modelcontextprotocol/server-github --include-tools list_repos,get_pr` |
| `jiminy mcp remove <name>`                                    | Remove an MCP server            | `jiminy mcp remove github`                                                                           |
| `jiminy mcp list`                                             | List all configured MCP servers | `jiminy mcp list`                                                                                    |

See [MCP Server Integration](../tools/mcp-server.md) for more details.

## Skills management

| Command                          | Description                           | Example                                           |
| -------------------------------- | ------------------------------------- | ------------------------------------------------- |
| `jiminy skills list`             | List all discovered agent skills      | `jiminy skills list`                              |
| `jiminy skills install <source>` | Install skill from Git, path, or file | `jiminy skills install https://github.com/u/repo` |
| `jiminy skills link <path>`      | Link local agent skills via symlink   | `jiminy skills link /path/to/my-skills`           |
| `jiminy skills uninstall <name>` | Uninstall an agent skill              | `jiminy skills uninstall my-skill`                |
| `jiminy skills enable <name>`    | Enable an agent skill                 | `jiminy skills enable my-skill`                   |
| `jiminy skills disable <name>`   | Disable an agent skill                | `jiminy skills disable my-skill`                  |
| `jiminy skills enable --all`     | Enable all skills                     | `jiminy skills enable --all`                      |
| `jiminy skills disable --all`    | Disable all skills                    | `jiminy skills disable --all`                     |

See [Agent Skills Documentation](./skills.md) for more details.
