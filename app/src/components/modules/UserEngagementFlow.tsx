import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UserEngagementFlowProps = {
  initialQuestion?: string
  initialSegment?: string
  initialProblem?: string
  initialMotion?: string
  initialChannel?: string
}

function formatGoalLabel(value?: string) {
  if (!value) return null

  const labelMap: Record<string, string> = {
    new_users: 'New users',
    active_users: 'Active users',
    dormant_users: 'Dormant users',
    activation: 'Low activation',
    habit: 'Weak repeat usage',
    dropoff: 'Usage drop-off',
    onboarding: 'Onboarding journey',
    lifecycle: 'Lifecycle messaging',
    reactivation: 'Reactivation play',
    email: 'Email',
    product: 'In-product',
    mixed: 'Email + product',
  }

  return labelMap[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

export function UserEngagementFlow({
  initialQuestion,
  initialSegment,
  initialProblem,
  initialMotion,
  initialChannel,
}: UserEngagementFlowProps = {}) {
  const isGuidedLaunch = Boolean(initialQuestion || initialSegment || initialProblem || initialMotion || initialChannel)

  return (
    <AgentModuleShell
      moduleId="user-engagement"
      title="Improve User Engagement"
      description="Diagnose weak activation or repeat usage, design the right journey, and turn it into a clearer engagement plan."
      preAgentContent={
        <div className="space-y-4">
          {isGuidedLaunch ? (
            <Card className="border-border/70 bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Veena engagement brief</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Users</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialSegment) || 'Priority users'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Problem</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialProblem) || 'Engagement friction'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motion</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialMotion) || 'Engagement motion'}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{formatGoalLabel(initialChannel) || 'Available channels'}</div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Engagement loop</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How this run works</div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">1. Diagnose the weak point</div>
                    <div className="mt-1 text-xs text-muted-foreground">Tara finds the biggest blocker in activation, repeat usage, or re-engagement.</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">2. Design the touchpoint path</div>
                    <div className="mt-1 text-xs text-muted-foreground">Kiran maps the journey, triggers, and timing for the engagement motion.</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                    <div className="text-sm font-medium text-foreground">3. Turn it into messages</div>
                    <div className="mt-1 text-xs text-muted-foreground">Sam writes the prompts, nudges, and lifecycle copy needed to launch.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you should get</div>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground">Priority segment</div>
                    <div className="mt-1 text-xs">Which users need the engagement fix first.</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Journey recommendation</div>
                    <div className="mt-1 text-xs">The right trigger, sequence, and channel mix.</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Message set</div>
                    <div className="mt-1 text-xs">The prompts, lifecycle emails, or reactivation copy to ship next.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      agents={[
        {
          name: 'tara',
          label: 'Build Engagement Diagnosis · Tara',
          taskType: 'engagement_analysis',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Diagnose the engagement problem for the priority user segment. Identify the main activation, repeat usage, or drop-off issue, the likely cause, the highest-leverage intervention, and the key metrics to watch.`,
          placeholder: 'Usage pattern, current funnel behaviour, activation benchmarks, or engagement symptoms',
          tags: ['engagement', 'activation', 'analysis'],
        },
        {
          name: 'kiran',
          label: 'Step 2 · Kiran — Journey Plan',
          taskType: 'engagement_journey',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Design the engagement journey for the priority segment. Recommend the right lifecycle triggers, sequence timing, channel mix, prompts, and follow-up path to increase activation or repeat usage.`,
          placeholder: 'Preferred channels, usage milestones, lifecycle constraints, or retention context',
          tags: ['engagement', 'journey', 'lifecycle'],
        },
        {
          name: 'sam',
          label: 'Step 3 · Sam — Engagement Copy',
          taskType: 'engagement_copy',
          defaultQuery:
            `${initialQuestion ? `${initialQuestion}\n\n` : ''}Write the engagement message set: onboarding prompts or lifecycle emails, reminder or nudge copy, reactivation copy if relevant, and 3 subject lines or CTA variants for the chosen journey.`,
          placeholder: 'Tone, brand voice, product context, and any lifecycle or compliance constraints',
          tags: ['engagement', 'copy', 'lifecycle'],
        },
      ]}
      resourceContextLabel="Usage or cohort sheet"
      resourceContextPlaceholder="https://docs.google.com/spreadsheets/d/..."
      resourceContextHint="Paste the exact Google Sheet with cohorts, usage exports, activation data, or engagement segments if you want the agents to work from that source."
      resourceContextPlacement="primary"
      secondaryAgentsCollapsed
      secondaryAgentsTitle="Expand journey and messaging"
      buildResourceContext={(value, agent) => {
        if (agent.name === 'tara') return `Use this exact Google Sheets URL for engagement, activation, or cohort analysis if needed: ${value}`
        if (agent.name === 'kiran') return `Use this exact Google Sheets URL as supporting engagement-journey context if useful: ${value}`
        return `Reference this exact Google Sheets URL if useful for tailoring the engagement copy or lifecycle messages: ${value}`
      }}
      enableReportActions
    />
  )
}
