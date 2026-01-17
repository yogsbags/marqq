# Architecture

**Analysis Date:** 2025-01-17

## Pattern Overview

**Overall:** Hybrid Monolithic + Backend Architecture with Next.js Frontend

**Key Characteristics:**
- Next.js App Router for frontend and API routes
- Separate Node.js backend for heavy processing
- Child process spawning for workflow execution
- CSV-based data persistence (file-based state)
- Server-Sent Events (SSE) for streaming responses

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface, workflow orchestration UI
- Location: `enhanced-bulk-generator-frontend/app/`
- Contains: React components, pages, client-side logic
- Depends on: API routes, backend services
- Used by: End users via browser

**API Layer:**
- Purpose: HTTP endpoints, request handling
- Location: `enhanced-bulk-generator-frontend/app/api/`
- Contains: Next.js Route Handlers
- Depends on: Backend services, Node.js processes
- Used by: Frontend components

**Backend Layer:**
- Purpose: Business logic, AI workflows, data processing
- Location: `enhanced-bulk-generator-frontend/backend/`
- Contains: Node.js modules, workflow orchestration
- Depends on: External APIs (Groq, Google, etc.)
- Used by: API routes via child process

**Services Layer (Main App):**
- Purpose: Core business services
- Location: `src/services/`
- Contains: `agentService.ts`, `groqService.ts`, `csvAnalysisService.ts`
- Depends on: External APIs, types
- Used by: React components, contexts

## Data Flow

**Workflow Execution Flow:**

1. User clicks "Execute Stage" in UI (`app/page.tsx`)
2. Frontend calls `/api/workflow/stage` route
3. API route spawns `node main.js stage <name>` child process
4. Backend orchestrator executes stage logic
5. Results streamed back via SSE
6. Data persisted to CSV files
7. UI updates with results

**Agent Chat Flow:**

1. User sends message in chat interface
2. Frontend calls `agentService.executeTask()`
3. Service calls Groq API via `groqService.ts`
4. Response processed and formatted
5. Conversation stored in memory (in-process)
6. UI renders response

**State Management:**
- React Context for global state (Auth, Theme)
- CSV files for workflow data persistence
- In-memory Maps for agent state (non-persistent)

## Key Abstractions

**AgentService:**
- Purpose: AI agent orchestration and task execution
- Examples: `src/services/agentService.ts`
- Pattern: Static class with Maps for state

**WorkflowOrchestrator:**
- Purpose: Multi-stage content workflow execution
- Examples: `enhanced-bulk-generator-frontend/backend/core/workflow-orchestrator.js`
- Pattern: Pipeline with stage handlers

**CSVDataManager:**
- Purpose: File-based data persistence
- Examples: `enhanced-bulk-generator-frontend/backend/core/csv-data-manager.js`
- Pattern: Repository pattern for CSV files

## Entry Points

**Main Vite App:**
- Location: `src/main.tsx`
- Triggers: Browser navigation
- Responsibilities: React app bootstrap, routing

**Next.js App:**
- Location: `enhanced-bulk-generator-frontend/app/page.tsx`
- Triggers: Browser navigation to bulk generator
- Responsibilities: Workflow UI, stage execution

**Backend CLI:**
- Location: `enhanced-bulk-generator-frontend/backend/main.js`
- Triggers: Child process spawn from API routes
- Responsibilities: Workflow stage execution, AI processing

**Express Server:**
- Location: `server.js`
- Triggers: Production deployment
- Responsibilities: Static file serving, API proxying

## Error Handling

**Strategy:** Try-catch with console logging

**Patterns:**
- Generic error messages returned to UI
- Console.error for debugging
- No structured error types
- Limited error recovery

**Improvement Needed:**
- Add error boundaries in React
- Implement structured error classes
- Add retry logic for API failures

## Cross-Cutting Concerns

**Logging:**
- Console-based logging
- No structured logging framework
- No log aggregation

**Validation:**
- Zod for form validation
- Limited API input validation
- No schema validation at boundaries

**Authentication:**
- Supabase Auth
- Context-based session management
- No role-based access control

## Multi-Project Structure

```
martech/
├── src/                           # Main Vite React app (Torqq AI Platform)
│   └── [Presentation + Services]
├── enhanced-bulk-generator-frontend/  # Content generation workflow
│   ├── app/                       # Next.js frontend
│   └── backend/                   # Node.js backend
└── social-media-frontend/         # Social media automation
    └── frontend/                  # Video campaign generation
```

## 8-Stage Workflow Architecture

```
Stage 1: Master SEO Research → Gap analysis
Stage 2: Topic Generation → Strategic topics
Stage 3: Deep Topic Research → Competitor analysis
Stage 4: Content Creation → E-E-A-T articles
Stage 5: Content Review → Quality gates (approval)
Stage 6: SEO Optimization → Meta, schema, links
Stage 7: Publishing → WordPress, Sanity, Next.js
Stage 8: Completion → Performance tracking
```

---

*Architecture analysis: 2025-01-17*
