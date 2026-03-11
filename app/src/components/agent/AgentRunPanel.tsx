import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Bot, CheckCircle, AlertCircle } from 'lucide-react'
import type { AgentRunResult } from '@/hooks/useAgentRun'

interface AgentRunPanelProps extends AgentRunResult {
  agentName: string
  label?: string
  onReset?: () => void
  renderArtifact?: (artifact: Record<string, unknown>) => React.ReactNode
}

export function AgentRunPanel({
  agentName,
  label,
  streaming,
  text,
  artifact,
  confidence,
  error,
  onReset,
  renderArtifact,
}: AgentRunPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [text, streaming])

  if (!streaming && !text && !artifact && !error) return null

  // Strip the ---CONTRACT--- block from display text
  const displayText = text.replace(/\n?---CONTRACT---[\s\S]*$/, '').trim()

  return (
    <Card className="border-orange-200/70 dark:border-orange-900/40">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4 text-orange-500" />
          <span>{label ?? agentName}</span>
          {streaming && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          {!streaming && !error && text && <CheckCircle className="h-3 w-3 text-green-500" />}
          {error && <AlertCircle className="h-3 w-3 text-red-500" />}
        </CardTitle>
        <div className="flex items-center gap-2">
          {confidence !== null && (
            <Badge variant="outline" className="text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}
          {onReset && !streaming && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {displayText && (
          <div
            ref={scrollRef}
            className="text-sm text-muted-foreground max-h-[480px] overflow-y-auto leading-relaxed"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-0.5">{children}</h3>,
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-orange-600 dark:text-orange-400">{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-orange-400 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                hr: () => <hr className="border-border my-3" />,
              }}
            >
              {displayText}
            </ReactMarkdown>
            {streaming && (
              <span className="inline-block w-1 h-3 bg-orange-400 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
        {artifact && renderArtifact && (
          <div className="border-t pt-3 mt-3">{renderArtifact(artifact)}</div>
        )}
        {artifact && !renderArtifact && (
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64 leading-relaxed">
            {JSON.stringify(artifact, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
