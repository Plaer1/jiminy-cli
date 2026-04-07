# Phase 03: Interactive UI And Stateful Surfaces

## Mission
Populate `plans/99_surface_inventory.md` with every branded, user-visible string occurrence reachable from the interactive UI, dialogs, warnings, notifications, title surfaces, settings descriptions, and other stateful runtime flows.

## Read first
- `plans/00_rules.md`
- `plans/01_schema.md`
- `plans/99_surface_inventory.md`

## Sections you own
- `Slash commands and in-app views`
- `Dialogs and auth`
- `Warnings and notifications`
- `Settings-visible branded text`

## What to include
- App header text and terminal title text.
- Auth dialogs and restart prompts.
- IDE integration nudges, unsupported-environment messages, and manual-install prompts.
- Folder trust dialogs and restart warnings.
- Hooks, tools, about, docs, and other in-app branded views.
- Settings descriptions shown in the app when they include branded text.
- Tips, startup warnings, compatibility warnings, notifications, update notices, and model-picker descriptions.

## What to exclude
- Internal prompt text in `packages/core/src/prompts/**`.
- Agent-only instructional text.
- Comments and import strings.
- Docs URLs unless they are part of a user-visible message that you are already capturing.

## Primary source files to inspect
- `packages/cli/src/ui/components/AppHeader.tsx`
- `packages/cli/src/utils/windowTitle.ts`
- `packages/cli/src/ui/auth/AuthDialog.tsx`
- `packages/cli/src/ui/auth/LoginWithGoogleRestartDialog.tsx`
- `packages/cli/src/ui/components/LogoutConfirmationDialog.tsx`
- `packages/cli/src/ui/privacy/CloudFreePrivacyNotice.tsx`
- `packages/cli/src/ui/IdeIntegrationNudge.tsx`
- `packages/cli/src/ui/commands/ideCommand.ts`
- `packages/core/src/ide/ide-client.ts`
- `packages/core/src/ide/ide-connection-utils.ts`
- `packages/core/src/ide/constants.ts`
- `packages/core/src/ide/ide-installer.ts`
- `packages/cli/src/ui/components/FolderTrustDialog.tsx`
- `packages/cli/src/ui/components/PermissionsModifyTrustDialog.tsx`
- `packages/cli/src/ui/components/HooksDialog.tsx`
- `packages/cli/src/ui/components/views/ToolsList.tsx`
- `packages/cli/src/ui/components/AboutBox.tsx`
- `packages/cli/src/config/settingsSchema.ts`
- `packages/cli/src/ui/constants/tips.ts`
- `packages/cli/src/utils/userStartupWarnings.ts`
- `packages/core/src/utils/compatibility.ts`
- `packages/cli/src/utils/terminalNotifications.ts`
- `packages/cli/src/ui/hooks/useRunEventNotifications.ts`
- `packages/cli/src/ui/utils/terminalSetup.ts`
- `packages/cli/src/ui/utils/updateCheck.ts`
- `packages/cli/src/ui/components/ModelDialog.tsx`
- `packages/cli/src/utils/installationInfo.ts`
- `packages/core/src/utils/authConsent.ts`
- `packages/core/src/code_assist/oauth2.ts`

## Known state triggers to verify
- Launch `gemini` and observe the header.
- Launch `gemini` and reach auth selection or auth restart states.
- Launch `gemini`, then use `/about`, `/tools`, `/hooks`, `/settings`, and `/ide` where relevant.
- Trigger startup warnings by considering home-directory, root-directory, or compatibility flows.
- Trigger or inspect notification content and model-selection descriptions from their owning source files.

## Entry rules specific to this phase
- Treat title-bar text as its own surface family.
- Treat a dialog heading and a dialog body as separate entries if both contain branded text.
- For settings descriptions, record the exact user-visible description string, not the setting key.
- If a message is emitted from core but surfaced in the CLI UI, include it.
- If a message is only debug logging and is not surfaced to the user, exclude it.

## Done criteria
- Every branded occurrence in the owned runtime surfaces is represented.
- Each entry names the exact state required to see it.
- Internal prompts and non-user-facing constants were excluded.
