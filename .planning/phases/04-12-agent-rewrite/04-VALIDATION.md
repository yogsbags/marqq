---
phase: 04
slug: 12-agent-rewrite
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-10
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | other (Node built-ins + Python stdlib checks) |
| **Config file** | none |
| **Quick run command** | `node --check platform/content-engine/backend-server.js && node --check platform/content-engine/mcp-router.js && python3 -m py_compile platform/crewai/autonomous_scheduler.py platform/crewai/orchestrator.py` |
| **Full suite command** | `node test-agent-registry.js && node test-agent-run-contract.js && python3 -m py_compile platform/crewai/autonomous_scheduler.py platform/crewai/orchestrator.py` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --check platform/content-engine/backend-server.js && node --check platform/content-engine/mcp-router.js && python3 -m py_compile platform/crewai/autonomous_scheduler.py platform/crewai/orchestrator.py`
- **After every plan wave:** Run `node test-agent-registry.js && node test-agent-run-contract.js && python3 -m py_compile platform/crewai/autonomous_scheduler.py platform/crewai/orchestrator.py`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | AGENT-01 | static | `node test-agent-registry.js --check-soul-memory` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | AGENT-04 | static | `node test-agent-registry.js --check-soul-memory` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | AGENT-05 | static | `node test-agent-registry.js --check-role-map` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | AGENT-06 | static | `node test-agent-registry.js --check-mkg-fields` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | AGENT-02 | static | `node test-agent-registry.js --check-mcp-connectors` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | AGENT-03 | static | `node test-agent-registry.js --check-skills-order --check-skill-provenance` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | AGENT-07 | static | `python3 -m py_compile platform/crewai/autonomous_scheduler.py && node test-agent-registry.js --check-scheduler --check-scheduler-prompt-path --check-schedule-matrix` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | AGENT-08 | static | `node test-agent-registry.js --check-backend-roster` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 3 | AGENT-01, AGENT-06, AGENT-08 | integration | `node test-agent-run-contract.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test-agent-registry.js` — filesystem + roster assertions for 12-agent rewrite
- [ ] `platform/crewai/agents/skills-manifest.json` — agent-to-marketingskills source mapping
- [ ] `test-agent-registry.js --check-scheduler-prompt-path` — assert scheduled runs read MKG-first prompt context
- [ ] `test-agent-run-contract.js` — real HTTP `POST /api/agents/:name/run` smoke test validating AgentRunOutput and non-empty `context_patch`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node-specific skill quality matches intended marketing responsibility | AGENT-03 | File existence cannot prove semantic fit | Review `platform/crewai/agents/skills-manifest.json` and each rewritten `skills/` set against the locked role map in AGENT-05 before approving the phase |
| IST cron schedule quality matches product intent for weekly briefs and daily monitors | AGENT-07 | Syntax checks cannot validate business usefulness | Review the explicit per-agent schedule matrix and confirm each cadence is appropriate for the new framework |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
