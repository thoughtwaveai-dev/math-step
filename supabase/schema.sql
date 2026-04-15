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

-- RLS
alter table students enable row level security;
alter table streaks enable row level security;

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
