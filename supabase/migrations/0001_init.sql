-- Blockwise initial schema.
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone     text not null default 'UTC',
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories: reusable, color-coded things a user works on
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  description text check (char_length(description) <= 200),
  color       text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index categories_user_idx on public.categories (user_id) where not archived;

-- ---------------------------------------------------------------------------
-- time_entries: one tracked session. ended_at is null while the timer runs.
-- ---------------------------------------------------------------------------
create table public.time_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id     uuid not null references public.categories (id) on delete restrict,
  started_at      timestamptz not null,
  ended_at        timestamptz,
  mode            text not null default 'stopwatch' check (mode in ('stopwatch', 'countdown')),
  planned_minutes integer check (planned_minutes > 0),
  note            text check (char_length(note) <= 500),
  created_at      timestamptz not null default now(),

  constraint ended_after_started check (ended_at is null or ended_at > started_at),
  constraint countdown_has_length check (mode = 'stopwatch' or planned_minutes is not null),

  -- PRD: overlapping entries are blocked (a running entry extends to "now and beyond").
  constraint no_overlapping_entries exclude using gist (
    user_id with =,
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz)) with &&
  )
);

-- PRD: only one session runs at a time.
create unique index one_running_entry_per_user
  on public.time_entries (user_id) where ended_at is null;

create index time_entries_user_start_idx on public.time_entries (user_id, started_at);

-- ---------------------------------------------------------------------------
-- Row-level security: every user sees and changes only their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.time_entries enable row level security;

create policy "Own profile: read"   on public.profiles for select using ((select auth.uid()) = id);
create policy "Own profile: update" on public.profiles for update using ((select auth.uid()) = id);

create policy "Own categories" on public.categories for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Own time entries" on public.time_entries for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    )
  );
