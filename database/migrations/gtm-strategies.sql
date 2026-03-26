-- GTM Strategies: persisted Go-To-Market strategy builder data per user
-- Used by app/src/lib/persistence.ts (saveGtmStrategy, loadActiveGtmStrategy, etc.)

create table if not exists public.gtm_strategies (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users (id) on delete cascade,
  title              text        not null default '',
  executive_summary  text        not null default '',
  assumptions        jsonb       not null default '[]'::jsonb,
  sections           jsonb       not null default '[]'::jsonb,
  next_steps         jsonb       not null default '[]'::jsonb,
  interview_answers  jsonb,
  name               text        not null default 'Untitled Strategy',
  is_active          boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Active strategy lookup: loadActiveGtmStrategy
create index if not exists gtm_strategies_user_active_created
  on public.gtm_strategies (user_id, is_active, created_at desc);

-- List / history: loadAllGtmStrategies
create index if not exists gtm_strategies_user_created
  on public.gtm_strategies (user_id, created_at desc);

create or replace function public.gtm_strategies_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gtm_strategies_updated_at on public.gtm_strategies;
create trigger gtm_strategies_updated_at
  before update on public.gtm_strategies
  for each row
  execute function public.gtm_strategies_set_updated_at();

alter table public.gtm_strategies enable row level security;

create policy "users manage own gtm_strategies"
  on public.gtm_strategies
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
