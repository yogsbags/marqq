import { createClient } from "@supabase/supabase-js";

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3008;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_COMPANY_ID = `test-veena-onboard-${Date.now()}`;
const TEST_WEBSITE_URL = process.argv[2] || "https://example.com";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "FAIL: Supabase env vars not set (VITE_SUPABASE_URL + SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY)"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
let exitCode = 0;

console.log(`\n[test-veena-onboard] company_id: ${TEST_COMPANY_ID}`);
console.log(`[test-veena-onboard] website_url: ${TEST_WEBSITE_URL}\n`);

console.log("Step 1: POST /api/agents/veena/onboard...");
let onboardRunId;
try {
  const res = await fetch(`${BASE_URL}/api/agents/veena/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: TEST_COMPANY_ID,
      website_url: TEST_WEBSITE_URL,
      company_name: "Test Company (Veena Onboard Test)",
    }),
  });

  if (res.status !== 202 && res.status !== 200) {
    console.error(`FAIL: Expected 202 or 200, got ${res.status}`);
    console.error("Response:", await res.text());
    exitCode = 1;
  } else {
    const body = await res.json();
    onboardRunId = body.run_id || body.onboard_run_id;
    console.log(`PASS: Response ${res.status} — run_id: ${onboardRunId}`);
    console.log(`      Message: ${body.message}`);
  }
} catch (err) {
  console.error("FAIL: fetch error:", err.message);
  console.error("      Is the backend running on port", PORT, "?");
  exitCode = 1;
}

if (exitCode !== 0) {
  console.log("\n[test-veena-onboard] Aborting — POST failed");
  process.exit(exitCode);
}

console.log("\nStep 2: Waiting for background crawl to complete (max 180s)...");
const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 180000;
const start = Date.now();
let veenaTaskDone = false;

while (Date.now() - start < MAX_WAIT_MS) {
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  const elapsed = Math.round((Date.now() - start) / 1000);
  const { data, error } = await supabase
    .from("agent_tasks")
    .select("agent_name, status, triggered_by_run_id, scheduled_for")
    .eq("company_id", TEST_COMPANY_ID);

  if (error) {
    console.warn(`  [${elapsed}s] Supabase query error:`, error.message);
    continue;
  }

  const veenaTask = data?.find((row) => row.agent_name === "veena");
  if (veenaTask && (veenaTask.status === "done" || veenaTask.status === "failed")) {
    veenaTaskDone = true;
    console.log(`  [${elapsed}s] Veena task status: ${veenaTask.status}`);
    break;
  }

  console.log(
    `  [${elapsed}s] Waiting... veena status: ${veenaTask?.status ?? "not yet written"}`
  );
}

if (!veenaTaskDone) {
  console.error("FAIL: Veena task did not complete within 180 seconds");
  exitCode = 1;
}

console.log("\nStep 3: Querying agent_tasks for all chain rows...");
const { data: tasks, error: tasksError } = await supabase
  .from("agent_tasks")
  .select("agent_name, status, triggered_by_run_id, scheduled_for")
  .eq("company_id", TEST_COMPANY_ID)
  .order("scheduled_for", { ascending: true });

if (tasksError) {
  console.error("FAIL: Supabase query error:", tasksError.message);
  exitCode = 1;
} else {
  const agents = ["veena", "isha", "neel", "zara"];
  for (const agentName of agents) {
    const task = tasks.find((row) => row.agent_name === agentName);
    if (!task) {
      console.error(`FAIL: No agent_tasks row found for ${agentName}`);
      exitCode = 1;
    } else {
      console.log(
        `  ${agentName}: status=${task.status} triggered_by=${task.triggered_by_run_id?.slice(0, 8) || "N/A"}... scheduled_for=${task.scheduled_for || "N/A"}`
      );
    }
  }

  const isha = tasks.find((row) => row.agent_name === "isha");
  const neel = tasks.find((row) => row.agent_name === "neel");
  const zara = tasks.find((row) => row.agent_name === "zara");

  if (isha && neel && zara) {
    const ordered =
      isha.scheduled_for < neel.scheduled_for && neel.scheduled_for < zara.scheduled_for;
    if (ordered) {
      console.log("PASS: sequential ordering confirmed (isha < neel < zara)");
    } else {
      console.error("FAIL: sequential ordering violated");
      exitCode = 1;
    }

    const veenaRunId = isha.triggered_by_run_id;
    const chainLinked =
      neel.triggered_by_run_id === veenaRunId &&
      zara.triggered_by_run_id === veenaRunId;
    if (chainLinked) {
      console.log("PASS: isha/neel/zara triggered_by_run_id all point to veena's run_id");
    } else {
      console.error("FAIL: triggered_by_run_id mismatch in chain");
      exitCode = 1;
    }
  }

  if (exitCode === 0) {
    console.log("\nPASS: all 4 agent_tasks rows present with correct status and ordering");
  }
}

console.log(`\n[test-veena-onboard] Result: ${exitCode === 0 ? "PASS" : "FAIL"}`);
process.exit(exitCode);
