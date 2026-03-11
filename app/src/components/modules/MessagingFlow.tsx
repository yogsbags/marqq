import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function MessagingFlow() {
  return (
    <AgentModuleShell
      title="Messaging & Copy"
      description="Outbound copy audit, nurture language review, and campaign messaging sharpening from sam."
      agents={[
        {
          name: 'sam',
          label: 'Sam — Messaging & Copy',
          taskType: 'weekly_messaging_review',
          defaultQuery:
            'Audit outbound copy, nurture language, and campaign messaging for clarity and conversion alignment. For each issue: identify what is muddy, explain why it under-performs, and rewrite it. Deliver a prioritised fix list and 3 sharpened headline variants.',
        },
      ]}
    />
  )
}
