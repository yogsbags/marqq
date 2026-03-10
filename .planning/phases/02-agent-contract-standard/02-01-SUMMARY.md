---
phase: 02-agent-contract-standard
plan: "01"
subsystem: agent-contract
tags: [contract, validation, migration, sql, esm]
dependency_graph:
  requires: [01-mkg-foundation]
  provides: [contract-validator, agent-contract-migration]
  affects: [02-02, 02-03]
tech_stack:
  added: []
  patterns: [pure-esm-module, idempotent-sql-migration, lastIndexOf-sentinel-guard]
key_files:
  created:
    - database/migrations/agent-contract.sql
    - platform/content-engine/contract-validator.js
  modified: []
decisions:
  - "extractContract uses lastIndexOf (not indexOf) to guard against LLM mid-response sentinel duplication"
  - "company_id allowed as null in validateContract — caller may not have sent it at time of run"
  - "outcome_prediction left unvalidated (any/null) — stored inside artifact JSONB per research recommendation"
  - "user_id on agent_tasks made nullable — system-generated tasks have no auth.users initiator"
  - "priority column constrained to low/medium/high CHECK with default medium"
metrics:
  duration: "2 min"
  completed: "2026-03-10"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 2 Plan 1: Agent Contract Standard — Schema + Validator Summary

**One-liner:** AgentRunOutput contract validator (extractContract/validateContract) and idempotent agent_tasks migration SQL ready for Supabase.

## What Was Built

### 1. `database/migrations/agent-contract.sql`

Idempotent SQL migration that extends `agent_tasks` (created in `agent-employees.sql` Phase 1) with:

- `triggered_by_run_id TEXT` — links a task to the agent run that created it (CONTRACT-05 FK chain)
- `company_id TEXT` — enables company-scoped task queries
- `description TEXT` — human-readable task description
- `priority TEXT DEFAULT 'medium' CHECK (IN ('low', 'medium', 'high'))` — task priority
- `ALTER COLUMN user_id DROP NOT NULL` — allows system-generated tasks with no human initiator
- `idx_agent_tasks_run_id` partial index on triggered_by_run_id
- `idx_agent_tasks_company` partial composite index on (company_id, created_at DESC)

All statements use `IF NOT EXISTS` / `IF EXISTS` guards — safe to re-run on existing projects.

**Apply instructions (human step):**
1. Ensure `agent-employees.sql` has been applied to Supabase first
2. Open Supabase Dashboard → SQL Editor
3. Paste and run `database/migrations/agent-contract.sql`

### 2. `platform/content-engine/contract-validator.js`

Pure ESM module (no external dependencies) exporting two functions:

**`extractContract(fullText: string) → object | null`**
- Finds the LAST `---CONTRACT---` sentinel using `lastIndexOf` (guards against mid-response duplicates)
- Extracts JSON block following sentinel, trims to last closing brace (guards against trailing markdown)
- Returns parsed object or `null` on any failure

**`validateContract(obj: any) → { valid: boolean, errors: string[] }`**
- Returns `{ valid: true, errors: [] }` for well-formed AgentRunOutput
- Returns `{ valid: false, errors: [...] }` with field-level error messages for malformed input

## AgentRunOutput Full Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `agent` | string | yes | Non-empty agent name |
| `task` | string | yes | One-line task description |
| `company_id` | string \| null | yes | Null permitted if caller omits |
| `run_id` | string | yes | UUID, non-empty |
| `timestamp` | string | yes | ISO 8601, non-empty |
| `input.mkg_version` | string \| null | yes | MKG snapshot version |
| `input.dependencies_read` | array | yes | Files/keys read |
| `input.assumptions_made` | array | yes | Assumptions logged |
| `artifact.data` | object | yes | Structured output payload |
| `artifact.summary` | string | yes | Non-empty human summary |
| `artifact.confidence` | number | yes | 0.0–1.0 inclusive |
| `context_patch.writes_to` | array | yes | MKG keys being written |
| `context_patch.patch` | object | yes | MKG delta to apply |
| `handoff_notes` | string | yes | May be empty string |
| `missing_data` | array | yes | Data gaps |
| `tasks_created` | array | yes | Each item: {task_type, agent_name, description?, priority?} |
| `outcome_prediction` | any | optional | Null permitted |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `database/migrations/agent-contract.sql` exists
- [x] `platform/content-engine/contract-validator.js` exists
- [x] Both commits exist (a085655, 1d527aa)
- [x] Inline node test passes ("All assertions passed")
- [x] No new npm dependencies added

## Pending Todos (for STATE.md)

- Run `database/migrations/agent-contract.sql` in Supabase SQL Editor after `agent-employees.sql` (human step — migration NOT yet applied)
