import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface SpotlightTourStep {
  /** data-tour attribute value, or null for centered card */
  target: string | null
  title: string
  description: string
  placement: 'center' | 'right' | 'top' | 'bottom' | 'left'
}

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6
const TOOLTIP_W = 304
const TOOLTIP_H_EST = 188
const GAP = 14

function computeTooltipStyle(
  spotlight: SpotlightRect | null,
  placement: SpotlightTourStep['placement'],
): React.CSSProperties {
  if (!spotlight || placement === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TOOLTIP_W,
    }
  }

  const { top, left, width, height } = spotlight

  if (placement === 'right') {
    return {
      position: 'fixed',
      top: Math.max(8, top + height / 2 - TOOLTIP_H_EST / 2),
      left: left + width + GAP,
      width: TOOLTIP_W,
    }
  }
  if (placement === 'left') {
    return {
      position: 'fixed',
      top: Math.max(8, top + height / 2 - TOOLTIP_H_EST / 2),
      right: Math.max(8, window.innerWidth - left + GAP),
      width: TOOLTIP_W,
    }
  }
  if (placement === 'top') {
    const l = Math.max(8, Math.min(left + width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 8))
    return {
      position: 'fixed',
      top: Math.max(8, top - TOOLTIP_H_EST - GAP),
      left: l,
      width: TOOLTIP_W,
    }
  }
  if (placement === 'bottom') {
    const l = Math.max(8, Math.min(left + width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 8))
    return {
      position: 'fixed',
      top: top + height + GAP,
      left: l,
      width: TOOLTIP_W,
    }
  }
  return {
    position: 'fixed',
    top: Math.max(8, top + height / 2 - TOOLTIP_H_EST / 2),
    right: window.innerWidth - left + GAP,
    width: TOOLTIP_W,
  }
}

export interface SpotlightTourProps {
  steps: SpotlightTourStep[]
  /** If set, written to localStorage when tour completes or skips */
  storageKey: string
  onDone: () => void
  /** Shown in progress area, e.g. "Home" vs "App" */
  tourLabel?: string
}

export function SpotlightTour({ steps, storageKey, onDone, tourLabel }: SpotlightTourProps) {
  const [step, setStep] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const current = steps[step]
  const total = steps.length

  useEffect(() => {
    if (!current.target) {
      setSpotlight(null)
      return
    }
    let debounceTimer: number | undefined
    const measure = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`) as HTMLElement | null
      if (!el) {
        setSpotlight(null)
        return
      }
      try {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } catch {
        el.scrollIntoView({ block: 'nearest' })
      }
      const apply = () => {
        const r = el.getBoundingClientRect()
        if (r.width < 2 && r.height < 2) {
          setSpotlight(null)
          return
        }
        setSpotlight({
          top: r.top - PAD,
          left: r.left - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
        })
      }
      apply()
      if (debounceTimer) window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(apply, 320)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      if (debounceTimer) window.clearTimeout(debounceTimer)
    }
  }, [step, current.target])

  const finish = () => {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }
    onDone()
  }

  const next = () => {
    if (step >= total - 1) {
      finish()
      return
    }
    setStep(s => s + 1)
  }
  const prev = () => setStep(s => Math.max(0, s - 1))

  const tooltipStyle = computeTooltipStyle(spotlight, current.placement)

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: spotlight ? 'transparent' : 'rgba(0,0,0,0.55)' }}
        onClick={finish}
        aria-hidden
      />

      {spotlight && (
        <div
          className="fixed z-[61] rounded-lg pointer-events-none"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
            transition: 'top 0.25s, left 0.25s, width 0.25s, height 0.25s',
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className="fixed z-[62] rounded-[1.25rem] border border-orange-200/70 bg-background/98 p-5 shadow-2xl dark:border-orange-900/40 dark:bg-zinc-950/96 max-h-[min(90vh,420px)] overflow-y-auto"
        style={tooltipStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="spotlight-tour-title"
        aria-describedby="spotlight-tour-desc"
      >
        <button
          type="button"
          onClick={finish}
          className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {tourLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
              {tourLabel}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            Step {step + 1} of {total}
          </span>
        </div>

        <div className="flex gap-1.5 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-orange-500'
                  : i < step
                    ? 'w-2 bg-orange-300'
                    : 'w-2 bg-orange-100 dark:bg-white/10'
              }`}
            />
          ))}
        </div>

        <h3 id="spotlight-tour-title" className="mb-1.5 text-base font-semibold text-foreground">
          {current.title}
        </h3>
        <p id="spotlight-tour-desc" className="mb-5 text-sm leading-relaxed text-muted-foreground">
          {current.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground shrink-0"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prev}
                className="h-8 w-8 p-0"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={next}
              className="h-8 px-4 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {step === total - 1 ? (
                'Done'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
