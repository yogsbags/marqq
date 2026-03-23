import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlanName } from '@/hooks/usePlan';

const PLAN_LABELS: Record<PlanName, string> = {
  growth: 'Growth',
  scale: 'Scale',
  agency: 'Agency',
};

interface LockedModuleGateProps {
  moduleName: string;
  requiredPlan: PlanName;
  currentPlan: PlanName;
}

export function LockedModuleGate({ moduleName, requiredPlan, currentPlan }: LockedModuleGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
        <Lock className="h-7 w-7 text-orange-500" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold text-foreground">{moduleName} is on {PLAN_LABELS[requiredPlan]}</h2>
        <p className="text-sm text-muted-foreground">
          You're on the <span className="font-medium text-foreground">{PLAN_LABELS[currentPlan]}</span> plan.
          Upgrade to <span className="font-medium text-foreground">{PLAN_LABELS[requiredPlan]}</span> to unlock this module.
        </p>
      </div>

      <Button
        className="bg-orange-500 hover:bg-orange-600 text-white px-6"
        onClick={() => window.location.hash = 'settings/billing'}
      >
        Upgrade to {PLAN_LABELS[requiredPlan]}
      </Button>
    </div>
  );
}
