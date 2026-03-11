import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { EnhancedBulkGenerator } from './EnhancedBulkGenerator'

export function SEOLLMOFlow() {
  return (
    <div className="space-y-8">
      <AgentModuleShell
        title="SEO & LLMO"
        description="Search visibility audit, content gap analysis, and answer-engine positioning from maya."
        agents={[
          {
            name: 'maya',
            label: 'Maya — SEO & Visibility',
            taskType: 'weekly_seo_audit',
            defaultQuery:
              "Identify the primary keyword cluster this company should own and return 3 blog ideas — each with a full outline (at least 5 sections), target keyword, search intent (informational/commercial/navigational), and estimated monthly search volume. Also return 3 page-level quick wins (name the specific page and the specific fix, e.g. 'add geo modifier to title tag on /features/lead-scoring'). Finally, give 3 LLM visibility tips that explain the mechanism — why the tactic helps AI search engines cite our content, not just what to do. Do not return titles without outlines.",
          },
        ]}
      />

      <div className="border-t pt-6">
        <p className="text-xs text-muted-foreground mb-4 text-center">
          Run the full bulk content pipeline below once maya's brief is ready.
        </p>
        <EnhancedBulkGenerator />
      </div>
    </div>
  )
}
