-- Students table
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  current_level integer default 1 not null,
  current_sublevel integer default 1 not null,
  total_points integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Streaks table
create table if not exists streaks (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null unique,
  current_streak integer default 0 not null,
  last_activity_date date,
  created_at timestamptz default now() not null
);

-- Problems table is created elsewhere (manual via SQL editor). Recent column:
-- alter table problems add column if not exists problem_type text;
--   nullable; stores generator type (e.g. factor_pairs, fraction_addition).
--   Old rows remain NULL and feed the level/topic fallback in Mistake Journal.

-- Practice History v1 — targeted practice runs (parent visibility only).
-- Fully separate from sessions/problems. Does NOT feed mastery/streaks/points.
create table if not exists practice_sessions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  level_id        int  not null references levels(id),
  problem_type    text,
  total_problems  int  not null check (total_problems > 0),
  correct_count   int  not null check (correct_count >= 0 and correct_count <= total_problems),
  accuracy        int  not null check (accuracy between 0 and 100),
  completed_at    timestamptz not null default now()
);

create index if not exists idx_practice_sessions_student_completed
  on practice_sessions (student_id, completed_at desc);

-- RLS
alter table students enable row level security;
alter table streaks enable row level security;
alter table practice_sessions enable row level security;

create policy "Users can manage their own students" on students
  for all using (auth.uid() = parent_id) with check (auth.uid() = parent_id);

create policy "Users can manage streaks for their students" on streaks
  for all using (
    exists (
      select 1 from students
      where students.id = streaks.student_id
        and students.parent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from students
      where students.id = streaks.student_id
        and students.parent_id = auth.uid()
    )
  );

create policy "Users can manage practice for their students" on practice_sessions
  for all using (
    exists (
      select 1 from students
      where students.id = practice_sessions.student_id
        and students.parent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from students
      where students.id = practice_sessions.student_id
        and students.parent_id = auth.uid()
    )
  );

-- Daily Reminder Email v1 (Milestone 60) — applied via Supabase SQL Editor.
-- Adds opt-in/out + same-day dedup columns on `profiles`. Existing rows were
-- backfilled to `reminders_enabled = false` immediately after the column add.
alter table profiles
  add column if not exists reminders_enabled boolean not null default true,
  add column if not exists last_reminder_sent_date date;

create index if not exists idx_profiles_reminders_pending
  on profiles (reminders_enabled, last_reminder_sent_date)
  where reminders_enabled = true;

-- Weekly Review Email v1 (Milestone 62) — applied via Supabase SQL Editor.
-- Adds weekly opt-in/out (default ON, mandatory) + same-day dedup column on
-- `profiles`. Existing rows inherit `weekly_enabled = true` automatically via
-- the column default (NOT NULL DEFAULT TRUE) — no separate UPDATE needed.
alter table profiles
  add column if not exists weekly_enabled boolean not null default true,
  add column if not exists last_weekly_sent_date date;

create index if not exists idx_profiles_weekly_pending
  on profiles (weekly_enabled, last_weekly_sent_date)
  where weekly_enabled = true;
