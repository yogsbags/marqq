import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ArtifactRecord } from '../api'
import { useGtmContext } from '@/lib/gtmContext'
import { GtmContextBanner } from '@/components/ui/gtm-context-banner'
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

export function ContentStrategyPage({ artifact, companyId, companyName, websiteUrl }: Props) {
  const { context: gtmCtx, dismiss: dismissGtm } = useGtmContext('company_intel_content_strategy')
  const data = asObj(artifact?.data)

  if (!artifact || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">No content strategy yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Generate to see content pillars, formats, distribution rules, and governance.</CardContent>
      </Card>
    )
  }

  const contentPillars: any[] = Array.isArray(data.contentPillars) ? data.contentPillars : []
  const formats: string[] = Array.isArray(data.formats) ? data.formats : []
  const distributionRules: string[] = Array.isArray(data.distributionRules) ? data.distributionRules : []
  const repurposingPlan: string[] = Array.isArray(data.repurposingPlan) ? data.repurposingPlan : []
  const governance = asObj(data.governance) || {}
  const reviewChecklist: string[] = Array.isArray(governance.reviewChecklist) ? governance.reviewChecklist : []
  const aiScores = asObj(data.scores)
  const pillarStrength = Number.isFinite(Number(aiScores?.pillarStrength))
    ? clampDisplayScore(aiScores.pillarStrength)
    : clampDisplayScore(contentPillars.length * 18 + formats.length * 4)
  const distributionReadiness = Number.isFinite(Number(aiScores?.distributionReadiness))
    ? clampDisplayScore(aiScores.distributionReadiness)
    : clampDisplayScore(distributionRules.length * 12 + repurposingPlan.length * 8)
  const governanceMaturity = Number.isFinite(Number(aiScores?.governanceMaturity))
    ? clampDisplayScore(aiScores.governanceMaturity)
    : clampDisplayScore(reviewChecklist.length * 12)

  return (
    <div className="space-y-4">
      {gtmCtx && <GtmContextBanner context={gtmCtx} onDismiss={dismissGtm} />}
      <ArtifactScoreCards
        items={[
          { label: 'Pillar Strength', value: pillarStrength, description: 'How strong and differentiated the content pillars are.' },
          { label: 'Distribution Readiness', value: distributionReadiness, description: 'How ready this content plan is for multi-channel execution.' },
          { label: 'Governance Maturity', value: governanceMaturity, description: 'How robust the review and operating discipline is.' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">Content Pillars</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {contentPillars.length ? (
            contentPillars.map((p, idx) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="font-semibold text-sm">{String(p.name || `Pillar ${idx + 1}`)}</div>
                <div className="text-sm text-foreground mt-1">{String(p.purpose || '')}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Examples:
                  {(Array.isArray(p.exampleTopics) ? p.exampleTopics : []).slice(0, 8).map((t: string, i: number) => (
                    <div key={i}>• {t}</div>
                  ))}
                </div>
                <div className="mt-3">
                  <CompanyIntelActionButton
                    label="Generate Briefs"
                    agentName="riya"
                    companyId={companyId}
                    companyName={companyName}
                    websiteUrl={websiteUrl}
                    taskPrefix={`Content Pillar • ${String(p.name || `Pillar ${idx + 1}`)}`}
                    taskRequest={[
                      companyName ? `Company: ${companyName}.` : null,
                      `Generate content briefs from this content pillar: ${String(p.name || `Pillar ${idx + 1}`)}.`,
                      `Purpose: ${String(p.purpose || '')}.`,
                      `Example topics: ${(Array.isArray(p.exampleTopics) ? p.exampleTopics : []).join(' | ') || 'none'}.`,
                      'Create a taskboard queue of publishable content briefs and begin with the highest-value brief.'
                    ].filter(Boolean).join(' ')}
                    marketingContext={{ module: 'content_strategy', contentPillar: p, contentStrategy: data }}
                    successMessage={`Content brief deployment started for ${String(p.name || `Pillar ${idx + 1}`)}.`}
                    dialogTitle="Generate Content Briefs"
                    dialogDescription="This will create a queue of content briefs for the selected pillar and start the highest-value brief."
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-orange-600 dark:text-orange-400">Formats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {formats.length ? formats.map((f, idx) => <div key={idx}>• {f}</div>) : <div className="text-sm text-muted-foreground">—</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base text-orange-600 dark:text-orange-400">Distribution Rules</CardTitle>
              <CompanyIntelActionButton
                label="Deploy Distribution"
                agentName="zara"
                companyId={companyId}
                companyName={companyName}
                websiteUrl={websiteUrl}
                taskPrefix="Distribution Rules"
                taskRequest={[
                  companyName ? `Company: ${companyName}.` : null,
                  'Deploy this distribution strategy into an execution workflow.',
                  `Formats: ${formats.join(' | ') || 'none'}.`,
                  `Rules: ${distributionRules.join(' | ') || 'none'}.`,
                  'Create distribution and publishing tasks for the taskboard and start the first channel workflow.'
                ].filter(Boolean).join(' ')}
                marketingContext={{ module: 'content_strategy', distributionRules, formats, contentStrategy: data }}
                successMessage="Distribution workflow deployed to the taskboard."
                dialogTitle="Deploy Distribution Workflow"
                dialogDescription="This will convert the distribution rules into a publishing workflow with execution tasks."
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {distributionRules.length ? distributionRules.map((r, idx) => <div key={idx}>• {r}</div>) : <div className="text-sm text-muted-foreground">—</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base text-orange-600 dark:text-orange-400">Repurposing Plan</CardTitle>
              <CompanyIntelActionButton
                label="Automate Repurposing"
                agentName="riya"
                companyId={companyId}
                companyName={companyName}
                websiteUrl={websiteUrl}
                taskPrefix="Repurposing Plan"
                taskRequest={[
                  companyName ? `Company: ${companyName}.` : null,
                  'Automate this repurposing plan into a repeatable content workflow.',
                  `Formats: ${formats.join(' | ') || 'none'}.`,
                  `Repurposing steps: ${repurposingPlan.join(' | ') || 'none'}.`,
                  'Create taskboard tasks that chain asset reuse and start the first repurposing workflow.'
                ].filter(Boolean).join(' ')}
                marketingContext={{ module: 'content_strategy', repurposingPlan, formats, contentStrategy: data }}
                successMessage="Repurposing workflow deployed to the taskboard."
                dialogTitle="Automate Repurposing Workflow"
                dialogDescription="This will create a repeatable repurposing workflow and start the first asset-adaptation step."
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {repurposingPlan.length ? repurposingPlan.map((r, idx) => <div key={idx}>• {r}</div>) : <div className="text-sm text-muted-foreground">—</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-orange-600 dark:text-orange-400">Governance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {reviewChecklist.length ? reviewChecklist.map((r, idx) => <div key={idx}>• {r}</div>) : <div className="text-sm text-muted-foreground">—</div>}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
