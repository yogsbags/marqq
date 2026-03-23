/**
 * channelRouter.js — Hybrid Lead Channel Routing
 *
 * Two-layer architecture:
 *
 * Layer 1 — HARD GATES (always rules, non-negotiable):
 *   Data availability: no phone → can't call/WA; no email → can't email; no LinkedIn URL → skip LinkedIn
 *   Spam gates: spam_count ≥ 5 → skip WhatsApp; ≥ 3 → skip voicebot/phone
 *   These are facts about the lead, not judgment calls.
 *
 * Layer 2 — CHANNEL PREFERENCE (agent-driven when companyId available):
 *   Groq call with: lead batch sample + MKG ICP segments + company context
 *   Agent outputs: channel_preference_order per ICP segment + reasoning
 *   Result is cached per (companyId + ICP hash) for the session.
 *   Falls back to rules when: no companyId, no MKG, Groq unavailable.
 *
 * Exports:
 *   routeLeads(leads, companyId?)      → full routing result with agent reasoning
 *   routeLeadsFallback(leads)          → pure-rules fallback (no LLM)
 *   icpValueScore(lead)                → 0–100 composite score
 *   routingSummary(routedLeads)        → stats object
 *   groupByChannel(routedLeads)        → leads grouped by primary channel
 */

import Groq from 'groq-sdk';
import { MKGService } from '../mkg-service.js';

// ── Channel constants ─────────────────────────────────────────────────────────

export const CHANNELS = {
  LINKEDIN:  'linkedin',
  EMAIL:     'email',
  WHATSAPP:  'whatsapp',
  VOICEBOT:  'voicebot',
  PHONE:     'phone',
}

// ── Hard gates (data/spam — rules only, never overridden by agent) ─────────────

const SPAM_GATES = {
  [CHANNELS.WHATSAPP]: 5,
  [CHANNELS.PHONE]:    3,
  [CHANNELS.VOICEBOT]: 3,
  [CHANNELS.EMAIL]:    999,
  [CHANNELS.LINKEDIN]: 999,
}

function availableChannels(lead) {
  const avail = []
  const spam  = Number(lead.spam_count || 0)

  if (lead.has_linkedin || lead.linkedin_url)
    avail.push(CHANNELS.LINKEDIN)

  if (lead.email || lead.email_norm)
    avail.push(CHANNELS.EMAIL)

  if (lead.phone_e164 || lead.mobile) {
    if (spam < SPAM_GATES[CHANNELS.WHATSAPP]) avail.push(CHANNELS.WHATSAPP)
    if (spam < SPAM_GATES[CHANNELS.VOICEBOT]) avail.push(CHANNELS.VOICEBOT)
    if (spam < SPAM_GATES[CHANNELS.PHONE])    avail.push(CHANNELS.PHONE)
  }
  return avail
}

// ── ICP value score (used for sequence depth regardless of routing mode) ──────

export function icpValueScore(lead) {
  let score = 0
  const seniority = (lead.seniority || '').toUpperCase()
  const quality   = Number(lead.quality || 2)

  const senMap = { C_SUITE: 40, VP: 35, DIRECTOR: 30, PARTNER: 25, OWNER: 25, MANAGER: 15, IC: 5 }
  score += senMap[seniority] || 10
  score += (quality - 1) * 10

  if (lead.has_linkedin || lead.linkedin_url) score += 5
  if (lead.email || lead.email_norm)           score += 5
  if (lead.phone_e164)                         score += 5
  if (lead.company)                            score += 5

  return Math.min(100, score)
}

// ── Rules fallback (no LLM) ───────────────────────────────────────────────────

const SENIORITY_PREFS = {
  C_SUITE:  [CHANNELS.LINKEDIN, CHANNELS.EMAIL, CHANNELS.VOICEBOT],
  VP:       [CHANNELS.LINKEDIN, CHANNELS.EMAIL, CHANNELS.VOICEBOT],
  DIRECTOR: [CHANNELS.LINKEDIN, CHANNELS.EMAIL, CHANNELS.WHATSAPP],
  PARTNER:  [CHANNELS.LINKEDIN, CHANNELS.EMAIL, CHANNELS.WHATSAPP],
  OWNER:    [CHANNELS.EMAIL,    CHANNELS.WHATSAPP, CHANNELS.VOICEBOT],
  MANAGER:  [CHANNELS.EMAIL,    CHANNELS.WHATSAPP, CHANNELS.LINKEDIN],
  IC:       [CHANNELS.EMAIL,    CHANNELS.WHATSAPP],
}

const FORMAL_ONLY = new Set(['FINANCE','LEGAL','HEALTHCARE','PHARMA','GOVERNMENT'])
const WA_FRIENDLY = new Set(['REAL_ESTATE','RETAIL','FOOD_BEVERAGE','HOSPITALITY','TEXTILES','GEMS_JEWELRY','AGRICULTURE','CONSTRUCTION','ECOMMERCE'])

function ruleBasedPreference(lead, avail) {
  const seniority = (lead.seniority || '').toUpperCase()
  const industry  = (lead.icp_industry || lead.category || '').toUpperCase()
  const quality   = Number(lead.quality || 2)

  let prefs = [...(SENIORITY_PREFS[seniority] || [CHANNELS.EMAIL, CHANNELS.WHATSAPP])]

  if (FORMAL_ONLY.has(industry)) {
    prefs = prefs.filter(c => c !== CHANNELS.WHATSAPP && c !== CHANNELS.VOICEBOT)
    if (!prefs.includes(CHANNELS.LINKEDIN)) prefs.unshift(CHANNELS.LINKEDIN)
  }
  if (WA_FRIENDLY.has(industry) && avail.includes(CHANNELS.WHATSAPP)) {
    // Boost WhatsApp up one position for WA-friendly industries
    const waIdx = prefs.indexOf(CHANNELS.WHATSAPP)
    if (waIdx > 0) { prefs.splice(waIdx, 1); prefs.splice(waIdx - 1, 0, CHANNELS.WHATSAPP) }
    else if (waIdx === -1) prefs.push(CHANNELS.WHATSAPP)
  }
  if (quality <= 2) {
    prefs = prefs.filter(c => c === CHANNELS.EMAIL || c === CHANNELS.WHATSAPP)
  }

  return prefs.filter(c => avail.includes(c))
}

function buildSequenceFromPrefs(prefs, icpScore) {
  const depth = icpScore >= 70 ? 4 : icpScore >= 50 ? 3 : icpScore >= 30 ? 2 : 1
  const delays = [0, 2, 5, 9]
  return prefs.slice(0, depth).map((channel, i) => ({
    step: i + 1,
    channel,
    delay_days: delays[i],
    is_primary: i === 0,
  }))
}

/**
 * Pure rules-based routing (no LLM). Used as fallback.
 */
export function routeLeadsFallback(leads) {
  return leads.map(lead => {
    const avail    = availableChannels(lead)
    const icpScore = icpValueScore(lead)
    const prefs    = ruleBasedPreference(lead, avail)
    const sequence = buildSequenceFromPrefs(prefs, icpScore)
    const primary  = sequence[0]?.channel || CHANNELS.EMAIL

    return {
      ...lead,
      routing: {
        primary,
        sequence,
        icp_score: icpScore,
        mode: 'rules',
        reasons: [`Rules-based: seniority=${lead.seniority}, industry=${lead.icp_industry}, quality=${lead.quality}`],
      },
    }
  })
}

// ── Agent-driven routing via Groq ─────────────────────────────────────────────

// Session cache: companyId:icpHash → agent routing guidance
const _routingCache = new Map()

/**
 * Build a compact lead summary for the LLM (avoids huge token counts).
 * Groups leads by seniority+industry combo and sends counts, not individual rows.
 */
function buildLeadSummary(leads) {
  const groups = {}
  for (const l of leads) {
    const key = `${l.seniority || 'UNKNOWN'}|${l.icp_industry || l.category || 'UNKNOWN'}|${l.quality || 2}`
    if (!groups[key]) groups[key] = { seniority: l.seniority, industry: l.icp_industry || l.category, quality: Number(l.quality || 2), count: 0, has_linkedin: 0, has_email: 0, has_phone: 0 }
    groups[key].count++
    if (l.has_linkedin || l.linkedin_url) groups[key].has_linkedin++
    if (l.email || l.email_norm)          groups[key].has_email++
    if (l.phone_e164 || l.mobile)         groups[key].has_phone++
  }
  return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 20)
}

/**
 * Load MKG context for a company (ICP segments + channel preferences if set).
 */
async function loadMKGContext(companyId) {
  if (!companyId) return null
  try {
    const mkg = await MKGService.read(companyId)
    return {
      icp:        mkg.icp        || null,
      channels:   mkg.channels   || null,
      positioning: mkg.positioning || null,
    }
  } catch {
    return null
  }
}

/**
 * Ask Groq to produce channel routing guidance for this lead batch.
 * Returns structured JSON: { segment_routing: [...], global_notes: string }
 */
async function getAgentRoutingGuidance(leadSummary, mkgContext, companyId) {
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!apiKey) return null

  const cacheKey = `${companyId}:${JSON.stringify(leadSummary).slice(0, 200)}`
  if (_routingCache.has(cacheKey)) return _routingCache.get(cacheKey)

  const groq = new Groq({ apiKey })

  const icpContext = mkgContext?.icp
    ? `\nCompany ICP from MKG:\n${JSON.stringify(mkgContext.icp, null, 2).slice(0, 1500)}`
    : ''

  const channelContext = mkgContext?.channels
    ? `\nCompany channel strategy from MKG:\n${JSON.stringify(mkgContext.channels, null, 2).slice(0, 800)}`
    : ''

  const prompt = `You are Isha, a B2B market research agent. Given a lead batch breakdown and company context, decide the best outreach channel(s) for each lead segment.

AVAILABLE CHANNELS: linkedin (via HeyReach), email (via Instantly), whatsapp, voicebot, phone
${icpContext}${channelContext}

LEAD BATCH BREAKDOWN (grouped by seniority × industry × quality):
${JSON.stringify(leadSummary, null, 2)}

HARD CONSTRAINTS (non-negotiable — apply before your preferences):
- Only suggest channels where data exists (has_linkedin/has_email/has_phone > 0)
- Quality ≤ 2 leads: email or whatsapp only (LinkedIn credits wasted, voicebot low ROI)
- FINANCE/LEGAL/HEALTHCARE/PHARMA: never whatsapp cold outreach

For each segment produce:
1. primary channel (single best)
2. sequence (ordered list, max 4 steps — only for high-value segments)
3. reasoning (1-2 sentences why — reference ICP context if available)

Respond ONLY with valid JSON matching this schema exactly:
{
  "segment_routing": [
    {
      "seniority": "C_SUITE",
      "industry": "IT_SERVICES",
      "quality": 4,
      "primary": "linkedin",
      "sequence": ["linkedin", "email", "voicebot"],
      "reasoning": "C-suite IT leaders respond best to warm LinkedIn connections before email. MKG ICP confirms decision-maker outreach via professional channels."
    }
  ],
  "global_notes": "Overall strategy note for this batch"
}`

  try {
    const resp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const content = resp.choices[0]?.message?.content || '{}'
    const parsed  = JSON.parse(content)

    if (!parsed.segment_routing?.length) return null

    _routingCache.set(cacheKey, parsed)
    // Expire after 30 minutes
    setTimeout(() => _routingCache.delete(cacheKey), 30 * 60 * 1000)

    return parsed
  } catch (err) {
    console.warn('[channelRouter] Groq routing failed, falling back to rules:', err.message)
    return null
  }
}

/**
 * Apply agent guidance to a single lead.
 * Finds the best matching segment from agent output, applies it.
 */
function applyAgentGuidance(lead, agentGuidance, avail) {
  if (!agentGuidance?.segment_routing?.length) return null

  const seniority = (lead.seniority || '').toUpperCase()
  const industry  = (lead.icp_industry || lead.category || '').toUpperCase()
  const quality   = Number(lead.quality || 2)

  // Find best matching segment (exact match first, then seniority-only, then first)
  let match = agentGuidance.segment_routing.find(
    s => s.seniority === seniority && s.industry === industry && s.quality === quality
  )
  if (!match) match = agentGuidance.segment_routing.find(
    s => s.seniority === seniority && s.industry === industry
  )
  if (!match) match = agentGuidance.segment_routing.find(
    s => s.seniority === seniority
  )
  if (!match) match = agentGuidance.segment_routing[0]

  // Filter sequence to only available channels (hard gates)
  const sequence = (match.sequence || [match.primary])
    .filter(ch => avail.includes(ch))
    .slice(0, 4)

  if (!sequence.length) return null

  const icpScore = icpValueScore(lead)
  const delays   = [0, 2, 5, 9]

  return {
    primary: sequence[0],
    sequence: sequence.map((channel, i) => ({
      step: i + 1,
      channel,
      delay_days: delays[i],
      is_primary: i === 0,
    })),
    icp_score: icpScore,
    mode: 'agent',
    agent_reasoning: match.reasoning,
    global_notes: agentGuidance.global_notes,
    reasons: [
      match.reasoning,
      ...(agentGuidance.global_notes ? [`Strategy: ${agentGuidance.global_notes}`] : []),
    ],
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Route a batch of leads — agent-driven with rules fallback.
 *
 * @param {Array}  leads      — lead records from leads DB
 * @param {string} companyId  — used to load MKG context for agent routing
 * @returns {Promise<{
 *   routed_leads: Array,
 *   summary: object,
 *   groups: object,
 *   mode: 'agent'|'rules',
 *   agent_notes: string|null,
 * }>}
 */
export async function routeLeads(leads, companyId = null) {
  if (!leads?.length) return { routed_leads: [], summary: {}, groups: {}, mode: 'rules', agent_notes: null }

  // Load MKG and ask agent for guidance
  const [mkgContext, leadSummary] = await Promise.all([
    loadMKGContext(companyId),
    Promise.resolve(buildLeadSummary(leads)),
  ])

  const agentGuidance = await getAgentRoutingGuidance(leadSummary, mkgContext, companyId)
  const mode = agentGuidance ? 'agent' : 'rules'

  const routedLeads = leads.map(lead => {
    const avail    = availableChannels(lead)
    const icpScore = icpValueScore(lead)

    // Try agent guidance first
    const agentRouting = agentGuidance
      ? applyAgentGuidance(lead, agentGuidance, avail)
      : null

    if (agentRouting) {
      return { ...lead, routing: agentRouting }
    }

    // Fallback to rules
    const prefs    = ruleBasedPreference(lead, avail)
    const sequence = buildSequenceFromPrefs(prefs, icpScore)
    const primary  = sequence[0]?.channel || CHANNELS.EMAIL

    return {
      ...lead,
      routing: {
        primary,
        sequence,
        icp_score: icpScore,
        mode: 'rules',
        reasons: [`Rules: seniority=${lead.seniority}, industry=${lead.icp_industry}, quality=${lead.quality}`],
      },
    }
  })

  const summary  = routingSummary(routedLeads)
  const groups   = groupByChannel(routedLeads)

  return {
    routed_leads: routedLeads,
    summary,
    groups,
    mode,
    agent_notes: agentGuidance?.global_notes || null,
    mkg_loaded: !!mkgContext,
  }
}

// ── Utility exports ───────────────────────────────────────────────────────────

export function groupByChannel(routedLeads) {
  const groups = {}
  for (const lead of routedLeads) {
    const ch = lead.routing?.primary || CHANNELS.EMAIL
    if (!groups[ch]) groups[ch] = []
    groups[ch].push(lead)
  }
  return groups
}

export function routingSummary(routedLeads) {
  const groups = groupByChannel(routedLeads)
  const total  = routedLeads.length
  return {
    total,
    by_channel: Object.fromEntries(
      Object.entries(groups).map(([ch, arr]) => [ch, {
        count: arr.length,
        pct:   total > 0 ? Math.round((arr.length / total) * 100) : 0,
        avg_icp_score: arr.length
          ? Math.round(arr.reduce((s, l) => s + (l.routing?.icp_score || 0), 0) / arr.length)
          : 0,
      }])
    ),
    high_value:   routedLeads.filter(l => (l.routing?.icp_score || 0) >= 70).length,
    multichannel: routedLeads.filter(l => (l.routing?.sequence?.length || 0) > 1).length,
    agent_driven: routedLeads.filter(l => l.routing?.mode === 'agent').length,
    rules_driven: routedLeads.filter(l => l.routing?.mode === 'rules').length,
  }
}

export function explainRouting(lead) {
  const r = lead.routing
  if (!r) return 'Not routed'
  const lines = [
    `${lead.full_name || 'Lead'} — ${lead.designation || ''} @ ${lead.company || ''}`,
    `ICP Score: ${r.icp_score}/100  |  Mode: ${r.mode}`,
    `Sequence: ${(r.sequence || []).map(s => `Day ${s.delay_days}: ${s.channel}`).join(' → ')}`,
    ...(r.agent_reasoning ? [`Agent: ${r.agent_reasoning}`] : r.reasons || []).map(x => `→ ${x}`),
  ]
  return lines.join('\n')
}
