---
phase: 08-outcome-ledger
plan: "08"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 08 — Validation Strategy

> Outcome ledger, calibration, and outcomes API must be testable after implementation.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner + Python unittest |
| **Config file** | none |
| **Quick run command** | `node --test platform/content-engine/outcome-api.test.js` |
| **Full suite command** | `node --test platform/content-engine/*.test.js && python3 -m unittest platform.crewai.test_hooks_scheduler` |
| **Estimated runtime** | ~25 seconds |

## Sampling Rate

- **After every task commit:** Run `node --test platform/content-engine/outcome-api.test.js`
- **After every plan wave:** Run `node --test platform/content-engine/*.test.js && python3 -m unittest platform.crewai.test_hooks_scheduler`
- **Before `$gsd-verify-work`:** Full suite must pass
- **Max feedback latency:** 25 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | LEDGER-01 | unit | `node --check platform/content-engine/outcome-processor.js` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | LEDGER-02 | integration | `python3 platform/crewai/outcome-verifier.py --dry-run` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | LEDGER-03 | unit | `node --test platform/content-engine/calibration-writer.test.js` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 3 | LEDGER-04 | integration | `node --test platform/content-engine/outcome-api.test.js` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 3 | LEDGER-05 | integration | `node --test platform/content-engine/outcome-api.test.js` | ❌ W0 | ⬜ pending |

## Wave 0 Requirements

- [ ] `platform/content-engine/outcome-processor.js` — compute variance + write ledger rows
- [ ] `platform/crewai/outcome-verifier.py` — weekly job skeleton + dry-run path
- [ ] `platform/content-engine/calibration-writer.test.js` — note append coverage
- [ ] `platform/content-engine/outcome-api.test.js` — outcomes API + trigger metadata coverage

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ledger accuracy for high-variance agent runs | LEDGER-01..02 | Requires real Supabase + company_kpi_daily data | Seed Supabase with KPI rows + AgentRunOutput rows, run outcome-verifier, confirm `outcome_ledger` rows |
| Calibration note consumption | LEDGER-05 | Requires Groq run w/ actual prompt & memory | Trigger a run with `variance_pct > 30`, confirm `CALIBRATION NOTE` still present in `hooks-dispatch` log or prompt summary |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 25s
- [ ] `nyquist_compliant: true` set once tests cover ledger + API

**Approval:** pending
