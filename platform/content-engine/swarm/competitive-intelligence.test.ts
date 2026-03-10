import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { emitSignal } from "./agent-signals-persistence.ts";
import {
  readLatestCompetitiveIntelligence,
  upsertCompetitiveIntelligence,
} from "./competitive-intelligence-repo.ts";

const migrationPath = new URL("../../../database/migrations/swarm-competitive-intelligence.sql", import.meta.url);

test("swarm migration defines telemetry and competitive intelligence tables with required constraints", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /CREATE TABLE IF NOT EXISTS swarm_watchdog_runs/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS competitive_intelligence/i);
  assert.match(sql, /UNIQUE\s*\(company_id,\s*competitor_name,\s*week_of\)/i);
  assert.match(sql, /haiku_count\s+INTEGER/i);
  assert.match(sql, /sonnet_tokens\s+INTEGER/i);
  assert.match(sql, /ALTER TABLE competitive_intelligence ENABLE ROW LEVEL SECURITY;/i);
});

test("upsertCompetitiveIntelligence emits the expected weekly record shape", async () => {
  const writes = [];
  const row = await upsertCompetitiveIntelligence(
    {
      company_id: "acme",
      competitor_name: "HubSpot",
      week_of: "2026-03-09",
      summary: "Competitive summary",
      themes: ["launch"],
      actions: ["Respond quickly"],
      confidence: 0.8,
      haiku_count: 12,
      filtered_count: 4,
      sonnet_tokens: 220,
      source_run_id: "run-1",
    },
    {
      writer: async (entry) => {
        writes.push(entry);
        return entry;
      },
    },
  );

  assert.equal(writes.length, 1);
  assert.equal(row.competitor_name, "HubSpot");
  assert.equal(row.source_run_id, "run-1");
  assert.equal(row.sonnet_tokens, 220);
});

test("readLatestCompetitiveIntelligence uses the injected reader in non-Supabase mode", async () => {
  const result = await readLatestCompetitiveIntelligence(
    {
      companyId: "acme",
      competitorName: "HubSpot",
    },
    {
      reader: async ({ companyId, competitorName }) => ({
        companyId,
        competitorName,
        week_of: "2026-03-09",
      }),
    },
  );

  assert.equal(result.companyId, "acme");
  assert.equal(result.competitorName, "HubSpot");
});

test("emitSignal records source run metadata for HooksEngine consumption", async () => {
  const emitted = [];
  const signal = await emitSignal(
    {
      company_id: "acme",
      signal_type: "competitor_move",
      created_by_agent: "priya",
      payload: {
        competitor_name: "HubSpot",
        source_run_id: "run-1",
      },
    },
    {
      writer: async (entry) => {
        emitted.push(entry);
        return entry;
      },
    },
  );

  assert.equal(emitted.length, 1);
  assert.equal(signal.signal_type, "competitor_move");
  assert.equal(signal.payload.source_run_id, "run-1");
});
