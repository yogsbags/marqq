---
phase: 01-mkg-foundation
plan: 03
subsystem: api
tags: [express, mkg, rest-api, marketing-knowledge-graph, backend-server]

# Dependency graph
requires:
  - phase: 01-02
    provides: MKGService (read, patch, isStale, getExpiredFields) with disk+Supabase persistence
provides:
  - GET /api/mkg/:companyId — reads full MKG envelope (all 12 fields) via MKGService.read()
  - PATCH /api/mkg/:companyId — applies field-level patch via MKGService.patch()
  - companyId validation regex /^[a-zA-Z0-9_-]{1,64}$/ on both handlers (400 on invalid)
affects:
  - Phase 2 agent contract validator (calls PATCH to apply context_patch)
  - Frontend components needing MKG data
  - Any agent that reads or writes the MKG via REST

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MKGService imported at top of import block (before routes) in backend-server.js
    - companyId validated with alphanumeric-slug regex before any disk/service call
    - PATCH error handling re-throws MKGService "Invalid companyId" as 400 (not 500)

key-files:
  created:
    - platform/crewai/memory/acme-corp/mkg.json  # test fixture from live endpoint test
  modified:
    - platform/content-engine/backend-server.js

key-decisions:
  - "MKG routes appended at end of backend-server.js (after workspace DELETE) — no middle-of-file insertion"
  - "Vite catch-all /api proxy at vite.config.ts:102 already covers /api/mkg/* — no config change needed"
  - "companyId regex validated in route handler (not just in MKGService) — defense in depth"

patterns-established:
  - "MKG REST pattern: validate companyId → call MKGService → return { mkg: ... }"
  - "PATCH error discrimination: 'Invalid companyId' from service → 400; all other errors → 500"

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 1 Plan 03: MKG REST Endpoints Summary

**GET and PATCH /api/mkg/:companyId REST endpoints wired to MKGService in backend-server.js — MKG is now live over HTTP**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T04:39:50Z
- **Completed:** 2026-03-10T04:44:00Z
- **Tasks:** 2
- **Files modified:** 1 (backend-server.js) + 1 test fixture created

## Accomplishments
- `import { MKGService } from "./mkg-service.js"` added at line 46 of backend-server.js (import block, before any route)
- `GET /api/mkg/:companyId` appended at line 4774 — returns full 12-field MKG envelope (all null for new companies)
- `PATCH /api/mkg/:companyId` appended at line 4798 — applies field-level patch, writes to disk, fires Supabase sync
- Both handlers reject invalid companyIds (path traversal attempts) with 400 before touching the service layer
- Live tests confirmed: GET → empty envelope, PATCH → persists to disk, subsequent GET → reflects updated value
- Phase 1 MKG Foundation complete — SQL migration + MKGService + REST API all in place

## Task Commits

Each task was committed atomically:

1. **Task 1: Add MKGService import to backend-server.js** - `04281cb` (chore)
2. **Task 2: Append GET and PATCH /api/mkg/:companyId route handlers** - `80c3990` (feat)

**Plan metadata:** _(docs commit follows this summary)_

## Files Created/Modified
- `platform/content-engine/backend-server.js` - Added MKGService import (line 46) + two route handlers appended at end (lines 4774–4822)
- `platform/crewai/memory/acme-corp/mkg.json` - Test fixture written by live endpoint test (verifies disk write path)

## Decisions Made
- No vite.config.ts changes needed: the existing catch-all `/api` proxy entry at line 102 already forwards `/api/mkg/*` to port 3008
- companyId regex validated at the route handler level (in addition to MKGService.patch()) — defense in depth; GET also rejects bad IDs before calling MKGService.read()

## Verification Results

```
node --check platform/content-engine/backend-server.js  → PASS (no output)

MKGService import line: 46, first route line: 2155  → PASS (import before routes)

GET /api/mkg/acme-corp  → { "mkg": { "company_id": "acme-corp", "positioning": { "value": null, "confidence": 0, ... }, ... } }

PATCH /api/mkg/acme-corp  → { "mkg": { "positioning": { "value": "AI-native marketing OS", "confidence": 0.85, ... }, ... } }

GET /api/mkg/acme-corp (after PATCH)  → positioning.value: "AI-native marketing OS" (disk persistence confirmed)

ls platform/crewai/memory/acme-corp/mkg.json  → -rw-r--r-- 1766 bytes (file written)

GET /api/mkg/bad..path  → {"error":"invalid companyId"}  (400, path traversal blocked)
```

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required for these endpoints.

The pending manual step from Plan 01-01 still applies: run `database/migrations/mkg-foundation.sql` in Supabase SQL Editor to enable the Supabase sync path. MKG disk reads/writes work without this; only the Supabase mirror is blocked.

## Next Phase Readiness
- Phase 1 MKG Foundation is complete: SQL schema (01-01) + MKGService (01-02) + REST API (01-03)
- Phase 2 agent contract validator can call `PATCH /api/mkg/:companyId` to apply context_patch from agent runs
- Frontend can call `GET /api/mkg/:companyId` to read company MKG data
- Blockers: Supabase sync will fail silently until `mkg-foundation.sql` is applied (non-blocking for disk operations)

---
*Phase: 01-mkg-foundation*
*Completed: 2026-03-10*
