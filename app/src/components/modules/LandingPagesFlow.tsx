import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function LandingPagesFlow() {
  return (
    <AgentModuleShell
      title="Landing Pages"
      description="Landing page audit from tara, copy sharpening from sam — ready to publish via your CMS."
      agents={[
        {
          name: 'tara',
          label: 'Tara — Page Audit',
          taskType: 'offer_friction_review',
          defaultQuery:
            'Audit the landing page for offer clarity, headline strength, CTA placement, social proof gaps, and conversion blockers. Rate each element. Recommend the top 5 highest-impact changes ranked by effort vs. impact.',
        },
        {
          name: 'sam',
          label: 'Sam — Page Copy',
          taskType: 'weekly_messaging_review',
          defaultQuery:
            'Write a complete landing page copy set: hero headline (3 variants), subheadline, 3 benefit bullets, objection-handling section, CTA copy (3 variants), and a trust/social-proof block. Tone: clear, direct, conversion-focused.',
        },
      ]}
    />
  )
}
