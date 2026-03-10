import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

import { extractContract, validateContract } from "./platform/content-engine/contract-validator.js";

const AGENTS = [
  "veena",
  "isha",
  "neel",
  "tara",
  "zara",
  "maya",
  "riya",
  "arjun",
  "dev",
  "priya",
  "kiran",
  "sam",
];

const PORT = 3011;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForHealth(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }
    await delay(500);
  }
  throw new Error(`Backend health check did not become ready on ${BASE_URL} within ${timeoutMs}ms`);
}

function collectSsePayloads(rawText) {
  const payloads = [];
  for (const line of rawText.split(/\r?\n/)) {
    if (!line.startsWith("data: ")) {
      continue;
    }
    const body = line.slice(6).trim();
    if (!body || body === "[DONE]") {
      continue;
    }
    payloads.push(JSON.parse(body));
  }
  return payloads;
}

async function runAgent(agent) {
  const res = await fetch(`${BASE_URL}/api/agents/${agent}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Generate a deterministic test-mode run.",
      company_id: "phase4test",
    }),
  });

  if (!res.ok) {
    throw new Error(`${agent} returned HTTP ${res.status}`);
  }

  const rawText = await res.text();
  const payloads = collectSsePayloads(rawText);
  const contractPayload = payloads.find((payload) => payload.contract);
  if (!contractPayload) {
    throw new Error(`${agent} did not emit a contract payload`);
  }

  const contract = contractPayload.contract;
  const extracted = extractContract(`${rawText}\n---CONTRACT---\n${JSON.stringify(contract)}`);
  if (!extracted) {
    throw new Error(`${agent} contract could not be re-extracted`);
  }

  const result = validateContract(contract);
  if (!result.valid) {
    throw new Error(`${agent} emitted invalid contract: ${result.errors.join("; ")}`);
  }

  if (!contract.context_patch?.patch || Object.keys(contract.context_patch.patch).length === 0) {
    throw new Error(`${agent} emitted empty context_patch.patch`);
  }
}

async function main() {
  const child = spawn("node", ["platform/content-engine/backend-server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AGENT_RUN_TEST_MODE: "1",
      BACKEND_PORT: String(PORT),
      GROQ_API_KEY: process.env.GROQ_API_KEY || "test",
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "http://localhost",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "test",
      SUPABASE_URL: process.env.SUPABASE_URL || "http://localhost",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  try {
    await waitForHealth();
    for (const agent of AGENTS) {
      await runAgent(agent);
      console.log(`ok ${agent}`);
    }
  } finally {
    child.kill("SIGTERM");
    await Promise.race([once(child, "exit"), delay(5000)]);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await once(child, "exit");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
