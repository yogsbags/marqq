---
phase: 05-hooks-system
plan: "01"
subsystem: infra
tags: [hooks, scheduler, config, validation, node-test]
requires:
  - phase: 04-12-agent-rewrite
    provides: "Rewritten 12-agent runtime roster used for hook dispatch validation"
provides:
  - "Checked-in hooks.json inventory for scheduled, signal, and reserved chat triggers"
  - "Runtime-safe hooks config loader with startup validation for ids, agents, cron, and required signal mappings"
  - "Wave 0 node:test coverage for hook config correctness"
affects: [phase-05-hooks-system, backend-server, autonomous-scheduler, hooks-engine]
tech-stack:
  added: []
  patterns: ["Single source of truth hooks.json", "Startup validation before dispatch", "Shared roster validation for hook definitions"]
key-files:
  created:
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/hooks.json
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/hooks-config.js
    - /Users/yogs87/Documents/New project/marqq/platform/content-engine/hooks-config.test.js
  modified:
    - /Users/yogs87/Documents/New project/marqq/.planning/ROADMAP.md
    - /Users/yogs87/Documents/New project/marqq/.planning/STATE.md
key-decisions:
  - "Kept hooks.json as the only checked-in hook inventory and reserved chat_triggers as an explicit empty array for later phases."
  - "Made hooks-config.js the startup gate for cron, roster, duplicate-id, and HOOKS-02 mapping validation instead of splitting validation across runtimes."
patterns-established:
  - "Scheduled hooks use a single dispatch object while signal hooks use ordered dispatch arrays."
  - "Signal mappings required by HOOKS-02 are enforced exactly once by signal_type before runtime dispatch begins."
requirements-completed: [HOOKS-01, HOOKS-02, HOOKS-03, HOOKS-04, HOOKS-05]
duration: 4 min
completed: 2026-03-10
---

# Phase 5 Plan 01: Hooks System Summary

**Central hook configuration with strict startup validation for schedules, signal mappings, and dispatch-safe agent roster checks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T12:05:59Z
- **Completed:** 2026-03-10T12:09:59Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `platform/content-engine/hooks.json` as the single checked-in Phase 5 source of truth with 6 scheduled hooks, 7 signal triggers, and the required HOOKS-02 mappings.
- Implemented `platform/content-engine/hooks-config.js` to load and validate the config before runtime use, including agent-roster checks, 5-part cron parsing, duplicate id rejection, and required signal mapping enforcement.
- Added `platform/content-engine/hooks-config.test.js` with deterministic node:test coverage for valid config loading and the expected failure modes.

## Task Commits

Each task was completed atomically in the workspace:

1. **Task 1: Create hooks.json with scheduled and signal inventory** - no git commit created
2. **Task 2: Implement the config loader and validator** - no git commit created
3. **Task 3: Add Wave 0 config correctness tests** - no git commit created

**Plan metadata:** no git commit created

## Files Created/Modified

- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/hooks.json` - Shared scheduled and signal trigger definitions for Phase 5.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/hooks-config.js` - Loader, validator, cron parser, and normalized accessors for hook config.
- `/Users/yogs87/Documents/New project/marqq/platform/content-engine/hooks-config.test.js` - Node built-in test runner coverage for hook config validation.
- `/Users/yogs87/Documents/New project/marqq/.planning/phases/05-hooks-system/05-01-SUMMARY.md` - Execution summary for this plan.
- `/Users/yogs87/Documents/New project/marqq/.planning/ROADMAP.md` - Marked `05-01` complete and moved Phase 5 progress to 1/3.
- `/Users/yogs87/Documents/New project/marqq/.planning/STATE.md` - Updated plan progress and current focus metadata after `05-01`.

## Decisions Made

- Used a small manual validator instead of introducing a schema library because the config surface is narrow and the rest of the content-engine backend already uses lightweight JS validation patterns.
- Normalized signal dispatch order in the loader and enforced contiguous `order` values so later plans can rely on deterministic sequential execution.
- Treated the four roadmap-required signal mappings as exact-by-`signal_type` invariants, not soft conventions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 now has the shared config layer that Plans `05-02` and `05-03` can consume for signal polling and dispatch wiring.
- The config contract is covered by local automated tests, so later runtime work can assume the required hooks and agent mappings exist before startup.
- Remaining Phase 5 work is limited to engine polling and dispatch integration.

## Self-Check: PASSED

- Found `.planning/phases/05-hooks-system/05-01-SUMMARY.md`
- `node --check platform/content-engine/hooks-config.js` passed
- `node --test platform/content-engine/hooks-config.test.js` passed
