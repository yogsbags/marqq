import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createWorkspace(name.trim());
      toast.success(`Workspace "${name.trim()}" created`);
      setName('');
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="ws-name">Workspace name</Label>
          <Input
            id="ws-name"
            placeholder="e.g. Client A, Acme Corp"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? 'Creating…' : 'Create workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
