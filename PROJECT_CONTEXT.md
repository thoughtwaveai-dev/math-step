# MathStep — Project Context

> Stable reference for future Claude Code sessions. Do not add speculative features here — only reflect what is actually built.

---

## Project Goal

MathStep is a math learning app for children. Parents create an account, add a student (their child), and the student works through a structured curriculum of math levels. The app tracks progress, streaks, and points.

---

## Target Users

- **Parent** — creates account, sets up student, monitors progress
- **Student (child)** — works through math practice sessions tracked by the parent's account

One account = one parent. Multiple students per parent are supported.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.3 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Auth + DB | Supabase (hosted Postgres + Supabase Auth) |
| Supabase client | @supabase/ssr + @supabase/supabase-js |
| Runtime | React 19 |
| Dev server | Next.js Turbopack |

No third-party UI component libraries. All UI is plain Tailwind.

---

## App Architecture

```
src/
  app/
    page.tsx               # Home — shows MathStep name + Login/Sign Up links
    layout.tsx             # Root layout (Geist font, global CSS)
    login/page.tsx         # Login form (client component, useActionState)
    signup/page.tsx        # Signup form (client component, useActionState)
    onboarding/
      page.tsx             # Protected server page — auth guard + renders form
      OnboardingForm.tsx   # Client component — student name form with useActionState
    dashboard/
      page.tsx             # Protected server page — student info + current level
    actions/
      auth.ts              # signIn, signOut, signUp server actions
      students.ts          # createStudent server action
      feedback.ts          # submitFeedback server action
    feedback/
      page.tsx             # Protected server page — form + recent submissions list
      FeedbackForm.tsx     # Client component — category/student/message form with useActionState
  lib/
    supabase/
      client.ts            # createBrowserClient (for client components)
      server.ts            # createServerClient using async cookies()
      middleware.ts        # updateSession — refreshes auth session in middleware
  middleware.ts            # Runs updateSession on all non-static routes
```

### Key conventions

- **Server components** do auth checks with `supabase.auth.getUser()` and `redirect()` — never trust client-side auth state for protection.
- **Client components** use `useActionState` for form error display.
- **Server actions** (`'use server'`) handle all mutations. They return `{ error: string } | null` on failure and call `redirect()` on success.
- `cookies()` is async in Next.js 16 — always `await cookies()`.
- `server.ts` wraps `setAll` in try/catch — Server Components can't set cookies; middleware handles session refresh instead.
- `maybeSingle()` used for optional single-row queries (e.g. levels lookup) to avoid throwing on no result.

---

## Database Tables

All tables are in the `public` schema on Supabase.

### `students`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, gen_random_uuid() |
| parent_id | uuid | FK → auth.users(id), cascade delete |
| name | text | student's name |
| current_level | int | starts at 1 |
| current_sublevel | int | starts at 1 |
| created_at | timestamptz | auto |

RLS: users can only access rows where `parent_id = auth.uid()`.

### `streaks`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK → students(id), cascade delete, unique |
| current_streak | int | default 0 |
| longest_streak | int | default 0 |
| total_sessions | int | default 0 |
| total_points | int | default 0 |
| last_session_date | date | nullable |

RLS: users can only access streak rows for their own students.

### `feedback`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, gen_random_uuid() |
| parent_id | uuid | FK → auth.users(id), cascade delete |
| student_id | uuid | nullable FK → students(id), on delete set null |
| category | text | one of: bug, idea, confusion, praise |
| message | text | max 2000 chars enforced in action |
| created_at | timestamptz | auto |

RLS: parents can only insert/select rows where `parent_id = auth.uid()`.

### `levels`
| Column | Type | Notes |
|--------|------|-------|
| id | int | PK |
| level_number | int | |
| sublevel_number | int | |
| topic | text | e.g. "Addition" |
| description | text | e.g. "Single-digit addition" |
| speed_target_seconds | int | total session time target |
| accuracy_threshold | int | percentage, e.g. 90 |
| problems_per_session | int | e.g. 20 |
| consecutive_passes_required | int | e.g. 3 |

No RLS — publicly readable. Seeded with curriculum data.

---

## Auth Flow

1. User signs up at `/signup` (name, email, password) → Supabase creates auth user → redirect `/play`
2. `/play` checks for students → if none → redirect `/onboarding`
3. User logs in at `/login` (email, password) → redirect `/play`
4. Onboarding creates student → redirect `/play`
5. Logout via server action `signOut` → redirect `/login`
6. Unauthenticated requests to protected pages → redirect `/login`
7. Session refresh handled by `middleware.ts` on every non-static request
8. `/dashboard` remains accessible; reach it from `/play` via "Parent view" link

---

## Onboarding Flow

1. Triggered automatically when authenticated user has no students
2. `/onboarding` — single field: student name
3. `createStudent` server action:
   - inserts student row (`parent_id = user.id`, `current_level = 1`, `current_sublevel = 1`)
   - inserts streak row for that student
   - redirects to `/dashboard`

---

## Dashboard Flow

1. Auth guard: redirects to `/login` if no session
2. Queries `students` (with `streaks` join) for `parent_id = user.id`
3. If no students: redirect to `/onboarding`
4. Queries `levels` where `level_number = student.current_level` AND `sublevel_number = student.current_sublevel` (`.maybeSingle()`)
5. Renders:
   - Student card: name, current level, sublevel, streak, total points
   - Current Focus card: topic, description, speed target, accuracy %, problems/session, consecutive passes required
   - Fallback message if no matching level row found

---

## Curriculum / Levels

- Levels are pre-seeded in the `levels` table (not managed by the app yet)
- Each level identified by `(level_number, sublevel_number)` pair
- Sample data confirmed: Level 1/1 = Addition / Single-digit / 8min target / 90% accuracy / 20 problems / 3 passes
- Speed displayed as formatted string: `8m`, `30s`, `8m 30s`
- Progression logic (advancing levels) is not yet built

---

## Known Implementation Decisions

- **Multi-student support** — parents can add multiple students. Student selection uses `?student=<uuid>` URL param on all pages (`/dashboard`, `/play`, `/worksheet`, `/worksheet/results/[sessionId]`). Falls back to first student by `created_at asc` when param is absent or invalid.
- **Email confirmation** — Supabase may require email confirmation depending on project settings. If enabled, users redirected to `/dashboard` but won't have a session until confirmed.
- **No Supabase CLI** — migrations are manual via Supabase SQL editor. Schema SQL lives in `supabase/schema.sql`.
- **No service role key in `.env.local`** — only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used. DDL requires Supabase dashboard.
- **`total_points` lives in `streaks`**, not `students`. The original schema assumption was wrong; corrected after introspection.
- **Tailwind v4** — uses `@tailwindcss/postcss`, not the older `tailwind.config.js` approach.

---

## Environment

- OS: Windows 11
- Shell: bash (via Claude Code terminal)
- Node: via npm
- Dev server: `npm run dev` (Turbopack), typically port 3000 (may shift to 3007+ if port taken)
- Env file: `.env.local` (not committed)

---

## Deployment

Not yet deployed. No CI/CD configured.

---

## Curriculum Generators

Generators live in `src/lib/math/generators/`. The router is `generateProblems(level, sublevel, count)` in `index.ts`.

| Level | Generator | Answer format | Grading path |
|-------|-----------|---------------|--------------|
| 1/1–3/2 | addition, subtraction, multiplication | single integer | exact integer match |
| 9/1 | factorization (prime, list factors, GCF, LCM) | integer or sorted multi-token | integer or number-sort |
| 9/2 | factor pairs, common factors, GCF | list or single integer | number-sort or integer |
| 10/1 | linear equations (one variable, 5 subtypes) | single integer | exact integer match |
| 10/2 | linear equations (variables on both sides) | single integer | exact integer match |
| 11/1 | one-variable inequalities (4 types) | `x > 4`, `x < 7`, `x <= 5`, `x >= 12` | inequality normalization |
| others | not implemented | — | returns [] → "Coming Soon" |

### Grading (`src/app/actions/worksheet.ts`)

`gradeAnswer(studentAnswer, correctAnswer)` has three paths:
1. **Inequality**: correctAnswer contains `<` or `>` → normalize (lowercase, strip spaces, `≤`→`<=`, `≥`→`>=`) and compare strings
2. **Single number**: correctAnswer has exactly one number → exact integer match
3. **Multi-token**: correctAnswer has multiple numbers → extract numbers, sort, compare

### Lesson cards

`src/lib/lessons/index.ts` — static content keyed by `"level/sublevel"`. Supported: 1/1, 1/2, 2/1, 2/2, 3/1, 3/2, 9/1, 9/2, 10/1, 10/2, 11/1.

---

## Next Planned Milestone

- Deploy to Vercel (or similar) to test real mobile install flow
- Add generators for remaining curriculum levels (4/1 through 8/2) as needed

## Student Selection Model

Pages that are student-aware accept `searchParams: Promise<{ student?: string }>`. The selection pattern:
```ts
const { data: students } = await supabase.from('students').select('*')
  .eq('parent_id', user.id).order('created_at', { ascending: true })
const student = (selectedId ? students.find(s => s.id === selectedId) : null) ?? students[0]
```
RLS on `students` ensures only the parent's students are returned — no additional ownership check needed for the param fallback. The results page does verify ownership explicitly since it fetches a session by ID (no parent filter on that query).
