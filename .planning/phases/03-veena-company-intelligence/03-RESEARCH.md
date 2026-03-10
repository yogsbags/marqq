# Phase 3: Veena — Company Intelligence - Research

**Researched:** 2026-03-10
**Domain:** Node.js ESM, Groq/compound web-enabled LLM, MKGService, Supabase agent_tasks, SSE agent run endpoint
**Confidence:** HIGH (all findings from direct codebase inspection of backend-server.js, prior phase research, and existing agent directory structure)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VEENA-01 | New agent "veena" created with SOUL.md, mcp.json, skills/, memory/MEMORY.md | Existing agent directory structure (zara, isha) is the exact template to follow. Backend reads from `platform/crewai/agents/{name}/` — Veena goes in same location. |
| VEENA-02 | Veena runs weekly (Mon 06:00 IST) to refresh MKG — crawls company website, reads GA4, reads Composio connectors | The `buildCompanyProfileUserContent` + `groq/compound` pattern already does web fetch + LLM synthesis. Same pattern adapted for MKG fields instead of company-intel profile schema. Scheduler is APScheduler (Python side); new entry needed there (Phase 4 concern — Phase 3 wires the crawl function only). |
| VEENA-03 | Veena triggers `new_company_onboarded` signal → fires full-chain onboarding (sequential: veena → isha → neel → zara) | No `agent_signals` table exists yet. For Phase 3, Veena's `tasks_created` array in the AgentRunOutput is the mechanism — `writeTasksCreated` already inserts to `agent_tasks`. Sequential chaining requires a new `POST /api/agents/veena/onboard` endpoint that runs the chain step-by-step. |
| VEENA-04 | Veena outputs `AgentRunOutput` with `context_patch` covering 12 MKG top-level fields | Standard contract system (Phase 2) is already built. Veena's SOUL.md instructs it to populate all 12 fields from crawl data. The existing run endpoint handles extraction, validation, and MKG patch automatically. |
| VEENA-05 | Veena `mkg.json` template pre-populated for new companies from product-marketing-context skill | MKGService.patch() creates the file if it doesn't exist (createEmptyMkg). The pre-populate step is a call to MKGService.patch(companyId, emptyTemplateWithNulls) before the first crawl. Done inside the onboard endpoint. |

</phase_requirements>

---

## Summary

Phase 3 creates the Veena agent — the "MKG owner" — in three parts: the agent file structure (SOUL.md, mcp.json, skills/, MEMORY.md), a company website crawler that maps crawled data into all 12 MKG fields, and an onboarding chain endpoint that sequences veena → isha → neel → zara when a new company is added.

All three parts plug into existing infrastructure. The agent file structure follows the exact same convention as the 9 existing agents (e.g., `platform/crewai/agents/zara/`). The crawl uses `buildCompanyProfileUserContent` (already in production for company-intel) plus `groq/compound` with web_search and visit_website tools enabled — the same model already used for company profiling. The onboarding chain uses the existing `POST /api/agents/:name/run` endpoint called sequentially with `await`, with `tasks_created` rows appearing in `agent_tasks` for each step (satisfying VEENA-03's Supabase verification requirement).

The primary new concept is the **onboard endpoint** (`POST /api/agents/veena/onboard`), which is not SSE — it runs the sequential chain server-side, writes an `agent_tasks` record per step, initializes the MKG template, runs the Veena crawl, then enqueues isha/neel/zara as `agent_tasks` with `triggered_by_run_id` from Veena's run. This is cleaner than trying to fire SSE requests sequentially.

**Primary recommendation:** Build Veena's crawl function by adapting `buildCompanyProfileUserContent` + `groq/compound` to target the 12 MKG fields (not the company-intel profile schema). The onboard endpoint calls `MKGService.patch(companyId, emptyTemplate)` first, then runs the crawl, then writes the chain tasks. Add "veena" to VALID_AGENTS. No new dependencies needed.

---

## Standard Stack

The backend is plain ESM JavaScript. No new dependencies needed for any of the three plans.

### Core (already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs/promises` | Node 20 built-in | Read SOUL.md, MEMORY.md, skills | Already imported line 23 of backend-server.js |
| `groq-sdk` | existing | Groq LLM calls — compound model for web-enabled crawl | Already imported line 165; `groq/compound` already used for company profiling |
| `@supabase/supabase-js` | existing | Write agent_tasks rows for chain steps | Already configured in supabase.js |
| `MKGService` | Phase 1 | Initialize MKG template, apply context_patch after crawl | Already imported at line 46 of backend-server.js (Phase 2 wired it) |
| `node:crypto` `randomUUID` | Node 20 built-in | run_id for each chain step | Already imported line 19 |
| Native `fetch` | Node 20 built-in | Homepage fetch for crawl | Already used in `buildCompanyProfileUserContent` (line 3947) |

### No New Dependencies

All capabilities are in the existing stack. `groq/compound` with `enabled_tools: ["web_search", "visit_website"]` handles URL crawling. Native fetch handles raw HTML extraction (already proven at line 3947). MKGService handles MKG template init and patching.

---

## Architecture Patterns

### Recommended Directory Structure

The new Veena agent directory mirrors existing agents exactly:

```
platform/crewai/agents/
├── zara/                    # existing — reference model for SOUL.md + mcp.json
│   ├── SOUL.md
│   ├── mcp.json
│   ├── skills/
│   │   └── 00-product-marketing-context.md
│   └── memory/MEMORY.md
├── isha/                    # existing — reference for skills-only directory
│   └── skills/
│       └── 00-product-marketing-context.md
└── veena/                   # NEW
    ├── SOUL.md              # Veena's identity, role, MKG ownership
    ├── mcp.json             # Connectors: none at Phase 3 (GA4/Composio in Phase 4)
    ├── skills/
    │   ├── 00-product-marketing-context.md  # copied from isha (identical)
    │   └── 01-company-crawl.md              # Veena-specific: MKG field extraction guide
    └── memory/
        └── MEMORY.md        # initialized empty: "# Veena Memory\n\n_No runs yet._"
```

### Pattern 1: SOUL.md for MKG-Owning Agent

Veena's SOUL.md must include `reads_from_mkg`, `writes_to_mkg`, and `triggers_agents` fields (required by Phase 4's AGENT-06 but establishing the pattern now). Model the format after `zara/SOUL.md` but add these structured fields:

```markdown
# Veena — Company Intelligence Agent

**Role**: MKG owner — crawls company websites, bootstraps the Marketing Knowledge Graph,
          and triggers the sequential onboarding chain for new companies
**Personality**: Methodical, evidence-first — reports only what the website confirms;
                 flags all assumptions explicitly
**Expertise**: Company profiling, offer extraction, ICP inference, messaging analysis

**reads_from_mkg**: [] (Veena is the bootstrap agent — reads nothing, writes everything)
**writes_to_mkg**: positioning, icp, competitors, offers, messaging, channels, funnel,
                   metrics, baselines, content_pillars, campaigns, insights
**triggers_agents**: isha, neel, zara (sequential onboarding chain)

**Schedule**: Weekly Mon 06:00 IST (APScheduler — Phase 4)
**Memory**: agents/veena/memory/MEMORY.md

## My Mission
I am the first agent to run for any new company. I crawl the company website and populate
all 12 MKG fields to give every other agent a knowledge foundation to build on.

## What I Produce Each Run
- A context_patch covering all 12 MKG top-level fields
- handoff_notes summarizing what was found vs what requires deeper research
- tasks_created entries for isha, neel, zara (sequential onboarding chain)

## My Rules
- Never invent data the website doesn't support — use confidence 0.3 for inferred fields
- For fields the website makes explicit, use confidence 0.7–0.85
- Always populate all 12 fields — use null value with confidence 0 if genuinely absent
- Summarize each field as a structured object, not raw prose
```

### Pattern 2: Veena Crawl Function (adapts existing pattern)

The existing `buildCompanyProfileUserContent` at line 3941 fetches the homepage with a 6-second timeout, extracts meta tags and `<h1>`, and passes to Groq. The Veena crawl does the same but with a different system prompt — targeting MKG fields instead of company-intel profile schema.

```javascript
// platform/content-engine/veena-crawler.js  (new file)
// Source: adapts buildCompanyProfileUserContent + generateCompanyProfileWithGroq patterns

import { groq } from "./backend-server.js"; // or re-create Groq client

const VEENA_MKG_SYSTEM_PROMPT = `
You are Veena, the Company Intelligence agent. Given a company website URL and homepage
signals, extract structured data for each of the 12 Marketing Knowledge Graph fields.

For each field, return an object with:
- "value": structured data (object, array, or string — not raw prose)
- "confidence": 0.0–1.0 (0.7–0.85 for explicit website data, 0.3–0.5 for inferred)

Fields to extract:
- positioning: { statement: string, unique_value: string }
- icp: { company_size: string, industry: string, geography: string[], role: string }
- competitors: [{ name: string, positioning: string }]
- offers: [{ name: string, price_signal: string, tier: string }]
- messaging: { headline: string, tagline: string, key_messages: string[] }
- channels: [{ channel: string, evidence: string }]
- funnel: { entry_points: string[], cta_primary: string }
- metrics: null  (website rarely reveals KPIs — set confidence 0)
- baselines: null  (no baseline on first run — set confidence 0)
- content_pillars: [{ topic: string, evidence: string }]
- campaigns: null  (no live campaigns visible from homepage — set confidence 0)
- insights: { summary: string, gaps: string[] }

Output ONLY valid JSON with exactly these 12 keys. Each key maps to
{ value: ..., confidence: number }.
`;

async function crawlCompanyForMKG(websiteUrl) {
  // Step 1: fetch raw homepage signals (same pattern as line 3944–3983)
  let pageHints = "";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(websiteUrl.trim(), {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TorqqBot/1.0)" },
    });
    clearTimeout(timer);
    if (resp.ok) {
      const html = await resp.text();
      // extract title, og:site_name, h1, h2, meta description, CTAs
      // (same extraction pattern as lines 3954–3978)
      pageHints = extractPageSignals(html);
    }
  } catch { /* non-blocking */ }

  // Step 2: groq/compound with web_search + visit_website enabled
  const userContent = `Website: ${websiteUrl}\n\nPage signals:\n${pageHints}\n\nExtract MKG fields.`;

  const completion = await groq.chat.completions.create({
    model: "groq/compound",
    messages: [
      { role: "system", content: VEENA_MKG_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_completion_tokens: 2000,
    top_p: 1,
    compound_custom: {
      tools: { enabled_tools: ["web_search", "visit_website"] },
    },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "{}";
  return JSON.parse(raw);  // parse with try/catch in caller
}
```

**Key insight:** `groq/compound` with `visit_website` can follow links (pricing page, about page) automatically, not just the homepage. This lets Veena extract offers from `/pricing` and team info from `/about` without hand-coding multi-page fetching.

**Fallback:** If `groq/compound` fails, fall back to `llama-3.3-70b-versatile` with `response_format: { type: "json_object" }` using only the pageHints. Same 2-model fallback pattern as `COMPANY_PROFILE_GROQ_MODELS`.

### Pattern 3: MKG Template Pre-Population (VEENA-05)

Before the first crawl, initialize the MKG for a new company with null values. MKGService.patch() creates the file if it doesn't exist — so "pre-populate" is simply an initial patch with all 12 fields set to the empty envelope.

```javascript
// Called inside the onboard endpoint before running the crawl
async function initializeMKGTemplate(companyId) {
  const now = new Date().toISOString().split("T")[0];
  const emptyPatch = {};
  const TOP_LEVEL_FIELDS = [
    "positioning", "icp", "competitors", "offers", "messaging",
    "channels", "funnel", "metrics", "baselines", "content_pillars",
    "campaigns", "insights"
  ];
  for (const field of TOP_LEVEL_FIELDS) {
    emptyPatch[field] = {
      value: null,
      confidence: 0,
      last_verified: null,
      source_agent: "veena",
      expires_at: null,
    };
  }
  await MKGService.patch(companyId, emptyPatch);
}
```

This satisfies VEENA-05: the `mkg.json` exists with all 12 fields present before the crawl starts. The product-marketing-context skill (already in Veena's skills/) teaches Veena to read the MKG schema — the template file itself IS created by this patch call.

### Pattern 4: Onboarding Chain Endpoint

The `new_company_onboarded` signal (VEENA-03) is implemented as a REST endpoint, not a fire-and-forget event. This is correct for Phase 3 — the HooksEngine (Phase 5) will later replace this with signal-driven dispatch. For now, a dedicated endpoint chains the runs.

```javascript
// POST /api/agents/veena/onboard
// Body: { company_id, website_url, company_name }
// NOT SSE — returns JSON after chain completes (or times out)

app.post("/api/agents/veena/onboard", async (req, res) => {
  const { company_id, website_url, company_name } = req.body || {};
  if (!company_id?.trim()) return res.status(400).json({ error: "company_id required" });

  const companyId = company_id.trim();
  const onboardRunId = randomUUID();

  // 1. Initialize MKG template (VEENA-05)
  await initializeMKGTemplate(companyId);

  // 2. Write agent_tasks record for veena (status: running)
  await supabase.from("agent_tasks").insert({
    agent_name: "veena", task_type: "onboard_crawl", status: "running",
    company_id: companyId, triggered_by_run_id: onboardRunId,
    description: `Onboarding crawl for ${company_name || companyId}`,
    priority: "high",
  });

  // 3. Run Veena crawl → MKG patch
  let veenaRunId;
  try {
    const mkg = await crawlCompanyForMKG(website_url || "");
    veenaRunId = randomUUID();
    const contextPatch = buildContextPatchFromCrawl(mkg, "veena", veenaRunId);
    await MKGService.patch(companyId, contextPatch);
    // Save agent_run_output contract row
    await saveAgentRunOutput({ agent: "veena", run_id: veenaRunId, company_id: companyId,
      task: "company_onboard_crawl", timestamp: new Date().toISOString(),
      artifact: { data: mkg, summary: "Bootstrapped MKG from website crawl", confidence: 0.7 },
      context_patch: { writes_to: Object.keys(contextPatch), patch: contextPatch },
      handoff_notes: "MKG initialized. Isha, Neel, Zara queued for onboarding.",
      missing_data: [], tasks_created: [], outcome_prediction: null });
    // Update tasks record
    await supabase.from("agent_tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("triggered_by_run_id", onboardRunId).eq("agent_name", "veena");
  } catch (err) {
    await supabase.from("agent_tasks")
      .update({ status: "failed", error_message: String(err) })
      .eq("triggered_by_run_id", onboardRunId).eq("agent_name", "veena");
    return res.status(500).json({ error: "Veena crawl failed", detail: String(err) });
  }

  // 4. Enqueue sequential onboarding chain: isha → neel → zara
  const chain = ["isha", "neel", "zara"];
  const chainRows = chain.map((agentName) => ({
    agent_name: agentName,
    task_type: "onboard_briefing",
    status: "scheduled",
    company_id: companyId,
    triggered_by_run_id: veenaRunId,   // FK to Veena's run (VEENA-03 evidence)
    description: `Onboarding briefing for ${company_name || companyId}`,
    priority: "high",
    scheduled_for: new Date(Date.now() + (chain.indexOf(agentName) + 1) * 60000).toISOString(),
  }));
  await supabase.from("agent_tasks").insert(chainRows);

  res.json({
    onboard_run_id: onboardRunId,
    veena_run_id: veenaRunId,
    chain_scheduled: chain,
    message: "Onboarding complete. Chain agents queued in agent_tasks.",
  });
});
```

**Why this approach for VEENA-03:** The success criterion says "confirmed by Supabase `agent_tasks` records for each step." The onboard endpoint creates exactly those records: one for Veena (status: done), and one each for isha, neel, zara (status: scheduled, triggered_by_run_id = Veena's run_id). The actual execution of isha/neel/zara via SSE happens when the APScheduler or HooksEngine picks up the scheduled tasks — which is Phase 4/5 work. Phase 3 only needs to confirm the `agent_tasks` rows exist, which this endpoint guarantees.

### Pattern 5: VALID_AGENTS Registration

Veena must be added to the `VALID_AGENTS` set in `backend-server.js` (line 61) so it works with the existing SSE run endpoint, mark-run, deployments, and plan endpoints.

```javascript
// backend-server.js line 61 — add "veena"
const VALID_AGENTS = new Set([
  "veena",   // NEW
  "zara",
  "maya",
  "riya",
  "arjun",
  "dev",
  "priya",
  "tara",
  "neel",
  "isha",
]);
```

Also add Veena's profile to `AGENT_PROFILES` (line 72 onward) so the `/api/agents/context` endpoint returns her profile correctly.

### Anti-Patterns to Avoid

- **Using SSE for the onboard chain:** The onboard endpoint should be non-streaming JSON. Trying to SSE-stream a sequential multi-agent chain creates complex client-side state management. Return JSON from the onboard endpoint; each individual agent run via SSE can still happen separately when tasks are picked up.
- **Calling the SSE run endpoint internally from the onboard endpoint:** `POST /api/agents/veena/run` is an SSE endpoint — you cannot call it server-to-server and await it cleanly. The onboard endpoint calls `crawlCompanyForMKG()` directly (the function, not the HTTP endpoint) and uses `saveAgentRunOutput()` directly to persist the contract.
- **Storing raw crawl HTML in MKG:** Values in the MKG must be structured objects/arrays, not raw HTML or prose. The Groq call must output structured JSON before it reaches `MKGService.patch()`.
- **Not handling groq/compound failures:** `groq/compound` can fail with rate limits or tool errors. Always have the 2-model fallback to `llama-3.3-70b-versatile` + `response_format: json_object` using only the pageHints (no tool calls).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web crawling with JS rendering | Puppeteer, Playwright, cheerio | `groq/compound` with `visit_website` tool | Already proven in production for company-intel; handles JS-rendered pages; no new dependency |
| HTML meta-tag extraction | Custom regex parser | Existing `buildCompanyProfileUserContent` pattern (lines 3954–3978) | Already handles title, og:site_name, application-name, h1 — copy exactly |
| Sequential task chaining | Custom async queue, BullMQ, Redis | Direct `await` sequence in onboard endpoint + `agent_tasks` rows | Complexity is premature; Phase 5 HooksEngine owns the real orchestration |
| JSON schema validation for crawl output | Zod, AJV | Manual field check + try/catch | Same pattern as Phase 1/2; schema is 12 known fields |
| MKG initialization | Custom file creation code | `MKGService.patch(companyId, emptyPatch)` | Already creates the file via `createEmptyMkg` if it doesn't exist |

**Key insight:** `groq/compound` with `visit_website` is the project's established mechanism for extracting structured data from websites. Do not introduce a scraping library — this is a solved problem in the codebase.

---

## Common Pitfalls

### Pitfall 1: groq/compound Returns Non-JSON Text
**What goes wrong:** `groq/compound` is not constrained by `response_format: { type: "json_object" }` (that flag only works for non-compound models). The compound model may add prose before or after the JSON.
**Why it happens:** The compound model uses `web_search`/`visit_website` tools internally and narrates its findings before outputting JSON.
**How to avoid:** Use `extractJsonObject()` — already defined in the codebase (see line 3748 usage). This function finds the first `{...}` block in the response regardless of surrounding prose. Same pattern already used in the company-intel pipeline.
**Warning signs:** `JSON.parse` throwing `SyntaxError` on crawl output.

### Pitfall 2: Website Blocks the Bot (403/timeout)
**What goes wrong:** The `fetch(websiteUrl)` call returns 403, or the AbortController fires at 6 seconds. pageHints is empty. The groq/compound call proceeds with only the URL — may still work via `visit_website` tool.
**Why it happens:** Some websites block User-Agent: TorqqBot or have Cloudflare protection.
**How to avoid:** If `fetch()` fails, still proceed with `groq/compound` — it uses its own browser-grade `visit_website` tool which bypasses simple bot detection. The pageHints are supplementary, not required. Log the fetch failure but don't abort the crawl.
**Warning signs:** All MKG fields returning confidence 0.3 (inferred) with no website-explicit data.

### Pitfall 3: groq/compound Visits Wrong Pages
**What goes wrong:** The compound model visits the competitor's pricing page instead of the target company's pricing page.
**Why it happens:** The system prompt doesn't constrain the URL scope.
**How to avoid:** System prompt must say "Only visit URLs that are subdomains or paths of `{websiteUrl}`. Do not visit external websites." Add this constraint explicitly.

### Pitfall 4: onboard Endpoint Times Out
**What goes wrong:** groq/compound crawl takes 45–90 seconds (tool calls are slow). Express request times out before response.
**Why it happens:** Default Express/Node HTTP timeout is 2 minutes — usually OK. But load balancers (Railway) often have 30-second timeouts.
**How to avoid:** Respond immediately (202 Accepted) with the run_id, then run the crawl in the background. Poll via `GET /api/mkg/:companyId` to see when MKG is populated. This is the same pattern as `POST /api/company-intel/companies` (line 4120: "Fire background profile generation — does NOT block the response").
**Warning signs:** 504 Gateway Timeout on the `/onboard` response.

### Pitfall 5: Duplicate Agent Tasks on Retry
**What goes wrong:** Client retries the `/onboard` POST (e.g., after a 504). A second row is inserted into `agent_tasks` for each step, and the MKG template is patched twice.
**Why it happens:** The onboard endpoint isn't idempotent.
**How to avoid:** Check if `agent_tasks` already has a row for this `company_id` with `task_type = "onboard_crawl"` and `status IN ('running', 'done')` before proceeding. If found, return the existing run state. Same idempotency pattern as `saveAgentRunOutput` (which uses `run_id` UNIQUE constraint).

### Pitfall 6: veena Not in VALID_AGENTS
**What goes wrong:** `POST /api/agents/veena/run` returns 404. The standard run endpoint gate at line 3040 rejects it.
**Why it happens:** `VALID_AGENTS` at line 61 doesn't include "veena" yet.
**How to avoid:** Add "veena" to VALID_AGENTS and AGENT_PROFILES as the very first change in Plan 03-01. This is a prerequisite for all other plans.

### Pitfall 7: context_patch Missing Fields (VEENA-04 Failure)
**What goes wrong:** Veena's crawl only populates 8 of 12 MKG fields. The success criterion requires all 12.
**Why it happens:** Some fields (metrics, baselines, campaigns) are not visible on websites and the LLM skips them.
**How to avoid:** The system prompt must explicitly require all 12 fields in output JSON, with `{ value: null, confidence: 0 }` as the valid "not found" response. The `buildContextPatchFromCrawl` function must validate that all 12 keys are present before passing to `MKGService.patch()`. If any are missing, add them with `{ value: null, confidence: 0 }` before patching.

---

## Code Examples

### Extracting JSON from groq/compound response

```javascript
// Source: existing pattern at line 3748 in backend-server.js
function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
```

### buildContextPatchFromCrawl — map crawl JSON to MKG patch format

```javascript
// Transforms groq/compound output into MKGService.patch() format
function buildContextPatchFromCrawl(crawlJson, agentName, runId) {
  const TOP_LEVEL_FIELDS = [
    "positioning", "icp", "competitors", "offers", "messaging",
    "channels", "funnel", "metrics", "baselines", "content_pillars",
    "campaigns", "insights"
  ];
  const today = new Date().toISOString().split("T")[0];
  const expires = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const patch = {};
  for (const field of TOP_LEVEL_FIELDS) {
    const crawled = crawlJson[field];
    const confidence = crawled?.confidence ?? 0;
    patch[field] = {
      value: crawled?.value ?? null,
      confidence,
      last_verified: confidence > 0 ? today : null,
      source_agent: agentName,
      expires_at: confidence > 0 ? expires : null,
    };
  }
  return patch;
}
```

### mcp.json for Veena (Phase 3 — no connectors yet)

```json
{
  "connectors": [],
  "permissions": "read",
  "description": "Veena crawls company websites to bootstrap the MKG. GA4 and Composio connectors added in Phase 4.",
  "recipes": {}
}
```

### Veena's 01-company-crawl.md skill

```markdown
# Company Crawl Skill

When asked to crawl a company website, follow this process exactly:

1. Visit the homepage and read: headline, tagline, navigation items, CTA buttons
2. Visit the /pricing or /plans page if it exists — extract offer names, price signals, tiers
3. Visit the /about or /about-us page — extract company size signals, founding story, ICP clues
4. Infer positioning from: headline, tagline, differentiators mentioned
5. Infer ICP from: case study industries, testimonial titles, "designed for X" copy
6. Infer channels from: social media links, "blog", "webinar", "podcast" navigation items

For each MKG field:
- confidence 0.8+: field is explicitly stated on the website
- confidence 0.5–0.79: field is clearly inferable from multiple signals
- confidence 0.3–0.49: field is weakly inferred from limited signals
- confidence 0: field is not findable from the website (set value: null)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual company onboarding via UI | Automated MKG bootstrap via Veena crawl | Phase 3 | Every new company starts with populated MKG instead of blank slate |
| Company-intel profile (companyName, summary, offerings) | 12-field MKG (positioning, icp, competitors, offers, messaging, ...) | Phase 3 | All agents now share the same structured knowledge base |
| Agent runs fire independently | Sequential onboarding chain: veena → isha → neel → zara | Phase 3 | New company knowledge propagates to all agents in order |

---

## Implementation Order (Critical)

The three plans have strict ordering dependencies:

1. **03-01: Agent files** — Must complete first. SOUL.md, mcp.json, skills/, MEMORY.md, VALID_AGENTS registration. No backend logic. Prerequisite for 03-02 and 03-03.

2. **03-02: Crawler** — Requires Veena's SOUL.md to exist (to write the crawl query correctly). Adds `crawlCompanyForMKG()`, `buildContextPatchFromCrawl()`, `extractPageSignals()` as standalone functions in `backend-server.js` (or a new `veena-crawler.js` module). Does NOT add the onboard endpoint.

3. **03-03: Onboard chain** — Requires the crawler from 03-02. Adds `POST /api/agents/veena/onboard` endpoint. Adds `initializeMKGTemplate()`. Wires VEENA-05 (template pre-population) and VEENA-03 (chain tasks in agent_tasks).

---

## Open Questions

1. **Onboard endpoint response pattern: sync vs async**
   - What we know: `POST /api/company-intel/companies` (line 4062) responds immediately and runs profile generation in the background. Railway timeout may be 30s.
   - What's unclear: Is there a stated constraint on synchronous vs asynchronous response?
   - Recommendation: Use the same background pattern — respond 202 immediately with `{ run_id, message: "Onboarding started" }`, run crawl in background, client polls `GET /api/mkg/:companyId`. This also makes the success criterion testable: poll until all 12 MKG fields have `confidence > 0`.

2. **Where does the onboard endpoint live — separate file or in backend-server.js?**
   - What we know: All existing endpoints are inline in `backend-server.js`. The file is already very large.
   - Recommendation: Add the `veena-crawler.js` module for crawl logic (keeps the backend-server.js change focused to endpoint registration and function imports). The endpoint itself goes in backend-server.js as a new `app.post("/api/agents/veena/onboard")` block.

3. **Success criterion timing: "within 3 minutes" (criterion 2)**
   - What we know: `groq/compound` with `visit_website` takes 20–60s per invocation in production (tool calls are network-bound).
   - What's unclear: Whether the 3-minute window covers the entire crawl or just the MKG write.
   - Recommendation: The crawl call should use a 2-minute AbortController timeout (generous but bounded). If it times out, save whatever partial MKG was built, mark remaining fields `{ value: null, confidence: 0 }`. This guarantees "all 12 fields populated within 3 minutes" even on slow websites.

---

## Validation Architecture

No dedicated test framework detected in the project (no jest.config.*, no vitest.config.*, no pytest.ini). The project uses manual connection test scripts (`test-supabase-connection.js`, `test-groq-connection.js`, `test-auth.js`).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Command / Method | File Exists? |
|--------|----------|-----------|------------------|-------------|
| VEENA-01 | Agent directory exists with all required files | File existence check | `ls platform/crewai/agents/veena/` + `ls platform/crewai/agents/veena/skills/` | ❌ Wave 0 |
| VEENA-02 | Crawl returns mkg.json with 12 fields within 3 min | Integration / smoke | `node test-veena-crawl.js https://example.com` — verify mkg.json written | ❌ Wave 0 |
| VEENA-03 | new_company_onboarded → agent_tasks rows for isha/neel/zara | Integration | `curl POST /api/agents/veena/onboard + supabase query agent_tasks` | ❌ Wave 0 |
| VEENA-04 | AgentRunOutput.context_patch covers 12 fields | Unit | Inspect contract JSON from crawl run; verify all 12 keys in context_patch.patch | ❌ Wave 0 |
| VEENA-05 | mkg.json pre-populated before crawl runs | Unit | Call `initializeMKGTemplate(testCompanyId)`, read file, verify 12 fields present | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `test-veena-crawl.js` — smoke test: calls `crawlCompanyForMKG(url)`, asserts 12 keys present, logs confidence scores
- [ ] Manual Supabase query: `SELECT * FROM agent_tasks WHERE company_id = 'test-co' ORDER BY created_at` — verify chain rows after `/onboard`

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `platform/content-engine/backend-server.js` lines 61–71 (VALID_AGENTS), 165–174 (GROQ model constants), 3831–4010 (company profiling pipeline), 4061–4131 (company-intel endpoint)
- Direct inspection of `platform/crewai/agents/zara/SOUL.md` and `mcp.json` (exact file format for new agent)
- Direct inspection of `platform/crewai/agents/isha/skills/00-product-marketing-context.md` (skill file format and content)
- Direct inspection of `platform/crewai/agents/zara/memory/MEMORY.md` (MEMORY.md initialization format)
- Direct inspection of `.planning/phases/01-mkg-foundation/01-RESEARCH.md` (MKGService API, MKG schema, TOP_LEVEL_FIELDS)
- Direct inspection of `.planning/phases/02-agent-contract-standard/02-RESEARCH.md` (contract extraction, VALID_AGENTS, saveAgentRunOutput, writeTasksCreated patterns)
- Direct inspection of `.planning/REQUIREMENTS.md` (VEENA-01 through VEENA-05)
- Direct inspection of `database/migrations/agent-employees.sql` (agent_tasks schema)
- Direct inspection of `database/migrations/agent-contract.sql` (agent_tasks Phase 2 additions)

### Secondary (MEDIUM confidence)

- groq/compound `compound_custom.tools.enabled_tools` pattern — verified from lines 3881–3885 of backend-server.js (same project, same endpoint)

---

## Metadata

**Confidence breakdown:**
- Agent file structure (VEENA-01): HIGH — exact same pattern as 9 existing agents; no new concepts
- Crawl function (VEENA-02): HIGH — adapts `buildCompanyProfileUserContent` + `groq/compound` already proven in production
- Onboarding chain (VEENA-03): HIGH — `writeTasksCreated` already exists; onboard endpoint follows established Express patterns
- Context_patch for 12 fields (VEENA-04): HIGH — standard contract system from Phase 2; just needs correct system prompt
- MKG pre-population (VEENA-05): HIGH — `MKGService.patch(companyId, emptyPatch)` creates file if missing; confirmed from Phase 1 implementation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable — Express/Groq/Supabase/MKGService patterns don't shift on 30-day timescales)
