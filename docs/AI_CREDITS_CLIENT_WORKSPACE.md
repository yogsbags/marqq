# AI Credits: Client vs Workspace

## Model

- **Client** (your customer / billing account) = **one** entity that can create **many workspaces**.
- **Workspace** = project/team inside a client (e.g. "Acme Corp – Brand A", "Acme Corp – Brand B").

Credits and rate limits should be enforced at the **client** level so:
- One client can’t get more quota by creating extra workspaces.
- You sell "X credits per client"; all workspaces under that client share that pool (or you define sub-rules).

---

## 1. Add a client/organization layer

Introduce a table that represents the paying client (tenant):

```sql
-- organizations = your "clients" (billing accounts)
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link workspaces to the client
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_workspaces_organization ON workspaces(organization_id);
```

- Every workspace belongs to one `organization_id`.
- Backfill: create one organization per existing workspace (or one "default" org and assign all), then set `workspace.organization_id`.
- When a user creates a workspace, assign it to their organization (from session / membership).

---

## 2. Put credits and limits on the client (organization)

Store balance and optional caps at **organization** level:

```sql
CREATE TABLE IF NOT EXISTS organization_ai_credits (
  organization_id   UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance_cents      BIGINT NOT NULL DEFAULT 0,   -- or balance in "credits" / tokens
  monthly_cap_cents  BIGINT,                       -- optional cap per month
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_ai_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id), -- optional: which workspace used it
  model           TEXT,
  input_tokens    INT NOT NULL DEFAULT 0,
  output_tokens   INT NOT NULL DEFAULT 0,
  cost_cents      BIGINT NOT NULL DEFAULT 0,      -- or credits consumed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_usage_org ON organization_ai_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_usage_created ON organization_ai_usage(organization_id, created_at);
```

- **Check:** Before any AI call, resolve `workspace_id` → `organization_id`, then check `organization_ai_credits.balance_cents` (and optional `monthly_cap_cents`).
- **Deduct:** After the call, insert into `organization_ai_usage` and decrement `organization_ai_credits.balance_cents` (or run a nightly job that sums `organization_ai_usage` and updates balance).

---

## 3. Resolve client from request

In your backend:

1. Request has `workspace_id` (from deployment / session).
2. Load `workspace.organization_id` (or infer org from `workspace_members` → workspace → organization).
3. Enforce credits and rate limits by `organization_id`.
4. Optionally record `workspace_id` in `organization_ai_usage` for per-workspace reporting (usage still deducts from the client pool).

So: **one client, many workspaces, one credit pool per client.** If you later want per-workspace caps (e.g. "max 20% of client credits per workspace"), you can add that as a separate rule on top of this.
