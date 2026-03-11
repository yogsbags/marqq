---
phase: 04-12-agent-rewrite
status: complete
created: 2026-03-10
source: local-codebase-inspection
---

# Phase 4 — 12-Agent Rewrite Research

## Objective

Research how to implement Phase 4: rewrite the 11 pre-existing agents around the 12-node marketing framework, preserve the new MKG + AgentRunOutput contract from Phases 1-3, and align backend/scheduler runtime registration with the rewritten roster.

## Current Codebase State

### Agent filesystem inventory

| Agent | SOUL.md | mcp.json | MEMORY.md | skills/ | Notes |
|------|---------|----------|-----------|---------|-------|
| veena | yes | yes | yes | yes | Phase 3 bootstrap agent; already uses MKG fields |
| zara | yes | yes | yes | yes | Current role is paid/orchestrator hybrid; will be remapped to Distribution |
| maya | yes | yes | yes | yes | Has strong SEO skill set already |
| riya | yes | yes | yes | yes | Content skill set already present |
| arjun | yes | yes | yes | yes | Current role is lead gen; Phase 4 keeps funnel/leads focus |
| dev | yes | yes | yes | yes | Current role is paid/campaign analysis; Phase 4 remaps to Analytics |
| priya | yes | yes | yes | yes | Current SOUL says competitor watcher, but mcp/skills skew toward engagement/content |
| kiran | yes | yes | yes | yes | Social role exists already |
| sam | yes | yes | yes | yes | Email role exists already |
| isha | no | no | no | yes | Only `skills/00-product-marketing-context.md` exists |
| neel | no | no | no | yes | Only `skills/00-product-marketing-context.md` exists |
| tara | no | no | no | yes | Only `skills/00-product-marketing-context.md` exists |

### Runtime constraints already in code

1. `platform/content-engine/backend-server.js`
   - `VALID_AGENTS` currently includes `veena,zara,maya,riya,arjun,dev,priya,tara,neel,isha`.
   - `kiran` and `sam` are missing from `VALID_AGENTS`, so `POST /api/agents/:name/run` currently rejects them with `404`.
   - The run endpoint loads:
     - `agents/{name}/SOUL.md`
     - `agents/{name}/memory/MEMORY.md`
     - `agents/{name}/skills/*.md`, sorted lexicographically
   - `00-` prefix is therefore the only existing mechanism that guarantees `product-marketing-context` loads first.
   - The system prompt always appends the AgentRunOutput contract instruction last.

2. `platform/content-engine/contract-validator.js`
   - Validates top-level contract structure only.
   - `context_patch` must exist and must contain `writes_to` array plus `patch` object.
   - It does not enforce non-empty `context_patch.patch`; Phase 4 still must plan a smoke verification that each rewritten agent returns a non-empty patch because the roadmap goal explicitly requires it.

3. `platform/content-engine/mcp-router.js`
   - Loads `platform/crewai/agents/{name}/mcp.json`.
   - Missing or invalid `mcp.json` silently degrades to `{ connectors: [] }`.
   - Connector names must come from `CONNECTOR_APP_MAP`; Phase 4 plans should avoid inventing connector IDs.

4. `platform/crewai/autonomous_scheduler.py`
   - Still reflects an older 8-agent world.
   - `AGENT_ROLES` and `AGENT_CREWS` only cover `zara,maya,riya,arjun,kiran,dev,priya,sam`.
   - `build_scheduler()` only schedules those 8 agents.
   - `veena`, `isha`, `neel`, and `tara` are absent from scheduled jobs.
   - Scheduler roles also do not match the Phase 4 role map from `AGENT-05`.
   - Scheduler currently loads `SOUL.md` and `MEMORY.md`, but not `skills/*.md`, so the `00-product-marketing-context.md` foundation is only guaranteed on the `/api/agents/:name/run` path unless Phase 4 explicitly upgrades scheduler prompt assembly.

## Requirement-to-Code Implications

### AGENT-01, AGENT-04, AGENT-06

All 11 non-Veena agents need a normalized filesystem shape:

- `platform/crewai/agents/{name}/SOUL.md`
- `platform/crewai/agents/{name}/memory/MEMORY.md`
- `platform/crewai/agents/{name}/skills/00-product-marketing-context.md`

Every rewritten `SOUL.md` must explicitly include:

- `reads_from_mkg`
- `writes_to_mkg`
- `triggers_agents`

This is not optional because the roadmap success criteria and existing Veena pattern both use these fields as the canonical declaration format.

### AGENT-02, AGENT-03

Each agent’s `mcp.json` and `skills/` must align to its framework node, not its legacy role text.

Observed mismatches that planning must correct:

- `zara` currently reads ad connectors, but Phase 4 maps `zara=Distribution`
- `dev` currently behaves like paid media analysis, but Phase 4 maps `dev=Analytics`
- `priya` currently has competitor SOUL but product analytics connectors
- `isha`, `neel`, and `tara` have no node-specific skills or configs yet
- `kiran` and `sam` have role files but are not integrated into backend run registration

### AGENT-05

The locked name mapping for this phase is:

- `isha=Market Research`
- `neel=Strategy`
- `tara=Offer Engineering`
- `zara=Distribution`
- `maya=SEO/Content`
- `riya=Content Creation`
- `arjun=Funnel/Leads`
- `dev=Analytics`
- `priya=Competitive Intelligence`
- `kiran=Lifecycle/Social`
- `sam=Messaging`

Plans must treat this mapping as the source of truth even where existing files disagree.

### AGENT-07, AGENT-08

Phase 4 must update the runtime surfaces together:

- `backend-server.js`
  - `VALID_AGENTS`
  - `AGENT_PROFILES`
- `autonomous_scheduler.py`
  - `AGENT_ROLES`
  - `AGENT_CREWS`
  - `build_scheduler()`

If the filesystem rewrite lands before registry/scheduler alignment, some agents will exist on disk but still be unrunnable or unscheduled.

## Recommended Plan Decomposition

### Plan 04-01 — Identity layer rewrite

Rewrite the 11 non-Veena `SOUL.md` files and reset/create `memory/MEMORY.md` files.

Why first:

- Establishes canonical role, MKG read/write boundaries, and trigger topology.
- Gives Plan 04-02 a stable contract for connector/skill alignment.
- Avoids editing runtime registration before the agent definitions are settled.

### Plan 04-02 — Capability layer rewrite

Rewrite every target agent’s `mcp.json` and `skills/` set.

Why second:

- `mcp.json` must follow the new role map from 04-01.
- Skills must load `00-product-marketing-context.md` first and then node-specific skills.
- This plan should also create missing `skills/` content for `isha`, `neel`, and `tara`.

### Plan 04-03 — Runtime alignment and verification

Update backend and scheduler registration, then add smoke verification for all 12 agents.

Why last:

- Backend/scheduler should register the finished roster, not an intermediate one.
- This is the best place to add a reusable smoke script/assertion that:
  - all 12 agents are routable
  - `VALID_AGENTS` and scheduler roster are aligned
  - each agent can return a valid AgentRunOutput with a non-empty `context_patch`

## Execution Risks

1. Parallel file overlap risk
   - Plans that split by file type across all 11 agents will touch the same directories repeatedly.
   - Recommendation: keep phase waves sequential (`04-01` -> `04-02` -> `04-03`) to reduce merge/conflict risk.

2. Skills provenance risk
   - The requirement references a “marketingskills 31-skill library”, but only a subset of skill markdown files is present locally under agent directories.
   - Planning should not hand-wave this away. Execution needs a provenance step:
     - map each rewritten agent to named source skills from the `marketingskills` library
     - if the source repo is not vendored locally, import/copy the selected skills into the agent directories during execution
     - write a manifest documenting which source skill(s) each agent received

3. Contract-verification gap
   - Existing validation only checks contract shape, not semantic non-emptiness of `context_patch`.
   - A dedicated smoke test is required to satisfy the roadmap goal.

4. Scheduler/backend drift
   - Backend and scheduler presently disagree on the active agent roster.
   - Runtime alignment must be verified in the same plan that edits both files.

## Implementation Guidance

### SOUL.md format

Use Veena as the canonical Phase-4-style reference because it already includes:

- clear role/personality/expertise
- `reads_from_mkg`
- `writes_to_mkg`
- `triggers_agents`
- schedule and memory location
- mission/output/rules sections

### Skills loading

Because backend skill loading uses sorted filenames, every agent must keep:

- `skills/00-product-marketing-context.md`

Any node-specific skills should sort after `00-`, ideally with an explicit numeric prefix where ordering matters.

### Memory reset

`autonomous_scheduler.py` appends to `memory/MEMORY.md` and writes daily logs under `memory/logs/`.
Phase 4 should initialize the top-level `MEMORY.md` files cleanly without breaking that append-only behavior.

## Validation Architecture

Phase 4 needs a mixed validation strategy:

1. Static filesystem validation
   - Assert each of the 12 agents has expected files and first skill ordering.

2. JS runtime validation
   - Assert backend registry includes all 12 names.
   - Assert each `mcp.json` parses and connector IDs belong to `CONNECTOR_APP_MAP`.

3. Python runtime validation
   - Assert scheduler role map and scheduled jobs cover the same intended roster.

4. Contract smoke validation
   - Run or simulate `POST /api/agents/:name/run` for all 12 agents and assert:
     - response includes contract block
     - `validateContract()` passes
     - `context_patch.patch` has at least one key

5. Scheduler prompt validation
   - Assert scheduled execution either:
     - loads `skills/*.md` with `00-product-marketing-context.md` first, or
     - routes through a shared prompt builder / backend execution path that already guarantees the MKG-first foundation

6. Schedule contract validation
   - Assert every rewritten agent has an explicit cadence in a per-agent schedule matrix, not just ad hoc “sensible” cron edits
   - The matrix should make clear which agents are daily monitors, which are weekly briefs, and which remain event-driven for later hook integration

This validation is strong enough to guard both roadmap success criteria and the semantic gap left by the current validator.

## Planning Recommendation

Proceed with three sequential execute plans:

1. Rewrite agent identity and memory files.
2. Rewrite connectors and skills.
3. Align backend/scheduler and add smoke verification.

This matches the roadmap’s existing plan slots and keeps each plan’s outcome auditable.

## RESEARCH COMPLETE

- Phase directory: `.planning/phases/04-12-agent-rewrite`
- Recommended plan count: 3
- Recommended waves: 3 sequential waves
