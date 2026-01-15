import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type Company = {
  id: string
  companyName: string
  websiteUrl: string | null
  createdAt: string
  updatedAt: string
  profile?: unknown
}

type ArtifactRecord = {
  type: string
  updatedAt: string
  data: unknown
}

const ARTIFACTS: Array<{ type: string; label: string; helper?: string }> = [
  { type: 'competitor_intelligence', label: 'Competitor Intelligence' },
  { type: 'client_profiling', label: 'Client Profiling Analytics' },
  { type: 'partner_profiling', label: 'Partner Profiling Analytics' },
  { type: 'icps', label: 'ICPs (Cohorts/Segments)' },
  { type: 'social_calendar', label: 'Social Media Content Calendar' },
  { type: 'marketing_strategy', label: 'Marketing Strategy' },
  { type: 'content_strategy', label: 'Content Strategy' },
  { type: 'channel_strategy', label: 'Channel Strategy' },
  { type: 'lookalike_audiences', label: 'Lookalike Audiences' },
  { type: 'lead_magnets', label: 'Lead Magnets' }
]

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {})
    }
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (json as any)?.error || `Request failed: ${res.status}`
    throw new Error(message)
  }
  return json as T
}

export function CompanyIntelligenceFlow() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [companyDetails, setCompanyDetails] = useState<{ company: Company; artifacts: Record<string, ArtifactRecord> } | null>(
    null
  )

  const [newCompanyName, setNewCompanyName] = useState('')
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('')
  const [activeTab, setActiveTab] = useState<string>('marketing_strategy')

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputsJson, setInputsJson] = useState<string>(
    JSON.stringify(
      {
        goal: 'Increase qualified leads',
        geo: 'India',
        timeframe: '90 days',
        channels: ['instagram', 'linkedin', 'youtube', 'whatsapp'],
        notes: 'Keep it compliance-safe (no guaranteed returns).'
      },
      null,
      2
    )
  )

  const currentArtifact = useMemo(() => {
    if (!companyDetails) return null
    return companyDetails.artifacts?.[activeTab] || null
  }, [companyDetails, activeTab])

  const currentCompany = useMemo(() => {
    if (!companyDetails) return null
    return companyDetails.company
  }, [companyDetails])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        const data = await fetchJson<{ companies: Company[] }>('/api/company-intel/companies')
        if (cancelled) return
        setCompanies(data.companies || [])
        if (!selectedCompanyId && data.companies?.[0]?.id) {
          setSelectedCompanyId(data.companies[0].id)
        }
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || 'Failed to load companies')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedCompanyId])

  useEffect(() => {
    if (!selectedCompanyId) return
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        const data = await fetchJson<{ company: Company; artifacts: Record<string, ArtifactRecord> }>(
          `/api/company-intel/companies/${selectedCompanyId}`
        )
        if (cancelled) return
        setCompanyDetails(data)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || 'Failed to load company')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedCompanyId])

  async function createCompany() {
    try {
      setLoading('ingest')
      setError(null)
      const data = await fetchJson<{ company: Company }>('/api/company-intel/companies', {
        method: 'POST',
        body: JSON.stringify({ companyName: newCompanyName, websiteUrl: newWebsiteUrl })
      })
      setNewCompanyName('')
      setNewWebsiteUrl('')
      setSelectedCompanyId(data.company.id)
    } catch (e: any) {
      setError(e?.message || 'Company ingestion failed')
    } finally {
      setLoading(null)
    }
  }

  async function generateArtifact() {
    if (!selectedCompanyId) return
    try {
      setLoading(`generate:${activeTab}`)
      setError(null)
      let inputs: any = {}
      try {
        inputs = inputsJson ? JSON.parse(inputsJson) : {}
      } catch {
        throw new Error('Inputs JSON is invalid')
      }

      await fetchJson<{ artifact: ArtifactRecord }>(`/api/company-intel/companies/${selectedCompanyId}/generate`, {
        method: 'POST',
        body: JSON.stringify({ type: activeTab, inputs })
      })

      const refreshed = await fetchJson<{ company: Company; artifacts: Record<string, ArtifactRecord> }>(
        `/api/company-intel/companies/${selectedCompanyId}`
      )
      setCompanyDetails(refreshed)
    } catch (e: any) {
      setError(e?.message || 'Generation failed')
    } finally {
      setLoading(null)
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select a company
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              {currentCompany?.websiteUrl ? (
                <div className="text-xs text-gray-600 break-all">{currentCompany.websiteUrl}</div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>New company name</Label>
              <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="e.g., PL Capital" />
            </div>

            <div className="space-y-2">
              <Label>Website URL (optional)</Label>
              <Input value={newWebsiteUrl} onChange={(e) => setNewWebsiteUrl(e.target.value)} placeholder="e.g., https://example.com" />
              <Button
                onClick={createCompany}
                disabled={loading === 'ingest' || (!newCompanyName.trim() && !newWebsiteUrl.trim())}
                className="w-full"
              >
                {loading === 'ingest' ? 'Ingesting…' : 'Ingest Company'}
              </Button>
            </div>
          </div>

          {currentCompany?.profile ? (
            <div className="rounded-lg border bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Company profile (generated)</div>
                <Button variant="outline" size="sm" onClick={() => copy(JSON.stringify(currentCompany.profile, null, 2))}>
                  Copy JSON
                </Button>
              </div>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-words max-h-56 overflow-auto">
                {JSON.stringify(currentCompany.profile, null, 2)}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          {ARTIFACTS.map((a) => (
            <TabsTrigger key={a.type} value={a.type} className="text-xs">
              {a.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {ARTIFACTS.map((a) => (
          <TabsContent key={a.type} value={a.type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{a.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Generation inputs (JSON)</Label>
                  <Textarea value={inputsJson} onChange={(e) => setInputsJson(e.target.value)} className="min-h-[160px]" />
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={generateArtifact} disabled={!selectedCompanyId || loading === `generate:${a.type}`}>
                    {loading === `generate:${a.type}` ? 'Generating…' : 'Generate / Regenerate'}
                  </Button>
                  {currentArtifact ? (
                    <div className="text-xs text-gray-600">Updated: {new Date(currentArtifact.updatedAt).toLocaleString()}</div>
                  ) : (
                    <div className="text-xs text-gray-600">No output yet</div>
                  )}
                </div>

                {currentArtifact ? (
                  <div className="rounded-lg border bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Output</div>
                      <Button variant="outline" size="sm" onClick={() => copy(JSON.stringify(currentArtifact.data, null, 2))}>
                        Copy JSON
                      </Button>
                    </div>
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-words max-h-[420px] overflow-auto">
                      {JSON.stringify(currentArtifact.data, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

