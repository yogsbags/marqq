# Technology Stack

**Analysis Date:** 2025-01-17

## Languages

**Primary:**
- TypeScript 5.5.3 - Frontend, backend, API routes
- JavaScript (ES Modules) - Build configs, scripts

**Secondary:**
- CSS (Tailwind) - Styling
- Markdown - Documentation

## Runtime

**Environment:**
- Node.js >= 20.0.0
- Browser (ES2020 target)

**Package Manager:**
- npm
- Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- Vite 5.4.8 - Build tool and dev server (main app, port 3007)
- Next.js - Enhanced bulk generator frontend (port 3003)
- Express - Backend server (port 3006)

**UI Components:**
- Radix UI - Primitive components (60+ packages)
  - `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, etc.
- shadcn/ui patterns - Component architecture
- Tailwind CSS 3.4.13 - Utility-first styling
- Lucide React - Icon library

**State & Forms:**
- React Context - Global state (Auth, Theme)
- React Hook Form 7.53.0 - Form handling
- Zod 3.23.8 - Schema validation

**Testing:**
- Jest - Unit testing
- Playwright - E2E testing

**Build/Dev:**
- Vite 5.4.8 - Development server, bundling
- TypeScript 5.5.3 - Type checking
- ESLint 9.11.1 - Linting
- PostCSS 8.4.47 - CSS processing
- Autoprefixer - CSS vendor prefixes

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.90.1 - Authentication, database
- `groq-sdk` (via groqService) - LLM API client
- `@google/genai` 1.30.0 - Google Gemini AI
- `@fal-ai/client` 1.7.2 - Fal AI image/video generation
- `react-markdown` 9.1.0 - Markdown rendering

**UI Infrastructure:**
- `class-variance-authority` 0.7.0 - Variant styling
- `clsx` 2.1.1 - Conditional classes
- `tailwind-merge` 2.5.2 - Tailwind class merging
- `sonner` 1.5.0 - Toast notifications
- `cmdk` 1.0.0 - Command palette
- `recharts` 2.12.7 - Charts and data visualization

**Data Processing:**
- `date-fns` 3.6.0 - Date manipulation
- `uuid` 10.0.0 - UUID generation
- `csv-parse`, `csv-stringify` - CSV processing (bulk generator)

**Video & Media:**
- `multer` - File upload handling
- `cloudinary` 2.8.0 - Cloud video/image hosting

## Configuration

**Environment:**
- `.env` files for secrets
- Environment variables for API keys:
  - `GROQ_API_KEY` - Groq LLM
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Supabase
  - `FAL_KEY` - Fal AI
  - `HEYGEN_API_KEY` - HeyGen
  - `REPLICATE_API_TOKEN` - Replicate
  - `MOENGAGE_*` - MoEngage marketing

**Build:**
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript config (project references)
- `tsconfig.app.json` - App-specific TS config
- `tsconfig.node.json` - Node-specific TS config
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm
- Modern browser (Chrome, Firefox, Safari)

**Production:**
- Static hosting (Netlify) - Main frontend
- Node.js server - Backend APIs
- Railway - Enhanced bulk generator

## Project Structure

```
martech/
├── src/                          # Main Vite React app (Torqq AI)
│   ├── components/               # React components
│   ├── services/                 # Business logic services
│   ├── types/                    # TypeScript definitions
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom hooks
│   └── lib/                      # Utilities
├── enhanced-bulk-generator-frontend/  # Next.js bulk content generator
│   ├── app/                      # Next.js app router
│   └── backend/                  # Node.js backend
└── social-media-frontend/        # Social media campaign automation
    └── frontend/                 # Next.js frontend
```

## Port Allocation

| Service | Port | Purpose |
|---------|------|---------|
| Vite Dev Server | 3007 | Main frontend |
| Backend Server | 3006 | API backend |
| Bulk Generator | 3003 | Next.js frontend |
| Netlify (prod) | 443 | Production hosting |

---

*Stack analysis: 2025-01-17*
