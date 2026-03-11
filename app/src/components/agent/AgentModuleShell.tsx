import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Play, RotateCcw } from 'lucide-react'
import { useAgentRun } from '@/hooks/useAgentRun'
import { AgentRunPanel } from './AgentRunPanel'
import { CompanySelector } from './CompanySelector'
import { OfferSelector, type Offer } from './OfferSelector'

export interface AgentConfig {
  name: string        // agent key e.g. "isha"
  label: string       // display name e.g. "Isha — Market Intelligence"
  taskType: string
  defaultQuery: string
  badge?: string      // optional badge color class
}

interface AgentModuleShellProps {
  title: string
  description: string
  agents: AgentConfig[]                                       // 1 or 2 agents
  renderArtifact?: (agent: string, artifact: Record<string, unknown>) => React.ReactNode
  children?: React.ReactNode                                  // optional extra UI below
}

function SingleAgentCard({
  cfg,
  companyId,
  selectedOffer,
  renderArtifact,
}: {
  cfg: AgentConfig
  companyId: string
  selectedOffer: Offer | null
  renderArtifact?: (agent: string, artifact: Record<string, unknown>) => React.ReactNode
}) {
  const [query, setQuery] = useState(cfg.defaultQuery)
  const agentRun = useAgentRun()
  const isIdle = !agentRun.streaming && !agentRun.text && !agentRun.artifact && !agentRun.error

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{cfg.name}</Badge>
            {cfg.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isIdle && (
            <Textarea
              className="text-sm min-h-[80px] resize-none"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={agentRun.streaming || !query.trim()}
              onClick={() => agentRun.run(cfg.name, query, cfg.taskType, companyId || undefined, selectedOffer)}
              className="gap-1"
            >
              <Play className="h-3 w-3" />
              {agentRun.streaming ? 'Running…' : 'Run'}
            </Button>
            {!isIdle && (
              <Button size="sm" variant="ghost" onClick={agentRun.reset} className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AgentRunPanel
        agentName={cfg.name}
        label={cfg.label}
        {...agentRun}
        renderArtifact={
          renderArtifact ? (a) => renderArtifact(cfg.name, a) : undefined
        }
      />
    </div>
  )
}

export function AgentModuleShell({
  title,
  description,
  agents,
  renderArtifact,
  children,
}: AgentModuleShellProps) {
  const [companyId, setCompanyId] = useState('')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <CompanySelector
          value={companyId}
          onChange={id => { setCompanyId(id); setSelectedOffer(null) }}
        />
        <OfferSelector
          companyId={companyId}
          value={selectedOffer?.name ?? ''}
          onChange={(_name, offer) => setSelectedOffer(offer)}
        />
      </div>

      <div className={agents.length > 1 ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
        {agents.map(cfg => (
          <SingleAgentCard
            key={cfg.name}
            cfg={cfg}
            companyId={companyId}
            selectedOffer={selectedOffer}
            renderArtifact={renderArtifact}
          />
        ))}
      </div>

      {children}
    </div>
  )
}
