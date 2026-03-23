import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MoreVertical, UserPlus, Users, ShieldCheck, Sparkles } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Member = { id: string; name: string; email: string; role: 'owner' | 'member'; joined_at: string; };

export function MembersTab() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members`);
      const json = await res.json();
      setMembers(json?.members ?? []);
    } catch { setMembers([]); } finally { setLoading(false); }
  }, [activeWorkspace?.id]);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!email.trim() || !activeWorkspace?.id) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/invite`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), invitedBy: user?.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`Member added — email invites will be enabled shortly.`);
      setEmail('');
    } catch (err: any) { toast.error(err.message); } finally { setInviting(false); }
  };

  const remove = async (memberId: string) => {
    if (!activeWorkspace?.id) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members/${memberId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'remove failed');
      toast.success('Member removed');
      await load();
    } catch (err: any) { toast.error(err?.message || 'Failed to remove'); }
  };

  const ownerCount = members.filter((member) => member.role === 'owner').length;
  const memberCount = members.length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[1.8rem] border-orange-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.92))] shadow-[0_24px_60px_-38px_rgba(234,88,12,0.24)] dark:border-orange-900/40 dark:bg-[linear-gradient(135deg,rgba(41,19,7,0.84),rgba(10,10,10,0.94))]">
        <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:py-8">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center rounded-full border border-orange-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300">
              Members
            </div>
            <div className="space-y-2">
              <h2 className="font-brand-syne text-3xl tracking-tight text-foreground md:text-4xl">Team access</h2>
              <p className="max-w-[58ch] text-sm leading-6 text-muted-foreground">
                Invite teammates, review access, and keep the workspace team clear without dropping into an admin-heavy screen.
              </p>
            </div>
          </div>

          <div className="grid gap-3 self-start sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
              <div className="mt-1 text-sm font-medium text-foreground">{activeWorkspace?.name || 'Personal workspace'}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Members</div>
              <div className="mt-1 text-sm font-medium text-foreground">{memberCount}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Owners</div>
              <div className="mt-1 text-sm font-medium text-foreground">{ownerCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Invite teammate
            </CardTitle>
            <CardDescription className="text-sm">
              Add people to this workspace. Email invites can be layered in later without changing this flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-orange-200/70 bg-orange-50/60 px-4 py-3 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-200">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4" />
                Unlimited team seats
              </div>
              <div className="mt-1 text-xs leading-5 text-orange-800/80 dark:text-orange-200/75">
                Add teammates freely. Billing is not tied to member count in the current workspace plan model.
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="colleague@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && invite()}
                className="flex-1"
              />
              <Button onClick={invite} disabled={inviting || !email.trim()} className="w-full bg-orange-500 text-white hover:bg-orange-600">
                {inviting ? 'Sending…' : 'Add teammate'}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  Owner access
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Owners keep full billing, settings, and removal control.</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-orange-500" />
                  Member access
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Members collaborate across the workspace without ownership permissions.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Workspace roster
            </CardTitle>
            <CardDescription className="text-sm">
              Review who has access and remove members when the workspace team changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-2 text-xs text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </div>

            {loading ? (
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">Loading…</div>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">
                No members yet. Invite the first teammate from the panel on the left.
              </div>
            ) : (
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-xs">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="shrink-0">
                      {m.role === 'owner' ? 'Owner' : 'Member'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Member options">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600"
                          disabled={m.role === 'owner' || m.id === user?.id}
                          onClick={() => remove(m.id)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
