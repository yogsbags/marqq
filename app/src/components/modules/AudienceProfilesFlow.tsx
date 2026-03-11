import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function AudienceProfilesFlow() {
  return (
    <AgentModuleShell
      title="Audience Profiles"
      description="Ideal customer profiles, client archetypes, and lookalike audience definitions from isha."
      agents={[
        {
          name: 'isha',
          label: 'Isha — Audience Intelligence',
          taskType: 'market_landscape_bootstrap',
          defaultQuery:
            'Define 2-3 Ideal Customer Profiles with firmographic, behavioural, and psychographic attributes. For each ICP include: company size, industry, decision maker title, top pain points, buying triggers, and recommended messaging angle.',
        },
      ]}
    />
  )
}
