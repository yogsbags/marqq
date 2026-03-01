import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Connector = {
  id: string; name: string; status: string;
  notes?: string; connected?: boolean; connectedAt?: string | null;
};

export function AccountsTab() {
  const { user } = useAuth();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations?userId=${encodeURIComponent(user.id)}`);
      const json = await res.json();
      setConnectors(json?.connectors ?? []);
    } catch { setConnectors([]); } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const connect = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, connectorId: id, authType: 'oauth' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.details || 'connect failed');
      await load(); toast.success('Connected');
    } catch (err: any) { toast.error(err?.message || 'Connect failed'); } finally { setActionId(null); }
  };

  const disconnect = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch('/api/integrations/disconnect', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, connectorId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.details || 'disconnect failed');
      await load(); toast.success('Disconnected');
    } catch (err: any) { toast.error(err?.message || 'Disconnect failed'); } finally { setActionId(null); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Connect ad, analytics, and commerce platforms for live data in your agents.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : connectors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No integrations available.</p>
      ) : (
        <div className="space-y-2">
          {connectors.map(c => (
            <div key={c.id} className="border rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{c.name}</p>
                {c.notes && <p className="text-xs text-muted-foreground mt-0.5">{c.notes}</p>}
                {c.connectedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connected {new Date(c.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.connected ? 'default' : 'secondary'}>
                  {c.connected ? 'Connected' : 'Not connected'}
                </Badge>
                {c.connected ? (
                  <Button variant="outline" size="sm" disabled={actionId === c.id} onClick={() => disconnect(c.id)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" disabled={actionId === c.id} onClick={() => connect(c.id)}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
