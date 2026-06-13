# NoCompactImpact

A Claude Code plugin that keeps long-running tasks alive across context compaction.

When the context window fills, Claude Code compacts the conversation, and long tasks
often stall at that point. This repository distributes the `context-relay` plugin, which
captures a handoff of the in-progress work just before compaction and re-injects it
immediately afterward, so the model resumes the task instead of stopping.

## Features

- Automatic handoff around every compaction — auto-compact, `/compact`, and `/clear`.
- Timestamped transcript archive written before each compaction.
- Eager 95% monitor that preserves work as the context approaches the limit.
- Cross-platform: implemented in Node (Claude Code's own runtime), with no `jq`,
  PowerShell, bash, or other external dependencies. Identical on Windows, macOS, and Linux.
- Fails safe: hooks never block compaction and never corrupt session start.

## Requirements

- Claude Code with the `/plugin` command.
- `node` on `PATH` (present in any npm-based Claude Code install).
- Auto-compact enabled (see [Installation](#installation)).

## Installation

```shell
/plugin marketplace add OskarAndreasBerg-Procano/NoCompactImpact
/plugin install context-relay@nocompactimpact
```

Then complete two one-time steps:

1. Enable auto-compact: `/config` → toggle **Auto-compact**, or set
   `"autoCompactEnabled": true` in `~/.claude/settings.json`. Plugins cannot set this
   user-level option, and the automatic loop depends on it.
2. Restart Claude Code so the hooks load.

The plugin is then active for every project on the machine. Disable or uninstall it at
any time via `/plugin`.

## Configuration

All settings are optional and read from environment variables. Set them under `env` in
`~/.claude/settings.json` to make them permanent.

| Variable | Default | Description |
| --- | --- | --- |
| `RELAY_COMPACT_THRESHOLD` | `0.95` | Context-fill fraction that triggers the eager pre-compaction handoff. |
| `RELAY_THROTTLE_SECONDS` | `120` | Minimum seconds between eager handoffs. |
| `RELAY_MARKER_MAX_AGE_MIN` | `20` | Maximum age of a pre-compaction handoff eligible for re-injection. |
| `RELAY_MONITOR_MAX_AGE_MIN` | `5` | Shorter re-injection window for monitor-written handoffs. |
| `CLAUDE_CONTEXT_WINDOW` | `200000` | Token count treated as 100% when computing fill. |

## How it works

| Stage | Mechanism |
| --- | --- |
| Before compaction | A `PreCompact` hook archives the transcript and writes a handoff. |
| Near the limit | A `PostToolUse` monitor runs the handoff early once fill crosses the threshold. |
| After compaction | A `SessionStart` hook re-injects the handoff so the task continues. |

Working files are written per project to `~/.claude/context-relay/<project>/` (transcript
archives, the latest handoff, and `relay.log`). To confirm the plugin is active, tail
`relay.log` after a compaction; it records each `handoff saved` and
`post-compaction context injected` event.

## Repository layout

```
.
├── .claude-plugin/
│   └── marketplace.json            # marketplace catalog
└── plugins/
    └── context-relay/
        ├── .claude-plugin/
        │   └── plugin.json         # plugin manifest
        ├── hooks/
        │   └── hooks.json          # hook registration
        ├── scripts/                # Node implementation
        │   ├── relay-lib.mjs
        │   ├── pre-compact.mjs
        │   ├── session-start.mjs
        │   └── context-monitor.mjs
        └── README.md               # plugin reference
```

## Development

Load and validate the plugin locally, without publishing:

```shell
claude --plugin-dir ./plugins/context-relay
claude plugin validate ./plugins/context-relay
```

## Releasing updates

Bump `version` in `plugins/context-relay/.claude-plugin/plugin.json`, commit, and push.
Users update with `/plugin marketplace update`, then reinstall.
