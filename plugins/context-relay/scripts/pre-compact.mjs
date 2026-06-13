// PreCompact hook (Node) -- the "pre-compacting job".
// Archives the transcript + writes a handoff/marker before compaction.
// Must never block compaction: always exits 0.
import { readHookInput, saveHandoff, relayLog } from './relay-lib.mjs';

try {
  const d = (await readHookInput()) || {};
  const cwd = d.cwd || process.cwd();
  saveHandoff({
    cwd,
    transcript: d.transcript_path || '',
    sid: d.session_id || '',
    trigger: `precompact:${d.trigger || 'manual'}`,
    archive: true,
  });
} catch (e) {
  try { relayLog(process.cwd(), `pre-compact error: ${e && e.message}`); } catch { /* ignore */ }
}
process.exit(0);
