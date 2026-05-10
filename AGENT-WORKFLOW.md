# Jiminy as Sub-Agent — Workflow Guide

## Core Rule: Micro-Tasks Only

Jiminy quiet mode (`--quiet-yolo-no-conseca`) provides **zero feedback until task completion**. There is no streaming, no partial output, no progress indicator. You send a prompt, you wait, you get a result.

This means tasks MUST be:
- **Single-file**: one prompt → one output file
- **Self-contained**: all context in the prompt or via `@` references
- **Bounded**: clear start and end, no multi-step reasoning chains

## What NOT to do

- "Create 4 files" → instead, spawn 4 jiminies, one per file
- "Read specs then implement X and Y" → split into "read specs, write X" and "read specs, write Y"
- Long prompts with `@` file references chaining into tasks → the `@` syntax works but keep it to one or two files max
- Asking for feedback or iteration → there's no conversation loop

## Launch Pattern

```bash
# Create tmux windows
tmux new-window -t <session> -n "jiminy-taskname"

# Launch
tmux send-keys -t <session>:jiminy-taskname \
  "cd /project && jiminy --quiet-yolo-no-conseca" Enter

# Answer sudo prompt (option 3 = no sudo)
sleep 6
tmux send-keys -t <session>:jiminy-taskname "3" Enter

# Wait for ready prompt
sleep 5
tmux capture-pane -t <session>:jiminy-taskname -p | tail -3
# Should show: ✦ <startup-phrase>  \n>

# Send task
tmux send-keys -t <session>:jiminy-taskname "YOUR PROMPT HERE" Enter

# Wait and check output
sleep 60
tmux capture-pane -t <session>:jiminy-taskname -p | tail -20

# Check if files were created
ls -la /project/expected-output-file

# Clean up window when done
tmux kill-window -t <session>:jiminy-taskname
```

## Tips

- **Startup delay**: ~6-8 seconds from launch to ready prompt. Don't send tasks before `✦ ... \n>` appears.
- **Sudo prompt**: Always needs answering. Option 3 (no sudo) is safest.
- **File references**: `@/path/to/file` works in prompts but keep to 1-2 files. Large files may time out.
- **Quiet mode output**: Tool calls happen silently. Check the filesystem for results, not the terminal.
- **Save logs**: Always capture-pane before killing a window: `tmux capture-pane -t <target> -p > logs/<name>.log`

## Parallel Scaling

The ceiling is how many tmux windows you want to manage. Practical limit is ~6-8 concurrent jiminies before coordination overhead eats the gains. Each one needs:
- Its own tmux window
- A micro-task
- A post-completion file check

## Example: 4 Parallel Workers

```bash
for name in schema fswatch logtap gitwatch; do
  tmux new-window -t memery -n "j-$name"
  tmux send-keys -t memery:j-$name "cd /project && jiminy --quiet-yolo-no-conseca" Enter
done
sleep 8
for name in schema fswatch logtap gitwatch; do
  tmux send-keys -t memery:j-$name "3" Enter
done
sleep 6
# Now send one task per window...
```
