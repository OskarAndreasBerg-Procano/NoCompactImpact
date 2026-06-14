# NoCompactImpact

A Claude Code plugin that keeps long-running tasks alive across context compaction.

When the context window fills, Claude Code compacts the conversation, and long tasks
often stall at that point. This plugin captures a handoff of the in-progress work just
before compaction and re-injects it immediately afterward, so the model resumes the task
instead of stopping.

## Install in Claude Code

Inside **Claude Code** — at its chat prompt, not your regular terminal — run these two
commands:

```
/plugin marketplace add https://github.com/OskarAndreasBerg-Procano/NoCompactImpact.git
/plugin install context-relay@nocompactimpact
```

Then:

1. Enable **Auto-compact** — run `/config` and toggle it on.
2. Run `/reload-plugins` to activate the hooks (no restart needed).

That's it — it runs automatically from your next compaction onward.

<br>

---

<br>

## Details and troubleshooting

For configuration, internals, and development, see [INFO.md](INFO.md).

### Prerequisites

- Claude Code, up to date — the `/plugin` command must be available. Update Claude Code
  if it is not.
- `node` on `PATH` — included with any npm-based Claude Code install. Check with
  `node --version`.
- No GitHub account or access grant is required; this repository is public.

### Notes on the install commands

- The `/...` commands are typed inside Claude Code (its chat prompt). Start Claude Code
  first: run `claude` in a terminal, or open the Claude Code panel in your IDE
  (VS Code / JetBrains).
- The HTTPS URL needs no GitHub login or SSH setup. The shorthand
  `OskarAndreasBerg-Procano/NoCompactImpact` also works if you have SSH configured for
  GitHub.
- Prefer menus? Type `/plugin` on its own to open the plugin manager and add the
  marketplace / install from there.
- Many setups already have auto-compact on by default; in that case enabling it is just a
  quick check, nothing to change.

### Usage

There is nothing to run. The plugin works in the background: when the context fills and
compacts, your in-progress task is preserved beforehand and resumed afterward.

### Verifying it works

- Run `/plugin` and confirm **context-relay** is listed and enabled.
- After a session that compacts, check the log:
  - macOS / Linux: `tail ~/.claude/context-relay/*/relay.log`
  - Windows (PowerShell): `Get-Content "$env:USERPROFILE\.claude\context-relay\*\relay.log" -Tail 10`
  - Expect `handoff saved` followed by `post-compaction context injected`.

### Managing the plugin

- Disable, re-enable, or uninstall: `/plugin`.
- Update to a newer version: `/plugin marketplace update`, then reinstall.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| `/plugin` not recognized | Update Claude Code. |
| `Host key verification failed` / SSH error when adding the marketplace | Use the HTTPS URL (`https://github.com/OskarAndreasBerg-Procano/NoCompactImpact.git`) instead of the `owner/repo` shorthand. |
| Install error mentioning `node` | Ensure `node` is on `PATH`. |
| Nothing appears in `relay.log` | Confirm auto-compact is enabled and that you ran `/reload-plugins` (or restarted). |
