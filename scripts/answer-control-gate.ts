// No-auth grading-safety gate for the structured answer controls.
// Proves: every canonical string a control can build grades === true against the
// generator's answer format, and obvious wrong inputs reject. Run:
//   npx tsx scripts/answer-control-gate.ts
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { formatQuadratic } from '../src/lib/math/generators/double-brackets'

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

// --- Quadratic control: x2 + bx + c -----------------------------------------
// Mirror QuadraticExpressionInput.buildCanonical exactly. It calls the generator's
// own formatQuadratic, so the control and the generator cannot drift apart; this
// gate proves every string that pairing can produce grades === true.
type Sign = '+' | '-'
function buildQuadratic(bSign: Sign, bMag: string, cSign: Sign, cMag: string): string {
  if (bMag === '' || cMag === '') return ''
  const bAbs = Number(bMag)
  const cAbs = Number(cMag)
  if (!Number.isFinite(bAbs) || !Number.isFinite(cAbs)) return ''
  if (bAbs === 0) return ''
  return formatQuadratic(bSign === '-' ? -bAbs : bAbs, cSign === '-' ? -cAbs : cAbs)
}
// Every constant the 16.1 generator can emit is a product of two numbers in 2..9.
const products = new Set<number>()
for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) products.add(a * b)
const constants = [...products].flatMap(n => [n, -n])
// Middle coefficients span a - b, a + b and 2a, in both signs.
const middles: number[] = []
for (let b = 2; b <= 18; b++) middles.push(b, -b)

for (const b of middles) {
  for (const c of constants) {
    const built = buildQuadratic(b < 0 ? '-' : '+', String(Math.abs(b)), c < 0 ? '-' : '+', String(Math.abs(c)))
    // Independent render of what the generator stores as the correct answer.
    const generatorAnswer = `x\u00B2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`
    check(`quad display ${b},${c}`, built === generatorAnswer)
    check(`quad grade ${b},${c}`, gradeAnswer(built, generatorAnswer) === true)
  }
}
// Blank fields and a zero x term mean "no answer", never a graded string.
check('quad blank b is no answer', buildQuadratic('+', '', '+', '15') === '')
check('quad blank c is no answer', buildQuadratic('+', '8', '+', '') === '')
check('quad zero x term is no answer', buildQuadratic('+', '0', '+', '15') === '')
// Spacing / case insensitivity and near-miss rejection.
check('quad no-space accepted', gradeAnswer('x\u00B2+8x+15', 'x\u00B2 + 8x + 15') === true)
check('quad uppercase accepted', gradeAnswer('X\u00B2 + 8X + 15', 'x\u00B2 + 8x + 15') === true)
check('quad wrong middle rejected', gradeAnswer('x\u00B2 + 7x + 15', 'x\u00B2 + 8x + 15') === false)
check('quad wrong constant rejected', gradeAnswer('x\u00B2 + 8x + 14', 'x\u00B2 + 8x + 15') === false)
check('quad wrong sign rejected', gradeAnswer('x\u00B2 - 8x + 15', 'x\u00B2 + 8x + 15') === false)
check('quad blank rejected', gradeAnswer('', 'x\u00B2 + 8x + 15') === false)

console.log(`\nanswer-control gate: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
