# MathStep — Build Progress

> Rolling log. Most recent entries at the top of each section.

---

## Current Status

**Phase:** PWA basics added. App is installable on mobile.
**Next:** Deploy to Vercel (or similar) to test real mobile install flow.

---

## Completed Milestones

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

1. Add generators for remaining curriculum levels (4/1, 4/2, etc.) as needed
2. Deployment prep — Vercel or similar
