import { emitSignals } from "./agent-signals-persistence.ts";
import { upsertCompetitiveIntelligence } from "./competitive-intelligence-repo.ts";

function takeLimitedItems(items, limit, sourceType) {
  return (Array.isArray(items) ? items : []).slice(0, limit).map((item) => ({
    ...item,
    source_type: sourceType,
  }));
}

function defaultHaikuScore(item) {
  const text = `${item.title || ""} ${item.summary || ""} ${item.content || ""}`.toLowerCase();
  if (text.includes("launch") || text.includes("pricing") || text.includes("campaign")) return 0.95;
  if (text.includes("product") || text.includes("announcement")) return 0.75;
  return 0.25;
}

export async function filterCorpus({
  transcripts = [],
  tweets = [],
  scoreItem = async (item) => defaultHaikuScore(item),
  threshold = 0.6,
}) {
  const transcriptBatch = takeLimitedItems(transcripts, 300, "transcript");
  const tweetBatch = takeLimitedItems(tweets, 400, "tweet");
  const corpus = [...transcriptBatch, ...tweetBatch];

  const scored = await Promise.all(
    corpus.map(async (item) => ({
      ...item,
      score: await scoreItem(item),
    })),
  );

  const filteredItems = scored.filter((item) => item.score >= threshold);

  return {
    filteredItems,
    telemetry: {
      haiku_count: scored.length,
      filtered_count: filteredItems.length,
      transcript_count: transcriptBatch.length,
      tweet_count: tweetBatch.length,
    },
  };
}

export async function synthesizeInsights({
  competitorName,
  filteredItems,
  synthesize = async (items) => ({
    summary: `Synthesized ${items.length} competitive items for ${competitorName}.`,
    themes: items.slice(0, 3).map((item) => item.title || item.id || "untitled"),
    actions: items.slice(0, 2).map((item) => `Review ${item.title || item.id || "item"}`),
    confidence: items.length > 0 ? 0.78 : 0.35,
    sonnet_tokens: items.length * 30,
  }),
}) {
  const insight = await synthesize(filteredItems);
  return {
    summary: insight.summary,
    themes: insight.themes || [],
    actions: insight.actions || [],
    confidence: insight.confidence ?? 0,
    sonnet_tokens: insight.sonnet_tokens ?? 0,
  };
}

export async function runSpreadsheetSwarm({
  companyId,
  competitorName,
  weekOf,
  sourceRunId,
  transcripts = [],
  tweets = [],
  scoreItem,
  synthesize,
  repoOptions,
  signalOptions,
}) {
  const filtered = await filterCorpus({
    transcripts,
    tweets,
    scoreItem,
  });

  const insight = await synthesizeInsights({
    competitorName,
    filteredItems: filtered.filteredItems,
    synthesize,
  });

  const persisted = await upsertCompetitiveIntelligence(
    {
      company_id: companyId,
      competitor_name: competitorName,
      week_of: weekOf,
      summary: insight.summary,
      themes: insight.themes,
      actions: insight.actions,
      confidence: insight.confidence,
      haiku_count: filtered.telemetry.haiku_count,
      filtered_count: filtered.telemetry.filtered_count,
      sonnet_tokens: insight.sonnet_tokens,
      source_run_id: sourceRunId,
      source_agent: "priya",
    },
    repoOptions,
  );

  const emittedSignals = await emitSignals(
    [
      {
        company_id: companyId,
        signal_type: "competitor_move",
        created_by_agent: "priya",
        payload: {
          competitor_name: competitorName,
          source_run_id: sourceRunId,
          signal_payload: {
            summary: insight.summary,
            themes: insight.themes,
          },
        },
      },
      {
        company_id: companyId,
        signal_type: "competitor_content_pub",
        created_by_agent: "priya",
        payload: {
          competitor_name: competitorName,
          source_run_id: sourceRunId,
          signal_payload: {
            filtered_count: filtered.telemetry.filtered_count,
          },
        },
      },
    ],
    signalOptions,
  );

  return {
    filteredItems: filtered.filteredItems,
    telemetry: {
      ...filtered.telemetry,
      sonnet_tokens: insight.sonnet_tokens,
    },
    insight,
    persisted,
    emittedSignals,
  };
}
