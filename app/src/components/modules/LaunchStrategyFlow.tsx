import { useMemo } from 'react'
import { AgentModuleShell, type AgentConfig } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LaunchStrategyFlowProps = {
  initialQuestion?: string
  initialType?: string
  initialAudience?: string
  initialHorizon?: string
}

function formatLabel(value?: string) {
  if (!value) return null
  const labelMap: Record<string, string> = {
    product: 'Product or feature',
    campaign: 'Campaign or offer',
    brand: 'Brand or positioning move',
    customers: 'Existing customers',
    pipeline: 'Leads and pipeline',
    market: 'New market audience',
    week: '1 week',
    month: '1 month',
    quarter: 'Quarter',
  }
  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildNeelQuery(type: string, audience: string, horizon: string, initialQuestion?: string) {
  return [
    initialQuestion || `Create a launch strategy for our ${formatLabel(type)?.toLowerCase() || 'next launch'}.`,
    `Launch type: ${formatLabel(type) || 'Product or feature'}.`,
    `Primary audience: ${formatLabel(audience) || 'New market audience'}.`,
    `Planning horizon: ${formatLabel(horizon) || '1 month'}.`,
    'Return a clear launch plan covering pre-launch, launch, and post-launch phases, the channel and asset sequence, the main message hierarchy, and the success metrics to track.',
    'Keep the output practical and staged, not abstract GTM theory.',
  ].join('\n\n')
}

function buildSamQuery(type: string, audience: string) {
  return [
    `Create the first launch-ready copy assets for this ${formatLabel(type)?.toLowerCase() || 'launch'} aimed at ${formatLabel(audience)?.toLowerCase() || 'the selected audience'}.`,
    'Write the strongest announcement angle, one email draft, one landing-page headline and subheadline, and 2-3 social launch posts.',
    'Keep the copy consistent with one launch story across all assets.',
  ].join('\n\n')
}

export function LaunchStrategyFlow({
  initialQuestion,
  initialType,
  initialAudience,
  initialHorizon,
}: LaunchStrategyFlowProps = {}) {
  const launchType = initialType || 'product'
  const launchAudience = initialAudience || 'market'
  const launchHorizon = initialHorizon || 'month'

  const agents = useMemo<Array<AgentConfig>>(
    () => [
      {
        name: 'neel',
        label: 'Build Launch Plan',
        taskType: 'launch_strategy',
        defaultQuery: buildNeelQuery(launchType, launchAudience, launchHorizon, initialQuestion),
        placeholder: 'Describe what is launching, who it is for, and any date or rollout constraints.',
        tags: ['launch', 'gtm', 'strategy'],
      },
      {
        name: 'sam',
        label: 'Draft Launch Assets',
        taskType: 'launch_copy',
        defaultQuery: buildSamQuery(launchType, launchAudience),
        placeholder: 'Turn the launch plan into the first copy assets and announcement materials.',
        tags: ['launch', 'copy', 'assets'],
      },
    ],
    [initialQuestion, launchAudience, launchHorizon, launchType]
  )

  const preAgentContent = (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border-slate-200/70 bg-white/92 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.14)] dark:border-slate-800/80 dark:bg-slate-950/82">
        <CardHeader className="pb-3">
          <CardTitle className="text-base tracking-tight">Launch Brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Launch</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(launchType)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audience</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(launchAudience)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Window</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatLabel(launchHorizon)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">Launch Arc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>1. Define the pre-launch buildup, main launch beat, and post-launch follow-through.</div>
            <div>2. Sequence the right channels, assets, and messaging for each phase.</div>
            <div>3. Draft the first launch assets so execution can start immediately.</div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-50/85 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">What You Should Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div>• A staged launch plan, not just a checklist.</div>
            <div>• Channel and asset sequencing by phase.</div>
            <div>• The first launch copy assets ready to refine and ship.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <AgentModuleShell
      moduleId="launch-strategy"
      title="Plan a Launch"
      description="Structure the launch arc, sequence the channels, and get the first launch assets ready to ship."
      agents={agents}
      preAgentContent={preAgentContent}
      collapseSetupControls
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Draft launch assets"
      resourceContextLabel="Launch brief or PRD URL"
      resourceContextPlaceholder="Paste the PRD, campaign brief, announcement draft, or planning doc URL if the launch should follow a specific source"
      resourceContextHint="Optional. Use this when the launch plan should follow an exact PRD, brief, or draft announcement."
      buildResourceContext={(value) => `Use this exact launch brief or planning document if needed: ${value}`}
      resourceContextPlacement="primary"
    />
  )
}
