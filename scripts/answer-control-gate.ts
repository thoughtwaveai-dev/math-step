// No-auth grading-safety gate for the structured answer controls.
// Proves: every canonical string a control can build grades === true against the
// generator's answer format, and obvious wrong inputs reject. Run:
//   npx tsx scripts/answer-control-gate.ts
import { gradeAnswer } from '../src/lib/math/gradeAnswer'

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) { pass++ } else { fail++; console.error('FAIL:', name) }
}

// --- Equation control: y = mx + b -------------------------------------------
// Mirror EquationSlopeInterceptInput.buildCanonical exactly.
function buildEquation(m: number, b: number): string {
  return `y = ${m}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`
}
// Generator (formatEquation) for slope |m|>=2, b!=0 produces the same shape.
const slopes = [-5, -4, -3, -2, 2, 3, 4, 5]
const intercepts = [-9, -7, -5, -3, -1, 1, 3, 5, 9]
for (const m of slopes) {
  for (const b of intercepts) {
    const built = buildEquation(m, b)
    const generatorAnswer = `y = ${m}x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`
    check(`eq display ${m},${b}`, built === generatorAnswer)
    check(`eq grade ${m},${b}`, gradeAnswer(built, generatorAnswer) === true)
  }
}
// Spacing / case insensitivity sanity
check('eq no-space accepted', gradeAnswer('y=2x+3', 'y = 2x + 3') === true)
check('eq uppercase accepted', gradeAnswer('Y = 2X + 3', 'y = 2x + 3') === true)
check('eq wrong slope rejected', gradeAnswer('y = 3x + 3', 'y = 2x + 3') === false)

// --- Coordinate control: x = X, y = Y ---------------------------------------
// Mirror CoordinatePairInput.buildCanonical (allows 0, no "-0").
function buildCoord(x: number, y: number): string {
  const xv = x === 0 ? 0 : x
  const yv = y === 0 ? 0 : y
  return `x = ${xv}, y = ${yv}`
}
for (let x = -6; x <= 6; x++) {
  for (let y = -6; y <= 6; y++) {
    const built = buildCoord(x, y)
    const generatorAnswer = `x = ${x}, y = ${y}`
    check(`coord display ${x},${y}`, built === generatorAnswer)
    check(`coord grade ${x},${y}`, gradeAnswer(built, generatorAnswer) === true)
  }
}
// Axis points must be accepted (the bug we explicitly guarded against)
check('coord x=0 accepted', gradeAnswer('x = 0, y = 3', 'x = 0, y = 3') === true)
check('coord y=0 accepted', gradeAnswer('x = -4, y = 0', 'x = -4, y = 0') === true)
check('coord order-independent', gradeAnswer('y = 3, x = 5', 'x = 5, y = 3') === true)
check('coord wrong rejected', gradeAnswer('x = 5, y = 2', 'x = 5, y = 3') === false)

// --- Yes/No control ---------------------------------------------------------
check('yes accepted', gradeAnswer('yes', 'yes') === true)
check('no accepted', gradeAnswer('no', 'no') === true)
check('YES uppercase accepted', gradeAnswer('YES', 'yes') === true)
check('yes vs no rejected', gradeAnswer('no', 'yes') === false)
check('blank rejected', gradeAnswer('', 'yes') === false)

console.log(`\nanswer-control gate: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
