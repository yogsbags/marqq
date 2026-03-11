import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'

type Company = { id: string; companyName: string; websiteUrl: string | null }

interface CompanySelectorProps {
  value: string
  onChange: (id: string) => void
}

export function CompanySelector({ value, onChange }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    fetch('/api/company-intel/companies')
      .then(r => r.json())
      .then(d => {
        const list: Company[] = d.companies || []
        setCompanies(list)
        if (!value && list[0]) onChange(list[0].id)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (companies.length === 0) return null

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Company context</Label>
      <select
        className="w-full text-sm border rounded-md px-3 py-1.5 bg-background text-foreground border-border dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:[color-scheme:dark]"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— no company context —</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>
            {c.companyName}
          </option>
        ))}
      </select>
    </div>
  )
}
