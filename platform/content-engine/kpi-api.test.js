import test from "node:test";
import assert from "node:assert/strict";

import { buildKpiFixture } from "./data-pipeline-test-helpers.js";
import {
  createKpiRouteHandler,
  parseKpiDays,
} from "./backend-server.js";

function createResponseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("parseKpiDays validates bounded integer windows", () => {
  assert.equal(parseKpiDays(undefined), 30);
  assert.equal(parseKpiDays("7"), 7);
  assert.equal(parseKpiDays("0"), null);
  assert.equal(parseKpiDays("91"), null);
  assert.equal(parseKpiDays("7.5"), null);
});

test("GET /api/kpis validates companyId before reading KPI rows", async () => {
  const req = { params: { companyId: "../bad" }, query: {} };
  const res = createResponseRecorder();
  let called = false;

  await createKpiRouteHandler({
    listCompanyKpisImpl: async () => {
      called = true;
      return [];
    },
  })(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "invalid companyId" });
  assert.equal(called, false);
});

test("GET /api/kpis returns only safe aggregated KPI rows", async () => {
  const req = { params: { companyId: "acme" }, query: { days: "2" } };
  const res = createResponseRecorder();

  await createKpiRouteHandler({
    listCompanyKpisImpl: async (companyId, options) => {
      assert.equal(companyId, "acme");
      assert.equal(options.days, 2);
      return [
        {
          ...buildKpiFixture({ id: "kpi-2", metric_date: "2026-03-10" }),
          payload: { raw: true },
        },
        buildKpiFixture({ id: "kpi-1", metric_date: "2026-03-09" }),
      ];
    },
  })(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.companyId, "acme");
  assert.equal(res.body.days, 2);
  assert.equal(res.body.rows.length, 2);
  assert.equal("payload" in res.body.rows[0], false);
  assert.equal(res.body.rows[0].source_scope, "blended");
});
