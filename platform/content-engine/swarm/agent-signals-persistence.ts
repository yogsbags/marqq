import { supabaseAdmin } from "../supabase.js";

function resolveSignalClient(client) {
  return client || supabaseAdmin || null;
}

export async function emitSignal(signal, options = {}) {
  const payload = {
    company_id: signal.company_id,
    signal_type: signal.signal_type,
    payload: signal.payload || {},
    created_by_agent: signal.created_by_agent || "priya",
    dedupe_key:
      signal.dedupe_key ||
      `${signal.company_id}:${signal.signal_type}:${signal.payload?.competitor_name || "unknown"}:${signal.payload?.source_run_id || "none"}`,
  };

  const writer = options.writer || (async (entry) => entry);
  const client = resolveSignalClient(options.supabase);

  if (!client) {
    return writer(payload);
  }

  const { data, error } = await client
    .from("agent_signals")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`[agent-signals-persistence] failed to emit signal: ${error.message}`);
  }

  return data || payload;
}

export async function emitSignals(signals, options = {}) {
  return Promise.all(signals.map((signal) => emitSignal(signal, options)));
}
