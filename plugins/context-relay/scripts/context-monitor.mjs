// PostToolUse hook (Node) -- the "95% monitor".
// Cheaply checks context fill after each tool; eagerly runs the pre-job
// (throttled) once it crosses the threshold. Writes nothing to stdout.
// Always exits 0.
import {
  readHookInput, contextStats, projectRelayDir,
  secondsSinceLastHandoff, saveHandoff, relayLog,
} from './relay-lib.mjs';

try {
  const d = (await readHookInput()) || {};
  const cwd = d.cwd || process.cwd();
  const t = d.transcript_path || '';
  if (!t) process.exit(0);

  // threshold (accept 0.95 or 0,95); throttle seconds
  let thr = parseFloat(String(process.env.RELAY_COMPACT_THRESHOLD || '0.95').replace(',', '.'));
  if (!Number.isFinite(thr) || thr <= 0 || thr >= 1) thr = 0.95;
  let throttle = parseInt(process.env.RELAY_THROTTLE_SECONDS || '', 10);
  if (!Number.isFinite(throttle) || throttle < 0) throttle = 120;

  const stats = contextStats(t);
  if (!stats.ok) process.exit(0);
  if (stats.pct / 100 < thr) process.exit(0);

  const dir = projectRelayDir(cwd);
  if (secondsSinceLastHandoff(dir) < throttle) process.exit(0);

  saveHandoff({ cwd, transcript: t, sid: d.session_id || '', trigger: `monitor:${stats.pct}pct`, archive: true });
  relayLog(cwd, `threshold crossed (~${stats.pct}% >= ${Math.round(thr * 100)}%); eager handoff written`);
} catch (e) {
  try { relayLog(process.cwd(), `monitor error: ${e && e.message}`); } catch { /* ignore */ }
}
process.exit(0);
