-- Blockwise: store countdown length in seconds instead of minutes, so a paused
-- countdown can resume with exactly the time it had left (e.g. 12 min 37 s).
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run.

alter table public.time_entries
  add column planned_seconds integer check (planned_seconds > 0);

update public.time_entries
  set planned_seconds = planned_minutes * 60
  where planned_minutes is not null;

alter table public.time_entries drop constraint countdown_has_length;
alter table public.time_entries drop column planned_minutes;

alter table public.time_entries
  add constraint countdown_has_length
  check (mode = 'stopwatch' or planned_seconds is not null);
