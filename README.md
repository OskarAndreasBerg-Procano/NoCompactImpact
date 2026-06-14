# NoCompactImpact

A Claude Code plugin that keeps long-running tasks alive across context compaction.

When the context window fills, Claude Code compacts the conversation, and long tasks
often stall at that point. This plugin captures a handoff of the in-progress work just
before compaction and re-injects it immediately afterward, so the model resumes the task
instead of stopping.

For configuration, internals, and development, see [INFO.md](INFO.md).

## Getting started

> The `/...` commands below are typed **inside Claude Code** (at its chat prompt) — not in
> your regular terminal, and not on GitHub. **Start Claude Code first:** run `claude` in a
> terminal, or open the Claude Code panel in your IDE (VS Code / JetBrains). That prompt is
> where these commands go.

### Prerequisites

- Claude Code, up to date — the `/plugin` command must be available. Update Claude Code
  if it is not.
- `node` on `PATH` — included with any npm-based Claude Code install. Check with
  `node --version`.
- No GitHub account or access grant is required; this repository is public.

### 1. Add the marketplace and install the plugin

At the Claude Code prompt, run these two commands:

```
/plugin marketplace add OskarAndreasBerg-Procano/NoCompactImpact
/plugin install context-relay@nocompactimpact
```

(The format is `plugin@marketplace`: the plugin is `context-relay`, the marketplace is
`nocompactimpact`.)

Prefer menus? Type `/plugin` on its own to open the plugin manager, then follow the
prompts to add the marketplace and install `context-relay`.

### 2. Enable auto-compact

The plugin cannot set this for you, and the automatic loop depends on it. Either:

- run `/config` and toggle **Auto-compact** on, or
- add `"autoCompactEnabled": true` to `~/.claude/settings.json`.

(Many setups already have auto-compact on by default — in that case this is just a quick
check, nothing to change.)

### 3. Restart Claude Code

Hooks load at session start.

## Usage

There is nothing to run. The plugin works in the background: when the context fills and
compacts, your in-progress task is preserved beforehand and resumed afterward.

## Verifying it works

- Run `/plugin` and confirm **context-relay** is listed and enabled.
- After a session that compacts, check the log:
  - macOS / Linux: `tail ~/.claude/context-relay/*/relay.log`
  - Windows (PowerShell): `Get-Content "$env:USERPROFILE\.claude\context-relay\*\relay.log" -Tail 10`
  - Expect `handoff saved` followed by `post-compaction context injected`.

## Managing the plugin

- Disable, re-enable, or uninstall: `/plugin`.
- Update to a newer version: `/plugin marketplace update`, then reinstall.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `/plugin` not recognized | Update Claude Code. |
| Install error mentioning `node` | Ensure `node` is on `PATH`. |
| Nothing appears in `relay.log` | Confirm auto-compact is enabled (step 2) and that you restarted Claude Code. |
