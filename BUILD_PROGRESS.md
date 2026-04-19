# MathStep — Build Progress

> Rolling log. Most recent entries at the top of each section.

---

## Current Status

**Phase:** Milestone 45 — Stuck-Mode Support v1. ✓ Warm-up system built. TypeScript clean. Unit tests: 17/17 pass.
**Next:** Deploy to Vercel (or similar) to test real mobile install flow.

---

### Milestone 45 — Stuck-Mode Support v1 (2026-04-19)

**What was added:**
Stuck-mode support layer so students struggling on a level get guided help instead of just an encouragement nudge.

**Files added:**
- `src/lib/levelKeys.ts` — shared `SUPPORTED_LEVEL_KEYS` (extracted from worksheet/page.tsx)
- `src/lib/math/warmup.ts` — `getWarmupSourceLevel()` + `generateWarmupProblems()` (X.2 → X.1 strategy)
- `src/app/worksheet/WarmupSection.tsx` — client component: 5 warm-up problems, client-side grading, no DB persistence
- `src/app/worksheet/StuckSupportCard.tsx` — client component: collapsed-by-default support card wrapping WarmupSection

**Files modified:**
- `src/app/worksheet/page.tsx` — imports from `levelKeys.ts`, detects stuck (last 5 sessions), generates warm-up server-side, renders `StuckSupportCard` between LessonCard and WorksheetForm
- `src/app/play/page.tsx` — enhanced stuck card: explains lesson + warm-up available on worksheet
- `src/app/dashboard/page.tsx` — parent notice updated to mention worked example + warm-up on worksheet

**Warm-up strategy:**
- X.2 levels (1/2, 2/2, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2, 9/2, 10/2, 11/2): warm-up = matching X.1 generator (same topic, easier sublevel)
- X.1 levels and 1/1: warm-up not available — falls back to lesson review only (StuckSupportCard still shows, but without warm-up button)
- Warm-up: 5 problems, graded client-side using shared `gradeAnswer`, not persisted to DB, not counted toward mastery

**Behavior:**
- Non-stuck students: no StuckSupportCard shown (unchanged worksheet)
- Stuck student on X.2 level: sees "Need a little help?" card with a "Try warm-up problems first" button
- Stuck student on X.1 level: sees "Need a little help?" card pointing to the Learn card (no warm-up button)
- Warm-up: collapsed by default, revealed on click, student checks answers, then "Continue to worksheet →"
- LessonCard remains visible and open for all students as before

**Unit tests (17/17 PASS):**
| Test | Result |
|------|--------|
| isStudentStuck: [] | PASS |
| isStudentStuck: 2 items | PASS |
| isStudentStuck: pass/fail/fail | PASS |
| isStudentStuck: 3 consecutive fails | PASS |
| isStudentStuck: 4 of 5 fails | PASS |
| isStudentStuck: 2 of 5 fails | PASS |
| getWarmupSourceLevel: 1/1 → null | PASS |
| getWarmupSourceLevel: 1/2 → [1,1] | PASS |
| getWarmupSourceLevel: 5/2 → [5,1] | PASS |
| getWarmupSourceLevel: 7/1 → null | PASS |
| getWarmupSourceLevel: 11/2 → [11,1] | PASS |
| generateWarmupProblems: 1/1 → [] | PASS |
| generateWarmupProblems: 1/2 → 5 problems | PASS |
| generateWarmupProblems: 1/2 type = addition | PASS |
| generateWarmupProblems: 5/2 → 5 problems | PASS |
| generateWarmupProblems: 11/2 → 5 problems | PASS |
| generateWarmupProblems: 11/2 type = inequality | PASS |

**TypeScript build:** Clean (no errors).

**Limitations of v1:**
- Browser testing blocked: no test credentials available in codebase. Flows verified via unit tests + code review.
- Warm-up only available for X.2 levels (11 of 22). X.1 levels show lesson review only.
- Warm-up uses the previous sublevel's generator; no custom "reduced difficulty" variants.
- Stuck detection on worksheet runs a fresh DB query (5 rows) — acceptable for v1.
- No warm-up for 1/1 (first level — nothing prior to fall back to).

---

### Milestone 44 — Beta Hardening Pass (2026-04-19)

**What was done:**
Broad regression + UX review across all major flows in preparation for inviting 5–20 beta testers.

**Flows tested:**
- Signup → onboarding (Level 1 path and placement quiz path)
- Placement diagnostic: 12-question v2, mid-path placement (7.1), all-pass placement (9.1), apply recommendation
- Login / logout / unauthenticated redirect guards
- Parent dashboard: student tabs, analytics, recent worksheets, Current Focus card, Admin controls
- Play page: student switcher, stats, last session card, stuck detector wiring
- Worksheet: Level 1.1 (Addition), Level 11.2 (Simultaneous Equations), all 20 problems, lesson card, timer
- Worksheet submit: correct 20/20, wrong 17/20, mastery counter update
- Results page: score card, mastery progress, problem review, self-correction (correct + wrong attempts)
- Self-correction: "✓ Corrected" badge, counter update, wrong attempt error display
- Multi-student: add second student, switcher on play page and dashboard, student-scoped data
- Admin placement override: set unsupported level (12.1 → Coming Soon), set 11.2 → worksheet loads
- Feedback: form submit, success banner, recent submissions list
- Static pages: privacy, terms, disclaimer — all load
- Wrong credentials error display

**Issues found and fixed:**

1. **CorrectionInput placeholder misleading for non-numeric levels**
   - Was: `"Correct answer for: number"` for all non-inequality types
   - Now: `"e.g. x = 3, y = 7"` for sim-eq, `"e.g. 5x + 2"` for algebra, `"your answer"` for integers
   - Also: sim-eq input width widened from `w-36` to `w-48`
   - File: `src/app/worksheet/results/[sessionId]/CorrectionInput.tsx`

2. **Play page "Last session" card showed cross-level session after placement override**
   - Was: fetched most-recent session across all levels — confusing after admin level change
   - Now: filtered to current level only (same pattern as `levelProgress` and `recentLevelSessions`)
   - File: `src/app/play/page.tsx`

**No regressions found.**
**TypeScript build: clean.**

**Confirmed working:**
- All 22 supported levels in `SUPPORTED_LEVEL_KEYS` present and routing correctly
- Unsupported levels (12/1, 12/2) show "Coming Soon" safely
- Placement quiz v2 (12 questions, 6 bands) routes to correct levels
- Admin override → unsupported level → Coming Soon (safe fallback)
- Grading paths verified: addition (1/1), simultaneous equations (11/2)
- Multi-student support: creation, switching, scoped data
- Feedback flow end-to-end
- Auth guards on all protected pages

**Remaining known risk before inviting testers:**
- Deployed URL not yet tested — mobile PWA install and real network latency untested
- Email confirmation flow not tested (depends on Supabase project settings)
- Level progression (auto-advance after 3 consecutive passes) not E2E tested here (unit logic tested in prior milestones)

---

### Milestone 43 — Lesson Content Consistency Pass (2026-04-19)

**What was done:**
Audited lesson content coverage for all 22 generator-supported levels. Discovered that entries for 9/2, 10/1, 10/2, and 11/1 already existed in `src/lib/lessons/index.ts` from a prior session but were not reflected in `PROJECT_CONTEXT.md`.

**Result:** All 22 levels confirmed to have lesson cards. No new lesson content needed.

**Files updated:**
- `PROJECT_CONTEXT.md` — updated Lesson cards section to reflect full coverage

**Validation:**
- Read `src/lib/lessons/index.ts` — all 22 keys confirmed present
- Browser: dev server running, worksheet renders Learn card correctly
- No regressions observed

---

### Milestone 42 — Simultaneous Equations: Level 11/2 (2026-04-18)

**What was added:**
Simultaneous Equations — Level 11/2. Full generator, grading path, lesson card, and routing support.

**Files added:**
- `src/lib/math/generators/simultaneous-equations.ts` — `generateSimultaneousEquations(count, rand)`:
  - Three problem types: `sim_eq` (single type label, three structural shapes)
  - Type 1: `x + y = S, x − y = D` (x > y so D > 0)
  - Type 2: `2x + y = C, x − y = D` (x > y so D > 0)
  - Type 3: `x + 2y = C, x + y = D`
  - Integer solutions guaranteed by construction (x, y chosen first)
  - Dedup on prompt string with 50× retry budget
  - Accepts optional `rand` for deterministic testing

**Files modified:**
- `src/lib/math/generators/index.ts` — added import, type export, union type, and 11/2 routing case
- `src/lib/math/gradeAnswer.ts` — added simultaneous-equation grading path: detects `x=` and `y=` in correct answer, parses both values by regex name (not position), normalizes spaces/case
- `src/app/worksheet/page.tsx` — added `[11, 2]` to `SUPPORTED_LEVEL_KEYS`
- `src/app/worksheet/WorksheetForm.tsx` — added `sim_eq` case to `problemTypeLabel` switch and `inputModeForType` (text mode)
- `src/lib/lessons/index.ts` — added lesson for 11/2: title, explanation (elimination method), 6-step worked example, tip

**Canonical answer format:**
`x = 3, y = 7` (spaces around `=`, comma-space separator)

**Grading normalization accepted:**
- `x = 3, y = 7` (canonical)
- `x=3,y=7` (no spaces)
- `x = 3,  y = 7` (extra spaces)
- `X = 3, Y = 7` (uppercase)
- `x=3 y=7` (space separator instead of comma)
- `y = 7, x = 3` (reversed order — accepted; regex matches by name, not position)

**Limitations of v1:**
- Answers with letters other than x/y in wrong positions (e.g. `a=3, b=7`) will fail — acceptable
- No support for fractional or negative solutions (integer-only by design)
- Three problem shapes only (no 3x+2y style or larger coefficients)
- x first in lesson example and prompt, but reversed order is silently accepted by grading

**TypeScript:** Build clean, no type errors.

### Suite 42 — Simultaneous Equations Level 11/2 (2026-04-18)
| Test | Result |
|------|--------|
| TypeScript build clean | PASS |
| Unit: canonical "x = 3, y = 7" graded correct | PASS |
| Unit: no-spaces "x=3,y=7" graded correct | PASS |
| Unit: extra spaces graded correct | PASS |
| Unit: uppercase "X=3, Y=7" graded correct | PASS |
| Unit: space separator "x=3 y=7" graded correct | PASS |
| Unit: reversed "y=7, x=3" graded correct (regex by name) | PASS |
| Unit: wrong x fails | PASS |
| Unit: wrong y fails | PASS |
| Unit: empty string fails | PASS |
| Unit: garbage input fails | PASS |
| Unit: inequality "x>4" does NOT trigger sim-eq path | PASS |
| Unit: integer "7" does NOT trigger sim-eq path | PASS |
| Unit: fraction "3/4" does NOT trigger sim-eq path | PASS |
| Unit: algebra "5x+2" does NOT trigger sim-eq path | PASS |
| Unit: 30-round generator correctness (D>0, solutions verify) | PASS |
| Browser: manual placement to 11/2 works | PASS |
| Browser: dashboard shows Level 11 / Sublevel 2 / Simultaneous Equations | PASS |
| Browser: 11/2 worksheet renders 20 problems cleanly | PASS |
| Browser: lesson card renders correctly with worked example and tip | PASS |
| Browser: correct answers in all format variants pass (19/20, intentional 1 wrong) | PASS |
| Browser: wrong answer "x=1,y=1" fails | PASS |
| Browser: session recorded, 1/3 passes shown on dashboard | PASS |
| Browser: unsupported 12/1 shows "Coming Soon" | PASS |
| Browser: tablet viewport (768×1024) renders cleanly | PASS |

---

### Milestone 41 — Placement Diagnostic v2 (2026-04-18)

**What changed:**
Recalibrated the placement diagnostic to cover the full Level 1–8 curriculum. v1 had 10 questions in 3 bands (arithmetic, number theory, algebra) and completely skipped levels 5–8, making any student with basic arithmetic but no fractions jump to level 9/1. v2 fixes this with proper middle-path resolution.

**Strategy — Band Gate v2:**
- 12 questions, 6 bands of 2 questions each
- Each band covers a curriculum checkpoint: arithmetic, multiplication/division, fractions, decimals/percentages, negatives/order of operations, algebra
- Band gate: need ≥1 correct in a band to advance; first band with 0/2 = ceiling
- Within a passing band with one miss: first-question-right + second-question-wrong = place at the "second-fail" level for that band
- Q1 typo recovery: if Q1 wrong but Q2 right (band still passes), place at 1/2 rather than 1/1
- All bands pass → 9/1
- Placement is conservative: fail at band X → start at the logical bridge level before X

**Questions:**
| Q | Prompt | Answer | Band | Tests |
|---|--------|--------|------|-------|
| 1 | 8 + 6 = ? | 14 | arithmetic | 1/1 |
| 2 | 45 − 18 = ? | 27 | arithmetic | 2/2 |
| 3 | 6 × 7 = ? | 42 | mul_div | 3/1 |
| 4 | 56 ÷ 8 = ? | 7 | mul_div | 4/1 |
| 5 | 1/3 + 1/3 = ? | 2/3 | fractions | 5/1 |
| 6 | 1/2 × 2/3 = ? | 1/3 | fractions | 5/2 |
| 7 | 4.5 + 3.7 = ? | 8.2 | decimals_pct | 6/1 |
| 8 | What is 25% of 80? | 20 | decimals_pct | 6/2 |
| 9 | -3 + 8 = ? | 5 | negatives_ops | 7/1 |
| 10 | 2 + 3 × 4 = ? | 14 | negatives_ops | 7/2 |
| 11 | Simplify: 3x + 2 + 2x | 5x + 2 | algebra | 8/1 |
| 12 | Solve for x: 4x = 28 | 7 | algebra | 8/2 |

**Placement mapping:**
| Profile | Place at |
|---------|----------|
| Arithmetic band fails (both Q1,Q2 wrong) | 1/1 |
| Q1 right, Q2 wrong | 1/2 |
| Arithmetic passes, mul_div fails (both Q3,Q4 wrong) | 3/1 |
| Q3 right, Q4 wrong | 3/2 |
| mul_div passes, fractions fails | 4/2 |
| Q5 right, Q6 wrong | 5/2 |
| Fractions passes, decimals_pct fails | 6/1 |
| Q7 right, Q8 wrong | 6/2 |
| decimals_pct passes, negatives_ops fails | 7/1 |
| Q9 right, Q10 wrong | 7/2 |
| negatives_ops passes, algebra fails | 8/1 |
| Q11 right, Q12 wrong | 8/2 |
| All bands pass | 9/1 |

**v2 Design note — band scoring asymmetry (by design):**
Within each band, "first-right + second-wrong" breaks the chain and places. But "first-wrong + second-right" (excluding band 0) is treated as a band pass and allows advancing. This means a student who guesses correctly on the second question can advance a band. This is intentional: if you can do the harder question in a band, the first miss is likely noise. The Q1 typo recovery in band 0 is the explicit special case. This asymmetry is a v2 limitation — a full adaptive engine would handle it better.

**Files changed:**
- `src/lib/math/placement.ts` — complete rewrite: new 12-question set, band-gate scoring, import `gradeAnswer` from shared utility (supports fractions, decimals, algebraic expressions), updated PLACEMENT_INFO for all reachable placement levels
- `src/app/placement/PlacementForm.tsx` — updated BAND_LABELS (6 bands), updated question count copy ("12 quick questions")

**Grading:** Now uses `gradeAnswer` from `src/lib/math/gradeAnswer.ts` — correctly handles fraction answers (cross-multiply), decimal answers, algebraic expression answers (normalize whitespace/case), and integers.

**TypeScript:** Build clean, no type errors.

### Suite 41 — Placement Diagnostic v2 (2026-04-18)
| Test | Result |
|------|--------|
| Page renders: 12 questions, 6 band labels shown | PASS |
| "12 quick questions" copy shown | PASS |
| All blank (weak beginner) → 1.1 Addition | PASS |
| Q1–Q4 correct, rest blank → 4.2 Long Division | PASS |
| Q1–Q8 correct, rest blank → 7.1 Negative Numbers | PASS |
| All 12 correct → 9.1 Prime Factorisation | PASS |
| Q1–Q11 correct, Q12 blank → 8.2 One-step Equations | PASS |
| Apply recommended level → redirects to /play at correct level | PASS |
| "Start at Level 1.1 instead" → redirects to /play at 1/1 | PASS |
| TypeScript: build clean | PASS |

---

### Milestone 40 — One-step Equations Generator: Level 8/2 (2026-04-18)

**What was added:**
One-step Equations — Level 8/2 (algebra: solving one-step equations with a single integer answer).

**Files added:**
- `src/lib/math/generators/one-step-equations.ts` — `generateOneStepEquations(count, rand)` for Level 8/2:
  - Four problem types: `eq_add`, `eq_sub`, `eq_mul`, `eq_div`
  - `eq_add`: `x + a = b` — x ∈ [1,12], a ∈ [1,10], answer always positive
  - `eq_sub`: `x - a = b` — x ∈ [5,18], a ∈ [1,x-1], answer always positive
  - `eq_mul`: `ax = b` — a ∈ [2,9], x ∈ [1,10], answer always positive
  - `eq_div`: `x / a = b` — a ∈ [2,9], b ∈ [1,10], answer always positive
  - Dedup on prompt string with 50× retry budget

**Files changed:**
- `src/lib/math/generators/index.ts` — routes 8/2 → `generateOneStepEquations`; exports `OneStepEquationProblem`, `OneStepEquationType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[8, 2]` to `SUPPORTED_LEVEL_KEYS` (after `[8, 1]`)
- `src/app/worksheet/WorksheetForm.tsx` — added all 4 one-step equation type labels (display as "One-step Equation"); all use `inputMode="numeric"` (positive integer answers only)
- `src/lib/lessons/index.ts` — added `8/2` lesson: "One-step Equations", balanced-scale explanation, worked example (3x = 12 → x = 4), 4 steps, undo-the-operation tip

**DB:** Level row 8/2 already existed in the `levels` table with topic "Algebra" / description "Solving one-step equations".

**Grading:** No changes to `gradeAnswer.ts` — all answers are positive integers handled by the existing signed-integer path (`/^-?\d+$/`).

**Answer format:** Single positive integer string: `"3"`, `"16"`, `"20"`, `"1"`.

**Canonical answer format:** Integer only (e.g. `"4"`, `"12"`, `"9"`). No variables in answer.

**Limitations (v1):**
- All answers are positive integers only (no negative x values)
- Single variable x only in all problem types
- Division problems: x/a = b form only (not a/x = b)
- No multi-step or combined operations

### Suite 40 — One-step Equations Generator: Level 8/2 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 8/2 via admin controls | PASS |
| Dashboard reflects Level 8 / Sublevel 2 / Algebra / Solving one-step equations | PASS |
| 8/2 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Algebra Worksheet", subtitle: "TestKid · Level 8.2" | PASS |
| 20 answer inputs present | PASS |
| All 4 one-step equation types rendered (eq_add, eq_sub, eq_mul, eq_div) | PASS |
| Type label displays as "One-step Equation" | PASS |
| Review problems from 8/1 (Simplifying Expressions) show "Review" badge | PASS |
| Lesson card title: "Learn: One-step Equations" | PASS |
| Lesson card: balanced-scale explanation, worked example (3x=12→x=4), 4 steps, undo-operation tip | PASS |
| Correct answers (all 20 auto-solved) → 20/20, 100%, Passed | PASS |
| Wrong answers (999 for all) → 0/20, Not passed | PASS |
| 9/1 still works (Factorization Worksheet · Level 9.1) | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 39 — Simplifying Expressions Generator: Level 8/1 (2026-04-18)

**What was added:**
Simplifying Expressions — Level 8/1 (algebra: combining like terms).

**Files added:**
- `src/lib/math/generators/simplifying-expressions.ts` — `generateSimplifyingProblems(count, rand)` for Level 8/1:
  - Three problem types: `expr_combine_like`, `expr_multi_terms`, `expr_with_constant`
  - `expr_combine_like`: `ax ± bx` — two like terms, e.g. `3x + 2x = ?`
  - `expr_multi_terms`: `ax ± bx ± cx` — three like terms, e.g. `2x + 3x − x = ?`
  - `expr_with_constant`: `ax + c1 + bx ± c2` — variable and constant groups, e.g. `2x + 3 + x + 4 = ?`
  - Variables drawn from `['a','b','m','n','x','y']`; coefficients reject if result < 2
  - Dedup on prompt string with 100× retry budget

**Files changed:**
- `src/lib/math/gradeAnswer.ts` — added algebraic expression path: detects `/[a-zA-Z]/` in correctAnswer, placed after inequality check and before fraction/integer paths. Normalizer strips all whitespace and lowercases; strict string match (no term reordering)
- `src/lib/math/generators/index.ts` — routes 8/1 → `generateSimplifyingProblems`; exports `SimplifyingProblem`, `SimplifyingProblemType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[8, 1]` to `SUPPORTED_LEVEL_KEYS` (after `[7, 2]`)
- `src/app/worksheet/WorksheetForm.tsx` — added all 3 simplifying type labels (display as "Simplifying Expressions"); all use `inputMode="text"` (algebraic answers need letters)
- `src/lib/lessons/index.ts` — added `8/1` lesson: "Simplifying Expressions", like-terms explanation, worked example (2x + 3 + x + 4 = 3x + 7), 5 steps, "mystery box" tip

**DB:** Level row 8/1 already existed in the `levels` table with topic "Algebra" / description "Simplifying expressions".

**Grading:** Algebraic expression path added in `gradeAnswer.ts`. Detection: `/[a-zA-Z]/` in correctAnswer. Normalization: lowercase + strip all spaces. Accepts `"3x+7"`, `"3x + 7"`, `"3X + 7"` — all normalize to `"3x+7"`. Rejects `"7+3x"` (reordered — not in canonical form). No impact on existing fraction, decimal, inequality, or integer grading paths.

**Answer format:**
- Pure like terms: `"5x"`, `"3a"`, `"12m"` — variable coefficient always ≥ 2
- With constant (positive): `"3x + 7"`, `"9m + 11"` — spaces around `+`
- With constant (negative): `"5a - 2"`, `"7n - 1"` — spaces around `-`

**Canonical answer format:** `"Cx"` or `"Cx + K"` or `"Cx - K"` where C ≥ 2, K ≥ 1.

**Limitations (v1):**
- One variable per problem (no mixed-variable expressions)
- No parentheses or distribution
- No coefficient-1 answers (generator rejects results where variable coefficient < 2)
- `1x` may appear in prompts (when b=1 in multi-term types) but answer coefficient is always ≥ 2
- Strict canonical-string grading: `"7 + 3x"` would not be accepted even if mathematically equivalent
- No simplification of variable-only terms to bare `x` (always `2x` or higher)

### Suite 39 — Simplifying Expressions Generator: Level 8/1 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 8/1 via admin controls | PASS |
| Dashboard reflects Level 8 / Sublevel 1 / Algebra / Simplifying expressions | PASS |
| 8/1 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Algebra Worksheet", subtitle: "TestKid · Level 8.1" | PASS |
| 20 answer inputs present | PASS |
| All 3 simplifying problem types rendered (combine_like, multi_terms, with_constant) | PASS |
| Type label displays as "Simplifying Expressions" | PASS |
| Lesson card title: "Learn: Simplifying Expressions" | PASS |
| Lesson card: like-terms explanation, worked example (2x+3+x+4=3x+7), 5 steps, mystery box tip | PASS |
| Correct answers (all 20 auto-solved) → 20/20, 100%, Passed | PASS |
| Wrong answers (999 for all) → 0/20, Not passed | PASS |
| Spacing normalization: `"3x+7"` accepted where canonical is `"3x + 7"` | PASS |
| Spacing normalization: `"9m-1"` accepted where canonical is `"9m - 1"` | PASS |
| 20/20 with mixed-format answers → Passed | PASS |
| Unsupported 8/2 shows "Coming Soon" | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 38 — Order of Operations Generator: Level 7/2 (2026-04-18)

**What was added:**
Order of Operations — Level 7/2 (PEMDAS/BODMAS with integers).

**Files added:**
- `src/lib/math/generators/order-of-operations.ts` — `generateOrderOfOperationsProblems(count, rand)` for Level 7/2:
  - Four problem types: `order_add_mul`, `order_sub_mul`, `order_div_add`, `order_paren`
  - `order_add_mul`: `a + b × c` (multiply first) — a in [1,15], b/c in [2,9]
  - `order_sub_mul`: `a - b × c` (multiply first) — a always > b×c, answer positive
  - `order_div_add`: `dividend ÷ divisor + c` — quotient-first generation for clean integers
  - `order_paren`: `(a + b) × c` or `(a - b) × c` — brackets change the order
  - All answers are positive integers (≤ 100), dedup on prompt with 100× retry budget

**Files changed:**
- `src/lib/math/generators/index.ts` — routes 7/2 → `generateOrderOfOperationsProblems`; exports `OrderOfOperationsProblem`, `OrderOfOperationsProblemType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[7, 2]` to `SUPPORTED_LEVEL_KEYS` (after `[7, 1]`)
- `src/app/worksheet/WorksheetForm.tsx` — added all 4 order-of-operations type labels (all display as "Order of Operations"); all use `inputMode="numeric"` (positive integer answers only)
- `src/lib/lessons/index.ts` — added `7/2` lesson: "Order of Operations", BODMAS explanation, worked example (3 + 4 × 2 = 11), 4 steps, brackets-win tip

**DB:** Level row 7/2 already existed in the `levels` table with topic "Order of Operations".

**Grading:** No changes to `gradeAnswer.ts` — all answers are positive integers handled by the existing signed-integer path (`/^-?\d+$/`).

**Answer format:** All answers are positive integer strings: `"11"`, `"60"`, `"9"`, `"72"`.

**Canonical answer format:** Positive integer string — `"11"`, `"14"`, `"5"`, `"20"`.

**Limitations (v1):**
- Integer operands only (no decimals or fractions)
- All answers are positive integers (negative results excluded by construction)
- No three-operation expressions (all are two-operation: one pair of precedence)
- No exponents or more complex PEMDAS structures (kept age-appropriate)

### Suite 38 — Order of Operations Generator: Level 7/2 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 7/2 via admin controls | PASS |
| Dashboard reflects Level 7 / Sublevel 2 / Order of Operations | PASS |
| 7/2 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Order of Operations Worksheet", subtitle: "OpsKid · Level 7.2" | PASS |
| 20 answer inputs present | PASS |
| All 4 order-of-operations problem types rendered (add_mul, sub_mul, div_add, paren) | PASS |
| Lesson card title: "Learn: Order of Operations" | PASS |
| Lesson card: BODMAS explanation, worked example (3 + 4 × 2 = 11), 4 steps, brackets tip | PASS |
| Correct answers (all 20 auto-solved) → 20/20, 100%, Passed | PASS |
| Wrong answers (999 for all) → 0/20, Not passed | PASS |
| Unsupported 8/1 shows "Coming Soon" | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 37 — Negative Numbers Generator: Level 7/1 (2026-04-18)

**What was added:**
Negative Numbers — Level 7/1 (Operations with Negative Numbers).

**Files added:**
- `src/lib/math/generators/negatives.ts` — `generateNegativeProblems(count, rand)` for Level 7/1:
  - Four problem types: `neg_addition`, `neg_subtraction`, `neg_multiplication`, `neg_division`
  - Addition: at least one negative operand, operands in [−12, 12]
  - Subtraction: at least one negative operand or result, operands in [−12, 12]
  - Multiplication: at least one negative factor (1–9 range), product ≤ 108 in absolute value
  - Division: quotient-first generation to guarantee integer results, no all-positive pairs
  - Dedup on prompt string with retry budget (100× count)

**Files changed:**
- `src/lib/math/gradeAnswer.ts` — added signed integer path (`/^-?\d+$/`) before the existing `correctNums` path; handles negative answers like `"-5"`, `"-42"` without breaking positive integer, fraction, decimal, or inequality grading
- `src/lib/math/generators/index.ts` — routes 7/1 → `generateNegativeProblems`; exports `NegativeProblem`, `NegativeProblemType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[7, 1]` to `SUPPORTED_LEVEL_KEYS` (after `[6, 2]`)
- `src/app/worksheet/WorksheetForm.tsx` — added all 4 negative type labels (all display as "Negative Numbers"); negative types use `inputMode="text"` so the minus sign can be typed
- `src/lib/lessons/index.ts` — added `7/1` lesson: "Negative Numbers", number-line analogy, worked example (4 − (−3) = 7), 3 steps, sign-rules tip

**DB:** Level row 7/1 already existed in the `levels` table with topic "Negative Numbers".

**Grading:** Signed integer path added in `gradeAnswer.ts` — fires when correctAnswer matches `/^-?\d+$/`, uses `parseInt` for both sides. No impact on existing fraction, decimal, inequality, or multi-token paths.

**Answer format:** All answers are signed integers stored as strings: `"-5"`, `"24"`, `"-42"`, `"3"`.

**Canonical answer format:** Signed integer string — `"-14"`, `"1"`, `"-3"`, `"24"`.

**Limitations (v1):**
- Integer operands only (no decimal or fraction negatives)
- Division limited to clean-quotient pairs (no remainders)
- Operands capped at ±12 for addition/subtraction; products/dividends up to 81 (9×9) for ×÷
- No order-of-operations problems (those belong in 7/2)

### Suite 37 — Negative Numbers Generator: Level 7/1 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 7/1 via admin controls | PASS |
| Dashboard reflects Level 7 / Sublevel 1 / Negative Numbers | PASS |
| 7/1 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Negative Numbers Worksheet", subtitle: "NegKid · Level 7.1" | PASS |
| 20 answer inputs present | PASS |
| All 4 negative number problem types rendered | PASS |
| Lesson card title: "Learn: Negative Numbers" | PASS |
| Lesson card: worked example (4 − (−3) = 7), 3 steps, sign-rules tip shown | PASS |
| Correct answers (all 20 auto-solved including negatives) → 20/20, 100%, Passed | PASS |
| Wrong answers (999 for all) → 0/20, Not passed | PASS |
| Unsupported 7/2 shows "Coming Soon" | PASS |
| 6/1 regression: loads "Decimals" lesson, no Coming Soon | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 36 — Percentage Generator: Level 6/2 (2026-04-18)

**What was added:**
Percentages — Level 6/2 (Basics & Conversions).

**Files added:**
- `src/lib/math/generators/percentages.ts` — `generatePercentageProblems(count, rand)` for Level 6/2:
  - Four problem types: `percent_of_number`, `percent_to_decimal`, `decimal_to_percent`, `fraction_to_percent`
  - `percent_of_number`: common percentages (10/20/25/50/75) × friendly bases (multiples of 4/10), always integer results
  - `percent_to_decimal`: converts common % to decimal string (e.g. `"0.25"`)
  - `decimal_to_percent`: student types the % as integer (e.g. `0.5 = ?%` → `"50"`)
  - `fraction_to_percent`: 13 clean fraction→percent pairs (e.g. `3/4 = ?%` → `"75"`)
  - Dedup on prompt string with retry budget (100× count)

**Files changed:**
- `src/lib/math/generators/index.ts` — routes 6/2 → `generatePercentageProblems`; exports `PercentageProblem`, `PercentageProblemType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[6, 2]` to `SUPPORTED_LEVEL_KEYS` (after `[6, 1]`)
- `src/app/worksheet/WorksheetForm.tsx` — added all 4 percentage type labels (all display as "Percentage"); `percent_to_decimal` gets `inputMode="decimal"`, others `inputMode="numeric"`
- `src/lib/lessons/index.ts` — added `6/2` lesson: "Percentages: Basics & Conversions", worked example (25% of 80 = 20), 4 steps, tip covering the big-four shortcuts

**DB:** Level row 6/2 already existed in the `levels` table with topic "Percentages".

**Grading:** No changes to `gradeAnswer.ts` — all answer types handled by existing paths:
- Integer answers (`percent_of_number`, `decimal_to_percent`, `fraction_to_percent`) → existing integer path
- Decimal answers (`percent_to_decimal`, e.g. `"0.25"`) → existing decimal path (parseFloat with 0.001 tolerance)

**Answer formats:**
- `percent_of_number`: `"20"`, `"50"`, `"90"` (integer)
- `percent_to_decimal`: `"0.1"`, `"0.25"`, `"0.75"` (decimal string)
- `decimal_to_percent`: `"10"`, `"50"`, `"75"` (integer, the % value)
- `fraction_to_percent`: `"25"`, `"50"`, `"75"` (integer)

**Limitations (v1):**
- Only clean, common percentages (10/20/25/50/75) to keep answers age-appropriate and integer
- No percentage increase/decrease problems in v1
- `percent_to_decimal` answers must match to 3 decimal places (e.g. `"0.25"` or `"0.250"` both pass)

### Suite 36 — Percentage Generator: Level 6/2 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 6/2 via admin controls | PASS |
| Dashboard reflects Level 6 / Sublevel 2 / Percentages | PASS |
| 6/2 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Percentages Worksheet", subtitle: "PctTest · Level 6.2" | PASS |
| 20 answer inputs present | PASS |
| All 4 percentage problem types rendered | PASS |
| Lesson card title: "Learn: Percentages: Basics & Conversions" | PASS |
| Lesson card: worked example (25% of 80 = 20), 4 steps, tip shown | PASS |
| Correct answers (all 20 auto-solved) → 20/20, 100%, Passed | PASS |
| Wrong answers (999 for all) → 0/20, Not passed | PASS |
| Unsupported 7/1 shows "Coming Soon" | PASS |
| 5/1 regression: loads "Fractions: Addition & Subtraction" lesson, no Coming Soon | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 35 — Decimal Generator: Level 6/1 (2026-04-18)

**What was added:**
Decimal operations — Level 6/1 (Addition, Subtraction & Multiplication with decimals).

**Files added:**
- `src/lib/math/generators/decimals.ts` — `generateDecimalProblems(count, rand)` for Level 6/1:
  - Three problem types: `decimal_addition`, `decimal_subtraction`, `decimal_multiplication`
  - Addition: two 1-decimal-place operands (0.1–9.9), sum ≤ 19.9
  - Subtraction: a > b, both 1-decimal-place, difference > 0
  - Multiplication: 1-decimal-place number × whole number (2–5), product ≤ 19.9
  - Dedup on prompt string with retry budget (100× count)
  - Answer format: `parseFloat(n.toFixed(1)).toString()` — strips trailing zeros, whole-number results as integers (e.g. `"4"` not `"4.0"`)

**Files changed:**
- `src/lib/math/gradeAnswer.ts` — added decimal grading path before the integer check:
  - Detects correctAnswer matching `/^\d+\.\d+$/`
  - Parses both student and correct answer as `parseFloat`, compares within tolerance 0.001
  - Handles `"3.50"` vs `"3.5"` — both pass
  - No impact on existing inequality, fraction, integer, or multi-token grading paths
- `src/lib/math/generators/index.ts` — routes 6/1 → `generateDecimalProblems`; exports `DecimalProblem`, `DecimalProblemType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[6, 1]` to `SUPPORTED_LEVEL_KEYS` (after `[5, 2]`)
- `src/app/worksheet/WorksheetForm.tsx` — added `decimal_addition`, `decimal_subtraction`, `decimal_multiplication` to `problemTypeLabel()`; decimal types use `inputMode="decimal"` (shows decimal keyboard on mobile); import updated to `React` namespace for correct `HTMLAttributes` typing
- `src/lib/lessons/index.ts` — added `6/1` lesson: "Decimals: Addition, Subtraction & Multiplication", worked example (2.4 + 1.3 = 3.7), 4 steps, tip covering decimal point alignment and the multiply-then-shift mental model

**DB:** Level row 6/1 already existed in the `levels` table with topic "Decimals".

**Answer format:** `"8.1"`, `"0.6"`, `"12.5"` for decimal results; `"4"`, `"18"` for whole-number results. Always 1 decimal place input, trailing zeros accepted (e.g. `"8.10"` for `"8.1"`).

**Grading:** Decimal path added in `gradeAnswer.ts` — fires only when correctAnswer matches `/^\d+\.\d+$/`, parseFloat comparison with 0.001 tolerance. Whole-number decimal results (e.g. `"4"`) grade via existing integer path. No grading changes needed for other levels.

**Limitations (v1):**
- All operands are 1-decimal-place only (e.g. 2.5, not 2.75) — keeps problems age-appropriate and avoids messy 2-decimal answers
- Multiplication limited to decimal × whole number (no decimal × decimal)
- No rounding or comparison problem types in v1

### Suite 35 — Decimal Generator: Level 6/1 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 6/1 via admin controls | PASS |
| Dashboard reflects Level 6 / Sublevel 1 / Decimals | PASS |
| 6/1 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Decimals Worksheet", subtitle: "DecTest · Level 6.1" | PASS |
| 20 answer inputs present | PASS |
| All three decimal problem types shown (Addition, Subtraction, Multiplication) | PASS |
| Lesson card title: "Learn: Decimals: Addition, Subtraction & Multiplication" | PASS |
| Lesson card: worked example (2.4 + 1.3 = 3.7), 4 steps, tip shown | PASS |
| Correct answers (all 20 auto-solved) → 20/20, 100%, Passed | PASS |
| Wrong answers (999 for all) → 0/20, Not passed | PASS |
| Trailing-zero format variations (e.g. "8.10", "4.80") pass → 20/20 | PASS |
| Whole-number results (e.g. "18" for 4.5×4) grade correctly | PASS |
| 5/1 regression: loads "Fractions: Addition & Subtraction" lesson, no Coming Soon | PASS |
| Unsupported 6/2 shows "Coming Soon" | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 34 — Fraction Generator: Level 5/2 (2026-04-18)

**What was added:**
Fraction multiplication and division — Level 5/2.

**Files changed:**
- `src/lib/math/generators/fractions.ts` — extended `FractionProblemType` with `'fraction_multiplication' | 'fraction_division'`; added `generateMultDivProblem()` (internal) and `generateFractionMultDivProblems(count, rand)` (exported):
  - Multiplication: picks two proper fractions (denominators 2–6), multiplies numerators and denominators, simplifies
  - Division: picks proper fraction dividend (b∈[2,6]) and divisor (d∈[2,6]) using keep-change-flip (a×d)/(b×c), simplifies; filters out results with simplified numerator > 12
  - Dedup on prompt string with retry budget (100× count)
  - Answers simplified to lowest terms; whole-number results as plain integers (e.g. `"2"`, `"3"`)
- `src/lib/math/generators/index.ts` — routes 5/2 → `generateFractionMultDivProblems`; imports added
- `src/app/worksheet/WorksheetForm.tsx` — added `fraction_multiplication` and `fraction_division` cases to `problemTypeLabel()`; both types use `inputMode="text"` (students need `/` key)
- `src/app/worksheet/page.tsx` — added `[5, 2]` to `SUPPORTED_LEVEL_KEYS`
- `src/lib/lessons/index.ts` — added `5/2` lesson: "Fractions: Multiplication & Division", worked example (2/3 ÷ 1/6 = 4), 5 steps, tip covering keep-change-flip

**DB:** Level row 5/2 already existed in the `levels` table with topic "Fractions".

**Grading:** No changes to `gradeAnswer.ts` — the existing fraction cross-multiply path handles multiplication/division answers correctly. Fraction results grade via cross-multiply; whole-number results (e.g. `"2"`) grade via exact integer match.

**Answer format:** `"1/6"`, `"4/3"`, `"5/2"` for fraction results; `"1"`, `"2"`, `"3"` for whole-number results. Always simplified. Equivalent unsimplified fraction inputs accepted (e.g. `"2/4"` for `"1/2"`) — same cross-multiply path as 5/1.

**Limitations (v1):**
- Whole-number answers must be typed as integers (e.g. `"2"`, not `"4/2"`) — same behavior as 5/1
- Denominators constrained to 2–6 for age-appropriate difficulty
- Division results filtered to simplified numerator ≤ 12 to keep answers teachable

### Suite 34 — Fraction Generator: Level 5/2 (2026-04-18)
| Test | Result |
|------|--------|
| Manual placement to 5/2 via admin controls | PASS |
| Dashboard reflects Level 5 / Sublevel 2 | PASS |
| 5/2 worksheet loads (no Coming Soon) | PASS |
| Worksheet heading: "Fractions Worksheet", subtitle: "FracMulKid · Level 5.2" | PASS |
| 20 answer inputs present | PASS |
| Both "Fraction Multiplication" and "Fraction Division" problem types shown | PASS |
| Fraction notation uses × and ÷ symbols | PASS |
| Lesson card title: "Learn: Fractions: Multiplication & Division" | PASS |
| Lesson card: worked example (2/3 ÷ 1/6 = 4), 5 steps, tip shown | PASS |
| Wrong answers (999/999) → 0/20, Not passed | PASS |
| Correct answers (all 20 auto-solved) → 20/20, Passed, Mastery 1/3 | PASS |
| Equivalent unsimplified fraction inputs pass (e.g. 2/20 for 1/10, 10/6 for 5/3) → 18/20 (2 whole-number edge cases fail as expected) | PASS |
| 5/1 regression: loads "Fractions: Addition & Subtraction" lesson, 20 problems, no Coming Soon | PASS |
| Unsupported 6/1 shows Coming Soon | PASS |
| TypeScript: build clean, no type errors | PASS |
| Tablet viewport (768×1024): worksheet renders correctly, screenshot saved | PASS |

---

### Milestone 33 — Fraction Generator: Level 5/1 (2026-04-18)

**What was added:**
Fraction support — Level 5/1 (Addition & Subtraction of Fractions).

**Files added:**
- `src/lib/math/generators/fractions.ts` — `generateFractionProblems(count)` for Level 5/1:
  - Two problem types: `fraction_addition`, `fraction_subtraction`
  - Same-denominator: d ∈ [2–9], proper fraction operands
  - Unlike-denominator: curated pairs (2,3), (2,4), (2,6), (3,4), (3,6), (4,6), (2,8), (3,8), (4,8), (3,9), (2,9) — all with manageable LCM ≤ 18
  - Dedup on prompt string with retry budget (100× count attempts)
  - Answers simplified to lowest terms; whole numbers returned as plain integers (e.g. `"1"`, `"2"`)
  - No mixed numbers in v1; improper fractions like `"4/3"` are valid answers

**Files changed:**
- `src/lib/math/gradeAnswer.ts` — added fraction grading path before multi-token path:
  - Detects correctAnswer matching `/^\d+\/\d+$/`
  - Parses both student and correct answer as fractions (accepts `"3/4"` or `"2"`)
  - Cross-multiply equality check: accepts equivalent unsimplified forms (e.g. `"6/8"` for `"3/4"`)
  - Does not affect integers, multi-token, or inequality grading
- `src/lib/math/generators/index.ts` — routes 5/1 → `generateFractionProblems`; exports `FractionProblem`, `FractionProblemType`; added to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[5, 1]` to `SUPPORTED_LEVEL_KEYS`
- `src/app/worksheet/WorksheetForm.tsx` — added `fraction_addition` and `fraction_subtraction` cases to `problemTypeLabel()`; fraction types use `inputMode="text"` (students need `/` key)
- `src/lib/lessons/index.ts` — added `5/1` lesson: "Fractions: Addition & Subtraction", worked example (1/4 + 2/4 = 3/4), 4 steps, tip covering unlike denominators

**DB:** Level row 5/1 already existed in the `levels` table with topic "Fractions".

**Answer format:** `"3/4"`, `"5/6"`, `"4/3"` for fractions; `"1"`, `"2"` for whole-number results. Always simplified. Student may enter equivalent unsimplified forms (e.g. `"6/8"` for `"3/4"`) and they pass.

**Grading approach:** Fraction path added in `gradeAnswer.ts` — `parseFraction()` handles `"3/4"` and `"2"` (whole number), then cross-multiplies for mathematical equivalence. Fires only when correctAnswer matches `/^\d+\/\d+$/`, so no impact on existing grading paths.

**Limitations (v1):**
- No mixed numbers (e.g. `"1 1/2"`) — improper fractions used instead
- Unlike-denominator pairs are constrained to manageable LCMs — not all denominator combinations are generated
- No negative results — subtraction always picks larger − smaller

### Suite 33 — Fraction Generator: Level 5/1 (2026-04-18)
| Test | Result |
|------|--------|
| 20 unique problems generated (seed 42) | PASS |
| No duplicate prompts | PASS |
| All problem types valid (fraction_addition or fraction_subtraction) | PASS |
| All answers in fraction or integer format | PASS |
| Exact fraction match grades correctly (3/4 == 3/4) | PASS |
| Exact fraction match grades correctly (5/6 == 5/6) | PASS |
| Equivalent unsimplified form passes (6/8 for 3/4) | PASS |
| Equivalent unsimplified form passes (2/4 for 1/2) | PASS |
| Equivalent unsimplified form passes (4/6 for 2/3) | PASS |
| Wrong fraction fails (1/4 for 3/4) | PASS |
| Wrong fraction fails (2/3 for 3/4) | PASS |
| Wrong integer for fraction fails (3 for 3/4) | PASS |
| Whole number integer answer (1) grades correctly | PASS |
| Integer grading path unaffected | PASS |
| Inequality grading path unaffected | PASS |
| All answers simplified to lowest terms (50 problems, seed 99) | PASS |
| Both addition and subtraction types present in 50 problems | PASS |
| All answers positive | PASS |
| TypeScript: build clean, no type errors | PASS |
| Next.js production build: all routes compile | PASS |
| 5/1 lesson content: title, example, steps, tip correct | PASS |
| 5/2 lesson: returns null (not yet supported) | PASS |
| SUPPORTED_LEVEL_KEYS includes [5, 1] | PASS |
| Unsupported 5/2 shows Coming Soon (no generator) | PASS (by design — [] returned) |

### Suite 33b — Level 5/1 Fractions: Playwright End-to-End (2026-04-18)
| Test | Result |
|------|--------|
| Signup + onboarding (FracKid) | PASS |
| Manual placement to 5/1 via admin controls | PASS |
| Dashboard reflects Level 5 / Sublevel 1 / Fractions | PASS |
| 5/1 worksheet loads (no Coming Soon, heading says Fraction) | PASS |
| Shows FracKid name and Level 5.1 label | PASS |
| 20 answer inputs present | PASS |
| Fraction notation in problems (a/b ± c/d) | PASS |
| Lesson card title: Fractions: Addition & Subtraction | PASS |
| Lesson card has worked example (1/4) | PASS |
| Lesson card has tip (unlike denominators) | PASS |
| Wrong answers (999/999) → 0/20, Not passed | PASS |
| Fraction answers displayed in results page | PASS |
| Correct answers (all 20 auto-solved) → 20/20, Passed | PASS |
| Mastery progress shown in results | PASS |
| Equivalent fraction grading validated via unit tests (6/8==3/4 etc.) | PASS |
| 5/2 shows Coming Soon (Worksheets for Level 5.2 not available yet) | PASS |
| Prior level 4/2: Division worksheet loads (no regression) | PASS |
| 4/2: 20 inputs, Division label confirmed | PASS |
| Viewport 768×1024 (tablet) throughout | PASS |
| Worksheet content at tablet size renders correctly | PASS |
| Screenshot saved: fraction-5-1-tablet.png | PASS |

---

### Milestone 32 — Division Generators: Levels 4/1 and 4/2 (2026-04-18)

**What was added:**
Division support extending the beginner curriculum path past multiplication.

**Files added:**
- `src/lib/math/generators/division.ts` — two generators:
  - `generateDivisionFacts(count)` — Level 4/1: basic facts, divisor ∈ [1,9], quotient ∈ [1,9], 81 unique pairs. Dedup on prompt string. Whole-number answers only, no remainders by construction.
  - `generateLongDivision(count)` — Level 4/2: two-digit ÷ one-digit. divisor ∈ [2,9], quotient ∈ [11,25], max dividend 225. No remainders by construction.

**Files changed:**
- `src/lib/math/generators/index.ts` — routes 4/1 → `generateDivisionFacts`, 4/2 → `generateLongDivision`; exports `DivisionProblem`, `DivisionProblemType`; added `DivisionProblemType` to `AnyProblemType` union
- `src/app/worksheet/page.tsx` — added `[4, 1]` and `[4, 2]` to `SUPPORTED_LEVEL_KEYS`
- `src/app/worksheet/WorksheetForm.tsx` — added `'division'` case to `problemTypeLabel()`
- `src/lib/lessons/index.ts` — added `4/1` lesson (Division Facts) and `4/2` lesson (Long Division), each with title, explanation, worked example, steps, and tip

**DB:** Level rows 4/1 (id=7) and 4/2 (id=8) already existed in the `levels` table with 20 problems/session, 90% accuracy threshold, 3 consecutive passes required.

**Generation approach:**
- 4/1: pick factors a,b ∈ [1,9] → prompt `(a×b) ÷ b = ?`, answer = a. Inverse of multiplication facts.
- 4/2: pick divisor b ∈ [2,9], quotient q ∈ [11,25] → prompt `(b×q) ÷ b = ?`, answer = q. Guarantees no remainders.

**Answer format:** single integer — compatible with existing exact-match grading. No grading changes needed.

**Limitations (v1):**
- No remainders. Division with remainders is deferred to a future milestone.
- 4/2 domain: quotients 11–25, dividends up to 225. Not true "long division" format (no written algorithm), just larger-number single-step division. Suitable for this age/level.

### Suite 32 — Division Generators (2026-04-18)
| Test | Result |
|------|--------|
| TypeScript: build clean, no type errors | PASS |
| Next.js production build: all routes compile | PASS |
| 4/1: 20 unique problems generated (seed 42) | PASS |
| 4/1: all answers mathematically correct (dividend÷divisor=answer) | PASS |
| 4/1: all answers in range 1–9 (age-appropriate facts) | PASS |
| 4/2: 20 unique problems generated (seed 99) | PASS |
| 4/2: all answers mathematically correct | PASS |
| 4/2: max dividend 162 ≤ 225 (manageable numbers) | PASS |
| Level rows 4/1 (id=7) and 4/2 (id=8) confirmed in DB | PASS |
| SUPPORTED_LEVEL_KEYS includes [4,1] and [4,2] | PASS |
| Manual placement to 4/1 via admin controls → Level 4 / Sublevel 1 / Division stats updated | PASS |
| 4/1 worksheet loads: "Division Worksheet", "DivKid · Level 4.1", 20 problems | PASS |
| 4/1 lesson card: "Learn: Division Facts", worked example (35÷7=5), tip shown | PASS |
| 4/1 problem type label: "Division" on all problems | PASS |
| 4/1 sample problems: basic facts format (e.g. "63 ÷ 7 = ?", "45 ÷ 5 = ?") | PASS |
| 4/1 wrong answers (all 999): 0/20, 0%, ✗ Not passed, consecutive passes reset | PASS |
| 4/1 correct answers (20/20): 100%, ✓ Passed, mastery 1/3 | PASS |
| 4/1 → 4/2 progression: 3 passing sessions → "Level Up! Advanced to Level 4.2 — Division" | PASS |
| URL on advancement: ?advanced=1&nl=4&ns=2&nt=Division | PASS |
| 4/2 worksheet loads: "Division Worksheet", "DivKid · Level 4.2", 20 problems | PASS |
| 4/2 lesson card: "Learn: Long Division", worked example (96÷4=24), 5 steps, tip shown | PASS |
| 4/2 problems: long division format (e.g. "168 ÷ 8 = ?", "225 ÷ 9 = ?", "84 ÷ 7 = ?") | PASS |
| 4/2 interleaving: 4 review problems from 4/1 mixed in (single-digit facts as review) | PASS |
| 4/2 wrong answers (all 999): 0/20, 0%, ✗ Not passed, consecutive passes reset | PASS |
| 4/2 correct answers (20/20): 100%, ✓ Passed, mastery 1/3 | PASS |
| Unsupported level 5/1: "Coming Soon — Worksheets for Level 5.1 (Fractions) are not available yet." | PASS |
| Tablet layout (768×1024): lesson card, worked example, problems all render cleanly | PASS |
| TypeScript: build clean, no type errors | PASS |
| Next.js production build: all routes compile | PASS |

---

### Milestone 31 — Parent Analytics / Progress at a Glance (2026-04-18)

**What was added:**
A "Progress at a Glance" card on the parent dashboard, inserted between Recent Worksheets and Admin controls.

**Window:** Last 10 completed sessions (already queried by the dashboard — no extra DB call).

**Metrics shown:**
- Avg Accuracy % (last 10 sessions)
- Pass Rate % (N/10 passed)
- Avg Time per session (formatted)
- Total Sessions (from `streaks.total_sessions`)
- Best/Longest Streak (from `streaks.longest_streak`)
- Micro bar chart: one bar per session, height = accuracy %, green = pass / red = fail, oldest left → newest right
- Plain-English insight line (shown when ≥4 sessions): compares avg accuracy of newer half vs older half; falls back to pass-rate commentary

**Edge cases handled:**
- 0 sessions → "No sessions yet — analytics will appear after the first worksheet is completed."
- 1–3 sessions → stat cards shown, no insight line (insufficient data)
- Multi-student: all values are computed per selected student

**Files changed:**
- `src/app/dashboard/page.tsx`:
  - Streaks query extended to fetch `longest_streak, total_sessions` (was only fetching `current_streak, total_points`)
  - Added analytics computation block (server-side, pure JS — no library)
  - Added "Progress at a Glance" section in JSX

No DB schema changes. No new dependencies. No third-party chart libraries.

**Test results:**
- TypeScript: build clean, no type errors — PASS
- Next.js production build: `/dashboard` compiles clean — PASS
- Auth guard (unauthenticated → 307 redirect): PASS
- UI: could not auto-test (login credentials unavailable to agent); requires manual verification

### Suite 31 — Parent Analytics (2026-04-18)
| Test | Result |
|------|--------|
| TypeScript: build clean, no type errors | PASS |
| Next.js production build: /dashboard compiles | PASS |
| Auth guard: unauthenticated → 307 redirect to /login | PASS |
| Analytics section visible with session history | MANUAL NEEDED |
| Stat cards: avg accuracy, pass rate, avg time, total sessions render correctly | MANUAL NEEDED |
| Micro bar chart visible (green/red bars) | MANUAL NEEDED |
| Insight line shown for ≥4 sessions | MANUAL NEEDED |
| Empty state for new student (no sessions) | MANUAL NEEDED |
| Multi-student switching updates analytics | MANUAL NEEDED |

---

### Milestone 30 — Self-Correction Flow v1 (2026-04-18)

**Behavior:**
After a worksheet is graded, incorrect problems show a correction input inline in the Problem Review section. Students can type the correct answer and hit "Check." If right, the problem is marked `self_corrected = true` in DB and shows a green "✓ Corrected" badge. If wrong, inline error "That's not quite right — try again." Input stays open. Already-correct problems show no correction UI at all.

**Completion messaging:**
- No incorrect problems → no correction section shown (e.g. perfect session)
- Wrong answers not yet corrected → amber "Try to fix the ones you got wrong below."
- Some corrected → amber "Good start — N more to go."
- All corrected → green "Great work fixing your mistakes!"

**Scope preserved:**
- `session.correct_count`, `session.accuracy`, `session.passed` — never modified by self-correction
- `student_level_progress`, mastery, streaks, points — untouched
- Only `problems.self_corrected` is updated

**Files added:**
- `src/lib/math/gradeAnswer.ts` — shared grading utility (extracted from worksheet.ts to avoid 'use server' export conflict)
- `src/app/actions/selfCorrection.ts` — `submitSelfCorrection` server action with ownership verification
- `src/app/worksheet/results/[sessionId]/CorrectionInput.tsx` — client component with `useActionState`

**Files changed:**
- `src/app/actions/worksheet.ts` — now imports `gradeAnswer` from shared utility (was inline)
- `src/app/worksheet/results/[sessionId]/page.tsx` — added `self_corrected` to Problem interface, correction UI per incorrect problem, completion message section

No DB schema changes. `problems.self_corrected` already existed in live DB.

### Suite 30 — Self-Correction Flow v1 (2026-04-18)
| Test | Result |
|------|--------|
| Results page loads for failing session (5/20, 25%) | PASS |
| Correct problems (1–5) show NO correction input | PASS |
| Incorrect problems (6–20) show correction input + "Correct answer" reveal | PASS |
| Completion message shown: "Try to fix the ones you got wrong below." | PASS |
| Submitting wrong correction → inline error "That's not quite right — try again." | PASS |
| Wrong correction leaves self_corrected = false in DB | PASS (DB verified) |
| Submitting correct correction → "✓ Corrected" badge appears | PASS |
| Correct correction sets self_corrected = true in DB | PASS (DB verified) |
| Completion message updates: "Good start — 14 more to go." after 1 corrected | PASS |
| Original score/pass/fail unchanged after correction (5/20, 25%, Not passed) | PASS (DB verified) |
| session.correct_count, accuracy, passed NOT modified by self-correction | PASS (DB verified) |
| Perfect session (20/20): no correction section, no correction inputs | PASS |
| Perfect session: results page works normally (Passed, mastery 1/3) | PASS |
| TypeScript: build clean, no type errors | PASS |

---

### Milestone 29 — Stuck Detector v1 (2026-04-18)

**Detection rule:**
A student is marked as stuck on their current level when, looking at the last 5 completed sessions for that student + level:
- Rule 1: the 3 most recent sessions all failed (3 consecutive fails), OR
- Rule 2: 4 or more of the last 5 sessions failed

Requires a minimum of 3 sessions before the stuck state can trigger (prevents false positives on new students).

**No DB schema changes.** Uses existing `sessions` table (`passed`, `completed_at`, `student_id`, `level_id`).

**Files added:**
- `src/lib/stuckDetector.ts` — pure `isStudentStuck(results: boolean[]): boolean` function

**Files changed:**
- `src/app/worksheet/results/[sessionId]/page.tsx` — queries last 5 sessions for student+level, calls `isStudentStuck`, shows amber supportive message when stuck AND current session failed
- `src/app/dashboard/page.tsx` — same query, shows calm parent notice inside Current Focus when student is stuck
- `src/app/play/page.tsx` — same query, shows child-friendly encouragement banner between worksheet CTA and topic card when student is stuck

**Scope:** Detection + messaging only. No automatic level drop or backtracking.

### Suite 29 — Stuck Detector v1 (2026-04-18)
| Test | Result |
|------|--------|
| Logic: empty results → not stuck | PASS |
| Logic: 2 fails (too few sessions) → not stuck | PASS |
| Logic: most recent passed, only 3 sessions → not stuck | PASS |
| Logic: 3 consecutive fails (rule 1) → stuck | PASS |
| Logic: 3 consecutive fails with older passes → stuck | PASS |
| Logic: 4 fails in 5 sessions (rule 2) → stuck | PASS |
| Logic: 5 fails → stuck | PASS |
| Logic: 4 fails in 5, non-consecutive (rule 2) → stuck | PASS |
| Logic: 4 fails in 5, pass in middle (rule 2) → stuck | PASS |
| Logic: 4 fails in 5, most recent passed (rule 2) → stuck | PASS |
| Logic: 3 fails in 5, no 3 consecutive → not stuck | PASS |
| Logic: 2 fails in 5 → not stuck | PASS |
| Fresh student (0 sessions): /play shows NO stuck message | PASS |
| After 1 fail: results page shows NO stuck message | PASS |
| After 2 fails: results page shows NO stuck message | PASS |
| After 3 consecutive fails: results page shows supportive message | PASS |
| After 3 consecutive fails: /play shows child encouragement banner | PASS |
| After 3 consecutive fails: /dashboard shows parent notice in Current Focus | PASS |
| After 1 passing session (3 fails + 1 pass): results page passes 20/20, NO stuck message | PASS |
| After 1 passing session: /play shows NO stuck message | PASS |
| TypeScript: build clean, no type errors | PASS |

---

### Milestone 28 — Interleaving v1 (2026-04-18)

**Interleaving strategy:**
When a student opens a worksheet, the system checks for previously mastered supported levels and includes a small set of review problems to improve long-term retention.

**Rules:**
- A "mastered" level requires a `student_level_progress` row with `consecutive_passes > 0 OR last_result_passed = true`. This prevents review from levels the student jumped past via placement diagnostic or admin set-level.
- Eligible review levels = supported levels ordered before the student's current level, filtered to mastered only.
- Up to the 2 most recent eligible levels are selected (closest to current).
- A 20-problem worksheet becomes: 16 current-level + 4 review problems, shuffled to interleave.
- If the current level has `problems_per_session < 8` (< REVIEW_COUNT + 4), interleaving is skipped and the worksheet is all current-level problems.
- If review generators return fewer than expected, the shortfall is topped up with extra current-level problems.
- Students with no prior mastered supported levels get a normal full worksheet (no change).

**Unsupported levels:**
- An explicit `currentLevelSupported` check (against `SUPPORTED_LEVEL_KEYS`) now runs before interleaving. This ensures unsupported levels immediately show "Coming Soon" and never accidentally show a worksheet of only review problems.

**Files changed:**
- `src/app/worksheet/page.tsx` — interleaving logic, `SUPPORTED_LEVEL_KEYS` constant, explicit unsupported level check
- `src/app/worksheet/WorksheetForm.tsx` — `isReview?: boolean` on `PersistedProblem`, amber "Review" badge shown when true

No DB schema changes. No new dependencies.

### Milestone 28b — Interleaving: Isolate Mastery from Review (2026-04-18)

Review problems no longer affect pass/fail or level advancement.

**Change:** `submitWorksheet` now reads a `review_problem_ids` hidden form field (comma-separated UUIDs). Current-level-only accuracy is computed by excluding those IDs from the mastery calculation. `session.passed` and `student_level_progress` use current-level accuracy; `session.accuracy` and `session.correct_count` use all problems for display.

**What users see:** Overall score (e.g. 16/20, 80%) — includes review problems.
**What drives mastery/advancement:** Current-level accuracy only (e.g. 16/16, 100%) — review problems excluded.
**Fallback:** If `review_problem_ids` is empty (no interleaving), effective total = total problems, behaves identically to before.

**Files changed:**
- `src/app/worksheet/page.tsx` — passes `reviewProblemIds` prop to `WorksheetForm`
- `src/app/worksheet/WorksheetForm.tsx` — renders `<input type="hidden" name="review_problem_ids" …>`
- `src/app/actions/worksheet.ts` — reads review IDs, computes separate current-level accuracy for `passed`

No DB schema changes.

### Suite 28 — Interleaving v1 (2026-04-18)
| Test | Result |
|------|--------|
| Student at 1/1 (no prior mastered levels): worksheet shows 20 addition problems, zero Review tags | PASS |
| Student passes 1/1, admin-set to 1/2: worksheet shows 4 single-digit review (1/1) + 16 double-digit main (1/2) | PASS |
| Review problems show amber "Review" badge; main problems show no badge | PASS |
| Mixed worksheet submits correctly: 20/20, 100%, ✓ Passed | PASS |
| Progression tracking (consecutive_passes, mastery) still works after mixed submit | PASS |
| Unsupported level (4/1) with prior mastered levels: shows "Coming Soon", not a worksheet of review problems | PASS |
| TypeScript: build clean, no type errors | PASS |
| Logic: 16/16 current + 0/4 review → overall 80%, mastery 100% → passed=true | PASS (unit verified) |
| Logic: 14/16 current + 4/4 review → overall 90%, mastery 87.5% → passed=false | PASS (unit verified) |
| Logic: no review (empty reviewIdSet), 18/20 → same accuracy both paths | PASS (unit verified) |

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
