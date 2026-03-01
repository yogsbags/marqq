import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MoreVertical } from 'lucide-react';
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
      toast.success(`Invite sent to ${email.trim()}`);
      setEmail('');
    } catch (err: any) { toast.error(err.message); } finally { setInviting(false); }
  };

  const remove = async (memberId: string) => {
    if (!activeWorkspace?.id) return;
    try {
      await fetch(`/api/workspaces/${activeWorkspace.id}/members/${memberId}`, { method: 'DELETE' });
      toast.success('Member removed');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">Add unlimited members to your workspace for free.</p>
      </div>

      {/* Invite */}
      <div className="border rounded-lg p-4 space-y-3">
        <p className="font-medium text-sm">Invite</p>
        <div className="flex gap-2">
          <Input
            placeholder="colleague@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && invite()}
            className="flex-1"
          />
          <Button onClick={invite} disabled={inviting || !email.trim()}>
            {inviting ? 'Sending…' : '+ Add'}
          </Button>
        </div>
      </div>

      {/* Member list */}
      <div className="border rounded-lg divide-y">
        <div className="px-4 py-2 text-xs text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </div>
        {loading ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>
        ) : members.map(m => (
          <div key={m.id} className="px-4 py-3 flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>
            <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="shrink-0">
              {m.role === 'owner' ? 'Admin' : 'Member'}
            </Badge>
            {m.role !== 'owner' && m.id !== user?.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => remove(m.id)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
