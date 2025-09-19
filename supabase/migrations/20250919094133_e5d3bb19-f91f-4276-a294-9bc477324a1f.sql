-- Chat sessions and messages with RLS
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  title text,                    -- optional: first user message snippet
  meta jsonb default '{}'::jsonb -- e.g., strategy/mode
);

create table if not exists public.chat_messages (
  id bigserial primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  tool_name text,                -- if role=tool
  extra jsonb                    -- e.g., tool_calls, scoring, etc.
);

-- Indexes for faster history browsing
create index if not exists idx_chat_messages_session_created
  on public.chat_messages (session_id, created_at);
create index if not exists idx_chat_sessions_created
  on public.chat_sessions (created_at desc);

-- RLS (simple: allow read/write to all app code; tighten later if multi-tenant)
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='chat_sessions' and policyname='chat_sessions_rw'
  ) then
    create policy chat_sessions_rw on public.chat_sessions
      for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='chat_messages' and policyname='chat_messages_rw'
  ) then
    create policy chat_messages_rw on public.chat_messages
      for all using (true) with check (true);
  end if;
end $$;