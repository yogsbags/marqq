/**
 * setup-n8n-workflows.js
 *
 * Idempotent script to create and activate two Marqq n8n webhook workflows:
 *   1. "Marqq - Meta Ads Performance"
 *   2. "Marqq - Google Ads Performance"
 *
 * Usage:
 *   node platform/content-engine/automations/setup-n8n-workflows.js
 *
 * Required env vars:
 *   N8N_URL      — e.g. https://your-n8n.example.com
 *   N8N_API_KEY  — n8n API key (Settings > API Keys)
 */

import { fileURLToPath } from "url";

// ── Helpers ────────────────────────────────────────────────────────────────────

function n8nHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": apiKey,
  };
}

async function listWorkflows(baseUrl, apiKey) {
  const res = await fetch(`${baseUrl}/api/v1/workflows`, {
    headers: n8nHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to list workflows: ${res.status} ${await res.text()}`);
  const body = await res.json();
  // n8n returns { data: [...] } or an array depending on version
  return Array.isArray(body) ? body : (body.data ?? []);
}

async function createWorkflow(baseUrl, apiKey, workflowDef) {
  const res = await fetch(`${baseUrl}/api/v1/workflows`, {
    method: "POST",
    headers: n8nHeaders(apiKey),
    body: JSON.stringify(workflowDef),
  });
  if (!res.ok) throw new Error(`Failed to create workflow "${workflowDef.name}": ${res.status} ${await res.text()}`);
  return res.json();
}

async function activateWorkflow(baseUrl, apiKey, workflowId) {
  const res = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}/activate`, {
    method: "POST",
    headers: n8nHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to activate workflow ${workflowId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getWorkflow(baseUrl, apiKey, workflowId) {
  const res = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}`, {
    headers: n8nHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to fetch workflow ${workflowId}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Workflow definitions ───────────────────────────────────────────────────────

function buildMetaAdsWorkflow() {
  return {
    name: "Marqq - Meta Ads Performance",
    nodes: [
      {
        id: "webhook-meta",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "marqq-meta-ads",
          responseMode: "responseNode",
        },
      },
      {
        id: "http-meta",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [480, 300],
        parameters: {
          method: "GET",
          url: "https://graph.facebook.com/v18.0/{{ $json.body.params.ad_account_id }}/insights",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Authorization",
                value: "Bearer {{ $json.body.access_token }}",
              },
            ],
          },
          sendQuery: true,
          queryParameters: {
            parameters: [
              {
                name: "fields",
                value: "campaign_name,impressions,clicks,spend,ctr,cpm,reach",
              },
              {
                name: "date_preset",
                value: "={{ $json.body.params.date_range || 'last_7d' }}",
              },
            ],
          },
        },
      },
      {
        id: "respond-meta",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [720, 300],
        parameters: {
          respondWith: "json",
          responseBody:
            '={ JSON.stringify({ status: "completed", automation_id: "fetch_meta_ads", company_id: $json.body ? $json.body.company_id : "", data: $json }) }',
        },
      },
    ],
    connections: {
      Webhook: {
        main: [
          [{ node: "HTTP Request", type: "main", index: 0 }],
        ],
      },
      "HTTP Request": {
        main: [
          [{ node: "Respond to Webhook", type: "main", index: 0 }],
        ],
      },
    },
    settings: {
      executionOrder: "v1",
    },
  };
}

function buildGoogleAdsWorkflow() {
  return {
    name: "Marqq - Google Ads Performance",
    nodes: [
      {
        id: "webhook-google",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "marqq-google-ads",
          responseMode: "responseNode",
        },
      },
      {
        id: "http-google",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [480, 300],
        parameters: {
          method: "POST",
          url: "https://googleads.googleapis.com/v14/customers/{{ $json.body.params.customer_id }}/googleAds:searchStream",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Authorization",
                value: "Bearer {{ $json.body.access_token }}",
              },
              {
                name: "developer-token",
                value: "={{ $json.body.params.developer_token || '' }}",
              },
            ],
          },
          sendBody: true,
          bodyContentType: "json",
          body: {
            query:
              "SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr FROM campaign WHERE segments.date DURING {{ $json.body.params.date_range || 'LAST_7_DAYS' }}",
          },
        },
      },
      {
        id: "respond-google",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [720, 300],
        parameters: {
          respondWith: "json",
          responseBody:
            '={ JSON.stringify({ status: "completed", automation_id: "google_ads_fetch", company_id: $json.body ? $json.body.company_id : "", data: $json }) }',
        },
      },
    ],
    connections: {
      Webhook: {
        main: [
          [{ node: "HTTP Request", type: "main", index: 0 }],
        ],
      },
      "HTTP Request": {
        main: [
          [{ node: "Respond to Webhook", type: "main", index: 0 }],
        ],
      },
    },
    settings: {
      executionOrder: "v1",
    },
  };
}

// ── Core setup function ────────────────────────────────────────────────────────

export async function setupN8nWorkflows() {
  const N8N_URL = process.env.N8N_URL?.replace(/\/$/, "");
  const N8N_API_KEY = process.env.N8N_API_KEY;

  if (!N8N_URL || !N8N_API_KEY) {
    throw new Error(
      "Missing required env vars. Set N8N_URL and N8N_API_KEY before running."
    );
  }

  const workflowDefs = [
    {
      def: buildMetaAdsWorkflow(),
      webhookPath: "marqq-meta-ads",
      envKey: "N8N_META_ADS_WEBHOOK",
    },
    {
      def: buildGoogleAdsWorkflow(),
      webhookPath: "marqq-google-ads",
      envKey: "N8N_GOOGLE_ADS_WEBHOOK",
    },
  ];

  // Fetch existing workflows once for idempotency check
  let existing;
  try {
    existing = await listWorkflows(N8N_URL, N8N_API_KEY);
  } catch (err) {
    console.error("Could not fetch existing workflows:", err.message);
    throw err;
  }

  const results = [];

  for (const { def, webhookPath, envKey } of workflowDefs) {
    const existingWorkflow = existing.find((w) => w.name === def.name);
    let workflow;

    if (existingWorkflow) {
      console.log(`  (skip) Workflow already exists: "${def.name}" (id: ${existingWorkflow.id})`);
      workflow = existingWorkflow;
    } else {
      console.log(`  Creating workflow: "${def.name}" ...`);
      workflow = await createWorkflow(N8N_URL, N8N_API_KEY, def);
      console.log(`  Created workflow id: ${workflow.id}`);
    }

    // Activate if not already active
    if (!workflow.active) {
      console.log(`  Activating workflow "${def.name}" ...`);
      await activateWorkflow(N8N_URL, N8N_API_KEY, workflow.id);
    } else {
      console.log(`  Workflow "${def.name}" is already active.`);
    }

    // Fetch full workflow to confirm webhook registration
    const full = await getWorkflow(N8N_URL, N8N_API_KEY, workflow.id);
    const webhookNode = full.nodes?.find((n) => n.type === "n8n-nodes-base.webhook");
    // In production the path is confirmed; build the URL deterministically
    const webhookUrl = `${N8N_URL}/webhook/${webhookPath}`;

    results.push({ name: def.name, webhookUrl, envKey, webhookNode });
  }

  // Print summary
  console.log("\n");
  for (const { name, webhookUrl, envKey } of results) {
    const label = envKey.replace("N8N_", "").replace(/_/g, " ").toLowerCase();
    console.log(`✓ ${name.replace("Marqq - ", "")} webhook: ${webhookUrl}`);
    console.log(`  → Add to .env: ${envKey}=${webhookUrl}`);
  }

  return results;
}

// ── Direct execution ───────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupN8nWorkflows()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("\nSetup failed:", err.message);
      process.exit(1);
    });
}
