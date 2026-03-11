---
phase: 08-outcome-ledger
status: draft
---

# Phase 08: Outcome Ledger - Research

**Researched:** 2026-03-10  
**Domain:** AgentRunOutput contract, MKG baseline storage, Supabase persistence, scheduler + backend telemetry  
**Confidence:** High (requirements + backend/server/contract/cron artifacts)

## Phase requirements recap

| ID | Summary | How existing code supports it today |
|----|---------|--------------------------------------|
| LEDGER-01 | Outcome ledger table with run_id, company_id, agent, metric, baseline, predicted, actual, variance_pct, verified_at | `database/migrations/mkg-foundation.sql` already creates `agent_run_outputs`; a new table can append `outcome_ledger` rows with similar service-role-only RLS gating. |
| LEDGER-02 | Arjun's weekly verification compares `outcome_prediction` vs actual KPI view data and writes `outcome_ledger` | `platform/crewai/autonomous_scheduler.py` can schedule Arjun's verification run (Friday/weekly) using `hooks.json` after Phase 5; same scheduler + CrewOrchestrator machinery used by hooks can dispatch an Arjun job. |
| LEDGER-03 | When variance > 30% append calibration note to agent `memory/MEMORY.md` | `platform/crewai/autonomous_scheduler.py` already touches `memory/MEMORY.md`; we can append calibration entries when `outcome_ledger` write finds `variance_pct > 30` and `agent` has a matching memory path. |
| LEDGER-04 | `GET /api/outcomes/:companyId` returns ledger with accuracy scores per agent | `platform/content-engine/backend-server.js` exposes REST endpoints already (`/api/mkg`, `/api/agents/:name/run`); implementing `/api/outcomes/:companyId` can re-use Supabase client to read `outcome_ledger`. |
| LEDGER-05 | Next run includes calibration note in prompt if one was written | Backend `POST /api/agents/:name/run` loads `MEMORY.md` before invoking Groq — we just need to append the calibration note there so it flows into skills memory. |

## Data sources and flow

- The core input is the `agent_run_outputs` table created in Phase 1; each row already has `run_id`, `agent`, `company_id`, `artifact`, and `outcome_prediction` fields. We can reuse `saveAgentRunOutput()` to compute `outcome_ledger` rows whenever a run finishes, or process them later with a scheduled Arjun job (recommended to keep latency low).
- `company_kpi_daily` (Phase 6) already aggregates GA4/ad data and is writable by `KPIAggregator`. The ledger's `actual` column should pull from that view for the same metric/timeframe referenced in `outcome_prediction`.
- `MKGService` persists the per-company knowledge graph, including `baselines`. Calibration notes should live in each agent's `memory/MEMORY.md` (Appends already performed in scheduler). We also have `platform/crewai/agents/*/memory/logs` for historical context; verifying Arjun writes to both ensures the prompt layering works.
- Scheduler: Phase 5's `hooks.json` now drives `autonomous_scheduler.py`. We can define a weekly job for Arjun in the same config (Section 5 scheduled) and call the same `CrewOrchestrator` entrypoint with a new `task_type` like `weekly_outcome_verification`.

## Architecture considerations

1. **Outcome ledger persistence**
   - Add `database/migrations/outcome-ledger.sql` (prefixed 08-01) to create the table with service-role RLS like `agent_run_outputs`.
   - Include indexes on `(company_id, metric, verified_at)` and `(agent, verified_at)` for reporting.
   - Write helper `saveOutcomeLedgerRow()` in `platform/content-engine/backend-server.js` or a new module; call it from Arjun's verification job or when `variance_pct` is computed.

2. **Arjun's weekly job**
   - Reuse scheduler and `CrewOrchestrator` (Phase 5) to run Arjun with a `task_type` describing the verification (e.g., `weekly_outcome_verification`).
   - The job reads `agent_run_outputs` rows for the past 90/30/7-day windows and `company_kpi_daily` to compare `outcome_prediction` vs actual KPI fields.
   - After computing variance, write to `outcome_ledger` and inject calibration notes for `variance_pct > 30`.

3. **Calibration note injection**
   - Write to `platform/crewai/agents/{agent}/memory/MEMORY.md` (append new entry) and optionally `memory/logs`.
   - Update backend `POST /api/agents/:name/run` to include the latest calibration note at `MKGService` prompt time so that the note becomes `"Calibration Notes"` skill or appended to run context (we already log `MEMORY.md` contents).
   - Track per-company memory entries (maybe `memory/{agent}/calibration.md` or appended to existing `MEMORY.md`), then have Groq read them via the skill stack.

4. **Outcomes API and UI**
   - `GET /api/outcomes/:companyId` should join `outcome_ledger` rows with agent names and return aggregated accuracy (e.g., `1 - |variance_pct|/100` for each agent).
   - Accept query params like `days=7,30,90`. Consider caching results for fast UI.
   - Provide a `reportHtml` or similar, referencing `platform/content-engine/outcomes` for front-end use.

## Verification notes

- Automated coverage includes new tests for `hooks-engine` already; Outcome Ledger should get:
  - Unit tests for ledger persistence plus calibration note injection (plan-phase verification).
  - Integration test hitting `/api/outcomes/:companyId` (can re-use test-mode run path).
  - Manual verification: run Arjun's job with seeded KPI data, confirm `outcome_ledger` and `memory` updates.

