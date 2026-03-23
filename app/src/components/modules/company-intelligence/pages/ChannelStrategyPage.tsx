import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ArtifactRecord } from '../api'
import { useGtmContext } from '@/lib/gtmContext'
import { GtmContextBanner } from '@/components/ui/gtm-context-banner'
import { ArtifactScoreCards, clampDisplayScore } from '../ui/ArtifactScoreCards'

type Props = {
  artifact: ArtifactRecord | null
}

function asObj(data: unknown): any {
  return data && typeof data === 'object' ? (data as any) : null
}

export function ChannelStrategyPage({ artifact }: Props) {
  const { context: gtmCtx, dismiss: dismissGtm } = useGtmContext('company_intel_channel_strategy')
  const data = asObj(artifact?.data)

  if (!artifact || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">No channel strategy yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Generate to see channel roles, cadence, growth loops, and measurement.</CardContent>
      </Card>
    )
  }

  const channels: any[] = Array.isArray(data.channels) ? data.channels : []
  const budgetSplitGuidance: string[] = Array.isArray(data.budgetSplitGuidance) ? data.budgetSplitGuidance : []
  const measurement: string[] = Array.isArray(data.measurement) ? data.measurement : []
  const aiScores = asObj(data.scores)
  const channelFit = Number.isFinite(Number(aiScores?.channelFit))
    ? clampDisplayScore(aiScores.channelFit)
    : clampDisplayScore(channels.length * 18 + budgetSplitGuidance.length * 5)
  const cadenceStrength = Number.isFinite(Number(aiScores?.cadenceStrength))
    ? clampDisplayScore(aiScores.cadenceStrength)
    : clampDisplayScore(channels.filter((channel) => String(channel?.cadence || '').trim()).length * 18)
  const measurementReadiness = Number.isFinite(Number(aiScores?.measurementReadiness))
    ? clampDisplayScore(aiScores.measurementReadiness)
    : clampDisplayScore(measurement.length * 16 + budgetSplitGuidance.length * 6)

  return (
    <div className="space-y-4">
      {gtmCtx && <GtmContextBanner context={gtmCtx} onDismiss={dismissGtm} />}
      <ArtifactScoreCards
        items={[
          { label: 'Channel Fit', value: channelFit, description: 'How well the chosen channels map to the GTM motion.' },
          { label: 'Cadence Strength', value: cadenceStrength, description: 'How specific and usable the operating cadence is.' },
          { label: 'Measurement Readiness', value: measurementReadiness, description: 'How actionable the budget and measurement logic is.' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">Channel Roles & Cadence</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {channels.length ? (
            channels.map((c, idx) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="font-semibold text-sm">{String(c.name || `Channel ${idx + 1}`)}</div>
                <div className="text-sm text-foreground mt-1">{String(c.role || '')}</div>
                <div className="text-xs text-muted-foreground mt-2">Cadence: {String(c.cadence || '—')}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Content mix:
                  {(Array.isArray(c.contentMix) ? c.contentMix : []).slice(0, 10).map((m: string, i: number) => (
                    <div key={i}>• {m}</div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Growth loops:
                  {(Array.isArray(c.growthLoops) ? c.growthLoops : []).slice(0, 10).map((m: string, i: number) => (
                    <div key={i}>• {m}</div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-orange-600 dark:text-orange-400">Budget Split Guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {budgetSplitGuidance.length ? (
              budgetSplitGuidance.map((b, idx) => <div key={idx}>• {b}</div>)
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-orange-600 dark:text-orange-400">Measurement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {measurement.length ? measurement.map((m, idx) => <div key={idx}>• {m}</div>) : <div className="text-sm text-muted-foreground">—</div>}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
