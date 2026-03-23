import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { HiX as X, HiCheckCircle as Check } from 'react-icons/hi'
import { Loader2 } from 'lucide-react'

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3008'

interface ChainStep {
  order: number
  agent: string
  query: string
  description?: string
}

interface StepState {
  order: number
  agent: string
  status: 'pending' | 'running' | 'done' | 'error'
  text: string
  handoffNotes?: string
}

interface ChainRunPanelProps {
  workflowName: string
  steps: ChainStep[]
  companyId: string | null
  onClose: () => void
}

export function ChainRunPanel({ workflowName, steps, companyId, onClose }: ChainRunPanelProps) {
  const [stepStates, setStepStates] = useState<StepState[]>(
    steps.map(s => ({ order: s.order, agent: s.agent, status: 'pending', text: '' }))
  )
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const updateStep = (order: number, update: Partial<StepState>) => {
    setStepStates(prev => prev.map(s => s.order === order ? { ...s, ...update } : s))
  }

  const runChain = async () => {
    setRunning(true)
    setError(null)
    abortRef.current = new AbortController()

    try {
      const resp = await fetch(`${BACKEND_URL}/api/agents/chain/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, company_id: companyId }),
        signal: abortRef.current.signal,
      })

      if (!resp.ok || !resp.body) {
        throw new Error(`Chain failed: ${resp.status}`)
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') { setDone(true); break }

          try {
            const event = JSON.parse(payload)

            if (event.step_start) {
              updateStep(event.step_start.order, { status: 'running' })
            } else if (event.text) {
              setStepStates(prev => {
                const runningStep = prev.find(s => s.status === 'running')
                if (!runningStep) return prev
                return prev.map(s => s.order === runningStep.order ? { ...s, text: s.text + event.text } : s)
              })
            } else if (event.step_done) {
              const notes = event.step_done.contract?.handoff_notes
              updateStep(event.step_done.order, {
                status: 'done',
                handoffNotes: typeof notes === 'string' ? notes : Array.isArray(notes) ? notes.join(' ') : undefined,
              })
            } else if (event.error) {
              setError(event.error)
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message)
      }
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    runChain()
    return () => { abortRef.current?.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [stepStates])

  const currentStep = stepStates.find(s => s.status === 'running')
  const completedCount = stepStates.filter(s => s.status === 'done').length
  const handleClose = () => {
    abortRef.current?.abort()
    onClose()
  }

  // Suppress unused variable warning — currentStep is used conceptually for progress context
  void currentStep

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleClose}>
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(event) => event.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">{workflowName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {done ? `Completed ${completedCount} of ${steps.length} steps` :
               running ? `Running step ${completedCount + 1} of ${steps.length}` :
               `${steps.length} steps`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {running && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-4">
            {stepStates.map(step => (
              <div key={step.order} className={cn('rounded-lg border p-3', step.status === 'running' && 'border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10')}>
                <div className="flex items-center gap-2 mb-2">
                  {step.status === 'done' ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : step.status === 'running' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {step.agent}
                  </span>
                  <span className="text-xs text-muted-foreground">· Step {step.order}</span>
                </div>

                {step.text && (
                  <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4 ml-6">
                    {step.text.slice(0, 600)}{step.text.length > 600 ? '…' : ''}
                  </p>
                )}

                {step.handoffNotes && step.status === 'done' && (
                  <div className="ml-6 mt-2 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                    <p className="text-xs text-green-700 dark:text-green-400">{step.handoffNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {error && (
          <div className="px-4 py-2 border-t bg-red-50 dark:bg-red-900/10">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {done && (
          <div className="p-4 border-t flex justify-end">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
