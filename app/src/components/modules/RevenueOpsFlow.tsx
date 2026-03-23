import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueOpsFlowProps {
  initialQuestion?: string
  initialProblem?: string | null
  initialBreakdown?: string | null
  initialSystems?: string | null
}

const problemLabels: Record<string, string> = {
  routing: 'Lead routing and assignment',
  qualification: 'Qualification and stage quality',
  pipeline: 'Pipeline hygiene and forecast confidence',
}

const breakdownLabels: Record<string, string> = {
  marketing_to_sales: 'Marketing-to-sales handoff',
  sales_process: 'Sales process and stage movement',
  full_funnel: 'Full funnel and lifecycle orchestration',
}

const systemsLabels: Record<string, string> = {
  crm: 'CRM systems',
  analytics: 'Analytics and spreadsheet exports',
  combined: 'CRM plus analytics together',
}

export function RevenueOpsFlow({
  initialQuestion,
  initialProblem,
  initialBreakdown,
  initialSystems,
}: RevenueOpsFlowProps) {
  const isGuidedLaunch = Boolean(initialQuestion || initialProblem || initialBreakdown || initialSystems)
  const summaryItems = [
    initialProblem
      ? {
          label: 'Problem',
          value: problemLabels[initialProblem] ?? initialProblem,
        }
      : null,
    initialBreakdown
      ? {
          label: 'Breakdown',
          value: breakdownLabels[initialBreakdown] ?? initialBreakdown,
        }
      : null,
    initialSystems
      ? {
          label: 'Sources',
          value: systemsLabels[initialSystems] ?? initialSystems,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const arjunQuery = [
    initialQuestion,
    'Build a revenue-operations diagnosis that surfaces the biggest lifecycle bottlenecks, handoff failures, stale stage risks, CRM hygiene issues, and the highest-priority fixes by funnel stage.',
    initialProblem
      ? `Prioritize this operating problem: ${problemLabels[initialProblem] ?? initialProblem}.`
      : null,
    initialBreakdown
      ? `Focus the diagnosis on this breakdown point: ${breakdownLabels[initialBreakdown] ?? initialBreakdown}.`
      : null,
    initialSystems
      ? `Use this source emphasis when deciding what to trust first: ${systemsLabels[initialSystems] ?? initialSystems}.`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  const devQuery = [
    initialQuestion,
    'Design the supporting revenue-operations system: lifecycle stages, qualification rules, routing logic, SLA expectations, ownership boundaries, and the minimum instrumentation needed to keep the funnel healthy.',
    initialProblem
      ? `Anchor the system design around this problem: ${problemLabels[initialProblem] ?? initialProblem}.`
      : null,
    initialBreakdown
      ? `Pay special attention to this breakdown area: ${breakdownLabels[initialBreakdown] ?? initialBreakdown}.`
      : null,
    initialSystems
      ? `Assume these systems are the main operating sources: ${systemsLabels[initialSystems] ?? initialSystems}.`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  return (
    <AgentModuleShell
      moduleId="revenue-ops"
      title="Improve Revenue Ops"
      description="Tighten stage definitions, routing rules, CRM hygiene, and handoffs between marketing and sales."
      resourceContextLabel="Pipeline review sheet"
      resourceContextPlaceholder="https://docs.google.com/spreadsheets/d/... or paste a sheet with stage, owner, source, and funnel data"
      resourceContextHint="Use this when you want the agents to ground the diagnosis in a specific pipeline or lifecycle export."
      buildResourceContext={(value) =>
        `Use this exact pipeline or lifecycle sheet for the revenue-operations review if needed: ${value}`
      }
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Expand routing rules and system design"
      preAgentContent={
        <div className="space-y-4">
          {isGuidedLaunch ? (
            <Card className="border-border/70 bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Veena revops brief</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{item.value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revops control points</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What this run should clarify</div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">Lifecycle bottlenecks</div>
                    <div className="mt-1 text-xs text-muted-foreground">Where leads stall, age out, or move through stages without enough evidence.</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">Handoff failures</div>
                    <div className="mt-1 text-xs text-muted-foreground">Where routing, ownership, or SLA gaps create missed follow-up and lost pipeline.</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">System fixes</div>
                    <div className="mt-1 text-xs text-muted-foreground">Which rules, stage definitions, or hygiene changes should be implemented first.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you should get</div>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground">Diagnosis by funnel stage</div>
                    <div className="mt-1 text-xs">See where lifecycle movement, qualification, or ownership is breaking down.</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Priority operating changes</div>
                    <div className="mt-1 text-xs">Know which routing, hygiene, or SLA fixes should happen first.</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Clear owner next steps</div>
                    <div className="mt-1 text-xs">Translate the diagnosis into actions for marketing, sales, and ops teams.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revenue ops plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diagnosis</div>
                <div className="mt-2 text-sm font-medium text-foreground">Where the funnel or handoff is breaking</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operating rules</div>
                <div className="mt-2 text-sm font-medium text-foreground">How stages, routing, and ownership should work</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next actions</div>
                <div className="mt-2 text-sm font-medium text-foreground">What marketing, sales, and ops should change first</div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      agents={[
        {
          name: 'arjun',
          label: 'Build Revenue Ops Plan',
          taskType: 'pipeline_review',
          defaultQuery: arjunQuery,
          placeholder:
            'Paste pipeline notes, handoff issues, lifecycle stage problems, or leave blank to use connected systems and company context.',
          tags: ['revops', 'pipeline', 'handoff'],
        },
        {
          name: 'dev',
          label: 'Expand Lifecycle Rules And Routing',
          taskType: 'revenue_ops',
          defaultQuery: devQuery,
          placeholder:
            'Add stage definitions, scoring context, SLAs, or CRM process notes if you want a more specific operating design.',
          tags: ['routing', 'scoring', 'lifecycle'],
        },
      ]}
      enableReportActions
    />
  )
}
