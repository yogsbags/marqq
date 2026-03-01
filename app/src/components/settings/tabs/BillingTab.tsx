import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BillingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage your plan and payment details.</p>
      </div>
      <div className="border rounded-lg p-6 flex items-center justify-between">
        <div>
          <p className="font-medium">Free plan</p>
          <p className="text-sm text-muted-foreground mt-1">Upgrade to unlock more credits and features.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Free</Badge>
          <Button>Upgrade →</Button>
        </div>
      </div>
    </div>
  );
}
