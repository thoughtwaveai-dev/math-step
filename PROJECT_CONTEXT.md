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

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK → auth.users(id) |
| email | text | not null |
| name | text | nullable |
| created_at | timestamptz | default now() |
| parent_pin | text | nullable; format `saltHex:scryptHashHex` (Milestone 50) |
| pin_failed_attempts | int | default 0 (Milestone 50) |
| pin_locked_until | timestamptz | nullable; cooldown end (Milestone 50) |
| reminders_enabled | bool | default `false` (originally `true` at Milestone 60, flipped to `false` in Milestone 62 so new signups start opted out). Daily Reminder Email v1 (Milestone 60). Existing rows were one-time backfilled to `false`. |
| last_reminder_sent_date | date | nullable; NZ-local date key of last successful reminder send (Milestone 60). |
| weekly_enabled | bool | default true; Weekly Review Email v1 (Milestone 62). Mandatory by default — existing rows inherit `true` via column default at column-add time. |
| last_weekly_sent_date | date | nullable; NZ-local date key of last successful weekly review send (Milestone 62). |
| weekly_cc_email | text | nullable; optional extra recipient for weekly review email (Milestone 63). App-level validated. Daily reminders unaffected. |

RLS: insert/select/update own row (`auth.uid() = id`). No new policies were needed for the PIN or reminder columns — the daily-reminder cron handler bypasses RLS via the service role client.

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

### `problems`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| session_id | uuid | FK → sessions(id) |
| problem_text | text | display string, e.g. "6 + 3 = ?" |
| correct_answer | text | canonical answer string |
| student_answer | text | nullable, filled on submission |
| is_correct | bool | nullable, set on submission |
| self_corrected | bool | nullable, set when student corrects a wrong answer post-results |
| order_index | int | display order within session |
| problem_type | text | nullable; generator type (e.g. `factor_pairs`, `addition`). Backfilled for all pre-Milestone 54 rows on 2026-05-10 via `scripts/backfill-problem-types.ts` — all 780 rows now non-null. Any future null rows fall back to level/topic grouping in the Mistake Journal. |

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
9. **Password reset**: `/login` → "Forgot password?" → `/account/forgot-password` (server action `requestPasswordReset` → `supabase.auth.resetPasswordForEmail` with `redirectTo` set to `${NEXT_PUBLIC_APP_URL ?? 'https://mathstep.nz'}/auth/callback?next=/account/update-password`). Email link lands on `/auth/callback` (route handler exchanges `?code=` for a recovery session) → redirects to `/account/update-password` (server-side `getUser()` gate → client form → `updatePassword` server action calls `supabase.auth.updateUser({ password })`) → `/login?reset=1` with success banner. Supabase Auth → URL Configuration → Redirect URLs must include `https://mathstep.nz/auth/callback` (plus `http://localhost:3000/auth/callback` for dev). Uses Supabase's default Recovery email template — no custom token logic, no Resend wiring in app code.

---

## Onboarding Flow

1. Triggered automatically when authenticated user has no students
2. `/onboarding` — single field: student name
3. `createStudent` server action:
   - **dedup guard:** if the parent already has a student whose name matches the submitted one after `trim().toLowerCase()`, no insert happens — the action redirects straight to `/dashboard?student=<existing.id>` (or `/placement?student=<existing.id>` for `start_mode=diagnostic`). Best-effort, race-tolerant; no DB unique constraint. Intentionally blocks intentional same-name siblings in v1.
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
- **Service role key** — allowed in server-side cron/background routes only (currently used by `src/app/api/cron/daily-reminders/route.ts` and `src/app/account/reminders/unsubscribe/page.tsx` via `src/lib/supabase/serviceRole.ts`). Never in client bundles or Edge runtime. DDL still requires the Supabase SQL editor.
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
| 4/1 | division facts (divisor ∈ [1,9], quotient ∈ [1,9]) | single integer | exact integer match |
| 4/2 | long division (divisor ∈ [2,9], quotient ∈ [11,25], no remainders) | single integer | exact integer match |
| 5/1 | fractions: addition & subtraction (same-denom + simple unlike-denom pairs) | `"3/4"`, `"5/6"`, `"1"` (simplified, no mixed numbers) | fraction cross-multiply or integer match |
| 5/2 | fractions: multiplication & division (proper fractions, denominators 2–6, keep-change-flip for division) | `"1/6"`, `"4/3"`, `"2"` (simplified, whole numbers as integers) | fraction cross-multiply or integer match |
| 6/1 | decimals: addition, subtraction, multiplication by whole number (1-decimal-place operands, results ≤ 20) | `"8.1"`, `"0.6"`, `"4"` (whole-number results as integers) | decimal parseFloat with 0.001 tolerance; whole-number results via integer match |
| 6/2 | percentages: percent of number, percent↔decimal conversion, fraction→percent (common %: 10/20/25/50/75) | integer for percent_of_number/decimal_to_percent/fraction_to_percent; `"0.25"` decimal for percent_to_decimal | integer path or decimal path (existing) |
| 7/1 | negative numbers: addition, subtraction, multiplication, division with at least one negative operand | signed integer string: `"-5"`, `"24"`, `"3"` | signed integer path (`/^-?\d+$/`, added in Milestone 37) |
| 8/1 | simplifying expressions: combine like terms (2 or 3 terms), variable + constant groups | `"5x"`, `"3x + 7"`, `"8a - 1"` (canonical form, variable coeff ≥ 2) | algebraic expression path (`/[a-zA-Z]/`, normalize whitespace + lowercase, strict string match) |
| 8/2 | one-step equations (x+a=b, x-a=b, ax=b, x/a=b) | single positive integer: `"3"`, `"16"`, `"20"` | signed integer path (`/^-?\d+$/`) |
| 9/1 | factorization (prime, list factors, GCF, LCM) | integer or sorted multi-token | integer or number-sort |
| 9/2 | factor pairs, common factors, GCF | list or single integer | number-sort or integer |
| 10/1 | linear equations (one variable, 5 subtypes) | single integer | exact integer match |
| 10/2 | linear equations (variables on both sides) | single integer | exact integer match |
| 11/1 | one-variable inequalities (4 types) | `x > 4`, `x < 7`, `x <= 5`, `x >= 12` | inequality normalization |
| 11/2 | simultaneous equations (3 shapes: x+y/x-y, 2x+y/x-y, x+2y/x+y) | `x = 3, y = 7` | sim-eq pair path (regex by name, normalizes spaces/case) |
| 12/1 | functions (5 types: evaluate linear/quadratic/negative, compose simple, inverse-solve) | signed integer string: `"11"`, `"-8"`, `"3"` | signed integer path (`/^-?\d+$/`) |
| 12/2 | graphing (5 types: read point coords, slope, y-intercept, read-y-for-x, match equation to graph) | `"x = 3, y = -2"` (coords) / signed int / `"A"`–`"D"` (MC) | sim-eq pair grader / signed integer / algebraic-path letter |
| 13/1 | linear equations & graphs (5 types: equation from slope/intercept, slope from 2 points, y-intercept from slope+point, point on line yes/no, evaluate linear equation in either direction) | `"y = 2x + 3"` (equation) / signed int / `"yes"` / `"no"` | algebraic path (equation + yes/no) / signed integer. Generator avoids slope ∈ {-1, 0, 1} and intercept 0 for all types that *display* a `y = mx + b` string, eliminating the only formatting ambiguities so `gradeAnswer` is untouched. **Mobile input UX (2026-06-07):** on `/worksheet`, `equation_from_slope_intercept` renders a structured `y = [±][m]x [±][b]` control (`src/app/worksheet/EquationAnswerInput.tsx` — sign toggles + numeric magnitude fields, single hidden `answer_${id}` carrying the canonical string) and `point_on_line` renders Yes/No radio buttons (reusing the 12.2 MC `peer-checked` pattern). Hidden canonical = the same string the grader already expects, so `submitWorksheet`/`gradeAnswer`/results page are unchanged. Targeted practice + self-correction box for 13.1 stay plain text. |
| others | not implemented | — | returns [] → "Coming Soon" |

### Generator architecture (Milestone 26)

All generators use **bounded algorithmic random generation** — no more fixed 10-item cycling pools.

- Each generator accepts an optional `rand: () => number` parameter (default: `Math.random`). Pass `seededRand(seed)` from `rand.ts` in tests for deterministic output.
- Arithmetic generators (addition, subtraction, multiplication, equations, inequalities): pick operands algorithmically within bounded ranges, dedup on prompt string with a retry budget (max `count × 50` attempts).
- Factorization generators (9/1, 9/2): shuffle large static pools (25-30 entries) using `shuffled()` and slice to the needed count. Guarantees no repeats within a session.
- Answer formats are identical to previous generators — no grading changes needed.

### Grading (`src/app/actions/worksheet.ts`)

`gradeAnswer(studentAnswer, correctAnswer)` has these paths (in order):
1. **Simultaneous equation pair**: correctAnswer contains both `x=` and `y=` patterns → parse x and y values by regex name match (order-independent), normalize spaces/case, compare integer values
2. **Inequality**: correctAnswer contains `<` or `>` → normalize (lowercase, strip spaces, `≤`→`<=`, `≥`→`>=`) and compare strings
3. **Algebraic expression**: correctAnswer contains a letter (`/[a-zA-Z]/`) → normalize (lowercase, strip all whitespace) and compare strings. Handles `"5x"`, `"3x + 7"`, `"8a - 1"`. No term reordering.
4. **Fraction**: correctAnswer matches `^\d+/\d+$` → cross-multiply equality check
5. **Decimal**: correctAnswer matches `^\d+\.\d+$` → parseFloat with 0.001 tolerance
6. **Signed integer**: correctAnswer matches `^-?\d+$` → parseInt exact match
7. **Multi-token**: correctAnswer has multiple numbers → extract numbers, sort, compare

### Lesson cards

`src/lib/lessons/index.ts` — static content keyed by `"level/sublevel"`. All 25 currently supported levels have lesson cards: 1/1, 1/2, 2/1, 2/2, 3/1, 3/2, 4/1, 4/2, 5/1, 5/2, 6/1, 6/2, 7/1, 7/2, 8/1, 8/2, 9/1, 9/2, 10/1, 10/2, 11/1, 11/2, 12/1, 12/2, 13/1.

### Level 12.2 Graphing — SVG rendering pattern

Level 12.2 is the first MathStep curriculum level with visual content (inline coordinate-plane SVGs) and the first with multiple-choice answers. The implementation adds these without touching the schema, the worksheet action, or the grading utility.

- **Graph data persistence (no DB change):** the generator (`src/lib/math/generators/graphing.ts`) encodes a `GraphSpec` JSON payload into a suffix marker inside `problem_text`: `[GRAPH]{…}[/GRAPH]` for a single graph above the prompt, or `[CHOICES][{…},{…},{…},{…}][/CHOICES]` for the 4 MC mini graphs. `src/lib/math/graphPrompt.ts → parseGraphPrompt(text)` returns `{ displayText, graph?, choices? }`; it's defensive about malformed payloads (falls back to plain text). Both `WorksheetForm` and the results page call it so the JSON marker never reaches the rendered DOM.
- **SVG component (`src/components/CoordinatePlane.tsx`):** dependency-free server React component. Two size variants: `full` (320 px, with tick labels) used above the prompt, `mini` (140 px, no labels) used in 4-up MC grids. Renders axes, gridlines, optional point + label, optional line (clipped to `[-6, 6]^2`), optional `highlightX` dotted indicator with hollow marker. `viewBox` + `width="100%"` so it scales cleanly to the 375 px mobile viewport without horizontal scroll.
- **MC UI in `WorksheetForm.tsx`:** when `parseGraphPrompt(prompt).choices` is set, render a 4-radio `<fieldset>` (Tailwind `peer-checked:border-[#2d6a35] peer-checked:bg-[#e1f4e3]` for selection styling). Radio `name="answer_<problem.id>"`, values `A`/`B`/`C`/`D` — the existing `submitWorksheet` flow handles them as ordinary text answers.
- **Grading reuse (`gradeAnswer.ts` untouched):** coordinate answers (`"x = 3, y = -2"`) grade via the simultaneous-equations pair path that Level 11.2 already relies on (order-independent, spacing-insensitive). MC letters grade via the algebraic path (`/[a-zA-Z]/`), which lowercases and strict-matches — `a` vs `A` is automatically case-insensitive. Slope / y-intercept / read-y answers grade via the existing signed-integer path.
- **Results page (`src/app/worksheet/results/[sessionId]/page.tsx`):** review cards render the same `<CoordinatePlane>` above the answer grid for `.graph` problems, and the 4 mini graphs in a 2-up (mobile) / 4-up (≥ sm) grid for `.choices`, with subtle ring styling — green on the correct choice, soft red on the student's wrong pick.

---

## Reusable Answer-Control System (2026-06-08)

One shared system gives mobile-friendly structured inputs across the worksheet, targeted
practice, and self-correction surfaces. Future levels opt in automatically by `problem_type` —
no per-surface wiring. **No grading change:** every control submits the exact canonical string
`gradeAnswer` already expects, so `gradeAnswer.ts` / `worksheet.ts` / `selfCorrection.ts` are
untouched.

- **Mapping:** `src/lib/math/answerControl.ts → getAnswerControlType(type)` returns one of
  `equation_slope_intercept` | `yes_no` | `coordinate_pair` | `default`.
  - `equation_from_slope_intercept` → equation control (`y = [±]m x [±]b`, canonical `y = 2x + 3`)
  - `point_on_line` → Yes/No buttons (canonical `yes`/`no`)
  - `sim_eq`, `read_point_coordinates` → coordinate control (`x = [±]n, y = [±]n`, canonical `x = 3, y = -2`)
  - everything else (~60 types) → plain text input (with `inputModeForType` + `placeholderForType`)
- **Components:** `src/components/answer-controls/` — `AnswerInput.tsx` (dispatcher),
  `EquationSlopeInterceptInput.tsx`, `CoordinatePairInput.tsx`, `YesNoAnswerInput.tsx`, and shared
  `signToggle.tsx` (`SignToggle` + digit-only helper).
- **Dual form-pattern:** every control renders one hidden `<input name>` **and** calls an optional
  `onValueChange(canonical)`. Uncontrolled `<form action>` surfaces (`WorksheetForm`,
  `CorrectionInput`) read the hidden field by name; the controlled client-graded surface
  (`PracticeForm`) uses `onValueChange` to update its `answers` state. Effect-based controls update
  the callback via a ref so an inline parent callback can't trigger a render loop. Yes/No radios use
  `useId()` for stable server/client ids (avoids hydration mismatch).
- **Coordinate control rules:** magnitude 0 is allowed (axis points like `x = 0, y = 3`); only a
  blank field counts as "no answer"; never emits `-0`. Format matches the generators
  (`simultaneous-equations.ts` / `graphing.ts`) byte-for-byte so the results page displays
  identically, not just grades equal.
- **MC graph + graph display stay prompt-driven** (`parseGraphPrompt` + `CoordinatePlane`) in each
  parent — they need server-rendered SVGs + choice specs, so they are NOT in the type dispatcher.
  As part of this work, `PracticeForm` was given the same `parseGraphPrompt`/`CoordinatePlane`/MC
  rendering as `WorksheetForm`, fixing a pre-existing bug where 12.2 targeted practice leaked raw
  `[GRAPH]`/`[CHOICES]` markers and showed no graph.
- **Self-correction:** the results page passes `problem_type` into `CorrectionInput`, which uses the
  structured control for the 3 families and falls back to the bespoke inline text input for
  `default`/legacy-null types. MC self-correction stays plain text (type the letter A–D).
- **Grading-safety gate:** `scripts/answer-control-gate.ts` (`npx tsx`) asserts every buildable
  canonical grades `=== true` against the generator format across the full value set (494 checks).

## Worksheet Interleaving (Milestone 28)

Worksheets can include a small set of review problems from previously mastered levels to improve long-term retention.

**Logic lives in `src/app/worksheet/page.tsx`:**
- `SUPPORTED_LEVEL_KEYS` — ordered list of all levels with generator support: `[1,1],[1,2],[2,1],[2,2],[3,1],[3,2],[4,1],[4,2],[5,1],[5,2],[6,1],[6,2],[7,1],[7,2],[8,1],[8,2],[9,1],[9,2],[10,1],[10,2],[11,1],[11,2],[12,1],[12,2],[13,1]`
- `REVIEW_PROBLEM_COUNT = 4` — number of review problems in a mixed worksheet
- For a 20-problem worksheet: 16 current-level + 4 review, shuffled to interleave
- Review eligibility: `student_level_progress` row must exist with `consecutive_passes > 0 OR last_result_passed = true`. This filters out placement-jumped levels.
- Up to 2 most recent eligible supported levels are used for review (split 2+2)
- Unsupported levels are detected via `SUPPORTED_LEVEL_KEYS` check and show "Coming Soon" immediately — before interleaving runs

**Display:** `WorksheetForm.tsx` renders an amber "Review" badge on review problems. The `isReview` flag is in-memory only and not persisted to DB.

**Grading/progression:** Review problems count toward the session total and accuracy. The session `level_id` stays as the current level — only current-level mastery progress is tracked.

---

## Self-Correction Flow (Milestone 30)

After a worksheet is submitted and graded, the results page shows a `CorrectionInput` (client component, `useActionState`) below each incorrect problem. The student can type a corrected answer and check it:
- Correct → `problems.self_corrected = true` (via `submitSelfCorrection` server action), badge shown
- Wrong → inline error, input stays open
- Already-correct problems → no correction UI

**Scope:** Only `problems.self_corrected` is updated. Session metrics (`correct_count`, `accuracy`, `passed`), mastery, streaks, and points are never touched. The `revalidatePath` pattern is used for in-place page refresh.

**Shared grading utility:** `src/lib/math/gradeAnswer.ts` — `gradeAnswer()` extracted here so it can be imported from both `worksheet.ts` and `selfCorrection.ts` without the `'use server'` export restriction.

## Parent PIN / Student Mode (Milestone 50)

Optional 4-digit PIN that gates the parent dashboard so kids can use Student View independently. Tone is deliberately soft — never "locked / denied / blocked".

- **Storage:** `profiles.parent_pin` (nullable text), `pin_failed_attempts` (int), `pin_locked_until` (timestamptz). Hash is `saltHex:scryptHashHex` produced by `node:crypto.scryptSync` (16-byte salt, 64-byte key). No new dependency.
- **Helpers:** `src/lib/pin.ts` (`hashPin` / `verifyPin` / `isValidPinFormat`), `src/lib/parentMode.ts` (`STUDENT_MODE_COOKIE`, `enforceParentMode`, `setStudentModeCookie`, `clearStudentModeCookie`, `sanitizeNext`).
- **Server actions (`src/app/actions/pin.ts`):** `setPin`, `removePin`, `lockToStudentMode`, `verifyPinAction`. After 5 wrong attempts, sets `pin_locked_until = now + 30s` and zeros the counter; success path clears both.
- **Cookie:** `mathstep_student_mode` (httpOnly, sameSite=lax, 30-day maxAge). Set on "Hand over to child", cleared on PIN-success / signIn / signUp / signOut / removePin.
- **Route guards:** `enforceParentMode(returnTo)` called at the top of `/dashboard`, `/onboarding`, `/feedback`, `/placement`. Skips silently if no PIN is saved (so first-time signups are unaffected). `/play`, `/worksheet`, and `/worksheet/results/[sessionId]` are intentionally not gated.
- **PIN entry page:** `/parent-pin` with `?next=...` (sanitised — must start with `/` and not `//`; otherwise falls back to `/dashboard`). Single 4-digit `inputMode="numeric"` input. Live cooldown countdown. "Back to Student View" link + "Sign out" escape.
- **Onboarding integration:** after the *first* student is created, `createStudent` redirects to `/onboarding/pin?student=...` instead of `/play`. The page is fully skippable. Adding a 2nd+ student still lands on `/dashboard` as before.
- **Recovery:** sign-out / re-login / remove PIN from Admin controls. No email reset.
- **Student switcher lock (2026-05-27):** When a multi-student account has a PIN saved, the student switcher on `/play` is locked by default and direct-URL `?student=<sibling>` attempts on `/play`, `/worksheet`, `/worksheet/results/[sessionId]`, and `/practice/weak-spots` soft-fail back to the device's locked student. Two new cookies in `src/lib/parentMode.ts`: `mathstep_switcher_unlocked` (httpOnly, sameSite=lax, 30-min idle TTL) and `mathstep_locked_student` (httpOnly, sameSite=lax, 30-day TTL, holds the student UUID assigned to this device). Helpers: `isSwitcherUnlocked`, `setSwitcherUnlockedCookie`, `clearSwitcherUnlockedCookie`, `getLockedStudentId`, `setLockedStudentCookie`, `clearLockedStudentCookie`, plus pure resolver `resolveActiveStudent({ requested, students, hasPin, switcherUnlocked, lockedStudentId })`. New server actions in `src/app/actions/pin.ts`: `verifySwitcherPinAction` (reuses the same `pin_failed_attempts` / `pin_locked_until` cooldown; on success sets *both* the unlock cookie and the locked-student cookie so the device assignment survives the unlock TTL) and `lockStudentSwitcher` (writes the locked-student cookie and clears the unlock cookie). Unlock UI lives at `/switcher-unlock` — server page + `SwitcherUnlockForm` client component with a sibling picker and the same `useActionState` cooldown handling as `PinEntryForm`. Both new cookies are cleared on `signIn` / `signUp` / `signOut` / `updatePassword` / `removePin`; `lockToStudentMode` ("Hand over to child") also clears the unlock cookie. Single-student accounts and accounts with no PIN are completely unaffected — the resolver just returns the existing fallback when `students.length <= 1 || !hasPin || switcherUnlocked`.

## Achievements / Milestones (Milestone 52)

Tiered achievements (7 families) derived from existing rows — no new tables. Definitions live in `src/lib/achievements.ts` (`ACHIEVEMENT_FAMILIES`, `deriveAchievementProgress`, `earnedTierBadges`, `detectSessionMilestones`); shared display is `src/components/AchievementsCard.tsx`.

- **Families and tiers:** 📘 Worksheets completed (1, 5, 10, 25, 50, 100), 💯 Perfect scores (1, 5, 10, 25), 🔥 Best streak (3, 5, 7, 14, 30 days), 🚀 Levels mastered (1, 3, 5, 10), ⭐ Points earned (100, 500, 1000, 2500), ✏️ Self-correction wins (1, 5, 10), ⚡ Speedy passes (1, 5, 10).
- **Data sources:** Worksheets / Best streak / Points come straight from `streaks` columns (`total_sessions`, `longest_streak`, `total_points`). Perfect / Speedy / Levels mastered are computed in JS over the bounded `sessions` history (`.limit(500)`, ordered by `completed_at desc`) loaded once per render — `passed AND time_taken_seconds <= levels.speed_target_seconds` for Speedy, `accuracy = 100` for Perfect, distinct `level_id` of passing sessions for Levels mastered. Self-correction count uses an embedded inner join: `from('problems').select('id, sessions!inner(student_id)', { count: 'exact', head: true }).eq('self_corrected', true).eq('sessions.student_id', student.id)`. (The memory-noted PostgREST embed caveat applies specifically to `streaks` — not used here.)
- **Dashboard variant** renders 7 family rows: emoji + parent label, *"Reached N{unit} ✓"* / *"Not reached yet"* / *"All goals reached 🏆"* on the right, *"value / next-tier"* with a soft progress bar underneath. Header shows *"X of 7 goals in progress"*. (Milestone 57 reworded these from the original *"Tier N ✓"* / *"not yet"* / *"All tiers earned 🏆"* / *"…next tiers in progress"* phrasing for parent clarity.)
- **Play variant** renders earned highest-tier badges only as a pill strip ("Your wins" — e.g. `📘 10 Worksheets · 💯 5 Perfect Scores · 🚀 Level Mastered`). Empty state when nothing's earned.
- **Results-page "Milestones unlocked" strip (`detectSessionMilestones`):** session-scoped, fires only in the moment — Worksheet thresholds 1/5/10/25/50/100 when `streaks.total_sessions` after this session equals the threshold, Perfect Score when accuracy = 100, Beat the Time Target when passing inside the level's `speed_target_seconds`, and Fixed Every Mistake when every incorrect problem also has `self_corrected = true`. Streak milestones intentionally skipped here, Level Up left to its dedicated banner.
- **Not persisted.** All progress is derived at render time. v1 limitations: no per-tier earned date; sessions fetch is capped at 500 per render so a student with 500+ historical completions could under-count Speedy / Levels-mastered tiers from the very first ones (Worksheets/Streak/Points are unaffected).
- **Next Win card (Milestone 55)** — `pickNextWin(progress)` in `src/lib/achievements.ts` selects the closest unearned tier across all 7 families by progress ratio (tie-break = `ACHIEVEMENT_FAMILIES` declaration order, so brand-new students naturally land on Worksheets / First Worksheet). Returned shape is `{ kind: 'next', emoji, label, current, target, progressPct, friendlyMessage, … }` or `{ kind: 'maxed' }`. `src/components/NextWinCard.tsx` renders it above `<AchievementsCard variant="play" />` on `/play`. Friendly copy: streak uses *"… more days to go!"*, points uses *"… more points to go!"* with `toLocaleString('en-NZ')`, everything else is *"Only N more to go!"* / *"Just one more to go!"*; brand-new worksheets first tier shows *"Finish your first worksheet to earn your first win!"*; maxed shows 🏆 + *"All wins earned for now"*. No new queries, no schema changes — pure derivation off the existing `FamilyProgress[]`.

## Mistake Journal / Targeted Practice v1 (Milestone 53)

Surfaces top weak areas for the selected student and offers an optional, side-effect-free practice flow.

- **Derivation:** `src/lib/mistakeJournal.ts → deriveWeakAreas()`. Pure function — takes the recent-window problems, the matching session rows (for `level_id` and `completed_at`), and a level lookup. No Supabase dependency.
- **Window:** last 20 completed sessions for the student. The dashboard reuses its bounded `sessions` fetch (no extra session query); a single new `problems.select(...).in('session_id', [...])` is added. `recentSessionIds` is checked before the `.in(...)` call to avoid `.in([])`.
- **Grouping:** by `(sessions.level_id, problems.problem_type)`. New rows store the generator's `type`; old rows (pre-Milestone 54) have `problem_type IS NULL` and fall back to a per-level legacy bucket grouped only by `levels.{level_number, sublevel_number, topic}`. Parent-friendly labels (e.g. `factor_pairs` → `Factor pairs`) live in `parentLabelForType()` inside `mistakeJournal.ts`; legacy buckets render as `Level X.Y — Topic`.
- **Filters:** skip groups with `< 4` attempts or `≥ 80%` accuracy. Sort by `incorrectCount desc, accuracy asc`. Top 3 returned.
- **Recent examples:** sorted by `session.completed_at desc` then `problems.order_index asc` — never by UUID `problems.id`.
- **Dashboard UI:** `MistakeJournalCard` between Milestones and Recent Worksheets. Empty state copy: *"No clear weak spots yet — keep practising."*
- **Play UI:** `TargetedPracticeCTA` shown only when at least one weak area exists, and suppressed when the top weak area equals the current stuck level (avoids stacking with the existing stuck-support card).
- **Practice route:** `/practice/weak-spots?student=…&level=…&sublevel=…[&type=…]`. Server component validates the level via `SUPPORTED_LEVEL_KEYS`. When `type` is present it over-generates 4× via `generateProblems()`, filters by matching `type`, then takes the first 10; if fewer than 10 match, it tops up with the unfiltered remainder so practice never fails because exact-type generation came up short. Without `type`, generates 10 directly. Client-side grading via the shared `gradeAnswer` from `src/lib/math/gradeAnswer.ts`.
- **No persistence, by design.** No `INSERT` to `sessions` / `problems`, no `UPDATE` to `streaks` / `student_level_progress` / `students`. Recent Worksheets count and achievement progress are untouched by a practice run.
- **Shared input-mode helper:** `src/lib/math/inputMode.ts` — `inputModeForType()` + `problemTypeLabel()`. Used by both `WorksheetForm` and `PracticeForm` so the per-problem-type input mode (text for algebra/factorization/inequality/sim-eq/fractions/negatives, numeric/decimal for purely numeric types) cannot silently regress between the two surfaces. This is what protects against the historical stylus *"x → ."* bug.

## Practice History v1 (Milestone 58)

Lightweight, parent-facing record of every targeted-practice run. Fully separate from `sessions`/`problems`/mastery/progression.

- **Schema — new table `practice_sessions`:**
  | Column | Type | Notes |
  |--------|------|-------|
  | id | uuid | PK, gen_random_uuid() |
  | student_id | uuid | FK → students(id), cascade delete |
  | level_id | int | FK → levels(id) |
  | problem_type | text | nullable; matches `problems.problem_type` convention |
  | total_problems | int | check > 0 |
  | correct_count | int | check between 0 and total_problems |
  | accuracy | int | check between 0 and 100 |
  | completed_at | timestamptz | default now() |
  Index: `idx_practice_sessions_student_completed` on `(student_id, completed_at desc)`. RLS mirrors the `streaks` policy via an `exists` join through `students.parent_id = auth.uid()`.
- **Persistence path:** `/practice/weak-spots/page.tsx` selects `levels.id` and passes `levelId` + `problemType` (the URL `type` param) into `PracticeForm`. After client-side grading, the form fires `recordPracticeSession(...)` (`src/app/actions/practiceSessions.ts`) with totals/correct/accuracy. Failure is `.catch(() => {})` — never blocks the results screen.
- **Dashboard surface:** `PracticeHistoryCard` (`src/components/PracticeHistoryCard.tsx`) is mounted directly below `MistakeJournalCard`. It receives mapped entries (label resolved via `parentLabelForType` with level/topic fallback) and a `thisWeekCount`. The "this week" math reuses `nzDateKey` + Mon-start week math from `src/lib/habit.ts`, exactly matching the `HabitCard` boundary so a Sunday-night practice in the same NZ-local week is counted, but a session from the prior week isn't.
- **Hard scope rules (enforced):** No effect on `streaks` (current/longest/total_sessions/total_points), `student_level_progress.consecutive_passes`, `students.current_level/sublevel`, achievements, Daily Habit, or Recent Worksheets. No new rows in `sessions` or `problems`. Practice runs do not appear in any "completed worksheet" surface.
- **v1 limitations:** No per-problem records (only the run summary), no `time_taken_seconds`, no `passed` flag, no Play/Student-View surface, no Mistake-Journal inline enrichment. Top 5 visible on the dashboard with a `Showing latest 5 of N` hint when there are more.

## Recent Worksheets timestamp & scroll behaviour

`src/app/dashboard/page.tsx` formats completed_at via `formatNzDateTime()` — `en-NZ` date + 12-hour NZT time on a single subline (e.g. `7 May 2026, 6:20 pm NZT · 20/20 · 100% · 29s`). Up to 25 entries are shown inside a `max-h-[26rem] overflow-y-auto` scroll container with a thin scrollbar (Chromium + Firefox styling). When the row count exceeds the visible threshold, a subtle "Showing latest N worksheets — scroll to see more." helper line appears below the panel.

## Daily Habit Loop v1 (Milestone 56)

In-app, gentle daily-practice surface — no email or push reminders.

- **Source of truth for "today / yesterday / this week" is NZ-local
  (`Pacific/Auckland`)**, not UTC. Helper `src/lib/habit.ts → nzDateKey()`
  produces a `YYYY-MM-DD` key from any `Date | string` via
  `Intl.DateTimeFormat({timeZone:'Pacific/Auckland'}).formatToParts()`. Day
  arithmetic uses `shiftDateKey()` (UTC date math on the parsed key) so DST
  transitions can't drift the result.
- **Habit week is a Monday-start NZ calendar week** (Milestone 57). The
  helper anchors the 7-day window on the NZ-local Monday of the current
  week — `(weekdayIndex + 6) % 7` days back from `todayKey` — and walks
  forward to Sunday. Future days within the current week render with a
  dashed muted border. Sessions from a prior calendar week do not count
  toward `daysPractisedThisWeek`.
- **No schema changes, no extra Supabase queries.** Both `/play` and
  `/dashboard` already fetch `sessions` with `.not('completed_at','is',null)
  .order(... desc).limit(500)`; the new `deriveHabitStatus()` consumes
  `sessions.map(s => s.completed_at)` plus the existing `streaks` row.
- **Multiple sessions on the same NZ day collapse to one habit-day** via a
  `Set<string>` of NZ date keys.
- **`HabitCard` component** with `variant: 'play' | 'dashboard'`:
  - Play variant: between the stats row and the *Start Today's Worksheet*
    CTA. Headline flips between *"Today's practice"* and *"Today's practice
    done"*; body line is *"Ready for a short practice session?"* /
    *"Nice work — you practised today!"*; one optional line *"Nice — that's
    day {n}!"* only when `todayDone && currentStreak >= 2` (streak number
    is *not* re-emphasised here — the stat tile above already carries it);
    a Mon → Sun rhythm row with completed days filled green, today ringed,
    and future days rendered with a dashed muted border.
  - Dashboard variant: between *Progress at a Glance* and *Milestones*.
    Header *"Daily habit"* (no meta — *This week* tile carries the count).
    Body sentence is parent-voice (e.g. *"{name} has practised 4 of 7 days
    this week."*), plus *"Practice completed today."* /
    *"No practice yet today."* / *"No sessions yet."*. 4 stat tiles:
    Today (Done ✓ / Not yet), Streak, Best, This week (X / 7). Same Mon →
    Sun rhythm row as Play.
- **Tone is gentle.** No words like *missed / behind / broken streak* —
  the empty / no-recent-practice copy is *"a short session helps them get
  back into rhythm"*.
- **Mobile (≤ sm)** uses single-letter labels (`M T W T F S S`); `≥ sm`
  uses three-letter labels (`Mon Tue Wed Thu Fri Sat Sun`). Both via
  `sm:hidden` / `hidden sm:inline`.

## Daily Reminder Email v1 (Milestone 60)

Optional, parent-facing email that nudges when at least one of a parent's
students hasn't practised today (NZ-local). Single email per parent
covering all their pending students — chosen as the simpler v1 path over
one-email-per-student.

- **Schema (added on `profiles`, no new table):** `reminders_enabled
  boolean not null default false`, `last_reminder_sent_date date`. Index
  `idx_profiles_reminders_pending` on `(reminders_enabled,
  last_reminder_sent_date) where reminders_enabled = true`. Originally
  added with `default true`; after Milestone 62 the column default was
  flipped to `false` so new signups also start opted out. Existing rows
  were one-time backfilled to `false` at Milestone 60 since existing
  testers had not consented.
- **Trigger:** Vercel Cron entry in `vercel.json` runs
  `GET /api/cron/daily-reminders` at `0 3 * * *` UTC = **4:00 pm NZDT**
  (UTC+13) / **3:00 pm NZST** (UTC+12). The ±1h DST drift is an accepted
  v1 limitation.
- **Auth:** the route handler verifies `Authorization: Bearer
  ${CRON_SECRET}` and 401s anything else, so the public endpoint can't
  be swept by unauthenticated traffic.
- **NZ time logic:** `getNzWeekRange()` and `nzDateKey()` in
  `src/lib/habit.ts` — same helpers the dashboard's Practice History
  and HabitCard already use, so the email's "X of 7 days this week"
  cannot drift from the in-app surfaces. A student counts as "practised
  today" iff some `sessions.completed_at` has `nzDateKey() ===
  todayKey`.
- **RLS bypass:** `src/lib/supabase/serviceRole.ts` wraps a
  `SUPABASE_SERVICE_ROLE_KEY` client. Used **only** by the cron route
  handler and the unsubscribe page. Never imported from client
  components or middleware.
- **Email content** (in `src/lib/email/templates/dailyReminder.ts`):
  Greeting, then one block per pending child containing a bold "{Child}
  hasn't practised today yet." headline, a "Current focus: Level X.Y —
  Topic" line (looked up from `levels` once per cron run), and exactly
  one evidence-backed reason picked by priority (Milestone 62):
  `currentStreak ≥ 1` → *"{Child} is on a {n}-day streak — a quick
  session keeps it going."*; else `daysPractisedThisWeek ≥ 1` →
  *"{Child} has practised {x} of 7 days this week — one more keeps
  the routine."*; else → *"Consistency is what builds skill — 5
  minutes today helps."* Footer makes both escape hatches explicit:
  an in-app "Parent View → Admin controls" line plus a one-tap
  unsubscribe link. Subject is `{Child}'s MathStep practice today?`
  for one child or `Time for MathStep practice?` for two or more.
- **Opt-out paths:**
  1. **In-app toggle** in Parent View → Admin controls
     (`src/app/dashboard/RemindersToggle.tsx` →
     `src/app/actions/reminders.ts → setRemindersEnabled`).
  2. **One-tap email footer link** to
     `/account/reminders/unsubscribe?token=…`. Token is HMAC-signed
     `parent_id` via `src/lib/reminderToken.ts` (uses
     `node:crypto.createHmac('sha256', REMINDER_UNSUB_SECRET)` — no new
     dependency). Public route, no Supabase auth required.
- **Duplicate-send prevention:** select clause filters out anyone with
  `last_reminder_sent_date = todayKey`. The handler updates that column
  only after Resend reports success. At-least-once cron firings are
  therefore idempotent within a single NZ day.
- **Production gate (intentional, not yet flipped):** real-parent
  sending requires (a) a verified domain in Resend, and (b)
  `REMINDER_FROM_EMAIL` set to an address on that domain. Until both
  are true, `reminders_enabled` should stay `false` for every existing
  account and `REMINDER_FROM_EMAIL=onboarding@resend.dev` is acceptable
  for local dev only (delivers solely to the Resend account owner's
  verified inbox).
- **v1 limitations (deferred):** weak-area digests, achievement
  emails, push notifications, public-holiday / school-day filtering,
  DST drift correction, per-parent send-time preferences,
  bounce/complaint handling. (Weekly summary email shipped in
  Milestone 62 — see below.)

## Weekly Review Email v1 (Milestone 62)

Sunday-evening recap email — combined per parent across all their
students. Mandatory by default (`weekly_enabled = true` for new + existing
users), separate one-tap unsubscribe stream from the daily reminder.

- **Schema (added on `profiles`, no new table):** `weekly_enabled
  boolean not null default true`, `last_weekly_sent_date date`. Index
  `idx_profiles_weekly_pending` on `(weekly_enabled,
  last_weekly_sent_date) where weekly_enabled = true`. Existing rows
  inherit `true` automatically via the column default — no separate
  backfill UPDATE.
- **Trigger:** Vercel Cron entry in `vercel.json` runs
  `GET /api/cron/weekly-review` at `0 4 * * 0` UTC = **5:00 pm NZDT**
  (UTC+13) / **4:00 pm NZST** (UTC+12) on Sunday. ±1h DST drift is an
  accepted v1 limitation (matches the daily approach).
- **Auth:** the route handler verifies `Authorization: Bearer
  ${CRON_SECRET}` and 401s anything else.
- **NZ time logic:** reuses `getNzWeekRange()` / `nzDateKey()` /
  `shiftDateKey()` from `src/lib/habit.ts`, so the email's "X practice
  days · N worksheets · Y% accuracy" cannot drift from the dashboard's
  HabitCard / Practice History counts. Week range is Mon 00:00 NZ →
  Sun 23:59:59 NZ.
- **Per-student block:** `📊 {practiceDays} practice days · {worksheets}
  worksheets · {accuracy}% accuracy`, `🎯 Current focus: Level X.Y —
  Topic`, optional `🏆 New this week: …`, optional `⚠️ Needs practice:
  {parentLabelForType}`. Empty-week variant replaces metrics with
  *"No worksheets this week — that's okay, every week is a fresh
  start."* and `🎯 Ready to continue: Level X.Y — Topic`. Subject is
  `{Child}'s MathStep week` for one child or `Your kids' MathStep
  week` for two or more.
- **"New this week" derivation (no schema):** the cron handler
  computes two `deriveAchievementProgress()` snapshots per student —
  one as of the previous NZ Sunday (`shiftDateKey(mondayKey, -1)`) and
  one as of now — over the bounded `sessions` fetch (limit 500).
  Inputs derived from sessions+problems: `totalSessions =
  count(filtered)`, `perfectCount = filtered.accuracy = 100`,
  `speedyPassCount = passed AND time_taken_seconds ≤
  speedTarget(level_id)`, `levelsMasteredCount = distinct
  passed.level_id`, `totalPoints = sum(passed ? 15 : 10)` (formula
  matches `src/app/actions/worksheet.ts`), `selfCorrectCount =
  problems.self_corrected = true joined on filtered sessions`,
  `longestStreak = longest consecutive run of NZ date keys from
  filtered sessions`. Any family whose `earnedTier` strictly
  increased between snapshots crosses one or more new tiers this
  week — every newly-crossed tier in `family.tiers` is listed
  individually using `family.formatTierBadge(tier)`.
- **Top weak area:** reuses `deriveWeakAreas()` over the student's
  recent 20 sessions (same window `MistakeJournalCard` uses on the
  dashboard). Top 1 result rendered using its `.label`
  (`parentLabelForType` for new rows, `Level X.Y — Topic` fallback
  for legacy rows).
- **RLS bypass:** same `createServiceRoleClient()` pattern as the
  daily cron. Service role key is allowed in server-side
  cron/background routes only.
- **Opt-out paths:**
  1. **In-app toggle** in Parent View → Admin controls
     (`src/app/dashboard/WeeklyReviewToggle.tsx` →
     `src/app/actions/reminders.ts → setWeeklyEnabled`).
  2. **One-tap email footer link** to
     `/account/weekly/unsubscribe?token=…`. Token is HMAC-signed
     `weekly:${parent_id}` via
     `createWeeklyUnsubscribeToken(parentId)` in
     `src/lib/reminderToken.ts`. The `weekly:` prefix isolates streams
     so a daily token cannot validate the weekly route, and vice versa.
     Reuses the existing `REMINDER_UNSUB_SECRET` env var — no new
     secret needed.
- **Duplicate-send prevention:** select clause filters out anyone
  with `last_weekly_sent_date = todayKey`. The handler updates the
  column only after Resend reports success. At-least-once cron
  firings are therefore idempotent within the same NZ Sunday.
- **From address:** the route reads `WEEKLY_FROM_EMAIL` if set,
  falling back to `REMINDER_FROM_EMAIL`. Same Resend-domain
  prerequisites as the daily stream.
- **v1 limitations (deferred):** ±1h DST drift, snapshot derivation
  bounded by the 500-session fetch limit (very-long histories could
  miss `streak` / `selfcorrect` tier crossings for ancient data — not
  a real issue at v1 counts), no per-parent send-time preferences, no
  public-holiday / school-day filtering, no bounce/complaint
  handling, no per-tier earned-date persistence (diff recomputed
  each run).

## Weekly Email Copy Recipient v1 (Milestone 63)

Optional second recipient for the Sunday weekly review email. One extra
email per parent account — no new login, no new student ownership changes.

- **Schema:** `weekly_cc_email text` (nullable) added to `profiles`. No
  index — queried only during cron run alongside the existing
  `weekly_enabled` filter. App-level validated only (no DB CHECK).
- **UI:** "Weekly email copy" control in Parent View → Admin controls,
  rendered by `src/app/dashboard/WeeklyCcEmailForm.tsx` (client component,
  `useActionState`). Label + helper text, current saved address shown if
  set, text input with placeholder `"partner@example.com"`, Save button,
  Remove button when an address is saved.
- **Validation (app-level):** trimmed + lowercased before save; must
  contain `@` with ≥1 char before it, a `.` after `@` (not at end), no
  spaces. Blank clears the field. Same-as-account-email blocked with a
  specific message.
- **Server action:** `setWeeklyCcEmail` in `src/app/actions/reminders.ts`.
  Auth required; updates only the current user's profile row;
  `revalidatePath('/dashboard')` on success.
- **Cron send:** `src/app/api/cron/weekly-review/route.ts` fetches
  `weekly_cc_email` alongside the existing profile columns. If set, Resend
  receives `to: [primary_email, weekly_cc_email]` — one send, one
  success/failure. `last_weekly_sent_date` is updated only after a
  successful send. If the send fails (either recipient), the cron retries
  on the next run as before. `src/lib/email/resend.ts` `sendWeeklyReview`
  now accepts `to: string | string[]`.
- **Unsubscribe:** disables `weekly_enabled` for the whole account (cc
  recipient not tracked separately). Daily reminders are unaffected.
- **v1 limitations:** one extra recipient only; cc address not separately
  confirmed or unsubscribed; email body does not mention the cc recipient;
  daily reminders not sent to cc address.

## Delete Student admin control (Milestone 61)

Parent-only destructive action inside the dashboard's Admin controls. Server action: `deleteStudent` in `src/app/actions/students.ts`. UI: `src/app/dashboard/DeleteStudentSection.tsx`, mounted at the bottom of the Admin controls `<details>` block.

- **Ownership:** server action filters by `parent_id = auth.uid()` on `students`. RLS is a backstop.
- **Confirmation:** typed-name input must match `student.name` exactly after `trim()` on both sides (case-sensitive). Submit button is live-disabled until match.
- **Only-student guard:** if the parent has ≤ 1 students the section shows the message *"You need at least one student profile. Add another student before deleting this one."* and renders no active button. Server action also re-checks the count and refuses with the same copy.
- **Cleanup:** relies entirely on existing FK cascades — `sessions`, `problems` (via sessions), `streaks`, `student_level_progress`, `practice_sessions` all CASCADE from `students`; `feedback.student_id` is SET NULL so parent-owned feedback is preserved with `student_id = NULL`. No manual child-row deletes, no DDL.
- **Redirect:** after deletion the action redirects to `/dashboard?student=<oldest remaining student>` (ordered by `created_at asc`). Redirect goes to `/onboarding` only as a defensive fallback — the count check should make that unreachable.
- **Mode gate:** the parent dashboard already calls `enforceParentMode('/dashboard')`, so the section is unreachable from Student Mode without PIN. `/play` and `/worksheet` intentionally do not import the component or action — child surfaces have no delete UI and no delete code path.
- **Tone:** soft outline-only red (`border-red-300 / bg-white / text-red-700`) — destructive intent is clear without scary fills, matching the existing red usage on the failed-worksheet badge.
- **v1 limitations:** no second PIN re-entry just before delete, no undo / soft-delete, no server-side guard against in-flight worksheets in another tab; parent auth user never touched.

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
