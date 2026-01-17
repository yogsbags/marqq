# Codebase Structure

**Analysis Date:** 2025-01-17

## Directory Layout

```
martech/
├── .bolt/                    # Bolt configuration
├── .claude/                  # Claude Code / GSD configuration
│   ├── agents/               # GSD agent definitions
│   ├── commands/gsd/         # GSD slash commands
│   ├── get-shit-done/        # GSD templates & workflows
│   └── hooks/                # GSD hooks
├── .planning/                # GSD project planning
│   └── codebase/             # Codebase documentation
├── dist/                     # Vite build output
├── enhanced-bulk-generator-frontend/  # Bulk content generator
│   ├── app/                  # Next.js app router
│   │   ├── api/              # API routes
│   │   └── components/       # React components
│   ├── backend/              # Node.js backend
│   │   ├── core/             # Orchestrator, CSV manager
│   │   ├── research/         # SEO & topic research
│   │   ├── content/          # Content creation & publishing
│   │   └── utils/            # Utilities
│   └── data/                 # CSV data, exports
├── public/                   # Static assets
├── social-media-frontend/    # Social media automation
│   └── frontend/             # Next.js video campaigns
└── src/                      # Main Vite React app
    ├── components/           # React components
    │   ├── chat/             # Chat interface
    │   ├── dashboard/        # Dashboard views
    │   ├── notifications/    # Notification panel
    │   ├── settings/         # Settings panel
    │   └── ui/               # shadcn/ui components
    ├── contexts/             # React contexts
    ├── hooks/                # Custom hooks
    ├── lib/                  # Utilities (supabase, utils)
    ├── services/             # Business services
    └── types/                # TypeScript definitions
```

## Directory Purposes

**`src/` (Main App - Torqq AI Platform):**
- Purpose: Marketing intelligence platform UI
- Contains: React components, services, types
- Key files: `App.tsx`, `main.tsx`

**`src/components/`:**
- Purpose: React UI components
- Contains: Feature components, UI primitives
- Key files: `DashboardContent.tsx`, `ChatToggle.tsx`

**`src/services/`:**
- Purpose: Business logic and API clients
- Contains: Agent service, Groq service, CSV analysis
- Key files: `agentService.ts`, `groqService.ts`

**`src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Interfaces, type aliases
- Key files: `agent.ts`, `auth.ts`

**`enhanced-bulk-generator-frontend/`:**
- Purpose: Automated content generation workflow
- Contains: Next.js frontend + Node.js backend
- Key files: `app/page.tsx`, `backend/main.js`

**`enhanced-bulk-generator-frontend/backend/`:**
- Purpose: Workflow orchestration and AI processing
- Contains: Stage handlers, data managers
- Key files: `main.js`, `core/workflow-orchestrator.js`

**`social-media-frontend/`:**
- Purpose: Video campaign automation
- Contains: Next.js app for video generation
- Key files: Video generation, Shotstack integration

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Main Vite app entry
- `src/App.tsx`: Root React component
- `enhanced-bulk-generator-frontend/app/page.tsx`: Bulk generator UI (1,086 lines)
- `enhanced-bulk-generator-frontend/backend/main.js`: Backend CLI entry

**Configuration:**
- `package.json`: Dependencies, scripts
- `vite.config.ts`: Vite configuration
- `tsconfig.json`: TypeScript config
- `tailwind.config.js`: Tailwind CSS config
- `eslint.config.js`: ESLint rules

**Core Logic:**
- `src/services/agentService.ts`: Agent orchestration (1,000+ lines)
- `src/services/groqService.ts`: LLM API client
- `enhanced-bulk-generator-frontend/backend/core/workflow-orchestrator.js`: Workflow engine

**API Routes:**
- `enhanced-bulk-generator-frontend/app/api/workflow/stage/route.ts`: Stage execution
- `enhanced-bulk-generator-frontend/app/api/workflow/execute/route.ts`: Full workflow
- `enhanced-bulk-generator-frontend/app/api/workflow/data/route.ts`: Data fetching

**Testing:**
- No dedicated test directories

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `DashboardContent.tsx`)
- Services: `camelCase.ts` (e.g., `agentService.ts`)
- API routes: `route.ts` in named directories
- Configs: `*.config.js` or `*.config.ts`

**Directories:**
- Features: `kebab-case` (e.g., `enhanced-bulk-generator-frontend`)
- Components: `kebab-case` (e.g., `ui`, `chat`, `dashboard`)
- API: `kebab-case` (e.g., `workflow`, `convert`)

## Where to Add New Code

**New Feature (Main App):**
- Primary code: `src/components/<feature>/`
- Services: `src/services/<feature>Service.ts`
- Types: `src/types/<feature>.ts`
- Tests: `src/__tests__/<feature>/` (create)

**New UI Component:**
- Implementation: `src/components/ui/<component>.tsx`
- Follow shadcn/ui patterns

**New API Route (Bulk Generator):**
- Implementation: `enhanced-bulk-generator-frontend/app/api/<route>/route.ts`

**New Backend Module (Bulk Generator):**
- Implementation: `enhanced-bulk-generator-frontend/backend/<category>/<module>.js`

**Utilities:**
- Shared helpers: `src/lib/utils.ts`
- Feature-specific: `src/services/`

## Special Directories

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**`.planning/`:**
- Purpose: GSD project planning docs
- Generated: By GSD commands
- Committed: Yes

**`enhanced-bulk-generator-frontend/backend/data/`:**
- Purpose: CSV data, exports, raw responses
- Generated: By workflow execution
- Committed: Partial (templates yes, data no)

## Import Path Aliases

**Main App:**
```typescript
// Use @/ for src/ imports
import { Agent } from '@/types/agent';
import { AgentService } from '@/services/agentService';
```

**Bulk Generator:**
```typescript
// Relative imports
import { WorkflowOrchestrator } from '../core/workflow-orchestrator.js';
```

---

*Structure analysis: 2025-01-17*
