import { useMemo } from 'react'
import { AgentModuleShell, type AgentConfig } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type MessagingFlowProps = {
  initialQuestion?: string
  initialSurface?: string
  initialProblem?: string
  initialGoal?: string
}

function formatLabel(value?: string) {
  if (!value) return null
  const labelMap: Record<string, string> = {
    website: 'Website or landing page',
    email: 'Email or lifecycle',
    ads: 'Ads and campaigns',
    unclear: 'Unclear value',
    weak: 'Weak differentiation',
    conversion: 'Poor conversion pull',
    clarify: 'Clarify the message',
    differentiate: 'Differentiate more strongly',
    convert: 'Drive more action',
  }
  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildSamQuery(surface: string, problem: string, goal: string, initialQuestion?: string) {
  return [
    initialQuestion || `Sharpen the messaging for our ${formatLabel(surface)?.toLowerCase() || 'main surface'}.`,
    `Surface: ${formatLabel(surface) || 'Website or landing page'}.`,
    `Main problem: ${formatLabel(problem) || 'Unclear value'}.`,
    `Desired outcome: ${formatLabel(goal) || 'Clarify the message'}.`,
    'Return a stronger message architecture, the main copy problems, the rewrites that matter most, and improved headline and CTA directions.',
    'Prioritize sharp, conversion-aware messaging over generic brand commentary.',
  ].join('\n\n')
}

function buildMayaQuery(surface: string, problem: string, goal: string) {
  return [
    `Pressure-test the sharper messaging for our ${formatLabel(surface)?.toLowerCase() || 'selected surface'}.`,
    `Focus on ${formatLabel(problem)?.toLowerCase() || 'the main messaging problem'} and improve the message so it can ${formatLabel(goal)?.toLowerCase() || 'hit the desired outcome'}.`,
    'Return the best two alternate positioning angles plus tighter headline and CTA options.',
  ].join('\n\n')
}

export function MessagingFlow({
  initialQuestion,
  initialSurface,
  initialProblem,
  initialGoal,
}: MessagingFlowProps = {}) {
  const surface = initialSurface || 'website'
  const problem = initialProblem || 'unclear'
  const goal = initialGoal || 'clarify'

  const agents = useMemo<Array<AgentConfig>>(
    () => [
      {
        name: 'sam',
        label: 'Sharpen Messaging',
        taskType: 'weekly_messaging_review',
        defaultQuery: buildSamQuery(surface, problem, goal, initialQuestion),
        placeholder: 'Describe the surface, the weak copy, and what the sharper message should achieve.',
      },
      {
        name: 'maya',
        label: 'Test Stronger Angles',
        taskType: 'positioning_refresh',
        defaultQuery: buildMayaQuery(surface, problem, goal),
        placeholder: 'Pressure-test the message and propose stronger angles, headlines, and CTA directions.',
      },
    ],
    [goal, initialQuestion, problem, surface]
  )

  const preAgentContent = (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border-slate-200/70 bg-white/92 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.14)] dark:border-slate-800/80 dark:bg-slate-950/82">
        <CardHeader className="pb-3">
          <CardTitle className="text-base tracking-tight">Messaging Brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Surface</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(surface)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Problem</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(problem)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goal</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(goal)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">Message Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>1. Diagnose what is muddy, generic, or weak in the current message.</div>
            <div>2. Rewrite the core message, strongest headlines, and CTA direction.</div>
            <div>3. Pressure-test stronger positioning angles before rollout.</div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">What You Should Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>• A clearer value proposition and message hierarchy.</div>
            <div>• Stronger headlines and CTA directions.</div>
            <div>• One or two sharper angles worth testing next.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <AgentModuleShell
      moduleId="messaging"
      title="Sharpen Messaging"
      description="Strengthen the core message, rewrite the weak copy, and make the next conversion action clearer."
      agents={agents}
      preAgentContent={preAgentContent}
      collapseSetupControls
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Test stronger angles"
      resourceContextLabel="Source page or brief URL"
      resourceContextPlaceholder="Paste a landing page, doc, or campaign brief URL if the messaging should be rewritten against a specific source"
      resourceContextHint="Optional. Use this when the message should be rewritten against an exact page, doc, or campaign brief."
      buildResourceContext={(value) => `Use this exact source page or messaging brief if needed: ${value}`}
      resourceContextPlacement="primary"
    />
  )
}
