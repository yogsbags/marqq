import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function SetupFlow() {
  return (
    <AgentModuleShell
      moduleId="setup"
      title="Setup — Company Context"
      description="First run: Veena crawls your website and public signals to populate the knowledge graph with positioning, ICP, competitors, offers, channels, and messaging. Everything downstream depends on this."
      agents={[
        {
          name: 'veena',
          label: 'Veena — Context Crawler',
          taskType: 'company_context',
          defaultQuery:
            'Set up company context. Crawl the website, LinkedIn page, and any public signals. Populate positioning, ICP, top 3 competitors, core offers, primary channels, and key messaging into the knowledge graph.',
          placeholder: 'Enter website URL or describe the company to get started',
          tags: ['setup', 'context', 'knowledge-graph'],
        },
        {
          name: 'neel',
          label: 'Neel — Context Review',
          taskType: 'context_review',
          defaultQuery:
            'Review the populated knowledge graph. Identify the top 3 gaps in our context — what is missing or unclear — and ask clarifying questions to fill them.',
          placeholder: 'Leave blank to auto-review, or paste additional context',
          tags: ['setup', 'review', 'gaps'],
        },
      ]}
    />
  )
}
