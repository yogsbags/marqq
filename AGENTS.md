# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Marqq AI** - A unified B2B Marketing Intelligence Platform with autonomous multi-agent AI for executing marketing tasks, monitoring, and self-improvement with minimal user intervention. Built with React, TypeScript, Vite, Supabase, LiveKit, and multiple AI providers (Groq, OpenAI, Gemini, HeyGen, Fal AI).

**Platform Vision**: Single platform for complete marketing automation covering lead intelligence, content creation, social media campaigns, video generation, SEO optimization, customer insights, and budget optimization.

## Architecture

### Unified Platform Model

Marqq AI is a **monolithic SPA** with clear internal module boundaries designed for future microservices migration. All modules share:

- Common authentication (Supabase)
- Shared UI components (shadcn/ui, Radix UI)
- Unified theme system (dark/light mode)
- Centralized agent orchestration
- Single deployment pipeline

### Technology Stack

**Frontend**:

- Vite + React 18 + TypeScript
- UI: Radix UI, shadcn/ui, Tailwind CSS
- State: React Context (Auth, Theme)
- Real-time: LiveKit, Supabase subscriptions

**Backend Services**:

- Supabase (auth, database, real-time)
- Node.js/Express (API proxy, workflow orchestration)
- Hybrid state management (CSV for workflows, JSON for campaigns, Supabase for user data)

**AI/ML Stack**:

- LLMs: Groq (primary), OpenAI GPT-4, Google Gemini
- Voice: Deepgram (STT), Cartesia/OpenAI (TTS)
- Video: LiveKit, HeyGen avatars, Google Veo 3.1, Fal AI
- Image: DALL-E 3, Fal AI, Replicate

**Infrastructure**:

- LiveKit Cloud (voice/video streaming)
- Cloudinary (media hosting)
- imgbb (image CDN)
- Shotstack (video editing)
- WordPress, Sanity CMS (content publishing)

## Directory Structure

```
martech/                               # Marqq AI Unified Platform
│
├── src/                               # Main Application (Vite + React)
│   ├── components/
│   │   ├── modules/                   # Feature Modules (Core Business Logic)
│   │   │   ├── EnhancedBulkGenerator.tsx      # Content Automation Module
│   │   │   ├── LeadIntelligenceFlow.tsx       # Lead Scoring & Enrichment
│   │   │   ├── SocialMediaFlow.tsx            # Social Campaign Management
│   │   │   ├── VideoGenFlow.tsx               # Video Generation
│   │   │   ├── AIVoiceBotFlow.tsx             # LiveKit Voice Bot
│   │   │   ├── CompanyIntelligenceFlow.tsx    # Company Data Enrichment
│   │   │   ├── UnifiedCustomerViewFlow.tsx    # 360° Customer View
│   │   │   ├── BudgetOptimizationFlow.tsx     # Marketing Spend Optimization
│   │   │   └── PerformanceScorecard.tsx       # Analytics Dashboard
│   │   ├── auth/                      # Authentication Components
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── dashboard/                 # Main Dashboard
│   │   │   └── DashboardContent.tsx
│   │   ├── chat/                      # AI Chat Interface
│   │   ├── social-media/              # Social Media UI Components
│   │   ├── video-gen/                 # Video Generation UI
│   │   ├── layout/                    # Layout Components
│   │   └── ui/                        # shadcn/ui Components (52 components)
│   ├── api/
│   │   └── workflow/                  # Workflow API Client
│   ├── services/
│   │   ├── agentService.ts            # Multi-Agent Orchestration
│   │   ├── groqService.ts             # Groq LLM Integration
│   │   └── csvAnalysisService.ts      # CSV Data Processing
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Supabase Auth
│   │   └── ThemeContext.tsx           # Dark/Light Theme
│   ├── types/                         # TypeScript Type Definitions
│   ├── hooks/                         # Custom React Hooks
│   ├── lib/                           # Utility Functions
│   ├── data/                          # Static Data & Configs
│   ├── App.tsx                        # Root Component
│   └── main.tsx                       # Entry Point
│
├── enhanced-bulk-generator-frontend/  # Content Automation Module Backend
│   ├── app/                           # Next.js UI (embedded in main app)
│   │   ├── api/workflow/              # Workflow API Routes (SSE)
│   │   └── page.tsx                   # Module Dashboard
│   └── backend/                       # Node.js Workflow Engine
│       ├── main.js                    # CLI Entry Point
│       ├── core/
│       │   ├── workflow-orchestrator.js   # 7-Stage Coordinator
│       │   └── csv-data-manager.js        # CSV State Management
│       ├── research/
│       │   ├── master-seo-researcher.js   # Stage 1: SEO Research
│       │   ├── topic-generator.js         # Stage 2: Topic Generation
│       │   └── deep-topic-researcher.js   # Stage 3: Deep Research
│       ├── content/
│       │   ├── content-creator.js         # Stage 4: Content Creation
│       │   ├── content-validator.js       # Stage 5: Quality Validation
│       │   ├── seo-optimizer.js           # Stage 6: SEO Optimization
│       │   └── content-publisher.js       # Stage 7: Multi-Platform Publishing
│       ├── integrations/
│       │   └── hero-image-generator.js    # DALL-E 3 + imgbb CDN
│       └── data/                          # CSV Workflow State
│
├── social-media-frontend/             # Social Media Campaign Module Backend
│   ├── frontend/                      # (UI embedded in main app)
│   ├── main.js                        # Campaign Workflow Engine
│   ├── core/
│   │   ├── workflow-engine.js         # Campaign Orchestrator
│   │   └── state-manager.js           # JSON State Persistence
│   ├── campaigns/                     # Campaign Templates
│   ├── video/                         # Veo 3.1 + HeyGen Integration
│   ├── video-gen/                     # Video Generation Modules
│   ├── social-media/                  # Platform Publishers
│   ├── scripts/                       # Utility Scripts
│   └── output/                        # Generated Content
│
├── dist/                              # Vite Build Output
├── public/                            # Static Assets
├── scripts/                           # Deployment & Utility Scripts
├── logs/                              # Application Logs
├── server.js                          # Production Server (port 3007)
├── package.json                       # Root Dependencies
├── vite.config.ts                     # Vite Configuration
├── tsconfig.json                      # TypeScript Config
└── tailwind.config.js                 # Tailwind Config
```

## Platform Modules

Marqq AI consists of **9 core modules** accessible from a unified dashboard:

### 1. Enhanced Bulk Generator

**Purpose**: Automated content creation pipeline for SEO dominance
**Workflow**: 7 stages (SEO Research → Topic Generation → Deep Research → Content Creation → Validation → SEO Optimization → Multi-Platform Publishing)
**Tech**: Next.js backend spawned from main app, CSV-based workflow state
**Output**: WordPress, Sanity CMS, Next.js frontend

### 2. Lead Intelligence Flow

**Purpose**: Lead scoring, enrichment, and lookalike modeling
**Features**: ICP matching, data quality checks, deduplication, segmentation
**Integration**: Apify, Apollo, LinkedIn scrapers

### 3. Social Media Flow

**Purpose**: Multi-platform campaign automation
**Features**: Campaign planning, content calendar, Veo 3.1 video generation, HeyGen avatars
**Platforms**: LinkedIn, Instagram, YouTube, Facebook, X (Twitter)

### 4. Video Generation Flow

**Purpose**: AI-powered video production
**Features**: Veo 3.1 scene extension (8s clips → 12-minute videos), multi-provider fallback
**Tech**: Google Veo 3.1, Fal AI, Replicate, HeyGen, Shotstack

### 5. AI Voice Bot Flow

**Purpose**: Real-time voice interaction for customer engagement
**Features**: LiveKit integration, Deepgram STT (99%+ accuracy), Cartesia TTS (Indian voices)
**Use Cases**: Lead qualification, customer support, product demos

### 6. Company Intelligence Flow

**Purpose**: Firmographic data enrichment and decision-maker identification
**Features**: Company profiling, tech stack detection, org chart mapping
**Sources**: Clearbit, LinkedIn, public filings

### 7. Unified Customer View

**Purpose**: 360° customer profile aggregation
**Features**: Cross-channel interaction history, predictive insights, journey mapping
**Data Sources**: CRM, email, social, support tickets, product usage

### 8. Budget Optimization Flow

**Purpose**: Marketing spend allocation and ROI analysis
**Features**: Channel performance comparison, budget forecasting, A/B testing
**Algorithms**: Multi-touch attribution, diminishing returns modeling

**Implementation flow**: User opens Budget Optimization (sidebar or `/budget-optimization`); [BudgetOptimizationFlow](src/components/modules/BudgetOptimizationFlow.tsx) loads connectors via `GET /api/budget-optimization/connectors`, then user selects connectors, timeframe, currency, question, optional data paste/upload and clicks Analyze. Backend [backend-server.js](enhanced-bulk-generator-frontend/backend-server.js) `POST /api/budget-optimization/analyze` runs rate limit, cache lookup, and a single Groq LLM call; response schema includes `kpiSnapshot`, `diagnosis`, `recommendations`, `budgetPlan`, `creativeInsights`, `reportHtml`. Result is shown in tabs: Overview, RCA, Recommendations, Creative, HTML Report. Connectors (Meta Ads, Google Ads, GA4, TikTok, Shopify, Snowflake, manual) are listed by status only; analysis today is driven by user-provided data + LLM (no live connector fetch yet).

**Budget Optimization vs industry AI adtech flow**: The industry flow is Research (ad spy) → Create (creative AI) → Target → Run and Optimize → Measure → Protect (fraud/safety). Martech Budget Optimization sits in **Measure + Run/Optimize**: it answers “what happened and how should we shift budget?” with RCA, KPIs, budget plan, and creative takeaways. It does **not** cover Research (ad spy), Create (asset generation), Target (audience), or Protect (fraud/safety). Connectors are planned; today analysis uses user-provided data + Groq.

| Industry stage         | Martech coverage | Notes                                                                                          |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| Research (ad spy)      | None             | No competitor ad library or SpyFu/Semrush-style spy.                                           |
| Create (creative AI)   | Partial          | Outputs creative insights (what worked / what to test) only; no asset generation.              |
| Target                 | None             | No audience or contextual targeting in this flow.                                              |
| Run and Optimize       | Core             | Budget reallocation and recommendations (channel-level); no automated bid changes in-platform. |
| Measure                | Core             | RCA, KPIs, diagnosis, budget plan (attribution-adjacent).                                      |
| Protect (fraud/safety) | None             | No ad fraud or policy checks.                                                                  |

### 9. Performance Scorecard

**Purpose**: Real-time analytics and KPI tracking
**Features**: Customizable dashboards, automated reporting, anomaly detection
**Metrics**: CAC, LTV, ROAS, conversion rates, engagement scores

## Common Commands

### Development

```bash
# Start full development environment
npm run dev                            # Vite dev server (port 5173)
npm run dev:full                       # Frontend + backend servers

# Type checking & linting
npm run typecheck                      # TypeScript validation
npm run lint                           # ESLint

# Preview production build
npm run build                          # Build to dist/
npm run preview                        # Preview production build
```

### Production

```bash
npm start                              # Start production server (port 3007)
```

### Backend Services

```bash
# Content Automation Module
npm run dev:backend                    # Start backend API (port 3006)

# Direct CLI access (for automation/testing)
cd enhanced-bulk-generator-frontend/backend
node main.js full --auto-approve --topic-limit=25
```

### Testing

```bash
# Connection tests
node test-supabase-connection.js       # Verify Supabase auth & DB
node test-groq-connection.js           # Verify Groq LLM
node test-auth.js                      # End-to-end auth flow

# Module-specific tests
cd social-media-frontend
node test-video-generation.js          # Veo 3.1 integration
node test-image-generation.js          # Image generation pipeline
```

## Environment Variables

### Core Platform

```bash
# Supabase (Auth + Database + Real-time)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Services
VITE_GROQ_API_KEY=gsk_...              # Groq LLM (primary)
VITE_OPENAI_API_KEY=sk-...             # OpenAI GPT-4 (fallback)
VITE_GEMINI_API_KEY=...                # Google Gemini

# LiveKit (Voice/Video)
VITE_LIVEKIT_URL=wss://...
VITE_LIVEKIT_API_KEY=...
VITE_LIVEKIT_API_SECRET=...

# Speech Services
VITE_DEEPGRAM_API_KEY=...              # Speech-to-Text
VITE_CARTESIA_API_KEY=...              # Text-to-Speech

# Media Services
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_API_KEY=...
VITE_CLOUDINARY_API_SECRET=...
VITE_FAL_API_KEY=...                   # Fal AI (video/image)
VITE_REPLICATE_API_TOKEN=...           # Replicate models
```

### Content Automation Module

```bash
# Publishing Platforms
WORDPRESS_REST_URL=http://localhost:8080
WORDPRESS_USERNAME=admin
WORDPRESS_PASSWORD=...
SANITY_PROJECT_ID=1eg1vt8d
SANITY_DATASET=production
SANITY_API_TOKEN=...

# Image Generation
IMGBB_API_KEY=...                      # Image CDN hosting

# Google APIs (Optional)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GSC_SITE_URL=https://your-site.com
GOOGLE_CSE_API_KEY=...
```

### Social Media Module

```bash
# Video Production
HEYGEN_API_KEY=...                     # AI Avatar generation
HEYGEN_AVATAR_ID=...
HEYGEN_VOICE_ID=...
SHOTSTACK_API_KEY=...                  # Video editing/compositing

# Multi-Platform Publishing (via Zapier MCP)
ZAPIER_API_KEY=...
```

## Key Architecture Patterns

### 1. Multi-Agent Orchestration

**Pattern**: Supervisor agent delegates to specialized agents based on task analysis

```typescript
// src/services/agentService.ts
interface Agent {
  role: string;
  capabilities: string[];
  tools: Tool[];
  execute(task: Task): Promise<Result>;
}

class SupervisorAgent implements Agent {
  private agents: Map<string, Agent>;

  async analyze(userIntent: string): Promise<Delegation> {
    // Analyze intent and decompose into subtasks
    const analysis = await this.llm.analyze(userIntent);

    // Determine which agents are needed
    const delegation = {
      primary: this.selectPrimaryAgent(analysis),
      supporting: this.selectSupportingAgents(analysis),
      workflow: this.buildWorkflow(analysis),
    };

    return delegation;
  }

  async delegate(delegation: Delegation): Promise<Result> {
    // Execute workflow with appropriate agents
    const results = await Promise.all(
      delegation.workflow.map((step) =>
        this.agents.get(step.agentType).execute(step.task)
      )
    );

    // Aggregate and validate results
    return this.aggregateResults(results);
  }
}
```

**Agent Capabilities**:

- **Lead Analyst**: Scoring, enrichment, lookalike modeling, ICP matching
- **Content Creator**: Blog posts, social content, email sequences, video scripts
- **Campaign Optimizer**: Budget allocation, A/B testing, ROI analysis, channel optimization
- **Customer Insights**: Segmentation, churn prediction, journey mapping, CLV modeling
- **Outreach Agent**: Email sequences, LinkedIn outreach, follow-ups, personalization

### 2. LiveKit Real-Time Voice Bot

**Pattern**: Bidirectional voice streaming with context-aware AI

```typescript
// src/components/modules/AIVoiceBotFlow.tsx
import { LiveKitRoom, useVoiceAssistant } from "@livekit/components-react";

function VoiceBot() {
  const { state, audioTrack } = useVoiceAssistant({
    onMessage: async (message) => {
      // Process user input with Groq
      const context = await getConversationContext();
      const response = await groqService.chat({
        messages: [...context, { role: "user", content: message }],
        model: "llama-3.3-70b-versatile",
      });

      // Update conversation state
      await updateContext(message, response);

      return response.content;
    },
    transcription: {
      model: "deepgram-nova-2", // 99%+ accuracy for Indian English
      language: "en-IN",
    },
    tts: {
      model: "cartesia", // Natural Indian voices
      voice: "indian-female-professional",
    },
  });

  return (
    <LiveKitRoom
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      token={accessToken}
      audio={true}
      video={false}
      connect={true}
    >
      <VoiceAssistantControlBar state={state} />
    </LiveKitRoom>
  );
}
```

**Voice Bot Features**:

- **Multi-language**: English, Hindi, Tamil
- **Interruption handling**: Real-time turn-taking
- **Context awareness**: Maintains conversation history
- **Fallback TTS**: Cartesia → OpenAI TTS
- **Low latency**: <500ms response time

### 3. Module Communication Pattern

**Pattern**: Main app embeds module UIs, spawns backend processes via API routes

```typescript
// src/components/modules/EnhancedBulkGenerator.tsx (Frontend)
function EnhancedBulkGenerator() {
  const executeWorkflow = async (config: WorkflowConfig) => {
    // Call module API route
    const response = await fetch("/api/workflow/execute", {
      method: "POST",
      body: JSON.stringify(config),
    });

    // Stream SSE updates
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const log = parseSSE(value);
      updateUI(log);
    }
  };

  return <ModuleUI onExecute={executeWorkflow} />;
}
```

```typescript
// enhanced-bulk-generator-frontend/app/api/workflow/execute/route.ts (Backend)
export async function POST(request: Request) {
  const config = await request.json();

  const stream = new ReadableStream({
    start(controller) {
      // Spawn backend Node.js process
      const process = spawn("node", [
        backendPath,
        "full",
        `--topic-limit=${config.topicLimit}`,
        "--auto-approve",
      ]);

      // Stream logs via SSE
      process.stdout.on("data", (data) => {
        const log = sanitizeLog(data.toString());
        const event = `data: ${JSON.stringify({ log })}\n\n`;
        controller.enqueue(encoder.encode(event));
      });

      process.on("exit", () => controller.close());
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

**SSE Log Sanitization** (Critical):

```typescript
function sanitizeLog(log: string): string {
  return log
    .replace(/\x1b\[[0-9;]*m/g, "") // Remove ANSI codes
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control chars
    .replace(/[^\x20-\x7E\n\r\t]/g, "") // Keep printable ASCII
    .substring(0, 5000); // Truncate long logs
}
```

### 4. Hybrid State Management

**Pattern**: Different state strategies for different use cases

```typescript
// User & Auth State → Supabase (real-time sync)
const { data: user } = useAuth();

// Workflow State → CSV (human-readable, editable)
const workflowState = await csvManager.read("workflow-status.csv");

// Campaign State → JSON (structured, version-controlled)
const campaignState = await stateManager.load("campaign-state.json");

// UI State → React Context (ephemeral)
const { theme, setTheme } = useTheme();
```

**Why Hybrid**:

- **Supabase**: Multi-user data, real-time updates, authentication
- **CSV**: Human-in-the-loop workflows, manual editing, audit trails
- **JSON**: Complex nested state, version control, portability
- **React Context**: UI preferences, session data, performance

### 5. Veo 3.1 Scene Extension

**Pattern**: Chain 8-second clips to create long-form videos (60s - 12 minutes)

```javascript
// social-media-frontend/video/veo-scene-extension.js
async function generateLongVideo(duration, prompts) {
  const numClips = Math.ceil(duration / 8);
  const clips = [];
  let previousClip = null;

  for (let i = 0; i < numClips; i++) {
    // Each clip extends the previous one
    const clip = await geminiService.generateVideo({
      prompt: prompts[i],
      previousClip: previousClip, // Key: extends previous clip
      duration: 8,
      model: "veo-3.1",
      aspectRatio: "16:9",
    });

    clips.push(clip.url);
    previousClip = clip.videoObject; // Pass to next iteration

    // Small delay to avoid rate limiting
    await sleep(500);
  }

  // Concatenate all clips seamlessly
  return await concatenateClips(clips);
}
```

**Scene Extension Flow**:

```
Prompt 1 + null           → Clip 1 (8s) → video_obj_1
Prompt 2 + video_obj_1    → Clip 2 (8s) → video_obj_2
Prompt 3 + video_obj_2    → Clip 3 (8s) → video_obj_3
...
Prompt 90 + video_obj_89  → Clip 90 (8s) → video_obj_90

Result: 90 clips × 8s = 12-minute seamless video
```

### 6. HeyGen Avatar + Shotstack Compositing

**Pattern**: Layer AI spokesperson over b-roll footage

```javascript
// social-media-frontend/video/composite-video.js
async function compositeAvatarVideo(script, brollUrls) {
  // 1. Generate HeyGen avatar video
  const avatar = await heygen.generate({
    script: script,
    avatar_id: process.env.HEYGEN_AVATAR_ID,
    voice_id: process.env.HEYGEN_VOICE_ID,
    duration: 90,
  });

  // 2. Create Shotstack edit with multiple tracks
  const edit = {
    timeline: {
      tracks: [
        // Track 1: B-roll background
        {
          clips: brollUrls.map((url, i) => ({
            asset: { type: "video", src: url },
            start: i * 30,
            length: 30,
          })),
        },
        // Track 2: Avatar (picture-in-picture)
        {
          clips: [
            {
              asset: { type: "video", src: avatar.url },
              start: 0,
              length: 90,
              position: "bottomRight",
              scale: 0.3,
              offset: { x: -20, y: -20 },
            },
          ],
        },
        // Track 3: Captions
        {
          clips: [
            {
              asset: {
                type: "html",
                html: generateCaptions(script),
              },
              start: 0,
              length: 90,
              position: "bottom",
            },
          ],
        },
      ],
    },
    output: {
      format: "mp4",
      resolution: "hd",
      aspectRatio: "16:9",
    },
  };

  // 3. Render composite video
  return await shotstack.render(edit);
}
```

### 7. Multi-Platform Publishing

**Pattern**: Single content source → multiple platform-optimized outputs

```javascript
// social-media-frontend/social-media/multi-platform-publisher.js
async function publishCampaign(campaignId) {
  const campaign = await getCampaign(campaignId);
  const { video, metadata } = campaign;

  // Render platform-specific versions
  const renders = await Promise.all([
    shotstack.render({ ...video, aspectRatio: "16:9" }), // YouTube, LinkedIn
    shotstack.render({ ...video, aspectRatio: "1:1" }), // Instagram Feed
    shotstack.render({ ...video, aspectRatio: "9:16" }), // Instagram Stories, Reels
  ]);

  // Publish to all platforms via Zapier MCP
  const results = await Promise.all([
    zapier.publishLinkedIn({
      video: renders[0],
      caption: metadata.linkedin.caption,
      hashtags: metadata.linkedin.hashtags,
    }),
    zapier.publishInstagram({
      feed: renders[1],
      stories: renders[2],
      caption: metadata.instagram.caption,
    }),
    zapier.publishYouTube({
      video: renders[0],
      title: metadata.youtube.title,
      description: metadata.youtube.description,
      tags: metadata.youtube.tags,
    }),
  ]);

  return {
    linkedin: results[0].url,
    instagram: results[1].url,
    youtube: results[2].url,
  };
}
```

## Development Workflows

### Adding a New Module

1. **Create Module Component**

```bash
# Create module in src/components/modules/
touch src/components/modules/NewModuleFlow.tsx
```

2. **Register in Dashboard Data**

```typescript
// src/data/dashboardData.ts
export const dashboardData = {
  modules: [
    {
      id: "new-module",
      name: "New Module",
      category: "automation",
      description: "Module description",
      icon: "🚀",
      metrics: {
        /* ... */
      },
    },
  ],
};
```

3. **Add Route in ModuleDetail**

```typescript
// src/components/modules/ModuleDetail.tsx
import { NewModuleFlow } from "./NewModuleFlow";

const moduleComponents = {
  "new-module": NewModuleFlow,
  // ... other modules
};
```

4. **Implement Module Logic**

```typescript
// src/components/modules/NewModuleFlow.tsx
export function NewModuleFlow() {
  // Module implementation
  return <div>New Module UI</div>;
}
```

### Modifying Multi-Agent System

1. **Define Agent Interface**

```typescript
// src/services/agentService.ts
interface NewAgent extends Agent {
  role: "new-role";
  capabilities: string[];
  execute(task: Task): Promise<Result>;
}
```

2. **Implement Agent**

```typescript
class NewAgentImpl implements NewAgent {
  async execute(task: Task) {
    // Agent logic
    const result = await this.llm.complete(task.prompt);
    return result;
  }
}
```

3. **Register with Supervisor**

```typescript
// Add to agents map
this.agents.set("new-role", new NewAgentImpl());
```

### Testing LiveKit Integration

```bash
# 1. Start LiveKit local server (development)
docker run --rm -p 7880:7880 -p 7881:7881 \
  livekit/livekit-server \
  --dev --node-ip=127.0.0.1

# 2. Set environment variables
export VITE_LIVEKIT_URL=ws://localhost:7880
export VITE_LIVEKIT_API_KEY=devkey
export VITE_LIVEKIT_API_SECRET=secret

# 3. Start Marqq AI
npm run dev

# 4. Navigate to AI Voice Bot module
# Open http://localhost:5173 → AI Voice Bot
```

### Debugging Content Automation

```bash
# 1. Enable debug logging
cd enhanced-bulk-generator-frontend/backend
export DEBUG=true

# 2. Test single stage
node main.js stage research --topic-limit=1 --auto-approve

# 3. Check CSV output
cat data/research-gaps.csv

# 4. View raw LLM responses
ls -la data/raw-responses/
```

## Port Allocation

**Marqq AI Platform**:

- **5173**: Vite dev server (development)
- **3007**: Production server (Railway/Vercel)
- **3006**: Backend API server (content automation module)

**External Dependencies**:

- **8080**: WordPress REST API
- **3333**: Sanity Studio
- **3001**: Next.js public frontend
- **7880/7881**: LiveKit server (local development)

## Deployment

### Production Build

```bash
# Build platform
npm run build

# Test production build locally
npm run preview

# Deploy to Railway/Vercel
npm start  # Uses server.js on port 3007
```

### Environment Configuration

**Railway/Vercel**:

- Set all `VITE_*` variables in dashboard
- Ensure `dist/` directory is included in deployment
- Configure `server.js` to serve static files + proxy APIs

**Critical Settings**:

- Node version: 20.x (specified in package.json engines)
- Build command: `npm run build`
- Start command: `npm start`
- Root directory: `/` (not subdirectory)

### Content Automation Module Deployment

The content automation backend must be deployed alongside the main app:

```bash
# Postinstall hook ensures backend is built
npm run postinstall

# Backend runs on port 3006, proxied through server.js
```

## AI Model Strategy

### LLM Fallback Chain

**Primary**: Groq (fast, cost-effective)

- `llama-3.3-70b-versatile` - Main reasoning
- `compound` - Content generation
- `compound-mini` - Quick queries

**Secondary**: OpenAI (reliable, high-quality)

- `gpt-4o` - Complex reasoning
- `gpt-4o-mini` - Cost-sensitive tasks

**Tertiary**: Google Gemini (multimodal, latest features)

- `gemini-2.5-pro` - Advanced reasoning
- `gemini-2.0-flash` - Fast responses

### Video Generation Fallback

**Primary**: Google Veo 3.1

- Scene extension capability
- Highest quality output
- 8s clip limitation (addressed via chaining)

**Secondary**: Fal AI

- Fast generation (<30s)
- Good quality/cost ratio
- Multiple model options

**Tertiary**: Replicate

- Stable Video Diffusion
- Cost-effective
- Broad model library

### Voice/Speech Models

**STT**: Deepgram Nova 2 (99%+ accuracy for Indian English)
**STT Fallback**: OpenAI Whisper

**TTS**: Cartesia (natural Indian voices, low latency)
**TTS Fallback**: OpenAI TTS

## Module Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    TORQQ AI PLATFORM                        │
│                   (Unified Dashboard)                       │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────┐      ┌─────────────┐
│   MODULES   │      │   AGENTS    │
└─────────────┘      └─────────────┘
    │                     │
    ├─ Lead Intelligence  ├─ Supervisor
    ├─ Content Automation ├─ Lead Analyst
    ├─ Social Media       ├─ Content Creator
    ├─ Video Generation   ├─ Campaign Optimizer
    ├─ Voice Bot          ├─ Customer Insights
    ├─ Company Intel      └─ Outreach Agent
    ├─ Customer View
    ├─ Budget Optimization
    └─ Performance Scorecard
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│BACKENDS │ │  STATE  │
└─────────┘ └─────────┘
    │           │
    ├─ Content  ├─ Supabase (users, auth)
    │  Engine   ├─ CSV (workflows)
    ├─ Social   ├─ JSON (campaigns)
    │  Workflow └─ React Context (UI)
    └─ Video
       Pipeline
```

## Critical Files

**Platform Core**:

- `src/App.tsx` - Root component, routing, auth
- `src/components/modules/ModuleDetail.tsx` - Module router
- `src/services/agentService.ts` - Multi-agent orchestration
- `src/contexts/AuthContext.tsx` - Supabase authentication
- `server.js` - Production server + API proxy

**Content Automation**:

- `enhanced-bulk-generator-frontend/backend/main.js` - CLI entry, config
- `enhanced-bulk-generator-frontend/backend/core/workflow-orchestrator.js` - Stage coordinator
- `enhanced-bulk-generator-frontend/app/api/workflow/execute/route.ts` - SSE API

**Social Media**:

- `social-media-frontend/main.js` - Campaign engine
- `social-media-frontend/video/veo-scene-extension.js` - Video generation
- `social-media-frontend/social-media/multi-platform-publisher.js` - Publishing

## Additional Documentation

**Cost & Operations**:

- `RUNNING_COSTS.md` - Per-module running cost estimates (APIs, hosting, usage tiers)

**Platform Architecture**:

- `ARCHITECTURE_PLAN.md` - Complete B2B Martech platform design
- `AGENTS.md` - Multi-agent system architecture
- `SUPABASE_SETUP.md` - Database schema & auth

**Content Automation**:

- `enhanced-bulk-generator-frontend/README.md` - Module overview
- `enhanced-bulk-generator-frontend/DEBUG_INSTRUCTIONS.md` - Debugging guide
- `enhanced-bulk-generator-frontend/RAILWAY_DEPLOYMENT_FIXES.md` - Deployment troubleshooting

**Social Media**:

- `social-media-frontend/README.md` - Campaign workflow guide
- `social-media-frontend/VEO_IMPLEMENTATION_SUMMARY.md` - Veo 3.1 integration
- `social-media-frontend/MULTI_PROVIDER_GUIDE.md` - Video provider fallback

## Platform Vision

Marqq AI is designed as a **unified martech intelligence platform** that:

1. **Automates** repetitive marketing tasks with minimal human intervention
2. **Orchestrates** multiple AI agents for complex workflows
3. **Integrates** seamlessly with existing marketing tools (WordPress, Sanity, LinkedIn, etc.)
4. **Scales** from monolithic deployment to microservices as needed
5. **Learns** from user interactions and self-improves over time

All modules share a common foundation (auth, UI, agents) while maintaining clear boundaries for future extraction into microservices.
