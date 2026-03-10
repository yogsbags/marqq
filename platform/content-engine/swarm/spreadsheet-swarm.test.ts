import test from "node:test";
import assert from "node:assert/strict";

import { filterCorpus, runSpreadsheetSwarm, synthesizeInsights } from "./spreadsheet-swarm.ts";

test("filterCorpus drops irrelevant items and limits transcript/tweet volumes", async () => {
  const result = await filterCorpus({
    transcripts: [
      { id: "t1", title: "Major product launch" },
      { id: "t2", title: "Casual office vlog" },
    ],
    tweets: [
      { id: "x1", title: "Pricing update announced" },
      { id: "x2", title: "Weekend photos" },
    ],
  });

  assert.deepEqual(result.filteredItems.map((item) => item.id), ["t1", "x1"]);
  assert.equal(result.telemetry.haiku_count, 4);
  assert.equal(result.telemetry.filtered_count, 2);
});

test("synthesizeInsights receives only filtered items and returns structured telemetry", async () => {
  const filteredItems = [
    { id: "t1", title: "Major product launch" },
    { id: "x1", title: "Pricing update announced" },
  ];

  const result = await synthesizeInsights({
    competitorName: "HubSpot",
    filteredItems,
    synthesize: async (items) => ({
      summary: `Saw ${items.length} items`,
      themes: items.map((item) => item.id),
      actions: ["Review launch"],
      confidence: 0.82,
      sonnet_tokens: 120,
    }),
  });

  assert.equal(result.summary, "Saw 2 items");
  assert.deepEqual(result.themes, ["t1", "x1"]);
  assert.equal(result.sonnet_tokens, 120);
});

test("runSpreadsheetSwarm persists filtered telemetry and emits both signal types", async () => {
  const writes = [];
  const signals = [];

  const result = await runSpreadsheetSwarm({
    companyId: "acme",
    competitorName: "HubSpot",
    weekOf: "2026-03-09",
    sourceRunId: "run-1",
    transcripts: [{ id: "t1", title: "Major product launch" }],
    tweets: [{ id: "x1", title: "Pricing update announced" }],
    repoOptions: {
      writer: async (entry) => {
        writes.push(entry);
        return entry;
      },
    },
    signalOptions: {
      writer: async (entry) => {
        signals.push(entry);
        return entry;
      },
    },
  });

  assert.equal(writes.length, 1);
  assert.equal(writes[0].haiku_count, 2);
  assert.equal(writes[0].filtered_count, 2);
  assert.equal(signals.length, 2);
  assert.deepEqual(signals.map((entry) => entry.signal_type), ["competitor_move", "competitor_content_pub"]);
  assert.equal(result.telemetry.sonnet_tokens, 60);
});
