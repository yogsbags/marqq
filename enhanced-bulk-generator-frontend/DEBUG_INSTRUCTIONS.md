# Debug Instructions for Auto-Approval Issue

## Commit: 80b9633 - Debug Logging Added

### What Changed

Added explicit debug logging to both API routes to show:
1. The `autoApprove` parameter value received from frontend
2. The complete args array passed to `spawn()`
3. Whether `--auto-approve` flag is in the command

### Files Modified
- `app/api/workflow/stage/route.ts` (lines 114-116)
- `app/api/workflow/execute/route.ts` (lines 161-163)

### What to Look For in Railway Logs

When you run **Stage 1** on Railway after this deployment, you should see these logs **in order**:

```
🔧 Executing Stage 1: research...
📊 Topic Limit: 10
📂 Category Focus: derivatives
🤖 Auto-Approval: ENABLED
🐛 DEBUG: autoApprove parameter = true               ← NEW DEBUG LOG
🐛 DEBUG: Complete args array: ["/path/to/main.js","stage","research","--auto-approve","--topic-limit","10","--category","derivatives"]  ← NEW DEBUG LOG
🚀 Command: node stage research --auto-approve --topic-limit 10 --category derivatives
```

Then in the backend execution logs, you should see:

```
🔍 DEBUG: Parsed --auto-approve flag = true          ← Backend parsing
🔍 DEBUG: options.autoApprove = true                 ← Backend options
🔍 DEBUG Stage 1: options.autoApprove = true         ← Stage execution
🔍 DEBUG Stage 1: this.config.autoApprove = false
🔍 DEBUG Stage 1: resolved autoApprove = true
🤖 Auto-approved 10 high-priority gaps               ← SUCCESS!
```

---

## Diagnostic Scenarios

### Scenario 1: autoApprove parameter is false
```
🐛 DEBUG: autoApprove parameter = false
```
**Problem**: Frontend not passing autoApprove correctly
**Status**: Already fixed in commit de155ec, shouldn't happen
**Next Step**: Check `app/page.tsx` line 169

### Scenario 2: --auto-approve not in args array
```
🐛 DEBUG: Complete args array: ["/path/to/main.js","stage","research","--topic-limit","10","--category","derivatives"]
```
**Problem**: API route not adding the flag (lines 100-102)
**Status**: Conditional logic issue
**Next Step**: Review `app/api/workflow/stage/route.ts` lines 100-102

### Scenario 3: Backend not receiving flag
```
# Frontend logs show:
🐛 DEBUG: autoApprove parameter = true
🐛 DEBUG: Complete args array: [...,"--auto-approve",...]

# But backend logs don't show:
🔍 DEBUG: Parsed --auto-approve flag = true
```
**Problem**: `spawn()` not passing args correctly OR Railway not running latest backend code
**Status**: Node.js child process issue OR Railway cache
**Next Step**:
1. Check Railway deployment uses latest main.js
2. Check Node.js version compatibility
3. Try Railway cache clear

### Scenario 4: Backend receives flag but doesn't auto-approve
```
# Backend shows:
🔍 DEBUG: Parsed --auto-approve flag = true
🔍 DEBUG: options.autoApprove = true
🔍 DEBUG Stage 1: resolved autoApprove = true

# But CSV still has approval_status = "Pending"
```
**Problem**: `autoApproveAll()` method failing OR CSV write issue
**Status**: Business logic bug
**Next Step**: Check `backend/research/master-seo-researcher.js` line 1513

---

## Current State Summary

### What We've Fixed So Far
1. ✅ **JSON Parse Error** (commit 15cf2a0)
   - SSE log sanitization
   - ANSI code removal
   - Control character stripping
   - Log truncation

2. ✅ **Frontend autoApprove Parameter** (commit de155ec)
   - Added `autoApprove: true` to all stage execution API calls
   - Added CSV sync delays

3. ✅ **API Route Conditional Flag** (commit de155ec)
   - Made `--auto-approve` conditional based on request parameter
   - Default value: `true` for UI flows

4. ✅ **Backend Flag Parsing** (commit d00be4e)
   - Fixed autoApprove propagation in main.js
   - Added DEBUG logging in workflow-orchestrator.js

5. 🔄 **Debug Logging** (commit 80b9633 - THIS COMMIT)
   - Added explicit args array logging
   - Added autoApprove parameter logging

### What We're Testing Now
- Whether Railway is running the latest code
- Whether `--auto-approve` flag is in the spawned command
- Whether the flag reaches backend main.js

---

## Testing Steps

### After Railway Finishes Deploying:

1. **Visit the Railway app URL**
2. **Click "Run Stage-by-Stage"**
3. **Execute Stage 1 (Master SEO Research)**
4. **Copy ALL logs from the execution window**
5. **Look for the 🐛 DEBUG lines**

### What Success Looks Like:
```
🐛 DEBUG: autoApprove parameter = true
🐛 DEBUG: Complete args array: [...,"--auto-approve",...]
🔍 DEBUG: Parsed --auto-approve flag = true
🤖 Auto-approved 10 high-priority gaps
```

### What Failure Looks Like:
```
🐛 DEBUG: autoApprove parameter = false    ← Frontend issue
# OR
🐛 DEBUG: Complete args array: [... no --auto-approve ...]    ← API route issue
# OR
Missing backend DEBUG logs    ← spawn() or Railway issue
```

---

## Additional Debugging Tools

### 1. Debug Endpoint
Visit: `https://your-railway-app.railway.app/api/debug`

Should return:
```json
{
  "success": true,
  "checks": {
    "backendDirExists": true,
    "csvExists": true,
    "csvLineCount": 11,
    "backendFiles": ["main.js", "data", "core", ...]
  }
}
```

### 2. Direct CSV Inspection
If auto-approval still fails, check CSV directly via Railway shell:
```bash
# In Railway dashboard: Settings → Terminal
cat backend/data/research-gaps.csv | grep "approval_status"
```

Should show `"Yes"` not `"Pending"` after Stage 1.

---

## If Issue Persists After This Debug Commit

### Next Steps:
1. **Capture complete Railway logs** showing the 🐛 DEBUG lines
2. **Check Railway deployment** shows commit 80b9633 or later
3. **Verify Railway environment variables**:
   - GROQ_API_KEY
   - NODE_ENV (should be "production")
4. **Try Railway cache clear**: Settings → Builds → Clear Build Cache

### Contact Info
- **Created**: 2026-01-28
- **Status**: 🔄 Debug logging deployed, awaiting test results
- **Last Commit**: 80b9633

---

## Summary

This debug commit helps isolate exactly where the auto-approval workflow breaks:

```
Frontend (app/page.tsx)
  ↓ autoApprove: true
API Route (stage/route.ts)
  ↓ 🐛 DEBUG: autoApprove = ?
  ↓ 🐛 DEBUG: args = ?
  ↓ spawn('node', args)
Backend (main.js)
  ↓ 🔍 DEBUG: Parsed --auto-approve = ?
  ↓ 🔍 DEBUG: options.autoApprove = ?
Workflow (workflow-orchestrator.js)
  ↓ 🔍 DEBUG Stage 1: resolved autoApprove = ?
  ↓ autoApproveAll()
CSV (research-gaps.csv)
  ↓ approval_status = "Yes" ✅ or "Pending" ❌
```

The new 🐛 DEBUG logs will show us **exactly** where this chain breaks.
