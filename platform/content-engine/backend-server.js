/**
 * Torqq AI — Content Engine Backend
 * ===================================
 * Express server on port BACKEND_PORT (default 3008).
 * Spawned by server.js; all /api/* traffic is proxied here from port 3007.
 *
 * Routes:
 *   GET  /health                       — health check
 *   GET  /api/agents/status            — read heartbeat/status.json
 *   GET  /api/agents/:name/memory      — read agent MEMORY.md
 *   POST /api/agents/context           — write client context markdown
 *   POST /api/agents/:name/run         — SSE streaming Groq call (SOUL.md as system prompt)
 */

import express from 'express'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Groq from 'groq-sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Paths relative to this file (platform/content-engine/)
const CREWAI_DIR     = join(__dirname, '..', 'crewai')
const HEARTBEAT_PATH = join(CREWAI_DIR, 'heartbeat', 'status.json')
const AGENTS_DIR     = join(CREWAI_DIR, 'agents')
const CTX_DIR        = join(CREWAI_DIR, 'client_context')

const VALID_AGENTS   = new Set(['zara', 'maya', 'riya', 'arjun', 'dev', 'priya'])
const PORT           = Number(process.env.BACKEND_PORT || 3008)
const groq           = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

const app = express()
app.use(express.json())

// ── Health ─────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'content-engine' })
})

// ── GET /api/agents/status ─────────────────────────────────────────────────────
// Returns heartbeat/status.json (updated by Python scheduler after each run).
// Falls back to default idle state if file does not exist yet.

app.get('/api/agents/status', async (_req, res) => {
  try {
    const raw = await readFile(HEARTBEAT_PATH, 'utf-8')
    res.json(JSON.parse(raw))
  } catch {
    res.json({
      updated_at: null,
      agents: {
        zara:  { status: 'idle', last_run: null, duration_ms: null },
        maya:  { status: 'idle', last_run: null, duration_ms: null },
        riya:  { status: 'idle', last_run: null, duration_ms: null },
        arjun: { status: 'idle', last_run: null, duration_ms: null },
        dev:   { status: 'idle', last_run: null, duration_ms: null },
        priya: { status: 'idle', last_run: null, duration_ms: null },
      }
    })
  }
})

// ── POST /api/agents/context ───────────────────────────────────────────────────
// Saves client business context to client_context/{userId}.md.
// IMPORTANT: must be declared BEFORE /:name routes to avoid 'context' being
// matched as the :name param.

app.post('/api/agents/context', async (req, res) => {
  const { userId, company, industry, icp, competitors, campaigns, keywords, goals } = req.body

  if (!userId || !company) {
    return res.status(400).json({ error: 'userId and company are required' })
  }

  const content = `# Client Context

**Company**: ${company}
**Industry**: ${industry || '—'}
**Target ICP**: ${icp || '—'}
**Top Competitors**: ${competitors || '—'}
**Current Campaigns**: ${campaigns || '—'}
**Active Keywords**: ${keywords || '—'}
**Key Goals this Quarter**: ${goals || '—'}
`

  try {
    await mkdir(CTX_DIR, { recursive: true })
    await writeFile(join(CTX_DIR, `${userId}.md`), content, 'utf-8')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/agents/:name/memory ───────────────────────────────────────────────
// Returns the agent's MEMORY.md content.

app.get('/api/agents/:name/memory', async (req, res) => {
  const { name } = req.params

  if (!VALID_AGENTS.has(name)) {
    return res.status(404).json({ error: 'Unknown agent' })
  }

  const memoryPath = join(AGENTS_DIR, name, 'memory', 'MEMORY.md')
  try {
    const content = await readFile(memoryPath, 'utf-8')
    res.json({ agent: name, memory: content })
  } catch {
    res.json({ agent: name, memory: '_No memory yet._' })
  }
})

// ── POST /api/agents/:name/run ─────────────────────────────────────────────────
// Runs an agent interactively (triggered by slash commands in ChatHome).
// Loads SOUL.md + MEMORY.md as system prompt, calls Groq, streams SSE.
// Response format: data: {"text":"..."}\n\n ... data: [DONE]\n\n

app.post('/api/agents/:name/run', async (req, res) => {
  const { name } = req.params
  const { query } = req.body

  if (!VALID_AGENTS.has(name)) {
    return res.status(404).json({ error: 'Unknown agent' })
  }
  if (!query?.trim()) {
    return res.status(400).json({ error: 'query is required' })
  }

  // Load SOUL.md
  const soulPath = join(AGENTS_DIR, name, 'SOUL.md')
  let systemPrompt = `You are ${name}, a marketing AI agent.`
  try {
    systemPrompt = await readFile(soulPath, 'utf-8')
  } catch { /* use default */ }

  // Load MEMORY.md
  const memoryPath = join(AGENTS_DIR, name, 'memory', 'MEMORY.md')
  let memory = ''
  try {
    memory = await readFile(memoryPath, 'utf-8')
  } catch { /* no memory yet */ }

  const fullSystem = memory
    ? `${systemPrompt}\n\n## Your Recent Memory\n${memory}`
    : systemPrompt

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: fullSystem },
        { role: 'user',   content: query }
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.4,
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
    res.end()
  }
})

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[content-engine] Listening on port ${PORT}`)
})
