import { useEffect, useState } from 'react'
import { AgentModuleShell } from '@/components/agent/AgentModuleShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const CRO_TABS = [
  {
    id: 'page',
    label: 'Page',
    title: 'Page CRO',
    description: 'Audit any landing or marketing page for conversion gaps. Score the headline, CTA, trust signals, and friction. Get prioritised rewrites. If GA4 and Google Sheets are connected, Tara can ground the diagnosis in live funnel and export data.',
    agents: [
      {
        name: 'tara',
        label: 'Tara — Page Audit',
        taskType: 'page_cro',
        defaultQuery:
          'Audit this page for conversion. Score 0-10: headline clarity, CTA strength, trust signals, friction level, social proof. Rewrite the headline and primary CTA. List the top 3 highest-impact fixes.',
        placeholder: 'Paste page URL or copy-paste the page content',
        tags: ['cro', 'page', 'audit'],
      },
      {
        name: 'sam',
        label: 'Sam — Copy Rewrites',
        taskType: 'page_copy_rewrite',
        defaultQuery:
          'Rewrite the above-the-fold section: new headline (3 variants), subheadline, hero CTA, and supporting proof point. Make each variant test a different angle (pain / gain / fear).',
        placeholder: 'Any specific angle or ICP to focus on',
        tags: ['cro', 'copy', 'rewrite'],
      },
    ],
  },
  {
    id: 'signup',
    label: 'Signup Flow',
    title: 'Signup Flow CRO',
    description: 'Reduce drop-off in the signup or registration funnel. Map every step, score friction points, and get copy + UX recommendations. If GA4 and Google Sheets are connected, Tara can use them to validate the biggest drop-off points.',
    agents: [
      {
        name: 'tara',
        label: 'Tara — Signup Audit',
        taskType: 'signup_flow_cro',
        defaultQuery:
          'Audit the signup flow step by step. Identify where users drop off and why. Score friction (form fields, cognitive load, trust) at each step. Recommend the top 3 changes to improve completion rate.',
        placeholder: 'Describe the signup steps or paste the signup page URL',
        tags: ['cro', 'signup', 'funnel'],
      },
    ],
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    title: 'Onboarding CRO',
    description: 'Optimise the post-signup onboarding flow to reach activation faster. Map the activation moment, reduce time-to-value, and increase Day-7 retention.',
    agents: [
      {
        name: 'tara',
        label: 'Tara — Onboarding Audit',
        taskType: 'onboarding_cro',
        defaultQuery:
          'Audit the post-signup onboarding flow. Define the activation moment (the action that predicts retention). Identify the biggest friction point before activation. Recommend the top 3 changes to improve Day-7 retention.',
        placeholder: 'Describe the current onboarding steps and activation metric',
        tags: ['cro', 'onboarding', 'activation'],
      },
      {
        name: 'sam',
        label: 'Sam — Onboarding Copy',
        taskType: 'onboarding_copy',
        defaultQuery:
          'Write onboarding copy: welcome email (sent immediately after signup), Day-2 follow-up (nudge to first value action), Day-5 check-in (address hesitation), Day-7 milestone email (celebrate progress).',
        placeholder: 'Product, activation action, and key benefit to reinforce',
        tags: ['cro', 'onboarding', 'email'],
      },
    ],
  },
  {
    id: 'forms',
    label: 'Forms',
    title: 'Form CRO',
    description: 'Optimise lead capture, demo request, and contact forms. Reduce field count, improve labels, and increase submission rates. If GA4 and Google Sheets are connected, Tara can compare the form diagnosis against live submission data.',
    agents: [
      {
        name: 'tara',
        label: 'Tara — Form Audit',
        taskType: 'form_cro',
        defaultQuery:
          'Audit this form. Count fields and flag unnecessary ones. Score the labels (clear vs. jargon), the CTA button text, error handling, and trust signals near the submit button. Recommend the minimal field set and rewrite the CTA.',
        placeholder: 'Paste the form fields and their labels, or the page URL',
        tags: ['cro', 'form', 'audit'],
      },
    ],
  },
  {
    id: 'popups',
    label: 'Popups',
    title: 'Popup CRO',
    description: 'Design and optimise exit-intent popups, scroll triggers, and timed overlays that convert without harming UX.',
    agents: [
      {
        name: 'sam',
        label: 'Sam — Popup Design & Copy',
        taskType: 'popup_cro',
        defaultQuery:
          'Design a popup for [goal: email capture / demo request / discount offer]. Specify: trigger (exit-intent / scroll depth / time), headline, subtext, CTA, and offer. Write 3 headline variants. Recommend the one segmented for returning vs. new visitors.',
        placeholder: 'Goal, current conversion rate (if known), and any constraints',
        tags: ['cro', 'popup', 'copy'],
      },
    ],
  },
  {
    id: 'paywall',
    label: 'Paywall',
    title: 'Paywall & Upgrade CRO',
    description: 'Increase free-to-paid conversion and plan upgrades. Tara scores the paywall UX; Sam rewrites the upgrade messaging.',
    agents: [
      {
        name: 'tara',
        label: 'Tara — Paywall Audit',
        taskType: 'paywall_cro',
        defaultQuery:
          'Audit the paywall or upgrade prompt. Score: value communication, feature gating logic, pricing clarity, urgency/scarcity, and trust. Identify the top reason users decline to upgrade and recommend the fix.',
        placeholder: 'Describe the paywall or paste the upgrade page',
        tags: ['cro', 'paywall', 'upgrade'],
      },
      {
        name: 'sam',
        label: 'Sam — Upgrade Copy',
        taskType: 'upgrade_copy',
        defaultQuery:
          'Rewrite the upgrade prompt copy. Include: the core value headline, the 3 key benefits unlocked, social proof (1 customer line), urgency element, and CTA button text (3 variants). Also write a follow-up email for users who dismissed the prompt.',
        placeholder: 'Current plan limits, target plan, key unlocked features',
        tags: ['cro', 'paywall', 'copy'],
      },
    ],
  },
]

type CROFlowProps = {
  initialTab?: string
  initialQuestion?: string
}

export function CROFlow({ initialTab, initialQuestion }: CROFlowProps = {}) {
  const [activeTab, setActiveTab] = useState(initialTab && CRO_TABS.some((tab) => tab.id === initialTab) ? initialTab : 'page')

  useEffect(() => {
    if (initialTab && CRO_TABS.some((tab) => tab.id === initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const current = CRO_TABS.find(t => t.id === activeTab)!
  const supportsSheetContext = ['page', 'signup', 'forms'].includes(current.id)
  const activeAgents = current.agents.map((agent) => ({
    ...agent,
    defaultQuery: [
      initialQuestion || '',
      agent.defaultQuery,
    ].filter(Boolean).join('\n\n'),
  }))

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {CRO_TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CRO_TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="mt-4">
            <AgentModuleShell
              moduleId={`cro-${t.id}`}
              title={t.title}
              description={t.description}
              agents={t.id === current.id ? activeAgents : t.agents}
              resourceContextLabel={t.id === current.id && supportsSheetContext
                ? current.id === 'signup'
                  ? 'Signup funnel sheet'
                  : current.id === 'forms'
                    ? 'Form conversion sheet'
                    : 'Funnel or conversion sheet'
                : undefined}
              resourceContextPlaceholder={t.id === current.id && supportsSheetContext ? 'https://docs.google.com/spreadsheets/d/...' : undefined}
              resourceContextHint={t.id === current.id && supportsSheetContext
                ? 'Paste the exact Google Sheet Tara should use for this diagnosis instead of relying on discovery.'
                : undefined}
              resourceContextPlacement={t.id === current.id && supportsSheetContext ? 'primary' : 'setup'}
              buildResourceContext={
                t.id === current.id && supportsSheetContext
                  ? (value, agent) => agent.name === 'tara'
                    ? `Use this exact Google Sheets URL for supporting funnel or conversion analysis if needed: ${value}`
                    : `Reference this exact Google Sheets URL if useful for the CRO work: ${value}`
                  : undefined
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
