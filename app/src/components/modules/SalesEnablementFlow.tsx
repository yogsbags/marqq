import { useMemo } from 'react'
import { AgentModuleShell, type AgentConfig } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SalesEnablementFlowProps = {
  initialQuestion?: string
  initialAsset?: string
  initialAudience?: string
  initialMotion?: string
}

function formatLabel(value?: string) {
  if (!value) return null
  const labelMap: Record<string, string> = {
    one_pager: 'Buyer-facing one-pager',
    battlecard: 'Competitive battle card',
    sequence: 'Seller-ready outreach sequence',
    sellers: 'Sales reps',
    buyers: 'Buyers and prospects',
    leadership: 'Sales leadership',
    discovery: 'Early discovery',
    competitive: 'Competitive deal',
    late_stage: 'Late-stage close',
  }
  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildSamQuery(asset: string, audience: string, motion: string, initialQuestion?: string) {
  return [
    initialQuestion || `Create a ${formatLabel(asset)?.toLowerCase() || 'sales enablement asset'} for ${formatLabel(audience)?.toLowerCase() || 'the selected audience'}.`,
    `Primary asset: ${formatLabel(asset) || 'Buyer-facing one-pager'}.`,
    `Primary audience: ${formatLabel(audience) || 'Sales reps'}.`,
    `Sales motion: ${formatLabel(motion) || 'Early discovery'}.`,
    'Return a decision-ready enablement asset with the core structure, the strongest proof points, the objections or friction to address, and the exact copy or sections we should use first.',
    'Keep the output practical for active deals, not generic sales theory.',
  ].join('\n\n')
}

function buildArjunQuery(asset: string, audience: string, motion: string) {
  return [
    `Turn this ${formatLabel(asset)?.toLowerCase() || 'enablement brief'} into seller-ready execution for ${formatLabel(audience)?.toLowerCase() || 'the selected audience'}.`,
    `Support the ${formatLabel(motion)?.toLowerCase() || 'current deal motion'} with the first talk tracks, follow-up sequence, or objection-handling prompts the team should use.`,
    'Keep the output concise, usable in live deals, and aligned to the primary enablement asset.',
  ].join('\n\n')
}

export function SalesEnablementFlow({
  initialQuestion,
  initialAsset,
  initialAudience,
  initialMotion,
}: SalesEnablementFlowProps = {}) {
  const asset = initialAsset || 'one_pager'
  const audience = initialAudience || 'sellers'
  const motion = initialMotion || 'discovery'

  const agents = useMemo<Array<AgentConfig>>(
    () => [
      {
        name: 'sam',
        label: 'Build Enablement Asset',
        taskType: 'sales_collateral',
        defaultQuery: buildSamQuery(asset, audience, motion, initialQuestion),
        placeholder: 'Describe the buyer, offer, sales stage, and the enablement asset the team needs first.',
        tags: ['sales', 'enablement', 'collateral'],
      },
      {
        name: 'arjun',
        label: 'Draft Seller Execution',
        taskType: 'sales_sequences',
        defaultQuery: buildArjunQuery(asset, audience, motion),
        placeholder: 'Turn the enablement asset into talk tracks, follow-ups, or seller-ready messaging.',
        tags: ['sales', 'sequence', 'talk-track'],
      },
    ],
    [asset, audience, initialQuestion, motion]
  )

  const preAgentContent = (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border-slate-200/70 bg-white/92 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.14)] dark:border-slate-800/80 dark:bg-slate-950/82">
        <CardHeader className="pb-3">
          <CardTitle className="text-base tracking-tight">Enablement Brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Asset</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(asset)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audience</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(audience)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motion</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(motion)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">Enablement Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>1. Build the core enablement asset around the current sales motion and buyer pressure.</div>
            <div>2. Clarify the strongest proof points, objections, and competitive angles to arm the team.</div>
            <div>3. Turn the asset into seller-ready talk tracks or follow-up messaging the team can use immediately.</div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">What You Should Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>• One usable enablement asset built for the real deal motion.</div>
            <div>• Clear proof points, objections, and differentiators the team can lean on.</div>
            <div>• Seller-ready messaging or follow-ups that match the primary asset.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <AgentModuleShell
      moduleId="sales-enablement"
      title="Support the Sales Team"
      description="Build the enablement asset, sharpen the proof and objections, and turn it into seller-ready material the team can use now."
      agents={agents}
      preAgentContent={preAgentContent}
      collapseSetupControls
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Seller execution"
      resourceContextLabel="Deck, brief, or call-notes URL"
      resourceContextPlaceholder="Paste the deck, PRD, call notes, or internal brief URL if the enablement should follow a specific source"
      resourceContextHint="Optional. Use this when the enablement asset should follow an exact deck, notes doc, or internal brief."
      buildResourceContext={(value) => `Use this exact sales brief, deck, or call-notes document if needed: ${value}`}
      resourceContextPlacement="primary"
    />
  )
}
