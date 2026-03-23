import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UnifiedCustomerViewFlowProps = {
  initialQuestion?: string
  initialViewType?: string
  initialViewQuestion?: string
  initialSystems?: string
}

function formatGoalLabel(value?: string) {
  if (!value) return null

  const labelMap: Record<string, string> = {
    segments: 'Customer segments',
    risk: 'Risk and churn signals',
    opportunities: 'Expansion and growth',
    what_changed: 'What changed?',
    who_matters: 'Who matters most?',
    what_next: 'What should we do next?',
    crm_lifecycle: 'CRM + lifecycle',
    analytics: 'Analytics + usage',
    full_view: 'Full customer picture',
  }

  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

export function UnifiedCustomerViewFlow({
  initialQuestion,
  initialViewType,
  initialViewQuestion,
  initialSystems,
}: UnifiedCustomerViewFlowProps = {}) {
  const isGuidedLaunch = Boolean(initialQuestion || initialViewType || initialViewQuestion || initialSystems)

  return (
    <AgentModuleShell
      moduleId="unified-customer-view"
      title="Understand Customer Behavior"
      description="Unify customer signals into a clearer view of segments, risks, and opportunities so the next lifecycle action is easier to choose."
      preAgentContent={
        <div className="space-y-4">
          {isGuidedLaunch ? (
            <Card className="border-border/70 bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Veena customer brief</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">View</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialViewType) || 'Customer view'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialViewQuestion) || 'Customer question'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialSystems) || 'Connected systems'}</div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer view canvas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What this view should reveal</div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">Priority segments</div>
                    <div className="mt-1 text-xs text-muted-foreground">Which customer groups actually matter right now by value, lifecycle state, or behavior.</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">Risk and churn signals</div>
                    <div className="mt-1 text-xs text-muted-foreground">Which segments are slipping, losing momentum, or need intervention before value drops.</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">Growth opportunities</div>
                    <div className="mt-1 text-xs text-muted-foreground">Which segments are ready for upsell, referral, re-engagement, or deeper lifecycle investment.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How to use the result</div>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground">Choose who to focus on</div>
                    <div className="mt-1 text-xs">Decide which customer segment deserves immediate attention.</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Understand why</div>
                    <div className="mt-1 text-xs">See the behavioral or lifecycle signal behind the segment’s current state.</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Act by segment</div>
                    <div className="mt-1 text-xs">Turn the view into lifecycle, messaging, or growth actions for each segment.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Result structure</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segments</div>
                <div className="mt-2 text-sm font-medium text-foreground">Who your main customer groups are</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risk</div>
                <div className="mt-2 text-sm font-medium text-foreground">Where churn or disengagement is building</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opportunity</div>
                <div className="mt-2 text-sm font-medium text-foreground">Where expansion, referral, or nurture potential exists</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next actions</div>
                <div className="mt-2 text-sm font-medium text-foreground">What to do for each segment next</div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      agents={[
        {
          name: 'tara',
          label: 'Generate Customer View · Tara',
          taskType: 'customer_segmentation',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Generate a unified customer view from the connected systems and provided context. Structure the result as: (1) key customer segments, (2) risk or churn signals, (3) growth or expansion opportunities, and (4) next actions by segment.`,
          placeholder: 'Customer signals, lifecycle context, and what you want to understand first',
          tags: ['customer-view', 'segments', 'insights'],
        },
        {
          name: 'kiran',
          label: 'Step 2 · Kiran — Lifecycle Implications',
          taskType: 'customer_lifecycle_plan',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Translate the unified customer view into lifecycle implications. Recommend the right nurture, re-engagement, or expansion journeys for the highest-priority segments and the best channels to use.`,
          placeholder: 'Priority segments, lifecycle triggers, and channel context',
          tags: ['customer-view', 'lifecycle', 'journeys'],
        },
        {
          name: 'sam',
          label: 'Step 3 · Sam — Segment Messaging',
          taskType: 'customer_segment_copy',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Write the messaging or follow-up assets needed for the key segments: segment-specific outreach or nurture copy, re-engagement copy if relevant, and message variations for the highest-priority next actions.`,
          placeholder: 'Segment names, tone, brand voice, and any messaging constraints',
          tags: ['customer-view', 'copy', 'segments'],
        },
      ]}
      resourceContextLabel="Customer data sheet"
      resourceContextPlaceholder="https://docs.google.com/spreadsheets/d/..."
      resourceContextHint="Paste the exact Google Sheet with customers, cohorts, lifecycle exports, or segment data if you want the agents to work from that source."
      resourceContextPlacement="primary"
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Expand lifecycle implications and messaging"
      buildResourceContext={(value, agent) => {
        if (agent.name === 'tara') return `Use this exact Google Sheets URL for customer, cohort, or segment analysis if needed: ${value}`
        if (agent.name === 'kiran') return `Use this exact Google Sheets URL as supporting lifecycle context if useful: ${value}`
        return `Reference this exact Google Sheets URL if useful for tailoring the segment messaging or follow-up assets: ${value}`
      }}
      enableReportActions
    />
  )
}
