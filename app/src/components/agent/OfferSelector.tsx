import { useEffect, useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Pencil, Check, X, Sparkles } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ALL_PRODUCTS_VALUE = '__all_products__'

export interface Offer {
  name: string
  price_signal?: string
  tier?: string
}

interface OfferSelectorProps {
  companyId: string
  value: string        // offer name ('' = all products)
  onChange: (name: string, offer: Offer | null) => void
}

export function OfferSelector({ companyId, value, onChange }: OfferSelectorProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!companyId) { setOffers([]); return }

    Promise.all([
      fetch(`/api/mkg/${companyId}`).then(r => r.json()).catch(() => null),
      fetch(`/api/company-intel/companies`).then(r => r.json()).catch(() => null),
    ]).then(([mkgData, companiesData]) => {
      const mkgOffers: Offer[] | null = Array.isArray(mkgData?.mkg?.offers?.value)
        ? mkgData.mkg.offers.value
        : null

      if (mkgOffers && mkgOffers.length > 0) {
        setOffers(mkgOffers)
        return
      }

      const company = (companiesData?.companies ?? []).find(
        (c: { id: string }) => c.id === companyId
      )
      const profileOfferings: string[] = Array.isArray(company?.profile?.offerings)
        ? company.profile.offerings
        : []

      setOffers(profileOfferings.map((name: string) => ({ name })))
    })
  }, [companyId])

  useEffect(() => {
    if (editing) {
      setDraft(value)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing, value])

  if (!companyId) return null

  const confirmEdit = () => {
    const name = draft.trim()
    if (name) {
      // Add to local list if not already present
      if (!offers.find(o => o.name === name)) {
        setOffers(prev => [...prev, { name }])
      }
      onChange(name, { name })
    }
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft('')
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        {/* Fix 13: descriptive label explaining what this filter does */}
        <Label className="text-xs text-muted-foreground">Focus on product / service</Label>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            title="Enter a custom product or service"
          >
            <Pencil className="h-3 w-3" />
            {offers.length === 0 ? 'Add manually' : 'Edit'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm border rounded-md px-3 py-1.5 bg-background text-foreground border-border dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:[color-scheme:dark] outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g. Wealth Management, PL Pro App…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
          />
          <button
            type="button"
            onClick={confirmEdit}
            disabled={!draft.trim()}
            className="p-1.5 rounded-md bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            title="Confirm"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        offers.length > 0 ? (
          <Select
            value={value || ALL_PRODUCTS_VALUE}
            onValueChange={(next) => {
              const name = next === ALL_PRODUCTS_VALUE ? '' : next
              const found = offers.find((offer) => offer.name === name) ?? null
              onChange(name, found)
            }}
          >
            <SelectTrigger className="h-10 bg-background text-left">
              <SelectValue placeholder="All products (no filter)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PRODUCTS_VALUE}>All products (no filter)</SelectItem>
              {offers.map((offer) => (
                <SelectItem key={offer.name} value={offer.name}>
                  {offer.name}{offer.price_signal ? ` · ${offer.price_signal}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('marqq:navigate', { detail: { moduleId: 'setup' } }))}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md border border-dashed border-orange-300 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/20 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-100/60 dark:hover:bg-orange-950/40 transition-colors text-left"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>No offers yet — <span className="underline underline-offset-2">Run Setup first</span> to populate this</span>
          </button>
        )
      )}

      {/* Show selected custom value as a chip when no dropdown options exist */}
      {!editing && offers.length === 0 && value && (
        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
          <span className="flex-1 truncate">{value}</span>
          <button
            type="button"
            onClick={() => onChange('', null)}
            className="shrink-0 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
            title="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
