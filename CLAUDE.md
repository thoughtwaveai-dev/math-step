@AGENTS.md

# MathStep — Claude Code Instructions

## Project

MathStep is a math learning app for kids. Parents create accounts, add a student, and the student works through a structured math curriculum with streak and points tracking.

Always work from `C:/Projects/mathstep` only. Do not modify other projects or global files unless explicitly asked.

## Start of every session

Before doing any work, read:
1. `PROJECT_CONTEXT.md` — architecture, DB schema, flows, decisions
2. `BUILD_PROGRESS.md` — what's done, what's next, fixes made

Do not rely on memory from prior sessions. Read these files first.

## Patterns and conventions

- Follow existing patterns before introducing new ones
- Server actions live in `src/app/actions/` and return `{ error: string } | null`
- Protected pages are server components that call `supabase.auth.getUser()` and `redirect()` on failure
- Client forms use `useActionState` for inline error display
- Supabase client: `createClient()` from `@/lib/supabase/server` (server), `@/lib/supabase/client` (client)
- `cookies()` is async — always `await cookies()`
- `server.ts` setAll is wrapped in try/catch — do not remove it
- Use `.maybeSingle()` for optional single-row queries

## Database

- Use the existing Supabase schema — do not recreate or alter tables unless explicitly asked
- Known tables: `students`, `streaks`, `levels` (see `PROJECT_CONTEXT.md` for full schemas)
- `total_points` lives in `streaks`, not `students`
- RLS is enabled on `students` and `streaks`; `levels` is publicly readable
- DDL requires the Supabase SQL editor — there is no CLI or service role key available

## UI

- Keep UI simple, clean, and mobile-first
- Tailwind CSS v4 only — no third-party UI component libraries
- Prefer server-rendered pages (App Router); use client components only when needed for interactivity

## Math generation

- Use pure algorithmic generation for math problems — no LLM or external API calls
- Problems are generated based on `levels` table metadata (topic, difficulty implied by level/sublevel)

## Testing

- After any meaningful change to auth, routing, or data flows, test with Playwright
- Run the dev server on localhost before testing (`npm run dev`)
- Fix failures before moving on — do not mark work complete with known broken flows

## Scope discipline

- Keep changes minimal and focused on the task at hand
- Do not refactor, add comments, or improve unrelated code while working on a feature
- Do not add speculative features or future-proofing beyond what is asked

## After major milestones

Update `BUILD_PROGRESS.md` with:
- what was completed
- Playwright test results
- any important fixes made

## Test account and test data cleanup rule

For any project where testing, validation, Playwright, E2E, seed scripts, or manual QA creates temporary users, students, records, files, screenshots, sessions, problems, progress rows, streaks, practice rows, or database rows:

- Use clearly identifiable temporary names/emails.
  - Example: feature-name-test-YYYYMMDD@example.com
  - Example student names: UITestKid, TempTestStudent, FeatureTestKid
- Never use or modify real user accounts for automated testing unless explicitly approved.
- Never ask for real user credentials in chat.
- Prefer creating a temporary test account over sharing credentials.
- After validation is complete, proactively clean up the temporary test account and all related test data.
- Delete children/dependent rows first if needed, or use the correct auth/user delete flow if FK cascade is confirmed.
- Verify cleanup by re-querying:
  - auth user no longer exists
  - profile no longer exists
  - test student no longer exists
  - related sessions/problems/progress/streak/practice rows are gone
  - no orphaned rows remain
- Report cleanup details in the final report:
  - temp email used
  - temp student name/id
  - rows/data deleted
  - verification result
- If cleanup cannot be performed safely, stop and ask before proceeding.
- Do not delete anything unless it exactly matches the temporary account/student/data created for the test.
- Do not leave test screenshots, Playwright artifacts, temp scripts, or root-level files staged unless explicitly requested.
- Before every commit, run git status --short and confirm no test artifacts are staged.

Final reports must explicitly include one of:
- Temp test data: none created
- Temp test data: created and cleaned up
- Temp test data: cleanup pending, with exact details and reason
