const ACTIVE_WORKSPACE_KEY = 'marqq_active_workspace'
const ACTIVE_COMPANY_KEY = 'marqq_active_company_context'

type ActiveWorkspaceContext = {
  id: string | null
  name: string | null
  website_url: string | null
}

type ActiveCompanyContext = {
  id: string | null
  companyName: string | null
  websiteUrl: string | null
}

export type AgentMarketingContext = {
  workspaceId: string | null
  workspaceName: string | null
  websiteUrl: string | null
  companyId: string | null
  companyName: string | null
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function getActiveAgentContext(): AgentMarketingContext {
  const workspace = readJson<Partial<ActiveWorkspaceContext>>(ACTIVE_WORKSPACE_KEY)
  const company = readJson<Partial<ActiveCompanyContext>>(ACTIVE_COMPANY_KEY)

  return {
    workspaceId: typeof workspace?.id === 'string' && workspace.id.trim() ? workspace.id : null,
    workspaceName: typeof workspace?.name === 'string' && workspace.name.trim() ? workspace.name : null,
    websiteUrl:
      typeof company?.websiteUrl === 'string' && company.websiteUrl.trim()
        ? company.websiteUrl
        : typeof workspace?.website_url === 'string' && workspace.website_url.trim()
          ? workspace.website_url
          : null,
    companyId: (typeof company?.id === 'string' && company.id.trim()
      ? company.id
      : typeof workspace?.id === 'string' && workspace.id.trim()
        ? workspace.id
        : null),
    companyName: (typeof company?.companyName === 'string' && company.companyName.trim()
      ? company.companyName
      : typeof workspace?.name === 'string' && workspace.name.trim()
        ? workspace.name
        : null),
  }
}

export function persistActiveCompanyContext(company: { id?: string | null; companyName?: string | null; websiteUrl?: string | null }) {
  try {
    localStorage.setItem(
      ACTIVE_COMPANY_KEY,
      JSON.stringify({
        id: company.id || null,
        companyName: company.companyName || null,
        websiteUrl: company.websiteUrl || null,
      }),
    )
  } catch {
    // ignore storage issues
  }
}

export function clearActiveCompanyContext() {
  try {
    localStorage.removeItem(ACTIVE_COMPANY_KEY)
  } catch {
    // ignore storage issues
  }
}

export function buildAgentHeaders(extraHeaders?: HeadersInit): HeadersInit {
  const context = getActiveAgentContext()
  return {
    'Content-Type': 'application/json',
    ...(context.workspaceId ? { 'x-workspace-id': context.workspaceId } : {}),
    ...(extraHeaders || {}),
  }
}

export function buildAgentRunPayload<T extends Record<string, unknown>>(payload: T): T & { company_id?: string } {
  const context = getActiveAgentContext()
  return {
    ...payload,
    company_id:
      typeof payload.company_id === 'string' && payload.company_id.trim()
        ? payload.company_id
        : context.companyId || context.workspaceId || undefined,
  }
}

export function buildAgentPlanPayload(task: string, marketingContext?: Record<string, unknown>) {
  const context = getActiveAgentContext()
  return {
    task,
    marketingContext: {
      ...context,
      ...(marketingContext || {}),
    },
  }
}
