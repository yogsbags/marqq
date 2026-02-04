# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Enhanced Bulk Content Generator** - An AI-powered content automation platform that executes a 7-stage workflow for systematic content production targeting 1M monthly visitors. Built with a hybrid architecture combining Next.js frontend (port 3003) and Node.js backend workflow engine.

**Core Purpose**: Transform SEO research into published content across WordPress (8080), Sanity CMS (3333), and Next.js frontend (3001) with human-in-the-loop approval gates.

## Architecture

### Dual Execution Model

This system supports two execution modes:

1. **Standalone CLI Mode** (Backend Only)
   - Execute workflows via `node backend/main.js [command]`
   - Direct CSV manipulation and console output
   - Suitable for automation scripts and testing

2. **Frontend-Driven Mode** (Next.js + Backend)
   - User interface at http://localhost:3003
   - API routes spawn backend processes via `child_process.spawn()`
   - Real-time SSE (Server-Sent Events) for live progress updates
   - Visual workflow monitoring and data management

### Technology Stack

**Frontend Layer**:
- Next.js 14 (App Router, TypeScript)
- Port 3003 (default), 3007 (alt)
- Tailwind CSS for styling
- Server-Sent Events (SSE) for real-time updates

**Backend Layer**:
- Node.js workflow orchestrator
- Port 3006 (Express API server for standalone use)
- CSV-based state management
- Groq LLM integration with multi-model fallback

**Integration Layer**:
- WordPress REST API (port 8080)
- Sanity Mutations API (port 3333)
- Next.js public frontend (port 3001)
- Google APIs (Search Console, Custom Search, Analytics, Ads)
- OpenAI DALL-E 3 for hero image generation
- imgbb CDN for image hosting

## Directory Structure

```
enhanced-bulk-generator-frontend/
├── app/                           # Next.js App Router (Frontend)
│   ├── api/
│   │   └── workflow/              # API routes that spawn backend processes
│   │       ├── execute/           # Full workflow execution
│   │       ├── stage/             # Stage-by-stage execution
│   │       ├── data/              # CSV data retrieval
│   │       ├── edit/              # Row-level CSV editing
│   │       ├── approve-all/       # Bulk approval
│   │       ├── download-*/        # Content export (CSV, HTML, Markdown)
│   │       └── debug/             # Environment diagnostics
│   ├── components/
│   │   └── EditModal.tsx          # CSV row editing UI
│   ├── page.tsx                   # Main dashboard UI
│   └── layout.tsx                 # Root layout
│
├── backend/                       # Node.js Workflow Engine
│   ├── main.js                    # Entry point & CLI parser
│   ├── core/
│   │   ├── workflow-orchestrator.js   # Stage coordinator
│   │   └── csv-data-manager.js        # CSV CRUD operations
│   ├── research/
│   │   ├── master-seo-researcher.js   # Stage 1: SEO research
│   │   ├── topic-generator.js         # Stage 2: Topic generation
│   │   └── deep-topic-researcher.js   # Stage 3: Deep research
│   ├── content/
│   │   ├── content-creator.js         # Stage 4: Content creation
│   │   ├── content-validator.js       # Stage 5: Quality validation
│   │   ├── seo-optimizer.js           # Stage 6: SEO optimization
│   │   └── content-publisher.js       # Stage 7: Multi-platform publishing
│   ├── integrations/
│   │   └── hero-image-generator.js    # DALL-E 3 + imgbb CDN
│   ├── data/                          # CSV workflow state
│   │   ├── workflow-status.csv        # Workflow state tracking
│   │   ├── research-gaps.csv          # Stage 1 output
│   │   ├── quick-wins.csv             # Stage 1 quick win opportunities
│   │   ├── master-research.csv        # Stage 1 master research
│   │   ├── generated-topics.csv       # Stage 2 output
│   │   ├── topic-research.csv         # Stage 3 output
│   │   ├── created-content.csv        # Stage 4-6 output
│   │   ├── published-content.csv      # Stage 7 output
│   │   └── raw-responses/             # LLM raw outputs (debugging)
│   └── config/                        # Configuration files
│
├── backend-server.js              # Express server (port 3006) for standalone API
├── package.json                   # Frontend dependencies
└── backend/package.json           # Backend dependencies
```

## Common Commands

### Frontend Development

```bash
# Start Next.js development server (port 3003)
npm run dev

# Start on alternate port 3007
npm run dev:3007

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Backend CLI (Standalone Mode)

```bash
cd backend

# Initialize CSV files and data directories
node main.js init

# Execute full 7-stage workflow
node main.js full
node main.js full --auto-approve                    # Auto-approve high-priority items
node main.js full --auto-approve --topic-limit=25   # Limit to 25 topics

# Stage-by-stage execution
node main.js stage research                         # Stage 1: SEO Research
node main.js stage topics                           # Stage 2: Topic Generation
node main.js stage deep-research                    # Stage 3: Deep Research
node main.js stage content                          # Stage 4: Content Creation
node main.js stage validate                         # Stage 5: Validation
node main.js stage seo                              # Stage 6: SEO Optimization
node main.js stage publish                          # Stage 7: Publication

# Stage execution with options
node main.js stage research --auto-approve --category=derivatives
node main.js stage topics --topic-limit=10 --custom-topic="SIP investing"
node main.js stage content --custom-title="Complete Guide to Mutual Funds"

# Monitoring
node main.js status                                 # Show CSV stats & workflow progress
node main.js monitor                                # Real-time workflow monitoring

# Workflow shortcuts (legacy)
node main.js research                               # Stages 1-2 (SEO research + topics)
node main.js content                                # Stages 3-4 (Deep research + creation)
node main.js publish                                # Stages 5-7 (Validation + SEO + publishing)
```

### Backend API Server (Standalone Mode)

```bash
# Start Express API server on port 3006
npm run backend:3006
```

### Environment Variables

Required:
- `GROQ_API_KEY` - Groq LLM API key (primary model)
- `WORDPRESS_REST_URL` - WordPress REST API endpoint (e.g., `http://localhost:8080`)
- `WORDPRESS_USERNAME` - WordPress admin username
- `WORDPRESS_PASSWORD` - WordPress application password
- `SANITY_PROJECT_ID` - Sanity project ID (e.g., `1eg1vt8d`)
- `SANITY_DATASET` - Sanity dataset name (e.g., `production`)
- `SANITY_API_TOKEN` - Sanity API token with write permissions

Optional:
- `GEMINI_API_KEY` - Google Gemini API key (fallback LLM)
- `OPENAI_API_KEY` - OpenAI API key (DALL-E 3 image generation)
- `IMGBB_API_KEY` - imgbb API key (image CDN hosting)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud service account JSON
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Base64-encoded service account JSON (Railway deployment)
- `GSC_SITE_URL` - Google Search Console verified site URL
- `GSC_API_KEY` - Google Search Console API key
- `GOOGLE_CSE_API_KEY` - Google Custom Search Engine API key
- `GOOGLE_CSE_ID` - Google Custom Search Engine ID
- `NODE_ENV` - Environment (`development` or `production`)

## Key Architecture Patterns

### 1. Frontend-Backend Communication

**Pattern**: Spawn backend processes from Next.js API routes

```typescript
// app/api/workflow/execute/route.ts
import { spawn } from 'child_process';

// Spawn backend process
const backendProcess = spawn('node', [
  backendMainPath,
  'full',
  '--auto-approve',
  '--topic-limit', String(topicLimit)
], { cwd: backendDir });

// Stream output via SSE
const encoder = new TextEncoder();
backendProcess.stdout.on('data', (data) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: data.toString() })}\n\n`));
});
```

**Why**: Keeps frontend stateless while backend manages long-running workflows.

### 2. CSV-Based Workflow State

**Pattern**: Each stage reads/writes CSV files for state persistence

```javascript
// backend/core/csv-data-manager.js
class CSVDataManager {
  async readCSV(filename) {
    // Read CSV with csv-parse
  }

  async writeCSV(filename, data) {
    // Write CSV with csv-stringify
  }

  async updateRow(filename, rowId, updates) {
    // Update specific row by ID
  }
}
```

**CSV Schema**:
- `research-gaps.csv`: `topic_id, keyword, search_volume, difficulty, content_gap, priority_score, approval_status`
- `generated-topics.csv`: `topic_id, title, category, focus_keyword, approval_status`
- `created-content.csv`: `topic_id, title, content_markdown, content_html, seo_metadata, approval_status`
- `published-content.csv`: `topic_id, wordpress_url, sanity_url, frontend_url, published_at`

**Approval Gates**:
- `approval_status = "Pending"` - Awaiting human review
- `approval_status = "Yes"` - Approved for next stage
- `approval_status = "No"` - Rejected
- Auto-approval: Items with `priority_score >= 90` can be auto-approved via `--auto-approve` flag

### 3. Multi-Model LLM Fallback Chain

**Pattern**: Graceful degradation through model cascade

```javascript
// backend/main.js CONFIG
models: {
  primary: 'groq/compound',                    // Fast, cost-effective
  compoundMini: 'groq/compound-mini',          // Backup
  browserSearch20B: 'openai/gpt-oss-20b',     // Browser search 20B
  browserSearch120B: 'openai/gpt-oss-120b',   // Browser search 120B
  gemini: 'gemini-2.5-pro',                    // Google Gemini
  fallback: 'meta-llama/llama-4-maverick'     // Final fallback
}

// Execution pattern
async function executeWithFallback(prompt) {
  for (const model of modelChain) {
    try {
      return await llm.generate(model, prompt);
    } catch (error) {
      console.log(`Model ${model} failed, trying next...`);
    }
  }
  throw new Error('All models failed');
}
```

### 4. Multi-Platform Publishing Pipeline

**Pattern**: Parallel publishing to WordPress, Sanity, and Next.js

```javascript
// backend/content/content-publisher.js
async publishContent(row) {
  const results = await Promise.allSettled([
    this.publishToWordPress(row),      // WordPress REST API
    this.publishToSanity(row),         // Sanity Mutations API
    this.publishToNextJS(row)          // Next.js frontend deployment
  ]);

  // Aggregate URLs
  return {
    wordpress_url: results[0].value?.url,
    sanity_url: results[1].value?.url,
    frontend_url: results[2].value?.url
  };
}
```

**WordPress**: `POST /wp/v2/posts` with HTML content
**Sanity**: `POST /v1/data/mutate/{dataset}` with Portable Text
**Next.js**: Auto-fetches from Sanity, renders at `/posts/{slug}`

### 5. SSE Log Sanitization (Critical for Railway/Vercel)

**Problem**: ANSI codes and control characters break JSON parsing in SSE streams

**Solution**: Sanitize all logs before sending via SSE

```typescript
// app/api/workflow/execute/route.ts
function sanitizeLog(log: string): string {
  return log
    .replace(/\x1b\[[0-9;]*m/g, '')        // Remove ANSI color codes
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')  // Remove control characters
    .replace(/[^\x20-\x7E\n\r\t]/g, '')    // Keep only printable ASCII
    .substring(0, 5000);                    // Truncate long logs
}

controller.enqueue(encoder.encode(`data: ${JSON.stringify({
  log: sanitizeLog(data.toString())
})}\n\n`));
```

**Reference**: See `enhanced-bulk-generator-frontend/DEBUG_INSTRUCTIONS.md` for complete debugging workflow.

## Workflow Stages

### Stage 1: Master SEO Research
- **Module**: `backend/research/master-seo-researcher.js`
- **Purpose**: Analyze competitors, identify 100 content gaps
- **Output**: `research-gaps.csv`, `quick-wins.csv`, `master-research.csv`
- **Auto-approval**: High-priority gaps (score ≥90) when `--auto-approve` flag set

### Stage 2: Topic Generation
- **Module**: `backend/research/topic-generator.js`
- **Purpose**: Generate 50 strategic topics from research gaps
- **Output**: `generated-topics.csv`
- **Strategy**: 20 Quick Wins (30-60 day ranking), 20 Authority Builders (3-6 months), 10 Competitive Strikes

### Stage 3: Deep Research
- **Module**: `backend/research/deep-topic-researcher.js`
- **Purpose**: Deep competitor analysis per approved topic
- **Output**: `topic-research.csv`
- **Competitors**: Groww.in, Zerodha.com/varsity, ETMoney.com, PaytmMoney.com, INDmoney.com

### Stage 4: Content Creation
- **Module**: `backend/content/content-creator.js`
- **Purpose**: Generate E-E-A-T compliant articles (2000-3000 words)
- **Output**: `created-content.csv` (markdown + HTML versions)
- **Features**: Hero image generation (DALL-E 3), content outline, expert insights

### Stage 5: Content Validation
- **Module**: `backend/content/content-validator.js`
- **Purpose**: Quality scoring (90%+ target)
- **Checks**: E-E-A-T compliance, readability, factual accuracy, plagiarism

### Stage 6: SEO Optimization
- **Module**: `backend/content/seo-optimizer.js`
- **Purpose**: Add metadata, schema markup, internal links
- **Output**: Updated `created-content.csv` with `seo_metadata` field

### Stage 7: Multi-Platform Publication
- **Module**: `backend/content/content-publisher.js`
- **Purpose**: Publish to WordPress, Sanity, Next.js
- **Output**: `published-content.csv` with URLs
- **Workflow**: WordPress (draft mode) → Sanity (published) → Next.js (auto-deployed)

## Development Workflow

### Adding a New Stage

1. Create module in `backend/content/` or `backend/research/`
2. Implement stage method in `backend/core/workflow-orchestrator.js`
3. Add CSV output schema to `backend/core/csv-data-manager.js`
4. Update `backend/main.js` CLI parser for new stage command
5. Add frontend stage tracking in `app/page.tsx` stages array

### Modifying CSV Schema

1. Update CSV headers in `backend/core/csv-data-manager.js`
2. Run `node backend/main.js init` to reinitialize CSV files
3. Update frontend data parsing in `app/api/workflow/data/route.ts`
4. Update `EditModal.tsx` if editing UI needs new fields

### Testing API Routes Locally

```bash
# Terminal 1: Start backend in watch mode
cd backend
node --watch main.js monitor

# Terminal 2: Start frontend dev server
npm run dev

# Terminal 3: Test API endpoint
curl -X POST http://localhost:3003/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{"topicLimit": 5, "category": "derivatives", "autoApprove": true}'
```

### Debugging Railway/Vercel Deployments

**Common Issues**:

1. **Auto-approval not working**: Check `DEBUG_INSTRUCTIONS.md` for systematic debugging
2. **SSE JSON parse errors**: Ensure log sanitization is enabled (commit 15cf2a0)
3. **CSV not persisting**: Check file write permissions and Railway volume mounts
4. **Backend not found**: Verify `backend/` directory is included in deployment

**Debug Endpoint**: `GET /api/debug` returns environment diagnostics

## Port Allocation

- **3003**: Frontend (Next.js default)
- **3006**: Backend API server (Express, standalone mode)
- **3007**: Frontend alternate port (dev mode)
- **8080**: WordPress REST API (external)
- **3333**: Sanity Studio (external)
- **3001**: Next.js public frontend (external)

## Critical Files

- `backend/main.js`: CLI entry point, config, command parser
- `backend/core/workflow-orchestrator.js`: Stage coordinator, auto-approval logic
- `backend/core/csv-data-manager.js`: CSV CRUD operations
- `app/page.tsx`: Main UI dashboard, SSE client
- `app/api/workflow/execute/route.ts`: Full workflow execution API
- `app/api/workflow/stage/route.ts`: Stage-by-stage execution API
- `backend-server.js`: Standalone Express API server (port 3006)

## Content Categories

**Supported Categories** (from `backend/research/wealth_categories.json`):
- derivatives
- mutual-funds
- stocks-trading
- insurance
- retirement-planning
- tax-planning
- crypto-investing
- alternative-investments

**Category Filtering**: Use `--category=<name>` flag to focus workflow on specific vertical.

## Deployment

### Railway/Vercel Deployment

**Critical**: Backend must be deployed alongside frontend. Ensure:

1. `backend/` directory is included in build
2. Environment variables set in Railway/Vercel dashboard
3. Node.js version ≥18 specified in `package.json` engines
4. `railway.toml` or `vercel.json` configured for static asset serving

**Reference**: See `RAILWAY_DEPLOYMENT_FIXES.md` for complete deployment guide.

### Local Docker Deployment

```bash
# Build Docker image
docker build -t enhanced-bulk-generator .

# Run container
docker run -p 3003:3003 \
  -e GROQ_API_KEY=your_key \
  -e WORDPRESS_REST_URL=http://localhost:8080 \
  enhanced-bulk-generator
```

## Testing

### Unit Testing (Backend)

```bash
cd backend
node test-google-apis.js      # Test Google API integrations
```

### Integration Testing

```bash
# Test full workflow with single topic
node backend/main.js full --topic-limit=1 --auto-approve

# Verify CSV outputs
ls -la backend/data/*.csv
```

### Frontend E2E Testing

Use browser devtools to monitor:
- Network tab: Check SSE stream at `/api/workflow/execute`
- Console: Watch for sanitized logs
- Application > Storage: Check for localStorage persistence

## Known Issues & Fixes

1. **Auto-approval flag not propagating**: Fixed in commit 80b9633, see `DEBUG_INSTRUCTIONS.md`
2. **SSE JSON parse errors**: Fixed in commit 15cf2a0 with log sanitization
3. **CSV topic limit ignored**: Fixed in commit d00be4e, see `TOPIC_LIMIT_FIX.md`
4. **Category filtering broken**: Fixed in commit c789, see `CATEGORY_FILTERING_FIX.md`
5. **Download truncation**: Fixed in commit a456, see `DOWNLOAD_TRUNCATION_FIX.md`

## Additional Documentation

- `DEBUG_INSTRUCTIONS.md`: Auto-approval debugging workflow
- `RAILWAY_DEPLOYMENT_FIXES.md`: Railway-specific deployment issues
- `RAILWAY_ENV_COMPLETE_SETUP.md`: Environment variable setup guide
- `STAGE2_TOPIC_LIMIT_IMPLEMENTATION.md`: Topic limit feature implementation
- `WORKFLOW_FIX_SUMMARY.md`: Historical bug fixes and resolutions
- `README.md`: High-level project overview
- `README_INTEGRATION.md`: Integration architecture

## Support

For issues related to:
- **Frontend UI**: Check `app/page.tsx` and `app/components/`
- **Backend Workflow**: Check `backend/core/workflow-orchestrator.js`
- **CSV Operations**: Check `backend/core/csv-data-manager.js`
- **API Routes**: Check `app/api/workflow/*/route.ts`
- **Deployment**: Check `RAILWAY_DEPLOYMENT_FIXES.md`
