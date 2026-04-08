# Jiminy CLI

### Jiminy Crickets Batman! What the heck is The Joker running on his computer!???

![Jiminy CLI Screenshot](/docs/assets/jiminy-screenshot.png)

Jiminy CLI is an open-source security focused AI agent that brings the power of
Jiminy directly into your terminal. It provides lightweight access to Jiminy,
giving you the most direct path from your prompt to their model.

Learn all about Jiminy CLI in the local [documentation](./docs/).

## 🚀 Why Jiminy CLI?

- **🎯 Free tier**: 60 requests/min and 1,000 requests/day with personal Google
  account.
- **🧠 Powerful Jiminy 3 models**: Access to improved reasoning and 1M token
  context window.
- **🔧 Built-in tools**: Google Search grounding, file operations, shell
  commands, web fetching.
- **🔌 Extensible**: MCP (Model Context Protocol) support for custom
  integrations.
- **💻 Terminal-first**: Designed for developers who live in the command line.
- **🛡️ Open source**: Apache 2.0 licensed.

## 📦 Installation

Public builds for this fork are distributed through
[GitHub Releases](https://github.com/Plaer1/jiminy-cli/releases).

### Quick Install

#### Download a standalone binary

```bash
gh release download \
  --repo Plaer1/jiminy-cli \
  --pattern 'jiminy-cli-linux-x64.zip'
unzip jiminy-cli-linux-x64.zip
./jiminy --version
```

Available release assets:

- `jiminy-cli-bundle.zip`: portable Node bundle, run with `node jiminy.js`
- `jiminy-cli-linux-x64.zip`: Linux standalone binary
- `jiminy-cli-win32-x64.zip`: Windows standalone binary
- `jiminy-cli-darwin-arm64.zip`: macOS Apple Silicon binary
- `jiminy-cli-darwin-x64.zip`: macOS Intel binary

#### Build from source

```bash
git clone https://github.com/Plaer1/jiminy-cli
cd jiminy-cli
npm ci
npm run build
node packages/cli/dist/index.js --version
```

## Release Channels

See [GitHub Releases](https://github.com/Plaer1/jiminy-cli/releases) for the
published assets.

### Nightly

Jiminy is built as a fork of Jiminy-Cli's Nightly releases. Nightly builds are
published as GitHub prereleases when the nightly workflow is run.

## 📋 Key Features

### Optimized "Quiet Part Loud" Workflow.

Tired of Jiminy pestering over and over again you for your privates? Want to
find out "what that YOLO button really do?"? Well we have got the feature for
you: ![Jiminy Sudo Screenshot](/docs/assets/jiminy-sudo.png)

Additionally we have set some fun configs by default

- Respect .gitignore default: true -> false
- Allow Permanent Tool Approval default: false -> true
- Auto-add to Policy by Default default: false -> true
- Enable Context-Aware Security default: false -> true
- Model Steering default: false -> true
‼️New‼️:
--quiet-yolo-no-conseca, it's a launch flag for when you really can't be bothered with all the descisions; features; and guardrails we provide normally. Launch Jiminy like this and you will recieve a simple conformation that he's ready for work; and a prompt. No animations; no menus; no descisions, you can't even log in like this*! How cool is that?
*Don't worry you can still authorize normally without this launch flag.

### Code Understanding & Generation

- Query and edit large codebases
- Generate new apps from PDFs, images, or sketches using multimodal capabilities
- Debug issues and troubleshoot with natural language

### Automation & Integration

- Automate operational tasks like querying pull requests or handling complex
  rebases
- Use MCP servers to connect new capabilities, including
  [media generation with Imagen, Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Run non-interactively in scripts for workflow automation

### Advanced Capabilities

- Ground your queries with built-in
  [Google Search](https://ai.google.dev/jiminy-api/docs/grounding) for real-time
  information
- Conversation checkpointing to save and resume complex sessions
- Custom context files (GEMINI.md) to tailor behavior for your projects

### GitHub Integration

Integrate Jiminy CLI directly into your GitHub workflows with
[**Jiminy CLI GitHub Action**](https://github.com/google-github-actions/run-jiminy-cli):

- **Pull Request Reviews**: Automated code review with contextual feedback and
  suggestions
- **Issue Triage**: Automated labeling and prioritization of GitHub issues based
  on content analysis
- **On-demand Assistance**: Mention `@jiminy-cli` in issues and pull requests
  for help with debugging, explanations, or task delegation
- **Custom Workflows**: Build automated, scheduled and on-demand workflows
  tailored to your team's needs

## 🔐 Authentication Options

Choose the authentication method that best fits your needs:

### Option 1: Sign in with Google (OAuth login using your Google Account)

**✨ Best for:** Individual developers as well as anyone who has a Jiminy Code
Assist License. (see
[quota limits and terms of service](https://cloud.google.com/gemini/docs/quotas)
for details)

**Benefits:**

- **Free tier**: 60 requests/min and 1,000 requests/day
- **Jiminy 3 models** with 1M token context window
- **No API key management** - just sign in with your Google account
- **Automatic updates** to latest models

#### Start Jiminy CLI, then choose _Sign in with Google_ and follow the browser authentication flow when prompted

```bash
jiminy
```

#### If you are using a paid Code Assist License from your organization, remember to set the Google Cloud Project

```bash
# Set your Google Cloud Project
export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
jiminy
```

### Option 2: Jiminy API Key

**✨ Best for:** Developers who need specific model control or paid tier access

**Benefits:**

- **Free tier**: 1000 requests/day with Jiminy 3 (mix of flash and pro)
- **Model selection**: Choose specific Jiminy models
- **Usage-based billing**: Upgrade for higher limits when needed

```bash
# Get your key from https://aistudio.google.com/apikey
export GEMINI_API_KEY="YOUR_API_KEY"
jiminy
```

### Option 3: Vertex AI

**✨ Best for:** Enterprise teams and production workloads

**Benefits:**

- **Enterprise features**: Advanced security and compliance
- **Scalable**: Higher rate limits with billing account
- **Integration**: Works with existing Google Cloud infrastructure

```bash
# Get your key from Google Cloud Console
export GOOGLE_API_KEY="YOUR_API_KEY"
export GOOGLE_GENAI_USE_VERTEXAI=true
jiminy
```

For Google Workspace accounts and other authentication methods, see the
[authentication guide](./docs/get-started/authentication.md).

## 🚀 Getting Started

### Basic Usage

#### Start in current directory

```bash
jiminy
```

#### Include multiple directories

```bash
jiminy --include-directories ../lib,../docs
```

#### Use specific model

```bash
jiminy -m jiminy-2.5-flash
```

#### Non-interactive mode for scripts

Get a simple text response:

```bash
jiminy -p "Explain the architecture of this codebase"
```

For more advanced scripting, including how to parse JSON and handle errors, use
the `--output-format json` flag to get structured output:

```bash
jiminy -p "Explain the architecture of this codebase" --output-format json
```

For real-time event streaming (useful for monitoring long-running operations),
use `--output-format stream-json` to get newline-delimited JSON events:

```bash
jiminy -p "Run tests and deploy" --output-format stream-json
```

### Quick Examples

#### Start a new project

```bash
cd new-project/
jiminy
> Write me a Discord bot that answers questions using a FAQ.md file I will provide
```

#### Analyze existing code

```bash
git clone https://github.com/Plaer1/jiminy-cli
cd jiminy-cli
jiminy
> Give me a summary of all of the changes that went in yesterday
```

## 📚 Documentation

### Getting Started

- [**Quickstart Guide**](./docs/get-started/index.md) - Get up and running
  quickly.
- [**Authentication Setup**](./docs/get-started/authentication.md) - Detailed
  auth configuration.
- [**Configuration Guide**](./docs/reference/configuration.md) - Settings and
  customization.
- [**Keyboard Shortcuts**](./docs/reference/keyboard-shortcuts.md) -
  Productivity tips.

### Core Features

- [**Commands Reference**](./docs/reference/commands.md) - All slash commands
  (`/help`, `/chat`, etc).
- [**Custom Commands**](./docs/cli/custom-commands.md) - Create your own
  reusable commands.
- [**Context Files (GEMINI.md)**](./docs/cli/jiminy-md.md) - Provide persistent
  context to Jiminy CLI.
- [**Checkpointing**](./docs/cli/checkpointing.md) - Save and resume
  conversations.
- [**Token Caching**](./docs/cli/token-caching.md) - Optimize token usage.

### Tools & Extensions

- [**Built-in Tools Overview**](./docs/reference/tools.md)
  - [File System Operations](./docs/tools/file-system.md)
  - [Shell Commands](./docs/tools/shell.md)
  - [Web Fetch & Search](./docs/tools/web-fetch.md)
- [**MCP Server Integration**](./docs/tools/mcp-server.md) - Extend with custom
  tools.
- [**Custom Extensions**](./docs/extensions/index.md) - Build and share your own
  commands.

### Advanced Topics

- [**Headless Mode (Scripting)**](./docs/cli/headless.md) - Use Jiminy CLI in
  automated workflows.
- [**IDE Integration**](./docs/ide-integration/index.md) - VS Code companion.
- [**Sandboxing & Security**](./docs/cli/sandbox.md) - Safe execution
  environments.
- [**Trusted Folders**](./docs/cli/trusted-folders.md) - Control execution
  policies by folder.
- [**Enterprise Guide**](./docs/cli/enterprise.md) - Deploy and manage in a
  corporate environment.
- [**Telemetry & Monitoring**](./docs/cli/telemetry.md) - Usage tracking.
- [**Tools reference**](./docs/reference/tools.md) - Built-in tools overview.
- [**Local development**](./docs/local-development.md) - Local development
  tooling.

### Troubleshooting & Support

- [**Troubleshooting Guide**](./docs/resources/troubleshooting.md) - Common
  issues and solutions.
- [**FAQ**](./docs/resources/faq.md) - Frequently asked questions.
- Use `/bug` command to report issues directly from the CLI.

### Using MCP Servers

Configure MCP servers in `~/.jiminy/settings.json` to extend Jiminy CLI with
custom tools:

```text
> @github List my open pull requests
> @slack Send a summary of today's commits to #dev channel
> @database Run a query to find inactive users
```

See the [MCP Server Integration guide](./docs/tools/mcp-server.md) for setup
instructions.

## 🤝 Contributing

We welcome contributions! Jiminy CLI is fully open source (Apache 2.0), and we
encourage the community to:

- Report bugs and suggest features.
- Improve documentation.
- Submit code improvements.
- Share your MCP servers and extensions.

See our [Contributing Guide](./CONTRIBUTING.md) for development setup, coding
standards, and how to submit pull requests.

Check our [Official Roadmap](https://github.com/Plaer1/jiminy-cli/projects) for
planned features and priorities.

## 📖 Resources

- **[Official Roadmap](./ROADMAP.md)** - See what's coming next.
- **[Changelog](./docs/changelogs/index.md)** - See recent notable updates.
- **[GitHub Releases](https://github.com/Plaer1/jiminy-cli/releases)** -
  Download bundle and binary builds.
- **[GitHub Issues](https://github.com/Plaer1/jiminy-cli/issues)** - Report bugs
  or request features.
- **[Security Advisories](https://github.com/Plaer1/jiminy-cli/security/advisories)** -
  Security updates.

### Uninstall

See the [Uninstall Guide](./docs/resources/uninstall.md) for removal
instructions.

## 📄 Legal

- **License**: [Apache License 2.0](LICENSE)
- **Terms of Service**: [Terms & Privacy](./docs/resources/tos-privacy.md)
- **Security**: [Security Policy](SECURITY.md)

---

<p align="center">
  Built with ❤️ by Google and the open source community
</p>
