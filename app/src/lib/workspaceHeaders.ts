/**
 * Headers for API routes that scope data by workspace (see backend x-workspace-id).
 * Reads active workspace from the same localStorage key WorkspaceContext uses.
 */
export function getWorkspaceHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('marqq_active_workspace');
    if (raw) {
      const ws = JSON.parse(raw) as { id?: string };
      if (ws?.id) return { 'x-workspace-id': ws.id };
    }
  } catch {
    /* ignore */
  }
  return {};
}
