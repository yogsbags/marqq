import { usePlan } from '@/hooks/usePlan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, CheckCircle2, Lock, Sparkles, ArrowUpRight } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  growth: 'Growth',
  scale: 'Scale',
  agency: 'Agency',
};

const PLAN_PRICES: Record<string, { inr: string; usd: string }> = {
  growth: { inr: '₹12,999/mo', usd: '$249/mo' },
  scale:  { inr: '₹29,999/mo', usd: '$599/mo' },
  agency: { inr: 'Custom', usd: 'Custom' },
};

const PLAN_FEATURES: Record<string, string[]> = {
  growth: [
    'All 12 AI agents',
    '30+ text-based modules',
    '500 agent credits/month',
    'Company Intelligence',
    'Lead Intelligence',
    'SEO, Content, Messaging',
    'Budget Optimization',
    'Email support',
  ],
  scale: [
    'Everything in Growth',
    '2,000 agent credits/month',
    'Social Media video campaigns',
    'AI Video Generation (HeyGen/Veo)',
    'AI Voice Bot (LiveKit)',
    'Dedicated onboarding',
    'Priority support',
  ],
  agency: [
    'Everything in Scale',
    'Unlimited credits',
    '10+ workspaces',
    'White-label option',
    'CSM + SLA',
    'Custom integrations',
  ],
};

const PLAN_ORDER = ['growth', 'scale', 'agency'] as const;

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function BillingTab() {
  const { plan, creditsRemaining, creditsTotal, creditsResetAt, isLoading } = usePlan();

  const creditPct = creditsTotal > 0 && creditsRemaining !== -1
    ? Math.round((creditsRemaining / creditsTotal) * 100)
    : 100;

  const barColor = creditPct > 50
    ? 'bg-green-500'
    : creditPct > 20
    ? 'bg-orange-500'
    : 'bg-red-500';

  const daysLeft = daysUntil(creditsResetAt);
  const creditsUsed = creditsRemaining === -1 ? 0 : creditsTotal - creditsRemaining;
  const activePlanLabel = isLoading ? '…' : PLAN_LABELS[plan] ?? plan;
  const activePlanPrice = PLAN_PRICES[plan]?.inr ?? '—';

  return (
    <div className="max-w-5xl space-y-6">
      <Card className="overflow-hidden rounded-[1.8rem] border-orange-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.92))] shadow-[0_24px_60px_-38px_rgba(234,88,12,0.25)] dark:border-orange-900/40 dark:bg-[linear-gradient(135deg,rgba(41,19,7,0.84),rgba(10,10,10,0.94))]">
        <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-8">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center rounded-full border border-orange-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300">
              Billing
            </div>
            <div className="space-y-2">
              <h2 className="font-brand-syne text-3xl tracking-tight text-foreground md:text-4xl">Billing & Plan</h2>
              <p className="max-w-[58ch] text-sm leading-6 text-muted-foreground">
                See your active plan, credit runway, and upgrade options without leaving the workspace control surface.
              </p>
            </div>
          </div>

          <div className="grid gap-3 self-start sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active plan</div>
              <div className="mt-1 text-sm font-medium text-foreground">{activePlanLabel}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Price</div>
              <div className="mt-1 text-sm font-medium text-foreground">{activePlanPrice}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Credits</div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {creditsRemaining === -1 ? 'Unlimited' : `${creditsRemaining.toLocaleString()} remaining`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current plan</CardTitle>
            <CardDescription className="text-sm">Track usage, reset timing, and the cost model behind the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{activePlanLabel} Plan</span>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Active</Badge>
              </div>
              <span className="text-sm font-medium text-foreground">{activePlanPrice}</span>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  Agent credits
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {creditsRemaining === -1 ? 'Unlimited' : `${creditsRemaining.toLocaleString()} remaining`}
                </span>
              </div>

              {creditsRemaining !== -1 ? (
                <>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${creditPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{creditsUsed.toLocaleString()} used of {creditsTotal.toLocaleString()}</span>
                    {daysLeft !== null ? <span>Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span> : null}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">This workspace has no monthly credit cap.</div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Text agent run', cost: '1 credit' },
                { label: 'Video render', cost: '10 credits' },
                { label: 'Voice bot', cost: '2 credits / min' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{item.cost}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upgrade path</CardTitle>
            <CardDescription className="text-sm">Choose the right operating tier for the team and workload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLAN_ORDER.map((p) => {
              const isCurrent = p === plan;
              const isLocked = PLAN_ORDER.indexOf(p) < PLAN_ORDER.indexOf(plan as typeof PLAN_ORDER[number]);
              const isUpgrade = PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(plan as typeof PLAN_ORDER[number]);

              return (
                <div
                  key={p}
                  className={`rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-orange-300 bg-orange-50/70 dark:border-orange-900/40 dark:bg-orange-950/20'
                      : 'border-border/70 bg-background/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{PLAN_LABELS[p]}</span>
                        {isCurrent ? (
                          <Badge className="border-0 bg-orange-500 text-[10px] uppercase tracking-wide text-white">Current</Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">
                        {PLAN_PRICES[p]?.inr}
                        {p !== 'agency' ? (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {PLAN_PRICES[p]?.usd}</span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isCurrent || isLocked}
                      className={`h-8 text-xs ${
                        isCurrent
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300'
                          : isUpgrade
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'opacity-40'
                      }`}
                    >
                      {isCurrent ? 'Current' : isLocked ? <><Lock className="mr-1 h-3 w-3" />Locked</> : <><ArrowUpRight className="mr-1 h-3 w-3" />Upgrade</>}
                    </Button>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {PLAN_FEATURES[p].slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
        <CardContent className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Need Agency or custom pricing?
            </div>
            <p className="text-xs text-muted-foreground">10+ workspaces, white-label, custom integrations, CSM, and SLA support.</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs" asChild>
            <a href="mailto:support@marqq.ai">Contact us</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
