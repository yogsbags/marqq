import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { COMPANY_INTEL_LIST_UPDATED_EVENT } from '@/lib/companyIntelEvents'
import { clearActiveCompanyContext, persistActiveCompanyContext } from '@/lib/agentContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NO_COMPANY_VALUE = '__no_company__'

type Company = { id: string; companyName: string; websiteUrl: string | null }

interface CompanySelectorProps {
  value: string
  onChange: (id: string) => void
}

export function CompanySelector({ value, onChange }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    const loadCompanies = () => {
      fetch('/api/company-intel/companies')
        .then(r => r.json())
        .then(d => {
          const list: Company[] = d.companies || []
          setCompanies(list)
          if (value && !list.some((company) => company.id === value)) {
            const nextId = list[0]?.id || ''
            onChange(nextId)
            const nextCompany = list.find((company) => company.id === nextId)
            if (nextCompany) {
              persistActiveCompanyContext({
                id: nextCompany.id,
                companyName: nextCompany.companyName,
                websiteUrl: nextCompany.websiteUrl,
              })
            } else {
              clearActiveCompanyContext()
            }
            return
          }
          if (!value && list[0]) {
            onChange(list[0].id)
            persistActiveCompanyContext({
              id: list[0].id,
              companyName: list[0].companyName,
              websiteUrl: list[0].websiteUrl,
            })
          }
        })
        .catch(() => {})
    }

    loadCompanies()
    window.addEventListener(COMPANY_INTEL_LIST_UPDATED_EVENT, loadCompanies)
    return () => window.removeEventListener(COMPANY_INTEL_LIST_UPDATED_EVENT, loadCompanies)
  }, [onChange, value])

  if (companies.length === 0) return null

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Company/Business</Label>
      <Select
        value={value || NO_COMPANY_VALUE}
        onValueChange={(next) => {
          const nextId = next === NO_COMPANY_VALUE ? '' : next
          onChange(nextId)
          const nextCompany = companies.find((company) => company.id === nextId)
          if (nextCompany) {
            persistActiveCompanyContext({
              id: nextCompany.id,
              companyName: nextCompany.companyName,
              websiteUrl: nextCompany.websiteUrl,
            })
          } else {
            clearActiveCompanyContext()
          }
        }}
      >
        <SelectTrigger className="h-10 bg-background text-left">
          <SelectValue placeholder="— no company context —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_COMPANY_VALUE}>— no company context —</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
