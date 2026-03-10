import test from "node:test";
import assert from "node:assert/strict";

import { buildSnapshotFixture, createFixedClock } from "./data-pipeline-test-helpers.js";
import {
  aggregate,
  listCompanyKpis,
} from "./kpi-aggregator.js";

function createPipelineClient() {
  const state = {
    connector_raw_snapshots: [],
    company_kpi_daily: [],
  };

  function createBuilder(table) {
    const query = {
      filters: [],
      order: null,
      insertValue: null,
      upsertValue: null,
      upsertOptions: null,
      mode: "select",
    };

    const builder = {
      select() {
        query.mode = query.mode || "select";
        return builder;
      },
      insert(value) {
        query.mode = "insert";
        query.insertValue = value;
        return builder;
      },
      upsert(value, options) {
        query.mode = "upsert";
        query.upsertValue = value;
        query.upsertOptions = options || {};
        return builder;
      },
      eq(column, value) {
        query.filters.push({ type: "eq", column, value });
        return builder;
      },
      order(column, options = {}) {
        query.order = { column, ascending: options.ascending !== false };
        return builder;
      },
      single() {
        const rows = execute();
        return Promise.resolve({
          data: rows[0] || null,
          error: null,
        });
      },
      then(resolve, reject) {
        return Promise.resolve({
          data: execute(),
          error: null,
        }).then(resolve, reject);
      },
    };

    function execute() {
      if (table === "connector_raw_snapshots" && query.mode === "insert") {
        const rows = Array.isArray(query.insertValue)
          ? query.insertValue
          : [query.insertValue];
        const inserted = rows.map((row) => ({ ...row }));
        state.connector_raw_snapshots.push(...inserted);
        return inserted;
      }

      if (table === "company_kpi_daily" && query.mode === "upsert") {
        const rows = Array.isArray(query.upsertValue)
          ? query.upsertValue
          : [query.upsertValue];

        const upserted = rows.map((row) => {
          const index = state.company_kpi_daily.findIndex((candidate) => (
            candidate.company_id === row.company_id
            && candidate.metric_date === row.metric_date
            && candidate.source_scope === row.source_scope
          ));

          const nextRow = index >= 0
            ? { ...state.company_kpi_daily[index], ...row }
            : { ...row };

          if (index >= 0) {
            state.company_kpi_daily[index] = nextRow;
          } else {
            state.company_kpi_daily.push(nextRow);
          }

          return nextRow;
        });

        return upserted;
      }

      let rows = [...state[table]];

      for (const filter of query.filters) {
        if (filter.type === "eq") {
          rows = rows.filter((row) => row[filter.column] === filter.value);
        }
      }

      if (query.order) {
        const { column, ascending } = query.order;
        rows.sort((left, right) => {
          if (left[column] === right[column]) return 0;
          const direction = left[column] > right[column] ? 1 : -1;
          return ascending ? direction : -direction;
        });
      }

      return rows.map((row) => ({ ...row }));
    }

    return builder;
  }

  return {
    state,
    from(table) {
      return createBuilder(table);
    },
  };
}

test("aggregate persists raw snapshots and computes connector plus blended KPI rows", async () => {
  const client = createPipelineClient();
  const clock = createFixedClock("2026-03-10T08:00:00.000Z");

  const adsSnapshot = buildSnapshotFixture({
    id: "snap-meta",
    connector_name: "meta_ads",
    source_type: "meta_ads",
    payload: {
      spend: 1200,
      impressions: 50000,
      clicks: 1200,
      leads: 42,
    },
  });

  const commerceSnapshot = buildSnapshotFixture({
    id: "snap-shopify",
    connector_name: "shopify",
    source_type: "shopify",
    payload: {
      revenue: 4200,
      conversions: 12,
    },
  });

  await aggregate(adsSnapshot, { client, clock });
  const result = await aggregate(commerceSnapshot, { client, clock });

  assert.equal(client.state.connector_raw_snapshots.length, 2);
  assert.equal(result.rows.length, 2);

  const blendedRow = client.state.company_kpi_daily.find((row) => row.source_scope === "blended");
  const sourceRow = client.state.company_kpi_daily.find((row) => row.source_scope === "shopify");

  assert.deepEqual(blendedRow.source_snapshot_ids, ["snap-meta", "snap-shopify"]);
  assert.equal(blendedRow.spend, 1200);
  assert.equal(blendedRow.revenue, 4200);
  assert.equal(blendedRow.impressions, 50000);
  assert.equal(blendedRow.clicks, 1200);
  assert.equal(blendedRow.leads, 42);
  assert.equal(blendedRow.conversions, 12);
  assert.equal(blendedRow.ctr, 0.024);
  assert.equal(blendedRow.cpc, 1);
  assert.equal(blendedRow.cpl, 28.57);
  assert.equal(blendedRow.cpa, 100);
  assert.equal(blendedRow.roas, 3.5);
  assert.equal(sourceRow.revenue, 4200);
  assert.equal(sourceRow.spend, 0);
});

test("aggregate uses null ctr when impressions are zero", async () => {
  const client = createPipelineClient();

  await aggregate(buildSnapshotFixture({
    id: "snap-zero-impressions",
    payload: {
      spend: 100,
      impressions: 0,
      clicks: 8,
      leads: 2,
      conversions: 1,
      revenue: 500,
    },
  }), { client });

  const row = client.state.company_kpi_daily.find((candidate) => candidate.source_scope === "meta_ads");
  assert.equal(row.ctr, null);
  assert.equal(row.cpc, 12.5);
});

test("aggregate uses null cpl when leads are zero", async () => {
  const client = createPipelineClient();

  await aggregate(buildSnapshotFixture({
    id: "snap-zero-leads",
    payload: {
      spend: 150,
      impressions: 2000,
      clicks: 100,
      leads: 0,
      conversions: 3,
      revenue: 450,
    },
  }), { client });

  const row = client.state.company_kpi_daily.find((candidate) => candidate.source_scope === "meta_ads");
  assert.equal(row.cpl, null);
  assert.equal(row.ctr, 0.05);
  assert.equal(row.cpa, 50);
});

test("aggregate is idempotent for repeated snapshot runs", async () => {
  const client = createPipelineClient();
  const snapshot = buildSnapshotFixture({
    id: "snap-repeat",
    payload: {
      spend: 200,
      impressions: 4000,
      clicks: 200,
      leads: 10,
      conversions: 4,
      revenue: 600,
    },
  });

  await aggregate(snapshot, { client });
  await aggregate(snapshot, { client });

  assert.equal(client.state.connector_raw_snapshots.length, 2);
  assert.equal(client.state.company_kpi_daily.length, 2);

  const blendedRow = client.state.company_kpi_daily.find((row) => row.source_scope === "blended");
  assert.deepEqual(blendedRow.source_snapshot_ids, ["snap-repeat"]);
  assert.equal(blendedRow.spend, 200);
  assert.equal(blendedRow.revenue, 600);
});

test("safe KPI reads stay on company_kpi_daily and exclude raw payloads", async () => {
  const client = createPipelineClient();

  await aggregate(buildSnapshotFixture({
    id: "snap-safe-ads",
    source_type: "meta_ads",
    payload: {
      spend: 300,
      impressions: 15000,
      clicks: 300,
      leads: 12,
    },
  }), { client });

  await aggregate(buildSnapshotFixture({
    id: "snap-safe-ga4",
    connector_name: "ga4",
    source_type: "ga4",
    payload: {
      metrics: {
        revenue: 900,
        conversions: 6,
      },
    },
  }), { client });

  const rows = await listCompanyKpis("acme", { client });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_scope, "blended");
  assert.equal(rows[0].revenue, 900);
  assert.equal(rows[0].spend, 300);
  assert.deepEqual(rows[0].source_snapshot_ids, ["snap-safe-ads", "snap-safe-ga4"]);
  assert.equal("payload" in rows[0], false);
  assert.equal("connector_name" in rows[0], false);
});
