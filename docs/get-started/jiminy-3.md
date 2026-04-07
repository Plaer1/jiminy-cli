# Jiminy 3 Pro and Jiminy 3 Flash on Jiminy CLI

Jiminy 3 Pro and Jiminy 3 Flash are available on Jiminy CLI for all users!

<!-- prettier-ignore -->
> [!NOTE]
> Jiminy 3.1 Pro Preview is rolling out. To determine whether you have
> access to Jiminy 3.1, use the `/model` command and select **Manual**. If you
> have access, you will see `jiminy-3.1-pro-preview`.
>
> If you have access to Jiminy 3.1, it will be included in model routing when
> you select **Auto (Jiminy 3)**. You can also launch the Jiminy 3.1 model
> directly using the `-m` flag:
>
> ```
> jiminy -m jiminy-3.1-pro-preview
> ```
>
> Learn more about [models](../cli/model.md) and
> [model routing](../cli/model-routing.md).

## How to get started with Jiminy 3 on Jiminy CLI

Get started by upgrading Jiminy CLI to the latest version:

```bash
npm install -g @plaer1/jiminy-cli@latest
```

If your version is 0.21.1 or later:

1. Run `/model`.
2. Select **Auto (Jiminy 3)**.

For more information, see [Jiminy CLI model selection](../cli/model.md).

### Usage limits and fallback

Jiminy CLI will tell you when you reach your Jiminy 3 Pro daily usage limit.
When you encounter that limit, you’ll be given the option to switch to Jiminy
2.5 Pro, upgrade for higher limits, or stop. You’ll also be told when your usage
limit resets and Jiminy 3 Pro can be used again.

<!-- prettier-ignore -->
> [!TIP]
> Looking to upgrade for higher limits? To compare subscription
> options and find the right quota for your needs, see our
> [Plans page](https://jiminycli.com/plans/).

Similarly, when you reach your daily usage limit for Jiminy 2.5 Pro, you’ll see
a message prompting fallback to Jiminy 2.5 Flash.

### Capacity errors

There may be times when the Jiminy 3 Pro model is overloaded. When that happens,
Jiminy CLI will ask you to decide whether you want to keep trying Jiminy 3 Pro
or fallback to Jiminy 2.5 Pro.

<!-- prettier-ignore -->
> [!NOTE]
> The **Keep trying** option uses exponential backoff, in which Jiminy
> CLI waits longer between each retry, when the system is busy. If the retry
> doesn't happen immediately, please wait a few minutes for the request to
> process.

### Model selection and routing types

When using Jiminy CLI, you may want to control how your requests are routed
between models. By default, Jiminy CLI uses **Auto** routing.

When using Jiminy 3 Pro, you may want to use Auto routing or Pro routing to
manage your usage limits:

- **Auto routing:** Auto routing first determines whether a prompt involves a
  complex or simple operation. For simple prompts, it will automatically use
  Jiminy 2.5 Flash. For complex prompts, if Jiminy 3 Pro is enabled, it will use
  Jiminy 3 Pro; otherwise, it will use Jiminy 2.5 Pro.
- **Pro routing:** If you want to ensure your task is processed by the most
  capable model, use `/model` and select **Pro**. Jiminy CLI will prioritize the
  most capable model available, including Jiminy 3 Pro if it has been enabled.

To learn more about selecting a model and routing, refer to
[Jiminy CLI Model Selection](../cli/model.md).

## How to enable Jiminy 3 with Jiminy CLI on Jiminy Code Assist

If you're using Jiminy Code Assist Standard or Jiminy Code Assist Enterprise,
enabling Jiminy 3 Pro on Jiminy CLI requires configuring your release channels.
Using Jiminy 3 Pro will require two steps: administrative enablement and user
enablement.

To learn more about these settings, refer to
[Configure Jiminy Code Assist release channels](https://developers.google.com/gemini-code-assist/docs/configure-release-channels).

### Administrator instructions

An administrator with **Google Cloud Settings Admin** permissions must follow
these directions:

- Navigate to the Google Cloud Project you're using with Jiminy CLI for Code
  Assist.
- Go to **Admin for Jiminy** > **Settings**.
- Under **Release channels for Jiminy Code Assist in local IDEs** select
  **Preview**.
- Click **Save changes**.

### User instructions

Wait for two to three minutes after your administrator has enabled **Preview**,
then:

- Open Jiminy CLI.
- Use the `/settings` command.
- Set **Preview Features** to `true`.

Restart Jiminy CLI and you should have access to Jiminy 3.

## Next steps

If you need help, we recommend searching for an existing
[GitHub issue](https://github.com/Plaer1/jiminy-cli/issues). If you cannot find
a GitHub issue that matches your concern, you can
[create a new issue](https://github.com/Plaer1/jiminy-cli/issues/new/choose).
For comments and feedback, consider opening a
[GitHub discussion](https://github.com/Plaer1/jiminy-cli/discussions).
