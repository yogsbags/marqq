import { useMemo } from 'react'
import { AgentModuleShell, type AgentConfig } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type EmailSequenceFlowProps = {
  initialQuestion?: string
  initialType?: string
  initialAudience?: string
  initialGoal?: string
}

function formatLabel(value?: string) {
  if (!value) return null
  const labelMap: Record<string, string> = {
    nurture: 'Nurture',
    onboarding: 'Onboarding',
    outbound: 'Outbound',
    new_leads: 'New leads',
    trial_users: 'Trial or new users',
    customers: 'Existing customers',
    activate: 'Activate and educate',
    convert: 'Drive conversion',
    reengage: 'Re-engage',
  }
  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildSamQuery(type: string, audience: string, goal: string, initialQuestion?: string) {
  return [
    initialQuestion || `Build a ${formatLabel(type)?.toLowerCase() || 'nurture'} email sequence for ${formatLabel(audience)?.toLowerCase() || 'the selected audience'}.`,
    `Sequence type: ${formatLabel(type) || 'Nurture'}.`,
    `Audience: ${formatLabel(audience) || 'New leads'}.`,
    `Primary goal: ${formatLabel(goal) || 'Activate and educate'}.`,
    'Return a decision-ready email sequence with the message arc, email-by-email purpose, subject line, preview text, CTA, and the draft copy for each email.',
    'Keep the sequence coherent across the full arc instead of writing isolated emails.',
  ].join('\n\n')
}

function buildMayaQuery(type: string, audience: string, goal: string) {
  return [
    `Review this ${formatLabel(type)?.toLowerCase() || 'email'} sequence for ${formatLabel(audience)?.toLowerCase() || 'the selected audience'}.`,
    `Pressure-test the messaging for ${formatLabel(goal)?.toLowerCase() || 'the main outcome'}, suggest stronger hooks, and tighten the strongest two subject lines and CTAs.`,
    'Keep the output compact and directly usable for improving the primary sequence.',
  ].join('\n\n')
}

export function EmailSequenceFlow({
  initialQuestion,
  initialType,
  initialAudience,
  initialGoal,
}: EmailSequenceFlowProps = {}) {
  const sequenceType = initialType || 'nurture'
  const audience = initialAudience || 'new_leads'
  const sequenceGoal = initialGoal || 'activate'

  const agents = useMemo<Array<AgentConfig>>(
    () => [
      {
        name: 'sam',
        label: 'Build Sequence',
        taskType: 'email_sequence',
        defaultQuery: buildSamQuery(sequenceType, audience, sequenceGoal, initialQuestion),
        placeholder: 'Describe the lifecycle motion, audience, and the outcome this sequence should drive.',
      },
      {
        name: 'maya',
        label: 'Sharpen Hooks And CTAs',
        taskType: 'email_content',
        defaultQuery: buildMayaQuery(sequenceType, audience, sequenceGoal),
        placeholder: 'Review the sequence and strengthen the strongest hooks, subject lines, and CTA progression.',
      },
    ],
    [audience, initialQuestion, sequenceGoal, sequenceType]
  )

  const preAgentContent = (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border-slate-200/70 bg-white/92 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.14)] dark:border-slate-800/80 dark:bg-slate-950/82">
        <CardHeader className="pb-3">
          <CardTitle className="text-base tracking-tight">Sequence Brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(sequenceType)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audience</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(audience)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goal</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(sequenceGoal)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">Sequence Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>1. Build the message arc from first send to final CTA.</div>
            <div>2. Draft each email with the right subject, preview text, and CTA progression.</div>
            <div>3. Tighten the strongest hooks and decision points before sending.</div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">What You Should Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>• One coherent sequence, not disconnected email drafts.</div>
            <div>• Clear CTA progression across the lifecycle motion.</div>
            <div>• Subject lines and hooks strong enough to test immediately.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <AgentModuleShell
      moduleId="email-sequence"
      title="Write Email Sequences"
      description="Build lifecycle, onboarding, and outreach sequences that move people toward the next clear action."
      agents={agents}
      preAgentContent={preAgentContent}
      collapseSetupControls
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Sequence review"
      resourceContextLabel="Brief or sequence doc URL"
      resourceContextPlaceholder="Paste a Google Doc, planning sheet, or campaign brief URL if the sequence should follow a specific source"
      resourceContextHint="Optional. Use this when the sequence should follow an exact brief, sheet, or planning document."
      buildResourceContext={(value) => `Use this exact email brief or sequence document if needed: ${value}`}
      resourceContextPlacement="primary"
    />
  )
}
