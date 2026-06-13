// SessionStart hook (Node) -- the "post-compacting prompt".
// After a compact/clear, re-injects the handoff as additionalContext so
// the model continues. Prints exactly one JSON object to stdout (or
// nothing). Always exits 0.
import { readHookInput, projectRelayDir, relayLog } from './relay-lib.mjs';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const emitNothing = () => process.exit(0);

try {
  const d = (await readHookInput()) || {};
  const cwd = d.cwd || process.cwd();
  const sid = d.session_id || '';
  const source = d.source || 'unknown';

  const dir = projectRelayDir(cwd);
  const marker = join(dir, 'pending-resume.json');
  const handoff = join(dir, 'handoff-latest.md');
  if (!existsSync(marker) || !existsSync(handoff)) emitNothing();

  let m = null;
  try { m = JSON.parse(readFileSync(marker, 'utf8')); } catch { m = null; }
  if (!m) { relayLog(cwd, 'pending-resume.json unreadable/invalid JSON; discarding'); emitNothing(); }
  if (!m.cwd || !Number.isFinite(m.written_epoch)) {
    relayLog(cwd, 'pending-resume.json missing required fields; discarding');
    emitNothing();
  }

  // age windows (minutes): monitor markers get a shorter, session-agnostic window
  let maxAge = parseInt(process.env.RELAY_MARKER_MAX_AGE_MIN || '', 10);
  if (!Number.isFinite(maxAge) || maxAge <= 0) maxAge = 20;
  let monAge = parseInt(process.env.RELAY_MONITOR_MAX_AGE_MIN || '', 10);
  if (!Number.isFinite(monAge) || monAge <= 0) monAge = 5;

  const monitorWritten = String(m.trigger || '').startsWith('monitor:');
  const effSec = (monitorWritten ? monAge : maxAge) * 60;
  const ageSec = Math.floor(Date.now() / 1000) - m.written_epoch;

  // same project? unify separators + trailing slash, compare case-insensitively
  const norm = (s) => String(s || '').replace(/[\\/]+$/, '').replace(/\\/g, '/').toLowerCase();
  const sameProject = norm(cwd) === norm(m.cwd);

  let fresh = false;
  if (!monitorWritten && sid && m.session_id && sid === m.session_id) fresh = true;
  else if (ageSec <= effSec && sameProject) fresh = true;
  if (!fresh) emitNothing();

  let body = '';
  try { body = readFileSync(handoff, 'utf8'); } catch { body = ''; }
  if (!body.trim()) emitNothing();

  const context = `[context-relay] AUTOMATIC POST-COMPACTION RESUME (after a ${source}).
The context window was just compacted/cleared, but the previous task is NOT finished.
You MUST continue that task autonomously, right now. Do NOT ask the user whether to
proceed, and do NOT wait for a new prompt -- pick up exactly where the handoff below
leaves off. Re-read any files it lists before editing them.

${body}`;

  const out = JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  });

  // emit FIRST, consume marker AFTER (a lost resume is worse than a re-inject)
  process.stdout.write(out + '\n');
  try { unlinkSync(marker); } catch { /* ignore */ }
  relayLog(cwd, `post-compaction context injected (source=${source}, monitorWritten=${monitorWritten})`);
  process.exit(0);
} catch {
  process.exit(0);
}
