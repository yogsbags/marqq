---
phase: 04-12-agent-rewrite
plan: "02"
subsystem: agents
tags: [agents, connectors, skills, provenance, marketingskills]
requires:
  - phase: 04-12-agent-rewrite
    provides: "Stable Phase-4 role map and MKG ownership declarations from 04-01"
provides:
  - "Role-aligned mcp.json files for all 11 non-Veena agents"
  - "Curated node-specific skills for all 11 non-Veena agents"
  - "skills-manifest.json proving marketingskills provenance for AGENT-03"
affects: [04-03, phase-05-hooks]
tech-stack:
  added: []
  patterns: ["Agent skills are now a strict 00/01/02 sequence per role", "Legacy recipe bindings were cleared in favor of explicit Phase-4 connector ownership"]
key-files:
  created:
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/skills-manifest.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/isha/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/neel/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/tara/mcp.json
  modified:
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/zara/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/maya/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/riya/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/arjun/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/dev/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/priya/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/kiran/mcp.json
    - /Users/yogs87/Documents/New project/marqq/platform/crewai/agents/sam/mcp.json
key-decisions:
  - "Removed stale recipe IDs from all rewritten agents because the old recipe bindings no longer matched the Phase-4 role map"
  - "Reduced each agent skill directory to product-marketing-context plus two role-specific skills so prompt loading stays deterministic"
  - "Added an explicit skills-manifest.json so AGENT-03 provenance is auditable instead of implicit"
patterns-established:
  - "Connector ownership follows the locked Phase-4 role map rather than legacy agent names"
  - "Each rewritten skill directory now sorts exactly as 00-product-marketing-context then 01/02 role skills"
requirements-completed: [AGENT-02, AGENT-03]
duration: 18 min
completed: 2026-03-10
---

# Phase 4 Plan 02: Capability Rewrite Summary

**Connector maps, curated role-specific skill sets, and explicit marketingskills provenance for all 11 non-Veena agents**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-10T11:45:00Z
- **Completed:** 2026-03-10T12:03:00Z
- **Tasks:** 2
- **Files modified:** 70

## Accomplishments
- Rewrote `mcp.json` for all 11 target agents so connector ownership now matches the Phase-4 role map.
- Replaced stale legacy prompt files with a compact, role-specific `00/01/02` skill structure for every agent.
- Added `platform/crewai/agents/skills-manifest.json` to prove which local skill files correspond to the required marketingskills source names.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite mcp.json for all 11 non-Veena agents** - `fb4e6a5` (feat)
2. **Task 2: Rewrite skills directories and provenance manifest** - `ccdb5fd` (feat)

## Files Created/Modified
- `/Users/yogs87/Documents/New project/marqq/platform/crewai/agents/{isha,neel,tara}/mcp.json` - New connector maps for agents that previously had no runtime config.
- `/Users/yogs87/Documents/New project/marqq/platform/crewai/agents/{zara,maya,riya,arjun,dev,priya,kiran,sam}/mcp.json` - Role-aligned connector ownership with legacy recipe bindings removed.
- `/Users/yogs87/Documents/New project/marqq/platform/crewai/agents/*/skills/01-*.md` and `02-*.md` - New node-specific skill pair for each rewritten agent.
- `/Users/yogs87/Documents/New project/marqq/platform/crewai/agents/skills-manifest.json` - Provenance map from local files back to marketingskills source names.

## Decisions Made

- Kept the foundation skill untouched and made every role-specific capability explicit via numbered skill files.
- Preferred empty `recipes` objects over stale IDs that referenced the old agent model.
- Treated prompt cleanliness as more important than preserving broad legacy skill libraries that no longer fit the new role map.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The skill cleanup deleted a large amount of legacy markdown because those files would still be prompt-loaded and conflict with the new role definitions if left in place.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04-03 can now register the backend and scheduler against stable connector ownership and deterministic prompt inputs.
- The upcoming registry tests can validate skills ordering and provenance directly from `skills-manifest.json`.

## Self-Check: PASSED

- Found `.planning/phases/04-12-agent-rewrite/04-02-SUMMARY.md`
- Found task commit `fb4e6a5`
- Found task commit `ccdb5fd`
