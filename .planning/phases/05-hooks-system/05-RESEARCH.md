# Phase 5: Hooks System - Research

**Researched:** 2026-03-10
**Domain:** config-driven scheduling, signal polling, MKG baseline diffs, SSE agent dispatch, Supabase task orchestration
**Confidence:** HIGH (direct codebase inspection of `platform/content-engine/backend-server.js`, `platform/crewai/autonomous_scheduler.py`, `platform/content-engine/mkg-service.js`, existing migrations, and prior phase research)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOOKS-01 | `platform/content-engine/hooks.json` defines scheduled triggers and signal_triggers | Existing scheduled jobs are hard-coded in `platform/crewai/autonomous_scheduler.py`. Replace those literals with config loaded from one shared JSON file. |
| HOOKS-02 | Required signal mappings exist (`traffic_drop_20pct_7d`, `new_company_onboarded`, `campaign_anomaly`, `competitor_move`) | Current agent roster already contains `tara`, `kiran`, `priya`, `neel`, `veena`, `isha`, `zara`, `dev`; Phase 4 rewrites roles, so Phase 5 should bind by rewritten runtime names. |
| HOOKS-03 | `HooksEngine` evaluates Supabase `agent_signals` every heartbeat | No `agent_signals` table exists today. Phase 5 needs a polling engine in `platform/content-engine/` plus a small migration or precondition to create/read/update signal rows. |
| HOOKS-04 | Evaluation is diff-from-baseline using MKG baselines | `MKGService.read(companyId)` already exposes `baselines` and `metrics`; the engine should read MKG per company and compute delta against `baselines.value`, never compare against global constants alone. |
| HOOKS-05 | Triggered runs fire through the existing SSE `/api/agents/:name/run` path with `triggered_by: signal` metadata | `POST /api/agents/:name/run` already exists and accepts JSON body. Extend the body schema with trigger metadata, preserve current SSE behavior, and route hook dispatch through the same execution path. |

</phase_requirements>

---

## Summary

Phase 5 should not introduce a second orchestration system. The repository already has two critical pieces: a Python APScheduler process for cron-based execution in `platform/crewai/autonomous_scheduler.py`, and a Node/Express SSE execution path in `platform/content-engine/backend-server.js`. The correct implementation is to make `hooks.json` the single source of truth for trigger definitions, then have:

1. the Python scheduler load `scheduled` hooks from that file instead of hard-coded cron jobs, and
2. a new Node-side `HooksEngine` load `signal_triggers`, poll Supabase `agent_signals` every heartbeat, evaluate diff-from-baseline using MKG, and dispatch agent runs through the same `/api/agents/:name/run` execution flow.

The current codebase is already close enough to support this cleanly:
- scheduled runs already exist and are reliable, but are hard-coded in Python;
- signal dispatch does not exist yet, but the SSE run endpoint, `agent_tasks` writing, and MKG patching already do;
- MKG includes a `baselines` envelope, which is the right home for per-company comparison baselines;
- `agent_signals` is the missing persistence layer and should be treated as a Phase 5 prerequisite even though the roadmap did not call out a separate migration plan item.

**Primary recommendation:** keep APScheduler for cron, add a Node `HooksEngine` for signal polling, drive both from `platform/content-engine/hooks.json`, and extend the existing run endpoint body with `triggered_by`, `trigger_id`, and `hook_id` so all triggered runs are traceable without creating a parallel agent execution path.

---

## Current Codebase Fit

### Existing scheduled execution path

`platform/crewai/autonomous_scheduler.py` already:
- uses APScheduler with `CronTrigger(timezone="Asia/Kolkata")`;
- updates `platform/crewai/heartbeat/status.json`;
- runs agents through `orchestrator.execute_for_scheduler(...)`;
- has all schedules embedded directly in `build_scheduler()`.

This means HOOKS-01 does **not** need a new scheduling library. It needs config extraction plus runtime validation.

### Existing agent dispatch path

`platform/content-engine/backend-server.js` already:
- exposes `POST /api/agents/:name/run`;
- streams token output over SSE;
- persists `agent_run_outputs`;
- writes follow-up tasks to `agent_tasks`;
- applies `context_patch` to MKG through `MKGService.patch(...)`.

This is the path hook-triggered runs must reuse. Do not build a separate “hook runner” that bypasses the contract validator or MKG patching.

### Existing baseline source

`platform/content-engine/mkg-service.js` already guarantees the 12 top-level MKG fields exist, including:
- `metrics`
- `baselines`
- `campaigns`
- `insights`

That is enough structure to support company-specific baseline comparison now. The engine just needs to define the expected shape of `baselines.value`.

### Missing pieces

The repository currently has no:
- `platform/content-engine/hooks.json`
- `HooksEngine` module
- `agent_signals` table or accessor
- signal dedupe / acknowledgement model
- way for `/api/agents/:name/run` to record trigger metadata in the run context

Those are the real implementation gaps for Phase 5.

---

## Standard Stack

No new core dependency is required.

| Library / Runtime | Use | Why it fits this repo |
|-------------------|-----|-----------------------|
| APScheduler (existing Python dep) | Scheduled hooks | Already installed and used in `autonomous_scheduler.py` with IST cron support |
| Express + native `fetch` (Node 20) | Signal polling and dispatch | Backend is already Node 20 ESM and can poll Supabase / self-dispatch without extra infra |
| `@supabase/supabase-js` (existing) | Read/update `agent_signals` and `agent_tasks` | Already used in `backend-server.js` and `mkg-service.js` |
| `node:fs/promises` | Read and validate `hooks.json` | Already used throughout backend |
| Existing `MKGService` | Read company baselines before firing signals | Already guarantees stable MKG shape |

### Use Zod only if config validation must live in app code

The root app already includes `zod`, but Phase 5 does not require it. A small manual validator for `hooks.json` is enough because:
- the config surface is small;
- backend files are plain JavaScript, not TypeScript;
- prior phases already use manual validation patterns.

If the team wants editor-safe config validation later, `zod` is already available and can be added without new package work.

---

## Architecture Patterns

### Pattern 1: Single source of truth config

Create `platform/content-engine/hooks.json` and make both runtimes consume it.

Recommended top-level shape:

```json
{
  "version": 1,
  "timezone": "Asia/Kolkata",
  "heartbeat_seconds": 60,
  "scheduled": [
    {
      "id": "veena-weekly-refresh",
      "agent": "veena",
      "task_type": "weekly_mkg_refresh",
      "cron": "0 6 * * mon",
      "query": "Refresh the Marketing Knowledge Graph for this company using the latest available context.",
      "enabled": true
    }
  ],
  "signal_triggers": [
    {
      "id": "traffic-drop-20pct-7d",
      "signal_type": "traffic_drop_20pct_7d",
      "enabled": true,
      "dispatch": [
        { "agent": "tara", "task_type": "traffic_drop_recovery_plan", "order": 1 },
        { "agent": "kiran", "task_type": "traffic_drop_social_response", "order": 2 }
      ],
      "condition": {
        "metric_path": "metrics.value.website_sessions_7d",
        "baseline_path": "baselines.value.website_sessions_7d",
        "operator": "pct_drop_gte",
        "threshold": 20
      },
      "cooldown_minutes": 1440
    }
  ],
  "chat_triggers": []
}
```

Why this shape fits the repo:
- `scheduled` maps directly onto APScheduler cron jobs.
- `signal_triggers` maps directly onto Supabase `agent_signals` rows and dispatch chains.
- `chat_triggers` can exist as an empty reserved section because the roadmap already names it in Plan `05-01`, but it should not affect scope for HOOKS-01..05.

### Pattern 2: Shared config loader, runtime-specific executors

Do not let Python and Node each invent their own parser.

Recommended file split:

```text
platform/content-engine/
  hooks.json
  hooks-config.js       # loadHooksConfig(), validateHooksConfig()
  hooks-engine.js       # Node signal polling engine

platform/crewai/
  autonomous_scheduler.py  # reads hooks.json for scheduled entries
```

`hooks-config.js` should:
- read the JSON file once on startup;
- validate unique `id` values;
- validate agent names against the same roster used by `backend-server.js`;
- reject invalid cron strings or malformed signal conditions early;
- expose `scheduled`, `signal_triggers`, `heartbeat_seconds`, `timezone`.

Python can read the same JSON file directly. There is no need for a shared polyglot parser beyond keeping the schema simple.

### Pattern 3: Signal row lifecycle in Supabase

Phase 5 needs a durable signal registry or the engine cannot dedupe, retry, or mark work complete.

Recommended `agent_signals` lifecycle:

1. producer inserts row with `status='pending'`
2. `HooksEngine` polls pending rows each heartbeat
3. engine loads matching hook definitions by `signal_type`
4. engine evaluates diff against MKG baseline
5. if condition passes, engine marks row `processing`, dispatches agents, then marks `triggered`
6. if condition fails, engine marks `ignored`
7. if dispatch errors, engine marks `failed` with message

Recommended row fields:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_id TEXT NOT NULL
signal_type TEXT NOT NULL
payload JSONB NOT NULL DEFAULT '{}'::jsonb
status TEXT NOT NULL DEFAULT 'pending'
observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
processed_at TIMESTAMPTZ
triggered_hook_ids JSONB
error_message TEXT
dedupe_key TEXT
created_by_agent TEXT
```

Add an index on `(status, observed_at)` and optionally `(company_id, signal_type, dedupe_key)`.

This table is a missing dependency today. The research conclusion from Phase 3 remains correct: `new_company_onboarded` is currently handled by a REST endpoint because `agent_signals` does not exist yet.

### Pattern 4: Diff-from-baseline evaluator

HOOKS-04 explicitly rejects absolute-threshold-only logic. The engine should evaluate signals using MKG baseline values stored per company.

Recommended rule model:

```js
function evaluatePctDrop(currentValue, baselineValue, thresholdPct) {
  if (typeof currentValue !== "number" || typeof baselineValue !== "number") {
    return { matched: false, reason: "missing_numeric_inputs" };
  }
  if (baselineValue <= 0) {
    return { matched: false, reason: "invalid_baseline" };
  }

  const deltaPct = ((baselineValue - currentValue) / baselineValue) * 100;
  return {
    matched: deltaPct >= thresholdPct,
    deltaPct,
    baselineValue,
    currentValue,
  };
}
```

Recommended source precedence for values:

1. `agent_signals.payload.current_value`
2. MKG `metrics.value[...]`
3. signal-specific payload field

Recommended source for baseline:

1. MKG `baselines.value[...]`
2. signal-specific `payload.baseline_value` only as fallback for transitional migration periods

The plan should standardize a concrete baseline schema inside `mkg.baselines.value`, for example:

```json
{
  "website_sessions_7d": 12500,
  "campaign_ctr_30d": 0.024,
  "paid_cpl_30d": 84.3,
  "competitor_publish_rate_14d": 6
}
```

Without this schema, Phase 5 will drift into stringly-typed condition logic.

### Pattern 5: Dispatch chains, not single-agent assumptions

HOOKS-02 includes both one-to-many and sequential flows:
- `traffic_drop_20pct_7d` → `tara` + `kiran`
- `new_company_onboarded` → full chain `veena → isha → neel → zara`
- `campaign_anomaly` → `zara` + `dev`
- `competitor_move` → `priya` + `neel`

That means each signal trigger should support an ordered dispatch array instead of a single `agent`.

Recommended semantics:
- `order` defines sequence
- same `order` values may run in parallel later, but Phase 5 should default to serial dispatch for simplicity
- `continue_on_error` should default to `false`

This aligns with existing onboarding-chain thinking from Phase 3 and avoids special-casing `new_company_onboarded`.

### Pattern 6: Same run path, enriched run metadata

Extend `POST /api/agents/:name/run` request body to accept:

```json
{
  "query": "...",
  "company_id": "acme",
  "triggered_by": "signal",
  "trigger_id": "uuid",
  "hook_id": "traffic-drop-20pct-7d",
  "task_type": "traffic_drop_recovery_plan",
  "signal_payload": {}
}
```

Why this is the correct integration:
- the endpoint already supports body-driven execution;
- contract extraction, MKG patching, `agent_tasks`, and heartbeat updates are already inside that flow;
- the LLM can receive trigger context in the `Run Context` block without changing the SSE contract.

Recommended prompt injection addition:

```text
## Trigger Context
triggered_by: signal
trigger_id: ...
hook_id: ...
task_type: ...
signal_payload: ...
```

This is the minimum change needed to satisfy HOOKS-05 and preserve existing UX.

---

## Implementation Guidance By Plan

### 05-01: `hooks.json` config file

Scope:
- create `platform/content-engine/hooks.json`
- define at least the roadmap-required scheduled and signal entries
- include a reserved `chat_triggers` array because the roadmap plan names it

Concrete recommendations:
- keep agent names aligned with Phase 4 runtime names only
- add `enabled`, `id`, `task_type`, `query`, and either `cron` or `condition`
- keep cron strings in standard 5-field format and lock timezone globally at `Asia/Kolkata`
- include cooldowns on signal hooks to prevent heartbeat thrash

Minimum required signal definitions:
- `traffic_drop_20pct_7d` → `tara`, `kiran`
- `new_company_onboarded` → `veena`, `isha`, `neel`, `zara`
- `campaign_anomaly` → `zara`, `dev`
- `competitor_move` → `priya`, `neel`

Because the roadmap success criteria mention “min 6 scheduled + 7 signal triggers per design”, Plan 05-01 should also define the extra entries now, even if only 4 are mandated in requirements. Otherwise Phase 5 can pass requirements textually but fail roadmap verification.

### 05-02: `HooksEngine` class

Scope:
- add `platform/content-engine/hooks-engine.js`
- poll `agent_signals` every `heartbeat_seconds`
- load MKG and evaluate configured signal conditions
- update signal statuses atomically

Recommended engine API:

```js
class HooksEngine {
  constructor({ supabase, loadConfig, mkgService, dispatchRun, logger, heartbeatSeconds = 60 }) {}
  async start() {}
  stop() {}
  async tick() {}
  async claimPendingSignals() {}
  async evaluateSignal(signalRow, hookDef) {}
  async dispatchHook(signalRow, hookDef) {}
}
```

Recommended startup location:
- initialize once from `backend-server.js` after Supabase and Express app bootstrap
- do not start it inside request handlers

Recommended polling model:
- `setInterval(..., heartbeatSeconds * 1000)` in Node
- skip overlapping ticks with an in-memory `isTickRunning` guard
- update a hook-engine heartbeat section inside `platform/crewai/heartbeat/status.json` only if visibility is needed

Recommended claim strategy:
- fetch only `status='pending'`
- immediately update selected rows to `processing`
- include `processed_at`
- if Supabase cannot guarantee row locking, keep claim batches small and accept single-instance assumption until multi-instance support is designed

### 05-03: Hook dispatch integration

Scope:
- route hook-triggered agent runs through the existing run path
- ensure `triggered_by: signal` metadata arrives in the LLM context and persisted outputs

Best implementation pattern:

1. extract the core of `/api/agents/:name/run` into a reusable function, for example `executeAgentRun({ name, body, onChunk })`
2. keep the HTTP endpoint as the SSE wrapper around that function
3. let `HooksEngine.dispatchHook(...)` call the same function directly with `onChunk: () => {}`

Why this is better than an HTTP loopback:
- no self-POST networking overhead
- no SSE parsing inside the same server
- same execution path still remains authoritative

If the team wants literal endpoint invocation for compliance evidence, a thin wrapper can still `fetch("http://127.0.0.1:${PORT}/api/agents/:name/run")`, but the execution logic should still be shared under the hood.

Also add a task row before dispatch:
- `agent_name`
- `task_type`
- `status='scheduled'`
- `company_id`
- `description` derived from signal + hook id

That gives operational visibility even if the run fails before `tasks_created` is produced.

---

## Don’t Hand-Roll

- Do not replace APScheduler with a custom cron loop. The repo already depends on APScheduler and it handles IST cron semantics correctly.
- Do not build a second agent execution pathway that bypasses `/api/agents/:name/run` logic. Contract validation and MKG patching already live there.
- Do not use absolute thresholds as the primary rule model. HOOKS-04 explicitly requires diff-from-baseline.
- Do not store signal dedupe state only in memory. It will break on restarts and make “within 60 seconds” verification unreliable.
- Do not encode hook definitions inside SOUL.md or Python dictionaries. `hooks.json` must stay the source of truth.

---

## Common Pitfalls

### Pitfall 1: Scheduled and signal systems drift apart

If Python uses hard-coded cron while Node uses `hooks.json`, the config will immediately become non-authoritative. Phase 5 must delete or replace the hard-coded `scheduler.add_job(...)` literals.

### Pitfall 2: Signal rows retrigger on every heartbeat

Without status transitions plus cooldowns, the same `traffic_drop_20pct_7d` row will dispatch on every 60-second poll. The engine needs both row status and hook-level cooldown handling.

### Pitfall 3: Missing MKG baselines cause false positives

If a company lacks `mkg.baselines.value.website_sessions_7d`, the engine should skip with a reason like `missing_baseline`, not fall back to zero or a global default.

### Pitfall 4: Trigger metadata is not persisted anywhere useful

If `triggered_by`, `trigger_id`, and `hook_id` only exist in memory, verification becomes guesswork. The run context and task description should contain this metadata.

### Pitfall 5: Phase 4 naming mismatch

Phase 5 depends on the rewritten 12-agent roster. Config should not bake assumptions from the old role descriptions. Validate against `VALID_AGENTS` at startup and fail fast if hooks reference unknown agents.

### Pitfall 6: Multi-instance race conditions

The current repo behaves like a mostly single-instance worker model. If multiple Node instances poll `agent_signals`, duplicate dispatches are likely without a real claim/update protocol. Research conclusion: acceptable for v1 only if claim transitions are explicit and deployment remains single active hook engine.

---

## Code Examples

### Config loader skeleton

```js
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOKS_PATH = join(__dirname, "hooks.json");

export async function loadHooksConfig() {
  const raw = await readFile(HOOKS_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  validateHooksConfig(parsed);
  return parsed;
}
```

### Signal evaluation skeleton

```js
async function evaluateSignalTrigger(signalRow, hookDef) {
  const mkg = await MKGService.read(signalRow.company_id);
  const currentValue = signalRow.payload?.current_value ?? mkg.metrics?.value?.website_sessions_7d;
  const baselineValue = mkg.baselines?.value?.website_sessions_7d;

  return evaluatePctDrop(currentValue, baselineValue, hookDef.condition.threshold);
}
```

### Dispatch body shape

```js
const body = {
  query: hookDef.query,
  company_id: signalRow.company_id,
  triggered_by: "signal",
  trigger_id: signalRow.id,
  hook_id: hookDef.id,
  task_type: dispatch.task_type,
  signal_payload: signalRow.payload ?? {},
};
```

### Scheduler hydration from config

```python
for hook in hooks_config["scheduled"]:
    if not hook.get("enabled", True):
        continue
    minute, hour, day, month, dow = hook["cron"].split()
    scheduler.add_job(
        lambda h=hook: run_agent(h["agent"], h["task_type"]),
        CronTrigger(
            minute=minute,
            hour=hour,
            day=day,
            month=month,
            day_of_week=dow,
            timezone=hooks_config.get("timezone", "Asia/Kolkata"),
        ),
        id=hook["id"],
        replace_existing=True,
    )
```

---

## Validation Architecture

Phase 5 has a concrete validation path and should not rely on manual spot checks alone.

### Unit validation

Validate pure logic without live services:
- `validateHooksConfig()` rejects duplicate ids, unknown agents, malformed cron, missing condition keys
- diff evaluators (`pct_drop_gte`, anomaly severity comparators, cooldown checks) behave correctly for edge cases
- dispatch chain ordering is preserved

Recommended approach:
- use Node’s built-in test runner or lightweight script-based assertions; this repo does not have a backend-specific Jest/Vitest setup today
- keep these tests under `platform/content-engine/`

### Integration validation

Validate the Node engine against real backend surfaces:
- seed a fake MKG file under `platform/crewai/memory/{companyId}/mkg.json`
- insert a pending `agent_signals` row in Supabase or a stubbed client
- run one `HooksEngine.tick()`
- assert:
  - signal row transitions to `triggered`
  - an `agent_tasks` row is inserted
  - dispatched run body contains `triggered_by: signal`

The integration seam to stub is the actual agent execution call, not MKGService.

### Acceptance validation

For roadmap success criteria, run these explicit checks:

1. Create/verify `platform/content-engine/hooks.json` contains populated `scheduled` and `signal_triggers`.
2. Insert `traffic_drop_20pct_7d` into `agent_signals` for a company whose MKG baseline supports a >20% drop.
3. Wait one heartbeat window (60 seconds).
4. Verify `agent_tasks` contains rows for `tara` and `kiran`.
5. Trigger a scheduled entry such as Veena’s Monday 06:00 IST hook in a controlled test window and verify task timestamps align with cron.

### Operational validation

Add lightweight runtime logs for:
- tick start / tick finish
- signal id claimed
- hook id matched
- baseline/current values used in evaluation
- dispatch success/failure per agent

Without these logs, Phase 5 failures will be difficult to distinguish between “signal not claimed”, “baseline missing”, and “dispatch failed”.

---

## Open Questions For Planning

- Should `agent_signals` be introduced as a dedicated Phase 5 migration, or is there an existing unpublished migration outside this repo? Current code inspection found none.
- Should the engine support parallel dispatch for same-order agents now, or stay serial-only for v1 simplicity?
- Should signal-triggered runs also create `agent_notifications`, or is `agent_tasks` sufficient until Outcome Ledger work lands?
- Does the team want hook-engine status surfaced in `heartbeat/status.json`, or is server logging enough?

The plan can proceed without resolving all four, but the first question (`agent_signals` persistence) is a real blocker for implementation.

---

## Planning Recommendation

Plan Phase 5 as three execution slices plus a small migration checkpoint:

1. `05-01`: define and validate `hooks.json`, including the full required signal roster and enough scheduled jobs to satisfy roadmap verification.
2. `05-02`: add `agent_signals` persistence and build `HooksEngine.tick()` with diff-from-baseline evaluation against MKG.
3. `05-03`: refactor the existing run endpoint into a reusable execution core and wire hook-triggered dispatch through it with trigger metadata.

That sequence preserves the current architecture, avoids duplicate execution paths, and gives the next phases a stable hook substrate for pipeline anomalies and swarm-generated competitor signals.
