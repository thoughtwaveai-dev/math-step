// Level 16.2 smoke test: every generated problem must factorise correctly, be
// uniquely determined, sit in the exact canonical shape the bracket pair control
// emits, and grade correct through the real gradeAnswer path.
//
// Run: npx tsx scripts/level-16-2-smoke.ts

import {
  formatBracketPair,
  generateFactorisingQuadraticsProblems,
} from '../src/lib/math/generators/factorising-quadratics'
import { seededRand } from '../src/lib/math/generators/rand'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { inputModeForType, placeholderForType, problemTypeLabel } from '../src/lib/math/inputMode'
import { getAnswerControlType } from '../src/lib/math/answerControl'
import { generateProblems } from '../src/lib/math/generators'

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

// Read b and c back out of the prompt text.
function parsePrompt(prompt: string): { b: number; c: number } | null {
  let m = prompt.match(/^Factorise: x² ([+-]) (\d+)x ([+-]) (\d+)\.$/)
  if (m) {
    const b = m[1] === '-' ? -Number(m[2]) : Number(m[2])
    const c = m[3] === '-' ? -Number(m[4]) : Number(m[4])
    return { b, c }
  }
  m = prompt.match(/^Factorise: x² - (\d+)\.$/)
  if (m) return { b: 0, c: -Number(m[1]) }
  return null
}

// Read the two signed bracket numbers back out of the answer.
function parseAnswer(answer: string): [number, number] | null {
  const m = answer.match(/^\(x ([+-]) (\d+)\)\(x ([+-]) (\d+)\)$/)
  if (!m) return null
  return [
    m[1] === '-' ? -Number(m[2]) : Number(m[2]),
    m[3] === '-' ? -Number(m[4]) : Number(m[4]),
  ]
}

// Independent canonical order check: plus brackets first, then smaller number first.
function inCanonicalOrder(p: number, q: number): boolean {
  if (p > 0 && q < 0) return true
  if (p < 0 && q > 0) return false
  return Math.abs(p) <= Math.abs(q)
}

const TYPES = [
  'factorise_quadratic_positive',
  'factorise_quadratic_negative',
  'factorise_quadratic_mixed_positive',
  'factorise_quadratic_mixed_negative',
  'factorise_difference_of_squares',
]
const typeCounts = new Map<string, number>()

for (let seed = 1; seed <= 300; seed++) {
  const problems = generateFactorisingQuadraticsProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)

    const q = parsePrompt(p.prompt)
    const pair = parseAnswer(p.answer)
    check(q !== null, `seed ${seed}: prompt did not parse: "${p.prompt}"`)
    check(pair !== null, `seed ${seed}: answer "${p.answer}" is not in (x + p)(x + q) shape`)
    if (q === null || pair === null) continue
    const [r, s] = pair

    // Expanding the answer must give back the prompt: (x + r)(x + s) = x2 + (r + s)x + rs.
    check(r + s === q.b && r * s === q.c, `seed ${seed}: "${p.answer}" does not expand to "${p.prompt}"`)
    // No degenerate brackets or middle terms.
    check(Math.abs(r) >= 2 && Math.abs(s) >= 2, `seed ${seed}: bracket number below 2 in "${p.answer}"`)
    check(q.b === 0 ? p.type === 'factorise_difference_of_squares' : Math.abs(q.b) >= 2,
      `seed ${seed}: x term ${q.b}x in "${p.prompt}"`)
    // Type matches the sign pattern it claims.
    if (p.type === 'factorise_quadratic_positive') check(q.b > 0 && q.c > 0, `seed ${seed}: positive type has signs ${q.b}, ${q.c}`)
    if (p.type === 'factorise_quadratic_negative') check(q.b < 0 && q.c > 0, `seed ${seed}: negative type has signs ${q.b}, ${q.c}`)
    if (p.type === 'factorise_quadratic_mixed_positive') check(q.b > 0 && q.c < 0, `seed ${seed}: mixed positive type has signs ${q.b}, ${q.c}`)
    if (p.type === 'factorise_quadratic_mixed_negative') check(q.b < 0 && q.c < 0, `seed ${seed}: mixed negative type has signs ${q.b}, ${q.c}`)
    if (p.type === 'factorise_difference_of_squares') check(r === -s, `seed ${seed}: difference of squares answer "${p.answer}"`)

    // Canonical order, and the formatter collapses both orders to it.
    check(inCanonicalOrder(r, s), `seed ${seed}: "${p.answer}" is not in canonical order`)
    check(formatBracketPair(s, r) === p.answer, `seed ${seed}: swapped order does not collapse for "${p.answer}"`)

    // The prompt must never hand the student the answer.
    check(!p.prompt.includes(p.answer), `seed ${seed}: prompt gives away the answer: "${p.prompt}"`)

    // The real grader must accept the canonical answer and reject near misses.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)
    check(
      gradeAnswer(p.answer.replace(/\d+\)$/, (n) => `${Number(n.slice(0, -1)) + 1})`), p.answer) === false,
      `seed ${seed}: grader accepted a wrong second bracket for "${p.answer}"`,
    )
    check(
      gradeAnswer(p.answer.replace(/^\(x ([+-])/, (_s, sg) => `(x ${sg === '+' ? '-' : '+'}`), p.answer) === false,
      `seed ${seed}: grader accepted a flipped sign for "${p.answer}"`,
    )
    check(
      gradeAnswer(p.answer.replace(/\s+/g, '').toUpperCase(), p.answer) === true,
      `seed ${seed}: grader rejected an unspaced upper-case copy of "${p.answer}"`,
    )

    // Wiring: structured control, text fallback keypad, real placeholder, real label.
    check(
      getAnswerControlType(p.type) === 'bracket_pair',
      `type ${p.type}: expected the bracket pair control, got ${getAnswerControlType(p.type)}`,
    )
    check(inputModeForType(p.type) === 'text', `type ${p.type}: expected text input mode, got ${inputModeForType(p.type)}`)
    check(placeholderForType(p.type) === 'e.g. (x + 1)(x + 12)', `type ${p.type}: unexpected placeholder`)
    check(placeholderForType(p.type) !== `e.g. ${p.answer}`, `seed ${seed}: placeholder leaks "${p.answer}"`)
    const label = problemTypeLabel(p.type)
    check(!!label && label !== p.type, `type ${p.type}: missing parent-facing label`)
  }
}

// Every declared type must actually be produced.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}

// The router must serve 16/2.
const routed = generateProblems(16, 2, 20)
check(routed.length === 20, `router returned ${routed.length} problems for 16/2`)
check(routed.every(p => TYPES.includes(p.type as string)), 'router returned problems of an unexpected type for 16/2')

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`${checks} checks, ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
