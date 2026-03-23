import { useMemo } from 'react'
import { AgentModuleShell, type AgentConfig } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PositioningFlowProps = {
  initialQuestion?: string
  initialFocus?: string
  initialBuyer?: string
  initialOutcome?: string
}

function formatLabel(value?: string) {
  if (!value) return null
  const labelMap: Record<string, string> = {
    differentiate: 'Differentiate more clearly',
    clarify: 'Clarify value',
    reframe: 'Reframe the category story',
    execs: 'Executive buyers',
    operators: 'Operators and functional users',
    technical: 'Technical evaluators',
    pipeline: 'More pipeline',
    sales: 'Better sales motion',
    category: 'Stronger market story',
  }
  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildNeelQuery(focus: string, buyer: string, outcome: string, initialQuestion?: string) {
  return [
    initialQuestion || `Clarify our positioning for ${formatLabel(buyer)?.toLowerCase() || 'the selected buyer'}.`,
    `Positioning focus: ${formatLabel(focus) || 'Differentiate more clearly'}.`,
    `Primary buyer: ${formatLabel(buyer) || 'Executive buyers'}.`,
    `Desired outcome: ${formatLabel(outcome) || 'More pipeline'}.`,
    'Return the clearest positioning angle, the message hierarchy, the sharpest differentiators, the category or competitor framing to use or avoid, and the next strategic moves that matter most.',
    'Keep the output specific enough to guide marketing, sales, and leadership, not abstract brand theory.',
  ].join('\n\n')
}

function buildMayaQuery(focus: string, buyer: string, outcome: string) {
  return [
    `Pressure-test this positioning for ${formatLabel(buyer)?.toLowerCase() || 'the selected buyer'}.`,
    `Strengthen the angle so we can ${formatLabel(focus)?.toLowerCase() || 'sharpen the positioning'} and help unlock ${formatLabel(outcome)?.toLowerCase() || 'the desired outcome'}.`,
    'Return two stronger positioning angles, tighter headline directions, and the message risks or weak spots to avoid.',
  ].join('\n\n')
}

export function PositioningFlow({
  initialQuestion,
  initialFocus,
  initialBuyer,
  initialOutcome,
}: PositioningFlowProps = {}) {
  const focus = initialFocus || 'differentiate'
  const buyer = initialBuyer || 'execs'
  const outcome = initialOutcome || 'pipeline'

  const agents = useMemo<Array<AgentConfig>>(
    () => [
      {
        name: 'neel',
        label: 'Clarify Positioning',
        taskType: 'weekly_strategy_brief',
        defaultQuery: buildNeelQuery(focus, buyer, outcome, initialQuestion),
        placeholder: 'Describe the buyer, the current market confusion, and what the stronger positioning needs to unlock.',
        tags: ['positioning', 'strategy', 'gtm'],
      },
      {
        name: 'maya',
        label: 'Test Sharper Angles',
        taskType: 'positioning_refresh',
        defaultQuery: buildMayaQuery(focus, buyer, outcome),
        placeholder: 'Stress-test the angle and propose sharper headline and positioning directions.',
        tags: ['positioning', 'messaging', 'angles'],
      },
    ],
    [buyer, focus, initialQuestion, outcome]
  )

  const preAgentContent = (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border-slate-200/70 bg-white/92 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.14)] dark:border-slate-800/80 dark:bg-slate-950/82">
        <CardHeader className="pb-3">
          <CardTitle className="text-base tracking-tight">Positioning Brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Focus</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(focus)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyer</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(buyer)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(outcome)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">Positioning Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>1. Clarify the sharpest market angle and the buyer-level message hierarchy.</div>
            <div>2. Define the differentiators, category framing, and strategic story to lean into.</div>
            <div>3. Stress-test the angle before it rolls into demand gen, sales, and launch work.</div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">What You Should Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>• One clearer positioning angle, not a grab bag of brand ideas.</div>
            <div>• Stronger message hierarchy and differentiation.</div>
            <div>• Sharper headline directions and strategic next moves.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <AgentModuleShell
      moduleId="positioning"
      title="Clarify Your Positioning"
      description="Sharpen the market angle, tighten the message hierarchy, and make the next GTM move clearer."
      agents={agents}
      preAgentContent={preAgentContent}
      collapseSetupControls
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Test sharper angles"
      resourceContextLabel="Positioning brief or strategy doc URL"
      resourceContextPlaceholder="Paste the strategy doc, messaging brief, or planning URL if the positioning should follow a specific source"
      resourceContextHint="Optional. Use this when the positioning work should follow an exact strategy brief, GTM doc, or messaging source."
      buildResourceContext={(value) => `Use this exact positioning brief or strategy document if needed: ${value}`}
      resourceContextPlacement="primary"
    />
  )
}
