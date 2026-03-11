import { useState, useCallback, useRef } from 'react'
import type { Offer } from '@/components/agent/OfferSelector'

export interface AgentRunResult {
  streaming: boolean
  text: string
  artifact: Record<string, unknown> | null
  confidence: number | null
  runId: string | null
  error: string | null
}

export function useAgentRun(defaultCompanyId?: string) {
  const [state, setState] = useState<AgentRunResult>({
    streaming: false,
    text: '',
    artifact: null,
    confidence: null,
    runId: null,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(
    async (agentName: string, query: string, taskType?: string, companyId?: string, offer?: Offer | null) => {
      abortRef.current?.abort()
      const abort = new AbortController()
      abortRef.current = abort
      setState({ streaming: true, text: '', artifact: null, confidence: null, runId: null, error: null })

      try {
        const res = await fetch(`/api/agents/${agentName}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            company_id: companyId ?? defaultCompanyId ?? undefined,
            task_type: taskType,
            offer_focus: offer ?? undefined,
          }),
          signal: abort.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as any).error || `Agent returned ${res.status}`)
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') continue
            try {
              const parsed = JSON.parse(payload)
              if (typeof parsed.text === 'string') {
                setState(s => ({ ...s, text: s.text + parsed.text }))
              }
              if (parsed.contract) {
                setState(s => ({
                  ...s,
                  artifact: (parsed.contract.artifact?.data as Record<string, unknown>) ?? null,
                  confidence: parsed.contract.artifact?.confidence ?? null,
                  runId: parsed.contract.run_id ?? null,
                }))
              }
              if (parsed.error) throw new Error(parsed.error)
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.startsWith('Unexpected token')) throw parseErr
            }
          }
        }

        setState(s => ({ ...s, streaming: false }))
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setState(s => ({ ...s, streaming: false, error: err.message || 'Agent run failed' }))
      }
    },
    [defaultCompanyId]
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ streaming: false, text: '', artifact: null, confidence: null, runId: null, error: null })
  }, [])

  return { ...state, run, reset }
}
