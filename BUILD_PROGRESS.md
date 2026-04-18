# MathStep — Build Progress

> Rolling log. Most recent entries at the top of each section.

---

## Current Status

**Phase:** Milestone 27 — Placement Diagnostic v1.
**Next:** Deploy to Vercel (or similar) to test real mobile install flow.

---

### Milestone 27 — Placement Diagnostic v1 (2026-04-18)

**Placement strategy:**
10 hardcoded questions across 3 bands. All-at-once display, two-step form (questions → recommendation → confirm).

- Band A — Arithmetic (Q1–Q4): basic addition, double-digit addition, subtraction, multiplication
- Band B — Number Theory (Q5–Q7): prime factorisation, list factors, GCF
- Band C — Algebra (Q8–Q10): simple linear equation, both-sides equation, inequality

**Scoring algorithm (highest-band-wins with gates):**
```
algScore=3        → 11/1 (Inequalities)
algScore=2        → 10/2 (Variables Both Sides)
algScore=1 AND numScore≥1 → 10/1 (Linear Equations)
numScore≥2        → 9/2  (Factor Pairs)
numScore≥1        → 9/1  (Factorisation)
Q4 right          → 3/2  (Multi-digit Multiplication)
Q3 right          → 3/1  (Basic Multiplication)
Q2 right          → 2/1  (Subtraction)
Q1 right          → 1/2  (Double-digit Addition)
default           → 1/1  (Single-digit Addition)
```

**Files added:**
- `src/lib/math/placement.ts` — questions, gradeAnswer, scorePlacement, PLACEMENT_INFO map
- `src/app/actions/placement.ts` — `runPlacementDiagnostic` (score, return state), `applyPlacement` (save + redirect)
- `src/app/placement/page.tsx` — protected server page with auth + student ownership check
- `src/app/placement/PlacementForm.tsx` — 2-step client form: questions → recommendation → confirm or override

**Files modified:**
- `src/app/onboarding/OnboardingForm.tsx` — two submit buttons: "Start at Level 1" and "Take a short placement quiz →" (uses button name/value to set start_mode)
- `src/app/actions/students.ts` — `createStudent` reads `start_mode`; if "diagnostic" redirects to `/placement?student=ID`
- `src/app/dashboard/page.tsx` — admin controls section now includes "Run Placement Diagnostic →" link

No DB schema changes. No new dependencies.

### Suite 27 — Placement Diagnostic v1 (2026-04-18)
| Test | Result |
|------|--------|
| Onboarding shows two buttons: "Start at Level 1" and "Take a short placement quiz →" | PASS |
| "Take a short placement quiz →" creates student at 1/1 → redirects to /placement?student=ID | PASS |
| /placement shows 10 questions in 3 bands (Arithmetic, Number Theory, Algebra) | PASS |
| All correct answers → recommended Level 11.1 — One-Variable Inequalities | PASS |
| All empty answers → recommended Level 1.1 — Addition | PASS |
| Q1-Q4 correct, rest blank → recommended Level 3.2 — Multiplication | PASS |
| Q1-Q7 correct, algebra blank → recommended Level 9.2 — Factor Pairs and Common Factors | PASS |
| "Start at Level 11.1" confirm → redirects to /play at Level 11/1 | PASS |
| "Start at Level 1.1 instead" override → redirects to /play at Level 1/1 | PASS |
| Dashboard admin controls show "Run Placement Diagnostic →" link with correct student param | PASS |
| Default onboarding path ("Start at Level 1") still redirects to /play at Level 1/1 | PASS |
| /placement protected — unauthenticated redirects to /login (code verified) | PASS |
| Student ownership enforced in runPlacementDiagnostic and applyPlacement (parent_id check) | PASS |
| TypeScript: build clean, no type errors | PASS |

---

### Bug Fix — Worksheet Answer Capture (2026-04-18)

**Bug:** Results page showed blank "Your answer" values after tablet/browser submission in production.

**Root cause:** `disabled={pending}` was applied to all answer `<input>` elements in `WorksheetForm.tsx`. HTML spec excludes disabled controls from `FormData`. In React 19's concurrent rendering (production build), the pending state transition could disable the inputs before `new FormData(form)` was collected, causing all answer fields to be missing from the payload. The server action then stored empty strings for all `student_answer` values.

**Fix:** Removed `disabled={pending}` from answer inputs only (`src/app/worksheet/WorksheetForm.tsx`). Kept `disabled={pending}` on the submit button to prevent double-submission. One-line change.

**Files changed:** `src/app/worksheet/WorksheetForm.tsx`

### Suite 27 — Worksheet Answer Capture Fix (2026-04-18)
| Test | Result |
|------|--------|
| Worksheet loads (Level 1/1, 20 problems, tablet 768×1024) | PASS |
| All 20 answers typed and captured after submit | PASS |
| Results page: all 20 "Your answer" values shown correctly | PASS |
| Score 20/20, 100%, ✓ Passed — grading correct | PASS |
| Mastery progress increments (1/3) | PASS |
| No regression in worksheet/results navigation flow | PASS |

---

## Completed Milestones

### Milestone 26 — Bounded Algorithmic Random Generators (2026-04-18)

**Phase 1 — Shared RNG utility**
- `src/lib/math/generators/rand.ts` — new file: `seededRand(seed)` (mulberry32), `randInt(min, max, rand)`, `shuffled(arr, rand)` (Fisher-Yates). Generators accept optional `rand` parameter for deterministic testing; default is `Math.random`.

**Phase 2 — Generator redesign (all supported levels)**
- `addition.ts` — replaced fixed 10-item pool with algorithmic generation: 1/1 uses a ∈ [1,9], b ∈ [1,9] (81 unique pairs); 1/2 uses a ∈ [10,49], b ∈ [10,49] (large domain). Prompt-dedup with retry budget ensures no repeats within a session.
- `subtraction.ts` — 2/1: a ∈ [1,9], b ∈ [0,a] (54 pairs, non-negative results); 2/2: a ∈ [20,89], b ∈ [11,a-1] (large domain, always positive).
- `multiplication.ts` — 3/1: a,b ∈ [2,9] (64 pairs); 3/2: a ∈ [11,35], b ∈ [2,9] (200 pairs, products ≤ 315).
- `factorization.ts` — 9/1: expanded PF, LF, GCF, LCM pools to 25-30 entries each; uses `shuffled()` then slices. 9/2: expanded FP, CF, GCF2 pools similarly.
- `linear-equations.ts` — 10/1: all 5 subtypes (add/sub/mul/div/two-step) generated algorithmically; pick operands first, derive equation. 10/2: `c1x ± b1 = c2x + b2` generated by picking x, c1 > c2, b1, computing b2.
- `inequalities.ts` — 11/1: all 4 types (x+a>b, x-a<b, ax≤b, x/a≥b) generated algorithmically; deterministic answer format preserved (ASCII operators for grading).

**Phase 3 — Grading compatibility**
- No changes to `worksheet.ts` grading logic. All answer formats are identical to the old fixed pools. Multi-token, single-integer, and inequality normalization paths all verified.

**Phase 4 — Validation (Playwright)**
- See Suite 26 below.

**Phase 5 — Architecture**
- `index.ts` router signature unchanged — no downstream changes needed.
- `rand` parameter not threaded through `index.ts`; generators use it directly for test-time determinism.

No DB schema changes. No new third-party dependencies.

### Milestone 26b — Generator Hardening Pass (2026-04-18)

Critical review of Milestone 26. Findings and fixes:

**Bugs fixed:**
- `multiplication.ts` 3/2: domain was a ∈ [11,35], b ∈ [2,9] → products up to 315. Tightened to a ∈ [11,25], b ∈ [2,5] → products ≤ 125, matching original level difficulty.
- `linear-equations.ts` 10/2: when c2=1 in `makeBothSidesProblem`, prompt rendered as `1x` (e.g. `5x + 3 = 1x + 7`). Fixed with `cx()` helper: c2=1 now renders as `x` not `1x`.
- `factorization.ts` 9/2 FP_POOL: included numbers up to 120 → `factorPairs(120)` = 8 pairs, too many for a child. Capped pool at 72 (max 6 pairs).
- `factorization.ts` 9/1 LF_POOL: included 80, 84, 90, 96, 100 (numbers > 72). Removed to cap list-factors problems at a manageable factor count.
- `factorization.ts` 9/2 CF_POOL: included `[24, 48]` → commonFactors = 8 entries. Replaced with `[15, 45]` (4 common factors).

**Validation (tsx script, seeded RNG):**
- All 11 generator variants: count correct, no duplicates — PASS
- 3/2 max product (60 problems, seed 99): 125 ≤ 125 — PASS
- 10/2 no "1x" notation (50 problems, seed 77): 0 occurrences — PASS
- 9/2 max factor pairs per problem: 6 ≤ 6 — PASS
- 9/2 max common factors per problem: 6 ≤ 6 — PASS
- TypeScript: no type errors — PASS

**Limitations / not tested:**
- Playwright MCP was unavailable during this pass. Broader app flows (auth, /play, worksheet→results loop) were validated in Suite 26 but not re-run here.
- Arithmetic grading with correct answers (20/20 pass) was validated in Suite 26 but not retested here.
- 9/1 PF_POOL still includes numbers up to 120 — prime factorization of large composites is harder but not incorrect; no cap applied.

### Suite 26 — Bounded Algorithmic Random Generators (2026-04-18)
| Test | Result |
|------|--------|
| Level 1/1: 20 unique problems rendered (no repeats) | PASS |
| Level 1/1: second visit shows different problems (randomness) | PASS |
| Level 9/1: 20 problems rendered, submission flow → 0/20 blank | PASS |
| Level 9/1: second visit shows different numbers (30, 36, 84 vs 50, 110, 66) | PASS |
| Level 9/2: 20/20 correct factor pairs + common factors + GCF → ✓ Passed | PASS |
| Level 10/1: 20/20 correct linear equation answers → ✓ Passed | PASS |
| Level 10/2: 20/20 correct both-sides equations → ✓ Passed | PASS |
| Level 11/1: 20/20 correct inequality answers → ✓ Passed | PASS |
| Inequality normalization: x>N, x<N, x<=N, x>=N all grade correctly | PASS |
| Multi-token grading: factor pairs "1×12, 2×6" accepted order-insensitively | PASS |
| TypeScript: build clean, no type errors | PASS |

### Milestone 25 — In-App Feedback System (2026-04-17)

**Phase 1 — Database**
- `feedback` table created manually in Supabase SQL editor: `id`, `parent_id` (FK → auth.users), `student_id` (nullable FK → students, on delete set null), `category`, `message`, `created_at`.
- RLS enabled: parents can only insert/select their own rows (`parent_id = auth.uid()`).

**Phase 2 — Feedback form**
- `src/app/feedback/page.tsx` — protected server page. Auth guard, fetches parent's students and recent feedback. Shows success banner when `?sent=1`. Lists recent submissions below the form.
- `src/app/feedback/FeedbackForm.tsx` — client component with `useActionState`. Fields: category (select), optional student selector, message (textarea). Inline error display.

**Phase 3 — Replace mailto links**
- All "Send feedback" footer links updated from `mailto:feedback@mathstep.app` → `/feedback` in: landing page, dashboard, privacy, terms, disclaimer.
- Inline email address references in legal page body text left as-is (intentional contact address).

**Phase 4 — Feedback list**
- Recent submissions shown on `/feedback` page below form: category badge (color-coded), linked student name if applicable, date, message preview (line-clamp-3). Up to 20 most recent entries.

**Phase 5 — Server action**
- `src/app/actions/feedback.ts` — `submitFeedback` server action: validates category against allowlist, verifies student ownership if provided, inserts to `feedback` table, redirects to `/feedback?sent=1`.

No new dependencies. No DB schema changes beyond the new `feedback` table.

### Suite 25 — In-App Feedback (2026-04-17)
| Test | Result |
|------|--------|
| Landing page "Send feedback" footer link → /feedback (not mailto) | PASS |
| Dashboard "Send feedback" footer link → /feedback (not mailto) | PASS |
| /feedback loads for authenticated parent | PASS |
| Form shows category select, optional student selector (Alice, Bob), message textarea | PASS |
| Submit with category=idea, student=Alice, message → redirects to /feedback?sent=1 | PASS |
| Success banner shown after submission | PASS |
| Submission appears in "Your recent feedback" list with Idea badge, Alice name, date, message | PASS |
| Second submission (bug, no student) → appears in list at top | PASS |
| Form resets after submission (ready for new entry) | PASS |
| /play unaffected — loads student view, Start Today's Worksheet link present | PASS |
| /dashboard unaffected — student switcher, overview, recent worksheets all intact | PASS |
| TypeScript: build clean, no type errors | PASS |

### Milestone 24 — Beta Readiness Polish (2026-04-17)

**Phase 1 — Landing page**
- `src/app/page.tsx` — full rewrite. Sections: hero with logo/headline/CTAs, "How it works" 3-step cards, "Why MathStep?" 4-benefit grid, tablet/mobile note, footer with legal links + feedback mailto.
- CTAs: "Get started free" → `/signup`, "Log in" → `/login`.
- Copy clearly targets parents; positions MathStep as mastery-based daily practice, not repetitive busywork.

**Phase 2 — Legal pages**
- `src/app/privacy/page.tsx` — what we collect, children's privacy, data deletion, Supabase storage disclosure.
- `src/app/terms/page.tsx` — who can use it, beta limitations, acceptable use, no guarantees.
- `src/app/disclaimer/page.tsx` — educational tool only, no academic outcome guarantees, parental supervision, beta limitations.
- All pages: plain English, consistent brand header/footer, links to each other.

**Phase 3 — Feedback CTA**
- Feedback mailto link (`feedback@mathstep.app`) added to landing page footer and dashboard footer.
- Also linked from all legal pages.
- **Placeholder:** update `feedback@mathstep.app` to your real email before sharing publicly.

**Phase 4 — Onboarding clarity**
- `src/app/onboarding/page.tsx` — improved subtitle ("first name or nickname — that's all we need").
- For first-time parents: 3 short bullet points explaining mastery progression, multi-student support, and tablet/mobile compatibility.
- Returning parents (adding a student) see clean form without the intro bullets.

No DB schema changes. No new dependencies.

### Suite 24 — Beta Readiness Polish (2026-04-17)
| Test | Result |
|------|--------|
| Landing page renders: hero, how it works, why mathstep, footer with legal links | PASS |
| "Get started free" CTA links to /signup | PASS |
| "Log in" CTA links to /login | PASS |
| Footer: Privacy, Terms, Disclaimer, Send feedback links all present | PASS |
| /privacy loads with correct content sections | PASS |
| /terms loads with correct content sections | PASS |
| /disclaimer loads with correct content sections | PASS |
| /onboarding loads with improved subtitle copy | PASS |
| /dashboard footer shows Privacy, Terms, Disclaimer, Send feedback links | PASS |
| /play page unaffected — loads, shows student greeting and worksheet link | PASS |
| No console errors on any page | PASS |
| TypeScript: build clean, no type errors | PASS |

### Milestone 23 — Multi-Student Support (2026-04-17)

**Selection mechanism:** URL query param `?student=<uuid>`. Works natively with Next.js 16 server components. Falls back to first student (by `created_at asc`) when param is absent or doesn't match any owned student. No DB schema changes required.

**Phase 1 — Student selection model**
- `src/app/dashboard/page.tsx` — accepts `searchParams: Promise<{ student?: string }>`, fetches all students (no `.limit(1)`), resolves selected student from param or defaults to first. Student switcher (pill buttons) shown when >1 students. "Open Student View" and all internal links include `?student=<id>`.
- `src/app/play/page.tsx` — same pattern. Student switcher shown below greeting when >1 students. "Start Today's Worksheet", "Parent view" all student-scoped.
- `src/app/worksheet/page.tsx` — same pattern. "← Play" link and fallback "Back to Play" are student-scoped. Session insert uses the resolved student.
- `src/app/worksheet/results/[sessionId]/page.tsx` — fixed ownership check: fetches session first, then verifies `session.student_id` belongs to current user's students (vs old approach of checking `students[0]` only). "← Play", "Try Again", "Back to Play" all use `session.student_id` for correct routing.

**Phase 2 — Onboarding / adding students**
- `src/app/onboarding/page.tsx` — counts existing students; shows "Add another student" heading and "← Back to dashboard" link for returning parents. First-time users see original "Set up your student" heading with no back link.
- Dashboard shows "+ Add Student" button → `/onboarding`.

**Phase 3 — Actions**
- `src/app/actions/students.ts`:
  - `createStudent`: counts pre-existing students; if 0 → redirect `/play?student=<newId>` (first-time flow unchanged); if 1+ → redirect `/dashboard?student=<newId>` (parent sees new child immediately)
  - `updateStudentPlacement`: now redirects to `/dashboard?student=<studentId>` (was `/dashboard`)

No DB schema changes. No new dependencies.

### Suite 23 — Multi-Student Support (2026-04-17)
| Test | Result |
|------|--------|
| Signup (fresh email, no student) → /onboarding with "Set up your student" heading | PASS |
| Onboarding for first student: no back link shown | PASS |
| First student created → redirected to /play?student=<id> | PASS |
| /play with student param: correct greeting, stats, worksheet link includes student param | PASS |
| "Parent view" → /dashboard?student=<id> | PASS |
| /dashboard with student param: shows correct student's overview, stats, sessions | PASS |
| "+ Add Student" button present on dashboard | PASS |
| /onboarding for returning parent: "Add another student" heading, "← Back to dashboard" link | PASS |
| Second student created → redirected to /dashboard?student=<newId> | PASS |
| Dashboard shows student switcher [Alice] [Bob] when 2 students exist | PASS |
| Switching from Bob → Alice on dashboard: "Alice's Overview" loads correctly | PASS |
| "Open Student View" → /play?student=<id> for selected student | PASS |
| /play shows student switcher [Alice] [Bob] when 2 students | PASS |
| Switching Alice → Bob on /play: "Hi, Bob!" with Bob's stats | PASS |
| "Start Today's Worksheet" → /worksheet?student=<id> for selected student | PASS |
| Worksheet shows correct student name and level | PASS |
| "← Play" on worksheet → /play?student=<id> | PASS |
| Worksheet submit → results page with all links using same student id | PASS |
| Results "Back to Play" → /play?student=<id> | PASS |
| Results "Try Again" → /worksheet?student=<id> | PASS |
| Results "← Play" header → /play?student=<id> | PASS |
| Bob's session updated Bob's streak/points; Alice's stats unchanged | PASS |
| /dashboard with no param: defaults to first student (Alice) | PASS |
| Logout → login → /play (no param): defaults to first student | PASS |
| TypeScript: build clean, no type errors | PASS |

### Milestone 22 — Parent Dashboard Cleanup + History + Celebration (2026-04-17)

**Phase 1 — Parent dashboard cleanup**
- `src/app/dashboard/page.tsx` — removed "Start Today's Worksheet" CTA from parent dashboard
- "Open Student View" is now the sole full-width action button
- Page heading changed to "{student.name}'s Overview" to reinforce oversight framing

**Phase 2 — Completed worksheet history**
- Added `recentSessions` query (last 10 completed sessions) to dashboard
- Added `id` field to `allLevels` fetch; built a `Map<level_id, levelInfo>` to look up topic/level for each session row
- "Recent Worksheets" section lists each session: date, level/topic, score, accuracy, time, pass/fail badge
- Each row links to `/worksheet/results/[sessionId]` — verified navigation works

**Phase 3 — Admin controls**
- `SetLevelForm` wrapped in a `<details>` element ("Admin controls") — collapsed by default
- Full placement functionality preserved inside the collapsed section
- `SetLevelForm.tsx` — updated `Level` type to accept optional `id` field

**Phase 4 — Celebration confetti**
- `src/app/worksheet/results/[sessionId]/CelebrationEffect.tsx` — new client component
  - Generates 70 confetti pieces client-side via `useEffect` (avoids SSR hydration mismatch)
  - Inline `<style>` keyframe `confettiFall` (no globals.css changes needed)
  - Pieces: random position, size (5–14px), color (7 brand/accent colors), delay (0–1.8s), duration (2.2–3.8s)
  - Auto-cleans up after 5.5s; `pointer-events-none` + `aria-hidden` so it doesn't block interaction or accessibility
- `src/app/worksheet/results/[sessionId]/page.tsx` — mounts `<CelebrationEffect />` when `accuracy === 100 || didAdvance`
- Confirmed: triggers on 100% score, triggers on level-up, does NOT trigger on partial/failing score

No DB schema changes. No new third-party dependencies.

### Milestone 21 — Level 11/1 Inequalities (2026-04-17)
- `src/lib/math/generators/inequalities.ts` — new generator for Level 11/1
  - 4 problem subtypes: x+a>b (x>n), x-a<b (x<n), ax≤b (x<=n), x/a≥b (x>=n)
  - Fixed deterministic pools (8 per subtype); equal 25% distribution per type
  - Answers use ASCII operators (>, <, <=, >=) for easy keyboard entry; prompts show Unicode (≤ ≥)
- `src/lib/math/generators/index.ts` — added route `11/1 → generateInequalities`; exported `InequalityProblem`, `InequalityProblemType`; added to `AnyProblemType` union
- `src/lib/lessons/index.ts` — added `11/1` lesson: "One-Variable Inequalities", worked example (2x≤10 → x<=5), tip
- `src/app/worksheet/WorksheetForm.tsx` — added `inequality` case to `problemTypeLabel()`; added `inputModeForType()` helper — inequality inputs use `inputMode="text"` (not numeric) for operator keys
- `src/app/actions/worksheet.ts` — added `normalizeInequality()` and inequality branch in `gradeAnswer()`:
  - Detects correctAnswer containing `<` or `>` → uses inequality grading path
  - Normalizes: lowercase, `≤`→`<=`, `≥`→`>=`, strip all whitespace
  - Accepts: `x>4`, `X > 6`, `x  >  7`, `x≤4`, `x≥12`, `X>=10` — all grade correctly
  - Does not affect existing arithmetic/factorization/equation grading

### Milestone 20 — Level 10/2 Variables on Both Sides (2026-04-17)
- `src/lib/math/generators/linear-equations.ts` — added `generateVariablesBothSides(count)` for Level 10/2
  - Pool of 10 equations with variables on both sides (e.g. `2x + 3 = x + 8`, answers 3–8)
  - All answers positive integers; cycles pool for any count; reuses `linear_equation` type — no grading changes
- `src/lib/math/generators/index.ts` — added route `10/2 → generateVariablesBothSides`
- `src/lib/lessons/index.ts` — added `10/2` lesson: "Variables on Both Sides", worked example (3x-4=x+10 → x=7), tip
- No DB schema changes, no new dependencies

### Milestone 19 — Level 10/1 Linear Equations (2026-04-17)
- `src/lib/math/generators/linear-equations.ts` — new generator for Level 10/1
  - 5 problem subtypes: addition (x+a=b), subtraction (x-a=b), multiplication (ax=b), division (x/a=b), two-step (ax±b=c, x/a±b=c)
  - Fixed deterministic pools; integer-only answers; count-driven distribution (25/25/20/15/remainder%)
  - All answers are single integers — compatible with existing exact-match grading, no grading changes needed
- `src/lib/math/generators/index.ts` — added route `10/1 → generateLinearEquations`; exported `LinearEquationProblem` and `LinearEquationType`; added `LinearEquationType` to `AnyProblemType` union
- `src/lib/lessons/index.ts` — added `10/1` lesson: "Linear Equations", two-step worked example (2x+5=13→x=4), check step, tip
- `src/app/worksheet/WorksheetForm.tsx` — added `linear_equation` case to `problemTypeLabel()`
- No DB schema changes, no new dependencies, no grading logic changes

### Milestone 18 — Student-First Daily Flow (2026-04-17)
- `src/app/actions/auth.ts` — `signIn` and `signUp` now redirect to `/play` instead of `/dashboard`
- `src/app/actions/students.ts` — `createStudent` now redirects to `/play` instead of `/dashboard` after onboarding
- `src/app/worksheet/results/[sessionId]/page.tsx`:
  - Primary return CTA changed from "Back to Dashboard" → "Back to Play" (`/play`)
  - Header nav link changed from "← Dashboard" → "← Play" (`/play`)
- `/play` already redirects to `/onboarding` if no student — new signup flow works without changes to the page
- `/dashboard` remains fully accessible via "Parent view" link on `/play`
- No DB changes, no new dependencies

### Milestone 17 — Parent/Student Dashboard Split (2026-04-16)
- `src/lib/format.ts` — extracted `formatSpeed()` helper shared by dashboard and play pages
- `src/app/dashboard/page.tsx` — added "Open Student View" button (links to `/play`) alongside existing "Start Today's Worksheet" CTA; both in a responsive flex row; imported shared `formatSpeed`
- `src/app/play/page.tsx` — new student-facing server page at `/play`
  - Auth-protected (same pattern as dashboard)
  - Shows: student name greeting, streak 🔥, points, level, sublevel, mastery progress bar + text, current topic/description, speed target/accuracy/problems, last session summary
  - Does NOT show: parent email, placement control (SetLevelForm), admin wording
  - "Start Today's Worksheet" links to `/worksheet` (unchanged flow)
  - Subtle "Parent view" link in header returns to `/dashboard`
- No DB changes, no new dependencies, no changes to worksheet/progression logic

### Milestone 16 — Level 9/2 Factorization Continuation (2026-04-16)
- `src/lib/math/generators/factorization.ts` — extended `ProblemType` with `factor_pairs` and `common_factors`; added helpers `factorPairs()` and `commonFactors()`; added `generateFactorizationPairProblems(count)` for Level 9/2 with distribution 4 FP : 3 CF : 3 GCF
  - Factor pair pools: 10 non-square numbers (12–50); common factor pairs: 5 pairs; GCF pairs: 5 distinct from 9/1
  - Factor pairs answer format: `"1×12, 2×6, 3×4"` (sorted by first factor)
  - Common factors format: `"1, 2, 3, 6"` (sorted ascending)
  - GCF format: `"6"` (single integer — reuses existing exact-match grading)
- `src/lib/math/generators/index.ts` — added route `9/2 → generateFactorizationPairProblems`
- `src/lib/lessons/index.ts` — added `9/2` lesson: title "Factor Pairs and Common Factors", explanation, worked example (factor pairs of 12 + GCF of 12 and 18), and tip
- `src/app/worksheet/WorksheetForm.tsx` — added `factor_pairs` and `common_factors` cases to `problemTypeLabel()`
- No DB changes, no new dependencies, no grading logic changes

### Milestone 15 — Parent Placement Control (2026-04-16)
- `src/app/actions/students.ts` — added `updateStudentPlacement` server action
  - Verifies authenticated parent owns the student (RLS + explicit `parent_id` check)
  - Verifies target level exists in `levels` table before updating
  - Updates `students.current_level` and `students.current_sublevel`
  - Resets `student_level_progress.consecutive_passes` to 0 for the new level (if a row exists), preventing stale mastery carry-over
  - Redirects to `/dashboard` on success; returns `{ error }` on failure
- `src/app/dashboard/SetLevelForm.tsx` — new client component
  - Combined `<select>` listing all curriculum levels as "Level X.Y — Topic: Description"
  - Defaults to current placement; `useActionState` for inline error display
  - Styled consistently with brand system
- `src/app/dashboard/page.tsx` — fetches all levels, renders `SetLevelForm` below Current Focus card
  - Shows current placement ("Currently on Level X.Y") inline in the form
  - Stats row (Level / Sublevel cards) continues to reflect live placement
  - TypeScript: no type errors

### Milestone 14 — Worksheet Scratchpad (2026-04-16)
- `src/app/worksheet/WorksheetScratchpad.tsx` — client component with HTML5 canvas drawing area
  - Pointer events (mouse, touch, stylus) via `onPointerDown/Move/Up/Cancel`
  - `setPointerCapture` ensures strokes aren't interrupted when pointer leaves canvas
  - `touch-none` CSS class (`touch-action: none`) prevents page scroll while drawing
  - Stylus pressure support: line width scales with `e.pressure` for pen input
  - Clear button wipes canvas via `clearRect`
  - Canvas auto-resizes to container width on mount and window resize, restoring drawing content
  - 320px fixed height — large enough for tablet use
- `src/app/worksheet/page.tsx` — imports and renders `<WorksheetScratchpad />` below `<WorksheetForm>`
- No DB changes, no third-party libraries, no changes to grading/session/progression logic

### Milestone 13 — Lesson Cards / Learn System (2026-04-16)
- `src/lib/lessons/index.ts` — static lesson content for all 7 supported levels (1/1, 1/2, 2/1, 2/2, 3/1, 3/2, 9/1). Each entry has: `title`, `explanation`, `example` (problem, steps[], answer), `tip`. Exported `getLesson(level, sublevel)` returns `Lesson | null`.
- `src/app/worksheet/LessonCard.tsx` — collapsible `<details>` card (open by default, zero JS). Shows title, explanation, worked example with numbered steps, answer badge, and tip in amber box. Visually consistent with brand system.
- `src/app/worksheet/page.tsx` — calls `getLesson()` and renders `<LessonCard>` above `<WorksheetForm>` when content exists. Gracefully skipped if `null`.
- No DB changes, no new dependencies, no logic changes to grading/session/progression.

---

### Milestone 12 — PWA Setup (2026-04-15)
- `public/icon-192.png` — generated from `math-step-logo.png` via sharp, 192×192
- `public/icon-512.png` — generated from `math-step-logo.png` via sharp, 512×512
- `public/manifest.webmanifest` — name, short_name, description, start_url, display: standalone, theme_color: #2d6a35, background_color: #f7faf7, both icons with `any maskable` purpose
- `src/app/layout.tsx` — added `manifest`, `themeColor`, `appleWebApp`, and `icons.apple` to Next.js `Metadata` export
- Manifest served at 200, icons serve at 200, HTML contains `<link rel="manifest">`, `<link rel="apple-touch-icon">`, and `mobile-web-app-capable` meta tags
- TypeScript: no type errors
- No service worker / offline caching added (not needed for basic installability)

---

### Milestone 11 — Visual Design Refresh (2026-04-15)
- `public/math-step-logo.png` — logo copied to public folder for Next.js Image serving
- `src/app/globals.css` — brand token palette added (`--brand-50` through `--brand-900`, `--background`, `--surface`)
- `src/app/layout.tsx` — metadata title/description updated to MathStep brand copy
- All pages refreshed with cohesive `#BAE0BD` brand system:
  - `src/app/page.tsx` — home: logo, green CTA, soft tagline
  - `src/app/login/page.tsx` — card layout, logo, brand inputs/button
  - `src/app/signup/page.tsx` — same pattern as login
  - `src/app/onboarding/page.tsx` + `OnboardingForm.tsx` — logo, card, brand inputs
  - `src/app/dashboard/page.tsx` — logo header, stat cards with brand borders, CTA button, last session/current focus cards
  - `src/app/worksheet/page.tsx` — branded header, logo, fallback states updated
  - `src/app/worksheet/WorksheetForm.tsx` — brand timer, green number badges, larger inputs (`inputMode="numeric"`)
  - `src/app/worksheet/results/[sessionId]/page.tsx` — pass/fail score card, mastery progress, problem review, two-button footer
- TypeScript: no type errors

---

### Milestone 10 — Multiplication Generators (2026-04-15)
- `src/lib/math/generators/multiplication.ts` — two generators:
  - `generateBasicMultiplication(count)` — 10 fixed pairs, single-digit × single-digit facts (e.g. 2×3, 4×5, 9×3), for Level 3/1
  - `generateMultiDigitMultiplication(count)` — 10 fixed pairs, two-digit × one-digit (e.g. 12×3, 14×2, 16×5), for Level 3/2
- `src/lib/math/generators/index.ts` — router extended: 3/1 → basic multiplication, 3/2 → multi-digit multiplication; exports `MultiplicationProblem`, `MultiplicationProblemType`, updated `AnyProblemType` union
- `WorksheetForm.tsx` — `multiplication` case added to `problemTypeLabel()` switch
- Grading: no changes needed — existing single-integer exact match handles multiplication answers correctly

### Milestone 9 — Subtraction Generators (2026-04-15)
- `src/lib/math/generators/subtraction.ts` — two generators:
  - `generateSingleDigitSubtraction(count)` — 10 fixed pairs, results 0–9, no negatives, for Level 2/1
  - `generateDoubleDigitSubtraction(count)` — 10 fixed pairs, age-appropriate double-digit, manageable borrowing, for Level 2/2
- `src/lib/math/generators/index.ts` — router extended: 2/1 → single-digit subtraction, 2/2 → double-digit subtraction; exports `SubtractionProblem`, `SubtractionProblemType`, and updated `AnyProblemType` union
- `WorksheetForm.tsx` — `subtraction` case added to `problemTypeLabel()` switch
- Grading: no changes needed — existing single-integer exact match handles subtraction answers correctly

### Milestone 8 — Variable Problem Count from Curriculum Metadata (2026-04-15)
- `generateProblems(levelNumber, sublevelNumber, count)` — added required `count` param to the router
- `generateSingleDigitAddition(count)` — cycles the 10-pair pool to fill any requested count
- `generateDoubleDigitAddition(count)` — same pattern for 10 double-digit pairs
- `generateFactorizationProblems(count)` — distributes count across 4 subtypes at 3:2:3:2 ratio, cycles each pool, remainder assigned to LCM so total always equals count exactly
- `worksheet/page.tsx` — reads `level.problems_per_session` and passes it as count to `generateProblems()`. DB insert, grading, results all use `problems.length` — no hardcoded 10 anywhere

### Milestone 7 — Addition Generators + Grading Fix (2026-04-15)
- `src/lib/math/generators/addition.ts` — two generators:
  - `generateSingleDigitAddition()` — 10 fixed pairs, sums within 10, for Level 1/1
  - `generateDoubleDigitAddition()` — 10 fixed pairs, double-digit operands with mild carrying, for Level 1/2
- `src/lib/math/generators/index.ts` — generator router updated: routes 1/1 → single-digit, 1/2 → double-digit, 9/1 → factorization, all others → `[]` (Coming Soon)
- `WorksheetForm.tsx` — type updated from `MathProblem['type']` to `AnyProblemType` union; `addition` case added to `problemTypeLabel()`
- Grading fix in `worksheet.ts`: replaced digit-sort normalization for single-number answers with exact integer comparison — prevents `"36"` matching `"63"` for addition/GCF/LCM answers; multi-token answers (prime factorization, list factors) still use order-insensitive sort

### Milestone 6 — Level Progression (2026-04-15)
- Worksheet routing now uses student's actual `current_level` / `current_sublevel` — no more hardcoded 9/1
- Unsupported levels (no generator) show a "Coming Soon" message without creating a session
- `student_level_progress` upserted on every submission: `consecutive_passes` increments on pass, resets to 0 on fail
- Level advancement: when `consecutive_passes >= consecutive_passes_required`, student advances to next level (ordered by `level_number asc, sublevel_number asc`); old level progress reset to 0 after advance
- If no next level exists, student stays at current level (no crash)
- Results page shows advancement banner ("Level Up! Advanced to Level X.Y — Topic") or mastery progress ("N / M passes, X more to advance")
- Dashboard "Mastery progress" stat replaced "Passes required" — shows `consecutive_passes / consecutive_passes_required` live
- Dev-mode warning banner removed (was only relevant when level was hardcoded)

### Milestone 5 — Session Flow (2026-04-15)
- Pass/fail now uses both accuracy threshold AND speed target (`accuracy >= threshold && timeTaken <= speedTarget`)
- Streak updates on session submit: `current_streak`, `longest_streak`, `total_sessions`, `total_points`, `last_session_date`
  - Streak increments if last session was yesterday, resets if gap > 1 day, unchanged if same day
  - Points: +10 for completion, +15 (i.e. +5 pass bonus) if passed
- Ownership check on results page: verifies `session.student_id` belongs to the authenticated parent's student
- Last session summary card on dashboard (score, accuracy, time, pass/fail badge)
- Fixed dashboard streak/points query: switched from PostgREST embedded join (`streaks(...)` on students) to direct `streaks` select — the join was returning stale cached values

### Milestone 4 — Worksheet Engine Foundation
- `src/lib/math/generators/factorization.ts` — pure algorithmic generator for level 9/1 (Factorization)
  - 10 problems per session: 3 prime factorization, 2 list factors, 3 GCF, 2 LCM
  - Deterministic fixed pools; no randomness; canonical answer formats
  - Helpers: `primeFactors()`, `allFactors()`, `gcd()`, `lcm()`
- `src/lib/math/generators/index.ts` — level router (`generateProblems(levelNumber, sublevelNumber)`)
- `src/app/worksheet/page.tsx` — protected server page
  - Auth guard + student fetch + level metadata fetch
  - Dev mode notice when student is not on 9/1
  - Timer placeholder (00:00)
  - 10 numbered problems with answer input fields
  - Disabled submit button placeholder
- Dashboard updated: "Start Today's Worksheet" button links to `/worksheet`

### Milestone 3 — Curriculum / Levels Data Layer
- Dashboard fetches matching `levels` row by `(level_number, sublevel_number)`
- "Current Focus" card renders: topic, description, speed target (formatted), accuracy %, problems/session, passes required
- Safe fallback if no level record found — no crash
- `formatSpeed()` helper converts seconds to human-readable string

### Milestone 2 — Student Onboarding
- `src/app/onboarding/page.tsx` — protected server page
- `src/app/onboarding/OnboardingForm.tsx` — client form with `useActionState`
- `src/app/actions/students.ts` — `createStudent` server action: inserts student + streak row
- Dashboard redirects to `/onboarding` if no students found
- Dashboard updated to show student name, level, sublevel, streak, total points

### Milestone 1 — Auth + Base Setup
- Supabase installed and configured (`@supabase/ssr`, `@supabase/supabase-js`)
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — async server client
- `src/lib/supabase/middleware.ts` — `updateSession` for session refresh
- `src/middleware.ts` — runs on all non-static routes
- `src/app/login/page.tsx` — email + password login, inline errors
- `src/app/signup/page.tsx` — name + email + password signup, inline errors
- `src/app/actions/auth.ts` — `signIn`, `signUp`, `signOut` server actions
- `src/app/page.tsx` — home with Login / Sign Up buttons
- `.env.local` — Supabase URL and anon key configured

---

## Playwright Test Results

### Suite 22 — Parent Dashboard + History + Celebration (2026-04-17)
| Test | Result |
|------|--------|
| /dashboard no longer shows "Start Today's Worksheet" button | PASS |
| /dashboard shows "Open Student View" as full-width button | PASS |
| "Open Student View" navigates to /play | PASS |
| /dashboard shows "Recent Worksheets" section | PASS |
| Recent Worksheets shows completed session rows with date, score, accuracy, time, pass badge | PASS |
| Each session row links to correct /worksheet/results/[sessionId] URL | PASS |
| Session link navigates to results page successfully | PASS |
| "No completed worksheets yet." shown when no sessions exist | PASS |
| SetLevelForm hidden inside collapsed "Admin controls" <details> section | PASS |
| Admin controls collapsed by default | PASS |
| SetLevelForm placement functionality works inside admin controls | PASS |
| 100% accuracy result triggers confetti (70 pieces in DOM, aria-hidden) | PASS |
| Level-up result triggers confetti (70 pieces in DOM, confirmed via evaluate) | PASS |
| Partial/failing result (0/20) does NOT trigger confetti | PASS |
| Confetti auto-expires after 5.5s (setPieces(null) cleanup) | PASS |
| Level-up banner ("Level Up! Advanced to Level 1.2 — Addition") renders correctly | PASS |
| /play student flow unaffected — Start Worksheet, results, back to play all work | PASS |
| TypeScript: build clean, no type errors | PASS |

### Suite 20 — Levels 10/2 and 11/1 Bundle (2026-04-17)
| Test | Result |
|------|--------|
| Manual placement to 10/2 via dashboard: Level/Sublevel stats update to 10/2 | PASS |
| Dashboard "Currently on Level 10.2" label correct | PASS |
| 10/2 worksheet loads with 20 real variables-both-sides problems (no Coming Soon) | PASS |
| 10/2 lesson card: "Learn: Variables on Both Sides" with worked example (3x-4=x+10 → x=7) | PASS |
| 10/2 problem types: all "Linear Equation", prompts include both-sides format (e.g. "2x + 3 = x + 8") | PASS |
| 10/2 correct answers (20/20): ✓ Passed, mastery 1/3 | PASS |
| 10/2 wrong answers (all "999"): ✗ Not passed, consecutive passes reset | PASS |
| Manual placement to 11/1 via dashboard: Level/Sublevel stats update to 11/1 | PASS |
| 11/1 worksheet loads with 20 real inequality problems (no Coming Soon) | PASS |
| 11/1 lesson card: "Learn: One-Variable Inequalities" with worked example (2x≤10 → x<=5) | PASS |
| 11/1 problem types: all 4 inequality types (>, <, <=, >=) across 20 problems | PASS |
| 11/1 correct answers (20/20, standard format): ✓ Passed, mastery 1/3 | PASS |
| 11/1 wrong answers (all "x > 999" etc.): ✗ Not passed, reset | PASS |
| 11/1 normalization: `x>4` (no spaces) accepted | PASS |
| 11/1 normalization: `X > 6` (uppercase) accepted | PASS |
| 11/1 normalization: `x  >  7` (extra spaces) accepted | PASS |
| 11/1 normalization: `x≤4` (Unicode ≤) accepted | PASS |
| 11/1 normalization: `x≥10` (Unicode ≥) accepted | PASS |
| 11/1 normalization: `X>=10` (uppercase, no spaces) accepted | PASS |
| 11/1 normalization session: 20/20 all variants ✓ Passed | PASS |
| /play flow works at 11/1: student view, topic, progress bar | PASS |
| Unsupported level 11/2: worksheet shows "Coming Soon — Simultaneous Equations" | PASS |
| 10/2 → 11/1 natural advancement: 3 passing sessions at 10/2 → "Level Up! Advanced to Level 11.1 — Inequalities" | PASS |
| URL on advancement: `?advanced=1&nl=11&ns=1&nt=Inequalities` | PASS |
| TypeScript: build clean, no type errors | PASS |

### Suite 19 — Level 10/1 Linear Equations (2026-04-17)
| Test | Result |
|------|--------|
| Manual placement to 10/1 via dashboard: Level/Sublevel stats update to 10/1 | PASS |
| Dashboard Current Focus shows "Linear Equations / Two-step equations" | PASS |
| 10/1 worksheet loads with 20 real linear equation problems (no Coming Soon) | PASS |
| Lesson card shows "Learn: Linear Equations" with two-step worked example and tip | PASS |
| Problem types present: addition, subtraction, multiplication, division, two-step | PASS |
| 10/1 correct answers (20/20): 100%, ✓ Passed, mastery 1/3 | PASS |
| 10/1 wrong answers (all "999"): 0/20, 0%, ✗ Not passed, mastery reset to 0/3 | PASS |
| 9/2 → 10/1 natural advancement: 3 passing sessions at 9/2 → "Level Up! Advanced to Level 10.1 — Linear Equations" | PASS |
| Dashboard after 9/2→10/1 advancement: Level 10 / Sublevel 1, mastery reset to 0/3 | PASS |
| Unsupported level 10/2: worksheet shows "Coming Soon" with correct topic | PASS |
| TypeScript: build clean, no type errors | PASS |

### Suite 18 — Student-First Daily Flow (2026-04-17)
| Test | Result |
|------|--------|
| Signup (fresh timestamp email, no student) → routes to /onboarding | PASS |
| Onboarding complete → lands at /play (not /dashboard) | PASS |
| /play shows student greeting, streak, points, level, topic | PASS |
| /play has "Parent view" link → /dashboard | PASS |
| /dashboard accessible from /play via "Parent view" | PASS |
| "Start Today's Worksheet" from /play → /worksheet | PASS |
| Worksheet submits (20/20 correct) → lands on results page | PASS |
| Results page header shows "← Play" linking to /play | PASS |
| Results page primary CTA shows "Back to Play" linking to /play | PASS |
| "Back to Play" CTA navigates to /play | PASS |
| Logout → /login; login with same credentials → lands at /play | PASS |
| TypeScript: build clean, no type errors | PASS |

### Suite 17 — Parent/Student Dashboard Split (2026-04-16)
| Test | Result |
|------|--------|
| /dashboard loads as parent view with email, stats, placement control | PASS |
| /dashboard shows "Open Student View" button linking to /play | PASS |
| /play loads with student greeting (no parent email) | PASS |
| /play shows streak, points, level, sublevel | PASS |
| /play shows current topic + mastery progress bar | PASS |
| /play shows last session summary | PASS |
| /play has NO "Set Level" form or placement controls | PASS |
| /play has NO parent email visible | PASS |
| "Start Today's Worksheet" from /play navigates to /worksheet | PASS |
| Worksheet flow from /play unchanged (Coming Soon for Level 10.1 as expected) | PASS |
| /play has subtle "Parent view" link back to /dashboard | PASS |
| Auth guard on /play: unauthenticated → redirect /login (code-verified, same pattern as /dashboard) | PASS |
| TypeScript: no type errors (build clean) | PASS |

### Suite 16 — Level 9/2 Factor Pairs and Common Factors (2026-04-16)
| Test | Result |
|------|--------|
| Placement to 9.2 via dashboard: Level/Sublevel stats update to 9/2 | PASS |
| Dashboard Current Focus shows "Factorization / Factor pairs and common factors" | PASS |
| 9/2 worksheet loads with 20 problems (no Coming Soon) | PASS |
| Lesson card shows "Learn: Factor Pairs and Common Factors" with correct content | PASS |
| Problem types present: factor_pairs (8), common_factors (6), gcf (6) at count=20 | PASS |
| Factor pair prompts: "List all factor pairs of N. Write each pair as A×B" | PASS |
| Common factor prompts: "List all common factors of A and B" | PASS |
| GCF prompts: "Find the greatest common factor (GCF) of A and B" | PASS |
| 9/2 correct answers: 20/20, 100%, ✓ Passed, mastery 1/3 | PASS |
| 9/2 wrong answers (all "999"): 0/20, ✗ Not passed | PASS |
| 9/1 → 9/2 natural progression: 3 passing sessions at 9/1 → Level Up banner "Advanced to Level 9.2 — Factorization" | PASS |
| Dashboard after advancement: Level 9 / Sublevel 2, mastery reset to 0/3 | PASS |
| Unsupported level 10/1: worksheet shows "Coming Soon" with correct topic | PASS |
| TypeScript: no type errors | PASS |

### Suite 15 — Parent Placement Control (2026-04-16)
| Test | Result |
|------|--------|
| Dashboard loads with new "Set Level" section | PASS |
| Combined select shows all 24 curriculum levels in order | PASS |
| Current level (1.1) is pre-selected on fresh student | PASS |
| "Currently on Level 1.1" label shown correctly | PASS |
| Select Level 9.1 → click Update Placement → dashboard reloads | PASS |
| Stats row shows Level 9 / Sublevel 1 after update | PASS |
| Current Focus updates to Factorization / Prime factorization and factors | PASS |
| "Currently on Level 9.1" label updates correctly | PASS |
| Select in "Set Level" defaults to new placement (9.1 selected) | PASS |
| Worksheet loads Factorization Worksheet at Level 9.1 after placement change | PASS |
| Ownership check enforced in server action (parent_id match required) | PASS (code verified) |
| TypeScript: no type errors | PASS |

### Suite 14 — Scratchpad (2026-04-16)
| Test | Result |
|------|--------|
| Worksheet loads at Level 1.2 with scratchpad visible below form | PASS |
| Canvas renders at 726×320px (full container width × fixed height) | PASS |
| "Working Area" heading and "Clear" button present | PASS |
| Worksheet submit with 20 correct answers: Score 20/20, Passed | PASS |
| Results page redirects correctly — existing flow unbroken | PASS |
| TypeScript: no type errors | PASS |

---

### Suite 13 — Lesson Cards (2026-04-16)
| Test | Result |
|------|--------|
| Level 1/1 worksheet shows Learn card: "Learn: Single-Digit Addition" with explanation, worked example (6+3=9), 3 steps, tip | PASS |
| Level 1/2 worksheet shows Learn card: "Learn: Double-Digit Addition" — different content to 1/1 | PASS |
| Level card is collapsible via `<details>` — shows "Hide" when open, "Show" when closed | PASS |
| Worksheet still submits correctly with lesson card present — 20/20, Passed | PASS |
| Level progression still works — 3 passes advanced from 1/1 → 1/2 as expected | PASS |
| TypeScript: no type errors | PASS |

---

### Suite 10 — Multiplication Generators (2026-04-15)
| Test | Result |
|------|--------|
| 2/2 → 3/1 advancement (3 passes): Level Up banner shows `nl=3&ns=1&nt=Multiplication` | PASS |
| 3/1 worksheet heading: "Multiplication Worksheet" at Level 3.1 | PASS |
| 3/1 first problems: "2 × 3 = ?", "4 × 5 = ?", "3 × 6 = ?" (basic facts) | PASS |
| 3/1 correct answers: 20/20, 100%, Passed, mastery 1/3 | PASS |
| 3/1 wrong answers: 0/20, 0%, Not passed (grading rejects incorrect) | PASS |
| 3/1 → 3/2 advancement (3 passes): Level Up banner shows `nl=3&ns=2&nt=Multiplication` | PASS |
| 3/2 worksheet heading: "Multiplication Worksheet" at Level 3.2 | PASS |
| 3/2 first problems: "12 × 3 = ?", "14 × 2 = ?" (two-digit × one-digit) | PASS |
| 3/2 correct answers: 20/20, 100%, Passed | PASS |
| Dashboard after 3/2: Level 3, Sublevel 2, Mastery 1/3 | PASS |
| TypeScript: no type errors across all modified files | PASS |

### Suite 9 — Subtraction Generators (2026-04-15)
| Test | Result |
|------|--------|
| 1/1 → 1/2 advancement (3 passes): Level Up banner shows `nl=1&ns=2&nt=Addition` | PASS |
| 1/2 → 2/1 advancement (3 passes): Level Up banner shows `nl=2&ns=1&nt=Subtraction` | PASS |
| 2/1 worksheet heading: "Subtraction Worksheet" at Level 2.1 | PASS |
| 2/1 first problems: "8 - 3 = ?", "9 - 4 = ?", "7 - 2 = ?" (single-digit) | PASS |
| 2/1 correct answers: 20/20, 100%, Passed, mastery 1/3 | PASS |
| 2/1 → 2/2 advancement (3 passes): Level Up banner shows `nl=2&ns=2&nt=Subtraction` | PASS |
| 2/2 worksheet heading: "Subtraction Worksheet" at Level 2.2 | PASS |
| 2/2 first problems: "25 - 13 = ?", "38 - 14 = ?" (double-digit) | PASS |
| 2/2 correct answers: 20/20, 100%, Passed | PASS |
| 2/2 wrong answers: 0/20, 0%, Not passed (grading rejects incorrect) | PASS |
| Dashboard after 2/2: Level 2, Sublevel 2, "Subtraction / Double-digit subtraction", mastery 1/3 | PASS |
| TypeScript: no type errors across all modified files | PASS |

### Suite 8 — Variable Problem Count (2026-04-15)
| Test | Result |
|------|--------|
| Level 1/1 worksheet shows 20 problems (matches problems_per_session=20) | PASS |
| Problems 11–20 cycle correctly (pool of 10, cycled) | PASS |
| Submit 20/20 correct answers: Score 20/20, 100%, Passed | PASS |
| Mastery progress increments (1/3 → 2/3 → 3/3) over 3 sessions | PASS |
| Level Up to 1/2 after 3 passes | PASS |
| Level 1/2 worksheet shows 20 problems (matches problems_per_session=20) | PASS |
| Level 1/2 first problem is double-digit: "10 + 15 = ?" | PASS |
| Submit 20/20 for 1/2: Score 20/20, 100%, Passed | PASS |
| Dashboard Last Session shows 20/20 after 1/2 completion | PASS |
| Factorization distribution math verified: count=10 → 3+2+3+2=10, count=20 → 6+4+6+4=20 | PASS |
| TypeScript: no type errors across all modified files | PASS |

### Suite 7 — Addition Generators (2026-04-15)
| Test | Result |
|------|--------|
| Fresh signup → onboarding → dashboard at Level 1/1 | PASS |
| Dashboard shows Addition / Single-digit addition, 0/3 mastery | PASS |
| Worksheet at 1/1 loads 10 real addition problems (not Coming Soon) | PASS |
| Problems show correct format: "2 + 3 = ?" with Addition label | PASS |
| Submitting correct answers: 10/10, 100%, Passed, mastery 1/3 | PASS |
| Session 2 pass: mastery 2/3, "1 more passing session to advance" | PASS |
| Session 3 pass: Level Up! Advanced to Level 1.2 — Addition | PASS |
| Dashboard after advancement: Level 1 / Sublevel 2, Double-digit addition | PASS |
| Worksheet at 1/2 loads 10 double-digit addition problems | PASS |
| Submitting correct answers for 1/2: 10/10, Passed | PASS |
| Grading fix: "36" rejected for correct answer "63" (9/10 score) | PASS |
| Unsupported levels (2/1, 5/3): generator returns 0 problems → Coming Soon | PASS (verified via routing logic) |
| TypeScript: no type errors across all modified files | PASS |

### Suite 6 — Level Progression (2026-04-15)
| Test | Result |
|------|--------|
| Auth: signup → onboarding → dashboard | PASS |
| Dashboard shows Mastery progress 0/3 for new student | PASS |
| Worksheet shows "Coming Soon" for unsupported level (1/1) | PASS |
| No session created for unsupported level | PASS |
| Worksheet loads with correct problems for supported level (9/1) | PASS |
| Failing session: consecutive passes reset to 0, results show "Keep practicing" | PASS |
| Dashboard after fail: still Level 9.1, Mastery 0/3 | PASS |
| Passing session 1: consecutive passes increments to 1, results show "2 more to advance" | PASS |
| Passing session 2: consecutive passes increments to 2, results show "1 more to advance" | PASS |
| Passing session 3: advancement triggered, results show "Level Up! Advanced to Level 9.2" | PASS |
| Dashboard after advancement: Level 9/2, Mastery 0/3 reset, new topic shown | PASS |
| Worksheet at Level 9.2: "Coming Soon" fallback (no generator), no session created | PASS |
| Logout and login: auth still works | PASS |

### Suite 5 — Session Flow (2026-04-15)
| Test | Result |
|------|--------|
| Submit correct answers → results page shows 10/10, 100%, Passed | PASS |
| Results page ownership check — bogus session ID redirects to dashboard | PASS |
| Dashboard shows Last Session card after completion | PASS |
| Dashboard streak increments to 1 after first session | PASS |
| Dashboard points show +15 for a pass (10 complete + 5 bonus) | PASS |
| Submit wrong answers → results shows 0/10, 0%, Not passed | PASS |
| Dashboard after fail: streak unchanged (same day), points +10 only | PASS |

### Suite 4 — Worksheet Foundation (2026-04-15)
| Test | Result |
|------|--------|
| Signup + onboarding → dashboard | PASS |
| Dashboard shows "Start Today's Worksheet" button | PASS |
| Worksheet page loads for authenticated user | PASS |
| Dev mode notice shown (student on level 1/1, not 9/1) | PASS |
| 10 problems rendered with correct type labels | PASS |
| 10 answer input fields present | PASS |
| Submit button rendered (disabled placeholder) | PASS |
| Mobile layout (390px) clean and usable | PASS |

### Suite 3 — Curriculum Layer (2026-04-15)
| Test | Result |
|------|--------|
| Existing user login | PASS |
| Dashboard loads with Current Focus card | PASS |
| Fresh signup → onboarding → dashboard with level data | PASS |
| Logout | PASS |

### Suite 2 — Onboarding (2026-04-15)
| Test | Result |
|------|--------|
| Home page loads | PASS |
| Sign up with fresh email | PASS |
| New user redirected to /onboarding | PASS |
| Create student, redirect to /dashboard | PASS |
| Dashboard shows student info | PASS |
| Logout | PASS |
| Login as returning user | PASS |

### Suite 1 — Auth Flow (2026-04-15)
| Test | Result |
|------|--------|
| Home page loads | PASS |
| Sign up | PASS |
| Redirect to /dashboard | PASS |
| Logout | PASS |
| Login | PASS |
| Redirect to /dashboard | PASS |
| Logout | PASS |

---

## Important Fixes Made

- **Dashboard streaks query** — switched from `students.select('*, streaks(...)')` PostgREST embedding to a direct `streaks.select(...).eq('student_id', student.id)`. The embedded join was returning stale data (appeared to return the default 0 values rather than updated values). Direct query works correctly.
- **`server.ts` setAll try/catch** — wrapped cookie `setAll` in try/catch. Without it, Server Components calling `getUser()` when a token refresh triggers a `setAll` would throw. Middleware handles the actual refresh; the try/catch silences the expected error in Server Component context.
- **`total_points` column location** — original plan put `total_points` on `students`. Real schema has it on `streaks`. Corrected after introspecting the live database.
- **`streaks` insert** — original plan passed `current_streak: 0` explicitly. Real schema defaults it; passing it caused no error but was unnecessary. Removed.
- **`students` insert** — removed `total_points: 0` from insert payload after confirming column doesn't exist on that table.

---

## Immediate Next Tasks

1. Deployment prep — Vercel or similar
2. Add generators for remaining curriculum levels (4/1, 4/2, etc.) as needed
