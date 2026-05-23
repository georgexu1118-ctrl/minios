-- minios AI: Supabase schema
-- Run once in the Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists sessions (
    id          uuid primary key default uuid_generate_v4(),
    title       text,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);

create table if not exists messages (
    id          uuid primary key default uuid_generate_v4(),
    session_id  uuid references sessions(id) on delete cascade,
    role        text not null check (role in ('user','assistant','tool')),
    content     text not null,
    tool_name   text,
    created_at  timestamptz default now()
);

create index if not exists messages_session_idx on messages(session_id, created_at);

-- Enable Row Level Security (open for now — add auth later)
alter table sessions enable row level security;
alter table messages enable row level security;

create policy "anon read sessions"  on sessions for select using (true);
create policy "anon insert sessions" on sessions for insert with check (true);
create policy "anon read messages"  on messages for select using (true);
create policy "anon insert messages" on messages for insert with check (true);
