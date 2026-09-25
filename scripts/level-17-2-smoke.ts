// Level 17.2 smoke test: every generated sequence problem must be answerable
// from its own prompt, have exactly the answer the generator claims, stay in
// range with every shown term >= 1, and grade correct through the real
// gradeAnswer path (signed integer for four types, algebraic for the nth term).
//
// Run: npx tsx scripts/level-17-2-smoke.ts
// Before the shared files are wired: npx tsx scripts/level-17-2-smoke.ts --no-wiring

import { generateSequenceProblems, ordinal } from '../src/lib/math/generators/sequences'
import { seededRand } from '../src/lib/math/generators/rand'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { inputModeForType, placeholderForType, problemTypeLabel } from '../src/lib/math/inputMode'
import { getAnswerControlType } from '../src/lib/math/answerControl'
import { generateProblems } from '../src/lib/math/generators'

const WIRING = !process.argv.includes('--no-wiring')
const LEVEL = 17
const SUB = 2
const HINT = 'Write it like 10n + 11.'

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

// Hand-rolled canonical rule, independent of the generator's renderer.
function rule(a: number, b: number): string {
  return b < 0 ? `${a}n - ${-b}` : `${a}n + ${b}`
}

// Independent ordinal suffix, used to check the prompt text.
function suffixFor(n: number): string {
  if ([11, 12, 13].includes(n % 100)) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
}

function constantDifference(terms: number[]): number | null {
  const d = terms[1] - terms[0]
  for (let i = 2; i < terms.length; i++) {
    if (terms[i] - terms[i - 1] !== d) return null
  }
  return d
}

const directions = { inc: 0, dec: 0 }

// Checks a difference is in the spec range for its direction, and counts it.
function checkDifference(d: number, seed: number, prompt: string) {
  if (d > 0) {
    directions.inc++
    check(d >= 2 && d <= 12, `seed ${seed}: increasing difference ${d} out of range: "${prompt}"`)
  } else {
    directions.dec++
    check(d <= -2 && d >= -9, `seed ${seed}: decreasing difference ${d} out of range: "${prompt}"`)
  }
}

// Re-derives the answer from the prompt text alone. Returns null if the prompt
// does not parse for its declared type.
function answerFromPrompt(type: string, prompt: string, seed: number): string | null {
  let m: RegExpMatchArray | null

  if (type === 'sequence_next_term') {
    m = prompt.match(/^Find the next term in this sequence: (\d+), (\d+), (\d+), (\d+), \.\.\.$/)
    if (!m) return null
    const t = m.slice(1, 5).map(Number)
    const d = constantDifference(t)
    check(d !== null && d !== 0, `seed ${seed}: shown terms are not arithmetic: "${prompt}"`)
    if (d === null) return null
    checkDifference(d, seed, prompt)
    check(t.every(v => v >= 1), `seed ${seed}: a shown term is below 1: "${prompt}"`)
    return String(t[3] + d)
  }

  if (type === 'sequence_missing_term') {
    m = prompt.match(/^Find the missing term in this sequence: (\d+|__), (\d+|__), (\d+|__), (\d+|__), (\d+|__)\.$/)
    if (!m) return null
    const slots = m.slice(1, 6)
    const blanks = slots.map((s, i) => (s === '__' ? i : -1)).filter(i => i >= 0)
    check(blanks.length === 1, `seed ${seed}: expected exactly one blank: "${prompt}"`)
    if (blanks.length !== 1) return null
    const gap = blanks[0]
    check(gap >= 1 && gap <= 3, `seed ${seed}: blank at an end (index ${gap}): "${prompt}"`)
    // Difference from the first adjacent pair of known terms.
    let d: number | null = null
    for (let i = 0; i < 4; i++) {
      if (slots[i] !== '__' && slots[i + 1] !== '__') {
        d = Number(slots[i + 1]) - Number(slots[i])
        break
      }
    }
    if (d === null) return null
    const diff = d
    const first = Number(slots[0])
    const full = [0, 1, 2, 3, 4].map(k => first + k * diff)
    // Every known term must fit the reconstructed sequence.
    check(
      slots.every((s, i) => s === '__' || Number(s) === full[i]),
      `seed ${seed}: shown terms are not arithmetic: "${prompt}"`,
    )
    check(d !== 0, `seed ${seed}: zero difference: "${prompt}"`)
    if (d !== 0) checkDifference(d, seed, prompt)
    check(full.every(v => v >= 1), `seed ${seed}: a term is below 1: "${prompt}"`)
    return String(full[gap])
  }

  if (type === 'sequence_nth_term_value') {
    m = prompt.match(/^The nth term of a sequence is (\d+)n ([+-]) (\d+)\. What is the (\d+)(st|nd|rd|th) term\?$/)
    if (!m) return null
    const a = Number(m[1])
    const b = m[2] === '-' ? -Number(m[3]) : Number(m[3])
    const k = Number(m[4])
    check(a >= 2 && a <= 9, `seed ${seed}: a = ${a} out of range: "${prompt}"`)
    check(b !== 0 && b >= -9 && b <= 9, `seed ${seed}: b = ${b} out of range: "${prompt}"`)
    check(k >= 5 && k <= 20, `seed ${seed}: term number ${k} out of range: "${prompt}"`)
    check(m[5] === suffixFor(k), `seed ${seed}: wrong ordinal suffix "${k}${m[5]}": "${prompt}"`)
    return String(a * k + b)
  }

  if (type === 'sequence_find_nth_term') {
    m = prompt.match(/^Find the nth term of this sequence: (\d+), (\d+), (\d+), (\d+)\. Write it like 10n \+ 11\.$/)
    if (!m) return null
    const t = m.slice(1, 5).map(Number)
    const a = constantDifference(t)
    check(a !== null, `seed ${seed}: shown terms are not arithmetic: "${prompt}"`)
    if (a === null) return null
    const b = t[0] - a
    check(a >= 2 && a <= 9, `seed ${seed}: difference ${a} out of range: "${prompt}"`)
    check(b !== 0 && b >= -9 && b <= 9, `seed ${seed}: b = ${b} out of range: "${prompt}"`)
    check(t.every(v => v >= 1), `seed ${seed}: a shown term is below 1: "${prompt}"`)
    return rule(a, b)
  }

  if (type === 'sequence_term_position') {
    m = prompt.match(/^The nth term of a sequence is (\d+)n ([+-]) (\d+)\. Which term is equal to (\d+)\?$/)
    if (!m) return null
    const a = Number(m[1])
    const b = m[2] === '-' ? -Number(m[3]) : Number(m[3])
    const value = Number(m[4])
    check(a >= 2 && a <= 9, `seed ${seed}: a = ${a} out of range: "${prompt}"`)
    check(b !== 0 && b >= -9 && b <= 9, `seed ${seed}: b = ${b} out of range: "${prompt}"`)
    check(value >= 1, `seed ${seed}: value ${value} below 1: "${prompt}"`)
    check((value - b) % a === 0, `seed ${seed}: no whole term number: "${prompt}"`)
    const n = (value - b) / a
    check(n >= 5 && n <= 25, `seed ${seed}: term number ${n} out of range: "${prompt}"`)
    return String(n)
  }

  return null
}

const TYPES = [
  'sequence_next_term',
  'sequence_missing_term',
  'sequence_nth_term_value',
  'sequence_find_nth_term',
  'sequence_term_position',
]
const NUMERIC_TYPES = TYPES.filter(t => t !== 'sequence_find_nth_term')
const typeCounts = new Map<string, number>()

const INT_SHAPE = /^\d+$/
const RULE_SHAPE = /^\d+n [+-] \d+$/

// The ordinal helper must handle the teen trap even though 5 to 20 only uses "th".
for (const [n, want] of [
  [1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [5, '5th'], [11, '11th'], [12, '12th'],
  [13, '13th'], [20, '20th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [111, '111th'], [112, '112th'],
] as const) {
  check(ordinal(n) === want, `ordinal(${n}) gave "${ordinal(n)}", expected "${want}"`)
}

for (let seed = 1; seed <= 300; seed++) {
  const problems = generateSequenceProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(TYPES.includes(p.type), `seed ${seed}: unknown type ${p.type}`)
    check(/^seq172_\d+$/.test(p.id), `seed ${seed}: bad id "${p.id}"`)
    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)

    // The generator's answer must match an independent reading of its own prompt.
    const derived = answerFromPrompt(p.type, p.prompt, seed)
    check(derived !== null, `seed ${seed}: prompt did not parse for ${p.type}: "${p.prompt}"`)
    if (derived !== null) {
      check(derived === p.answer, `seed ${seed}: prompt gives "${derived}" but answer says "${p.answer}"`)
    }

    // The real grader must accept the canonical answer.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)

    if (NUMERIC_TYPES.includes(p.type)) {
      // Signed-integer path, positive answers only.
      check(INT_SHAPE.test(p.answer), `seed ${seed}: answer "${p.answer}" is not a positive integer`)
      check(Number(p.answer) >= 1, `seed ${seed}: answer "${p.answer}" is below 1`)
      check(
        gradeAnswer(String(Number(p.answer) + 1), p.answer) === false,
        `seed ${seed}: grader accepted answer + 1 for "${p.answer}"`,
      )
      if (p.type === 'sequence_term_position') {
        // parseInt is lenient, so a kid typing "12th" still gets it right.
        check(gradeAnswer(`${p.answer}th`, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}th"`)
      }
    } else {
      // Algebraic path: letter n, and nothing that could send it to the sim-eq
      // or inequality branches.
      check(RULE_SHAPE.test(p.answer), `seed ${seed}: answer "${p.answer}" is not in an + b shape`)
      check(!/[xy=<>]/.test(p.answer), `seed ${seed}: answer "${p.answer}" could leave the algebraic path`)
      check(p.answer !== '10n + 11', `seed ${seed}: answer equals the format hint`)
      check(p.prompt.endsWith(` ${HINT}`), `seed ${seed}: prompt does not end with the format hint: "${p.prompt}"`)
      // The prompt must never hold the answer as a whole token. The digit
      // boundaries stop a shorter number matching inside a longer one.
      const escaped = p.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      check(
        !new RegExp(`(?<!\\d)${escaped}(?!\\d)`).test(p.prompt),
        `seed ${seed}: prompt gives away the answer: "${p.prompt}"`,
      )
      // Near miss: coefficient one too big.
      const nearMiss = p.answer.replace(/^(\d+)n/, (_s, a) => `${Number(a) + 1}n`)
      check(gradeAnswer(nearMiss, p.answer) === false, `seed ${seed}: grader accepted "${nearMiss}" for "${p.answer}"`)
      // Near miss: constant one too big.
      const nearMissB = p.answer.replace(/(\d+)$/, (_s, b) => `${Number(b) + 1}`)
      check(gradeAnswer(nearMissB, p.answer) === false, `seed ${seed}: grader accepted "${nearMissB}" for "${p.answer}"`)
      // Spacing and case must not matter.
      check(
        gradeAnswer(p.answer.replace(/\s+/g, '').toUpperCase(), p.answer) === true,
        `seed ${seed}: grader rejected an unspaced upper-case copy of "${p.answer}"`,
      )
    }
  }
}

// Every declared type must actually be produced, and both directions must show up.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}
check(directions.inc > 0, 'no increasing sequences were generated')
check(directions.dec > 0, 'no decreasing sequences were generated')

// Wiring (fails until the orchestrator wires the shared files).
if (WIRING) {
  const sample = generateSequenceProblems(20, seededRand(1))
  for (const p of sample) {
    const isRule = p.type === 'sequence_find_nth_term'
    check(getAnswerControlType(p.type) === 'default', `type ${p.type}: expected the default control, got ${getAnswerControlType(p.type)}`)
    check(
      inputModeForType(p.type) === (isRule ? 'text' : 'numeric'),
      `type ${p.type}: unexpected input mode ${inputModeForType(p.type)}`,
    )
    const ph = placeholderForType(p.type)
    if (isRule) {
      check(ph === 'e.g. 10n + 11', `type ${p.type}: placeholder "${ph}" is not "e.g. 10n + 11"`)
    } else {
      check(!!ph && ph !== 'Your answer', `type ${p.type}: missing placeholder`)
    }
    const label = problemTypeLabel(p.type)
    check(!!label && label !== p.type, `type ${p.type}: missing parent-facing label`)
  }

  // No placeholder may ever equal a real answer, across every seed.
  for (let seed = 1; seed <= 300; seed++) {
    for (const p of generateSequenceProblems(20, seededRand(seed))) {
      check(placeholderForType(p.type) !== `e.g. ${p.answer}`, `seed ${seed}: placeholder leaks "${p.answer}"`)
    }
  }

  // The router must serve 17/2.
  try {
    const routed = generateProblems(LEVEL, SUB, 20)
    check(routed.length === 20, `router returned ${routed.length} problems for ${LEVEL}/${SUB}`)
    check(
      routed.every(p => TYPES.includes(p.type as string)),
      `router returned problems of an unexpected type for ${LEVEL}/${SUB}`,
    )
  } catch (e) {
    check(false, `router threw for ${LEVEL}/${SUB}: ${String(e)}`)
  }
}

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`directions (types 1 and 2): increasing=${directions.inc}, decreasing=${directions.dec}`)
console.log(`${checks} checks, ${failures} failures${WIRING ? '' : ' (wiring skipped)'}`)
process.exit(failures === 0 ? 0 : 1)
