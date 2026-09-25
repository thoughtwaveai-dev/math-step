// Level 19.1 smoke test: every generated percentage change problem must be
// correct when recomputed from its own prompt with integer maths, unique, in the
// intended answer format, and grade correct through the real gradeAnswer path.
//
// Run: npx tsx scripts/level-19-1-smoke.ts
// Before the shared wiring lands: npx tsx scripts/level-19-1-smoke.ts --no-wiring

import { generatePercentageChangeProblems } from '../src/lib/math/generators/percentage-change'
import { seededRand } from '../src/lib/math/generators/rand'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { inputModeForType, placeholderForType, problemTypeLabel } from '../src/lib/math/inputMode'
import { getAnswerControlType } from '../src/lib/math/answerControl'
import { generateProblems } from '../src/lib/math/generators'

const WIRING = !process.argv.includes('--no-wiring')

let checks = 0
let failures = 0

function fail(msg: string) {
  failures++
  if (failures <= 20) console.log(`FAIL: ${msg}`)
}

function check(cond: boolean, msg: string) {
  checks++
  if (!cond) fail(msg)
}

const HINT = ' Answer with just the number\\.$'

// p% of base with integer maths only; null when it is not a whole number.
function wholePercent(base: number, p: number): number | null {
  return (base * p) % 100 === 0 ? (base * p) / 100 : null
}

// Whole number of hundredths -> canonical decimal, done independently of the
// generator: 112 -> "1.12", 150 -> "1.5", 70 -> "0.7", 5 -> "0.05".
function fromHundredths(n: number): string {
  const whole = Math.floor(n / 100)
  let frac = String(n % 100)
  if (frac.length === 1) frac = `0${frac}`
  while (frac.endsWith('0')) frac = frac.slice(0, -1)
  return `${whole}.${frac}`
}

// Each entry: prompt regex, capture index of the base (or "from") number, and of
// the percent. Every type 1 and type 2 template reads as "base then percent".
const INCREASE_RES: Array<[RegExp, number, number]> = [
  [new RegExp(`^Increase (\\d+) by (\\d+)%\\.${HINT}`), 1, 2],
  [new RegExp(`^The price of a (?:ticket|book|video game|bike|concert ticket) is \\$(\\d+)\\. It goes up by (\\d+)%\\. What is the new price\\?${HINT}`), 1, 2],
  [new RegExp(`^A school has (\\d+) students\\. The number of students grows by (\\d+)%\\. How many students are there now\\?${HINT}`), 1, 2],
  [new RegExp(`^([A-Z][a-z]+) earns \\$(\\d+) a week\\. \\1 gets a (\\d+)% pay rise\\. How much does \\1 earn now\\?${HINT}`), 2, 3],
]
const DECREASE_RES: Array<[RegExp, number, number]> = [
  [new RegExp(`^Decrease (\\d+) by (\\d+)%\\.${HINT}`), 1, 2],
  [new RegExp(`^A (?:jacket|skateboard|backpack|board game|tent|pair of shoes) costs \\$(\\d+)\\. It is reduced by (\\d+)% in a sale\\. What is the sale price\\?${HINT}`), 1, 2],
  [new RegExp(`^([A-Z][a-z]+) has (\\d+) stickers and gives away (\\d+)% of them\\. How many stickers does \\1 have left\\?${HINT}`), 2, 3],
]

function firstMatch(prompt: string, res: Array<[RegExp, number, number]>): [number, number] | null {
  for (const [re, bi, pi] of res) {
    const m = prompt.match(re)
    if (m) return [Number(m[bi]), Number(m[pi])]
  }
  return null
}

// Recomputes the answer from the prompt text alone. Returns null when the prompt
// does not parse or the numbers do not give a whole-number answer.
function recompute(type: string, prompt: string): string | null {
  if (type === 'percent_increase_amount') {
    const bp = firstMatch(prompt, INCREASE_RES)
    if (!bp) return null
    const inc = wholePercent(bp[0], bp[1])
    return inc === null ? null : String(bp[0] + inc)
  }
  if (type === 'percent_decrease_amount') {
    const bp = firstMatch(prompt, DECREASE_RES)
    if (!bp) return null
    const dec = wholePercent(bp[0], bp[1])
    return dec === null ? null : String(bp[0] - dec)
  }
  if (type === 'percent_change_find') {
    const m =
      prompt.match(new RegExp(`^A price (rises|falls) from \\$(\\d+) to \\$(\\d+)\\. What is the percentage (increase|decrease)\\?${HINT}`)) ??
      prompt.match(new RegExp(`^A club (grows|shrinks) from (\\d+) members to (\\d+) members\\. What is the percentage (increase|decrease)\\?${HINT}`))
    if (!m) return null
    const from = Number(m[2])
    const to = Number(m[3])
    const up = m[1] === 'rises' || m[1] === 'grows'
    // The verb, the direction of the numbers and the question word must agree.
    if (up !== (to > from) || up !== (m[4] === 'increase')) return null
    const diff = Math.abs(to - from) * 100
    return diff % from === 0 ? String(diff / from) : null
  }
  if (type === 'percent_reverse') {
    let m = prompt.match(new RegExp(`^After a (\\d+)% (increase|discount), a price is \\$(\\d+)\\. What was the original price\\?${HINT}`))
    let p: number
    let shown: number
    let up: boolean
    if (m) {
      p = Number(m[1])
      up = m[2] === 'increase'
      shown = Number(m[3])
    } else {
      m = prompt.match(new RegExp(`^In a (\\d+)% off sale, ([A-Z][a-z]+) pays \\$(\\d+) for a (?:jacket|skateboard|backpack|board game|tent|pair of shoes)\\. What was the original price\\?${HINT}`))
      if (!m) return null
      p = Number(m[1])
      up = false
      shown = Number(m[3])
    }
    const factor = up ? 100 + p : 100 - p
    return (shown * 100) % factor === 0 ? String((shown * 100) / factor) : null
  }
  if (type === 'percent_multiplier') {
    const m = prompt.match(/^What decimal do you multiply by to (increase|decrease) an amount by (\d+)%\?$/)
    if (!m) return null
    const p = Number(m[2])
    if (p < 5 || p > 95) return null
    return fromHundredths(m[1] === 'increase' ? 100 + p : 100 - p)
  }
  return null
}

const TYPES = [
  'percent_increase_amount',
  'percent_decrease_amount',
  'percent_change_find',
  'percent_reverse',
  'percent_multiplier',
]
const INT_TYPES = TYPES.slice(0, 4)

// Wiring expectations (also used below to prove the placeholders never leak).
const EXPECTED_PLACEHOLDER: Record<string, string> = {
  percent_increase_amount: 'e.g. 13',
  percent_decrease_amount: 'e.g. 13',
  percent_change_find: 'e.g. 13',
  percent_reverse: 'e.g. 13',
  percent_multiplier: 'e.g. 2.5',
}
const EXPECTED_INPUT_MODE: Record<string, string> = {
  percent_increase_amount: 'numeric',
  percent_decrease_amount: 'numeric',
  percent_change_find: 'numeric',
  percent_reverse: 'numeric',
  percent_multiplier: 'decimal',
}

const typeCounts = new Map<string, number>()
let oneDigitIncrease = 0 // e.g. "1.5": proves "1.50" grading below ran on real answers
let oneDigitDecrease = 0 // e.g. "0.7": proves "0.70" grading below ran on real answers

for (let seed = 1; seed <= 300; seed++) {
  const problems = generatePercentageChangeProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)
    check(p.id.startsWith('pct191_'), `seed ${seed}: bad id "${p.id}"`)

    // Independent recompute from the prompt text.
    const expected = recompute(p.type, p.prompt)
    check(expected !== null, `seed ${seed}: prompt did not parse (${p.type}): "${p.prompt}"`)
    if (expected !== null) {
      check(expected === p.answer, `seed ${seed}: prompt gives "${expected}" but answer says "${p.answer}": "${p.prompt}"`)
    }

    // The prompt must never show the answer as one of its own numbers.
    const promptNums: string[] = p.prompt.match(/\d+(?:\.\d+)?/g) ?? []
    check(!promptNums.includes(p.answer), `seed ${seed}: prompt gives away the answer: "${p.prompt}"`)

    // The placeholder must never be a real answer.
    const placeholderNum = Number(EXPECTED_PLACEHOLDER[p.type].replace('e.g. ', ''))
    check(Number(p.answer) !== placeholderNum, `seed ${seed}: answer "${p.answer}" equals the placeholder`)

    // The real grader must accept the canonical answer.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)

    if (INT_TYPES.includes(p.type)) {
      // Signed integer path: a plain positive whole number, no leading zero.
      check(/^[1-9]\d*$/.test(p.answer), `seed ${seed}: answer "${p.answer}" is not a plain positive integer`)
      const n = Number(p.answer)
      if (p.type === 'percent_change_find') {
        check(n >= 5 && n <= 90 && n % 5 === 0, `seed ${seed}: percent change ${n} outside 5 to 90 or not a multiple of 5`)
      } else if (p.type === 'percent_reverse') {
        check(n >= 20 && n <= 400, `seed ${seed}: original price ${n} outside 20 to 400`)
      } else {
        check(n >= 20 && n <= 700, `seed ${seed}: amount ${n} outside 20 to 700`)
      }
      check(gradeAnswer(String(n + 1), p.answer) === false, `seed ${seed}: grader accepted ${n + 1} for "${p.answer}"`)
      check(gradeAnswer(String(n - 1), p.answer) === false, `seed ${seed}: grader accepted ${n - 1} for "${p.answer}"`)
    } else {
      // Decimal path: leading digit, a point, one or two digits, no trailing zero.
      const m = p.answer.match(/^(\d)\.(\d{1,2})$/)
      check(!!m && /^\d+\.\d+$/.test(p.answer), `seed ${seed}: multiplier "${p.answer}" is not in decimal form`)
      check(!p.answer.endsWith('0'), `seed ${seed}: multiplier "${p.answer}" has a trailing zero`)
      if (m) {
        const frac = m[2].length === 1 ? `${m[2]}0` : m[2]
        const hundredths = Number(m[1]) * 100 + Number(frac)
        const inRange = (hundredths >= 105 && hundredths <= 195) || (hundredths >= 5 && hundredths <= 95)
        check(inRange, `seed ${seed}: multiplier "${p.answer}" outside 0.05 to 0.95 and 1.05 to 1.95`)
        // answer + 0.01 and answer - 0.01 must grade false.
        check(gradeAnswer(fromHundredths(hundredths + 1), p.answer) === false, `seed ${seed}: grader accepted +0.01 for "${p.answer}"`)
        check(gradeAnswer(fromHundredths(hundredths - 1), p.answer) === false, `seed ${seed}: grader accepted -0.01 for "${p.answer}"`)
        // Typing the percent (112 for 1.12) must grade false.
        check(gradeAnswer(String(hundredths), p.answer) === false, `seed ${seed}: grader accepted ${hundredths} for "${p.answer}"`)
        // A trailing zero from the student ("1.50", "0.70") must still grade correct.
        if (m[2].length === 1) {
          if (hundredths > 100) oneDigitIncrease++
          else oneDigitDecrease++
          check(gradeAnswer(`${p.answer}0`, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}0" for "${p.answer}"`)
        }
      }
    }
  }
}

// Every declared type must actually be produced.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}

// The trailing-zero cases must have actually been exercised on real answers,
// and the two named in the spec must grade correct directly.
check(oneDigitIncrease > 0, 'no one-digit increase multiplier (like 1.5) was generated')
check(oneDigitDecrease > 0, 'no one-digit decrease multiplier (like 0.7) was generated')
check(gradeAnswer('1.50', '1.5') === true, 'grader rejected "1.50" for "1.5"')
check(gradeAnswer('0.70', '0.7') === true, 'grader rejected "0.70" for "0.7"')
check(gradeAnswer('1.51', '1.5') === false, 'grader accepted "1.51" for "1.5"')
check(gradeAnswer('0.71', '0.7') === false, 'grader accepted "0.71" for "0.7"')

// Wiring (fails until the orchestrator wires the shared files; skip with --no-wiring).
if (WIRING) {
  for (const t of TYPES) {
    const type = t as Parameters<typeof inputModeForType>[0]
    check(
      getAnswerControlType(type) === 'default',
      `type ${t}: expected the default control, got ${getAnswerControlType(type)}`,
    )
    check(
      inputModeForType(type) === EXPECTED_INPUT_MODE[t],
      `type ${t}: expected ${EXPECTED_INPUT_MODE[t]} input mode, got ${inputModeForType(type)}`,
    )
    check(
      placeholderForType(type) === EXPECTED_PLACEHOLDER[t],
      `type ${t}: expected placeholder "${EXPECTED_PLACEHOLDER[t]}", got "${placeholderForType(type)}"`,
    )
    const label = problemTypeLabel(type)
    check(!!label && label !== t, `type ${t}: missing parent-facing label`)
  }

  // The router must serve 19/1.
  const routed = generateProblems(19, 1, 20)
  check(routed.length === 20, `router returned ${routed.length} problems for 19/1`)
  check(
    routed.every(p => TYPES.includes(p.type as string)),
    'router returned problems of an unexpected type for 19/1',
  )
}

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`one-digit multipliers exercised: increase=${oneDigitIncrease}, decrease=${oneDigitDecrease}`)
console.log(`${checks} checks, ${failures} failures${WIRING ? '' : ' (wiring skipped)'}`)
process.exit(failures === 0 ? 0 : 1)
