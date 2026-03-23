import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ReferralProgramFlowProps = {
  initialQuestion?: string
  initialWho?: string
  initialPlay?: string
  initialIncentive?: string
  initialChannel?: string
}

function formatGoalLabel(value?: string) {
  if (!value) return null

  const labelMap: Record<string, string> = {
    customers: 'Happy customers',
    champions: 'Product champions',
    partners: 'Partners or affiliates',
    invite_loop: 'Invite loop',
    post_purchase: 'Post-purchase ask',
    win_back: 'Win-back referrals',
    double_sided: 'Double-sided reward',
    advocate_only: 'Advocate-only reward',
    non_cash: 'Non-cash perk',
    email: 'Email and lifecycle',
    in_product: 'In-product',
    social: 'Social sharing',
    crm: 'CRM-led outreach',
  }

  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

export function ReferralProgramFlow({
  initialQuestion,
  initialWho,
  initialPlay,
  initialIncentive,
  initialChannel,
}: ReferralProgramFlowProps = {}) {
  const isGuidedLaunch = Boolean(initialQuestion || initialWho || initialPlay || initialIncentive || initialChannel)

  return (
    <AgentModuleShell
      moduleId="referral-program"
      title="Referral Program"
      description="Design a referral loop that turns existing customers, champions, or partners into a repeatable acquisition channel."
      preAgentContent={
        <div className="space-y-4">
          {isGuidedLaunch ? (
            <Card className="border-border/70 bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Veena referral brief</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advocates</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialWho) || 'Referral-ready users'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Play</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialPlay) || 'Referral motion'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reward</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialIncentive) || 'Referral incentive'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Launch</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialChannel) || 'Primary launch path'}</div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Build the referral plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                Start with Tara to generate the referral plan. Expand the rollout and copy section after the core mechanics are in place.
              </div>
              <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1</div>
                <div className="mt-1 text-sm font-medium text-foreground">Design the mechanism</div>
                <div className="mt-1 text-xs text-muted-foreground">Tara defines the referral motion, reward logic, trigger point, and economics.</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2</div>
                <div className="mt-1 text-sm font-medium text-foreground">Plan the launch path</div>
                <div className="mt-1 text-xs text-muted-foreground">Kiran maps the rollout sequence, channels, sharing prompts, and timing for the first launch.</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 3</div>
                <div className="mt-1 text-sm font-medium text-foreground">Write the asset set</div>
                <div className="mt-1 text-xs text-muted-foreground">Sam turns the plan into invitation copy, landing copy, reminder messages, and share text.</div>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      agents={[
        {
          name: 'tara',
          label: 'Build Referral Plan · Tara',
          taskType: 'referral_program',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Design the referral program mechanics. Include the target advocate segment, referral trigger moment, reward structure, unique link or code mechanics, anti-abuse guardrails, and the minimum success metrics we should track for launch.`,
          placeholder: 'Product type, user base, current referral behaviour, or reward constraints',
          tags: ['referral', 'growth', 'mechanics'],
        },
        {
          name: 'kiran',
          label: 'Step 2 · Kiran — Rollout Details',
          taskType: 'referral_launch_plan',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Design the referral launch plan. Recommend the right launch channel mix, trigger timing, customer journey entry point, follow-up sequence, and how the program should be rolled out in the first 30 days.`,
          placeholder: 'Launch channel, existing lifecycle touchpoints, customer milestones, or rollout constraints',
          tags: ['referral', 'lifecycle', 'launch'],
        },
        {
          name: 'sam',
          label: 'Step 3 · Sam — Referral Copy',
          taskType: 'referral_copy',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Write the referral asset set: (1) primary invite message, (2) referral landing page headline and subheadline, (3) reminder follow-up, (4) reward confirmation copy, and (5) 3 share-ready variants for email, in-product, or social use.`,
          placeholder: 'Tone, brand voice, reward framing, or any compliance constraints',
          tags: ['referral', 'copy', 'assets'],
        },
      ]}
      resourceContextLabel="Advocate or customer sheet"
      resourceContextPlaceholder="https://docs.google.com/spreadsheets/d/..."
      resourceContextHint="Paste the exact Google Sheet with advocates, customers, promoters, or partner lists if you want the agents to work from that source."
      resourceContextPlacement="primary"
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Expand rollout and messaging"
      buildResourceContext={(value, agent) => {
        if (agent.name === 'tara') return `Use this exact Google Sheets URL for advocate segmentation, referral economics, or launch targeting if needed: ${value}`
        if (agent.name === 'kiran') return `Use this exact Google Sheets URL as supporting referral rollout or lifecycle context if useful: ${value}`
        return `Reference this exact Google Sheets URL if useful for tailoring the referral copy or invite sequence: ${value}`
      }}
    />
  )
}
