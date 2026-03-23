import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import type { ArtifactRecord, Company } from '../api'
import { COMPANY_INTEL_PAGES, type CompanyIntelPageId } from '../pages'
import { CompanySnapshotCard } from '../ui/CompanySnapshotCard'

type Props = {
  companies: Company[]
  selectedCompanyId: string
  onSelectCompanyId: (id: string) => void
  onDeleteCompany: (id: string) => Promise<void>
  company: Company | null
  artifacts: Record<string, ArtifactRecord>
  onNavigate: (pageId: CompanyIntelPageId) => void
  onRunAction?: (moduleId: string, agentName: string) => void
  queuedAutorunPending?: boolean
  backgroundGenStatus?: { status: string; completed: number; failed?: number; total: number } | null
  quickStartPages?: Array<{ id: CompanyIntelPageId; title: string }>
  simpleMode?: boolean
}

export function OverviewPage({
  companies,
  selectedCompanyId,
  onSelectCompanyId,
  onDeleteCompany,
  company,
  artifacts: _artifacts,
  onNavigate: _onNavigate,
  onRunAction: _onRunAction,
  queuedAutorunPending = false,
  backgroundGenStatus,
  quickStartPages: _quickStartPages,
  simpleMode = false
}: Props) {
  const hasProfileData = Boolean(
    company?.profile &&
      typeof company.profile === 'object' &&
      Object.keys(company.profile as Record<string, unknown>).length > 0
  )

  return (
    <div className="space-y-4">
      {simpleMode ? (
        <Card className="border-amber-400/50 bg-amber-500/10">
          <CardContent className="py-3 text-sm text-amber-600 dark:text-amber-400">
            Simple mode is on. You are seeing the recommended pages only. Switch to Advanced mode to access all analysis tools.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600 dark:text-orange-400">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Companies</Label>
            <div className="max-h-[280px] overflow-auto space-y-2">
              {companies.length ? (
                companies.map((c) => {
                  const isSelected = c.id === selectedCompanyId
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'border rounded-md p-3 transition-colors',
                        isSelected ? 'border-orange-400 bg-orange-500/10' : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => onSelectCompanyId(c.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-sm text-foreground">{c.companyName}</div>
                            <div className="text-xs text-muted-foreground">{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</div>
                          </div>
                          {c.websiteUrl ? <div className="text-xs text-muted-foreground break-all mt-1">{c.websiteUrl}</div> : null}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-destructive"
                          aria-label={`Delete ${c.companyName}`}
                          title={`Delete ${c.companyName}`}
                          onClick={() => {
                            void onDeleteCompany(c.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-muted-foreground">No companies yet. Create a workspace on the home screen to get started.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {queuedAutorunPending || (backgroundGenStatus && backgroundGenStatus.status === 'running') ? (
        <Card className="border-blue-400/50 bg-blue-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Veena is generating company intelligence modules...
              </div>
              {backgroundGenStatus ? (
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                  {backgroundGenStatus.completed} / {backgroundGenStatus.total} completed{backgroundGenStatus.failed ? ` · ${backgroundGenStatus.failed} failed` : ''}
                </div>
              ) : (
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                  Auto-starting...
                </div>
              )}
            </div>
            <div className="w-full bg-blue-500/20 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${backgroundGenStatus ? (backgroundGenStatus.completed / backgroundGenStatus.total) * 100 : 12}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {backgroundGenStatus?.status === 'running' && !hasProfileData ? (
        <Card className="border-orange-200/70 bg-gradient-to-br from-orange-50 to-amber-50 dark:border-orange-900/40 dark:from-orange-950/20 dark:to-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-700 dark:text-orange-300">Veena is generating your company snapshot...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>Veena is scanning the website, extracting company details, and preparing the first intelligence modules.</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md border border-orange-200/60 bg-white/70 p-3 dark:border-orange-900/30 dark:bg-gray-950/40">
                <div className="h-3 w-24 animate-pulse rounded bg-orange-200/70 dark:bg-orange-900/40" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-orange-100/80 dark:bg-orange-950/40" />
                <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-orange-100/80 dark:bg-orange-950/40" />
              </div>
              <div className="rounded-md border border-orange-200/60 bg-white/70 p-3 dark:border-orange-900/30 dark:bg-gray-950/40">
                <div className="h-3 w-20 animate-pulse rounded bg-orange-200/70 dark:bg-orange-900/40" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-orange-100/80 dark:bg-orange-950/40" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-orange-100/80 dark:bg-orange-950/40" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {hasProfileData && company ? (
        <CompanySnapshotCard companyName={company.companyName} websiteUrl={company.websiteUrl} profile={company.profile} />
      ) : null}

    </div>
  )
}
