import test from "node:test";
import assert from "node:assert/strict";

process.env.AGENT_RUN_TEST_MODE = "1";
process.env.BACKEND_PORT = "3011";

const backend = await import("./backend-server.js");
backend.startBackendRuntime();

test("dispatchHookRun sends trigger metadata through the existing run path", async () => {
  const { dispatchHookRun } = backend;
  const insertedTasks = [];
  const results = await dispatchHookRun(
    {
      company_id: "acme",
      signal_id: "signal-123",
      hook_id: "traffic-drop-20pct-7d",
      triggered_by: "signal",
      trigger_id: "signal-123",
      trigger_metadata: {
        signal_type: "traffic_drop_20pct_7d",
        baseline_value: 100,
        current_value: 80,
        delta_pct: -20,
      },
      dispatch: [
        { agent: "tara", task_type: "traffic_drop_recovery_plan", order: 1 },
        { agent: "kiran", task_type: "traffic_drop_social_response", order: 2 },
      ],
    },
    {
      supabaseClient: {
        from(table) {
          assert.equal(table, "agent_tasks");
          return {
            async insert(row) {
              insertedTasks.push(row);
              return { error: null };
            },
          };
        },
      },
      baseUrl: "http://127.0.0.1:3011",
    },
  );

  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((result) => result.requestBody.triggered_by),
    ["signal", "signal"],
  );
  assert.equal(
    results[0].contract.artifact.data.trigger_context.hook_id,
    "traffic-drop-20pct-7d",
  );
  assert.equal(insertedTasks.length, 2);
});

test("manual /api/agents/:name/run still works without trigger metadata", async () => {
  const response = await fetch("http://127.0.0.1:3011/api/agents/isha/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Summarize the current market context.",
      company_id: "acme",
    }),
  });

  assert.equal(response.status, 200);
  const text = await response.text();
  assert.match(text, /\[TEST MODE\] isha executed without a live model/);
  assert.match(text, /"contract"/);
});
