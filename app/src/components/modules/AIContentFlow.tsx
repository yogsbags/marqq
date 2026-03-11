import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { EnhancedBulkGenerator } from './EnhancedBulkGenerator'

export function AIContentFlow() {
  return (
    <div className="space-y-8">
      <AgentModuleShell
        title="Content Pipeline"
        description="Weekly content briefs, campaign-ready drafts, and editorial calendar from riya."
        agents={[
          {
            name: 'riya',
            label: 'Riya — Content',
            taskType: 'weekly_content_brief',
            defaultQuery:
              "Write a LinkedIn post that is ready to publish right now — not a brief or outline. The post must include: a scroll-stopping first line that creates curiosity or contrast, the specific problem we solve for our ICP (use details from MKG context), 3 concrete ways we help with specific proof points or numbers, a direct CTA that asks for a specific action (not 'learn more'), and 5 relevant hashtags. Length: 180-250 words. Return the full post text, the hook line separately, the CTA separately, and estimate the engagement level (high/medium/low) with a one-line justification.",
          },
        ]}
      />

      <div className="border-t pt-6">
        <p className="text-xs text-muted-foreground mb-4 text-center">
          Use the bulk engine below to execute riya's briefs at scale.
        </p>
        <EnhancedBulkGenerator />
      </div>
    </div>
  )
}
