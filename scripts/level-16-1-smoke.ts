// Level 16.1 smoke test: every generated problem must be correctly expanded,
// uniquely determined, in the exact canonical shape the answer control emits,
// and grade correct through the real gradeAnswer path.
//
// Run: npx tsx scripts/level-16-1-smoke.ts

import { generateDoubleBracketsProblems } from '../src/lib/math/generators/double-brackets'
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

// Independently expand the brackets read out of the prompt text, and format the
// result by hand, so the test trusts neither the generator's arithmetic nor its
// formatQuadratic helper.
function expandFromPrompt(prompt: string): string | null {
  const body = prompt.replace(/\.$/, '').trim()

  // (x + a)(x + b), any sign combination
  let m = body.match(/^Expand and simplify: \(x ([+-]) (\d+)\)\(x ([+-]) (\d+)\)$/)
  if (m) {
    const p = m[1] === '-' ? -Number(m[2]) : Number(m[2])
    const q = m[3] === '-' ? -Number(m[4]) : Number(m[4])
    return render(p + q, p * q)
  }
  // (x + a) squared
  m = body.match(/^Expand and simplify: \(x ([+-]) (\d+)\)\u00B2$/)
  if (m) {
    const p = m[1] === '-' ? -Number(m[2]) : Number(m[2])
    return render(2 * p, p * p)
  }
  return null
}

function render(b: number, c: number): string {
  return `x\u00B2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`
}

const TYPES = [
  'expand_double_positive',
  'expand_double_mixed',
  'expand_double_negative',
  'expand_double_square_positive',
  'expand_double_square_negative',
]
const typeCounts = new Map<string, number>()

const SHAPE = /^x\u00B2 [+-] \d+x [+-] \d+$/

for (let seed = 1; seed <= 300; seed++) {
  const problems = generateDoubleBracketsProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)

    // Exact canonical shape, which is what the quadratic control can build.
    check(SHAPE.test(p.answer), `seed ${seed}: answer "${p.answer}" is not in x2 + bx + c shape`)
    // Degenerate terms a student would never write, and the control cannot emit.
    check(!/ 1x/.test(p.answer), `seed ${seed}: answer "${p.answer}" contains a 1x term`)
    check(!/ 0x/.test(p.answer), `seed ${seed}: answer "${p.answer}" contains a 0x term`)
    check(!/ 0$/.test(p.answer), `seed ${seed}: answer "${p.answer}" ends in a zero constant`)

    // The generator's answer must match an independent expansion of its own prompt.
    const expanded = expandFromPrompt(p.prompt)
    check(expanded !== null, `seed ${seed}: prompt did not parse: "${p.prompt}"`)
    if (expanded !== null) {
      check(
        expanded === p.answer,
        `seed ${seed}: prompt expands to "${expanded}" but answer says "${p.answer}"`,
      )
    }

    // The prompt must never hand the student the answer.
    check(
      !p.prompt.includes(p.answer),
      `seed ${seed}: prompt gives away the answer: "${p.prompt}"`,
    )

    // The real grader must accept the canonical answer and reject near misses.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)
    check(
      gradeAnswer(p.answer.replace(/([+-]) (\d+)x/, (_s, sg, n) => `${sg} ${Number(n) + 1}x`), p.answer) === false,
      `seed ${seed}: grader accepted a wrong x term for "${p.answer}"`,
    )
    check(
      gradeAnswer(p.answer.replace(/([+-]) (\d+)$/, (_s, sg, n) => `${sg} ${Number(n) + 1}`), p.answer) === false,
      `seed ${seed}: grader accepted a wrong constant for "${p.answer}"`,
    )
    // Spacing and case must not matter (the control emits spaced, students may not).
    check(
      gradeAnswer(p.answer.replace(/\s+/g, '').toUpperCase(), p.answer) === true,
      `seed ${seed}: grader rejected an unspaced upper-case copy of "${p.answer}"`,
    )

    // Wiring: structured control, text fallback keypad, real placeholder, real label.
    check(
      getAnswerControlType(p.type) === 'quadratic_expression',
      `type ${p.type}: expected the quadratic control, got ${getAnswerControlType(p.type)}`,
    )
    check(
      inputModeForType(p.type) === 'text',
      `type ${p.type}: expected text input mode, got ${inputModeForType(p.type)}`,
    )
    check(
      placeholderForType(p.type) === 'e.g. x\u00B2 + 8x + 15',
      `type ${p.type}: unexpected placeholder`,
    )
    const label = problemTypeLabel(p.type)
    check(!!label && label !== p.type, `type ${p.type}: missing parent-facing label`)
  }
}

// Every declared type must actually be produced.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}

// The router must serve 16/1.
const routed = generateProblems(16, 1, 20)
check(routed.length === 20, `router returned ${routed.length} problems for 16/1`)
check(
  routed.every(p => TYPES.includes(p.type as string)),
  'router returned problems of an unexpected type for 16/1',
)

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`${checks} checks, ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
