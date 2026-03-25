import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/contexts/AuthContext'
import { BRAND } from '@/lib/brand'
import { PartyPopper } from 'lucide-react'

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3008'

interface InvitePreview {
  valid: boolean
  email: string
  workspace_id: string
  workspace_name: string
}

interface InviteAcceptProps {
  token: string
  onDone: () => void
}

export function InviteAccept({ token, onDone }: InviteAcceptProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/invite/preview?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setPreviewError(d.error)
        else setPreview(d)
      })
      .catch(() => setPreviewError('Could not load invite details.'))
  }, [token])

  const accept = async () => {
    if (!user?.id) return
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Accept failed')
      setAccepted(true)
      setTimeout(onDone, 1800)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAccepting(false)
    }
  }

  // Auto-accept if user email matches invite email
  useEffect(() => {
    if (!preview || !user || accepted || accepting) return
    if (user.email?.toLowerCase() === preview.email.toLowerCase()) {
      accept()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, user])

  const isLoading = authLoading || (!preview && !previewError)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,rgba(255,251,245,0.98),rgba(255,255,255,0.94))] p-4 dark:bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(10,10,10,0.96))]">
      <Card className="w-full max-w-md rounded-2xl border-border/70 shadow-xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-orange-500">{BRAND.name}</span>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <LoadingSpinner size="md" />
              <p className="text-sm text-muted-foreground">Loading invite…</p>
            </div>
          )}

          {previewError && (
            <div className="text-center space-y-2 py-4">
              <p className="text-sm font-medium text-destructive">
                {previewError === 'invite already accepted'
                  ? 'This invite has already been used.'
                  : previewError === 'invite expired'
                  ? 'This invite link has expired (links are valid for 7 days).'
                  : 'This invite link is invalid or has expired.'}
              </p>
              <Button variant="outline" size="sm" onClick={onDone}>Go to app</Button>
            </div>
          )}

          {preview && !accepted && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold text-foreground">You've been invited</h1>
                <p className="text-sm text-muted-foreground">
                  Join <span className="font-medium text-foreground">{preview.workspace_name}</span> on Marqq
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Invite for </span>
                <span className="font-medium text-foreground">{preview.email}</span>
              </div>

              {!user && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in or create an account to accept this invite.
                  </p>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      // Store token so it's picked up after login/signup
                      sessionStorage.setItem('marqq_pending_invite', token)
                      onDone()
                    }}
                  >
                    Sign in to accept
                  </Button>
                </div>
              )}

              {user && user.email?.toLowerCase() !== preview.email.toLowerCase() && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                    You're logged in as <strong>{user.email}</strong> but this invite is for <strong>{preview.email}</strong>.
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={accept}
                    disabled={accepting}
                  >
                    {accepting ? 'Accepting…' : 'Accept anyway'}
                  </Button>
                </div>
              )}

              {user && user.email?.toLowerCase() === preview.email.toLowerCase() && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <LoadingSpinner size="sm" />
                  <p className="text-sm text-muted-foreground">Accepting invite…</p>
                </div>
              )}

              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>
          )}

          {accepted && (
            <div className="text-center space-y-3 py-4">
              <div className="flex justify-center"><PartyPopper className="h-8 w-8 text-orange-500" /></div>
              <p className="font-medium text-foreground">You've joined {preview?.workspace_name}!</p>
              <p className="text-sm text-muted-foreground">Taking you to the workspace…</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
