import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { Moon, Sun, User, Bell, Shield, Database, Bot, Sparkles } from 'lucide-react';

export function GeneralTab() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();

  // AI Team Context form
  const [agentCtx, setAgentCtx] = useState({
    company: '', websiteUrl: '', industry: '', icp: '', competitors: '', primaryGoal: '', campaigns: '', keywords: '', goals: '',
  });
  const [ctxSaving, setCtxSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams({ userId: user.id });
        if (activeWorkspace?.id) params.set('workspaceId', activeWorkspace.id);
        const res = await fetch(`/api/agents/context?${params}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || cancelled) return;

        setAgentCtx({
          company: String(data.company || ''),
          websiteUrl: String(data.websiteUrl || ''),
          industry: String(data.industry || ''),
          icp: String(data.icp || ''),
          competitors: String(data.competitors || ''),
          primaryGoal: String(data.primaryGoal || ''),
          campaigns: String(data.campaigns || ''),
          keywords: String(data.keywords || ''),
          goals: String(data.goals || ''),
        });
      } catch {
        // ignore hydration failures; form remains editable
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const saveAgentContext = async () => {
    if (!user?.id) { toast.error('Sign in to save agent context'); return; }
    if (!agentCtx.company.trim()) { toast.error('Company name is required'); return; }
    setCtxSaving(true);
    try {
      const res = await fetch('/api/agents/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, workspaceId: activeWorkspace?.id, ...agentCtx }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'save failed');
      }
      toast.success('AI team context saved — all agents will use this on their next run');
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setCtxSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[1.8rem] border-orange-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.92))] shadow-[0_24px_60px_-38px_rgba(234,88,12,0.24)] dark:border-orange-900/40 dark:bg-[linear-gradient(135deg,rgba(41,19,7,0.84),rgba(10,10,10,0.94))]">
        <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:py-8">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center rounded-full border border-orange-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300">
              General settings
            </div>
            <div className="space-y-2">
              <h2 className="font-brand-syne text-3xl tracking-tight text-foreground md:text-4xl">Workspace controls</h2>
              <p className="max-w-[58ch] text-sm leading-6 text-muted-foreground">
                Manage your profile, appearance, security posture, and AI team context from one calmer settings surface.
              </p>
            </div>
          </div>

          <div className="grid gap-3 self-start sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
              <div className="mt-1 text-sm font-medium text-foreground">{activeWorkspace?.name || 'Personal workspace'}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</div>
              <div className="mt-1 text-sm font-medium text-foreground">{user?.email || 'Signed-in user'}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Theme</div>
              <div className="mt-1 text-sm font-medium text-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Profile and appearance
            </CardTitle>
            <CardDescription className="text-sm">
              Basic identity, role visibility, and theme behavior for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <span className="text-sm font-medium text-foreground">Role</span>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    Appearance
                  </div>
                  <p className="text-xs text-muted-foreground">Switch the workspace shell between light and dark mode.</p>
                </div>
                <Switch
                  id="theme"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <div className="mb-2 h-2 rounded bg-primary/80"></div>
                  <div className="mb-1 h-1 rounded bg-muted"></div>
                  <div className="h-1 w-2/3 rounded bg-muted"></div>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <div className="mb-2 h-2 rounded bg-orange-500"></div>
                  <div className="mb-1 h-1 rounded bg-muted"></div>
                  <div className="h-1 w-3/4 rounded bg-muted"></div>
                </div>
              </div>
            </div>

            <Button type="button" className="w-full opacity-50 cursor-not-allowed" disabled title="Coming soon">
              Update Profile <span className="ml-2 text-xs font-normal">(coming soon)</span>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notifications
                <span className="text-xs font-normal text-muted-foreground">Coming soon</span>
              </CardTitle>
              <CardDescription className="text-sm">Email, push, and scheduled digest preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 opacity-55">
              {[
                'Email Notifications',
                'Push Notifications',
                'Marketing Emails',
                'Weekly Reports',
              ].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                  <Label htmlFor={`general-notify-${index}`}>{item}</Label>
                  <Switch id={`general-notify-${index}`} defaultChecked={index !== 2} disabled />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
              <CardDescription className="text-sm">Password, session, and verification controls for this account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start opacity-50 cursor-not-allowed" disabled title="Coming soon">
                Change Password <span className="ml-2 text-xs font-normal">(coming soon)</span>
              </Button>
              <Button variant="outline" className="w-full justify-start opacity-50 cursor-not-allowed" disabled title="Coming soon">
                Enable Two-Factor Authentication <span className="ml-2 text-xs font-normal">(coming soon)</span>
              </Button>
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3 opacity-60">
                <Label htmlFor="session-timeout">Auto Logout</Label>
                <Switch id="session-timeout" defaultChecked disabled />
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="text-sm font-medium text-foreground">Active Sessions</div>
                <div className="mt-1 text-xs text-muted-foreground">You are currently signed in on 1 device.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[1.6rem] border-border/70 bg-muted/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-orange-500" />
            AI Team Context
          </CardTitle>
          <CardDescription className="text-sm">
            Give the AI team durable business context so their runs start from your actual market, ICP, and current goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-orange-200/70 bg-orange-50/60 px-4 py-3 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-200">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Shared context for all agents
            </div>
            <div className="mt-1 text-xs leading-5 text-orange-800/80 dark:text-orange-200/75">
              Zara, Maya, Riya, Arjun, Dev, and Priya read this before their next runs. Keep it concise, current, and specific.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctx-company">Company name *</Label>
              <Input
                id="ctx-company"
                placeholder="e.g. PL Capital"
                value={agentCtx.company}
                onChange={(e) => setAgentCtx((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctx-website">Website URL</Label>
              <Input
                id="ctx-website"
                placeholder="e.g. plcapital.in"
                value={agentCtx.websiteUrl}
                onChange={(e) => setAgentCtx((p) => ({ ...p, websiteUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctx-industry">Industry / niche</Label>
              <Input
                id="ctx-industry"
                placeholder="e.g. WealthTech, India"
                value={agentCtx.industry}
                onChange={(e) => setAgentCtx((p) => ({ ...p, industry: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctx-icp-inline">Target ICP</Label>
              <Input
                id="ctx-icp-inline"
                placeholder="e.g. HNI investors, 35–55, Tier 1 cities"
                value={agentCtx.icp}
                onChange={(e) => setAgentCtx((p) => ({ ...p, icp: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctx-competitors">Top competitors (comma-separated)</Label>
            <Input
              id="ctx-competitors"
              placeholder="e.g. Groww, Zerodha, ETMoney, PaytmMoney"
              value={agentCtx.competitors}
              onChange={(e) => setAgentCtx((p) => ({ ...p, competitors: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctx-campaigns">Current active campaigns</Label>
            <Input
              id="ctx-campaigns"
              placeholder="e.g. SIP awareness (Google), HNI retargeting (LinkedIn)"
              value={agentCtx.campaigns}
              onChange={(e) => setAgentCtx((p) => ({ ...p, campaigns: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctx-keywords">Active SEO keywords (comma-separated)</Label>
            <Input
              id="ctx-keywords"
              placeholder="e.g. best mutual fund app India, SIP calculator, index fund"
              value={agentCtx.keywords}
              onChange={(e) => setAgentCtx((p) => ({ ...p, keywords: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctx-goals">Key goals this quarter</Label>
            <Textarea
              id="ctx-goals"
              placeholder="e.g. Grow organic traffic 40%, launch HNI advisory product, reduce CAC by 20%"
              rows={3}
              value={agentCtx.goals}
              onChange={(e) => setAgentCtx((p) => ({ ...p, goals: e.target.value }))}
            />
          </div>

          <Button
            onClick={saveAgentContext}
            disabled={ctxSaving || !agentCtx.company.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {ctxSaving ? 'Saving…' : 'Save AI Team Context'}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Data Management
            <span className="text-xs font-normal text-muted-foreground">Coming soon</span>
          </CardTitle>
          <CardDescription className="text-sm">Export, retention, and account-level data controls.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" disabled className="opacity-50 cursor-not-allowed" title="Coming soon">Export Data</Button>
            <Button variant="outline" disabled className="opacity-50 cursor-not-allowed" title="Coming soon">Download Reports</Button>
            <Button variant="destructive" disabled className="opacity-50 cursor-not-allowed" title="Coming soon">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
