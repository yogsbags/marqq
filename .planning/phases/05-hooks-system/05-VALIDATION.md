---
phase: 05
slug: hooks-system
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-10
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) |
| **Config file** | none |
| **Quick run command** | `node --test platform/content-engine/hooks-config.test.js platform/content-engine/hooks-engine.test.js platform/content-engine/hooks-dispatch.test.js` |
| **Full suite command** | `node --test platform/content-engine/*.test.js && python3 -m unittest platform.crewai.test_hooks_scheduler` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test platform/content-engine/hooks-config.test.js platform/content-engine/hooks-engine.test.js platform/content-engine/hooks-dispatch.test.js`
- **After every plan wave:** Run `node --test platform/content-engine/*.test.js && python3 -m unittest platform.crewai.test_hooks_scheduler`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HOOKS-01 | unit | `node --test platform/content-engine/hooks-config.test.js` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | HOOKS-02 | unit | `node --test platform/content-engine/hooks-config.test.js` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | HOOKS-03 | integration | `node --test platform/content-engine/hooks-engine.test.js` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | HOOKS-04 | unit | `node --test platform/content-engine/hooks-engine.test.js` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | HOOKS-05 | integration | `node --test platform/content-engine/hooks-dispatch.test.js` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | HOOKS-03, HOOKS-05 | integration | `node --test platform/content-engine/hooks-engine.test.js platform/content-engine/hooks-dispatch.test.js` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 3 | HOOKS-01 | integration | `python3 -m unittest platform.crewai.test_hooks_scheduler` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/content-engine/hooks-config.test.js` — config schema and cron/agent validation coverage
- [ ] `platform/content-engine/hooks-engine.test.js` — signal claim/evaluate/dispatch flow with MKG baseline fixtures
- [ ] `platform/content-engine/hooks-dispatch.test.js` — `/api/agents/:name/run` trigger metadata and task creation coverage
- [ ] `platform/crewai/test_hooks_scheduler.py` — scheduler config loading and cron translation coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `traffic_drop_20pct_7d` dispatches `tara` and `kiran` within one heartbeat against a real Supabase-backed signal row | HOOKS-02, HOOKS-03, HOOKS-04 | Requires live Supabase + scheduler timing | Insert a pending `agent_signals` row, ensure MKG baselines show >20% drop, wait 60 seconds, verify `agent_tasks` rows for `tara` and `kiran` appear. |
| Scheduled Veena weekly refresh fires at the configured IST cron time | HOOKS-01, HOOKS-05 | Depends on APScheduler wall-clock execution | Load `hooks.json`, start scheduler in a controlled window, wait for the cron boundary, then verify the expected task/run timestamp matches the configured schedule. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
