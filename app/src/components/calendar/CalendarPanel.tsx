import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Bot, Clock, CalendarDays, Play, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchJson } from '@/components/modules/company-intelligence/api'
import { useWorkspace } from '@/contexts/WorkspaceContext'

const CALENDARIFIC_KEY = import.meta.env.VITE_CALENDARIFIC_API_KEY as string | undefined

// ── Types ─────────────────────────────────────────────────────────────────────

type DeploymentEntry = {
  id: string
  agentName: string
  workspaceId?: string | null
  agentTarget?: string | null
  sectionTitle?: string | null
  scheduleMode?: string | null
  status?: string
  scheduledFor?: string | null
  createdAt?: string
}

type Festival = {
  name: string
  date: Date
  description: string
  type: string[]
}

// ── Colours ───────────────────────────────────────────────────────────────────

const AGENT_COLOUR: Record<string, string> = {
  veena: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  isha:  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  neel:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  sam:   'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  riya:  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  maya:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  arjun: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  tara:  'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  kiran: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  dev:   'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  priya: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  zara:  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
}

const STATUS_COLOUR: Record<string, string> = {
  active:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paused:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

// ── Calendarific fetch ────────────────────────────────────────────────────────

async function fetchFestivals(year: number): Promise<Festival[]> {
  if (!CALENDARIFIC_KEY) return []
  const url = `https://calendarific.com/api/v2/holidays?api_key=${CALENDARIFIC_KEY}&country=IN&year=${year}`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  const holidays = json?.response?.holidays ?? []
  return holidays.map((h: Record<string, unknown>) => {
    const dateObj = h.date as Record<string, unknown>
    const iso = dateObj?.iso as string
    return {
      name: h.name as string,
      date: new Date(iso),
      description: (h.description as string) || '',
      type: Array.isArray(h.type) ? (h.type as string[]) : [],
    }
  }).filter((f: Festival) => !Number.isNaN(f.date.getTime()))
}

// Festival cache across panel open/close within same session
const festivalCache: Record<number, Festival[]> = {}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CalendarPanelProps {
  isOpen: boolean
  onClose: () => void
  onModuleSelect: (moduleId: string) => void
}

export function CalendarPanel({ isOpen, onClose, onModuleSelect }: CalendarPanelProps) {
  const { activeWorkspace } = useWorkspace()
  const [deployments, setDeployments] = useState<DeploymentEntry[]>([])
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewedMonth, setViewedMonth] = useState<Date>(new Date())

  // Load deployments
  const loadDeployments = useCallback(async () => {
    try {
      const data = await fetchJson<{ deployments?: DeploymentEntry[] }>('/api/agents/deployments')
      const all = data.deployments ?? []
      const filtered = activeWorkspace
        ? all.filter(d => !d.workspaceId || d.workspaceId === activeWorkspace.id)
        : all
      setDeployments(filtered.filter(d =>
        ['active', 'paused', 'pending', 'running'].includes(String(d.status ?? ''))
      ))
    } catch {
      setDeployments([])
    }
  }, [activeWorkspace])

  // Load festivals for current + next year on open
  const loadFestivals = useCallback(async () => {
    const thisYear = new Date().getFullYear()
    const nextYear = thisYear + 1
    const years = [thisYear, nextYear].filter(y => !festivalCache[y])
    if (years.length > 0) {
      const results = await Promise.all(years.map(fetchFestivals))
      years.forEach((y, i) => { festivalCache[y] = results[i] })
    }
    setFestivals([
      ...(festivalCache[thisYear] ?? []),
      ...(festivalCache[nextYear] ?? []),
    ])
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    Promise.all([loadDeployments(), loadFestivals()]).finally(() => setLoading(false))
  }, [isOpen, loadDeployments, loadFestivals])

  // Also fetch when user navigates to a new year
  useEffect(() => {
    const y = viewedMonth.getFullYear()
    if (festivalCache[y]) return
    fetchFestivals(y).then(data => {
      festivalCache[y] = data
      setFestivals(prev => {
        const existing = prev.filter(f => f.date.getFullYear() !== y)
        return [...existing, ...data]
      })
    })
  }, [viewedMonth])

  const deploymentsWithDates = useMemo(() =>
    deployments
      .map(d => ({
        ...d,
        when: d.scheduledFor ? new Date(d.scheduledFor) : d.createdAt ? new Date(d.createdAt) : null,
      }))
      .filter((d): d is typeof d & { when: Date } =>
        d.when !== null && !Number.isNaN(d.when.getTime())
      ),
  [deployments])

  const deploymentDays = useMemo(() => deploymentsWithDates.map(d => d.when), [deploymentsWithDates])
  const festivalDays   = useMemo(() => festivals.map(f => f.date), [festivals])

  const dayDeployments = useMemo(() => {
    const key = selectedDate.toDateString()
    return deploymentsWithDates.filter(d => d.when.toDateString() === key)
  }, [deploymentsWithDates, selectedDate])

  const dayFestivals = useMemo(() => {
    const key = selectedDate.toDateString()
    return festivals.filter(f => f.date.toDateString() === key)
  }, [festivals, selectedDate])

  // Upcoming festivals in next 30 days
  const soonFestivals = useMemo(() =>
    festivals
      .filter(f => { const d = daysUntil(f.date); return d >= 0 && d <= 30 })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5),
  [festivals])

  const handleRunCampaign = useCallback((festival: Festival, mode: 'now' | 'schedule') => {
    try {
      sessionStorage.setItem('marqq_festival_campaign', JSON.stringify({
        festival: festival.name,
        description: festival.description,
        date: festival.date.toISOString(),
        mode,
      }))
    } catch { /* non-blocking */ }
    onModuleSelect('social-media')
    onClose()
  }, [onModuleSelect, onClose])

  if (!isOpen) return null

  const hasAnything = dayDeployments.length > 0 || dayFestivals.length > 0

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300" onClick={onClose} />

      <div className="fixed top-16 right-6 w-[23rem] bg-background border rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-5 fade-in-50 duration-300 flex flex-col max-h-[84vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-sm">Marketing Calendar</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Coming up strip */}
        {soonFestivals.length > 0 && (
          <div className="px-3 py-2 border-b bg-amber-50/60 dark:bg-amber-950/20 flex-shrink-0">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">Coming up</p>
            <div className="flex flex-wrap gap-1.5">
              {soonFestivals.map(f => {
                const days = daysUntil(f.date)
                return (
                  <button
                    key={f.name + f.date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(new Date(f.date))}
                    className="flex items-center gap-1 rounded-full bg-white dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    <span>{f.name}</span>
                    <span className="text-amber-500 font-semibold">
                      {days === 0 ? '· today' : `· ${days}d`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="flex justify-center px-2 pt-3 pb-2 border-b flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={d => d && setSelectedDate(d)}
            month={viewedMonth}
            onMonthChange={setViewedMonth}
            modifiers={{ deployment: deploymentDays, festival: festivalDays }}
            modifiersClassNames={{
              deployment: 'relative after:absolute after:bottom-0.5 after:left-[calc(50%-5px)] after:h-1 after:w-1 after:rounded-full after:bg-orange-500',
              festival:   'relative before:absolute before:bottom-0.5 before:left-[calc(50%+1px)] before:h-1 before:w-1 before:rounded-full before:bg-amber-400',
            }}
            className="p-0"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-1.5 border-b flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block" />
            Agent run
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
            Holiday
          </div>
        </div>

        {/* Day content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-2">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
            ) : !hasAnything ? (
              <div className="text-center py-6">
                <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nothing on this day</p>
              </div>
            ) : (
              <>
                {/* Festival cards */}
                {dayFestivals.map(festival => {
                  const days = daysUntil(festival.date)
                  return (
                    <div
                      key={festival.name + festival.date.toISOString()}
                      className="rounded-lg border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 px-3 py-2.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-tight">{festival.name}</p>
                          {festival.description && (
                            <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-0.5 leading-snug line-clamp-2">{festival.description}</p>
                          )}
                          {festival.type.length > 0 && (
                            <p className="text-[10px] text-amber-600/60 dark:text-amber-500/60 mt-0.5 capitalize">{festival.type.join(' · ')}</p>
                          )}
                        </div>
                        {days >= 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 flex-1 text-[11px] gap-1 bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => handleRunCampaign(festival, 'now')}
                        >
                          <Play className="h-3 w-3" />
                          Run Campaign
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 text-[11px] gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                          onClick={() => handleRunCampaign(festival, 'schedule')}
                        >
                          <CalendarClock className="h-3 w-3" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {/* Agent deployment cards */}
                {dayDeployments.map(entry => (
                  <div key={entry.id} className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={`text-[10px] px-1.5 py-0 capitalize font-medium ${AGENT_COLOUR[entry.agentName.toLowerCase()] ?? 'bg-slate-100 text-slate-700'}`}>
                        {entry.agentName}
                      </Badge>
                      <Badge className={`text-[10px] px-1.5 py-0 capitalize ${STATUS_COLOUR[String(entry.status ?? '')] ?? ''}`}>
                        {entry.status}
                      </Badge>
                    </div>
                    {entry.sectionTitle && (
                      <p className="text-xs font-medium leading-tight">{entry.sectionTitle}</p>
                    )}
                    {entry.agentTarget && (
                      <p className="text-[11px] text-muted-foreground">{entry.agentTarget.replace(/_/g, ' ')}</p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {entry.when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {entry.scheduleMode && (
                        <span className="ml-1 capitalize">· {entry.scheduleMode.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
