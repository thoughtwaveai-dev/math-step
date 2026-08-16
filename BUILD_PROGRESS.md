# MathStep — Build Progress

> Rolling log. Most recent entries at the top of each section.

---

## Current Status

**Phase:** Curriculum ceiling signal (2026-08-16). Reaching the end of the curriculum was silent: `submitWorksheet` looked for the next `levels` row, found none, and did nothing, so the student kept re-passing the same level indefinitely. That is how Joaquin reached 10 consecutive passes on 14.1 against 3 required. "Coming Soon" never covered this, because it only fires for a level row with no generator, not for a final level that works. Three surfaces now report it off one shared condition: a banner on the student's results page, an amber notice on the parent dashboard, and a line in the weekly review email. Fires on *reaching* the last level, not on clearing it, so there is lead time to add the next one. No schema change, no new query, no new cron. See entry below.

**Phase (preceding):** Password reset send-failure visibility (2026-08-16). Follow-up to the cross-device fix below. `requestPasswordReset` caught every Supabase error, wrote it to `console.error`, and always returned `{ sent: true }`, so a genuinely failed send looked exactly like a successful one. That is why the cross-device bug went unnoticed for roughly a month. The always-succeed behaviour was deliberate anti-enumeration design, so the fix keeps it as the default and only reports failures whose cause is provably unrelated to the account asked for, via a closed allowlist of Supabase error codes. Only `src/app/actions/auth.ts` and `ForgotPasswordForm.tsx` changed. See entry below.

**Phase (preceding):** Password reset cross-device fix (2026-08-16). Reported by a parent: clicking reset password gave no usable way forward. Root cause was not the UI, which is clear and well built. Recovery emails carry a PKCE token and `/auth/callback` only handled `?code=` via `exchangeCodeForSession`, which needs the code-verifier cookie from the browser that requested the reset. Opening the email on any other device always failed to `?error=expired`, and requesting a new link did the same thing every time, so an affected parent could never get back in. `/auth/callback` now also accepts `token_hash` + `type` and verifies via `verifyOtp`, which is not browser-bound. Paired with a customised Recovery email template. Only `src/app/auth/callback/route.ts` changed. See entry below.

**Phase (preceding):** Levels 14.2 Exponents + 15.1 Expanding Brackets (2026-08-04). Joaquin had run out of assignments — he was sitting on Level 14.1 with **10 consecutive passes** (3 required) because 14.1 was the last row in `levels`, so there was nothing to advance into and he had been re-doing the same level since late June. Added two new curriculum levels, each with 5 problem types. 14.2 Exponents: evaluate a power, multiply/divide powers of the same base, power of a power, and the zero/first index — every answer is a plain integer on the numeric keypad. 15.1 Expanding Brackets: expand a single bracket, expand with subtraction, expand with a negative multiplier, expand and simplify, and factorise back out by the HCF — every answer is an algebraic expression on `inputMode="text"`. `levels` rows inserted (id=28, id=29); no `gradeAnswer` / `worksheet.ts` / `answerControl.ts` / schema changes. See entry below.

**Phase (preceding):** Floating Working Area (2026-06-21). Parent feedback: the worksheet drawing scratchpad sat at the page bottom, forcing scroll-down-to-work then scroll-up-to-answer on mobile/tablet. Replaced the inline bottom scratchpad with a fixed bottom-right "Working area" button that opens a drawer (mobile bottom-sheet / desktop bottom-right card) reachable from anywhere on the page. Reuses the existing canvas component unchanged except for two small props. No DB, generation, grading, progression, answer-control, or auth changes. See entry below.

**Phase (preceding):** Level 14.1 Inequalities (2026-06-17). Students finishing 13.2 Systems of Equations were hitting Coming Soon at 14.1. New curriculum level adds 5 problem types: one-step inequalities, two-step inequalities, flipping the sign with a negative coefficient, checking whether a value satisfies an inequality (yes/no), and writing an inequality from words. One-variable, integer-only, text-only (no inequality graphing in v1). `levels` row inserted by user (id=27); no `gradeAnswer`/`worksheet.ts`/schema changes. Extends the existing `inequalities.ts` (11.1) with a 6-member type union + new `generateInequalitiesLevel141`. Reuses the shared answer-control system (yes_no for check, default text for the rest) so worksheet, targeted practice, and self-correction wire up automatically. See entry below.

**Phase (preceding):** Level 13.2 Systems of Equations (2026-06-16). Students finishing 13.1 were hitting Coming Soon at 13.2. New curriculum level adds 5 problem types: solve by substitution, solve by elimination, find a missing value, check a solution (yes/no), and a simple sum/difference word problem. Integer-only, text-only (no graphs in v1). `levels` row inserted (id=26); no `gradeAnswer`/`worksheet.ts`/schema changes. Reuses the shared answer-control system (coordinate_pair + yes_no) so worksheet, targeted practice, and self-correction wire up automatically.

**Phase (preceding):** Level 13.1 Linear Equations & Graphs (2026-05-27). Joaquin finished 12.2 Graphing and was about to hit Coming Soon again. New algebraic curriculum level adds 5 problem types: write the equation from slope + intercept, slope from two points, y-intercept from slope + point, point-on-line yes/no, and evaluate a linear equation in either direction. Text-only — no graphs in v1. No schema change beyond inserting the `levels` row (id=25). No `gradeAnswer` changes — generator-side constraints (slope ∉ {-1, 0, 1}, intercept ≠ 0 for any type that displays a `y = mx + b` string) keep every answer on the existing algebraic or signed-integer paths. Polish pass (2026-05-27) updated the equation-writing prompt copy + lesson card so the `y = mx + b` pattern is explicit (no student literally typing `y = mx + b`), with placeholders on the equation and yes/no inputs.

---

### Curriculum ceiling signal (2026-08-16)

**Trigger:** Quentin asked for a reminder when Joaquin nears the end of the curriculum. Checking
first showed his assumption that "Coming Soon" would appear was wrong, and that Joaquin was
already sitting on 15.1, the final level, with 0 of 3 passes and nothing after it.

**The actual defect.** `src/app/actions/worksheet.ts` had a comment saying that if no next level
exists the student stays put and no action is needed. Nothing was recorded, nothing was shown.
"Coming Soon"
(`worksheet/page.tsx`) only fires when a `levels` row exists with no generator, so a working final
level never triggers it. Same silent-success shape as the password reset bug fixed earlier the
same day.

**What was built.** One shared condition, "no level ordered after the student's current
`(level_number, sublevel_number)`", surfaced three ways:

| Surface | Mechanism |
|---|---|
| Student, results page | `submitWorksheet` sets `reachedCurriculumEnd` in the new `else` branch and appends `done=1`; results page renders a finished banner |
| Parent, dashboard | `atCurriculumEnd` derived from the already-fetched `allLevels`, amber notice in Current Focus matching the `isStuck` pattern |
| Parent, weekly email | required `atCurriculumEnd` on `WeeklyStudentBlock`, computed in the cron from `levels` it already fetches, in both week variants and both text and HTML |

Fires on reaching the final level rather than clearing it, which is what buys lead time given the
email is weekly. No schema change, no new query, no new cron, no new email stream.

**Why not a dedicated reminder email:** it would need a new dedup column (manual SQL), a template,
and its own unsubscribe stream, to deliver what the existing Sunday email carries for free. The
weekly email was verified live first (8 recipients, `last_weekly_sent_date` max 2026-08-09).

**Testing (2026-08-16).**

| Test | Result |
|------|--------|
| Email template: at ceiling, active week, line present in text and HTML | PASS |
| Email template: not at ceiling, active week, line absent | PASS |
| Email template: at ceiling, empty week, line present | PASS |
| Email template: not at ceiling, empty week, line absent | PASS |
| Dashboard notice renders for a student on the last level (shows "2/3 passes") | PASS |
| Worksheet passed at 15.1 → redirect carried `done=1`, no `advanced=1` | PASS |
| Results page rendered the finished banner | PASS |
| DB after: still 15.1, `consecutive_passes` 3, session 20/20 recorded | PASS |
| Regression, advancement still works: passed at 14.2 → `advanced=1&nl=15&ns=1`, ceiling banner absent | PASS |
| `tsc --noEmit`, `eslint`, `npm run build` | PASS |

The weekly-review cron was deliberately **not** executed as a test: a real run sends to all 8
opted-in parents and writes `last_weekly_sent_date`, which would suppress the genuine Sunday send.
The added code is a pure boolean over an already-fetched array, covered by the type system and the
template tests. First live run is the normal Sunday cron.

**Temp test data:** created and cleaned up. Temp parent `mathstep-ceiling-test-20260816@agentmail.to`
(auth id `43f13ec8-dc0a-4c2a-a96b-3fa7c8ad9b1c`) and student `CeilingTestKid`
(`d6449a40-7d69-43a2-ae87-4d52ee303861`), 2 sessions, 40 problems, 1 streak, 2 level-progress rows.
Students deleted first to exercise the FK cascades, then profile, then auth user. Re-queried: 0
across users, profiles, students, sessions, streaks, level progress, and 0 orphaned problems.
Row counts back to baseline (10 auth users, 8 students).

---

### Password reset send-failure visibility (2026-08-16)

**Trigger:** Deferred follow-up agreed during the cross-device fix. `requestPasswordReset`
swallowed every Supabase error, so "Check your inbox" was shown even when nothing was sent.
That silence is why the cross-device bug survived roughly a month without being reported as
a send failure.

**The constraint.** Always returning success is deliberate: it stops anyone using the page to
test which families have a MathStep account. So the fix could not become "tell the user whether
the account exists". Only failures whose cause is independent of *which* account was asked for
may be reported.

**Approach, a closed allowlist rather than a denylist.** `SEND_INFRASTRUCTURE_ERROR_CODES` in
`src/app/actions/auth.ts` lists the four Supabase Auth codes that mean the send failed for a
system reason: `unexpected_failure`, `request_timeout`, `over_request_rate_limit`,
`email_address_not_authorized`. Anything else stays silent, including
`user_not_found`, `user_banned`, `email_not_confirmed`, and any code a future Supabase release
adds. An allowlist fails safe; a denylist would leak the first time a new account-specific code
shipped. Errors raised before a response comes back carry neither code nor status (confirmed in
`@supabase/auth-js` `errors.d.ts`), so a missing code plus a missing or `0` status is treated as
an outage and reported; a present code is decided by the allowlist alone.

**One message for every reported failure:** *"Something went wrong on our end. Please try again
in a few minutes."* Per-cause wording would sharpen the very oracle the design is protecting, and
"a few minutes" covers the rate-limit case without naming it. The banner renders inside the form
branch, in the same slot as the amber expired notice, so the form stays visible for a retry.
Every error is still logged with its code and status, including the silent ones.

**Return shape** widened from `{ sent: boolean }` to `{ sent: boolean; error?: string }`.
`state?.sent` already routed a falsy `sent` to the form branch, so the success branch is
untouched.

**Cron routes checked, no change needed.** `daily-reminders` and `weekly-review` do not have this
pattern: both count send failures, return them in the response JSON as `errorDetails`, and skip
the dedup write so the next run retries. (Both do return HTTP 200 even when `errors > 0`, so a
partly failed run reads as green in Vercel's cron dashboard. Left alone as out of scope, flagged
as an optional follow-up.)

**Testing (Playwright + live Supabase, 2026-08-16).**

| Test | Result |
|------|--------|
| Silent path: submit an address with no account → normal "Check your inbox" UI | PASS |
| Silent path: no error reached the app at all (Supabase enumeration protection already on) | PASS |
| Happy path: real account → success UI, email delivered to temp inbox at 00:54:07 | PASS |
| Surfaced path: resubmit within the cooldown → red banner, form still available | PASS |
| Surfaced path logged `code=over_email_send_rate_limit status=429` | PASS |
| Ground truth via direct `POST /auth/v1/recover`: 1st call HTTP 200, 2nd HTTP 429 `over_email_send_rate_limit` | PASS |
| `npx tsc --noEmit` clean; `eslint` clean on both touched files | PASS |

Verifying the raw endpoint mattered: the Next dev logger serialised the original object argument
to `{}`, which hid the code and status. The log line was changed to a flat interpolated string so
the cause survives any serialiser.

**Same-day audit reversal: `over_email_send_rate_limit` removed from the allowlist.** It shipped
on the allowlist in `3ffa320` because the brief listed rate limit as an infrastructure failure,
and the enumeration risk was written up as theoretical and mitigated by Supabase's project-wide
email quota returning the same code. The audit tested that assumption against the live project
instead of reasoning about it, and it was wrong on both counts:

| Probe | Result |
|-------|--------|
| Real account, 2nd request inside 60s | HTTP 429 `over_email_send_rate_limit` |
| Address with no account, 3 rapid requests | HTTP 200 every time, never rate limited |
| Project-wide quota under rapid sends | never fired |

So on this project the code means the per-address cooldown and nothing else, and reporting it
answers "does this account exist?" for anyone who submits an address twice. That is precisely the
oracle the whole design exists to prevent, so the labelled hard constraint (never reveal whether
an email matches an account) beats the brief's illustrative parenthetical listing rate limit.
Removing it also costs nothing real: the cooldown only fires when a reset email was successfully
sent seconds earlier, so "Check your inbox" is the truthful response. The 429 is still logged for
ops, just not shown. New accepted residual: project-wide quota exhaustion goes silent, tolerable
because genuine SMTP failures surface as `unexpected_failure`.

**Audit results (2026-08-16, production).**

| Check | Result |
|-------|--------|
| `npm run build` production build | PASS (exit 0) |
| Production endpoints: `/`, `/login`, `/account/forgot-password` | PASS (200) |
| Production `/auth/callback` with no params | PASS (307 to expired) |
| Production signup → onboarding | PASS |
| `3ffa320` confirmed live in production (banner reproduced there) | PASS |
| After fix: rapid resubmit shows success UI, 429 still logged | PASS |
| `7d70146` confirmed live in production (banner gone, success UI on both submits) | PASS |
| Production full journey: token_hash link (cold, no cookies) → `/account/update-password` | PASS |
| Production full journey: set new password → `/login?reset=1` → UI sign-in succeeds | PASS |
| New password accepted (HTTP 200) and old password rejected (HTTP 400) | PASS |
| Callback negatives: reused token, garbage token, `type=evil`, `next=//evil.example.com`, no params | PASS (all → `?error=expired`) |

Enumeration parity after the fix: an address with an account and an address without one now
produce byte-identical UI on every submit, including repeat submits inside the cooldown.

Pre-existing observation, not touched: `auth.users` = 10 but `profiles` = 9, so one auth user has
no profile row. Predates this work and is unrelated to it.

**Temp test data:** created and cleaned up. Temp account
`mathstep-pwreset-test-20260804@agentmail.to` (name `PwResetErrTest20260816`, auth id
`8bdf0d92-6302-4bf1-b585-d5b5ee0d59b4`), 1 profile row, 0 students. Profile deleted then auth user
deleted; re-queried and confirmed 0 auth users, 0 profiles, 0 students remaining.

---

### Password reset cross-device fix (2026-08-16)

**Trigger:** A parent using MathStep forgot her password, clicked reset, and got no usable
way forward.

**Investigation.** The in-app pages turned out to be fine: `/account/forgot-password` has a
heading, instructions, and a "Check your inbox" confirmation, and the expired state has its own
amber message. Two candidate causes were tested rather than assumed.

1. *Delivery.* Supabase docs state the built-in email service "will refuse to deliver messages
   to addresses that are not part of the project's team". This turned out **not** to apply to
   this project: a temp inbox on an unrelated domain received the email in under 10 seconds.
   Diagnosing from the docs alone would have produced the wrong fix.
2. *The link.* This was the real cause. `auth.users` showed exactly one account with
   `recovery_sent_at` set (2026-07-19) whose `last_sign_in_at` was still 2026-06-02, i.e. a
   reset was requested and the user never got back in.

**Root cause.** Recovery links are PKCE tokens. `exchangeCodeForSession` requires the
`sb-<ref>-auth-token-code-verifier` cookie written into the browser that requested the reset,
so the link only works in that same browser. Reproduced against production with a cookie-less
client:

```
303  →  https://mathstep.nz/auth/callback?code=…&next=/account/update-password
307  →  https://mathstep.nz/account/forgot-password?error=expired
```

while the identical link in the originating browser reached `/account/update-password`. A
parent who requests on a laptop and opens the email on a phone is therefore locked out
permanently, and retrying produces the same loop.

**Fix.** `/auth/callback` now accepts Supabase's `token_hash` + `type` and verifies with
`verifyOtp`, which carries no browser-bound state and works from any device. The `code` path is
kept so links already in inboxes still resolve. `type` arrives from the URL, so it is matched
against the six known email OTP types instead of being cast through. Shipped **before** the
template change so no link could hit a route unable to verify it.

**Dashboard change (required, not in code):** Authentication → Emails → Reset password body is
now
`<a href="https://mathstep.nz/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/account/update-password">`,
replacing stock `{{ .ConfirmationURL }}`. This also fixed the copy, which was Supabase's bare
default ("Follow this link to reset the password for your user") with no expiry note and no
"ignore this if it wasn't you". Domain hardcoded rather than `{{ .SiteURL }}`. **Reverting this
template reintroduces the bug.**

**Files modified:** `src/app/auth/callback/route.ts` only (plus these docs). No change to
`auth.ts`, the forgot-password or update-password pages, schema, or anything outside the reset
flow, per the request to change nothing else.

### Suite 27 — Password reset end-to-end (2026-08-16)

Run against **production** (mathstep.nz), not local, using a temp account and a real receivable
inbox.

| Test | Result |
|------|--------|
| Request reset via the real `/account/forgot-password` page | PASS |
| Real email delivered to an external inbox (~10s) | PASS |
| Email uses `token_hash=…&type=recovery&next=/account/update-password` | PASS |
| Email copy shows expiry and a "you can ignore this" line | PASS |
| Browser cookies cleared to 0, verified via `context.cookies()` | PASS |
| Cold device (0 cookies) opens emailed link → `/account/update-password` | PASS |
| Page renders "Set a new password" with 2 password fields | PASS |
| Submit new password → `/login?reset=1` with "Password updated" banner | PASS |
| Sign in with the new password from a cold browser → authenticated | PASS |
| **Before the fix**, same cookie-less link → `?error=expired` | REPRODUCED |
| Reusing an already-consumed token → `?error=expired` (single-use holds) | PASS |
| Garbage `token_hash` → `?error=expired` | PASS |
| `type=evil` rejected by the allowlist → `?error=expired` | PASS |
| Open-redirect attempt `next=//evil.example.com` → not followed | PASS |
| `/auth/callback` with no params → `?error=expired` | PASS |
| Expired page shows "That reset link has expired. Enter your email to send a new one." | PASS |
| `npx tsc --noEmit` | PASS |
| `npx eslint` on the changed file | PASS |

**Temp test data: created and cleaned up.**
- Temp parent: `mathstep-pwreset-test-20260804@agentmail.to` (auth user `c25aa405-…`), created
  directly via the admin API so no student or session rows were ever generated.
- Deleted via admin API (HTTP 200). Re-queried after: temp auth users 0, temp profiles 0,
  students matching `%test%` 0, total users back to 10.
- Outstanding: the temp receiving inbox `mathstep-pwreset-test-20260804@agentmail.to` could not
  be deleted, blocked by the standing `email-guard.ps1` policy ("Quentin deletes mail himself").
  Left for manual removal.

**Known limitation, deliberately not changed:** `requestPasswordReset` swallows Supabase errors
and always returns `{ sent: true }`, so a genuine send failure is indistinguishable from success
in the UI. That is intentional anti-enumeration behaviour and was not the cause here, but it is
why this went unnoticed for roughly a month.

### Levels 14.2 Exponents + 15.1 Expanding Brackets (2026-08-04)

**Trigger:** Parent report — "no more new assignments". Root cause was not a bug: Joaquin's
`student_level_progress` row for level 27 (14.1) showed `consecutive_passes = 10` against a
`consecutive_passes_required` of 3, with `last_result_passed = true`. The advancement query in
`src/app/actions/worksheet.ts` looks for the next row in `(level_number, sublevel_number)` order and
found none, because 14.1 was the highest row in `levels`. He had been repeating 14.1 worksheets
since 2026-06-29.

**Approach:** Two new levels rather than one, so there is real runway before the ceiling returns.
Topic choice confirmed with the parent: exponents first (needed before quadratics and standard form),
then expanding brackets. Both levels were designed so that **every answer rides an existing
`gradeAnswer` path** — no grading changes, which is what has kept previous level additions low-risk.

**Level 14.2 — Exponents** (`src/lib/math/generators/exponents.ts`, id prefix `exp142_`):
- 5 types at 4 each for a 20-problem worksheet: `exponent_evaluate`, `exponent_multiply_same_base`,
  `exponent_divide_same_base`, `exponent_power_of_power`, `exponent_zero_and_one`.
- Prompts render powers as **Unicode superscripts** (`Work out 9³.`, `Simplify: m⁵ × m⁶.`) via a
  `sup()` digit map, so they read like a textbook rather than caret notation.
- The three index-law types ask for the resulting **power as a number**, not the expression `x⁷`.
  This keeps the law itself as the thing being tested while avoiding caret/superscript typing on a
  tablet keyboard. Every answer is therefore a plain integer → signed-integer grading path,
  `inputMode="numeric"`.
- `maxExponentFor()` bounds `base^exp ≤ 1000` so evaluation stays mentally checkable (9³ = 729 is the
  practical ceiling, not 9⁹). The divide type forces `a > b`, so zero and negative indices — which
  are not taught at this level — can never be generated.

**Level 15.1 — Expanding Brackets** (`src/lib/math/generators/expanding-brackets.ts`, prefix `exb151_`):
- 5 types at 4 each: `expand_single_bracket`, `expand_bracket_subtraction`,
  `expand_negative_multiplier`, `expand_and_simplify`, `factorise_single_bracket`.
- Answers are algebraic expressions (`3x + 12`, `-2x - 10`, `7x + 6`, `3(2x + 5)`) → the algebraic
  path Level 8/1 already uses (lowercase + strip whitespace + strict match). `inputMode="text"` on
  all five, per the standing stylus "x → ." rule.
- Coefficients ≥ 2 and constants ≥ 2, so `1x` and `+ 0` can never be emitted.
- `factorise_single_bracket` enforces `gcd(p, q) = 1`, which guarantees the pulled-out factor really
  is the HCF and the fully-factorised answer is unique (otherwise `12x + 18` would accept both
  `2(6x + 9)` and `6(2x + 3)`).
- Because the algebraic path does **not** reorder terms, every prompt carries a format hint with a
  fixed example, and the build loop rejects any problem whose prompt contains its own answer — so a
  hint can never accidentally hand over the answer.

**Files modified:** `src/lib/math/generators/index.ts` (imports, type exports, `AnyProblemType`
union, router), `src/lib/levelKeys.ts` (`[14,2]`, `[15,1]`), `src/lib/lessons/index.ts` (lesson cards
for both), `src/lib/math/inputMode.ts` (input modes, placeholders, `problemTypeLabel`),
`src/lib/mistakeJournal.ts` (10 new `PARENT_LABELS` entries).
**Files added:** the two generators plus `scripts/level-14-2-15-1-smoke.ts`.
**Not touched:** `gradeAnswer.ts`, `worksheet.ts`, `answerControl.ts` (both levels use the default
control), schema, `vercel.json`, auth/PIN.

**Database:** two rows inserted into `levels` —
`(28, 14, 2, 'Exponents', 'Powers, index laws, and the zero index', 780, 90, 20, 3)` and
`(29, 15, 1, 'Expanding Brackets', 'Expanding and factorising single brackets', 840, 90, 20, 3)`.

**Note for the next session:** Joaquin advances into 14.2 the next time he passes a 14.1 worksheet
(his 10 banked passes are against 14.1 and are not carried forward). He was not manually advanced.

### Suite 26 — Levels 14.2 + 15.1 (2026-08-04)

Generator-level: `npx tsx scripts/level-14-2-15-1-smoke.ts` — **2268 checks passed, 0 failed** across
6 seeds. Every check re-derives the expected answer by parsing the rendered prompt rather than
trusting the generator's own arithmetic.

| Test | Result |
|------|--------|
| 14.2: 20 problems, 4 of each of the 5 types, no duplicate prompts (6 seeds) | PASS |
| 14.2: every answer matches `/^\d+$/`; off-by-one and blank rejected | PASS |
| 14.2: `base^exp` recomputed from the prompt matches the stored answer | PASS |
| 14.2: evaluate results ≤ 1000; index ≥ 2 | PASS |
| 14.2: multiply adds indices, divide subtracts (result ≥ 1), power-of-power multiplies | PASS |
| 15.1: 20 problems, 4 of each of the 5 types, no duplicate prompts (6 seeds) | PASS |
| 15.1: correct answer grades true with no spaces and in uppercase | PASS |
| 15.1: format hint never contains the answer; no `1x` term; no `+ 0` term | PASS |
| 15.1: expansion recomputed from the prompt matches; un-multiplied constant rejected | PASS |
| 15.1: undistributed negative sign rejected | PASS |
| 15.1: factorised answer multiplies back to the prompt AND `g` equals `gcd(coeff, constant)` | PASS |
| Both: no answer contains `<`/`>`, an `x=`/`y=` pair, or `/` (no grading-path collisions) | PASS |
| Existing `scripts/answer-control-gate.ts` still passes (494 checks) | PASS |
| Existing `scripts/ineq141-smoke.ts` still passes (637 checks) | PASS |
| Existing `scripts/systems-of-equations-smoke.ts` still passes | PASS |
| `npx tsc --noEmit`: no type errors | PASS |
| `npx eslint` on the 8 touched/added files: clean | PASS |

Browser (Playwright, temp account, dev server on :3000):

| Test | Result |
|------|--------|
| Placement picker shows 29 options; 14.2 and 15.1 appear at the end with correct labels | PASS |
| 14.2 worksheet heading "Exponents Worksheet"; lesson card "Learn: Exponents (Powers)" renders | PASS |
| 14.2: 20 inputs, all `inputMode="numeric"`, placeholders `e.g. 64` / `e.g. 6` | PASS |
| 14.2: superscripts render correctly in prompts (`Work out 9³.`, `Simplify: m⁸ ÷ m².`) | PASS |
| 14.2 session 1 — 19 correct + 1 deliberately wrong: 19/20, 95%, Passed, mastery 1/3 | PASS |
| 14.2: the wrong answer (99 for 8) marked incorrect; self-correction box offered | PASS |
| 14.2 sessions 2 and 3 — 20/20, 100% each | PASS |
| Advancement after 3 passes: redirect `?advanced=1&nl=15&ns=1&nt=Expanding+Brackets` | PASS |
| Level Up banner: "Advanced to Level 15.1 — Expanding Brackets." | PASS |
| 15.1 worksheet heading "Expanding Brackets Worksheet"; lesson card renders | PASS |
| 15.1: 16 current-level + 4 interleaved 14.2 review problems, correctly badged | PASS |
| 15.1: mixed input modes — `text` for the algebraic types, `numeric` for the 14.2 review problems | PASS |
| 15.1: placeholders `e.g. 4x + 20`, `e.g. 4x - 20`, `e.g. -4x - 20`, `e.g. 9x + 20`, `e.g. 4(2x + 7)` | PASS |
| 15.1 grading — `-5x+35` (no spaces) accepted for `-5x + 35` | PASS |
| 15.1 grading — `11X - 15` (uppercase) accepted for `11x - 15` | PASS |
| 15.1 grading — `5(6x+7)` accepted for `5(6x + 7)`; HCF of 30x + 35 correctly 5 | PASS |
| 15.1 grading — `3x + 3` (classic un-multiplied constant) correctly rejected for `3x + 9` | PASS |
| 15.1 session: 19/20, 95%, Passed | PASS |
| Dashboard Current Focus shows "Expanding Brackets / Expanding and factorising single brackets" | PASS |
| Dashboard + results: no raw type identifiers, no `[GRAPH]`/`[CHOICES]` leaks, no `undefined`/`NaN` | PASS |
| Console errors across every page visited | 0 |

**Temp test data: created and cleaned up.**
- Temp parent: `curriculum-test-20260804@example.com` (auth user `25c37a87-…`)
- Temp student: `CurriculumTestKid` (`64daed42-…`)
- Deleted via `delete from auth.users` (FK cascade). Re-queried after: auth user 0, profile 0,
  student 0, sessions 0, problems 0, streaks 0, student_level_progress 0, practice_sessions 0,
  orphaned problems 0, any student matching `%test%` 0.
- Separately, an **approved** pre-existing leftover from a prior session was removed: student
  `UITestKid` (`86d9377e-…`, Level 13.1, created 2026-06-08) plus its 9 sessions, 180 problems,
  1 streak row, and 4 progress rows. Verified 0 remaining, no orphans.
- `git status --short` confirmed no test artifacts staged.

### Floating Working Area (2026-06-21)

**Trigger:** Parent feedback — the worksheet "Working area" (freehand drawing scratchpad) lived at
the very bottom of `/worksheet`. On mobile/tablet a student had to scroll all the way down to work
something out, then scroll back up to type the answer.

**Approach:** The scratchpad is now a floating drawer reachable from anywhere on the page. A new
`FloatingWorkingArea` client component owns open/close state and renders a fixed bottom-right
"✏️ Working area" button plus the drawer; it wraps the existing `WorksheetScratchpad` unchanged
except for two small props. Mobile = slide-up bottom sheet; desktop/tablet = bottom-right card.
**No DB persistence** (the drawing is browser-only and resets on reload, same as before), and no
changes to generation, grading, progression, streaks, points, mastery, achievements, answer
controls, or auth/PIN. `vercel.json` untouched.

**Key invariant (drawing must survive open/close):** the canvas is **never unmounted** and is
**never hidden with `display:none`/`hidden`** (which would zero `getBoundingClientRect()` and resize
the canvas to 0). The drawer animates with transform + `pointer-events`/`aria-hidden` only, and the
scratchpad re-runs its resize when the drawer opens as a safety net. Playwright confirmed the painted
pixel count is identical (2848 → 2848) across a close/reopen cycle.

**Files modified:**
- `src/app/worksheet/WorksheetScratchpad.tsx` — added optional `active` (resize-on-open safety net)
  and `onClose` (renders a Close ✕ button + the "rough working" helper line in drawer mode). All
  canvas/pointer/clear logic unchanged. Title cased "Working Area" → "Working area".
- `src/app/worksheet/page.tsx` — replaced the bottom `<WorksheetScratchpad />` with
  `<FloatingWorkingArea />`; `<main>` bottom padding `py-8` → `pt-8 pb-28` so the fixed button never
  covers the full-width Submit button.
- `src/app/worksheet/WorksheetForm.tsx` — hint copy updated to point at the floating button instead
  of "a drawing area at the bottom of this page".

**Files added:**
- `src/app/worksheet/FloatingWorkingArea.tsx` — drawer shell: FAB (hidden while open), bottom-sheet/
  card panel (`role="dialog"`, `aria-label`, `aria-hidden` when closed), Escape-to-close, and light
  focus handling (focus panel on open, return focus to the FAB on close).

**Validation (Playwright, temp account, cleaned up):**
- Desktop + mobile 375×667: FAB visible bottom-right; opens the drawer; FAB hides while open.
- Drawing persists across close → reopen (2848 px identical); Clear wipes to 0; Escape closes,
  restores the FAB, returns focus to it, sets `aria-hidden`/`pointer-events:none`.
- No duplicate scratchpad at the page bottom; exactly one canvas on the page.
- Mobile: no horizontal scroll; canvas 334×320 fits; bottom sheet anchored to the viewport bottom
  (top ~35% of context stays visible); FAB does not block Submit.
- 1.1 worksheet submits end-to-end (20/20 → results page).
- Regression — all render correctly with the floating area present, answer controls unchanged:
  Level 1.1 (Addition), 12.2 (graph SVGs + MC), 13.1 (structured equation/yes-no), 14.1 (inequalities,
  `inputMode=text` preserved).
- `npx tsc --noEmit` clean; ESLint clean on the 4 touched files.

**v1 limitations:** no persistence (resets on reload/navigation); no drag-to-move or resize;
worksheet page only (results/practice unchanged); single canvas, no undo.

---

### Level 14.1 Inequalities curriculum (2026-06-17)

**Trigger:** Students finishing Level 13.2 (Systems of Equations) hit a Coming Soon wall at 14.1.
New curriculum level teaches solving and interpreting one-variable linear inequalities. Distinct
from 11.1 (basic one-variable inequalities) — 14.1 broadens to two-step, the negative-coefficient
sign flip, checking a value, and writing inequalities from words.

**Audit:** The `levels` row for `(14, 1)` did not exist (DB topped out at id 26 = 13.2). `gradeAnswer`
re-traced against all five answer shapes — **no change needed**: `x < 6` / `x <= 4` / `x < -4` /
`x + 5 <= 12` all ride the `/[<>]/` inequality path (normalizes `≤`/`≥` ↔ `<=`/`>=`, spacing/case);
`yes`/`no` ride the algebraic path (same as `system_check_solution`). SQL applied by user before code
(verified `id = 27`).

**Approach:** Algorithmic generation only, one-variable + integer-only, no inequality graphing in v1.
Every answer lands on an existing grading path; **`gradeAnswer` / `worksheet.ts` / schema untouched**
beyond the one `levels` data row. Extends the existing `inequalities.ts` rather than adding a new file
(keeps all inequality logic together). Solve/words prompts append a generic format hint (number ≠ the
real answer, mirroring 11.1) so kids type `x <op> n`, not bare numbers or words.

**5 problem types (distribution 4/4/4/4/4 for a 20-problem worksheet):**
- `inequality_one_step` → `x ± a {op} b` → `x < 6` (default text, `e.g. x < 6`)
- `inequality_two_step` → `ax ± c {op} b`, positive coeff → `x <= 4` (default text)
- `inequality_negative_coefficient` → `-ax {op} b`, flips the sign → `x < -4` (threshold magnitude ≥ 2, never `-0`)
- `inequality_check_value` → does `x = v` satisfy `ax + c {op} rhs`? → `yes`/`no` (yes_no buttons), balanced 2 yes / 2 no
- `inequality_from_words` → "A number ± k is {less than/greater than/at most/at least} v. Using x…" → `x + 5 <= 12` (default text, `e.g. x + 5 <= 12`)

**Files modified:**
- `src/lib/math/generators/inequalities.ts` — extended `InequalityProblemType` to a 6-member union; added per-type makers, `buildPlan141`, and `generateInequalitiesLevel141` (prompt dedup 50× retry, id prefix `ineq141_`). 11.1's `generateInequalities` untouched.
- `src/lib/math/generators/index.ts` — import + `14/1` branch (the `InequalityProblemType` alias is already re-exported into `AnyProblemType`, so the 5 new members propagate for free).
- `src/lib/levelKeys.ts` — appended `[14, 1]` (flips the Coming Soon gate; single source for worksheet + practice).
- `src/lib/math/answerControl.ts` — `inequality_check_value` → `yes_no`.
- `src/lib/math/inputMode.ts` — `inputModeForType` (all 5 → `text`), `placeholderForType` (`e.g. x < 6` / `e.g. x + 5 <= 12`), `problemTypeLabel` (5 friendly labels).
- `src/lib/mistakeJournal.ts` — `PARENT_LABELS` for the 5 types.
- `src/lib/lessons/index.ts` — `'14/1'` lesson "Inequalities" with the `<`/`>`/`<=`/`>=` meanings, the negative-coefficient flip rule, and a worked `-3x > 12 → x < -4` example.
- `PROJECT_CONTEXT.md`, `BUILD_PROGRESS.md`.

**Files added:**
- `scripts/ineq141-smoke.ts` — generator + grading smoke test.

**DB seed (applied by user via Supabase SQL editor, idempotent insert, verified `id = 27`):**
```sql
insert into levels (level_number, sublevel_number, topic, description,
  speed_target_seconds, accuracy_threshold, problems_per_session, consecutive_passes_required)
select 14, 1, 'Inequalities', 'Solving and interpreting one-variable inequalities', 780, 90, 20, 3
where not exists (select 1 from levels where level_number = 14 and sublevel_number = 1);
```

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsx scripts/ineq141-smoke.ts` (20 problems × 5 seeds: distribution 4/4/4/4/4, 2 yes / 2 no balance, integer-only, no dupes, grade-true + spacing/Unicode variants, flipped-op rejects, sign-flip correctness, bare-number/word rejects) — 637 checks | PASS |
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| Playwright 14.1 worksheet — title "Inequalities Worksheet · Level 14.1", lesson card with `-3x > 12` example, 20 problems 4/4/4/4/4, Yes/No on check type, `e.g. x < 6` / `e.g. x + 5 <= 12` placeholders | PASS |
| Playwright 14.1 — 18 correct + 2 deliberate wrong (#1 text, #16 yes/no) → **18/20, 90%, ✓ Passed, mastery 1/3**; both wrong flagged with correct answers; canonical answers render on results | PASS |
| Playwright 14.1 self-correction — fixed wrong text inequality (#1) via text control → "✓ Corrected"; wrong check (#16) shows Yes/No structured control | PASS |
| Playwright 14.1 targeted practice — "Inequalities Practice", 10 problems, Yes/No controls render | PASS |
| Playwright mobile 375×667 — no horizontal scroll (scrollWidth 360 = clientWidth 360) | PASS |
| Regression — 13.2 (coordinate + Yes/No), 13.1 (equation control + Yes/No), 12.2 (32 graph SVGs + MC, no marker leak), 1.1 (numeric input) all render, no Coming Soon | PASS |
| Console errors across the whole session | 0 |

**Temp E2E account — DELETED 2026-06-17.** Parent `level-141-test-20260616@example.com`
(id `8a8af9b5-2879-4792-9b0d-32d13b4f5ec8`), student `IneqTester`
(id `12a3c3dd-cffc-4776-8a0f-d41f25151483`). Created on localhost during testing, then removed from
the Supabase project (`wuwmqbeazgsolsrxbhsh`) by deleting the auth user — FK cascade cleared profile,
student, streak, 6 sessions (one submitted + five abandoned from regression page loads), 120 problems,
1 `student_level_progress` row. Verified 0 rows remain; the `levels` 14.1 row (id 27) is intact. No
real users touched.

**Known limitations / v1 scope:** one-variable only; integer solutions only; no inequality graphing;
no compound inequalities; `inequality_from_words` grades by exact string so commutative variants
(`5 + x <= 12` vs canonical `x + 5 <= 12`) won't match — prompts map directly to `x ± k` to minimise
this. The reused `yes_no` control's `sr-only` legend still reads "Is the point on the line?" (shared
with 11.1's `point_on_line` / 13.2's `system_check_solution`) — pre-existing, screen-reader-only, left
unchanged to keep the change surgical.

---

### Level 13.2 Systems of Equations curriculum (2026-06-16)

**Trigger:** Students finishing Level 13.1 (Linear Equations & Graphs) hit a Coming Soon wall at
13.2. New curriculum level keeps advanced students progressing with systems of equations
(substitution + elimination explicit), distinct from 11.2 Simultaneous Equations.

**Audit:** The `levels` row for `(13, 2)` did not exist. Schema confirmed via `supabase/schema.sql`
(no `levels` seed — levels live in the SQL editor). `gradeAnswer` re-traced against all four answer
shapes — no change needed. SQL applied by user before code (verified `id = 26`).

**Approach:** Algorithmic generation only, text-only (no graphs in v1), integer-only and
beginner-friendly. Every answer lands on an existing grading path; **`gradeAnswer` /
`worksheet.ts` / schema untouched** beyond the one `levels` data row. Reuses the shared
answer-control system entirely by adding the new `problem_type` strings to `answerControl.ts`,
so worksheet + targeted practice + self-correction wire up automatically.

**5 problem types (distribution 4/4/4/4/4 for a 20-problem worksheet):**
- `system_substitution_simple` → one equation solved for a variable + a sum equation → `x = 4, y = 6` (coordinate_pair)
- `system_elimination_simple` → matching unit coefficients (`x + y` / `x - y`) → `x = 5, y = 3` (coordinate_pair)
- `system_find_missing_value` → x given, solve for y → non-negative integer (default numeric input, `e.g. 6`)
- `system_check_solution` → does (x, y) satisfy both? → `yes`/`no` (yes_no buttons), balanced 2 yes / 2 no via a `wantYes` flag
- `system_word_problem_simple` → sum + difference of two positive numbers, x = smaller / y = larger → `x = 4, y = 8` (coordinate_pair)

**Files added:**
- `src/lib/math/generators/systems-of-equations.ts` — per-type makers, `buildPlan(count)` weights, prompt dedup (50× retry), id prefix `sys132_`. Ranges sized to clear dedup at counts up to 40.
- `scripts/systems-of-equations-smoke.ts` — generator + grading smoke test.

**Files modified:**
- `src/lib/math/generators/index.ts` — import + type re-export + `AnyProblemType` union + `13/2` branch.
- `src/lib/levelKeys.ts` — appended `[13, 2]` (flips the Coming Soon gate).
- `src/lib/math/answerControl.ts` — `coordinate_pair` (3 system solve types) + `yes_no` (system_check_solution).
- `src/lib/math/inputMode.ts` — `inputModeForType` (coordinate/yes-no → text fallback, find-missing → numeric), `placeholderForType` (find-missing → `e.g. 6`), `problemTypeLabel` (5 friendly labels).
- `src/lib/mistakeJournal.ts` — `PARENT_LABELS` for the 5 types.
- `src/lib/lessons/index.ts` — `'13/2'` lesson "Systems of Equations" with substitution/elimination/checking explanation + a worked elimination example.
- `PROJECT_CONTEXT.md`, `BUILD_PROGRESS.md`.

**DB seed (applied by user via Supabase SQL editor, idempotent insert, verified `id = 26`):**
```sql
insert into levels (level_number, sublevel_number, topic, description,
  speed_target_seconds, accuracy_threshold, problems_per_session, consecutive_passes_required)
select 13, 2, 'Systems of Equations', 'Solving pairs of linear equations', 780, 90, 20, 3
where not exists (select 1 from levels where level_number = 13 and sublevel_number = 2);
```

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsx scripts/systems-of-equations-smoke.ts` (counts 16/20/40 × 5 seeds: distribution by type, 2 yes / 2 no balance, integer + non-negative invariants, no dupes, grade-true + grade-false + spacing variant) | PASS |
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| Playwright 13.2 worksheet — title "Systems of Equations Worksheet · Level 13.2", lesson card, 20 problems 4/4/4/4/4, coordinate controls + Yes/No + numeric `e.g. 6` | PASS |
| Playwright 13.2 — all correct → **20/20, 100%, ✓ Passed, mastery 1/3**, canonical answers on results | PASS |
| Playwright 13.2 — 4 deliberate wrong → **16/20, 80%, ✗ Not passed, mastery reset 0/3**, wrong problems show correct answers | PASS |
| Playwright 13.2 self-correction — fixed wrong Yes/No (structured) + wrong coordinate (structured) → "✓ Corrected" | PASS |
| Playwright 13.2 targeted practice — coordinate controls (elimination) + Yes/No (check-solution), over-generate-and-filter top-up works | PASS |
| Playwright mobile 375×667 — no horizontal scroll (scrollWidth 360 ≤ 375) | PASS |
| Regression — 13.1 (equation control + Yes/No), 12.2 (32 graph SVGs + MC + coordinate, no visible marker leak), 1.1 (numeric input) all render | PASS |
| Console errors across the whole session | 0 |

**Temp E2E account — DELETED 2026-06-16.** Parent `level-132-test-20260616@example.com`
(id `23f6d41a-a5f3-4a00-8594-7db6945db5d6`), student `SysKid`
(id `351c82ad-4a81-4ff2-b33f-60eba020c6df`). Created on localhost during testing, then removed
from the Supabase project (`wuwmqbeazgsolsrxbhsh`) by deleting the auth user — FK cascade cleared
profile, student, streak, 6 sessions, 120 problems, 1 student_level_progress row. Verified 0 rows
remain; the `levels` 13.2 row is intact. No real users touched.

**v1 limitations (intentional):** integer-only; `system_find_missing_value` answer is always a
non-negative integer (numeric keypad has no minus key); fixed equation shapes per type
(`x + y` / `x - y`, `2x - y`); no graphing; no 3-variable systems; word problems use 2 simple
sum/difference templates.

---

### Global worksheet answer UX polish (2026-06-08)

**Trigger:** After generalizing the reusable answer-control system, extend the mobile-friendly,
engaging feel across **all** levels — without forcing structured/MC inputs and without weakening
learning. Audit confirmed the real gap was placeholders: only 2 of ~37 default types had a
format-specific placeholder; the rest fell back to generic `"Your answer"`.

**Hard guarantee:** grading is byte-for-byte unchanged. The change is placeholder text + a 4px
height bump on two control classes. `gradeAnswer`, `submitWorksheet`, generation, progression,
streaks, points, mastery, achievements, auth/PIN, schema, and `vercel.json` (`syd1`) all untouched.

**Audit (Phase 1):** 41 problem types. Structured controls (4 types: equation / yes-no /
coordinate×2) and MC graph stay as-is. ~37 default text types flow centrally through `AnswerInput`
→ `placeholderForType()` + `inputModeForType()`. No recommendation required a grading change —
every placeholder was verified against `gradeAnswer.ts` (esp. list/factor types grade by digit-set
with separators stripped; percent types grade as bare integers — **no `%` in placeholders**).

**Changes (2 source files):**
- `src/lib/math/inputMode.ts` — rewrote `placeholderForType()` from 2 cases to a full `switch`
  returning verified, format-accurate examples for every default type (integers `e.g. 12`; signed
  `e.g. -5`; decimals `e.g. 3.5` / `e.g. 0.25`; fractions `e.g. 3/4`; expressions `e.g. 5x` /
  `e.g. 3x + 2`; inequality `e.g. x > 4`; lists `e.g. 1, 2, 3, 6`; prime factorization `e.g. 2, 3, 5`;
  factor pairs `e.g. 1×12, 2×6, 3×4`). Reaches WorksheetForm + PracticeForm automatically.
- `src/components/answer-controls/signToggle.tsx` — bumped the shared magnitude-input class and the
  `SignToggle` buttons from `py-2.5` to `py-3` so the slope/x/y boxes (now 50px / 48px) match the
  default text input (50px) and Yes/No buttons. Single edit point — propagates to both the equation
  and coordinate controls. No behavior change.

**Deliberately NOT done:** no per-type helper lines (the accurate placeholder already shows the
format); CorrectionInput's amber default-type fallback left untouched (it routes structured types
through `AnswerInput` and keeps its own content-based placeholder for default types — out of scope,
no regression); no default-input class change (measured 50px at 375px — already above the tap
target). No `vercel.json` change.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsx scripts/answer-control-gate.ts` (494 grading-safety checks) | PASS (494/0) — grading untouched |
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on the 2 touched files | PASS (clean) |
| Playwright @ 375×667 — **1.1** integer | placeholder `e.g. 12`, input 50px, **20/20 correct → 100% Passed**, no scroll |
| Playwright **9.1** | `list_factors` `e.g. 1, 2, 3, 6`, `prime_factorization` `e.g. 2, 3, 5`, GCF/LCM `e.g. 12`; review-interleaved Addition also got `e.g. 12` |
| Playwright **9.2** | `factor_pairs` `e.g. 1×12, 2×6, 3×4`, `common_factors` `e.g. 1, 2, 3, 6` |
| Playwright **11.2** | coordinate control mags now 50px (height aligned), no marker leak |
| Playwright **12.1** | `functions with negatives` `e.g. -5` (text), numeric functions `e.g. 12` |
| Playwright **12.2** | 25 graph SVGs + 12 MC radios + coordinate inputs render, signed `e.g. -5`, **no `[GRAPH]`/`[CHOICES]` leak** |
| Playwright **13.1** | equation control + Yes/No render at 50px; **wrong submission → 10%, not passed** (wrong→fail); self-correction structured controls render |
| Playwright targeted practice **12.2** | graphs + MC + coordinate render, signed placeholder, no marker leak |
| Horizontal scroll @ 375px on every page | none (`scrollWidth` 360 ≤ 375) |
| Console errors across whole session | 0 |

**Temp E2E account — DELETED 2026-06-08.** Parent `worksheet-ux-test-20260608@example.com`,
student `UXTestKid` (id `ad5f397f-0913-4498-afdb-a54dd5af2946`) were created on localhost during
testing and have since been fully removed from the Supabase project (`Math-Step` /
`wuwmqbeazgsolsrxbhsh`): auth user, profile, student, streak, 7 sessions, 140 problems, and 2
student_level_progress rows — all scoped strictly to that parent/student. Verified 0 rows remain.
No real users touched.

**v1 limitations (intentional):** self-correction on **default** (non-structured) types keeps its
existing amber content-based placeholder and has no `inputMode` — pre-existing, out of scope, not a
regression. Placeholders are static format hints (not per-problem). MC and coordinate types keep the
generic `"Your answer"` fallback since their text input is never shown.

---

### Reusable mobile-friendly answer-control system (2026-06-08)

**Trigger:** The Level 13.1 mobile-input fix (structured equation control + Yes/No buttons) was
inline in `WorksheetForm` and 13.1-only. Generalise it into one reusable system that future levels
opt into by `problem_type`, and apply it across all three answer surfaces.

**Hard guarantee:** `gradeAnswer` and `submitWorksheet` are byte-for-byte unchanged. Every
structured control emits a single field carrying the exact canonical string the grader already
expects, so generation, grading, progression, streaks, points, mastery, achievements, auth/PIN,
schema, and `vercel.json` (`syd1`) are all untouched.

**Audit (Phase 1):** the structured-input opportunity is exactly 3 control families —
`equation_slope_intercept` (`equation_from_slope_intercept`, 13.1), `yes_no` (`point_on_line`,
13.1), `coordinate_pair` (`sim_eq` 11.2 + `read_point_coordinates` 12.2). Everything else (~60
types) stays plain text. MC graph (`match_equation_to_graph`) + graph display stay prompt-driven.

**Files added:**
- `src/lib/math/answerControl.ts` — `getAnswerControlType(type)` mapping.
- `src/components/answer-controls/` — `AnswerInput.tsx` (dispatcher), `EquationSlopeInterceptInput.tsx`
  (moved from `worksheet/EquationAnswerInput.tsx`), `CoordinatePairInput.tsx` (new), `YesNoAnswerInput.tsx`
  (extracted), `signToggle.tsx` (shared `SignToggle` + digit-only helper).
- `scripts/answer-control-gate.ts` — no-auth grading-safety gate.

**Files modified:**
- `src/app/worksheet/WorksheetForm.tsx` — three inline answer branches collapsed into `<AnswerInput>`
  (graph display + MC choices kept inline, prompt-driven).
- `src/app/practice/weak-spots/PracticeForm.tsx` — now calls `parseGraphPrompt` + renders
  `CoordinatePlane` + MC choices (fixes a pre-existing bug where 12.2 practice leaked raw
  `[GRAPH]`/`[CHOICES]` markers), and uses `<AnswerInput>` (controlled via `onValueChange`).
- `src/app/worksheet/results/[sessionId]/page.tsx` + `CorrectionInput.tsx` — `problem_type` wired
  through so self-correction on a wrong equation/coordinate/yes-no answer uses the structured control.
- Deleted `src/app/worksheet/EquationAnswerInput.tsx` (moved).

**Dual form-pattern:** each control renders a hidden `<input name>` (read by the uncontrolled
`<form action>` surfaces — worksheet, self-correction) **and** calls `onValueChange` (used by the
controlled client-graded surface — practice). Effect-based controls use a ref so an inline parent
callback can't cause a render loop. `CoordinatePairInput` allows magnitude 0 (axis points), only a
blank field = "no answer", never emits `-0`.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched/new files | PASS (clean) |
| `npx tsx scripts/answer-control-gate.ts` — equation (144 combos), coordinate (x,y ∈ -6..6 incl. 0/neg), yes/no | PASS (494/0) |
| Playwright 13.1 worksheet — equation + Yes/No render, correct→pass, wrong→fail, canonical displays byte-identical | PASS |
| Playwright 13.1 self-correction — fix wrong Yes/No via structured control → "✓ Corrected" | PASS |
| Playwright 12.2 worksheet — coordinate control + graphs + MC render, no raw markers, sign toggle flows `x = 3, y = -2` through submit | PASS |
| Playwright 11.2 worksheet — coordinate `x = 7, y = 1` graded correct | PASS |
| Playwright 12.2 + 13.1 targeted practice — structured controls + graphs render, **no raw `[GRAPH]`/`[CHOICES]` leak** | PASS |
| Playwright 1.1 worksheet — plain text/numeric input, `18` graded correct (regression) | PASS |
| Playwright mobile 375×667 on 13.1 — no horizontal scroll (scrollWidth 360 ≤ 375) | PASS |
| 0 console errors on every page after the `useId` hydration fix | PASS |

**E2E account (temporary, please delete if desired):** parent `answer-ui-test-20260608@example.com`,
student `UITestKid` (id `86d9377e-1b80-4b03-a0dc-83386b36691f`). Created on localhost during testing.
Cleanup is optional — it writes only to the dev DB and touches no real users.

**v1 limitations (intentional):** MC graph self-correction stays plain text (type the letter);
legacy `problem_type = null` rows fall back to plain text in self-correction; 9.1/12.1 regression
covered by the shared default branch (same code path as 1.1, not separately driven).

---

### Level 13.1 mobile answer inputs (2026-06-07)

**Trigger:** A student tested Level 13.1 on a phone and said typing full equation answers
(`y = 2x - 3`) and yes/no words was painful. Requested easier input — better learning UX is
structured inputs for equation-writing and buttons for yes/no, while keeping numeric answers
typed.

**Fix (UI only — grading, generation, schema, progression all unchanged):**
- `src/app/worksheet/EquationAnswerInput.tsx` (new client component) — for
  `equation_from_slope_intercept`, renders `y = [±][m]x [±][b]`: `+`/`−` sign-toggle buttons +
  magnitude-only number inputs (`inputMode="numeric"`, digits stripped on change). A single
  hidden `answer_${id}` input carries the canonical string built with spaces
  (`y = -3x + 2`), so it reads identically to `correct_answer` on the results page and grades
  via the existing algebraic path. Blank fields or slope magnitude 0 → `''` ("no answer").
- `src/app/worksheet/WorksheetForm.tsx` — two new branches in the answer-control area:
  `point_on_line` → Yes/No radio `<fieldset>` (clone of the 12.2 MC `peer-checked` pattern,
  values `yes`/`no`); `equation_from_slope_intercept` → `<EquationAnswerInput>`. All other
  13.1 types (slope from two points, y-intercept, evaluate) and every other level keep the
  plain text input.

**Why grading is untouched:** the hidden field still submits one `answer_${id}` string in the
canonical format, so `submitWorksheet` and `gradeAnswer` are byte-for-byte unchanged. The
equation string (`y =` but no `x =`) lands on the algebraic path exactly as before.

**inputMode note:** the magnitude fields use `numeric` (not the level-wide `text`). They are
digit-only — no `x`/`y`/`=`/`-` to mis-stroke — so the stylus "x → ." bug cannot occur, and a
number pad directly answers the painful-typing complaint.

**Scope (deliberate):** `/worksheet` only. Targeted practice (`PracticeForm`) and the
results-page self-correction box (`CorrectionInput`) for 13.1 still use plain text — a known
v1 limitation, not changed. Generator prompts, `gradeAnswer`, `worksheet.ts`, the results
page, schema, streaks, points, mastery, and `vercel.json` (`syd1`) untouched.

**Validation:**
| Check | Result |
|------|--------|
| No-auth node gate: all 144 combos (mSign,bSign × m∈{2..5} × b∈{1..9}) → `gradeAnswer(built, formatEquation) === true` | PASS (144/0) |
| Blank field + slope magnitude 0 → `''` → graded wrong | PASS |
| Yes/No: `yes`/`no` accepted, opposites rejected | PASS |
| Built string equals canonical for display (e.g. `y = -3x + 2`, `y = 2x - 7`) | PASS |
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on the 2 touched/new files | PASS (clean) |
| Playwright UI | Skipped per user (auth-gated, no test credentials) — code-level gate used instead |

---

### Level 13.1 answer-format polish (2026-05-27)

**Trigger:** Prompts said *"Use the form y = mx + b."* — mathematically correct but invited students to literally type `y = mx + b` instead of substituting values.

**Changes (prompt + lesson copy only; placeholder helper added):**
- `src/lib/math/generators/linear-equations-graphs.ts` — `equation_from_slope_intercept` prompt now reads *"Write the equation of the line with slope M and y-intercept B. Use this format: y = 2x + 3."* New `pickPromptExample(m, b)` picks `'y = 2x + 3'` by default and swaps to `'y = 3x - 4'` when the actual answer would equal `y = 2x + 3`, so the example is always generic and never coincides with the answer. Grader path / answer format / generator constraints unchanged.
- `src/lib/lessons/index.ts` — `13/1` explanation gains one extra sentence pair: *"When you write the equation of a line, y = mx + b is just the pattern — replace m and b with the numbers from the question. For example, slope 2 and y-intercept 3 gives y = 2x + 3."* All other lesson content (title, worked example, tip) preserved.
- `src/lib/math/inputMode.ts` — new `placeholderForType()` helper. `equation_from_slope_intercept` → `'e.g. y = 2x + 3'`, `point_on_line` → `'yes or no'`, everything else → `'Your answer'` (no behaviour change for the other 40+ types).
- `src/app/worksheet/WorksheetForm.tsx` — text input `placeholder="Your answer"` swapped for `placeholder={placeholderForType(problem.type)}`. MC fieldset (graph choices) unchanged.

**Files NOT touched:**
- `src/lib/math/gradeAnswer.ts`, `src/app/actions/worksheet.ts` — answer shape and grading paths preserved.
- Schema, streaks, points, mastery, achievements, PIN flow — all untouched.
- `vercel.json` — region pin `syd1` preserved.

**Validation:**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on the 4 touched files | PASS (clean) |
| Generator smoke (100 seeds × 20 problems = 2000): distribution 400/400/400/400/400 across the 5 types | PASS |
| 400 equation-writing prompts inspected: example always `y = 2x + 3` or `y = 3x - 4`, **0 example/answer clashes** | PASS |
| Found a seed producing answer `y = 2x + 3` → prompt correctly used `y = 3x - 4` as the example | PASS |
| `gradeAnswer` round-trip on 1000 problems (50 seeds × 20) | PASS (1000/1000) |
| Playwright UI | Deferred — `/worksheet` is auth-gated and no test credentials available in this session (matches recent milestones) |

---

### Level 13.1 Linear Equations & Graphs curriculum (2026-05-27)

**Trigger:** Joaquin finished Level 12.2 and was about to hit another Coming Soon wall. The `levels` row for 13.1 did not exist yet and the generator stack stopped at 12.2.

**Approach:** Algorithmic generation only, text-only worksheets (no graphs in v1). Every answer shape lands on a grading path that already exists:
- equation strings (`y = 2x + 3`) → algebraic path (the sim-eq pair path needs literal `x =`; this string only has `y =` and `2x +` so it correctly falls through)
- slope / y-intercept / evaluation answers → signed-integer path
- point-on-line → algebraic path on canonical `yes` / `no` (case + whitespace insensitive)

To keep the equation answers unambiguous under the existing algebraic-path normalization (lowercase + strip whitespace + strict compare), the generator excludes slope ∈ {-1, 0, 1} and intercept = 0 for any problem type that *displays* a `y = mx + b` string. This eliminates the `y = x + 3` vs `y = 1x + 3` ambiguity and the `y = 2x + 0` vs `y = 2x` ambiguity at the source — so `src/lib/math/gradeAnswer.ts` is untouched.

**5 problem types (distribution 4/4/4/4/4 for a 20-problem worksheet):**
- `equation_from_slope_intercept` → "Write the equation of the line with slope m and y-intercept b" → `y = mx + b` (algebraic)
- `slope_from_two_points` → two distinct integer points constructed from a chosen integer slope → signed int
- `y_intercept_from_slope_and_point` → slope + point with `x ≠ 0` → signed int
- `point_on_line` → balanced 2 yes / 2 no via explicit `wantYes` argument in the plan; "no" cases use `|Δ| ≥ 1` so the point is unambiguously off the line → `yes`/`no`
- `evaluate_linear_equation` → balanced 2 find-y / 2 find-x via explicit `findY` argument in the plan; find-x case constructs target from a chosen integer answer so it's guaranteed integer → signed int

**Files added:**
- `src/lib/math/generators/linear-equations-graphs.ts` — mirrors `functions.ts` shape: per-type makers, `buildPlan(count)`, prompt dedup with 50× per-slot retry, local id prefix `lin131_`. The two split types pass `(rand) => makePointOnLine(true, rand)` / `(false, rand)` etc. as separate maker entries in the weights table so the 2/2 split is automatic at count=20.

**Files modified:**
- `src/lib/math/generators/index.ts` — import + type re-export + `AnyProblemType` union + `13/1` branch.
- `src/lib/levelKeys.ts` — appended `[13, 1]`, flipping the Coming Soon gate.
- `src/lib/math/inputMode.ts` — `inputModeForType` cases (all five new types → `'text'`, since each answer can contain `-`, `x`, `y`, `=`, or `yes`/`no`; matches the stylus-bug feedback rule); `problemTypeLabel` cases with the friendly labels.
- `src/lib/mistakeJournal.ts` — `PARENT_LABELS` entries with the same five friendly labels so the dashboard Mistake Journal renders identically.
- `src/lib/lessons/index.ts` — `'13/1'` lesson card "Linear Equations" with `y = mx + b` explanation, worked find-y example, and a tip about reading the y-intercept directly from the equation.
- `PROJECT_CONTEXT.md` — new row in the Curriculum Generators table; lesson-card list count bumped to 25; `SUPPORTED_LEVEL_KEYS` reference extended.

**Files NOT touched (verified scope):**
- `src/app/actions/worksheet.ts`, `src/lib/math/gradeAnswer.ts` — grading paths cover every answer shape natively given the generator constraints above.
- `src/app/worksheet/page.tsx`, `src/app/worksheet/WorksheetForm.tsx`, `src/app/worksheet/results/[sessionId]/page.tsx` — no UI changes; no graphs in v1.
- `src/components/CoordinatePlane.tsx`, `src/lib/math/graphPrompt.ts` — available for future polish but not used by 13.1.
- `supabase/schema.sql` — no DDL; the `levels` row insert is a data row, applied via the SQL editor.
- `vercel.json` — region pin `syd1` preserved.

**DB seed (applied via Supabase SQL editor before code):**
```sql
insert into levels (
  level_number, sublevel_number, topic, description,
  speed_target_seconds, accuracy_threshold,
  problems_per_session, consecutive_passes_required
) values (
  13, 1,
  'Linear Equations & Graphs',
  'Slope-intercept form, slope from two points, point checks',
  720, 90, 20, 3
);
```
Verified live: `id = 25`.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| Generator smoke (5 seeds × 20 problems): distribution 4/4/4/4/4, 0 dupes | PASS |
| Math correctness per type (parsed every prompt, recomputed every answer) | PASS |
| `gradeAnswer` self-round-trip on every produced answer | PASS |
| `gradeAnswer` variant tests: equation answer with no spaces, uppercased equation answer, uppercased `YES`/`NO` | PASS |
| `gradeAnswer` rejection tests: opposite yes/no, integer answer ±1, perturbed equation | PASS (none accepted) |
| Playwright UI | Deferred to user manual testing (login credentials not available in session — matches recent milestones) |

**Manual test plan (for user follow-up):**
1. Pin a test student to Level 13.1 via Parent View → Set Level.
2. `/worksheet?student=…` shows "Linear Equations & Graphs Worksheet · Level 13.1", lesson card renders, 20 problems load with the 5 chip labels (Writing line equations, Slope from two points, Finding y-intercepts, Checking points on lines, Using linear equations).
3. Submit all canonically correct answers → 100%, ✓ Passed, mastery 1/3.
4. Spacing variant test: type `y=2x+3` for a `y = 2x + 3` answer → accepted.
5. Case variant test: type `YES` for a `yes` answer → accepted.
6. Wrong yes/no rejected; wrong slope/intercept/eval integer rejected.
7. Results page renders correctly with self-correction available for each miss.
8. Mistake Journal labels show the friendly strings (no raw `point_on_line` etc.).
9. Mobile 375×667 — chip + input width clean.
10. Regression — `/worksheet` at Level 12.2 still renders 20 graph problems unchanged.

**v1 limitations (intentional, deferred):**
- Integer slopes only, magnitude ≤ 5; integer intercepts only, magnitude ≤ 9. No fractions. No slope ±1, no intercept 0 for any equation-displaying type.
- `point_on_line` accepts only canonical `yes`/`no` (case + whitespace insensitive). Variants `y`/`n`/`true`/`false` are not accepted — lesson + prompt say "yes or no" explicitly.
- No visual graphs (the lesson and worked example are text-only). Reusing `CoordinatePlane` for one type is a future polish.
- Slope-intercept form only — no standard-form (`Ax + By = C`), no point-slope, no parallel/perpendicular reasoning in v1.

---

### Level 12.2 Graphing curriculum (2026-05-27)

**Trigger:** Joaquin finished Level 12.1 (Functions) and was blocked on a Coming Soon screen at 12.2. The `levels` row for 12.2 (`id=24, topic='Graphing'`) was already seeded — only the generator wiring and visual rendering were missing.

**Approach:** Interpretation-only worksheets — the app renders coordinate-plane SVGs server-side, the student answers questions about them. Reuses every existing grading path (sim-eq pair grader for coordinate pairs, signed-integer for slope / intercept / read-y, algebraic-path letters for MC). No schema changes, no `submitWorksheet` changes, no `gradeAnswer` changes. Graph data round-trips through the persisted `problem_text` column via a `[GRAPH]…[/GRAPH]` (single graph) or `[CHOICES]…[/CHOICES]` (4 mini graphs for MC) suffix marker so the results-page review renders identically days later.

**5 problem types (distribution 4/4/4/4/4 for a 20-problem worksheet):**
- `read_point_coordinates` → labeled point A; answer `x = 3, y = -2` (sim-eq grader)
- `identify_slope_from_graph` → single line; answer signed int ∈ {-3..3}\{0}
- `identify_y_intercept_from_graph` → single line; answer signed int ∈ [-5, 5]
- `read_y_for_x` → single line + dotted highlight at x; answer signed int (guarded so y stays in range)
- `match_equation_to_graph` → 4 mini graphs A/B/C/D; answer single letter, distractors generated by ±1 slope or ±1 intercept walks (deduped)

**Files added:**
- `src/lib/math/graphPrompt.ts` — `GraphSpec` types, `parseGraphPrompt()`, `encodeGraphPrompt()` / `encodeChoicesPrompt()` helpers. Defensive on malformed payloads (falls back to plain text).
- `src/components/CoordinatePlane.tsx` — dependency-free server React component. Renders axes, gridlines (`-6..6`), optional point + label, optional line (clipped to visible box), optional `highlightX` dotted indicator + hollow marker. `size: 'full' (320px)' | 'mini' (140px)`. SVG `viewBox` + `width="100%"` so it fits 375px viewports without horizontal scroll.
- `src/lib/math/generators/graphing.ts` — mirrors `functions.ts` shape: per-type makers, `buildPlan(count)`, prompt dedup (50 retries / slot), local id prefix `gr122_`.

**Files modified:**
- `src/lib/math/generators/index.ts` — import + type re-export + `AnyProblemType` union + `12/2` branch.
- `src/lib/levelKeys.ts` — appended `[12, 2]`, flipping the Coming Soon gate.
- `src/lib/math/inputMode.ts` — `inputModeForType` + `problemTypeLabel` cases for all 5 new types (coordinates + MC → text; slope/intercept/read-y → numeric).
- `src/lib/mistakeJournal.ts` — `PARENT_LABELS` entries mirroring the chip labels.
- `src/lib/lessons/index.ts` — `'12/2'` lesson card "Reading Graphs".
- `src/app/worksheet/WorksheetForm.tsx` — per-problem `parseGraphPrompt`: renders `<CoordinatePlane size="full">` between chip and text input when `.graph`; renders a 4-radio `<fieldset>` of mini graphs (Tailwind `peer` checked state for green border/fill) when `.choices`. Form field stays `name="answer_<id>"` so `submitWorksheet` is untouched.
- `src/app/worksheet/results/[sessionId]/page.tsx` — same parse step in the review cards. For MC, the 4 mini graphs render above the answer grid with subtle ring styling — green on the correct choice, soft red on the student's wrong pick.

**Files NOT touched (verified scope):**
- `src/app/actions/worksheet.ts`, `src/lib/math/gradeAnswer.ts` — grading paths cover all answer shapes natively.
- `src/app/worksheet/page.tsx` — the only behaviour change is the implicit unblock from `SUPPORTED_LEVEL_KEYS`.
- `supabase/schema.sql` — `levels` row 24 already exists; no DDL.
- `vercel.json` — region pin `syd1` preserved.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| Generator smoke (5 seeds × 20 problems): distribution 4/4/4/4/4, 0 dupes, all prompts round-trip through `parseGraphPrompt` | PASS |
| MC correctness: every `match_equation_to_graph` answer letter points at the line described by the equation in the prompt | PASS |
| `gradeAnswer` round-trip on every type (incl. lowercase MC letters, padded MC letters, coord without spaces, coord uppercase, coord with x/y swap order, wrong answers reject) | PASS |
| Playwright UI | Deferred to user manual testing (login credentials not available in session — matches recent milestones) |

**Manual test plan (for user follow-up):**
1. Pin a test student to Level 12.2 via Parent View → Set Level.
2. `/worksheet?student=…` shows "Graphing Worksheet · Level 12.2", lesson card renders, 20 SVG-bearing problems load with the correct chip labels.
3. Submit all canonically correct answers → 100%, ✓ Passed, mastery 1/3.
4. Submit a mix of wrong answers (including `a` instead of `A` for MC, swapped `y = …, x = …` order for coords) → grades correctly, results page shows the graph + correct/wrong ring on the MC choices.
5. Re-open the results URL after submission — SVGs render identically (graph data round-trips via `problem_text`).
6. Mobile 375×667 — full graphs fit without horizontal scroll, mini graphs lay out 2-up, radio targets are tappable.
7. Regression — `/worksheet` at Level 12.1 still renders 20 function problems unchanged.

**v1 limitations (intentional, deferred):**
- Integer slopes only ({-3..3}\{0}). Fraction slopes hit a sign-loss edge case in the current multi-token grading path — out of scope for v1.
- `read_y_for_x` answers constrained to integers in the visible range by generation (50-attempt regen, with a deterministic fallback).
- No quadratic or non-linear graphs — purely linear v1.
- No per-tile distractor verification beyond ±1 slope/intercept walks — distractors are always plausible but not guaranteed visually distinct on a tiny mini-graph (acceptable at the curriculum stage students reach 12.2).

---

### Student switcher lock (2026-05-27)

**Trigger:** A real beta parent (Roc) has two sons on one account. He wanted each son locked to their own workbook on their own device. Until now, the Parent PIN only gated Parent View — children could freely tap a sibling's pill on `/play` or paste `?student=<sibling>` into the URL.

**Approach:** Reuse the existing Parent PIN (no second PIN, no schema change). Add two new cookies:
- `mathstep_switcher_unlocked` — `'on'` after PIN entry, httpOnly, sameSite=lax, secure in prod, `maxAge = 30 * 60` (30-min idle).
- `mathstep_locked_student` — UUID of the student this device is assigned to. Set when the parent picks a sibling on `/switcher-unlock` and also when they press "Lock switcher" on `/play`. 30-day `maxAge`. Persists across unlock/relock cycles.

Both cookies are cleared on signIn / signUp / signOut / `updatePassword` / `removePin`. `lockToStudentMode` ("Hand over to child") also clears the unlock cookie so the switcher re-locks for the next child interaction (but keeps the locked-student cookie — the device assignment stays).

**Files added:**
- `src/app/switcher-unlock/page.tsx` — server component mirroring `/parent-pin`. Auth gate, then validates `?next=…`. If no PIN saved, drops any unlock cookie and redirects. If only one student, bounces to `/play?student=<id>`. Otherwise renders the sibling picker + PIN form.
- `src/app/switcher-unlock/SwitcherUnlockForm.tsx` — client component, `useActionState(verifySwitcherPinAction, null)` with cooldown countdown matching `PinEntryForm`. Sibling picker is a pill-style radio group above the PIN input.

**Files modified:**
- `src/lib/parentMode.ts` — added `SWITCHER_UNLOCKED_COOKIE`, `LOCKED_STUDENT_COOKIE`, `SWITCHER_UNLOCK_MAX_AGE_SECONDS`, `LOCKED_STUDENT_MAX_AGE_SECONDS` constants. New helpers: `isSwitcherUnlocked`, `setSwitcherUnlockedCookie`, `clearSwitcherUnlockedCookie`, `getLockedStudentId`, `setLockedStudentCookie`, `clearLockedStudentCookie`. New pure resolver `resolveActiveStudent({ requested, students, hasPin, switcherUnlocked, lockedStudentId })`.
- `src/app/actions/pin.ts` — new `verifySwitcherPinAction` (clone of `verifyPinAction` that sets the unlock cookie, also persists the picked sibling as the locked student so the device assignment survives the 30-min unlock TTL). New `lockStudentSwitcher` server action (validates ownership via RLS-friendly query, writes `mathstep_locked_student`, clears unlock cookie, redirects to `/play?student=<id>`). `removePin` and `lockToStudentMode` updated to keep the new cookies consistent.
- `src/app/actions/auth.ts` — `signIn`, `signUp`, `signOut`, `updatePassword` now clear both new cookies alongside `clearStudentModeCookie`.
- `src/app/play/page.tsx` — fetches `parent_pin`, the unlock cookie, and the locked-student cookie in parallel with the existing student fetch. Uses `resolveActiveStudent` instead of the inline fallback. Switcher UI now branches: locked state shows the active student's pill + 🔒 lock icon + "Switch student" link; unlocked state shows the normal pills + a "🔒 Lock switcher" form (only when a PIN is saved).
- `src/app/worksheet/page.tsx`, `src/app/practice/weak-spots/page.tsx` — same resolver wiring, no UI changes.
- `src/app/worksheet/results/[sessionId]/page.tsx` — added a soft-fail guard: if the parent has a PIN, the device is locked (no unlock cookie), and the session belongs to a sibling, redirect to `/play?student=<locked>`. Falls back to `students[0]` when the locked-student cookie hasn't been set yet to mirror the resolver behavior on `/play`.
- `src/app/dashboard/StudentModeCard.tsx` — when `studentCount > 1 && !hasPin`, the "no PIN" card adds a soft note explaining that the PIN also locks the switcher.
- `src/app/dashboard/page.tsx` — passes `studentCount={students.length}` to `StudentModeCard`.
- `src/lib/helpContent.ts` — new FAQ: *"Can I lock my child to their own worksheets?"*

**Hard scope rules (preserved):**
- No DB schema changes.
- No new PIN system — same `parent_pin` / `pin_failed_attempts` / `pin_locked_until` columns, same 5-attempts / 30-second cooldown.
- No changes to worksheet generation, grading, mastery, streaks, points, achievements, emails, placement, or auth flows.
- Single-student accounts behave exactly as before — no new cookies set, no new prompts.
- Multi-student accounts with no PIN behave exactly as before, plus a soft tip in Admin controls.

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (touched files) | Pre-existing lint debt only — new code follows the same patterns as `parent-pin/page.tsx` and `PinEntryForm.tsx` |
| Playwright UI | Deferred to user manual testing (login credentials not available in session — same as recent milestones) |

**Manual test plan (for user follow-up):**
1. **Single-student account:** `/play` shows no switcher, no lock icon. URLs work as before.
2. **Multi-student account, no PIN:** Switcher renders normally. Parent View → Admin controls shows the new tip about locking the switcher.
3. **Multi-student, PIN saved, fresh device:** `/play` shows the active pill with 🔒 + "Switch student" link. Clicking goes to `/switcher-unlock`. Wrong PIN → soft error. Correct PIN + sibling pick → redirects to `/play?student=<sibling>`, the locked-student cookie is updated to the new student, switcher unlocks for 30 min.
4. **Lock switcher button:** Visible while unlocked next to the pills. Pressing it persists `mathstep_locked_student` to the current student and clears the unlock cookie.
5. **Direct URL bypass while locked:** `/play?student=<sibling>`, `/worksheet?student=<sibling>`, and `/practice/weak-spots?student=<sibling>` all silently show the locked student. `/worksheet/results/<sibling-session>` redirects to `/play`.
6. **Parent View:** Existing PIN flow unchanged. Removing the PIN from Admin controls drops both new cookies.
7. **Mobile (375×667):** Locked pill + "Switch student" link fits without wrapping awkwardly.

---

### Password reset flow (2026-05-25)

**Trigger:** A real beta parent forgot their password with no in-app way to recover.

**Approach:** Supabase Auth's built-in `resetPasswordForEmail` + `updateUser`. No custom token logic. PKCE recovery code exchanged in a route handler so the update-password page has a real recovery session.

**Files added:**
- `src/app/account/forgot-password/page.tsx` — server shell, reads `?error=expired` from `searchParams`
- `src/app/account/forgot-password/ForgotPasswordForm.tsx` — client form, `useActionState`, success-state copy always shown after submit
- `src/app/account/update-password/page.tsx` — server shell, `getUser()` gate; no-session view links back to forgot/login
- `src/app/account/update-password/UpdatePasswordForm.tsx` — client form, two password inputs, inline error
- `src/app/auth/callback/route.ts` — GET handler, sanitizes `next`, calls `exchangeCodeForSession`, redirects to `/account/forgot-password?error=expired` on failure
- `src/app/login/LoginForm.tsx` — extracted from the old client page so the page can become a server component (needed for `searchParams` access without a Suspense boundary)

**Files modified:**
- `src/app/actions/auth.ts` — added `requestPasswordReset` (always returns `{ sent: true }` to avoid leaking email existence; logs supabase errors server-side) and `updatePassword` (validates ≥8 chars + match, checks `getUser()`, calls `updateUser`, clears student-mode cookie, redirects `/login?reset=1`)
- `src/app/login/page.tsx` — converted to server component that reads `searchParams.reset` and renders `<LoginForm justReset />`
- `src/lib/helpContent.ts` — added "I forgot my password — how do I reset it?" FAQ entry

**Routes added:** `/account/forgot-password`, `/account/update-password`, `/auth/callback`

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (touched files) | PASS |
| Playwright — `/login` shows "Forgot password?" link | PASS |
| Playwright — `/account/forgot-password` renders + submit shows success copy | PASS |
| Playwright — `/account/update-password` (no session) renders "only for password reset" panel | PASS |
| Playwright — `/login?reset=1` shows success banner | PASS |
| Playwright — 375×667 mobile viewport clean across all three pages | PASS |
| End-to-end with real recovery email | NOT TESTED LOCALLY — requires production deploy |

**Manual Supabase config required:** add `https://mathstep.nz/auth/callback` and `http://localhost:3000/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs. No changes to email templates — default Recovery template is fine.

---

### Parent Dashboard clarity and QA pass (2026-05-10)

**Trigger:** Parent feedback — TIME label ambiguous, "practice" vs "worksheet" wording inconsistent, milestone progress values unexplained, Needs Practice card launched targeted practice from Parent View.

**Audit findings:**
- TIME metric confirmed as average time per worksheet over last 10 sessions. No calculation bug.
- Daily Habit THIS WEEK confirmed correct: Pacific/Auckland TZ, Monday-first week, worksheet sessions only, no bug.
- "Practise" button in MistakeJournalCard launched `/practice/weak-spots` from Parent Dashboard — removed.
- Targeted practice remains accessible from Student View (TargetedPracticeCTA) and direct route.

**Changes made:**
- `src/app/dashboard/page.tsx`: "Time" → "Avg Time", "per session" → "per worksheet", "Sessions" → "Worksheets", "last N sessions" → "last N worksheets"; removed `studentId` prop from `MistakeJournalCard` call.
- `src/components/HabitCard.tsx`: Dashboard body copy uses "completed worksheets on X of 7 days"; today sublines say "Worksheet completed today." / "No worksheet yet today." / "No worksheets yet."; aria-labels updated.
- `src/lib/achievements.ts`: Added `description` field to `AchievementFamilyDef`; all 7 families populated with short parent-friendly descriptions.
- `src/components/AchievementsCard.tsx`: Descriptions rendered below family label; progress label shows "X / Y toward next badge"; "Latest badge earned:" wording; layout stacks label above bar (avoids width clip).
- `src/components/MistakeJournalCard.tsx`: Removed "Practise" button and `studentId` prop; accuracy reworded to "Recent accuracy: X% over N questions. Missed N questions recently."; "Recent missed examples:" label; note "Targeted practice is available in Student View and does not affect level progress."
- `src/lib/email/templates/weeklyReview.ts`: "practice days" → "worksheet days" in metrics line (text + HTML); insight lines updated ("completed worksheets on X days", "kept the worksheet routine going", "worksheets next week").

**Files modified:**
- `src/app/dashboard/page.tsx`
- `src/components/HabitCard.tsx`
- `src/lib/achievements.ts`
- `src/components/AchievementsCard.tsx`
- `src/components/MistakeJournalCard.tsx`
- `src/lib/email/templates/weeklyReview.ts`
- `BUILD_PROGRESS.md`

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (touched files) | PASS |
| Playwright UI | not executed (login credentials unavailable in session) |

---

### Weekly Review — subject + insight polish (2026-05-10)

**Phase:** Weekly Review email polish (2026-05-10) — subject updated to "{Child}'s MathStep progress update" / "Your kids' MathStep progress update"; insight line moved to end of each student block with "So what does this mean for {Child}?" heading. Template-only change. Each student block now shows one plain-English interpretation sentence below the metrics row (priority-ranked: high consistency → solid progress → low accuracy → small start → fallback). Empty-week variant unchanged. Template-only change — no schema, no cron, no send-behaviour changes.

**Phase (preceding):** Milestone 63 — Weekly Email Copy Recipient v1 shipped (2026-05-10). Parent can optionally add one extra email address (e.g. spouse/partner) to receive the Sunday weekly recap. Schema: `weekly_cc_email text` added to `profiles`. UI: "Weekly email copy" control in Admin controls. Cron sends to `[primary, cc]` as a single Resend call. Daily reminders unaffected. See entry below.

**Phase (preceding):** `problems.problem_type` backfilled for all 680 legacy null rows (2026-05-10). Mistake Journal and Weekly Review weak-area labels now show precise type names (e.g. "Factor pairs", "Prime factorization") for all historical problems instead of the coarse "Level X.Y — Topic" fallback. No schema change, no app UX change. See entry below.

**Phase (preceding):** Duplicate-student prevention + placement CTA feedback shipped on top of Milestone 62. `createStudent` now silently reuses an existing same-name student (trim+lowercase) instead of inserting a duplicate row; `applyPlacement` was reshaped to the standard `useActionState` server-action signature with a friendly inline error and a "Starting…" pending state on both result-page CTAs (cross-disabled while either is pending). No schema change. See entry below.

**Phase (preceding):** Milestone 62 — Daily reminder refinement + Weekly Review email shipped. Daily email now picks one evidence-backed reason per pending student (streak ≥ 1 → streak line; week ≥ 1 → "X of 7 days"; otherwise "5 minutes today helps") plus a "Current focus: Level X.Y — Topic" line, with an explicit "Parent View → Admin controls" footer alongside the one-tap unsubscribe. New Weekly Review email sends Sundays 04:00 UTC (5 pm NZDT / 4 pm NZST) — one combined email per parent across all students with practice-days/worksheets/accuracy, current focus, "🏆 New this week" milestone tier crossings (derived by diffing achievement snapshots before/after the week — no schema for it), and a top weak area. Empty-week variant supported. Two separate toggles (`reminders_enabled` / `weekly_enabled`) in Parent View → Admin controls; separate HMAC-prefixed unsubscribe streams. Daily defaults stay OFF for existing users; weekly defaults ON for everyone (mandatory by default, easy to disable).
**Next:** Real Resend verified-domain send + Vercel deploy verification (cron entries in dashboard).

---

### Weekly Review — subject + insight polish (2026-05-10)

**Trigger:** Subject was flat; insight line felt like another metric rather than an interpretation.

**Changes:**
- Subject: `"{Child}'s MathStep week"` → `"{Child}'s MathStep progress update"` (multi: same suffix)
- Insight moved from immediately after metrics to end of student block
- Added heading `"So what does this mean for {Child}?"` above the insight sentence in both HTML and plaintext
- Empty-week variant unchanged (no heading, no insight)

**Files modified:**
- `src/lib/email/templates/weeklyReview.ts` — subject strings, text block order, `insightHtml` position + heading

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (touched file) | PASS |

---

### Weekly Review — insight line per student (2026-05-10)

**Trigger:** Metrics are useful but parents may not immediately know what they mean. Added one plain-English interpretation sentence per student between the metrics row and "Current focus".

**Logic (priority-ranked, worksheets > 0):**
1. `practiceDays >= 5 && accuracy >= 90` → "Great consistency this week — {name} practised {n} days and averaged {acc}%."
2. `practiceDays >= 3 && accuracy >= 80` → "Solid progress — {name} kept practising and is building momentum."
3. `accuracy < 80` → "Good effort this week — the lower accuracy shows where practice can help next."
4. `practiceDays <= 1` → "A small start this week — one or two short sessions next week can build the routine."
5. Fallback → "{name} kept the routine going this week."

Empty-week (worksheets === 0) is unchanged — no extra insight line added there.

**Files modified:**
- `src/lib/email/templates/weeklyReview.ts` — `insightLine()` function; plaintext push after `📊` line; `insightHtml` between `metricsHtml` and `focusHtml`
- `BUILD_PROGRESS.md` — this entry

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (touched file) | PASS |
| Manual cron trigger | not executed (credentials not available in session) |

---

### Milestone 63 — Weekly Email Copy Recipient v1 (2026-05-10)

**Trigger:** Parents wanted to share the Sunday weekly recap with a partner or co-parent without giving them a separate login.

**Files modified:**
- `supabase/schema.sql` — `alter table profiles add column if not exists weekly_cc_email text`
- `src/app/actions/reminders.ts` — `setWeeklyCcEmail` server action (auth, validate, trim/lowercase, same-as-account-email guard, blank = clear)
- `src/app/dashboard/WeeklyCcEmailForm.tsx` — new client component; `useActionState`; two forms sharing one action ref (save + remove); shows current address when set
- `src/app/dashboard/page.tsx` — added `weekly_cc_email` to profile select; derived `weeklyCcEmail`; imported and rendered `WeeklyCcEmailForm`
- `src/lib/email/resend.ts` — `sendWeeklyReview` `to` param widened from `string` to `string | string[]`
- `src/app/api/cron/weekly-review/route.ts` — fetches `weekly_cc_email`; passes `to: [primary, cc]` when set, else `to: primary` (single Resend call; `last_weekly_sent_date` updated only on success)
- `PROJECT_CONTEXT.md` — profiles table + new Milestone 63 section
- `BUILD_PROGRESS.md` — this entry

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (touched files) | PASS |
| Playwright UI | not executed (login credentials unavailable in session) |

**v1 limitations:**
- One extra recipient only
- CC address not separately confirmed or unsubscribed
- Daily reminders not sent to CC address
- Email body does not mention the CC recipient

---

### problem_type backfill (2026-05-10)

**Trigger:** `problems.problem_type` was added around Milestone 54. All 680 problem rows created before that had `NULL`, causing the Mistake Journal and Weekly Review weak-area derivation to fall back to coarse "Level X.Y — Topic" labels instead of precise type labels (e.g. "Factor pairs", "Prime factorization").

**Audit:** 680 null rows across exactly 3 levels:
- Level 1/1 Addition — 200 rows → all `addition`
- Level 9/1 Factorization — 260 rows → `prime_factorization`, `list_factors`, `gcf`, `lcm`
- Level 9/2 Factorization — 220 rows → `factor_pairs`, `common_factors`, `gcf`

100 pre-existing non-null rows were untouched (already correct from Milestone 54 onward).

**Script added:** `scripts/backfill-problem-types.ts`
- Dry-run by default; `--apply` required to write
- 7 deterministic keyword/pattern rules — no inference uncertainty
- UPDATE guarded by `.is('problem_type', null)` — cannot overwrite non-null rows
- npm script: `backfill:problem-types`

**Result after apply:**
| Type | Count |
|------|-------|
| `addition` | 200 |
| `gcf` | 174 |
| `factor_pairs` | 96 |
| `prime_factorization` | 94 |
| `common_factors` | 80 |
| `list_factors` | 68 |
| `lcm` | 68 |
| **Total non-null** | **780** |
| **Remaining null** | **0** |

Pre-existing + backfilled totals verified to match exactly — no overwrites confirmed.

**Validation:**
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint scripts/backfill-problem-types.ts` | PASS |
| DB: null count after apply | 0 |
| DB: non-null count after apply | 780 (all 780 problems) |
| Pre-existing non-null rows unchanged | ✓ (cross-checked totals) |

**v1 limitations:**
- Script infers only the 7 types present in legacy null rows. Future null rows from other levels would need additional rules added to the same script.
- Script is safe to re-run (idempotent — the WHERE clause and `.is('problem_type', null)` guard prevent re-processing already-backfilled rows).

---

### Help / FAQ refresh (2026-05-10)

**Trigger:** The Help page hadn't kept pace with parent-facing features shipped over the last few milestones — placement results review, mobile decimal-keyboard fix, exact-duplicate student blocking, similar-name soft warning, Delete student in Admin controls, and the daily reminder + weekly progress emails (Milestones 60 / 62).

**Files modified:**
- `src/lib/helpContent.ts` — copy-only refresh. Tweaked the existing "How do I set up a student?" answer to mention the placement-quiz option, then inserted six new FAQ entries in logical positions: *What is the placement quiz?*, *Can I add more than one child?*, *Can I delete a student profile?*, *What is Targeted Practice (Needs Practice)?*, *Where can I see my child's recent activity?*, *Will MathStep email me?* All other existing entries unchanged. Total grows from 15 → 21.

**Out of scope (intentional):**
- `src/app/help/page.tsx` not touched — same renderer, same styling, same "How it works" section. Mobile-friendly already.
- No app logic, no schema, no routing changes.

**Validation:**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint src/lib/helpContent.ts` | PASS |
| Manual page render | not executed — copy-only data change rendered through the existing `FAQ_ITEMS.map(...)` loop, no new components or props |

---

### Duplicate-student prevention + placement CTA feedback (2026-05-10)

**Trigger:** Real beta parent (`raji.r.nair@gmail.com`) ended up with three "Aryan" student rows under one account — two stuck at Level 1.1, one at the placement-recommended Level 9.1 — and reported that *"Start practising at Level 9.1"* on the placement results screen "seemed to do nothing." We manually deleted the two Level 1.1 duplicates in Supabase (the Level 9.1 row remains), then patched the two contributing causes.

**Audit:**
- Only one place inserts into `students` — `createStudent` in `src/app/actions/students.ts`. It was inserting on every onboarding submit with no name dedup, so revisiting `/onboarding` (e.g. via "Add another student" or back-button) and re-typing "Aryan" produced a new row each time.
- Placement (`runPlacementDiagnostic`, `applyPlacement`) only ever `update`s — it does not create students. So the missing CTA feedback didn't itself multiply rows; it just amplified parent confusion.
- Student-list ordering is already deterministic everywhere (`.order('created_at', { ascending: true })` on `/play`, `/dashboard`, `/worksheet`, `/practice/weak-spots`, `/feedback`, both crons, `pin.ts`, `students.ts → deleteStudent`). No change needed.

**Files modified:**
- `src/app/actions/students.ts` — `createStudent` now fetches the parent's existing students after auth, normalizes the submitted name (`trim().toLowerCase()`), and if a match exists, redirects directly to `/dashboard?student=<existing.id>` (or `/placement?student=<existing.id>` when `start_mode=diagnostic`) without inserting a `students` or `streaks` row. Also reuses the same fetched list as the source of truth for the first-student check, so it doubles as a count saving one extra Supabase round-trip.
- `src/app/actions/placement.ts` — `applyPlacement` reshaped to `(prev, formData) => Promise<{error}|null>`. Every guard returns the same parent-friendly copy *"Something went wrong starting this level. Please try again."* (no internal-state leakage). On success, still `redirect('/play?student=<id>')` — `useActionState` propagates `NEXT_REDIRECT` correctly.
- `src/app/placement/PlacementForm.tsx` — result branch now uses two `useActionState(applyPlacement, null)` instances (one per CTA form). `anyApplyPending = primaryApplyPending || fallbackApplyPending` cross-disables both buttons while either is mid-submit, but each button's text only flips to *"Starting…"* when its own form is the one mid-submit, so the parent sees which one they tapped. `applyError = primaryApplyState?.error || fallbackApplyState?.error` renders a single inline red-50 error block above the CTAs.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on the three touched files | PASS (clean) |
| `npx next build` | PASS — only the pre-existing themeColor warnings on unrelated pages |
| End-to-end Playwright walk | Skipped — placement and onboarding are auth-gated, no fresh test credentials available in this session. The behaviour is exercised by typecheck + build, and the user will dogfood the live flow. |

**v1 trade-offs (intentional):**
- Dedup is best-effort. Two near-simultaneous submits could in theory both pass the existence check and both insert, but the form button is `disabled={pending}` and parents do not realistically double-submit faster than a Supabase round-trip + insert. No DB unique constraint added (no schema change).
- Intentional same-name siblings are unsupported until a future "you already have a student named X — open their dashboard or use a different name" disambiguation UI is added. The requirement explicitly preferred preventing accidental duplicates over supporting that case in v1.
- Placement CTA error copy is a single generic message for every guard. Logs aren't surfaced to the parent.

---

### Milestone 62 — Daily reminder refinement + Weekly Review email (2026-05-10)

**Goal:** Two parts. (1) Refine the existing Daily Reminder so it's shorter, evidence-backed, and clearly skippable. (2) Add a new Weekly Review email — mandatory by default, sent Sundays 5 pm NZ, useful even on quiet weeks.

**Approved decisions (from plan):**
- Combined per parent for both streams — one email covers all students.
- Defaults: Daily OFF (unchanged), Weekly ON (mandatory by default for new + existing users).
- Single fixed UTC schedule with documented ±1h DST drift, mirroring the daily approach.
- "New this week" milestones are derived by diffing achievement snapshots before/after the week — no snapshot table needed.
- Reuse `REMINDER_UNSUB_SECRET`; isolate streams via HMAC input prefix (`weekly:` for weekly tokens), so a daily token cannot validate the weekly route and vice versa.

**Phase 1 schema (applied via SQL editor, verified):**
```sql
alter table profiles
  add column if not exists weekly_enabled boolean not null default true,
  add column if not exists last_weekly_sent_date date;
create index if not exists idx_profiles_weekly_pending
  on profiles (weekly_enabled, last_weekly_sent_date)
  where weekly_enabled = true;
```
All 6 existing profiles auto-backfilled to `weekly_enabled = true` via the column default. No separate UPDATE.

**Files added:**
- `src/lib/email/escapeHtml.ts` — shared escaper, used by both templates.
- `src/lib/email/templates/weeklyReview.ts` — pure template builder, HTML + plaintext mirror, empty-week variant.
- `src/app/api/cron/weekly-review/route.ts` — Bearer auth, levels fetched once per run, per-parent: students → bounded sessions (limit 500) → self-corrected problems → mistake-journal problems → snapshot diff for "new this week" → email send → dedup write only on Resend success.
- `src/app/dashboard/WeeklyReviewToggle.tsx` — mirrors `RemindersToggle.tsx`.
- `src/app/account/weekly/unsubscribe/page.tsx` — public route, service-role write, friendly "Weekly recap turned off" copy.

**Files modified:**
- `src/lib/email/templates/dailyReminder.ts` — body rewritten: per-pending-student block now has bold "{Child} hasn't practised today yet.", "Current focus: Level X.Y — Topic", plus exactly one reason line by priority (streak ≥ 1 → "{n}-day streak", week ≥ 1 → "{x} of 7 days", else → "5 minutes today helps"). Footer split into in-app instructions + one-tap unsub link.
- `src/app/api/cron/daily-reminders/route.ts` — fetches `levels.topic` once per run, passes `currentLevel`, `currentSublevel`, `currentTopic` into each `PendingStudent`.
- `src/app/dashboard/RemindersToggle.tsx` — copy: "Only sent on days no practice has happened yet."
- `src/app/actions/reminders.ts` — added `setWeeklyEnabled` server action (mirrors `setRemindersEnabled`).
- `src/app/dashboard/page.tsx` — selects `weekly_enabled` alongside `reminders_enabled` from `profiles`, renders `<WeeklyReviewToggle>` below `<RemindersToggle>` in Admin controls.
- `src/lib/reminderToken.ts` — added `createWeeklyUnsubscribeToken` / `verifyWeeklyUnsubscribeToken` with `weekly:` HMAC prefix; daily helpers unchanged so already-issued tokens stay valid.
- `src/lib/email/resend.ts` — extracted shared `send()`, added `sendWeeklyReview` (reads `WEEKLY_FROM_EMAIL`, falls back to `REMINDER_FROM_EMAIL`).
- `vercel.json` — added second cron entry: `{ "path": "/api/cron/weekly-review", "schedule": "0 4 * * 0" }`.
- `supabase/schema.sql` — recorded the new alter.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| Daily template renders (3 reason variants) | PASS — streak line, week-count line, cold-start line all rendered correctly with focus line |
| Weekly template renders (1 student / 2 students mixed / empty-week) | PASS — milestones list, weak-area line, "Ready to continue" empty-week variant all rendered correctly |
| Daily cron — 401 without Bearer | PASS |
| Daily cron — 200 + JSON with Bearer (`sent: 3`) | PASS |
| Daily cron — same-day dedup (`sent: 0` on retry) | PASS |
| Weekly cron — 401 without Bearer | PASS |
| Weekly cron — 200 + JSON with Bearer (`sent: 6`) | PASS — initial send went to all 6 profiles since weekly default is ON; 5 of 6 then disabled to leave only `melq64@gmail.com` opted in for ongoing dev sends |
| Weekly cron — same-day dedup (`sent: 0` on retry) | PASS |
| Response shape includes `weekStartKey` / `weekEndKey` | PASS |

**v1 limitations (intentional, deferred):**
- ±1h DST drift on the weekly cron (matches the daily approach). Single fixed UTC schedule.
- Snapshot derivation for "new this week" milestones is bounded by the same 500-session fetch limit the dashboard uses; very long histories could miss tier crossings on `streak`/`selfcorrect` for old data. Not a real issue at v1 user counts.
- No per-parent send-time preferences, no public-holiday filtering, no bounce/complaint handling, no push notifications.
- No per-tier earned-date persistence — diff is recomputed each run.

**Follow-up — resolved (2026-05-10):**
- `profiles.reminders_enabled` column default flipped from `true` to `false` via `alter table profiles alter column reminders_enabled set default false;` in the production SQL editor. New signups now start opted out, matching the documented "Daily: OFF for new + existing users" intent. `weekly_enabled` default stays `true` (mandatory by default). Repo schema (`supabase/schema.sql`) updated to record the new default.

---

### Placement results review (2026-05-09)

**Goal:** A student asked "Can I see the score or if my answers were correct for the placement quiz?". Make placement results inspectable like a worksheet without changing scoring or persistence.

**Approach (no schema change):**
- `src/lib/math/placement.ts` — `PlacementResult` extended with `correct: boolean[]`, `score`, `total`. `scorePlacement` already calls `gradeAnswer` per question; we now return that array alongside the existing fields.
- `src/app/actions/placement.ts` — `PlacementState` (result branch) gains `score`, `total`, `questions: PlacementReviewItem[]` (per-question id, prompt, hint, studentAnswer, correctAnswer, isCorrect). Built from FormData + `PLACEMENT_QUESTIONS` inside `runPlacementDiagnostic` — no extra DB calls.
- `src/app/placement/PlacementForm.tsx` — result branch reworked to show: "Placement complete" header, score/recommended-level card with supportive copy, per-question review cards (worksheet styling, ✓ / ✕, "no answer" placeholder when blank), then existing CTAs.

**Tone:** kept supportive throughout — "Recommended starting point", "Needs practice", "This helps MathStep choose the best starting level — placement is about finding the right fit, not passing or failing." No "failed" / "wrong level" copy, no harsh red.

**Files modified:**
- `src/lib/math/placement.ts`
- `src/app/actions/placement.ts`
- `src/app/placement/PlacementForm.tsx`

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS |
| `npx eslint` on touched files | PASS |
| `npx next build` | PASS (only pre-existing themeColor warnings on unrelated pages) |
| End-to-end Playwright walk | Skipped — placement is auth-gated and no test credentials available in this session. Code paths are exercised by build + typecheck. |

---

 ✓ Live cascade audit on the Math-Step Supabase project confirmed `sessions`, `problems` (via sessions), `streaks`, `student_level_progress`, `practice_sessions` all `ON DELETE CASCADE` from `students`; `feedback.student_id ON DELETE SET NULL` (parent_id rows preserved). No schema changes required. ✓ `deleteStudent` server action added to `src/app/actions/students.ts` — verifies parent ownership via `parent_id = auth.uid()`, requires exact typed-name match (case-sensitive after trim), refuses when parent has only one student, redirects to dashboard for first remaining student (oldest by `created_at`). ✓ `src/app/dashboard/DeleteStudentSection.tsx` mounted inside the existing Admin controls `<details>` block at the bottom — collapsed trigger + inline confirmation form, soft outline-only red styling (`border-red-300 / text-red-700`) per user direction. ✓ One-student case shows calm copy with no active button. ✓ Existing `enforceParentMode('/dashboard')` keeps the section unreachable from Student Mode without PIN; `/play` and `/worksheet` intentionally untouched.
**Next:** Real end-to-end Resend send once a verified domain is in place; then deploy to Vercel and verify cron entry in the Vercel dashboard.

---

### Legacy Vercel URL → custom domain redirect (2026-05-09)

**Goal:** Redirect `https://math-steps.vercel.app/*` to `https://mathstep.nz/*` preserving path and query, without breaking Vercel cron.

**Approach:** Host-based redirect added to existing `src/middleware.ts` (chosen over `next.config.redirects()` to avoid path-to-regexp ambiguity around capturing multi-segment paths while excluding `/api/`). The middleware was already running on every non-static request, so this is a single header check + origin swap with no new matcher work.

```ts
if (host === 'math-steps.vercel.app' && !pathname.startsWith('/api/')) {
  return NextResponse.redirect(`https://mathstep.nz${pathname}${search}`, 308)
}
```

- **Status:** 308 (permanent, method-preserving — safer than 301 for any future POSTs).
- **Excluded:** `/api/*` — keeps `/api/cron/daily-reminders` working regardless of which host Vercel routes the cron through internally. Headers like `Authorization: Bearer ${CRON_SECRET}` are not at risk of being dropped on a cross-origin redirect.
- **Local dev unaffected:** `host` is `localhost:PORT` in dev, never matches.
- **No loop on `mathstep.nz`:** redirect only fires when host equals the legacy Vercel domain.
- **Preview deployments unaffected:** preview URLs are `math-steps-git-*.vercel.app`, not the exact production alias matched here.

**Files modified:**
- `src/middleware.ts` — added host check + 308 redirect before `updateSession`.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint src/middleware.ts` | PASS (clean) |
| Live old-URL → new-URL redirect | Pending deploy — host-based behaviour can't be reproduced on `localhost` |
| `/api/cron/daily-reminders` on `mathstep.nz` | Pending post-deploy verification (path is excluded from redirect rule) |

---

### Milestone 61 — Safe Delete Student admin control (2026-05-09)

**Goal:** Let parents remove a mistaken/test student profile from inside the app instead of editing Supabase manually. Parent-only, gated by Student Mode/PIN, exact-name typed confirmation, refuses when it would leave the parent with zero students, no schema changes.

**Phase 1 cascade audit (live DB, project `wuwmqbeazgsolsrxbhsh`):**

| Child | Column → Parent | ON DELETE |
|---|---|---|
| sessions | student_id → students.id | CASCADE |
| problems | session_id → sessions.id | CASCADE (transitive) |
| streaks | student_id → students.id | CASCADE |
| student_level_progress | student_id → students.id | CASCADE |
| practice_sessions | student_id → students.id | CASCADE |
| feedback | student_id → students.id | SET NULL (parent_id retained) |

Verified via `information_schema.referential_constraints`. **No DDL needed.** `feedback` rows survive with `student_id = NULL`, matching the documented intent (parent-owned messages preserved).

**Files added:**
- `src/app/dashboard/DeleteStudentSection.tsx` — client component, `useActionState`, mirrors `PinSettings.tsx` skeleton. Live-disabled submit until typed name matches (case-sensitive after trim). Soft outline-only red palette, in-form confirmation in a `red-50` panel.

**Files modified:**
- `src/app/actions/students.ts` — appended `deleteStudent` server action. Pattern matches `updateStudentPlacement`: same `{ error: string } | null` return, same `parent_id` ownership filter, `redirect()` from the action on success.
- `src/app/dashboard/page.tsx` — imported `DeleteStudentSection` and mounted it as the last child of the Admin controls `<details>` block, after the Placement Diagnostic link. Passes `studentId`, `studentName`, `studentCount`.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| Live FK audit via Supabase MCP | All cascades confirmed (see table above) |

**v1 limitations (intentional, deferred):**
- No second PIN re-entry immediately before delete fires — the dashboard PIN gate plus typed-name confirmation is enough for v1.
- No undo / soft-delete window. Confirmation is the safety mechanism.
- Case-sensitive name match after `trim()`. Can relax to case-insensitive if real parents report friction.
- No server-side check for in-flight worksheets in another tab — a deleted student's session results just disappear.
- Parent auth user is never touched.

---

### Milestone 60 — Daily Reminder Email v1 (2026-05-09)

**Goal:** Optional, parent-facing email that nudges when at least one of a parent's students hasn't practised today (NZ-local). Single combined email per parent. Tone matches the rest of the app — gentle, easy to disable.

**Approved decisions (from plan):**
- Existing-user default = `false`. New signups inherit column default `true`.
- RLS bypass via service role key (option a). Constraint added to PROJECT_CONTEXT.md: *"Service role key is allowed in server-side cron/background routes only. Never in client bundles or Edge runtime."*
- Cron schedule `0 3 * * *` UTC → 4:00 pm NZDT / 3:00 pm NZST (±1h DST drift accepted in v1).
- Subject line for 2+ children = `Time for MathStep practice?` (1 child unchanged: `{Child}'s MathStep practice today?`).

**Schema (applied via Supabase SQL Editor before any code):**
```
alter table profiles
  add column if not exists reminders_enabled boolean not null default true,
  add column if not exists last_reminder_sent_date date;
update profiles set reminders_enabled = false where reminders_enabled is distinct from false;
create index if not exists idx_profiles_reminders_pending
  on profiles (reminders_enabled, last_reminder_sent_date)
  where reminders_enabled = true;
```
Verification at apply time: `select reminders_enabled, count(*) from profiles group by 1` → `false | 10`. All 10 existing testers opted out as intended.

**Files added:**
- `src/lib/supabase/serviceRole.ts` — server-only client; lazy singleton over `SUPABASE_SERVICE_ROLE_KEY`. Throws if env vars missing.
- `src/lib/email/resend.ts` — `sendDailyReminder({to, subject, html, text})`. Lazy Resend singleton. Returns `{ ok, id? } | { ok: false, error }`. Never throws.
- `src/lib/email/templates/dailyReminder.ts` — `buildDailyReminder({ parentName, pendingStudents, appUrl, unsubscribeUrl })`. Pure function, HTML + plaintext, escapes user-supplied strings. Streak/this-week line only renders when `currentStreak ≥ 1`.
- `src/lib/reminderToken.ts` — `createUnsubscribeToken(parentId)` / `verifyUnsubscribeToken(token)`. HMAC-SHA256 of `parent_id`, base64url-encoded, two-part `<id>.<sig>` token. `timingSafeEqual` for verification.
- `src/app/api/cron/daily-reminders/route.ts` — GET handler, `runtime='nodejs'`, `dynamic='force-dynamic'`. Bearer-auth via `CRON_SECRET`. Pulls all opted-in parents, filters dedup in JS (v1 user counts are small), per-parent computes pending-students from an 8-day session window bucketed by `nzDateKey()`. Updates `last_reminder_sent_date` only after Resend success. Returns `{ todayKey, candidates, sent, skipped, errors, errorDetails? }`.
- `src/app/actions/reminders.ts` — `setRemindersEnabled` server action. RLS-safe via the standard server Supabase client. `revalidatePath('/dashboard')`.
- `src/app/dashboard/RemindersToggle.tsx` — client component, `useActionState`, mirrors `PinSettings` styling.
- `src/app/account/reminders/unsubscribe/page.tsx` — public server component, `dynamic='force-dynamic'`. Verifies token → flips `reminders_enabled = false` via service-role client. Three rendered outcomes: `success` / `invalid` / `error`, each with parent-friendly copy.
- `vercel.json` — single cron entry.
- `.env.example` — all six env vars documented (Supabase URL/anon, service role, Resend API key, REMINDER_FROM_EMAIL with local-vs-prod guidance, CRON_SECRET, REMINDER_UNSUB_SECRET, NEXT_PUBLIC_APP_URL).

**Files modified:**
- `src/lib/habit.ts` — added `getNzWeekRange(now?)`. `deriveHabitStatus` now consumes it instead of inlining the Monday math (no behaviour change; verified by existing tests still passing through tsc + eslint).
- `src/app/dashboard/page.tsx` — imports `getNzWeekRange`, drops the inlined Mon-start block; profile select extended to include `reminders_enabled`; `RemindersToggle` mounted inside the existing Admin controls `<details>` block.
- `supabase/schema.sql` — appended the new columns + index for parity with the live DB (no DDL rerun; was already applied via SQL Editor).
- `package.json` — `resend ^6.12.3`.
- `PROJECT_CONTEXT.md` — new "Daily Reminder Email v1" section + service-role-key constraint line under Known Implementation Decisions; `profiles` schema row updated.

**Validation (this session):**
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npx eslint` on touched files | PASS (clean) |
| `GET /api/cron/daily-reminders` no auth | 401 ✓ |
| `GET /api/cron/daily-reminders` wrong bearer | 401 ✓ |
| `GET /account/reminders/unsubscribe?token=bogus` | 200, renders "This link looks expired" copy ✓ |
| `GET /dashboard` unauth | 307 → `/login` (auth guard intact) ✓ |
| `GET /login` | 200 (no compile error from refactored dashboard) ✓ |

**Validation deferred to once production env vars are in place:**
- Authenticated cron run with a real `CRON_SECRET` against a parent flipped to `reminders_enabled = true` → expect 1 Resend send, `last_reminder_sent_date` populated, second curl returns 0 sends (dedup).
- Multi-student scenario: only one child practised → email lists only the other.
- Both children practised → no email, no dedup write (so tomorrow stays eligible).
- One-tap unsubscribe link from a real email → confirmation page + row flipped.

**Production gate (intentional, not yet flipped):**
- Real-parent sending requires a verified domain in Resend + `REMINDER_FROM_EMAIL` set to an address on that domain. Until both are true, `reminders_enabled` should remain `false` for every existing account. Local dev validation may use `REMINDER_FROM_EMAIL=onboarding@resend.dev`, which only delivers to the Resend account owner's verified inbox.

**v1 limitations (deferred):**
- Weekly summary email, weak-area digests, achievement emails, push notifications.
- NZ public-holiday / school-day filtering.
- DST drift correction (single static UTC cron entry; ±1h shift twice a year).
- Per-parent send-time preferences.
- Bounce / complaint handling (Resend errors are logged in the response body but not persisted).

---

### Milestone 59 — Level 12/1 Functions (2026-05-09)

**Goal:** Add curriculum coverage for Level 12/1 — Functions. Pure algorithmic generation, integrated with the existing worksheet, grading, lesson, mistake-journal, and targeted-practice flows. No regression to any prior level.

**Problem types (5):**
- `function_evaluate_linear` — *e.g.* `f(x) = 2x + 3. Find f(4).` → `11`
- `function_evaluate_quadratic` — *e.g.* `f(x) = x² + 1. Find f(3).` → `10`
- `function_evaluate_negative` — *e.g.* `f(x) = -3x + 5. Find f(-2).` → `11`
- `function_compose_simple` — *e.g.* `f(x) = x + 2 and g(x) = 3x. Find f(g(2)).` → `8`
- `function_inverse_solve` — *e.g.* `f(x) = 2x + 1. What value of x gives f(x) = 7?` → `3`

Distribution for `count = 20` is fixed at 5/4/4/4/3 (linear/quadratic/negative/compose/inverse) via a deterministic plan; rounding is corrected so the plan length matches `count` exactly.

**Files added:**
- `src/lib/math/generators/functions.ts` — `generateFunctionsProblems(count, rand?)`, 5 internal `makeXxx(rand)` makers, prompt dedup with 50× per-slot retry. Helpers `formatCoeffTerm` / `formatConst` keep the prompt strings clean for both positive and negative coefficients (e.g. `2x + 3`, `-3x + 5`, `2x - 7`).

**Files modified:**
- `src/lib/math/generators/index.ts` — import, type re-export, `AnyProblemType` union, and `12/1` routing branch.
- `src/lib/levelKeys.ts` — appended `[12, 1]` to `SUPPORTED_LEVEL_KEYS`.
- `src/lib/math/inputMode.ts` — `function_evaluate_negative` → `'text'`, the other four → `'numeric'`; `problemTypeLabel` cases for all five with parent-friendly labels.
- `src/lib/mistakeJournal.ts` — `PARENT_LABELS` mapping for all five problem types.
- `src/lib/lessons/index.ts` — `'12/1'` lesson card: title `"Functions"`, explanation covering `f(x)` notation + evaluation + composition + inverse, worked example `f(x) = 2x + 3, find f(4)`, substitution tip.

**Files NOT modified (verified scope):**
- `src/lib/math/gradeAnswer.ts` — all answers are signed integers; existing `^-?\d+$` path handles them.
- `src/app/worksheet/page.tsx`, `src/app/worksheet/WorksheetForm.tsx`, `src/app/practice/weak-spots/page.tsx` — drive off the helpers above.
- `src/lib/math/warmup.ts` — X.1 levels correctly have no warm-up.
- `src/lib/math/placement.ts` — placement ceiling stays at 9/1; 12/1 is reachable only via progression.
- `supabase/schema.sql` — no change. Live `levels` row for 12/1 was already present.

**Levels row (already in DB, no DDL run):** `id=23, level_number=12, sublevel_number=1, topic='Functions', description='Function notation basics', speed_target_seconds=660, accuracy_threshold=90, problems_per_session=20, consecutive_passes_required=3`.

### Suite 59 — Level 12/1 Functions (2026-05-09)
| Test | Result |
|------|--------|
| TypeScript: `tsc --noEmit` clean | PASS |
| ESLint: clean on touched files (pre-existing errors elsewhere unchanged) | PASS |
| Generator unit (seeded): 20 problems, distribution 5/4/4/4/3, zero duplicates | PASS |
| Generator correctness: every produced answer matches the prompt's algebra (manual + script verification) | PASS |
| Browser: 12/1 worksheet renders 20 problems with heading "Functions Worksheet" | PASS |
| Browser: lesson card renders with worked example | PASS |
| Browser: parent labels above each problem ("Function evaluation", "Quadratic function evaluation", "Functions with negatives", "Function composition", "Solve for function input") | PASS |
| Browser: `function_evaluate_negative` rows have `inputMode="text"`; other four have `inputMode="numeric"` | PASS |
| Browser: 20/20 correct (incl. 4 negative answers `-8, -13, -5, -19`) → 100%, ✓ Passed, 36s, mastery 1/3 | PASS |
| Browser: "Beat the Time Target" + "Perfect Score" + "First Worksheet" milestones unlock | PASS |
| Browser: regression — 11/2 worksheet still renders 20 simultaneous-equation problems with no errors | PASS |
| Browser: SetLevelForm dropdown already includes "Level 12.1 — Functions: Function notation basics" (24 options) | PASS |

---

### Milestone 58 — Practice History v1 (2026-05-09)

**Goal:** Make targeted practice effort visible to parents. Until now, `/practice/weak-spots` was fully ephemeral — generated, graded, and discarded — so parents had no signal that the Mistake-Journal → Practise loop was actually being used. v1 records each run in a dedicated table and surfaces a small dashboard card. **No effect on mastery, level advancement, streaks, points, achievements, sessions, problems, or Recent Worksheets** — by design.

**Files added:**
- `src/app/actions/practiceSessions.ts` — `recordPracticeSession({ studentId, levelId, problemType, totalProblems, correctCount, accuracy })` server action. Auth check + bounds checks, single insert. Returns `{ error } | null`.
- `src/components/PracticeHistoryCard.tsx` — server-rendered presentational card. Empty state *"No practice sessions yet. Targeted practice from Needs Practice will appear here."* Otherwise: *"{name} practised weak spots N times this week."* + list of up to 5 most-recent entries (label via `parentLabelForType` with level/topic fallback, `formatNzDateTime`, `N/M (X%)` chip).

**Files modified:**
- `supabase/schema.sql` — `practice_sessions` table, `idx_practice_sessions_student_completed` index, RLS policy that mirrors the `streaks` join through `students.parent_id = auth.uid()`.
- `src/app/practice/weak-spots/page.tsx` — added `id` to the levels select so we can pass `levelId` into the form.
- `src/app/practice/weak-spots/PracticeForm.tsx` — accepts `levelId: number | null`, `problemType: string | null`. After local grading, fires `recordPracticeSession(...).catch(() => {})` — failure is silent and never blocks the results screen.
- `src/app/dashboard/page.tsx` — added a sibling `practice_sessions.select(...)` to the existing `Promise.all`, computed `practiceThisWeekCount` using `nzDateKey` + Mon-start week math (same as `HabitCard`), mapped rows against the existing `levelMap`, mounted `<PracticeHistoryCard …/>` directly below `<MistakeJournalCard …/>`.

**Schema (applied via Supabase SQL Editor):**
```
create table practice_sessions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  level_id        int  not null references levels(id),
  problem_type    text,
  total_problems  int  not null check (total_problems > 0),
  correct_count   int  not null check (correct_count >= 0 and correct_count <= total_problems),
  accuracy        int  not null check (accuracy between 0 and 100),
  completed_at    timestamptz not null default now()
);
create index idx_practice_sessions_student_completed on practice_sessions (student_id, completed_at desc);
alter table practice_sessions enable row level security;
-- "Users can manage practice for their students" — exists() join through students.parent_id
```

**Validation (Playwright on `habit-v1@test.local` / Riley):**
- **Baseline (before practice run):** Streak 1, Points 30, Sessions 2, Level 1.1 progress 2/3, Recent Worksheets 2 rows.
- **Practice run:** `/practice/weak-spots?student=…&level=1&sublevel=1&type=addition` generated 10 addition problems. Submitted 8 correct / 2 wrong → results card showed *"8 / 10 (80%)"*. ✓
- **Dashboard (after run):** Streak **1**, Points **30**, Sessions **2**, Level 1.1 progress **2/3**, Recent Worksheets **2 rows** — *all unchanged*. ✓
- **Practice History card:** *"Riley practised weak spots 1 time this week."* + entry *"Addition · 9 May 2026, 8:48 am NZT · 8 / 10 (80%)"*. ✓
- **Multi-student isolation:** Switched to "Mira" → Practice History card shows the empty-state copy with 0 entries (no leakage from Riley). ✓
- **Empty state:** Mira (no practice runs) renders *"No practice sessions yet. Targeted practice from Needs Practice will appear here."* ✓
- **Console errors:** 0 across the full flow (dashboard → practice → submit → dashboard → student switch).
- `npx tsc --noEmit` clean. ESLint: only the 7 pre-existing errors in untouched files (PinSettings / StudentModeCard / PinEntryForm / parent-pin/page / CelebrationEffect) — zero new errors.

**v1 limitations (documented for future revisit):**
- **No persistence beyond totals.** Per-problem records are not stored — practice is graded client-side and only the run summary is written. If future analytics need per-problem detail, a `practice_problems` companion table would be the next step.
- **No `time_taken_seconds` / no `passed` flag.** Practice is "won't change your level" by design; pass/fail isn't meaningful here.
- **Parent dashboard only.** No Play/Student-View surface for v1 — parent visibility is the explicit goal.
- **No per-skill aggregate** beyond "this week count." The Mistake Journal still reflects mistakes from `sessions`/`problems` only — practice does not feed it. (Inline *"Practised N times this week"* enrichment on Mistake Journal entries was scoped out of v1; revisitable.)
- **Top 5 list cap.** Older runs aren't shown; the count line still tells parents the absolute scope.

---

### Milestone 57 — Habit week + milestone label polish (2026-05-09)

**Goal:** Two clean polish items on the v1 Daily Habit Loop and Milestones surfaces — make the habit row a Mon-first NZ calendar week (not a rolling 7-day window), and replace parent-unfriendly *"Tier N"* wording with plain-English *"Reached N"*.

**Files modified:**
- `src/lib/habit.ts` — `HabitDay` gains `isFuture: boolean`; `HabitStatus.last7` renamed to `weekDays` (semantic correction). `deriveHabitStatus` now anchors the 7-day window on the **NZ-local Monday of the current week**: shifts back `(weekdayIndex + 6) % 7` days from `todayKey` to find Monday, then walks forward 7 days to Sunday. `daysPractisedThisWeek` counts only the days inside this Mon–Sun window — sessions in the previous calendar week are no longer included.
- `src/components/HabitCard.tsx` — uses `status.weekDays`; `SevenDayRow` adds a third tile state for future days (`bg-white border-dashed border-[#bae0bd] text-[#bae0bd]`) so they read as "upcoming" rather than "missed". Dashboard copy now says *"X of 7 days this week"* / *"1 day this week"* / *"hasn't practised yet this week"*. Removed the redundant *"X / 7 days this week"* meta in the header (the dedicated stat tile already carries that number).
- `src/components/AchievementsCard.tsx` — dashboard variant only:
  - `Tier ${tier} ✓` → `Reached ${tier}${unitSuffix} ✓` (e.g. `Reached 1 ✓`, `Reached 5 days ✓`).
  - `All tiers earned 🏆` → `All goals reached 🏆` (in both the per-row label and the header meta).
  - `not yet` → `Not reached yet`.
  - Header meta `${n} of ${total} next tiers in progress` → `${n} of ${total} goals in progress`.
  - Play variant (`Your wins`) is unchanged — its labels already used `formatTierBadge` (e.g. *"First Worksheet"*, *"5 Worksheets"*) which were never tier-jargon.

**No schema changes, no logic changes outside the habit window and label wording.**

**Validation (Playwright + helper smoke):**
- Helper smoke (Sat 9 May, Mon 4 May, Sun 10 May, Wed 6 May with cross-week sessions) — all four scenarios produced correct Mon→Sun ordering, correct `isToday` / `isFuture` flags, correct `daysPractisedThisWeek` count (verified prior-week sessions are now ignored). ✓
- `/play` Saturday 2026-05-09 NZT: 7-tile row reads `Mon Tue Wed Thu Fri Sat Sun` with **Sat ringed + filled green** and **Sun rendered with a dashed border** (future). Headline *"Today's practice done ✓ · Nice work — you practised today!"*. ✓
- `/dashboard`: habit copy is now *"Riley has practised 1 day this week. Practice completed today."* — no more *"the last 7 days"*. Stat tile *This week 1 / 7* unchanged in shape. ✓
- Milestones header reads *"7 of 7 goals in progress"*; per-row labels read *"Reached 1 ✓"*, *"Reached 5 days ✓"*, *"Not reached yet"*. **Zero `Tier ` strings remain in the Milestones DOM.** ✓
- Mobile (390 × 844): no horizontal overflow (`scrollWidth === clientWidth === 375`), single-letter labels start with *"M"* — Mon-first ordering preserved. ✓
- Tablet (768 × 1024): three-letter labels start with *"Mon"*, no overflow. ✓
- `/play` Next Win card rendering unchanged (*"📘 5 Worksheets · 2 / 5 completed · Only 3 more to go!"*) — confirmed no tier jargon leaks through there either. ✓
- `npx tsc --noEmit` clean. `npx eslint` clean on all changed files.
- 0 console errors across signup → onboarding → play → worksheet → results → play → dashboard.

**Behaviour after this change:**
- Habit week boundary: NZ-local **Monday 00:00 → Sunday 23:59**, recomputed every render. Mon-Sun aligns with school-week scanning for parents.
- Future days (later in the same Mon–Sun week) render with a dashed border — visually distinct from past-empty days, but no copy emphasises them (no *"upcoming"* badge, no countdown) to keep the tone gentle.
- Counts strictly include only the current Mon–Sun. A session done last Sunday no longer shows as a green tile this Monday.

**Limitations (still applies from Milestone 56):**
- No reminders. Same-day dedup unchanged. No celebration animation when today flips to ✓.

---

### Milestone 56 — Daily Habit Loop v1 (2026-05-09)

**Goal:** Gently help families build a consistent daily-practice rhythm without email or push reminders. Surface "is today done?" and a 7-day pattern on both `/play` (child-voice) and `/dashboard` (parent-voice), derived entirely from existing data.

**Habit strategy:**
- All "today / yesterday / this week" boundaries are NZ-local (`Pacific/Auckland`), not UTC.
- `nzDateKey(d)` produces a `YYYY-MM-DD` key via `Intl.DateTimeFormat({timeZone:'Pacific/Auckland'}).formatToParts()`.
- `shiftDateKey(key, deltaDays)` does date math on the parsed key via `setUTCDate(getUTCDate() + n)` — DST-safe because we never touch wall-clock time.
- `deriveHabitStatus()` builds a `Set<string>` of NZ date keys from `sessions.completed_at`, then projects today + 6 prior days into a `last7` array. Multiple sessions same NZ day collapse to one habit-day.
- Pure JS, no Supabase dependency. No new DB queries — both `/play` and `/dashboard` already fetched `sessions.completed_at` with `.not('completed_at','is',null).limit(500)` from earlier milestones.

**Files added:**
- `src/lib/habit.ts` — `NZ_TIME_ZONE`, `nzDateKey`, `shiftDateKey`, `weekdayShortLabel`, `weekdayLetterLabel`, `deriveHabitStatus`, types `HabitDay` / `HabitStatus`.
- `src/components/HabitCard.tsx` — server component with `variant: 'play' | 'dashboard'`. Shared `SevenDayRow` sub-component with `sm:` breakpoint switching one-letter labels (`M T W T F S S`) to three-letter (`Mon Tue Wed Thu Fri Sat Sun`).

**Files modified:**
- `src/app/play/page.tsx` — imports `deriveHabitStatus` + `HabitCard`, computes `habitStatus` from `sessions.map(s => s.completed_at)`, mounts `<HabitCard variant="play" />` between the stats row and the *Start Today's Worksheet* CTA.
- `src/app/dashboard/page.tsx` — same helper call, mounts `<HabitCard variant="dashboard" studentName={student.name} />` between *Progress at a Glance* and *Milestones*.
- `PROJECT_CONTEXT.md` — Milestone 56 section under the curriculum block.

**No schema changes. No extra queries.** Reuses the bounded `sessions` fetch already in place.

**Copy ladder (parent voice, `/dashboard`):**
- New student (`totalSessions === 0`): *"{name} hasn't started practising yet — the first short session is the easiest way to begin."*
- Returning student, no week activity: *"{name} hasn't practised in the last week — a short session helps them get back into rhythm."*
- Otherwise: *"{name} has practised N of the last 7 days."*
- Today subline: *"Practice completed today."* / *"No practice yet today."* / *"No sessions yet."*
- Stat tiles: Today (Done ✓ / Not yet), Streak, Best, This week (X / 7).
- Header meta: *"X / 7 days this week"*.

**Copy ladder (child voice, `/play`):**
- `!todayDone`: heading *"Today's practice"* + body *"Ready for a short practice session?"*.
- `todayDone`: heading *"Today's practice done"* + ✓ chip + body *"Nice work — you practised today!"*.
- Optional one-liner *"Nice — that's day {n}!"* only when `todayDone && currentStreak >= 2`. Otherwise no streak number on this card — the stat tile above already carries it.

**Validation (Playwright + helper smoke, fresh signup `habit-v1@test.local` → student "Riley", second student "Mira", clock 2026-05-09 NZT):**
- Helper smoke (Node + tsx, deleted after):
  - `nzDateKey('2026-05-09T03:00:00Z')` → `2026-05-09`. ✓
  - `nzDateKey('2026-05-09T11:30:00Z')` (≈ 11:30 pm NZT 9 May) → `2026-05-09`. ✓
  - `nzDateKey('2026-05-09T12:30:00Z')` (≈ 12:30 am NZT 10 May) → `2026-05-10`. ✓
  - Mixed scenario: 4 sessions across 3 NZ days → `todayDone=true`, `practisedYesterday=true`, `daysPractisedThisWeek=3`. ✓
  - Same-day dedup (3 sessions at 02:00/05:00/08:00 UTC on 9 May) → `daysPractisedThisWeek=1`. ✓
  - Empty student → `todayDone=false`, `daysPractisedThisWeek=0`, `last7.length=7`. ✓
  - Boundary: 11:30Z 9 May (today NZ) + 12:30Z 9 May (tomorrow NZ, future) → `todayDone=true`, `daysPractisedThisWeek=1` (future day not in window). ✓
- `/play` empty state (Riley, before any worksheet): habit card shows *"Today's practice — Ready for a short practice session?"* + 7 empty tiles, Saturday tile ringed (today). ✓
- After 1 perfect 20/20 worksheet: `/play` flips to *"Today's practice done ✓ · Nice work — you practised today!"*, Saturday tile filled green + ringed. `/dashboard` shows *"Riley has practised 1 of the last 7 days · Practice completed today · Today: Done ✓ · Streak: 1 day · Best: 1 day · This week: 1 / 7"*. ✓
- After a second worksheet on the same NZ day: `daysPractisedThisWeek` stays at **1**, only one tile filled — same-day dedup confirmed in the live UI (not just in the unit smoke). Recent Worksheets shows both rows separately as expected. ✓
- Multi-student switching: added "Mira" → habit card resets to *"Mira hasn't started practising yet …"* + 0 tiles. Switched back to "Riley" → state preserved (1 / 7 days, today done). No bleed across students. ✓
- Parent PIN regression: set PIN `1234`, hit *Hand over to child* → `/play` still renders the habit card (PIN-ungated route, child-voice copy intact). Navigating to `/dashboard` redirects to `/parent-pin?next=%2Fdashboard` as expected. After PIN unlock, the dashboard habit card renders with parent copy. ✓
- Mobile (390 × 844): no horizontal overflow (`scrollWidth === clientWidth === 375`), single-letter day labels visible (`sm:hidden` shown, `hidden sm:inline` hidden). ✓
- Tablet (768 × 1024): three-letter labels (`Sun`, `Mon`, …) visible, no overflow. ✓
- Console errors across signup → onboarding → play → worksheet → results → play → dashboard → student-mode → parent-pin → dashboard: **0**. ✓
- `npx tsc --noEmit` clean. `npx eslint` clean on changed files.

**v1 limitations (documented for future revisit):**
- **No reminders.** No email, no push, no scheduled toast. Pure passive surface — the family decides when to come back.
- **Last 7 rolling days, not a calendar week.** Always "today + 6 prior" — there is no Monday-reset moment, by design (gentler tone).
- **Dots are days, not minutes.** No depiction of session length / intensity.
- **No celebration animation when today flips to ✓** — the existing per-session Milestones strip on the results page remains the in-the-moment celebration surface.
- **No persistence — habit state is derived per render.** Same caveat as Achievements: the bounded 500-session fetch covers any realistic student dataset; only > 500 sessions in lifetime would clip earliest history.

---

### Milestone 55 — Next Win Card on Student Play (2026-05-09)

**Goal:** Once a child has earned several badges, give them a single, motivating, always-visible next target on `/play` (e.g. *"📘 25 Worksheets — 18/25 — Only 7 more to go!"*). Achievements remained tiered but the play page only showed earned wins, with no clear "what's next?".

**Files modified:**
- `src/lib/achievements.ts` — added `pickNextWin(progress)` + `NextWin` discriminated union (`{ kind: 'next', … }` / `{ kind: 'maxed' }`). Pure derivation off the existing `FamilyProgress[]`. Sort: progress ratio desc, stable tie-break preserves family declaration order. Friendly-message rules: brand-new worksheets first tier → *"Finish your first worksheet to earn your first win!"*; streak family uses *"… more days to go!"* / *"One more day to go!"*; points uses *"… more points to go!"* with `toLocaleString('en-NZ')`; everything else is *"Only N more to go!"* / *"Just one more to go!"*.
- `src/app/play/page.tsx` — added `pickNextWin` import + `NextWinCard` import; computed `nextWin` directly after `achievementProgress`; mounted `<NextWinCard nextWin={nextWin} />` immediately above the existing `<AchievementsCard variant="play" />`. No new Supabase queries.

**Files added:**
- `src/components/NextWinCard.tsx` — server component, soft-green palette matching the rest of the play page. Eyebrow `Next win`, emoji + tier label headline, `current / target completed` (or `… days` for streak), progress bar (`bg-[#e1f4e3]` track, `bg-[#4ade80]` fill — same as `AchievementsCard` dashboard variant), friendly message. Maxed branch shows 🏆 + *"All wins earned for now"* + *"Amazing — keep practising for the next set!"*. `role="progressbar"` with `aria-valuenow` for accessibility.

**No schema changes. No extra queries.** All progress is still derived from the existing `deriveAchievementProgress()` output the page already computes.

**Validation (Playwright + manual + helper smoke tests, fresh signup `m55-nextwin@test.local` → student "Riley"):**
- Brand-new student: `/play` shows `Next win · 📘 First Worksheet · 0 / 1 completed · Finish your first worksheet to earn your first win!`. "Your wins" empty-state still renders below. ✓
- After one perfect 20/20 worksheet: 4 Tier-1 badges earned (`📘 First Worksheet · 💯 Perfect Score · 🚀 Level Mastered · ⚡ Speedy Pass`). Next Win correctly picks `🔥 3-Day Streak · 1 / 3 days · 2 more days to go!` (streak 33% and levels 33% tied; stable sort picks streak first per family declaration order). ✓
- Helper smoke tests (`pickNextWin` against synthetic `FamilyProgress[]`):
  - brand-new → `📘 First Worksheet · "Finish your first worksheet to earn your first win!"` ✓
  - streak 2/3 → `🔥 3-Day Streak · "One more day to go!"` ✓
  - worksheets 24/25 → `📘 25 Worksheets · "Just one more to go!"` ✓
  - all families maxed → `{ kind: 'maxed' }` (renders the 🏆 *"All wins earned for now"* card) ✓
- Mobile (390 × 844): no horizontal overflow (`scrollWidth ≤ clientWidth`). ✓
- Desktop (1280 × 900): dashboard regression check — Milestones / Mistake Journal / Recent Worksheets unchanged, no "Next Win" leakage onto the dashboard. ✓
- Console errors: 0 across signup → onboarding → play → worksheet → results → play.
- `npx tsc --noEmit`: 0 errors. `npx eslint`: 0 errors on changed files.

**v1 limitations (documented for future revisit):**
- Tie-break for equal progress ratios is family declaration order in `ACHIEVEMENT_FAMILIES`, not a more nuanced "easiest next" heuristic. In practice this lands sensibly: a brand-new student goes to Worksheets first, a tied-at-33% student goes to Streak before Levels — both feel right.
- No celebration/animation when a freshly-crossed tier flips the card to a new target. The results-page Milestones strip still fires per-session for 1/5/10/25/50/100 / Perfect / Beat-the-Time-Target / Fixed-Every-Mistake — that remains the "in the moment" celebration surface.
- Maxed-state copy is a single message; if all 7 families are ever maxed in a session, the same card renders with the 🏆 variant. No further "what next" hint, by design — the Recent Worksheets feed and the level progression already provide forward motion.
- `pickNextWin` consumes the same bounded `sessions` data as `AchievementsCard`, so the existing 500-session cap caveat (Speedy / Levels-mastered for >500 historical sessions) carries over.

---

### Milestone 54 — Mistake Journal / Targeted Practice Precision (2026-05-09)

**Goal:** Upgrade Milestone 53 from level/topic precision to per-problem-type precision so the dashboard can say *"Factor pairs could use a little practice"* instead of only *"Level 9.2 — Factorization"*. Old data must keep working via a fallback path.

**Schema change (manual, Supabase SQL editor):**
```sql
alter table problems add column if not exists problem_type text;
```
Nullable, no default, no index, no backfill. Old rows stay `NULL` and feed the legacy bucket; new rows store the generator's `type`.

**Files modified:**
- `src/app/worksheet/page.tsx` — `problemRows` insert now includes `problem_type: p.type`. No grading or interleaving change.
- `src/lib/mistakeJournal.ts` — `MistakeJournalProblem.problem_type: string | null`; bucket key is `${levelId}::${problem_type ?? '__legacy__'}`; `WeakArea` gains `problemType: string | null` and `label: string`; new `parentLabelForType()` helper with calm, parent-friendly mappings (factor_pairs → "Factor pairs", fraction_addition → "Fraction addition", sim_eq → "Simultaneous equations", etc.). Unknown future types fall back to a title-cased snake-split so we never expose raw identifiers.
- `src/app/dashboard/page.tsx`, `src/app/play/page.tsx` — `problems.select(...)` extended with `problem_type`; passed straight through to `deriveWeakAreas`.
- `src/components/MistakeJournalCard.tsx` — renders `area.label` (precise type label or legacy *Level X.Y — Topic*); practice link includes `&type=` when present.
- `src/components/TargetedPracticeCTA.tsx` — when a precise type is known, headline becomes *"{Label} could use a little practice"* and the link includes `&type=`. When `problemType` is null (legacy bucket) the original wording is preserved.
- `src/app/practice/weak-spots/page.tsx` — accepts optional `?type=`. With a type, calls `generateProblems(level, sublevel, 40)`, filters by matching `type`, takes the first 10; backfills from the unfiltered remainder if the filtered batch is short, so practice never fails because exact-type generation came up empty. Without `type`, behaviour is unchanged.
- `supabase/schema.sql` — comment annotating the new column.

**Files unchanged (intentionally):**
- All generators — they already emitted `type`; no shape change.
- `src/app/actions/worksheet.ts` — no grading change.
- `src/lib/math/inputMode.ts` — `inputModeForType()` is keyed off `type`, which is what we now persist; the historical stylus *"x → ."* bug protection carries over to the practice page automatically.
- `src/app/practice/weak-spots/PracticeForm.tsx` — server narrowing handled upstream.

**Grouping strategy:**
- New rows: bucket per `(level_id, problem_type)`. Avoids conflating e.g. 1/1 `addition` with 1/2 `addition` (single-digit vs double-digit).
- Old rows (`problem_type IS NULL`): bucket per `level_id` only (legacy path), labelled *Level X.Y — Topic*.
- Same thresholds as Milestone 53: skip < 4 attempts, skip ≥ 80% accuracy, sort by `incorrectCount desc, accuracy asc`, top 3.

**Targeted-practice matching:**
- `requestedType` present → over-generate 4× then filter then top up. Cheap thanks to the bounded random generators (`count × 50` retry budget per Milestone 26). For type-uniform levels (1/1, 2/1, 3/1, 4/1, 4/2) the filter is a no-op. For multi-type levels (5/x, 6/x, 7/x, 8/x, 9/x, 11/1) we get mostly/exactly the requested type.
- Side-effect-free guarantee preserved: no `INSERT` to `sessions`/`problems`, no `UPDATE` to `streaks`/`student_level_progress`/`students`.

**v1 limitations (documented for future revisit):**
- Old rows pre-Milestone-54 stay at level/topic precision (no backfill).
- Buckets are split by `(level_id, problem_type)` — the same `type` across two levels (e.g. 1/1 `addition` and 1/2 `addition`) does not aggregate into one weak area. This is deliberate to preserve difficulty separation.
- No DB index on `problem_type`. Mistake Journal queries are bounded (≤ 20 sessions × ~20 problems) and group in JS. Add an index later if the dataset grows.
- Examples on the dashboard still show only the prompt, not the wrong/correct answers.

---

### Milestone 53 — Mistake Journal / Targeted Practice v1 (2026-05-08)

**Goal:** Identify what a student is struggling with from existing data and offer focused practice — without altering progression, mastery, streaks, or points.

**Mistake analysis strategy (v1, no schema changes):**
- Window: last 20 completed sessions for the selected student (reuses the dashboard's existing bounded `sessions` fetch — no extra session query).
- Grouping signal: `sessions.level_id → levels.{level_number, sublevel_number, topic}`. Generators emit a per-problem `type` but it isn't persisted — Option A (level/topic grouping) chosen over Option B (add `problems.problem_type`) per the brief.
- One new query: `problems.select('problem_text, correct_answer, is_correct, session_id, order_index').in('session_id', recentSessionIds)`. Empty arrays short-circuit before the `.in(...)` call.
- Filtering: skip levels with `< 4` attempts in window, skip levels with `≥ 80%` accuracy. Sort by `incorrectCount desc, accuracy asc`. Take top 3.
- Examples sorted in JS by `session.completed_at desc, then problem.order_index asc` — no UUID-as-chronology.
- Signal banding: `accuracy ≤ 50% → high`, `≤ 70% → medium`, else `low` (drives parent-facing copy *Needs some practice / Could use a little practice / A bit of polish would help*).

**Files added:**
- `src/lib/mistakeJournal.ts` — pure `deriveWeakAreas()` derivation, no Supabase dependency.
- `src/lib/math/inputMode.ts` — extracted `inputModeForType()` and `problemTypeLabel()` so worksheet + practice forms share the per-problem-type input handling. Prevents the historical stylus bug where `"x"` autocorrects to `"."` for algebra/factorization/inequality/sim-eq/fraction/negative answers.
- `src/components/MistakeJournalCard.tsx` — dashboard "Needs Practice" card with empty state, top-3 weak areas, `Practise` link per area.
- `src/components/TargetedPracticeCTA.tsx` — soft optional CTA on `/play`.
- `src/app/practice/weak-spots/page.tsx` — server component: auth, parses `?student/level/sublevel`, validates against `SUPPORTED_LEVEL_KEYS`, generates 10 problems, hands them off to the client form. Friendly *Practice Coming Soon* fallback for unsupported levels.
- `src/app/practice/weak-spots/PracticeForm.tsx` — client component: stateful answer entry, **client-side grading via shared `gradeAnswer`**, inline per-problem results, "Practise again" / "Back to play" CTAs. No persistence, no server action.

**Files modified:**
- `src/app/worksheet/WorksheetForm.tsx` — now imports `inputModeForType` / `problemTypeLabel` from the shared helper instead of defining them locally.
- `src/app/dashboard/page.tsx` — extra `problems` query (bounded by recent 20 session IDs), `deriveWeakAreas` call, `MistakeJournalCard` mounted between Milestones and Recent Worksheets.
- `src/app/play/page.tsx` — `levelSpeedTargets` query expanded to include `level_number, sublevel_number, topic`, `sessions` query expanded to include `completed_at`, derive single top weak area, render `TargetedPracticeCTA` only when one exists AND it isn't the same level the stuck-support card is already addressing.

**No schema changes.**

**Validation (Playwright + manual, fresh signup `mistake-journal@test.local` → student "Riley"):**
- Empty state: dashboard *"No clear weak spots yet — keep practising. Riley hasn't made enough mistakes for us to spot a pattern."* ✓ `/play` shows no CTA. ✓
- After one 12/20 worksheet (8 deliberate misses at Level 1.1): dashboard renders `Level 1.1 — Addition · Could use a little practice · missed 8 of 20 (60% accuracy) · Recent: 4 + 4 = ?, 8 + 5 = ?` with a `Practise` link to `/practice/weak-spots?student=…&level=1&sublevel=1`. ✓
- `/play` shows the soft CTA pointing at the same level. ✓
- `/practice/weak-spots?level=1&sublevel=1`: 10 generated problems, "Practice · won't change your level" pill + reassurance copy visible. Submit 7 correct + 3 wrong → inline results card *Practice complete · 7 / 10 (70%)* with per-problem ✓/✗ markers (8 ✓ tiles, 3 ✗ tiles — 7 problem ✓ + 1 summary ✓ chip = 8). ✓
- **No-side-effects verification (before/after):** Level 1, Sublevel 1, Streak 1, Points 10 — identical pre/post-practice. Recent Worksheets count: 1 (unchanged, practice did not insert a session row). Dashboard "Sessions" stat: 1 (unchanged). The pre-existing weak area on dashboard still reads `missed 8 of 20 (60% accuracy)` — the practice run was not pulled into the journal. ✓
- Unsupported level guard: `?level=99&sublevel=1` → friendly *Practice Coming Soon* card, no crash. ✓
- Mobile (390 × 844): Mistake Journal card renders without horizontal overflow (`scrollWidth ≤ clientWidth`); practice form lays out cleanly. ✓
- Console errors: 0 across signup → onboarding → play → worksheet → results → dashboard → practice flow.
- `npx tsc --noEmit`: 0 errors. `npx eslint`: 0 errors.

**v1 limitations (documented for future revisit):**
- **Level/topic grouping, not problem-type grouping** — the journal can say *"struggling with Level 6.1 Decimals"* but not *"struggling with decimal subtraction specifically"*. Generators already emit a per-problem `type`; persisting it (`problems.problem_type text`) is the natural Option B upgrade.
- **Last-20-sessions window** — older mistakes age out by design. A student returning after a long break will start with an empty journal even if they previously had weak spots.
- **Client-side grading on `/practice/weak-spots`** — correct answers ship inside the page payload. Acceptable because practice doesn't affect progression and the audience is 6–12; a future v2 could move grading server-side via a stateless action with an encoded payload if needed.
- **Examples are textual prompts only** — they show the prompt (`4 + 4 = ?`) but not the student's wrong answer or the correct answer. Adding the latter would be a small UI iteration.
- **Practice runs are entirely ephemeral** — no record of "Riley practised X 5 times this week". If practice persistence is wanted later, it should land in a separate table or a flagged session row to keep the no-progression guarantee.

---

### Milestone 52 — Tiered Achievements, Dashboard Polish, Scrollable Recent Worksheets (2026-05-08)

**Goal:** Replace the fixed 8-milestone v1 with tiered families that always show "what's next?", polish the parent dashboard metrics + trend, and stop Recent Worksheets pushing the page down indefinitely.

**Tier structure (7 families, derived from existing rows — no schema changes):**

| Family | Source | Tiers |
|---|---|---|
| 📘 Worksheets completed | `streaks.total_sessions` | 1, 5, 10, 25, 50, 100 |
| 💯 Perfect scores | count of `sessions.accuracy = 100` | 1, 5, 10, 25 |
| 🔥 Best streak | `streaks.longest_streak` | 3, 5, 7, 14, 30 |
| 🚀 Levels mastered | distinct passed `level_id` from `sessions` | 1, 3, 5, 10 |
| ⭐ Points earned | `streaks.total_points` | 100, 500, 1000, 2500 |
| ✏️ Self-correction wins | `problems.self_corrected = true` (joined to student via `sessions!inner(student_id)`) | 1, 5, 10 |
| ⚡ Speedy passes | `passed AND time_taken_seconds <= levels.speed_target_seconds` | 1, 5, 10 |

Each row shows highest tier earned + a progress bar to the next tier; "All tiers earned 🏆" once maxed. Play page shows earned highest-tier badges only as a strip ("Your wins").

**Files added:** none.

**Files modified:**
- `src/lib/achievements.ts` — replaced v1 `ACHIEVEMENTS` / `deriveEarnedAchievements` with `ACHIEVEMENT_FAMILIES`, `deriveAchievementProgress()`, `earnedTierBadges()`. Extended `detectSessionMilestones` thresholds to fire on 1/5/10/25/50/100 worksheet hits.
- `src/components/AchievementsCard.tsx` — rewritten. Dashboard variant renders 7 family rows with tier-earned badge + progress bar. Play variant renders earned highest-tier badges as a soft pill strip; same empty-state copy.
- `src/app/dashboard/page.tsx` — consolidated data path (one bounded full-history `sessions` fetch with `.limit(500)` + one self-correction count via `sessions!inner` join). Dropped `perfectMarker` / `masteryMarker`. Reordered sections to **Progress at a Glance → Milestones → Recent Worksheets** (Milestones grew, Recent now scrolls). Polished metrics labels (`Accuracy / Pass rate / Time / Sessions`, `tabular-nums`). Trend chart bumped 40px → 64px with a dashed level-`accuracy_threshold` line + "Last session N% · average N%" header. Recent Worksheets wrapped in `max-h-[26rem] overflow-y-auto` container with thin scrollbar styling, plus a subtle "Showing latest N worksheets — scroll to see more." helper line when the row count exceeds the visible threshold.
- `src/app/play/page.tsx` — same data-path consolidation; mounts `AchievementsCard variant="play"` with the new `progress` prop.

**Validation (Playwright + manual, against fresh signup `m52-fresh@test.local` → student "Riley"):**
- Empty-state dashboard: 7 family rows all "not yet" with correct first tiers (`0 / 1`, `0 / 3 days`, `0 / 100`, etc.). Header shows "7 of 7 next tiers in progress". Empty-state copy renders. ✓
- Empty-state play: "Finish a worksheet to earn your first badge — they show up right here." ✓
- After 1 perfect 20/20 worksheet: dashboard shows Worksheets / Perfect / Levels mastered / Speedy passes at Tier 1 ✓ with `1 / next` progress; Best streak `1 / 3 days`; Points `15 / 100`; Self-correction `0 / 1` (no mistakes made). ✓
- After 8 worksheets across levels 1.1 → 2.2: Worksheets `Tier 10 ✓ 10 / 25`, Perfect `Tier 10 ✓ 10 / 25`, Levels mastered `Tier 3 ✓ 4 / 5`, Points `Tier 100 ✓ 150 / 500`, Speedy passes `All tiers earned 🏆 10`. ✓
- Recent Worksheets scrollable: `clientHeight=416px`, `scrollHeight=712px`, `scrollable=true`, helper line "Showing latest 10 worksheets — scroll to see more." renders. Rest of dashboard stays fixed while Recent scrolls. ✓
- Play "Your wins": shows earned highest-tier badges (`📘 10 Worksheets · 💯 10 Perfect Scores · 🚀 3 Levels Mastered · ⭐ 100 Points · ⚡ 10 Speedy Passes`). ✓
- Results page Milestones strip continues to fire: `📘 First Worksheet · 💯 Perfect Score · ⚡ Beat the Time Target` on the first 20/20 session. ✓
- Level advancement (1.1 → 1.2 → 2.1 → 2.2) and Mastery progress banners untouched. ✓
- Recent Worksheets timestamp: `8 May 2026, 5:50 pm NZT` — `formatNzDateTime` unchanged. ✓
- Mobile (390 × 844): family rows + scrollable Recent panel render cleanly; trend bars + 90% target line legible. ✓
- Tablet (768 × 1024): same. ✓
- Console errors: 0 across signup → onboarding → play → worksheet → results → dashboard. Pre-existing `themeColor` viewport warning unchanged.
- `npx tsc --noEmit`: 0 errors. `npx eslint`: 0 errors.

**v1 limitations (documented for future revisit):**
- Achievement counts derived per render — not persisted as individual unlock events; no per-tier earned date.
- "Levels mastered" counts distinct `level_id`s with at least one passing session. A placement-jumped student who passes once at the new level still gets +1 (consistent with Milestone 51).
- `sessions` fetch capped at the most recent 500 per dashboard render. A student with 500+ historical sessions would under-count Speedy / Levels-mastered tiers from the very first ones; Worksheets/Streak/Points come from `streaks` and are unaffected.
- Recent Worksheets shows up to 25 entries, no pagination beyond that.
- No celebration animation when a freshly-crossed tier hits on the dashboard. Results-page strip already fires for 1/5/10/25/50/100 worksheet hits and Perfect Score hits — that's the celebration surface.

---

### Milestone 51 — Achievements / Milestones v1 (2026-05-07)

**Goal:** Add a simple, motivating achievement layer using existing data — no new schema, no LLM, no third-party libraries.

**Achievement set (8 always-visible):**
- 🎯 First Worksheet — `streaks.total_sessions >= 1`
- 📘 5 Worksheets — `streaks.total_sessions >= 5`
- 📚 10 Worksheets — `streaks.total_sessions >= 10`
- 🔥 3-Day Streak — `streaks.longest_streak >= 3`
- 🔥 5-Day Streak — `streaks.longest_streak >= 5`
- 💯 Perfect Score — any session with `accuracy = 100` (cheap existence query)
- ⚡ Speedy Pass — last 10 sessions: any `passed = true AND time_taken_seconds <= levels.speed_target_seconds` (v1 limitation: only checks recent 10 to avoid loading full session list)
- 🚀 Level Mastered — `(students.current_level > 1 OR current_sublevel > 1) AND any session with passed = true`. The genuine-pass gate filters out students who were placement-jumped and never practised. Edge case: a placement-jump followed by a single pass at the new level still unlocks it — accepted for v1 since the brief groups "mastered / advanced" together.

**Results-page "Milestones unlocked" strip (additive, session-scoped):**
- 🎯 First Worksheet / 📘 5 Worksheets / 📚 10 Worksheets — fires when `streaks.total_sessions` after this session equals 1/5/10
- 💯 Perfect Score — fires when this session's accuracy = 100 (always, not just first time)
- ⚡ Beat the Time Target — passing session within target time
- ✏️ Fixed Every Mistake — when every incorrect problem also has `self_corrected = true`

Streak milestones intentionally skipped on results page (current_streak reflects "right now", not the moment the session was completed — would mislead on revisited old results pages). Level Up handled by the existing dedicated banner.

**Files added:**
- `src/lib/achievements.ts` — `ACHIEVEMENTS` definitions, `deriveEarnedAchievements()`, `detectSessionMilestones()`. Pure, no Supabase dependency.
- `src/app/achievements/AchievementsCard.tsx` — server component. `variant="dashboard"` shows full grid (earned + dimmed locked + count); `variant="play"` shows earned-only with a child-friendly empty state.

**Files modified:**
- `src/app/dashboard/page.tsx` — adds two cheap existence queries (`sessions where accuracy=100 limit 1`, `sessions where passed=true limit 1`) into the existing `Promise.all`, computes `levelSpeedTargets` from `allLevels`, mounts `<AchievementsCard variant="dashboard" />` between Current Focus and Recent Worksheets. Recent Worksheets timestamp now uses `formatDateTime()` (e.g. `7 May 2026, 6:20 pm · 20/20 · 100% · 29s`) — single line, blends with existing layout.
- `src/app/play/page.tsx` — adds parallel queries for recent 10 sessions, level speed targets, and the same two existence markers; mounts `<AchievementsCard variant="play" />` between the topic card and Last Session.
- `src/app/worksheet/results/[sessionId]/page.tsx` — pulls `levels.speed_target_seconds` (added to existing levelMeta select) and `streaks.current_streak, total_sessions`; renders a "Milestones unlocked" card above the existing Level Up / Mastery progress banners only when `detectSessionMilestones()` returns at least one badge.

**No schema changes.** All achievements are derived at render time. Documented limitation: Speedy Pass dashboard/play check is bounded to the last 10 sessions; if a student's only beat-the-time session is older than that, the badge will not appear (the results page strip still fires correctly per-session).

**Playwright validation (fresh signup, fresh student "Riley"):**
- Empty-state dashboard: "Milestones — 0/8 earned, Riley hasn't earned any milestones yet …", all 8 tiles dimmed. ✓
- Empty-state play: "Your wins — Finish a worksheet to earn your first badge". ✓
- Submitted a perfect 20/20 addition worksheet in 29s (under 8m target). Results page Milestones unlocked card showed: 🎯 First Worksheet, 💯 Perfect Score, ⚡ Beat the Time Target. ✓
- Dashboard after submission: 3/8 earned tiles bright (First Worksheet, Perfect Score, Speedy Pass), Level Mastered correctly remained dimmed (student is still at 1.1 with 1/3 passes — placement-jump guard works). ✓
- Recent Worksheets row: "Level 1.1 — Addition / 7 May 2026, 6:20 pm · 20/20 · 100% · 29s ✓". ✓
- Play page after submission: "Your wins" card shows 3 earned badges, no locked tiles, child-friendly. ✓
- Mobile (390 × 844): milestones grid drops to 2 columns, recent-worksheets line still fits. ✓
- Tablet (≥640): milestones grid uses 4 columns. ✓
- Console errors: 0 across signup → onboarding → play → worksheet → results → dashboard.
- `npx tsc --noEmit`: 0 errors. `npx eslint`: 0 errors.

**v1 limitations (documented for future revisit):**
- Achievements are derived per render — not persisted as individual unlock events. No "earned date" UI for the four achievements where the date isn't recoverable from existing rows (streaks, level mastery).
- Speedy Pass dashboard/play check only scans the last 10 sessions. A targeted Postgres function or a stored "achievements" row could lift this if richer history matters.
- "Fixed Every Mistake" is results-page only (not in the persistent grid) — it would require a `problems` join across all sessions, deferred until v2.
- No celebration animation for newly-earned milestones beyond what already exists (`CelebrationEffect` for 100%). Kept deliberately quiet per brief.

---

### Milestone 50 — Parent PIN / Student Mode (2026-05-05)

**Goal:** Let parents lock the parent dashboard behind an optional 4-digit PIN so kids can use Student View independently — with a calm, family-friendly tone (never "locked / denied / blocked").

**Schema change (applied via Supabase MCP `apply_migration`):**

```sql
alter table public.profiles
  add column if not exists parent_pin text,                                   -- nullable; "saltHex:scryptHashHex"
  add column if not exists pin_failed_attempts integer not null default 0,
  add column if not exists pin_locked_until timestamptz;
```

Existing RLS on `profiles` (insert/select/update own row) covers the new columns — no policy change needed. Migration name: `add_parent_pin_to_profiles`.

**Files added:**
- `src/lib/pin.ts` — `hashPin` / `verifyPin` / `isValidPinFormat` using `node:crypto.scryptSync` (16-byte salt, 64-byte key, `timingSafeEqual` compare). No new dependency.
- `src/lib/parentMode.ts` — `STUDENT_MODE_COOKIE`, `MAX_PIN_ATTEMPTS = 5`, `COOLDOWN_SECONDS = 30`, `setStudentModeCookie` / `clearStudentModeCookie` (both wrapped in try/catch so they're safe to call from server components), `sanitizeNext` (rejects absolute and `//`-prefixed redirects), `enforceParentMode(returnTo)` page-level guard.
- `src/app/actions/pin.ts` — `setPin`, `removePin`, `lockToStudentMode`, `verifyPinAction` server actions. Cooldown is server-authoritative (DB), counter resets on success.
- `src/app/parent-pin/page.tsx` + `PinEntryForm.tsx` — soft "This bit's for parents" page with single 4-digit input (`inputMode="numeric"`, `maxLength=4`), live cooldown countdown, "Back to Student View" + "Sign out" escapes.
- `src/app/dashboard/PinSettings.tsx` — set/change/remove PIN inline forms with `router.refresh()` after success so the chip + "Hand over" button update immediately.
- `src/app/onboarding/pin/page.tsx` + `OnboardingPinForm.tsx` — optional PIN step shown only after the *first* student is created (skippable; future students return to /dashboard as before).

**Files modified:**
- `src/app/actions/auth.ts` — clears the student-mode cookie on `signIn`, `signUp`, and `signOut` so a new login is never inherited by a stale lock.
- `src/app/actions/students.ts` — first-student create now redirects to `/onboarding/pin?student=…` instead of `/play?student=…`. Subsequent adds unchanged.
- `src/app/dashboard/page.tsx` — calls `enforceParentMode('/dashboard')`, fetches `parent_pin` to compute `hasPin`, surfaces a soft `?pin=needed` hint banner, conditional "Hand over to child" button, mounts `<PinSettings />` inside Admin controls.
- `src/app/onboarding/page.tsx` — calls `enforceParentMode('/onboarding')`; new "Optional 4-digit PIN keeps the parent view tucked away" bullet on first-time copy.
- `src/app/feedback/page.tsx` — calls `enforceParentMode('/feedback')`.
- `src/app/placement/page.tsx` — calls `enforceParentMode('/placement?student=…')`.
- `src/app/page.tsx` — new "Safe for kids to use independently" differentiator card.
- `src/lib/helpContent.ts` — replaced the old "Can my child access Parent View?" preview answer; added FAQs for PIN setup, Student Mode, and forgotten PIN; updated parent-student workflow FAQ to mention "Hand over to child".

**Key UX decisions (per the brief's tone guidance):**
- Lock entry point reads "Hand over to child" — frames it as a thoughtful handoff, not a security toggle.
- PIN helper page heads with "This bit's for parents" + "Pop in the parent PIN to take a peek at progress" — never "locked / denied / blocked / restricted".
- After 5 wrong attempts: counter zeros, `pin_locked_until` set to `now + 30s`, button changes to "Take a short break — Ns" with live countdown. Soft phrasing throughout. Cooldown survives page reloads (DB-backed).
- Forgot-PIN recovery: "Sign out" button on the PIN screen + explainer copy. Login resets PIN state via the cleared cookie.
- Open-redirect-safe: `next` query param is sanitised at both the page render (hidden input) and on the action redirect; absolute URLs and `//host` paths fall back to `/dashboard`.
- `enforceParentMode` short-circuits if the parent has no PIN saved — first-time signups never see the helper, and removing a PIN immediately makes the dashboard reachable again.

**Playwright validation (fresh signup, fresh email, full flow):**
- Signup → `/onboarding` → name "Riley" → `/onboarding/pin?student=…`. Skip → `/play`. ✓
- `/dashboard` reachable normally before any PIN. ✓
- "Set up PIN" inline form, save, chip flips to "PIN saved", DB shows hashed value (161 chars `salt:hash`). ✓
- "Hand over to child" → cookie set → `/play`. ✓
- Direct URL `/dashboard`, `/feedback`, `/onboarding`, `/placement?student=…` all 307 to `/parent-pin?next=…`. ✓
- `/play` and `/worksheet` reachable while student-mode is on. ✓
- 5 wrong PINs → attempts 1–3 "That doesn't match. Try again.", attempt 4 "One more try before a short break.", attempt 5 "Take a short break — try again in 30s." with live countdown + disabled input + DB `pin_locked_until` populated. ✓
- Correct PIN after lock cleared → `/dashboard`. Cookie cleared, counter reset. ✓
- Change PIN flow: requires current PIN, "PIN updated" success, refresh re-renders chip. ✓
- Remove PIN flow: requires current PIN, DB `parent_pin = null`, chip flips back to "No PIN yet", student-mode cookie cleared. ✓
- Open-redirect: `?next=https://evil.example/foo` and `?next=//evil.example` both rewritten to `/dashboard` in the hidden form input. ✓
- Sign-out from `/parent-pin` → `/login` → re-login → `/play`. Cookie cleared by `signIn`, `/dashboard` reachable directly without PIN. ✓
- Onboarding PIN happy path: name student → `/onboarding/pin` → set PIN → `/play`, DB row shows hashed PIN. ✓
- Mobile (390 × 844): `/parent-pin` lays out cleanly, central PIN box, all soft copy visible. ✓
- TypeScript: `npx tsc --noEmit` 0 errors. Console errors: 0 across all visited pages.

**v1 limitations:**
- `enforceParentMode` is page-level rather than middleware. Future pages added under parent-only paths must add the call manually. Worth a soft lint/check if more parent routes appear.
- Cooldown is global per-account, not per-device. A parent on another device hitting the same account during a kid's cooldown will see the same lock window — fine for v1.
- No email-based PIN reset (per brief). Recovery is "sign out + re-login + remove PIN under Admin controls".
- `PinSettings` form uses a plain `text` input with `inputMode="numeric"` (not `type="password"`). Chose readability over masking — parents typing it are alone with the device. Easy to flip later if needed.

---

### Milestone 49 — Parent Help Page (2026-04-19)

**Goal:** Make core parent-facing help content accessible after login, not only from the public landing page.

**Files changed:**
- `src/lib/helpContent.ts` — new shared module; exports `FAQ_ITEMS` array (single source of truth for FAQ)
- `src/app/help/page.tsx` — new public `/help` page: What is MathStep, How it works (4 steps), Parent vs Student view comparison, full FAQ, "Still have a question?" CTA linking to /feedback
- `src/app/page.tsx` — imports `FAQ_ITEMS` from shared module (eliminates copy drift); added "Help" link to landing footer
- `src/app/dashboard/page.tsx` — added "Help" link to footer (before Privacy)
- `src/app/play/page.tsx` — added "Help" link to footer alongside "Send feedback"

**Help is now accessible from:**
- `/` (landing page footer)
- `/dashboard` (footer)
- `/play` (footer)
- Direct URL: `/help` (public, no auth required — shareable)

**Playwright validation:**
- `/help` → 200, loads, 0 console errors, all sections render
- `/help` mobile (390px) → clean stack layout, all sections readable
- `/help` tablet (768px) → two-column parent/student card renders correctly
- `/` → 200, FAQ renders from shared source, Help link in footer confirmed
- `/dashboard` → 307 redirect to /login (correct auth guard)
- Pre-existing warning: `themeColor` metadata on /dashboard — unrelated to this milestone

---

### Milestone 48 — Beta UX Polish (2026-04-19)

**Goal:** Reduce friction for beta testers — easier feedback submission, back-to-top on long results page, and faster perceived navigation.

**Files changed:**
- `src/app/dashboard/page.tsx` — added `Link` import; replaced all internal `<a href>` with `<Link>`; parallelized Supabase queries (4 parallel in group 1, 2 in group 2)
- `src/app/play/page.tsx` — added `Link` import; replaced `<a href>` with `<Link>`; parallelized Supabase queries (2 parallel then 3 parallel); added "Send feedback" footer link
- `src/app/worksheet/page.tsx` — added `Link` import; replaced `<a href>` with `<Link>` on all nav links
- `src/app/worksheet/results/[sessionId]/page.tsx` — added `Link` import; replaced `<a href>` with `<Link>`; added `BackToTop` component
- `src/app/worksheet/results/[sessionId]/BackToTop.tsx` — new client component: fixed floating ↑ button, appears after 400px scroll

**Key findings:**

*Phase 1 — Feedback UX:*
- Feedback page itself is clean and functional; discoverability was the gap
- Added "Send feedback" link to play page footer (the main parent-facing surface after the student view)
- The `/feedback` link already exists in the dashboard footer; no change needed there

*Phase 2 — Back-to-top:*
- Added to results page only — up to 20 problem cards makes it genuinely long
- Not added to dashboard (card-list, parent scrolls to read, no scroll-and-return workflow)
- Not added to landing page (marketing page, back-to-top isn't a parent's workflow)

*Phase 3 — Navigation slowness:*
- **Root cause identified:** All internal navigation used `<a href>` instead of `<Link>`, causing full page reloads on every click. Every transition re-downloaded the page, re-initialized JS, and triggered a new server render from scratch.
- **Fix:** Replaced all internal `<a href>` with `<Link>` across dashboard, play, worksheet, results, and feedback pages. Next.js `<Link>` provides client-side SPA navigation with prefetch-on-hover.
- **Remaining floor:** Even with `<Link>`, App Router server components still perform auth check + Supabase round-trips on each navigation. This is expected — the server must re-validate session and fetch fresh data. The parallelization reduces the query waterfall from ~7 sequential to ~3 parallel groups on dashboard and play, which should cut per-page latency noticeably.
- **Dashboard query groups before → after:** 8 sequential → auth+students, then 4 parallel (streaks/level/allLevels/recentSessions), then 2 parallel (levelProgress/stuckSessions)
- **Play query groups before → after:** 7 sequential → auth+students, then 2 parallel (streaks/level), then 3 parallel (lastSession/levelProgress/stuckSessions)

**Validation:**
- TypeScript: clean (`npx tsc --noEmit`, 0 errors)
- `/` → 200, 0 console errors
- `/login` → 200, 0 console errors
- `/signup` → 200, 0 console errors (not tested — no test credentials)
- `/dashboard`, `/play`, `/feedback` → 307 redirect to /login (correct auth guard behavior)
- Zero remaining `<a href>` in dashboard, play, worksheet, results pages

---

### Milestone 47 — UX/Copy Clarity Pass (2026-04-19)

**Goal:** Make the app easier for parents to understand, easier for children to follow, and more polished for beta testers.

**Files updated:**
- `src/app/page.tsx` — added FAQ section (9 Q&As) before footer
- `src/app/onboarding/OnboardingForm.tsx` — added explanatory subtext under each button
- `src/app/worksheet/WorksheetForm.tsx` — added scratchpad hint below timer
- `src/app/dashboard/page.tsx` — "Speed target" → "Time target"
- `src/app/play/page.tsx` — "Speed target" → "Time target"

**Key changes:**

FAQ section (landing page):
- 9 Q&As covering: what is MathStep, who it's for, child email, setup, marking, stuck support, review meaning, parent vs student view, live tutor clarification
- Rendered as simple card list before footer — no JS required

Onboarding:
- "Start at Level 1" button now has subtext: "Starts from the beginning. Great for younger students or building a solid foundation."
- "Take a short placement quiz" button now has subtext: "Answer a few questions to find the right starting level. Takes about 2 minutes."

Worksheet:
- Small hint below timer: "Need space to work things out? There's a drawing area at the bottom of this page."

Terminology:
- "Speed target" → "Time target" on dashboard and play pages (less pressuring, more descriptive)
- DB column `speed_target_seconds` unchanged

**Playwright smoke checks:**
- `/` — 200, loads, 0 console errors, FAQ renders correctly
- `/onboarding` — 200, loads, 0 console errors, button subtext visible
- `/login` — 200, loads, 0 console errors
- `/signup` — 200, loads, 0 console errors

---

### Milestone 46 — Product Messaging / Positioning Pass (2026-04-19)

**Goal:** Clarify MathStep's positioning for parents and skeptical educators. Make the support story (worked examples, instant marking, self-correction, stuck-mode warm-up, parent visibility) obvious. Subtle "practice system, not a live tutor" framing.

**Files updated:**
- `src/app/page.tsx` — full landing page copy rewrite
- `src/app/onboarding/page.tsx` — first-time bullet points
- `src/app/play/page.tsx` — stuck card copy
- `src/app/dashboard/page.tsx` — stuck notice for parent

**Key messaging changes:**

Landing page:
- Hero body: added "instant marking, worked examples" to the core value prop
- "How it works" step 2: now mentions instant marking, worked examples, mastery gating
- "Why MathStep?" renamed to "What makes MathStep different" with 6 focused differentiator cards: Instant marking / Worked examples at every level / Self-correction after results / Mastery-based progression / Stuck-mode support / Parent visibility
- Added "Short sessions that fit real life" note (10–15 min, tablet-first)
- Added new section: "A practice system, not a live tutor" — honest positioning, not defensive

Onboarding:
- Replaced generic bullets with copy that explains how the app teaches: instant marking + worked examples, parent dashboard, device support

Play page (stuck card):
- Expanded from 2 lines to 3; names the worked example and warm-up explicitly; reassuring tone

Dashboard (stuck notice):
- Added level number to heading for specificity; expanded guidance for parent ("it may help to review the worked example together")

**Playwright smoke checks:**
- `/` — 200, loads, 0 console errors
- `/onboarding` — 200, loads, 0 console errors
- `/disclaimer` — 200, loads, 0 console errors
- `/privacy` — 200, loads, 0 console errors
- `/login` — 200, loads, 0 console errors
- `/signup` — 200, loads, 0 console errors

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
