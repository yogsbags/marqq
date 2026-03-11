export type Company = {
  id: string
  companyName: string
  websiteUrl: string | null
  createdAt: string
  updatedAt: string
  profile?: unknown
}

export type ArtifactRecord = {
  type: string
  updatedAt: string
  data: unknown
}

function getWorkspaceHeader(): Record<string, string> {
  try {
    // WorkspaceContext stores activeWorkspace in localStorage via WorkspaceContext.
    // We read it directly here to avoid prop-drilling through every caller.
    const raw = localStorage.getItem('marqq_active_workspace');
    if (raw) {
      const ws = JSON.parse(raw);
      if (ws?.id) return { 'x-workspace-id': ws.id };
    }
  } catch { /* ignore */ }
  return {};
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...getWorkspaceHeader(),
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

