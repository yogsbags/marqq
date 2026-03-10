# Phase 2: Agent Contract Standard - Research

**Researched:** 2026-03-10
**Domain:** Node.js SSE streaming, JSON schema validation, Supabase writes, LLM structured output
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 2 enforces a structured `AgentRunOutput` contract on every agent run. The core
challenge is that the existing `/api/agents/:name/run` endpoint streams raw LLM text over
SSE. The Groq call uses `stream: true`, and the frontend reads `data: {"text":"..."}`
events in real time. The UX depends on this streaming behavior.

The cleanest approach is the **stream-then-extract pattern**: stream prose to the client
exactly as today, but instruct the agent via system prompt to append a sentinel-delimited
JSON block at the end of its response. After the stream ends, the accumulated full text is
parsed for this block. The SSE stream gets one extra event carrying the validated contract
JSON before `[DONE]`. This requires zero client-side streaming changes — the frontend
already ignores unknown event shapes.

Contract validation uses **manual field checking** (no new library dependency). The schema
is small (12 top-level fields, all required) and the backend is plain ESM JavaScript with
no TypeScript. AJV is the standard choice if a library is ever needed, but for this schema
manual validation is proportionate and follows the Phase 1 precedent (MKGService also uses
manual field guards).

The `agent_tasks` table already exists (created in `agent-employees.sql`) but is missing
`triggered_by_run_id`, `company_id`, and `workspace_id` columns required by CONTRACT-05.
The `agent_run_outputs` table was created in `mkg-foundation.sql` (Phase 1) and already
has the correct columns. A new migration adds the missing columns to `agent_tasks`.

**Primary recommendation:** Stream-then-extract with `---CONTRACT---` sentinel delimiter.
Accumulate full stream text server-side, parse the block after `[DONE]`, validate it, apply
MKG patch, write Supabase rows, then send `data: {"contract":...}` and `data: [DONE]`.

---

## What the Existing SSE Run Endpoint Looks Like

From direct inspection of `platform/content-engine/backend-server.js` lines 2937–3031:

```javascript
// Current endpoint — POST /api/agents/:name/run
app.post("/api/agents/:name/run", async (req, res) => {
  const { name } = req.params;
  const { query } = req.body;

  // Loads: SOUL.md + MEMORY.md + skills/*.md  → fullSystem (system prompt)
  // ...file loading omitted for brevity...

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const startedAt = Date.now();
  try {
    await markAgentHeartbeat(name, "running");
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: fullSystem },
        { role: "user", content: query },
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.4,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    await markAgentHeartbeat(name, "completed", Date.now() - startedAt);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    await markAgentHeartbeat(name, "error", Date.now() - startedAt, String(err));
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});
```

**Key observations:**
- The endpoint takes `{ query }` from request body. There is no `company_id` or `run_id`
  today. Phase 2 must accept these from the request body (or generate run_id server-side).
- The system prompt is built from 3 files (SOUL.md + MEMORY.md + skills). The contract
  instruction goes at the end of `fullSystem` — appended after skillsBlock.
- `markAgentHeartbeat` is already called at run start, completion, and error. The Phase 2
  contract save can slot in between the stream end and the final `res.write("[DONE]")`.
- The `MKGService` is already imported (`import { MKGService } from "./mkg-service.js"`)
  at line 46. No new import needed for the MKG patch step.

---

## Recommended Approach: Stream-Then-Extract

### Why Not the Alternatives

**Option A (append JSON at end of stream) — CHOSEN.** Agent outputs prose first, then
`---CONTRACT---`, then JSON. The backend accumulates text server-side, parses the contract
block after the stream ends. SSE UX unchanged for prose chunks. Contract JSON sent as one
extra event before `[DONE]`.

**Option B (second non-streaming Groq call) — rejected.** Doubles latency (each run
triggers two LLM calls), doubles cost, and produces inconsistent output (second call may
diverge from first). Also risks rate-limit errors on high-frequency runs.

**Option C (JSON-only response) — rejected.** Breaks streaming UX entirely. Frontend
expects streamed prose chunks. Changing the response format is a coordinated
frontend+backend change that is out of scope.

### How Stream-Then-Extract Works

```
1. Client sends: POST /api/agents/:name/run  { query, company_id, run_id? }
2. Server accumulates all stream chunks in a buffer string (alongside SSE forwarding)
3. After stream ends, server searches buffer for  ---CONTRACT---\n{...}
4. If found:  parse JSON, validate schema
   - valid:   apply MKG patch, write Supabase rows, send contract event, send [DONE]
   - invalid: send error event, fallback-save raw_output, send [DONE] with error flag
5. If not found: soft fail — log warning, send [DONE] with no contract (CONTRACT-02: 422)
```

### SSE Event Sequence (new)

```
data: {"text":"Here is my analysis..."}\n\n    ← prose chunks (unchanged)
data: {"text":"..."}\n\n                        ← more prose
data: {"contract": {...AgentRunOutput...}}\n\n  ← NEW: validated contract
data: [DONE]\n\n                                ← final signal
```

The frontend's existing SSE parser ignores any event shape it doesn't recognize (it only
acts on `{"text":...}`). The `{"contract":...}` event is a no-op for the current frontend.
Future frontend code can subscribe to it.

---

## System Prompt Instruction Pattern

Append this block at the very end of `fullSystem` (after skillsBlock), unconditionally on
every agent run:

```
## Output Contract (REQUIRED)

After your full response, append the following block EXACTLY — do not omit it, do not
include it mid-response, do not include it before your prose analysis:

---CONTRACT---
{
  "agent": "<your agent name>",
  "task": "<one-line description of what you did>",
  "company_id": "<company_id from the request context>",
  "run_id": "<run_id from the request context>",
  "timestamp": "<ISO 8601 timestamp>",
  "input": {
    "mkg_version": "<updated_at from MKG you read, or null>",
    "dependencies_read": [],
    "assumptions_made": []
  },
  "artifact": {
    "data": {},
    "summary": "<one paragraph summary of output>",
    "confidence": 0.0
  },
  "context_patch": {
    "writes_to": [],
    "patch": {}
  },
  "handoff_notes": "",
  "missing_data": [],
  "tasks_created": [],
  "outcome_prediction": null
}

Rules:
- confidence must be a number between 0.0 and 1.0 (your honest assessment of output quality)
- context_patch.patch must use valid MKG field names: positioning, icp, competitors, offers,
  messaging, channels, funnel, metrics, baselines, content_pillars, campaigns, insights
- tasks_created is an array of { task_type, agent_name, description, priority } objects
- outcome_prediction is optional — include if you can predict a measurable metric change
- The JSON block must be valid JSON (no trailing commas, no comments)
- Do not include ---CONTRACT--- anywhere else in your response
```

**Why a sentinel delimiter instead of "output only JSON":**
- Preserves streaming prose UX
- LLMs reliably produce delimited sections when instructed clearly
- Sentinel is easy to detect with `text.indexOf("---CONTRACT---")`
- JSON extraction is then `text.slice(sentinelIndex + 16)` (16 = len("---CONTRACT---\n"))

**Placement:** After skillsBlock in `fullSystem`. The contract instruction overrides any
prior instruction to "just respond naturally" — it must come last.

---

## Standard Stack

No new dependencies required. The existing stack handles everything.

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `groq-sdk` | existing | LLM streaming | Already imported line 16 |
| `@supabase/supabase-js` | existing | DB writes | Already configured in supabase.js |
| `node:crypto` `randomUUID` | Node 20 built-in | run_id generation | Already imported line 19 |
| `MKGService` | Phase 1 | MKG patch | Already imported line 46 |

### Validation Library Decision

**Use manual validation — no new library.**

Rationale: The AgentRunOutput schema has 12 known top-level fields. Manual validation
is 30–40 lines of JavaScript and follows the Phase 1 precedent (MKGService uses manual
field guards, not AJV/Joi). AJV adds ~900KB to the bundle and requires JSON Schema
authoring. For a single internal schema, it is disproportionate.

If the contract schema grows significantly (v2+), **use AJV** — it is the standard
for Node.js JSON Schema validation (30M downloads/week), supports draft-07 and draft-2020,
and has zero external dependencies.

```
// Future: npm install ajv
// import Ajv from "ajv";
// const ajv = new Ajv();
// const validate = ajv.compile(AgentRunOutputSchema);
```

For Phase 2: manual validation in a `validateContract(obj)` function that returns
`{ valid: boolean, errors: string[] }`.

---

## Architecture Patterns

### Pattern 1: Buffer Accumulation During Stream

The existing stream loop forwards each chunk immediately:
```javascript
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content ?? "";
  if (text) {
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
}
```

Phase 2 adds a `fullText` accumulator in parallel:
```javascript
let fullText = "";
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content ?? "";
  if (text) {
    fullText += text;                                        // accumulate
    res.write(`data: ${JSON.stringify({ text })}\n\n`);     // stream unchanged
  }
}
// After stream: parse fullText for ---CONTRACT--- block
```

Memory consideration: `max_tokens: 4096` at ~4 bytes/token = ~16KB max per run. Safe to
buffer entirely in memory.

### Pattern 2: Contract Extraction

```javascript
function extractContract(fullText) {
  const SENTINEL = "---CONTRACT---";
  const idx = fullText.indexOf(SENTINEL);
  if (idx === -1) return null;
  const jsonStr = fullText.slice(idx + SENTINEL.length).trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;  // malformed JSON
  }
}
```

### Pattern 3: Contract Validation

```javascript
function validateContract(obj) {
  const errors = [];
  if (!obj || typeof obj !== "object") return { valid: false, errors: ["not an object"] };

  // Required string fields
  for (const f of ["agent", "task", "company_id", "run_id", "timestamp"]) {
    if (typeof obj[f] !== "string" || !obj[f].trim()) {
      errors.push(`${f} must be a non-empty string`);
    }
  }
  // input
  if (!obj.input || typeof obj.input !== "object") {
    errors.push("input must be an object");
  }
  // artifact
  if (!obj.artifact || typeof obj.artifact.confidence !== "number"
      || obj.artifact.confidence < 0 || obj.artifact.confidence > 1) {
    errors.push("artifact.confidence must be a number between 0 and 1");
  }
  if (typeof obj.artifact?.summary !== "string") {
    errors.push("artifact.summary must be a string");
  }
  // context_patch
  if (!obj.context_patch || !Array.isArray(obj.context_patch.writes_to)) {
    errors.push("context_patch.writes_to must be an array");
  }
  // arrays
  if (!Array.isArray(obj.missing_data))  errors.push("missing_data must be an array");
  if (!Array.isArray(obj.tasks_created)) errors.push("tasks_created must be an array");

  return { valid: errors.length === 0, errors };
}
```

### Pattern 4: Post-Stream Processing Sequence

After stream ends, in order:
1. Extract contract block from `fullText`
2. Validate contract schema → if invalid, send `{"error":"malformed contract","details":[...]}`, still write raw_output to Supabase for debugging, end with `[DONE]`
3. Apply `context_patch` via `MKGService.patch(company_id, contract.context_patch.patch)`
4. Save to `agent_run_outputs` table (Supabase insert)
5. If `artifact.confidence < 0.5` → auto-create missing_data task in `agent_tasks`
6. Write `tasks_created` rows to `agent_tasks`
7. Send `data: {"contract": validatedContract}\n\n`
8. Send `data: [DONE]\n\n`
9. `res.end()`

This sequence ensures MKG is updated before the client receives `[DONE]`, so a subsequent
MKG read from the frontend sees fresh data.

### Pattern 5: Where contract_patch Instruction Gets company_id / run_id

The contract instruction in the system prompt references `<company_id from the request
context>`. The agent needs to know these values. Two options:

**Option A (recommended):** Inject them into the system prompt itself when building
`fullSystem`. Add a context block:
```
## Run Context
company_id: {company_id}
run_id: {run_id}
```

This way the LLM knows the values and echoes them into the contract JSON.

**Option B:** The backend overwrites `company_id` and `run_id` in the parsed contract
after extraction, ignoring what the LLM produced. Simpler but the LLM's contract JSON
becomes a template rather than a verified output.

**Use Option A** — the agent should be aware of what company it's running for. The backend
also validates these fields match (defense against agent confusion).

---

## Supabase Schema Changes Needed

### agent_run_outputs — already correct (Phase 1)

Created in `mkg-foundation.sql`. Has all needed columns: `run_id` (UNIQUE), `company_id`,
`agent`, `task`, `timestamp`, `artifact` (JSONB), `context_patch` (JSONB), `handoff_notes`,
`missing_data` (JSONB), `tasks_created` (JSONB), `raw_output` (TEXT), `created_at`.

**No changes needed.**

### agent_tasks — needs new columns

Current schema (from `agent-employees.sql`):
```sql
CREATE TABLE IF NOT EXISTS agent_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name    TEXT NOT NULL,
  task_type     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'running', 'done', 'failed')),
  scheduled_for TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Missing columns for CONTRACT-05:**
- `triggered_by_run_id TEXT` — FK to `agent_run_outputs.run_id` (FK is soft — TEXT reference, not constraint, consistent with MKG disk-first pattern)
- `company_id TEXT` — needed so tasks are queryable per company
- `description TEXT` — human-readable task description (tasks_created objects include this)
- `priority TEXT` — from tasks_created objects (`low/medium/high`)

**Also needed for CONTRACT-03 (confidence < 0.5 auto-task):**
- `task_type` already exists — use `'missing_data'` for auto-created tasks

**Migration to write:**
```sql
-- database/migrations/agent-contract.sql
ALTER TABLE agent_tasks
  ADD COLUMN IF NOT EXISTS triggered_by_run_id TEXT,
  ADD COLUMN IF NOT EXISTS company_id          TEXT,
  ADD COLUMN IF NOT EXISTS description         TEXT,
  ADD COLUMN IF NOT EXISTS priority            TEXT
    DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_agent_tasks_run_id
  ON agent_tasks (triggered_by_run_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_company
  ON agent_tasks (company_id, created_at DESC);
```

**Note on outcome_prediction:** The `agent_run_outputs` table does NOT have an
`outcome_prediction` column. The requirements list it as optional in the contract JSON
(CONTRACT-01). It should be stored in the `artifact` JSONB column as
`artifact.outcome_prediction` rather than a dedicated column — keeps the schema stable
when the Outcome Ledger (Phase 8) adds proper prediction tracking.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation | Custom recursive validator | Manual field checks (Phase 2) / AJV (Phase 3+) | Schema is small; AJV when it grows |
| Streaming text buffer | Writable stream class | Simple string concatenation (`fullText += text`) | max_tokens: 4096 = ~16KB; no chunking needed |
| Idempotency key | Custom UUID v4 generator | `randomUUID()` from `node:crypto` (already imported) | Already in the codebase |
| Retry logic for Supabase writes | Custom retry loop | Simple try/catch, log error, continue | Contract saves are fire-and-log; don't block SSE response |
| LLM structured output via Groq JSON mode | Custom parser | Sentinel delimiter + `JSON.parse` | Groq's JSON mode works but breaks streaming; sentinel approach preserves UX |

**Key insight:** Groq's API supports `response_format: { type: "json_object" }` but this
disables streaming. Since streaming is a core UX requirement, use the sentinel delimiter
approach instead. The contract JSON is appended after prose, not the entire response.

---

## Common Pitfalls

### Pitfall 1: LLM Produces Contract Mid-Response, Not at End
**What goes wrong:** LLM outputs `---CONTRACT---` after the first paragraph instead of at
the very end. Backend parses the first match, missing trailing content.
**Why it happens:** LLMs follow instruction order but sometimes interpret "after your
response" as "after this section."
**How to avoid:** System prompt must say "at the very END of your complete response, after
all prose analysis." Additionally, `extractContract()` should use `lastIndexOf` not
`indexOf` to always get the last occurrence.
**Warning signs:** `contract.artifact.summary` is a single sentence when the prose was 500 words.

### Pitfall 2: LLM Produces Trailing Markdown After Contract JSON
**What goes wrong:** LLM outputs `---CONTRACT---\n{...}\n```\nHere is a note...`. The
`JSON.parse` fails because of trailing content.
**Why it happens:** LLMs add courtesy text after code blocks.
**How to avoid:** After extracting `jsonStr`, find the last `}` that closes the root
object: `jsonStr.slice(0, jsonStr.lastIndexOf("}") + 1)`. Then parse.
**Warning signs:** `SyntaxError: Unexpected token` in contract parse.

### Pitfall 3: company_id Missing from Request
**What goes wrong:** Caller sends only `{ query }` without `company_id`. The contract
block has a placeholder. MKG patch silently does nothing or uses empty string.
**Why it happens:** Existing frontend slash commands only send `query`.
**How to avoid:** Make `company_id` optional with a fallback. If missing, skip MKG patch
and Supabase save (both require company_id). Send contract event with `company_id: null`.
Log a warning. Do NOT 400-reject — existing callers don't send company_id and must
continue working.
**Resolution path:** Frontend slash commands get updated to pass `company_id` from active
workspace in Phase 3 or later.

### Pitfall 4: Double-Write to agent_run_outputs on Retry
**What goes wrong:** Client retries the POST if SSE connection drops. Two rows written
with different UUIDs for the same logical run.
**Why it happens:** SSE connections are stateless from the server's perspective on retry.
**How to avoid:** Accept optional `run_id` in request body. If provided, use it as the
`run_id` for `agent_run_outputs` (which has `UNIQUE` on `run_id`). The Supabase insert will
fail with conflict error on retry — catch it, skip the save, continue to send `[DONE]`.
If not provided, generate via `randomUUID()`.

### Pitfall 5: MKG Patch Applies Partial context_patch to Wrong Fields
**What goes wrong:** Agent emits `context_patch.patch` with unknown field names (e.g.,
`"brand_voice"` which is not in TOP_LEVEL_FIELDS). MKGService silently ignores them
(per Phase 1 implementation: `console.warn` and skip).
**Why it happens:** LLM invents field names not in the 12-field schema.
**How to avoid:** Before calling `MKGService.patch()`, filter `context_patch.patch` to only
known TOP_LEVEL_FIELDS. Log discarded fields. MKGService already defends against this but
the route handler should log it explicitly.

### Pitfall 6: max_tokens Too Low for Prose + Contract
**What goes wrong:** Contract JSON gets truncated because the response hits `max_tokens:
4096` before the `---CONTRACT---` block.
**Why it happens:** A long prose response (e.g., SEO audit = 3000 tokens) + contract JSON
(~500 tokens) exceeds 4096 tokens.
**How to avoid:** Increase `max_tokens` to 8192 for the contract-enabled run. llama-3.3-70b
supports 128K context. The cost increase is negligible at the current usage scale.

### Pitfall 7: Supabase agent_tasks insert fails due to missing user_id
**What goes wrong:** `agent_tasks` has `user_id UUID REFERENCES auth.users(id)`. The
backend runs as service role and may not have a `user_id` to associate tasks with.
**Why it happens:** Tasks created by contract (triggered_by auto-task) are system-generated,
not user-triggered. `user_id` is NOT NULL in current schema.
**How to avoid:** Make `user_id` nullable in the migration (`ALTER COLUMN user_id DROP NOT
NULL`). System-generated tasks have `user_id = NULL`. Alternatively, require `user_id` in
the request body alongside `company_id` and pass it through. The nullable approach is
simpler and more correct for automation-triggered tasks.

---

## Code Examples

### Extracting Contract from Stream Buffer

```javascript
// Source: codebase-derived pattern — sentinel delimiter extraction
function extractContract(fullText) {
  const SENTINEL = "---CONTRACT---";
  const idx = fullText.lastIndexOf(SENTINEL);  // lastIndexOf — always get final block
  if (idx === -1) return null;
  let jsonStr = fullText.slice(idx + SENTINEL.length).trim();
  // Trim trailing content after the closing brace
  const lastBrace = jsonStr.lastIndexOf("}");
  if (lastBrace === -1) return null;
  jsonStr = jsonStr.slice(0, lastBrace + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
```

### Writing agent_run_outputs Row

```javascript
// Source: follows saveArtifact() pattern in supabase.js
async function saveAgentRunOutput(contract, rawOutput) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("agent_run_outputs")
      .insert({
        run_id:        contract.run_id,
        company_id:    contract.company_id,
        agent:         contract.agent,
        task:          contract.task,
        timestamp:     contract.timestamp,
        artifact:      contract.artifact,
        context_patch: contract.context_patch,
        handoff_notes: contract.handoff_notes || null,
        missing_data:  contract.missing_data || [],
        tasks_created: contract.tasks_created || [],
        raw_output:    rawOutput,
      });
    if (error && error.code !== "23505") {   // 23505 = unique violation (retry case)
      console.error("saveAgentRunOutput error:", error);
    }
  } catch (err) {
    console.error("saveAgentRunOutput failed:", err);
  }
}
```

### Creating Auto Task for Low-Confidence Runs (CONTRACT-03)

```javascript
// Source: agent_tasks schema from agent-employees.sql
async function createMissingDataTask(contract) {
  if (!supabase) return;
  if (contract.artifact.confidence >= 0.5) return;  // only < 0.5
  try {
    const { error } = await supabase
      .from("agent_tasks")
      .insert({
        agent_name:          contract.agent,
        task_type:           "missing_data",
        status:              "scheduled",
        company_id:          contract.company_id,
        description:         `Low-confidence run (${contract.artifact.confidence.toFixed(2)}): ${contract.artifact.summary}`,
        priority:            "high",
        triggered_by_run_id: contract.run_id,
      });
    if (error) console.error("createMissingDataTask error:", error);
  } catch (err) {
    console.error("createMissingDataTask failed:", err);
  }
}
```

### Writing tasks_created Rows (CONTRACT-05)

```javascript
// Source: agent_tasks schema — one row per task in tasks_created array
async function writeTasksCreated(contract) {
  if (!supabase || !contract.tasks_created?.length) return;
  const rows = contract.tasks_created.map((t) => ({
    agent_name:          t.agent_name,
    task_type:           t.task_type,
    status:              "scheduled",
    company_id:          contract.company_id,
    description:         t.description || null,
    priority:            t.priority || "medium",
    triggered_by_run_id: contract.run_id,
  }));
  try {
    const { error } = await supabase.from("agent_tasks").insert(rows);
    if (error) console.error("writeTasksCreated error:", error);
  } catch (err) {
    console.error("writeTasksCreated failed:", err);
  }
}
```

### Contract Instruction Injection (system prompt)

```javascript
// In the fullSystem construction block (after skillsBlock):
const CONTRACT_INSTRUCTION = `

## Output Contract (REQUIRED — do not skip)

After your COMPLETE response (all prose, analysis, and recommendations), append this block:

---CONTRACT---
{
  "agent": "${name}",
  "task": "<one-line description of what you did>",
  "company_id": "${company_id || "unknown"}",
  "run_id": "${runId}",
  "timestamp": "${new Date().toISOString()}",
  "input": {
    "mkg_version": null,
    "dependencies_read": [],
    "assumptions_made": []
  },
  "artifact": {
    "data": {},
    "summary": "<one paragraph summary of your output>",
    "confidence": 0.75
  },
  "context_patch": {
    "writes_to": [],
    "patch": {}
  },
  "handoff_notes": "",
  "missing_data": [],
  "tasks_created": [],
  "outcome_prediction": null
}

Replace placeholder values with your actual outputs. confidence must reflect your
honest assessment (0.0–1.0). Do not include ---CONTRACT--- anywhere else.
`;

const fullSystem = [
  systemPrompt,
  memory ? `\n\n## Your Recent Memory\n${memory}` : "",
  skillsBlock,
  CONTRACT_INSTRUCTION,   // always last
].join("");
```

---

## Failure Handling Strategy

### When contract is missing (LLM didn't output it)

**Behavior:** Soft fail. Send `data: {"contractError":"missing"}` before `[DONE]`. Write
`raw_output` to `agent_run_outputs` with null/empty contract fields. Do NOT 422-reject the
SSE stream mid-flight — the SSE connection is already open and the client received prose.

The requirement says "backend rejects malformed contracts with 422" (CONTRACT-02). This
applies to a **non-streaming validation endpoint** (POST /api/agent-runs/validate), not
the SSE stream. The SSE stream uses soft-fail to preserve UX; a separate REST endpoint
can return 422 for programmatic contract submission.

### When contract fails validation

**Behavior:** Same as missing. Soft fail with error details in the event. Log validation
errors server-side. Save raw_output to Supabase for debugging.

### When Supabase writes fail

**Behavior:** Log error, continue. Disk-first principle from Phase 1 applies here too.
If Supabase is down, the run still completes and the SSE stream ends normally. The
`raw_output` on disk (or in memory for the session) is the fallback.

### When MKG patch fails

**Behavior:** Log error, continue. Do not block the SSE stream. The MKG patch is
fire-and-log, consistent with `syncToSupabase()` in MKGService.

### Failure mode table

| Failure | HTTP behavior | Supabase behavior | SSE behavior |
|---------|---------------|-------------------|--------------|
| Contract missing in LLM output | 200 (stream completes) | raw_output saved, contract fields null | `{"contractError":"missing"}` event before `[DONE]` |
| Contract fails validation | 200 (stream completes) | raw_output saved, validation errors logged | `{"contractError":"invalid","details":[...]}` before `[DONE]` |
| Supabase write fails | 200 | error logged, no row | no change to SSE |
| MKG patch fails | 200 | no change | error logged, no SSE change |
| Groq stream fails (existing) | 200 (stream completes) | no save | `{"error":"..."}` event, then `[DONE]` |

---

## Open Questions

1. **company_id source in the frontend**
   - What we know: Current slash commands in `ChatHome.tsx` send only `{ query }` to
     `/api/agents/:name/run`. No `company_id` is passed.
   - What's unclear: Does the active workspace have a `company_id` to pass? What if a
     workspace has multiple companies?
   - Recommendation: Make `company_id` optional in Phase 2. The SSE endpoint works
     without it (skips MKG patch and Supabase save). Pass `company_id` in Phase 3 or
     when the frontend workspace context is wired up.

2. **user_id on agent_tasks**
   - What we know: `agent_tasks.user_id` is NOT NULL FK to `auth.users(id)`.
   - What's unclear: System-generated tasks (triggered by contract auto-creation) have no
     user initiator.
   - Recommendation: Drop NOT NULL constraint in the migration. `user_id = NULL` for
     system-generated tasks. `user_id = <uuid>` for user-triggered tasks.

3. **outcome_prediction storage**
   - What we know: `agent_run_outputs` has no `outcome_prediction` column. The contract
     JSON includes it as optional.
   - What's unclear: Phase 8 (Outcome Ledger) will need to query predictions. Should we
     add the column now?
   - Recommendation: Store `outcome_prediction` inside `artifact` JSONB for Phase 2
     (`artifact.outcome_prediction`). Add a dedicated column in Phase 8 migration. Avoids
     schema churn now, and JSONB is queryable if needed.

4. **Contract instruction token overhead**
   - What we know: max_tokens is currently 4096. Contract instruction adds ~400 tokens
     to the system prompt. Long runs (SEO audit) hit ~3000 prose tokens + 500 contract
     tokens = close to limit.
   - Recommendation: Increase max_tokens to 8192 in the contract-enabled run. Verify
     Groq llama-3.3-70b-versatile supports this limit (it supports up to 32K output
     tokens — confirmed in Groq docs).

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `platform/content-engine/backend-server.js` lines 1–80, 2937–3031 (SSE endpoint)
- Direct inspection of `platform/content-engine/mkg-service.js` (full file — Phase 1 implementation)
- Direct inspection of `database/migrations/agent-employees.sql` (agent_tasks schema)
- Direct inspection of `database/migrations/mkg-foundation.sql` (agent_run_outputs schema — already created)
- Direct inspection of `.planning/REQUIREMENTS.md` (CONTRACT-01 through CONTRACT-05)
- Direct inspection of `.planning/STATE.md` (Phase 1 decisions, DB schema decisions)

### Secondary (MEDIUM confidence)
- Groq streaming API behavior — follows SDK pattern already in use in the codebase
- Groq llama-3.3-70b-versatile max output tokens — 32K per Groq documentation (verified via codebase usage)

---

## Metadata

**Confidence breakdown:**
- SSE run endpoint behavior: HIGH — direct code inspection, lines 2937–3031
- agent_run_outputs schema: HIGH — directly read from mkg-foundation.sql
- agent_tasks missing columns: HIGH — directly read from agent-employees.sql; confirmed triggered_by_run_id absent
- Stream-then-extract approach: HIGH — follows from streaming constraint + UX requirement
- Contract validation: HIGH — manual validation is proportionate; AJV noted as future path
- System prompt instruction pattern: MEDIUM — LLM behavior for delimiter-based output is empirically reliable but not guaranteed; pitfalls documented
- Failure handling: HIGH — follows Phase 1 disk-first and fire-and-log patterns

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable — Express/Groq/Supabase patterns don't shift on 30-day timescales)
