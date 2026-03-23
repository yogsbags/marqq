import { useState } from 'react'
import { X, Sparkles, Building2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  icon: React.ReactNode
  label: string
  sub: string
  done?: boolean
}

interface FirstSessionBannerProps {
  currentModule: string | null
  onNavigate: (moduleId: string) => void
  onDismiss: () => void
}

export function FirstSessionBanner({ currentModule, onNavigate, onDismiss }: FirstSessionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const steps: Array<Step & { moduleId: string }> = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: 'Setup',
      sub: 'Tell Veena about your company',
      moduleId: 'setup',
      done: currentModule !== 'setup' && localStorage.getItem('marqq_setup_done') === '1',
    },
    {
      icon: <Building2 className="h-4 w-4" />,
      label: 'Company Intelligence',
      sub: 'Map your market & competitors',
      moduleId: 'company-intelligence',
      done: false,
    },
    {
      icon: <Play className="h-4 w-4" />,
      label: 'Run your first agent',
      sub: 'Pick any module and hit Run',
      moduleId: 'messaging',
      done: false,
    },
  ]

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  return (
    <div className="mx-6 mt-4 mb-2 rounded-xl border border-orange-200 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/20 px-4 py-3 flex items-start gap-4">
      <div className="shrink-0 mt-0.5">
        <Sparkles className="h-4 w-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">
          Your team is ready — here's where to start
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, idx) => (
            <button
              key={step.moduleId}
              onClick={() => onNavigate(step.moduleId)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors border",
                step.done
                  ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                  : currentModule === step.moduleId
                    ? "border-orange-400 bg-orange-500 text-white"
                    : "border-orange-200 bg-white dark:border-orange-800 dark:bg-transparent text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/40"
              )}
            >
              <span className="shrink-0 font-semibold text-[10px] opacity-60">{idx + 1}</span>
              {step.icon}
              <span className="font-medium">{step.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss getting started guide"
        className="shrink-0 rounded p-1 text-orange-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
