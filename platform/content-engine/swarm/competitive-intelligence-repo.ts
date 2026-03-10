import { supabaseAdmin } from "../supabase.js";

function resolveRepoClient(client) {
  return client || supabaseAdmin || null;
}

export async function upsertCompetitiveIntelligence(entry, options = {}) {
  const record = {
    company_id: entry.company_id,
    competitor_name: entry.competitor_name,
    week_of: entry.week_of,
    summary: entry.summary,
    themes: entry.themes || [],
    actions: entry.actions || [],
    confidence: entry.confidence ?? 0,
    haiku_count: entry.haiku_count ?? 0,
    filtered_count: entry.filtered_count ?? 0,
    sonnet_tokens: entry.sonnet_tokens ?? 0,
    source_run_id: entry.source_run_id,
    source_agent: entry.source_agent || "priya",
    updated_at: entry.updated_at || new Date().toISOString(),
  };

  const writer = options.writer || (async (payload) => payload);
  const client = resolveRepoClient(options.supabase);

  if (!client) {
    return writer(record);
  }

  const { data, error } = await client
    .from("competitive_intelligence")
    .upsert(record, {
      onConflict: "company_id,competitor_name,week_of",
    })
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`[competitive-intelligence-repo] failed to upsert: ${error.message}`);
  }

  return data || record;
}

export async function readLatestCompetitiveIntelligence({
  companyId,
  competitorName,
}, options = {}) {
  const reader = options.reader || (async () => null);
  const client = resolveRepoClient(options.supabase);

  if (!client) {
    return reader({ companyId, competitorName });
  }

  const { data, error } = await client
    .from("competitive_intelligence")
    .select("*")
    .eq("company_id", companyId)
    .eq("competitor_name", competitorName)
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[competitive-intelligence-repo] failed to read latest row: ${error.message}`);
  }

  return data || null;
}
