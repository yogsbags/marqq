import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function PositioningFlow() {
  return (
    <AgentModuleShell
      title="Positioning & Strategy"
      description="Market positioning, competitive differentiation, and weekly strategy brief from neel."
      agents={[
        {
          name: 'neel',
          label: 'Neel — Strategy',
          taskType: 'weekly_strategy_brief',
          defaultQuery:
            "Build a complete 90-day GTM plan using current MKG context. Return structured data with: (1) a one-sentence positioning angle naming who we serve and why now, (2) our primary ICP segment with firmographic specifics, (3) channel priorities with budget split percentages and rationale, (4) a week-by-week 90-day action plan — weeks 1-4, 5-8, and 9-12 — each with 2-3 concrete actions and a measurable success metric, (5) rejected strategic alternatives with reasoning, (6) top risks with trigger conditions. Do not return vague goals — every action must be specific enough to assign to a person tomorrow.",
        },
      ]}
    />
  )
}
