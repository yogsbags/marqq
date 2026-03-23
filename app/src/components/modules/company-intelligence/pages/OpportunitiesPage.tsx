import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ArtifactRecord } from '../api'
import { Badge } from '@/components/ui/badge'
import { ArtifactScoreCards, clampDisplayScore } from '../ui/ArtifactScoreCards'
import { CompanyIntelActionButton } from '../ui/CompanyIntelActionButton'

type Props = {
  artifact: ArtifactRecord | null
  companyId?: string
  companyName?: string
  websiteUrl?: string | null
}

function asObj(data: unknown): any {
  return data && typeof data === 'object' ? (data as any) : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : ''))
    .map((s) => s.trim())
    .filter(Boolean)
}

function priorityBadge(priority: string) {
  const p = String(priority || '').toLowerCase()
  if (p === 'high') return 'bg-red-100 text-red-800'
  if (p === 'medium') return 'bg-yellow-100 text-yellow-900'
  if (p === 'low') return 'bg-muted text-foreground'
  return 'bg-muted text-foreground'
}

export function OpportunitiesPage({ artifact, companyId, companyName, websiteUrl }: Props) {
  const data = asObj(artifact?.data)

  if (!artifact || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">No opportunities yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Generate to see quick wins, growth opportunities, and an execution plan.
        </CardContent>
      </Card>
    )
  }

  const summary = String(data.summary || '')
  const aiScores = asObj(data.scores)
  const quickWins: any[] = Array.isArray(data.quickWins) ? data.quickWins : []
  const opportunities: any[] = Array.isArray(data.opportunities) ? data.opportunities : []
  const risks: any[] = Array.isArray(data.risksAndMitigations) ? data.risksAndMitigations : []
  const plan90: any[] = Array.isArray(data['90DayPlan']) ? data['90DayPlan'] : []

  const highCount = opportunities.filter((o) => String(o?.priority || '').toLowerCase() === 'high').length
  const growthPotential = Number.isFinite(Number(aiScores?.growthPotential))
    ? clampDisplayScore(aiScores.growthPotential)
    : clampDisplayScore(opportunities.length * 12 + highCount * 10 + quickWins.length * 6)
  const quickWinReadiness = Number.isFinite(Number(aiScores?.quickWinReadiness))
    ? clampDisplayScore(aiScores.quickWinReadiness)
    : clampDisplayScore(quickWins.length * 18 + highCount * 8)
  const executionClarity = Number.isFinite(Number(aiScores?.executionClarity))
    ? clampDisplayScore(aiScores.executionClarity)
    : clampDisplayScore(plan90.length * 7 + risks.length * 6)

  return (
    <div className="space-y-4">
      <ArtifactScoreCards
        items={[
          { label: 'Growth Potential', value: growthPotential, description: 'How much meaningful upside this opportunity set contains.' },
          { label: 'Quick-Win Readiness', value: quickWinReadiness, description: 'How actionable the near-term wins are right now.' },
          { label: 'Execution Clarity', value: executionClarity, description: 'How clear the plan, risks, and next steps are.' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground">{summary || '—'}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">Quick Wins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickWins.length ? (
            quickWins.map((w, idx) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{String(w.title || `Quick win ${idx + 1}`)}</div>
                  <Badge className={priorityBadge(String(w.priority || 'medium'))}>{String(w.priority || 'medium')}</Badge>
                </div>
                <div className="text-sm text-foreground mt-1">{String(w.description || '')}</div>
                <div className="text-xs text-muted-foreground mt-2">Expected impact: {String(w.expectedImpact || '—')}</div>
                <div className="text-xs text-muted-foreground">Time to value: {String(w.timeToValue || '—')}</div>
                <div className="mt-3">
                  <CompanyIntelActionButton
                    label="Run Now"
                    agentName={String(w.category || w.title || '').toLowerCase().includes('content') ? 'riya' : String(w.category || w.title || '').toLowerCase().includes('strategy') ? 'neel' : 'zara'}
                    companyId={companyId}
                    companyName={companyName}
                    websiteUrl={websiteUrl}
                    taskPrefix={`Quick Win • ${String(w.title || `Quick win ${idx + 1}`)}`}
                    taskRequest={[
                      companyName ? `Company: ${companyName}.` : null,
                      websiteUrl ? `Website: ${websiteUrl}.` : null,
                      `Execute this quick win now: ${String(w.title || `Quick win ${idx + 1}`)}.`,
                      String(w.description || ''),
                      `Expected impact: ${String(w.expectedImpact || 'unknown')}.`,
                      `Time to value: ${String(w.timeToValue || 'unknown')}.`,
                      'Break this into immediate action items for the taskboard and execute the first-pass recommendation.'
                    ].filter(Boolean).join(' ')}
                    marketingContext={{ module: 'opportunities', quickWin: w, opportunities: data }}
                    successMessage={`Quick-win action started for ${String(w.title || `Quick win ${idx + 1}`)}.`}
                    dialogTitle="Deploy Quick Win"
                    dialogDescription="This will create the immediate tasks needed to execute this quick win and start the first-pass agent run."
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          {opportunities.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">Effort</th>
                  <th className="py-2 pr-3">Impact</th>
                  <th className="py-2">Next steps</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o, idx) => (
                  <tr key={idx} className="border-b align-top">
                    <td className="py-2 pr-3 font-medium">{String(o.title || `Opportunity ${idx + 1}`)}</td>
                    <td className="py-2 pr-3">{String(o.category || '—')}</td>
                    <td className="py-2 pr-3">
                      <Badge className={priorityBadge(String(o.priority || 'medium'))}>{String(o.priority || 'medium')}</Badge>
                    </td>
                    <td className="py-2 pr-3">{String(o.effort || '—')}</td>
                    <td className="py-2 pr-3">{String(o.expectedImpact || '—')}</td>
                    <td className="py-2">
                      <div>{asStringArray(o.nextSteps).slice(0, 3).join(' • ') || String(o.nextStep || '—')}</div>
                      <div className="mt-2">
                        <CompanyIntelActionButton
                          label="Create Playbook"
                          agentName={String(o.category || '').toLowerCase().includes('content') ? 'riya' : String(o.category || '').toLowerCase().includes('business') || String(o.category || '').toLowerCase().includes('strategy') ? 'neel' : 'zara'}
                          companyId={companyId}
                          companyName={companyName}
                          websiteUrl={websiteUrl}
                          taskPrefix={`Opportunity • ${String(o.title || `Opportunity ${idx + 1}`)}`}
                          taskRequest={[
                            companyName ? `Company: ${companyName}.` : null,
                            websiteUrl ? `Website: ${websiteUrl}.` : null,
                            `Create an execution playbook for this opportunity: ${String(o.title || `Opportunity ${idx + 1}`)}.`,
                            `Category: ${String(o.category || 'General')}.`,
                            `Expected impact: ${String(o.expectedImpact || 'unknown')}.`,
                            `Effort: ${String(o.effort || 'unknown')}.`,
                            `Next steps: ${asStringArray(o.nextSteps).join(' | ') || 'none listed'}.`,
                            'Break this into a staged taskboard playbook with concrete deliverables and run the first step.'
                          ].filter(Boolean).join(' ')}
                          marketingContext={{ module: 'opportunities', opportunity: o, opportunities: data }}
                          successMessage={`Playbook deployed for ${String(o.title || `Opportunity ${idx + 1}`)}.`}
                          dialogTitle="Deploy Opportunity Playbook"
                          dialogDescription="This will create a staged taskboard playbook for this opportunity and start the first execution step."
                          className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">90-Day Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan90.length ? (
            plan90.map((item, idx) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Week {String(item?.week || idx + 1)}</Badge>
                  <div className="font-medium text-sm">{String(item?.focus || `Plan item ${idx + 1}`)}</div>
                </div>
                {asStringArray(item?.keyActivities).length ? (
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {asStringArray(item?.keyActivities).map((activity, activityIdx) => (
                      <li key={activityIdx}>• {activity}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">—</div>
                )}
                <div className="mt-3">
                  <CompanyIntelActionButton
                    label="Schedule"
                    agentName="zara"
                    companyId={companyId}
                    companyName={companyName}
                    websiteUrl={websiteUrl}
                    taskPrefix={`90-Day Plan • Week ${String(item?.week || idx + 1)}`}
                    taskRequest={[
                      companyName ? `Company: ${companyName}.` : null,
                      `Schedule this 90-day plan item for execution.`,
                      `Week: ${String(item?.week || idx + 1)}.`,
                      `Focus: ${String(item?.focus || '')}.`,
                      `Activities: ${asStringArray(item?.keyActivities).join(' | ') || 'none listed'}.`,
                      'Create dated taskboard tasks and a simple execution schedule.'
                    ].filter(Boolean).join(' ')}
                    marketingContext={{ module: 'opportunities', ninetyDayPlanItem: item, opportunities: data }}
                    successMessage={`Week ${String(item?.week || idx + 1)} was added to the taskboard schedule.`}
                    dialogTitle="Schedule 90-Day Plan Item"
                    dialogDescription="This will convert the selected week into scheduled execution tasks on the taskboard."
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      {risks.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-orange-600 dark:text-orange-400">Risks & Mitigations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {risks.map((r, idx) => {
              if (typeof r === 'string') return <div key={idx}>• {r}</div>
              const riskText = String(r?.risk || '').trim()
              const mitigationText = String(r?.mitigation || '').trim()
              if (!riskText && !mitigationText) return null
              return (
                <div key={idx} className="border rounded-md p-3">
                  <div className="font-medium">• {riskText || 'Risk'}</div>
                  {mitigationText ? <div className="text-sm text-muted-foreground mt-1">Mitigation: {mitigationText}</div> : null}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
