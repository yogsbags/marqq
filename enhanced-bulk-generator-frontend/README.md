# Content Engine Frontend

Simple single-user frontend for executing the PL Capital AI Content Engine workflow.

## Features

- **One-Click Execution**: Single button to run the complete 7-stage workflow
- **Real-Time Monitoring**: Live updates for each workflow stage
- **Live Logs**: Stream of execution logs in real-time
- **Visual Status**: Color-coded status indicators for each stage
- **No Authentication**: Simple single-user interface (no login required)

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:3003**

### 3. Execute Workflow

1. Open http://localhost:3003 in your browser
2. Click the "🚀 Execute Full Workflow" button
3. Watch real-time progress through all 7 stages

## Port Configuration

**Frontend Port:** 3003 (configured in package.json)

**No conflicts with:**
- WordPress: 8080
- Sanity: 3333
- Next.js site: 3001
- Other services: 3000, 8001

## Workflow Stages

The frontend monitors these 7 stages:

1. **Stage 1: SEO Research** - Analyze competitors, identify 100 content gaps
2. **Stage 2: Topic Generation** - Generate 50 strategic topics
3. **Stage 3: Deep Research** - Deep competitor analysis per topic
4. **Stage 4: Content Creation** - Generate E-E-A-T compliant content
5. **Stage 5: SEO Optimization** - Add metadata, schema, internal links
6. **Stage 6: Publication** - Publish to WordPress + Sanity + Next.js
7. **Stage 7: Completion** - Workflow finalization

## How It Works

### Frontend (Next.js 14)
- Modern React UI with Tailwind CSS
- Server-Sent Events (SSE) for real-time updates
- Responsive design with live status indicators

### Backend API Route
- `/api/workflow/execute` - Spawns `node main.js full --auto-approve`
- Streams stdout/stderr back to frontend
- Detects stage changes based on console output
- Updates UI in real-time

### Workflow Execution
1. User clicks "Execute Full Workflow"
2. Frontend calls `/api/workflow/execute`
3. API spawns `main.js` process in parent directory
4. Process output streamed to frontend via SSE
5. Frontend updates stage statuses and logs in real-time

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── workflow/
│   │       └── execute/
│   │           └── route.ts      # API route to execute main.js
│   ├── globals.css               # Tailwind CSS
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage (workflow UI)
├── public/                       # Static assets
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Environment Variables

No environment variables required! The frontend automatically:
- Detects parent directory for `main.js`
- Uses existing backend environment variables
- Executes workflow with `--auto-approve` flag

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## Troubleshooting

### "Cannot find main.js"
- Ensure you're running from `frontend/` directory
- `main.js` should be in parent directory: `../main.js`

### Workflow Not Starting
- Check backend is properly configured
- Ensure environment variables are set (GROQ_API_KEY, etc.)
- Check logs in browser console

### Port Already in Use
- Change port in `package.json`: `"dev": "next dev -p 3002"`
- Choose any available port (avoid 8080, 3333, 3001, 3000, 8001)

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Runtime:** Node.js 18+
- **Real-time:** Server-Sent Events (SSE)

## Future Enhancements

Potential features for future versions:
- Workflow history and analytics
- Stage-by-stage execution (run individual stages)
- CSV data preview
- Published content gallery
- Performance metrics dashboard

## Related Files

- **Backend:** `../main.js` - Main workflow orchestrator
- **Config:** `../package.json` - Backend dependencies
- **Data:** `../data/*.csv` - Workflow data files

---

**Version:** 1.0.0
**Created:** 2025-10-27
**Port:** 3002
**Author:** PL Capital Content Team
