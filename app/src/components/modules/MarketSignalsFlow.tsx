import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function MarketSignalsFlow() {
  return (
    <AgentModuleShell
      title="Market Signals"
      description="Real-time category shifts, demand patterns, and competitor intelligence from isha and priya."
      agents={[
        {
          name: 'isha',
          label: 'Isha — Market Intelligence',
          taskType: 'daily_market_scan',
          defaultQuery:
            'Review fresh category shifts, buyer pain signals, and demand changes that matter today. Surface the top 3 signals I should act on this week.',
        },
        {
          name: 'priya',
          label: 'Priya — Competitor Intelligence',
          taskType: 'daily_competitor_scan',
          defaultQuery:
            "Scan for fresh competitor moves and return a structured intelligence report. For each of the top 2-3 competitors, provide: their current positioning, at least 2 specific strengths and 2 weaknesses, a concrete recent move observed in the past 30 days (ad campaign, pricing change, product launch, or content push), and their threat level (high/medium/low). Then identify 2-3 competitive gaps this company can exploit, 2 messaging vulnerabilities (specific competitor claims we can counter with our own proof), and a concrete recommended response naming the action and the agent who should own it. Do not return empty competitor entries or vague summaries.",
        },
      ]}
    />
  )
}
