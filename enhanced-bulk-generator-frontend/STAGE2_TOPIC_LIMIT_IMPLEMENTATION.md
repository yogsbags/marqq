# Stage 2 Topic Limit Implementation

## Overview

Implemented dynamic topic limit support for **Stage 2 (Topic Generation)** to make it consistent with other workflow stages (Stage 3, 4, 6). Previously, Stage 2 always generated exactly 50 topics regardless of the `--topic-limit` parameter.

## Problem Statement

**Before the fix:**
```bash
$ node main.js stage topics --topic-limit=1

📊 Target: 50 strategic topics  # ❌ Ignores limit
✅ Generated 50 topics            # ❌ Always generates 50
```

The system would:
- ✅ Parse `--topic-limit=1` correctly from CLI
- ✅ Store it in config
- ❌ **Ignore it completely in Stage 2**
- ❌ Always generate 50 topics (hardcoded)

## Root Cause

### 1. Hardcoded Values in `topic-generator.js`

**Lines 250-251** (before fix):
```javascript
async generateTopicsInBatches(approvedGaps) {
  const targetTotal = 50;      // ❌ Hardcoded
  const batchSize = 25;         // ❌ Hardcoded
  const batches = Math.ceil(targetTotal / batchSize);
```

### 2. No topicLimit Property in Constructor

**Lines 35-37** (before fix):
```javascript
constructor(config = {}) {
  // ...
  this.selectedCategory = config.category || null;
  // ❌ NO this.topicLimit property
}
```

### 3. Orchestrator Not Passing Limit

**Line 271** in `workflow-orchestrator.js` (before fix):
```javascript
// Generate topics - NO parameters passed
const topics = await this.topicGenerator.generateTopics();  // ❌
```

## Implementation

### 1. Add topicLimit Property to TopicGenerator

**`topic-generator.js:39-40`**
```javascript
constructor(config = {}) {
  // ...
  this.selectedCategory = config.category || null;

  // 🎯 Topic limit for controlled generation
  this.topicLimit = config.topicLimit || null;  // ✅ NEW

  // ...
}
```

### 2. Add Debug Logging

**`topic-generator.js:80-82`**
```javascript
validateConfig() {
  // ...
  if (this.selectedCategory) {
    console.log(`📂 Category Focus: ${this.selectedCategory.toUpperCase()}`);
  }
  if (this.topicLimit !== null) {
    console.log(`📊 Topic Limit: ${this.topicLimit}`);  // ✅ NEW
  }
  return true;
}
```

### 3. Use Dynamic Target in generateTopics()

**`topic-generator.js:124-137`**
```javascript
async generateTopics() {
  // ✅ NEW: Determine effective topic target
  const targetTopics = this.topicLimit ?? 50;

  console.log('\n🎯 TOPIC GENERATION STARTED');
  console.log('='.repeat(50));
  console.log(`🤖 AI Model: ${this.currentModel}`);  // ✅ Fixed from this.groqModel
  console.log(`📊 Target: ${targetTopics} strategic topics`);  // ✅ Dynamic

  if (this.selectedCategory) {
    console.log(`📂 Category Filter: ${this.selectedCategory.toUpperCase()}`);
  }
  if (this.topicLimit !== null) {
    console.log(`🔍 Topic limit applied: ${this.topicLimit}`);  // ✅ NEW
  }

  // ...

  // ✅ Pass targetTopics to batch generator
  let topics = await this.generateTopicsInBatches(approvedGaps, targetTopics);
}
```

### 4. Update Batch Generator to Accept Target

**`topic-generator.js:261-263`**
```javascript
/**
 * Generate topics in batches for reliability
 * Dynamically generates N topics based on topicLimit (defaults to 50)  // ✅ Updated doc
 */
async generateTopicsInBatches(approvedGaps, targetTotal = 50) {  // ✅ Accept parameter
  const batchSize = Math.min(25, targetTotal);  // ✅ Dynamic batch size
  const batches = Math.ceil(targetTotal / batchSize);

  console.log(`\n🔄 Batch Generation Strategy: ${batches} batches of ${batchSize} topics each`);
  // ...
}
```

### 5. Update Orchestrator to Pass Limit

**`workflow-orchestrator.js:240`**
```javascript
async executeStage2Topics(options = {}) {  // ✅ Accept options
  console.log('\n📍 STAGE 2: Topic Generation');
  console.log('-'.repeat(40));

  try {
    // ...

    // ✅ NEW: Get topic limit from options or config
    const limit = options.limit ?? this.config.topicLimit ?? null;

    // ✅ NEW: Create topic generator with limit if specified
    const topicGenerator = limit !== null
      ? new TopicGenerator({
          ...this.config,
          topicLimit: limit,
          seoDataFetcher: this.seoDataFetcher
        })
      : this.topicGenerator;

    if (limit !== null) {
      console.log(`🔍 Limiting topic generation to ${limit} topic(s)`);  // ✅ NEW
    }

    // Generate topics
    const topics = await topicGenerator.generateTopics();
    // ...
  }
}
```

### 6. Update executeStage() to Pass Options

**`workflow-orchestrator.js:661`**
```javascript
async executeStage(stageName, options = {}) {
  console.log(`\n🎯 Executing Stage: ${stageName}`);

  switch (stageName.toLowerCase()) {
    case 'research':
      return await this.executeStage1Research();
    case 'topics':
      return await this.executeStage2Topics(options);  // ✅ Pass options
    case 'deep-research':
      return await this.executeStage3DeepResearch(options);
    case 'content':
      return await this.executeStage4ContentCreation(options);  // ✅ Pass options
    // ...
  }
}
```

## Testing

### Expected Behavior After Fix

```bash
$ node main.js stage topics --topic-limit=1

✅ Topic Generator initialized
🤖 Primary Model: groq/compound (native web search)
📊 Topic Limit: 1  # ✅ Limit shown

🎯 TOPIC GENERATION STARTED
==================================================
🤖 AI Model: groq/compound
📊 Target: 1 strategic topics  # ✅ Dynamic target
🔍 Topic limit applied: 1      # ✅ Explicit confirmation

📊 Found 140 approved research gaps
🎯 Generating strategic topics...
🔍 Limiting topic generation to 1 topic(s)  # ✅ Limit applied!

🔄 Batch Generation Strategy: 1 batches of 1 topics each  # ✅ Only 1 batch
📦 Generating Batch 1/1...  # ✅ Only 1 batch

✅ Generated 1 topics from 140 research gaps  # ✅ Only 1 topic generated!
📝 1 topics saved to: data/generated-topics.csv
```

### Test Cases

#### 1. Generate 1 Topic
```bash
node main.js stage topics --topic-limit=1
# Expected: 1 topic generated in 1 batch
```

#### 2. Generate 5 Topics
```bash
node main.js stage topics --topic-limit=5
# Expected: 5 topics generated in 1 batch (batchSize = min(25, 5) = 5)
```

#### 3. Generate 30 Topics
```bash
node main.js stage topics --topic-limit=30
# Expected: 30 topics in 2 batches (25 + 5)
```

#### 4. No Limit (Default)
```bash
node main.js stage topics
# Expected: 50 topics in 2 batches (25 + 25) - backward compatible
```

#### 5. With Category Filter
```bash
node main.js stage topics --topic-limit=1 --category=derivatives
# Expected: 1 topic from derivatives category only
```

## Batch Size Logic

The batch size dynamically adjusts based on the target:

```javascript
const batchSize = Math.min(25, targetTotal);
```

**Examples:**
- Target 1: `batchSize = min(25, 1) = 1` → 1 batch of 1 topic
- Target 10: `batchSize = min(25, 10) = 10` → 1 batch of 10 topics
- Target 30: `batchSize = min(25, 30) = 25` → 2 batches (25 + 5)
- Target 50: `batchSize = min(25, 50) = 25` → 2 batches (25 + 25)
- Target 100: `batchSize = min(25, 100) = 25` → 4 batches (25 × 4)

## Consistency Across Stages

Now **all content-generating stages** honor the `--topic-limit` parameter:

| Stage | Parameter | Default | Limit Source |
|-------|-----------|---------|--------------|
| **Stage 2** | `topicLimit` | 50 | `options.limit` → `config.topicLimit` → 50 |
| **Stage 3** | `deepResearchLimit` | null | `options.limit` → `config.deepResearchLimit` → null |
| **Stage 4** | `contentLimit` | null | `options.limit` → `config.contentLimit` → null |
| **Stage 6** | `publicationLimit` | null | `options.limit` → `config.publicationLimit` → null |

### Cascading Behavior

The `--topic-limit` parameter cascades through stages:

```bash
node main.js full --topic-limit=5 --auto-approve
```

**Flow:**
1. **Stage 2**: Generates exactly **5 topics** (not 50)
2. **Stage 3**: Researches exactly **5 topics** (inherits limit)
3. **Stage 4**: Creates content for **5 topics** (inherits limit)
4. **Stage 6**: Publishes **5 articles** (inherits limit)

## Usage Examples

### Command Line

```bash
# Generate only 1 topic
node main.js stage topics --topic-limit=1

# Generate 3 topics from specific category
node main.js stage topics --topic-limit=3 --category=derivatives

# Full workflow with topic limit
node main.js full --topic-limit=5 --auto-approve

# Override individual stage limits
node main.js full \
  --topic-limit=10 \      # Stage 2: 10 topics
  --deep-research-limit=5 \   # Stage 3: 5 researched
  --content-limit=3 \         # Stage 4: 3 drafted
  --publication-limit=2       # Stage 6: 2 published
```

### Programmatic Usage

```javascript
const orchestrator = new WorkflowOrchestrator({
  topicLimit: 5,
  autoApprove: true
});

// Stage 2 will generate 5 topics instead of 50
await orchestrator.executeStage('topics');

// Or pass limit at execution time
await orchestrator.executeStage('topics', { limit: 1 });
```

## Benefits

1. **Consistent API**: All stages now use the same `options.limit` pattern
2. **Testing Efficiency**: Test with `--topic-limit=1` for faster iteration
3. **Resource Control**: Generate fewer topics for limited API budgets
4. **Incremental Workflows**: Generate 5 topics, review, generate 5 more
5. **Backward Compatible**: Default behavior unchanged (50 topics)

## Complete Fix Analysis

### The Missing Piece in main.js

The initial implementation updated `topic-generator.js` and `workflow-orchestrator.js` correctly, but **missed a critical piece in main.js**!

**Before Fix (main.js:236-244):**
```javascript
const stageOptions = {};
// Always pass limit regardless of truthiness - let the orchestrator handle null/undefined
if (stageName === 'deep-research') {
  stageOptions.limit = generator.config.deepResearchLimit;
} else if (stageName === 'content') {
  stageOptions.limit = generator.config.contentLimit;
} else if (stageName === 'publication') {
  stageOptions.limit = generator.config.publicationLimit;
}
// ❌ NO CONDITION FOR 'topics' - stageOptions remains empty {}
await generator.orchestrator.executeStage(stageName, stageOptions);
```

**After Fix (main.js:437-445):**
```javascript
const stageOptions = {};
// Always pass limit regardless of truthiness - let the orchestrator handle null/undefined
if (stageName === 'topics') {  // ✅ ADDED THIS!
  stageOptions.limit = generator.config.topicLimit;
} else if (stageName === 'deep-research') {
  stageOptions.limit = generator.config.deepResearchLimit;
} else if (stageName === 'content') {
  stageOptions.limit = generator.config.contentLimit;
} else if (stageName === 'publication') {
  stageOptions.limit = generator.config.publicationLimit;
}
await generator.orchestrator.executeStage(stageName, stageOptions);
```

### Why The Initial Fix Failed

The complete data flow requires **THREE files** to work together:

1. **main.js** - Must pass `topicLimit` to orchestrator via `stageOptions` ❌ **MISSING**
2. **workflow-orchestrator.js** - Must receive `options.limit` and pass to TopicGenerator ✅ **DONE**
3. **topic-generator.js** - Must use `topicLimit` instead of hardcoded 50 ✅ **DONE**

**The Flow with the Missing Piece:**
```
Command Line: --topic-limit=1
    ↓ (parsed correctly)
main.js: generator.config.topicLimit = 1
    ↓ (❌ NOT passed to orchestrator)
main.js: stageOptions = {}  ← EMPTY!
    ↓
orchestrator.executeStage('topics', {})
    ↓ (options.limit is undefined)
TopicGenerator created WITHOUT limit
    ↓
Generates 50 topics (default) ❌
```

**The Flow After Complete Fix:**
```
Command Line: --topic-limit=1
    ↓ (parsed correctly)
main.js: generator.config.topicLimit = 1
    ↓ (✅ NOW passed to orchestrator)
main.js: stageOptions = { limit: 1 }
    ↓
orchestrator.executeStage('topics', { limit: 1 })
    ↓ (options.limit = 1)
TopicGenerator created WITH limit: 1
    ↓
Generates 1 topic ✅
```

## Related Files Modified

1. **`/backend/research/topic-generator.js`**
   - Added `topicLimit` property to constructor
   - Updated `generateTopics()` to use dynamic target
   - Updated `generateTopicsInBatches()` to accept target parameter
   - Added debug logging for topic limit

2. **`/backend/core/workflow-orchestrator.js`**
   - Updated `executeStage2Topics()` to accept `options` parameter
   - Added limit extraction and TopicGenerator recreation logic
   - Updated `executeStage()` to pass options to Stage 2
   - Added Stage 4 options passing (was missing before)

3. **`/backend/main.js`** ⚠️ **CRITICAL FIX**
   - Added missing `topics` stage condition to pass `topicLimit` to `stageOptions`
   - Now matches the pattern for `deep-research`, `content`, and `publication` stages
   - Completes the data flow from CLI → orchestrator → TopicGenerator

## Deployment

### Initial Deployment (Partial Fix)

```bash
# Commit changes
git add backend/research/topic-generator.js
git add backend/core/workflow-orchestrator.js
git add STAGE2_TOPIC_LIMIT_IMPLEMENTATION.md

git commit -m "feat: Add dynamic topic limit support to Stage 2 (Topic Generation)

- Stage 2 now honors --topic-limit parameter instead of hardcoding 50 topics
- Consistent with Stage 3, 4, 6 limit behavior
- Batch size dynamically adjusts based on target (min(25, target))
- Added debug logging to show applied limits
- Backward compatible: defaults to 50 topics if no limit specified

Fixes topic generation ignoring --topic-limit parameter"

# Push to Railway (auto-deploy)
git push origin main
```

**Status:** ❌ Incomplete - Still failed in production testing

### Critical Bug Fix (Complete Solution)

After deployment, production testing revealed the fix **did NOT work**. The system still generated 50 topics instead of 1.

**Root Cause Discovered:** The `main.js` file was missing the condition to pass `topicLimit` to `stageOptions` for the `topics` stage!

```bash
# Commit the missing piece
git add backend/main.js

git commit -m "fix: Add missing 'topics' stage condition to pass topicLimit in main.js

- Stage 2 (Topic Generation) was ignoring --topic-limit parameter
- Root cause: main.js:236-244 had conditions for deep-research, content, publication but NOT topics
- Fixed by adding: if (stageName === 'topics') { stageOptions.limit = generator.config.topicLimit; }
- Now Stage 2 correctly receives the limit and generates only N topics instead of hardcoded 50
- Completes the topic limit implementation started in workflow-orchestrator.js and topic-generator.js

Fixes: Stage 2 ignoring --topic-limit=1 parameter (was generating 50 topics)
Related: STAGE2_TOPIC_LIMIT_IMPLEMENTATION.md, TOPIC_LIMIT_FIX.md"

# Push to Railway (auto-deploy)
git push origin main
```

**Status:** ✅ Complete - All files updated

### Additional Bug Fix (Logging Issue)

After the critical fix was deployed, production logs still showed `🤖 AI Model: undefined`. This was a **logging-only bug** that did not affect actual functionality.

**Root Cause:** Line 130 in `topic-generator.js` referenced `this.groqModel` (which doesn't exist) instead of `this.currentModel` (set in constructor line 30).

```bash
# Fix the logging bug
git add backend/research/topic-generator.js

git commit -m "fix: Correct AI model property name in topic-generator.js logging

- Changed \`this.groqModel\` to \`this.currentModel\` on line 130
- Root cause: Property was set as \`this.currentModel\` in constructor (line 30)
- Bug manifested as \"🤖 AI Model: undefined\" in logs
- This was a logging-only bug, did not affect actual model usage
- Now correctly displays the model being used (e.g., \"groq/compound\")

Fixes: User's logs showing \"🤖 AI Model: undefined\"
Related: STAGE2_TOPIC_LIMIT_IMPLEMENTATION.md, TOPIC_LIMIT_FIX.md"

# Push to Railway (auto-deploy)
git push origin main
```

**Status:** ✅ Complete - Logging fixed

## Next Steps

After Railway deployment, verify with:

```bash
# Test Stage 2 with limit
node main.js stage topics --topic-limit=1 --auto-approve

# Test full workflow with limit
node main.js full --topic-limit=1 --auto-approve
```

Expected logs should show:
- ✅ `📊 Topic Limit: 1`
- ✅ `🤖 AI Model: groq/compound` (no longer "undefined")
- ✅ `📊 Target: 1 strategic topics`
- ✅ `🔍 Topic limit applied: 1`
- ✅ `🔍 Limiting topic generation to 1 topic(s)`
- ✅ `🔄 Batch Generation Strategy: 1 batches of 1 topics each`
- ✅ `✅ Generated 1 topics from 140 research gaps`

---

**Implemented by:** Claude Code
**Date:** 2025-01-09
**Issue:** Stage 2 ignored `--topic-limit` parameter
**Status:** ✅ Ready for deployment
