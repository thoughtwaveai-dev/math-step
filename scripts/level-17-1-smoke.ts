// Level 17.1 smoke test: every generated problem must have exactly the two
// integer roots its answer claims, in the exact canonical "x = lo or x = hi"
// shape the answer control emits, and grade correct through the real
// gradeAnswer path.
//
// Run: npx tsx scripts/level-17-1-smoke.ts
// Skip the shared-wiring checks (before the orchestrator wires 17/1):
//      npx tsx scripts/level-17-1-smoke.ts --no-wiring

import {
  formatRoots,
  generateSolvingQuadraticsProblems,
} from '../src/lib/math/generators/solving-quadratics'
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

// Rendered by hand so the test does not trust the generator's formatRoots.
function renderRoots(lo: number, hi: number): string {
  return `x = ${lo} or x = ${hi}`
}

// Brute force the integer roots of x2 + bx + c in -12..12.
function integerRoots(b: number, c: number): number[] {
  const roots: number[] = []
  for (let r = -12; r <= 12; r++) {
    if (r * r + b * r + c === 0) roots.push(r)
  }
  return roots
}

type Parsed = { type: string; b: number; c: number; roots: number[] }

// Independently read the equation back out of the prompt text and solve it.
function solveFromPrompt(prompt: string): Parsed | null {
  // (x + p)(x + q) = 0, any sign combination
  let m = prompt.match(/^Solve: \(x ([+-]) (\d+)\)\(x ([+-]) (\d+)\) = 0\.$/)
  if (m) {
    const p = m[1] === '-' ? -Number(m[2]) : Number(m[2])
    const q = m[3] === '-' ? -Number(m[4]) : Number(m[4])
    const b = p + q
    const c = p * q
    return { type: 'solve_quadratic_factorised', b, c, roots: integerRoots(b, c) }
  }
  // x2 + bx + c = 0, any sign combination
  m = prompt.match(/^Solve: x² ([+-]) (\d+)x ([+-]) (\d+) = 0\.$/)
  if (m) {
    const b = m[1] === '-' ? -Number(m[2]) : Number(m[2])
    const c = m[3] === '-' ? -Number(m[4]) : Number(m[4])
    let type = 'solve_quadratic_mixed_roots'
    if (c > 0) type = b < 0 ? 'solve_quadratic_positive_roots' : 'solve_quadratic_negative_roots'
    return { type, b, c, roots: integerRoots(b, c) }
  }
  // x2 - c = 0
  m = prompt.match(/^Solve: x² - (\d+) = 0\.$/)
  if (m) {
    const c = -Number(m[1])
    return { type: 'solve_quadratic_difference_of_squares', b: 0, c, roots: integerRoots(0, c) }
  }
  return null
}

const TYPES = [
  'solve_quadratic_factorised',
  'solve_quadratic_positive_roots',
  'solve_quadratic_negative_roots',
  'solve_quadratic_mixed_roots',
  'solve_quadratic_difference_of_squares',
]
const typeCounts = new Map<string, number>()

const SHAPE = /^x = (-?\d+) or x = (-?\d+)$/
const PLACEHOLDER = 'e.g. x = -1 or x = 12'

// formatRoots must not care which order the roots come in, because the control
// passes the student's two numbers straight through.
for (let a = -10; a <= 10; a++) {
  for (let b = -10; b <= 10; b++) {
    if (a === 0 || b === 0 || a === b) continue
    check(formatRoots(a, b) === formatRoots(b, a), `formatRoots(${a}, ${b}) depends on order`)
    check(
      formatRoots(a, b) === renderRoots(Math.min(a, b), Math.max(a, b)),
      `formatRoots(${a}, ${b}) gave "${formatRoots(a, b)}"`,
    )
  }
}

for (let seed = 1; seed <= 300; seed++) {
  const problems = generateSolvingQuadraticsProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(TYPES.includes(p.type), `seed ${seed}: unexpected type ${p.type}`)
    check(/^sq171_\d+$/.test(p.id), `seed ${seed}: bad id ${p.id}`)
    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)

    // Exact canonical shape, smaller root first, both distinct and nonzero.
    const shape = p.answer.match(SHAPE)
    check(shape !== null, `seed ${seed}: answer "${p.answer}" is not in "x = a or x = b" shape`)
    if (shape === null) continue
    const lo = Number(shape[1])
    const hi = Number(shape[2])
    check(lo < hi, `seed ${seed}: answer "${p.answer}" is not smaller root first`)
    check(lo !== 0 && hi !== 0, `seed ${seed}: answer "${p.answer}" has a zero root`)
    check(
      Math.abs(lo) >= 2 && Math.abs(lo) <= 10 && Math.abs(hi) >= 2 && Math.abs(hi) <= 10,
      `seed ${seed}: answer "${p.answer}" has a root outside magnitude 2 to 10`,
    )

    // Degenerate terms the prompt must never show.
    check(!/ [01]x/.test(p.prompt), `seed ${seed}: prompt "${p.prompt}" has a 0x or 1x term`)
    check(!/[+-] 0\)| [+-] 0 =/.test(p.prompt), `seed ${seed}: prompt "${p.prompt}" has a zero term`)

    // The generator's answer must match an independent solve of its own prompt.
    const solved = solveFromPrompt(p.prompt)
    check(solved !== null, `seed ${seed}: prompt did not parse: "${p.prompt}"`)
    if (solved !== null) {
      check(solved.type === p.type, `seed ${seed}: prompt "${p.prompt}" looks like ${solved.type}, tagged ${p.type}`)
      check(
        solved.roots.length === 2,
        `seed ${seed}: "${p.prompt}" has ${solved.roots.length} integer roots in -12..12`,
      )
      if (solved.roots.length === 2) {
        const expected = renderRoots(solved.roots[0], solved.roots[1])
        check(expected === p.answer, `seed ${seed}: prompt solves to "${expected}" but answer says "${p.answer}"`)
      }
      // Both claimed roots satisfy the equation read from the prompt.
      for (const r of [lo, hi]) {
        check(r * r + solved.b * r + solved.c === 0, `seed ${seed}: x = ${r} does not satisfy "${p.prompt}"`)
      }
    }

    // Type-specific sign and range rules.
    if (p.type === 'solve_quadratic_factorised') {
      check(Math.abs(lo) <= 9 && Math.abs(hi) <= 9, `seed ${seed}: factorised roots out of 2 to 9: "${p.answer}"`)
    } else if (p.type === 'solve_quadratic_positive_roots') {
      check(lo > 0 && hi <= 9, `seed ${seed}: positive-roots answer "${p.answer}"`)
    } else if (p.type === 'solve_quadratic_negative_roots') {
      check(hi < 0 && lo >= -9, `seed ${seed}: negative-roots answer "${p.answer}"`)
    } else if (p.type === 'solve_quadratic_mixed_roots') {
      check(lo < 0 && hi > 0 && lo >= -9 && hi <= 9, `seed ${seed}: mixed-roots answer "${p.answer}"`)
      check(Math.abs(lo + hi) >= 2, `seed ${seed}: mixed-roots x term under 2 for "${p.answer}"`)
    } else if (p.type === 'solve_quadratic_difference_of_squares') {
      check(lo === -hi, `seed ${seed}: difference of squares roots not opposite: "${p.answer}"`)
    }

    // The prompt must never hand the student the answer.
    check(!p.prompt.includes(p.answer), `seed ${seed}: prompt gives away the answer: "${p.prompt}"`)

    // Intended grading path: letters, no "y=", no "<" or ">", so the algebraic
    // strict-match branch is the one that runs.
    check(
      /[a-zA-Z]/.test(p.answer) && !/y\s*=/.test(p.answer) && !/[<>]/.test(p.answer),
      `seed ${seed}: answer "${p.answer}" would not take the algebraic path`,
    )
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)
    // Spacing and case must not matter.
    check(
      gradeAnswer(p.answer.replace(/\s+/g, '').toUpperCase(), p.answer) === true,
      `seed ${seed}: grader rejected an unspaced upper-case copy of "${p.answer}"`,
    )
    // Near misses must fail.
    check(
      gradeAnswer(renderRoots(lo, hi + 1), p.answer) === false,
      `seed ${seed}: grader accepted a wrong larger root for "${p.answer}"`,
    )
    check(
      gradeAnswer(renderRoots(lo - 1, hi), p.answer) === false,
      `seed ${seed}: grader accepted a wrong smaller root for "${p.answer}"`,
    )
    // Swapped order grades FALSE. This is why the control sorts through formatRoots.
    check(
      gradeAnswer(`x = ${hi} or x = ${lo}`, p.answer) === false,
      `seed ${seed}: grader accepted swapped roots for "${p.answer}" (control no longer needs to sort?)`,
    )

    if (WIRING) {
      // Wiring: roots control, text fallback keypad, safe placeholder, real label.
      check(
        getAnswerControlType(p.type) === 'quadratic_roots',
        `type ${p.type}: expected the quadratic_roots control, got ${getAnswerControlType(p.type)}`,
      )
      check(
        inputModeForType(p.type) === 'text',
        `type ${p.type}: expected text input mode, got ${inputModeForType(p.type)}`,
      )
      check(placeholderForType(p.type) === PLACEHOLDER, `type ${p.type}: unexpected placeholder`)
      const label = problemTypeLabel(p.type)
      check(!!label && label !== p.type, `type ${p.type}: missing parent-facing label`)
    }
    // The placeholder example must never be a real answer.
    check(PLACEHOLDER.replace(/^e\.g\. /, '') !== p.answer, `seed ${seed}: placeholder equals a real answer`)
  }
}

// Every declared type must actually be produced.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}

// The router must serve 17/1.
if (WIRING) {
  const routed = generateProblems(17, 1, 20)
  check(routed.length === 20, `router returned ${routed.length} problems for 17/1`)
  check(
    routed.every(p => TYPES.includes(p.type as string)),
    'router returned problems of an unexpected type for 17/1',
  )
}

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`${checks} checks, ${failures} failures${WIRING ? '' : ' (wiring skipped)'}`)
process.exit(failures === 0 ? 0 : 1)
