---
phase: 05-hooks-system
verified: 2026-03-10T15:00:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed:
    - "pct_increase_gte operator now handled in evaluateSignalAgainstBaseline (lines 62-70, fall-through alias for pct_rise_gte) — competitor-move-response and message-conversion-lift signals can now match and dispatch"
    - "changed_from_baseline operator now handled in evaluateSignalAgainstBaseline (lines 71-78) — new_company_onboarded HOOKS-02 required chain (veena, isha, neel, zara) can now fire at runtime"
    - "hooks-engine.test.js now has 8 tests (was 4); 4 new behavioral unit tests added for pct_increase_gte (match and non-match) and changed_from_baseline (match and non-match) — all 8 pass"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Trigger a live new_company_onboarded signal row in Supabase and observe one HooksEngine heartbeat cycle"
    expected: "The signal row transitions from pending to triggered and all four agents (veena, isha, neel, zara) receive sequential dispatch calls through /api/agents/:name/run"
    why_human: "Requires live Supabase connection; automated tests stub Supabase and do not exercise the full pending-row poll-to-dispatch path"
  - test: "Start the backend and observe the HooksEngine heartbeat log during a 60-second window"
    expected: "A log entry showing HooksEngine tick completing within the configured heartbeat_seconds interval appears each minute"
    why_human: "Wall-clock timing cannot be verified by grep-based inspection"
  - test: "Insert a scheduled hook that fires in the next minute by temporarily modifying hooks.json cron, then observe autonomous_scheduler.py logs"
    expected: "APScheduler job registered by hook id fires the agent run at the configured cron boundary in Asia/Kolkata timezone"
    why_human: "Real cron boundary execution requires runtime observation; test_hooks_scheduler.py validates code structure only"
---

# Phase 5: Hooks System Verification Report

**Phase Goal:** A hooks.json config drives all scheduled and signal-triggered agent runs; a HooksEngine evaluates signal conditions every heartbeat using diff-from-baseline, so agents fire proactively without manual invocation.
**Verified:** 2026-03-10T15:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (3rd pass)

---

## Re-verification Summary

**Previous status:** gaps_found (2026-03-10T14:00:00Z)
**Previous score:** 7/8 truths verified (1 partial — runtime fixed, tests missing)

**Gap closed:**

The sole remaining gap was the absence of behavioral unit tests for `changed_from_baseline` and `pct_increase_gte` in `hooks-engine.test.js`. Four new tests have been added and confirmed passing:

- Test 4: `pct_increase_gte matches when current value rises by threshold or more` — `evaluateSignalAgainstBaseline({ currentValue: 130, baselineValue: 100, operator: 'pct_increase_gte', threshold: 25 })` returns `matched: true`, `deltaPct: 30`.
- Test 5: `pct_increase_gte does not match when rise is below threshold` — `evaluateSignalAgainstBaseline({ currentValue: 110, baselineValue: 100, operator: 'pct_increase_gte', threshold: 25 })` returns `matched: false`, `reason: 'below_threshold'`.
- Test 6: `changed_from_baseline matches when current differs from baseline` — `evaluateSignalAgainstBaseline({ currentValue: 2, baselineValue: 1, operator: 'changed_from_baseline', threshold: 1 })` returns `matched: true`.
- Test 7: `changed_from_baseline does not match when current equals baseline` — `evaluateSignalAgainstBaseline({ currentValue: 1, baselineValue: 1, operator: 'changed_from_baseline', threshold: 1 })` returns `matched: false`, `reason: 'below_threshold'`.

All test suites pass with zero regressions:

| Suite | Result |
|-------|--------|
| `hooks-engine.test.js` | 8/8 pass (was 4/4) |
| `hooks-config.test.js` | 6/6 pass |
| `hooks-dispatch.test.js` | 2/2 pass |
| `test_hooks_scheduler.py` | 3/3 pass |

**Regressions:** None. All previously-passing artifacts, key links, and truths remain intact.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `platform/content-engine/hooks.json` is the single source of truth for scheduled and signal-triggered runs, with `scheduled`, `signal_triggers`, and `chat_triggers` sections present | VERIFIED | File exists; 12 scheduled entries, 7 signal_triggers, `chat_triggers: []` present. All four HOOKS-02 mappings present by `signal_type`. |
| 2 | Config validation rejects malformed hook ids, unknown agents, malformed cron strings, duplicate ids, and missing required signal mappings before runtime dispatch starts | VERIFIED | `validateHooksConfig()` enforces all five failure modes. hooks-config.test.js passes 6 tests covering all scenarios. |
| 3 | The config loader exposes timezone and heartbeat settings so both Node signal evaluation and Python scheduler wiring consume the same hook definitions | VERIFIED | `loadHooksConfig()` in hooks-config.js is imported by hooks-engine.js. `autonomous_scheduler.py` reads the same hooks.json via `HOOKS_CONFIG_FILE`. |
| 4 | The required signal mappings exist in config for `traffic_drop_20pct_7d`, `new_company_onboarded`, `campaign_anomaly`, and `competitor_move`, aligned to the rewritten agent roster | VERIFIED | All four mappings confirmed in hooks.json with correct agent chains: tara+kiran, veena+isha+neel+zara, zara+dev, priya+neel. |
| 5 | `HooksEngine` polls pending Supabase signals every heartbeat, reads hook definitions from the shared config, and evaluates signals per company rather than globally | VERIFIED | `HooksEngine.tick()` polls `agent_signals` filtered by `status=pending`, fetches company MKG via `mkgReader(signalRow.company_id)`, evaluates per-row. |
| 6 | Signal matching uses company MKG baselines and current values to compute a diff-from-baseline result before dispatch, never only a hard-coded absolute threshold | VERIFIED | All four operators (`pct_drop_gte`, `pct_rise_gte`, `pct_increase_gte`, `changed_from_baseline`) are implemented and tested. hooks-engine.test.js now covers match and non-match cases for all new operators (8/8 pass). |
| 7 | Triggered hooks dispatch through the existing `POST /api/agents/:name/run` path with `triggered_by: signal` metadata instead of a parallel execution route | VERIFIED | `dispatchHookRun()` in backend-server.js calls the run endpoint with trigger metadata; `triggered_by`, `trigger_id`, `hook_id`, and `trigger_metadata` are set. |
| 8 | The Python APScheduler no longer hard-codes the schedule roster; it reads enabled scheduled hooks from the shared config and fires them at the configured IST cron times | VERIFIED | `build_scheduler()` loops over `iter_enabled_scheduled_hooks(resolved_hooks_config)` and creates `CronTrigger` objects. Python tests pass (3/3). |

**Score:** 8/8 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `platform/content-engine/hooks.json` | Shared hook definitions for scheduled, signal, and reserved chat trigger sections | VERIFIED | Exists; 12 scheduled, 7 signal_triggers, empty chat_triggers; all HOOKS-02 mappings present |
| `platform/content-engine/hooks-config.js` | loadHooksConfig(), validateHooksConfig(), parseCronExpression() and runtime-safe accessors | VERIFIED | Exports all three functions; ~430 lines; full validation logic |
| `platform/content-engine/hooks-config.test.js` | Wave 0 coverage for config shape, required mappings, duplicate id rejection, agent validation, cron validation | VERIFIED | 6/6 tests passing; all failure modes covered |
| `database/migrations/hooks-system.sql` | Supabase schema for `agent_signals` with status lifecycle, indexes, and fields needed for claiming and acknowledgement | VERIFIED | Creates `agent_signals` table with all required columns, status CHECK constraint, two indexes, RLS policy |
| `platform/content-engine/hooks-engine.js` | HooksEngine class plus helpers for claim/evaluate/complete signal processing; all four operators implemented | VERIFIED | All four operators implemented at lines 52-84. Substantive, wired, and regression-tested. |
| `platform/content-engine/hooks-engine.test.js` | Automated coverage for heartbeat polling, MKG baseline diff evaluation, signal state transitions, and dispatch payload generation — including all four operators | VERIFIED | 8/8 tests pass. Covers: pct_drop_gte match, missing-baseline guard, tick-to-triggered transition, tick-to-ignored transition, pct_increase_gte match, pct_increase_gte non-match, changed_from_baseline match, changed_from_baseline non-match. |
| `platform/content-engine/backend-server.js` | Hook dispatch integration, trigger metadata plumbing, and engine bootstrap/wiring into the existing run endpoint | VERIFIED | HooksEngine imported and bootstrapped; dispatchHookRun() exported; trigger fields plumbed through run path |
| `platform/crewai/autonomous_scheduler.py` | APScheduler schedule loading from `hooks.json` instead of hard-coded cron definitions | VERIFIED | Config-driven loop; load_hooks_config(), iter_enabled_scheduled_hooks(), cron_trigger_from_hook() all present |
| `platform/content-engine/hooks-dispatch.test.js` | Automated coverage for run-endpoint trigger metadata and scheduled/signal dispatch plumbing | VERIFIED | 2/2 tests passing: dispatchHookRun metadata and manual run backward compatibility |
| `platform/crewai/test_hooks_scheduler.py` | Automated scheduler coverage for hooks.json loading, cron translation, and enabled-hook job registration | VERIFIED | 3/3 tests passing: enabled hook loading, cron field preservation, scheduler code structure verification |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks-config.js` | `hooks.json` | readFile + JSON.parse + validateHooksConfig | WIRED | `loadHooksConfig()` reads hooks.json from `__dirname` |
| `hooks-config.js` | `backend-server.js` | ALLOWED_AGENTS roster validation | WIRED | ALLOWED_AGENTS Set aligns with 12-agent roster |
| `hooks-engine.js` | `hooks-config.js` | loadHooksConfig() | WIRED | Line 1: `import { loadHooksConfig } from "./hooks-config.js"` |
| `hooks-engine.js` | `mkg-service.js` | MKGService.read(companyId) | WIRED | Line 3: `import { MKGService } from "./mkg-service.js"` |
| `hooks-engine.js` | `database/migrations/hooks-system.sql` | Supabase `agent_signals` polling and status updates | WIRED | fetchPendingSignals(), claimSignal(), updateSignal(), markSignalFailed() all reference agent_signals table |
| `backend-server.js` | `hooks-engine.js` | dispatchHookRun injection + engine start/stop wiring | WIRED | HooksEngine imported at line 54; initialized at line 4333; engine.start() on startup, engine.stop() on shutdown |
| `backend-server.js` | `POST /api/agents/:name/run` | hook dispatch uses same request body shape | WIRED | `dispatchHookRun()` calls `fetchImpl(\`${baseUrl}/api/agents/${entry.agent}/run\`, ...)` at line 4273 |
| `autonomous_scheduler.py` | `hooks.json` | shared scheduled hook config replaces hard-coded CronTrigger literals | WIRED | HOOKS_CONFIG_FILE path set at line 51; load_hooks_config() reads it; build_scheduler() loops over enabled hooks |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| HOOKS-01 | 05-01, 05-02, 05-03 | `platform/content-engine/hooks.json` defines scheduled triggers and signal_triggers | SATISFIED | File exists with both sections populated and validated by hooks-config.js; APScheduler reads from it |
| HOOKS-02 | 05-01, 05-02, 05-03 | Signal triggers include the four required mappings | SATISFIED | All four mappings present in hooks.json with correct agent chains. changed_from_baseline (new_company_onboarded) and pct_increase_gte (competitor_move) are implemented and regression-tested. |
| HOOKS-03 | 05-02 | `HooksEngine` evaluates signal conditions against `agent_signals` table on every heartbeat | SATISFIED | HooksEngine polls agent_signals on a setInterval at configured heartbeat_seconds; class is substantive and tested |
| HOOKS-04 | 05-02 | Signal evaluation uses diff-from-baseline (not absolute threshold) — baseline stored per company in MKG | SATISFIED | All four operators (pct_drop_gte, pct_rise_gte, pct_increase_gte, changed_from_baseline) implemented using company MKG baselines, tested with match and non-match cases. |
| HOOKS-05 | 05-03 | Triggered hook runs fire through existing SSE `/api/agents/:name/run` endpoint with `triggered_by: signal` metadata | SATISFIED | dispatchHookRun() calls the run endpoint with trigger metadata; metadata preserved through run path and stored in artifact.data |

**Note:** REQUIREMENTS.md traceability table still shows all HOOKS-* as "Pending" — this should be updated to reflect completion.

---

## Anti-Patterns Found

None. The previous warning (no regression tests for new operators) has been resolved by the 4 new tests added to hooks-engine.test.js.

---

## Human Verification Required

### 1. Live Signal Dispatch End-to-End (new_company_onboarded)

**Test:** Insert a row into the Supabase `agent_signals` table with `status='pending'`, `signal_type='new_company_onboarded'`, `company_id` of a company with MKG where `baselines.value.onboarding_stage` is set to a value different from `signals.value.onboarding_stage`.
**Expected:** Within 60 seconds, the row status transitions from `pending` to `triggered`; `triggered_hook_ids` is populated with `new-company-onboarded-chain`; four `/api/agents/:name/run` requests are sent to veena, isha, neel, zara in dispatch order.
**Why human:** Requires live Supabase connection with service-role credentials and a real MKG record; automated tests use in-memory stubs.

### 2. Live Signal Dispatch End-to-End (traffic_drop_20pct_7d)

**Test:** Insert a row into the Supabase `agent_signals` table with `status='pending'`, `signal_type='traffic_drop_20pct_7d'`, `company_id` of a company with MKG baselines set, and `payload: { current_value: 75 }` where the baseline is 100.
**Expected:** Within 60 seconds, the row status transitions from `pending` to `triggered`; `triggered_hook_ids` is populated with `traffic-drop-20pct-7d`; two `/api/agents/:name/run` requests are sent to `tara` then `kiran`.
**Why human:** Requires live Supabase connection.

### 3. HooksEngine Heartbeat Cadence

**Test:** Start `platform/content-engine/backend-server.js` and watch logs for 2 minutes.
**Expected:** HooksEngine tick log entries appear at approximately 60-second intervals; no error accumulation in the tick loop.
**Why human:** Wall-clock interval timing cannot be verified statically.

### 4. APScheduler Cron Boundary Execution

**Test:** Temporarily edit `veena-weekly-refresh` cron to fire at the next minute boundary, restart `autonomous_scheduler.py`, and observe.
**Expected:** APScheduler registers the job by hook id `veena-weekly-refresh` and executes it at the configured time in Asia/Kolkata timezone.
**Why human:** Real cron boundary execution requires runtime observation; `test_hooks_scheduler.py` validates source code structure only.

---

## Gaps Summary

All automated gaps are closed. The phase goal is fully achieved:

- hooks.json is the single checked-in config source for all scheduled and signal-triggered runs.
- All four diff-from-baseline operators are implemented and regression-tested (8/8 tests pass).
- The HOOKS-02 four-agent onboarding chain and all other dispatch chains are functionally unblocked.
- The Python APScheduler reads from hooks.json instead of hard-coded literals.
- All hooks dispatch through the existing `POST /api/agents/:name/run` endpoint.

The only remaining items are the four human verification tests, which require a live Supabase connection or wall-clock observation and cannot be verified programmatically.

---

_Verified: 2026-03-10T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
