---
status: testing
phase: 06-data-pipeline
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md]
started: 2026-03-10T12:06:18Z
updated: 2026-03-10T12:38:20Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold start backend
expected: |
  Stop any running backend, remove temporary caches or PID files, and run `npm run dev:backend`.
  Watch for `[content-engine] Listening on port <PORT>` and `[nightly-anomaly] next run scheduled for` within 15 seconds.
  Call `http://localhost:<PORT>/health` → expect `{"status":"ok","service":"content-engine"}` before shutting the server down again.
result: pass

### 2. KPI API returns KPI rows only
expected: |
  With the backend running, hit `curl http://localhost:<PORT>/api/kpis/<your-company-id>?days=30`.
  Expect HTTP 200 JSON with `companyId`, `days`, and a `rows` array (can be empty).
  Each row should only include KPI/metadata columns (`company_id`, `metric_date`, `spend`, `roas`, etc.) and never expose `payload` or raw snapshot fields.
result: pass

### 3. Nightly scheduler is active
expected: |
  While the backend is running, inspect the console output for `[nightly-anomaly] next run scheduled for`.
  The timestamp should refer to the configured schedule (default 18:30 UTC) and appear right after startup, proving the scheduler started.
  No error logs about `nightly-anomaly` should appear before the next run is scheduled.
result: pass

### 4. Severity gating test
expected: |
  Run `node --test platform/content-engine/anomaly-detector.test.js`.
  The suite should pass, covering history guardrails, silent MKG patches for low/medium, and Groq narration for high/critical anomalies.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

none
