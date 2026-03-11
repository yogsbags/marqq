import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function ChannelHealthFlow() {
  return (
    <AgentModuleShell
      title="Channel Health"
      description="Distribution channel assessment and immediate reallocation recommendations from zara."
      agents={[
        {
          name: 'zara',
          label: 'Zara — Distribution',
          taskType: 'distribution_health_check',
          defaultQuery:
            "Produce a morning synthesis and priority brief using current MKG context. Return: (1) a summary of what each active agent completed recently and their key output in one sentence each, (2) 3 concrete market signals observed today — each attributed to a source (agent output, competitor move, or search trend), (3) the top 3 priorities for today ranked by urgency and revenue impact — each with a specific action, the owner agent, and the specific reason it is this rank right now, (4) which channels to activate this week with the specific action per channel, (5) 2 risks to watch with the trigger condition and monitoring owner. Every priority must be specific enough to act on — no vague goals.",
        },
      ]}
    />
  )
}
