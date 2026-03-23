import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ChurnPreventionFlowProps = {
  initialQuestion?: string
}

export function ChurnPreventionFlow({ initialQuestion }: ChurnPreventionFlowProps = {}) {
  return (
    <AgentModuleShell
      moduleId="churn-prevention"
      title="Retain Customers"
      description="Identify churn signals, segment at-risk users, and turn the diagnosis into a retention plan with lifecycle moves and win-back copy."
      preAgentContent={
        <Card className="border-border/70 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Retention plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1</div>
              <div className="mt-1 text-sm font-medium text-foreground">Find the risk pattern</div>
              <div className="mt-1 text-xs text-muted-foreground">Tara identifies churn signals, weak segments, and the highest-leverage save opportunities.</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2</div>
              <div className="mt-1 text-sm font-medium text-foreground">Design the retention play</div>
              <div className="mt-1 text-xs text-muted-foreground">Kiran maps the lifecycle triggers, sequence timing, and re-engagement path for the priority segment.</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 3</div>
              <div className="mt-1 text-sm font-medium text-foreground">Write the message set</div>
              <div className="mt-1 text-xs text-muted-foreground">Sam turns the plan into cancel-save, pause, win-back, and re-engagement copy.</div>
            </div>
          </CardContent>
        </Card>
      }
      agents={[
        {
          name: 'tara',
          label: 'Step 1 · Tara — Churn Analysis',
          taskType: 'churn_analysis',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Analyse our churn signals. Identify the top 3 cancellation reasons from patterns in the data or context. Segment churned users by profile (ICP fit, plan tier, usage level). Recommend the highest-leverage retention interventions per segment.`,
          placeholder: 'Paste churn survey data, cohort metrics, or describe the pattern',
          tags: ['churn', 'retention', 'analysis'],
        },
        {
          name: 'kiran',
          label: 'Step 2 · Kiran — Lifecycle Journey Plan',
          taskType: 'retention_journey',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Design the retention journey for the priority segment. Recommend the right lifecycle triggers, channel mix, sequence timing, and re-engagement moves across email and owned channels.`,
          placeholder: 'Priority segment, engagement signals, and any lifecycle constraints',
          tags: ['churn', 'lifecycle', 'retention'],
        },
        {
          name: 'sam',
          label: 'Step 3 · Sam — Retention Copy',
          taskType: 'churn_copy',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Write a full retention copy set: (1) cancel-flow intercept messaging (3 variants for different churn reasons), (2) pause / downgrade alternative offer, (3) 3-email win-back sequence for churned users, (4) re-engagement subject lines.`,
          placeholder: 'Main churn reason, product, target user profile',
          tags: ['churn', 'copy', 'win-back'],
        },
      ]}
      resourceContextLabel="Churn or cohort sheet"
      resourceContextPlaceholder="https://docs.google.com/spreadsheets/d/..."
      resourceContextHint="Paste the exact Google Sheet with churn, cohort, or retention data if you want the agents to work from that source."
      resourceContextPlacement="primary"
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Retention journey and messaging"
      buildResourceContext={(value, agent) => {
        if (agent.name === 'tara') return `Use this exact Google Sheets URL for churn, cohort, or retention analysis if needed: ${value}`
        if (agent.name === 'kiran') return `Use this exact Google Sheets URL as supporting lifecycle or retention context if useful: ${value}`
        return `Reference this exact Google Sheets URL if useful for the retention copy: ${value}`
      }}
      enableReportActions
    />
  )
}
