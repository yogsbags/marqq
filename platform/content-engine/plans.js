/**
 * Marqq AI — Plan Definitions
 * Single source of truth for plan → module access + credit allocations.
 * Used by backend for enforcement and frontend for display/gating.
 */

// Credit cost per operation type
const CREDIT_COSTS = {
  agent_run: 1,       // standard agent run (text modules)
  video_render: 10,   // HeyGen / Fal / Veo render
  voice_bot_min: 2,   // per voice bot minute
};

// Modules available per plan (additive — each plan includes all modules below it)
const PLAN_MODULES = {
  // ── Growth: all text-based agents + analytics ────────────────────────────
  growth: new Set([
    'company-intelligence',
    'lead-intelligence',
    'market-signals',
    'industry-intelligence',
    'audience-profiles',
    'positioning',
    'action-plan',
    'offer-design',
    'messaging',
    'channel-health',
    'landing-pages',
    'social-calendar',      // copy only — no video render
    'ai-content',           // text/image only — no video render
    'seo-llmo',
    'budget-optimization',
    'performance-scorecard',
    'ad-creative',
    'email-sequence',
    'lead-outreach',
    'cro',
    'cro-audit',
    'ab-test',
    'marketing-audit',
    'launch-strategy',
    'revenue-ops',
    'lead-magnets',
    'sales-enablement',
    'paid-ads',
    'referral-program',
    'churn-prevention',
    'unified-customer-view',
    'user-engagement',
    'setup',
  ]),

  // ── Scale: adds video rendering + voice bot ───────────────────────────────
  scale: new Set([
    // everything in growth, plus:
    'social-media',         // video campaign publishing
    'ai-video-bot',         // HeyGen / Veo video generation
    'ai-voice-bot',         // LiveKit real-time voice
  ]),

  // ── Agency: full access (same modules as scale — future custom modules here)
  agency: null, // null = all modules
};

// Resolve full module set for a plan
function getModulesForPlan(plan) {
  if (!plan || plan === 'agency') return null; // null = unrestricted
  const base = new Set(PLAN_MODULES.growth);
  if (plan === 'scale') {
    for (const m of PLAN_MODULES.scale) base.add(m);
  }
  return base;
}

// Monthly credit allocation per plan
const PLAN_CREDITS = {
  growth: 500,
  scale: 2000,
  agency: -1, // -1 = unlimited
};

// Human-readable plan labels
const PLAN_LABELS = {
  growth: 'Growth',
  scale: 'Scale',
  agency: 'Agency',
};

/**
 * Check if a workspace plan can access a given module.
 * @param {string} plan - 'growth' | 'scale' | 'agency'
 * @param {string} moduleId - the module ID to check
 * @returns {boolean}
 */
function canAccessModule(plan, moduleId) {
  if (!moduleId) return true; // no module ID = generic agent run, always allowed
  if (!plan || plan === 'agency') return true;
  const modules = getModulesForPlan(plan);
  if (!modules) return true;
  return modules.has(moduleId);
}

/**
 * Get the minimum plan required for a module.
 * @param {string} moduleId
 * @returns {'growth' | 'scale' | 'agency'}
 */
function requiredPlanForModule(moduleId) {
  if (PLAN_MODULES.scale.has(moduleId)) return 'scale';
  if (PLAN_MODULES.growth.has(moduleId)) return 'growth';
  return 'growth'; // default
}

export {
  CREDIT_COSTS,
  PLAN_MODULES,
  PLAN_CREDITS,
  PLAN_LABELS,
  getModulesForPlan,
  canAccessModule,
  requiredPlanForModule,
};
