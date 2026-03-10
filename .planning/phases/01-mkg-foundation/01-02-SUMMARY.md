---
phase: 01-mkg-foundation
plan: 02
subsystem: api
tags: [mkg, marketing-knowledge-graph, supabase, disk-first, agent-skills]

# Dependency graph
requires:
  - phase: 01-mkg-foundation-plan-01
    provides: MKG schema definition, Supabase company_mkg table migration SQL, and research establishing the disk-first + Supabase sync architecture

provides:
  - MKGService singleton (platform/content-engine/mkg-service.js) with read, patch, isStale, getExpiredFields methods
  - 00-product-marketing-context.md skill file in all 11 agent skills/ directories
  - skills/ directories created for kiran and sam (previously missing)

affects:
  - 01-03 (REST endpoints for MKG will import MKGService)
  - all future agent runs (00-product-marketing-context.md is loaded first in every agent context)
  - 02-agent-output-contract (agents will write context_patch using MKG field schema taught in skill file)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Disk-first with fire-and-forget Supabase sync: writeMkg() completes before syncToSupabase() is called; Supabase errors never block disk operations"
    - "companyId sanitization before file path construction: regex /^[a-zA-Z0-9_-]{1,64}$/ prevents path traversal"
    - "isStale() is synchronous and takes field envelope object — callers read field first, then check staleness"
    - "00- prefix for skill files: lexicographic sort ensures product-marketing-context loads before all other skills"

key-files:
  created:
    - platform/content-engine/mkg-service.js
    - platform/crewai/agents/zara/skills/00-product-marketing-context.md
    - platform/crewai/agents/maya/skills/00-product-marketing-context.md
    - platform/crewai/agents/riya/skills/00-product-marketing-context.md
    - platform/crewai/agents/arjun/skills/00-product-marketing-context.md
    - platform/crewai/agents/dev/skills/00-product-marketing-context.md
    - platform/crewai/agents/priya/skills/00-product-marketing-context.md
    - platform/crewai/agents/tara/skills/00-product-marketing-context.md
    - platform/crewai/agents/neel/skills/00-product-marketing-context.md
    - platform/crewai/agents/isha/skills/00-product-marketing-context.md
    - platform/crewai/agents/kiran/skills/00-product-marketing-context.md
    - platform/crewai/agents/sam/skills/00-product-marketing-context.md
  modified: []

key-decisions:
  - "MKG_ROOT resolves to platform/crewai/memory/ relative to mkg-service.js location (using import.meta.url + __dirname)"
  - "isStale() never returns true for never-set fields (value===null or confidence===0) — empty is not stale"
  - "patch() ignores unknown fields with a console.warn rather than throwing — defensive merge"

patterns-established:
  - "MKGService.read(companyId) — full MKG; MKGService.read(companyId, 'positioning') — single field envelope"
  - "MKGService.patch() sanitizes companyId with regex before disk access — required pattern for all file-path operations"
  - "Agent skill files use 00- prefix for guaranteed first-load ordering via natural lexicographic sort"

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 1 Plan 02: MKGService and Agent Skill Files Summary

**ESM MKGService singleton with disk-first writes to platform/crewai/memory/{companyId}/mkg.json and fire-and-forget Supabase sync, plus 00-product-marketing-context.md deployed to all 11 agent skills/ directories**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T04:30:00Z
- **Completed:** 2026-03-10T04:38:00Z
- **Tasks:** 2
- **Files modified:** 12 (1 JS module + 11 skill files)

## Accomplishments

- MKGService singleton created with all 4 methods: `read`, `patch`, `isStale`, `getExpiredFields`
- Path-traversal guard in `patch()` using regex `/^[a-zA-Z0-9_-]{1,64}$/` on companyId
- Supabase sync is fire-and-forget — disk write completes first unconditionally
- `00-product-marketing-context.md` deployed to all 11 agents (created skills/ dirs for kiran and sam)
- All isStale smoke tests pass: null=false, never-set=false, confidence-0.5=true, fresh-high=false

## Task Commits

Each task was committed atomically:

1. **Task 1: Create platform/content-engine/mkg-service.js** - `3514a2c` (feat)
2. **Task 2: Create 00-product-marketing-context.md in all 11 agent skills/ directories** - `54def02` (feat)

## Files Created/Modified

- `platform/content-engine/mkg-service.js` — MKGService singleton; exports `read`, `patch`, `isStale`, `getExpiredFields`; imports `supabase` from `./supabase.js`
- `platform/crewai/agents/zara/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/maya/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/riya/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/arjun/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/dev/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/priya/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/tara/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/neel/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/isha/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded)
- `platform/crewai/agents/kiran/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded; skills/ dir created)
- `platform/crewai/agents/sam/skills/00-product-marketing-context.md` — Product marketing context skill (first-loaded; skills/ dir created)

## MKGService Method Signatures

```javascript
// Full MKG for a company (returns empty MKG if no file yet — never throws)
MKGService.read(companyId: string): Promise<Object>

// Single field envelope (returns FIELD_DEFAULTS if field missing)
MKGService.read(companyId: string, field: string): Promise<Object>

// Merge-patch into MKG fields; disk write first, then Supabase fire-and-forget
// Throws on invalid companyId (path traversal guard)
MKGService.patch(companyId: string, patch: Object): Promise<Object>

// Synchronous staleness check on a field envelope object
// Returns false for null/never-set fields; true for confidence<0.6 or age>30d
MKGService.isStale(fieldData: Object|null): boolean

// Returns array of stale field names for a company
MKGService.getExpiredFields(companyId: string): Promise<string[]>
```

## isStale Smoke Test Results

| Input | Result | Expected |
|---|---|---|
| `null` | `false` | `false` |
| `{ value: null, confidence: 0, ... }` | `false` | `false` |
| `{ value: 'test', confidence: 0.5, ... }` | `true` | `true` |
| `{ value: 'test', confidence: 0.9, last_verified: '2026-03-10', expires_at: '2026-04-10' }` | `false` | `false` |

All assertions passed.

## MKG_ROOT Path Resolution

`MKG_ROOT` is computed as:
```javascript
const __dirname = dirname(fileURLToPath(import.meta.url));
const MKG_ROOT = join(__dirname, "..", "crewai", "memory");
```

From `platform/content-engine/mkg-service.js`, this resolves to `platform/crewai/memory/`. Company MKG files are stored at `platform/crewai/memory/{companyId}/mkg.json`.

## Confirmed Agent List with 00-product-marketing-context.md

All 11 agents confirmed:

| Agent | Skills Dir | File Present |
|---|---|---|
| zara | existing | YES |
| maya | existing | YES |
| riya | existing | YES |
| arjun | existing | YES |
| dev | existing | YES |
| priya | existing | YES |
| tara | existing | YES |
| neel | existing | YES |
| isha | existing | YES |
| kiran | created new | YES |
| sam | created new | YES |

## Decisions Made

- **MKG_ROOT uses import.meta.url** — ESM modules require `fileURLToPath(import.meta.url)` instead of `__dirname`; `__dirname` is recreated via `dirname(fileURLToPath(import.meta.url))`
- **isStale() is synchronous** — takes a pre-read field envelope; callers read the field first, then call isStale(). This avoids making isStale() async and lets it be used in `.filter()` chains
- **patch() ignores unknown fields with warn** — defensive: unknown fields are logged but don't throw, allowing forward-compatible patches from agents writing new field names before schema updates

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. The `company_mkg` Supabase table is needed for sync but MKGService gracefully handles its absence (logs a warning on first sync attempt with error code `42P01`).

## Next Phase Readiness

- MKGService is ready for import in REST endpoints (plan 01-03)
- All agents will now receive MKG field documentation as the first context loaded in every run
- `getExpiredFields()` is available for the freshness check endpoint in plan 01-03
- No blockers for plan 01-03

---
*Phase: 01-mkg-foundation*
*Completed: 2026-03-10*
