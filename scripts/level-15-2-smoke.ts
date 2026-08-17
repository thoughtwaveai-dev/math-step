// Level 15.2 smoke test: every generated problem must be solvable, uniquely
// determined, and grade correct through the real gradeAnswer path.
//
// Run: npx tsx scripts/level-15-2-smoke.ts

import { generateBracketEquationProblems } from '../src/lib/math/generators/bracket-equations'
import { seededRand } from '../src/lib/math/generators/rand'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { inputModeForType, placeholderForType, problemTypeLabel } from '../src/lib/math/inputMode'
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

// Independently re-solve the equation from the prompt text, so the test does not
// just trust the generator's own arithmetic.
function solveFromPrompt(prompt: string): number | null {
  const body = prompt.replace(/\.\s*Answer with just the number\.\s*$/, '').trim()

  // a(x + b) + cx = d
  let m = body.match(/^Expand and solve for x: (-?\d+)\(x \+ (\d+)\) \+ (\d+)x = (-?\d+)$/)
  if (m) {
    const [a, b, c, d] = [+m[1], +m[2], +m[3], +m[4]]
    return (d - a * b) / (a + c)
  }
  // a(x + b) = c(x + d)
  m = body.match(/^Solve for x: (-?\d+)\(x \+ (\d+)\) = (-?\d+)\(x \+ (\d+)\)$/)
  if (m) {
    const [a, b, c, d] = [+m[1], +m[2], +m[3], +m[4]]
    return (c * d - a * b) / (a - c)
  }
  // a(x - b) = c
  m = body.match(/^Solve for x: (-?\d+)\(x - (\d+)\) = (-?\d+)$/)
  if (m) {
    const [a, b, c] = [+m[1], +m[2], +m[3]]
    return c / a + b
  }
  // a(x + b) = c   (covers the negative-multiplier type too)
  m = body.match(/^Solve for x: (-?\d+)\(x \+ (\d+)\) = (-?\d+)$/)
  if (m) {
    const [a, b, c] = [+m[1], +m[2], +m[3]]
    return c / a - b
  }
  return null
}

const TYPES = [
  'bracket_equation_simple',
  'bracket_equation_subtraction',
  'bracket_equation_negative',
  'bracket_equation_both_sides',
  'bracket_equation_expand_collect',
]
const typeCounts = new Map<string, number>()

for (let seed = 1; seed <= 300; seed++) {
  const problems = generateBracketEquationProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)

    // Answer must be a bare positive integer (signed-integer grading path).
    check(/^\d+$/.test(p.answer), `seed ${seed}: answer "${p.answer}" is not a plain integer`)
    check(Number(p.answer) > 0, `seed ${seed}: answer "${p.answer}" is not positive`)

    // The generator's answer must match an independent solve of its own prompt.
    const solved = solveFromPrompt(p.prompt)
    check(solved !== null, `seed ${seed}: prompt did not parse: "${p.prompt}"`)
    if (solved !== null) {
      check(
        Number.isInteger(solved),
        `seed ${seed}: prompt has a non-integer solution ${solved}: "${p.prompt}"`,
      )
      check(
        solved === Number(p.answer),
        `seed ${seed}: prompt solves to ${solved} but answer says ${p.answer}: "${p.prompt}"`,
      )
    }

    // The real grader must accept the canonical answer and reject a wrong one.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)
    check(
      gradeAnswer(String(Number(p.answer) + 1), p.answer) === false,
      `seed ${seed}: grader accepted a wrong answer for "${p.answer}"`,
    )
    // "x = 5" style answers are not accepted, which is why every prompt hints.
    check(
      p.prompt.includes('Answer with just the number.'),
      `seed ${seed}: prompt missing the number hint: "${p.prompt}"`,
    )

    // Wiring: numeric keypad, real placeholder, real label.
    check(
      inputModeForType(p.type) === 'numeric',
      `type ${p.type}: expected numeric input mode, got ${inputModeForType(p.type)}`,
    )
    check(placeholderForType(p.type) === 'e.g. 6', `type ${p.type}: unexpected placeholder`)
    const label = problemTypeLabel(p.type)
    check(!!label && label !== p.type, `type ${p.type}: missing parent-facing label`)
  }
}

// Every declared type must actually be produced.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}

// The router must serve 15/2.
const routed = generateProblems(15, 2, 20)
check(routed.length === 20, `router returned ${routed.length} problems for 15/2`)
check(
  routed.every(p => TYPES.includes(p.type as string)),
  'router returned problems of an unexpected type for 15/2',
)

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`${checks} checks, ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
