// No-auth grading-safety gate for the structured answer controls.
// Proves: every canonical string a control can build grades === true against the
// generator's answer format, and obvious wrong inputs reject. Run:
//   npx tsx scripts/answer-control-gate.ts
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { formatQuadratic } from '../src/lib/math/generators/double-brackets'
import { formatBracketPair } from '../src/lib/math/generators/factorising-quadratics'
import { formatRoots } from '../src/lib/math/generators/solving-quadratics'

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

// --- Bracket pair control: (x + p)(x + q) ----------------------------------
// Mirror BracketPairInput.buildCanonical exactly. It calls the generator's own
// formatBracketPair, which sorts the brackets, so the student can fill them in
// either order. The grader matches strictly, so this gate proves both orders
// build the same string and that string grades === true.
function buildBracketPair(pSign: Sign, pMag: string, qSign: Sign, qMag: string): string {
  if (pMag === '' || qMag === '') return ''
  const pAbs = Number(pMag)
  const qAbs = Number(qMag)
  if (!Number.isFinite(pAbs) || !Number.isFinite(qAbs)) return ''
  if (pAbs === 0 || qAbs === 0) return ''
  return formatBracketPair(pSign === '-' ? -pAbs : pAbs, qSign === '-' ? -qAbs : qAbs)
}
const bracketNums: number[] = []
for (let n = 2; n <= 10; n++) bracketNums.push(n, -n)
const bracketOf = (n: number) => `(x ${n < 0 ? '-' : '+'} ${Math.abs(n)})`
for (const p of bracketNums) {
  for (const q of bracketNums) {
    const pq = buildBracketPair(p < 0 ? '-' : '+', String(Math.abs(p)), q < 0 ? '-' : '+', String(Math.abs(q)))
    const qp = buildBracketPair(q < 0 ? '-' : '+', String(Math.abs(q)), p < 0 ? '-' : '+', String(Math.abs(p)))
    // Independent render of the canonical order: plus first, then smaller number first.
    const ordered = (p > 0) !== (q > 0)
      ? (p > 0 ? [p, q] : [q, p])
      : (Math.abs(p) <= Math.abs(q) ? [p, q] : [q, p])
    const generatorAnswer = `${bracketOf(ordered[0])}${bracketOf(ordered[1])}`
    check(`pair order ${p},${q}`, pq === qp)
    check(`pair display ${p},${q}`, pq === generatorAnswer)
    check(`pair grade ${p},${q}`, gradeAnswer(pq, generatorAnswer) === true)
  }
}
check('pair blank p is no answer', buildBracketPair('+', '', '+', '5') === '')
check('pair blank q is no answer', buildBracketPair('+', '3', '+', '') === '')
check('pair zero is no answer', buildBracketPair('+', '0', '+', '5') === '')
check('pair no-space accepted', gradeAnswer('(x+3)(x+5)', '(x + 3)(x + 5)') === true)
check('pair uppercase accepted', gradeAnswer('(X + 3)(X + 5)', '(x + 3)(x + 5)') === true)
check('pair raw swapped order rejected by grader', gradeAnswer('(x + 5)(x + 3)', '(x + 3)(x + 5)') === false)
check('pair wrong number rejected', gradeAnswer('(x + 3)(x + 6)', '(x + 3)(x + 5)') === false)
check('pair wrong sign rejected', gradeAnswer('(x + 3)(x - 5)', '(x + 3)(x + 5)') === false)
check('pair blank rejected', gradeAnswer('', '(x + 3)(x + 5)') === false)

// --- Quadratic roots control: x = a or x = b --------------------------------
// Mirror QuadraticRootsInput.buildCanonical exactly. It calls the 17.1
// generator's own formatRoots, which puts the smaller root first, so both entry
// orders build the same string and that string grades === true.
function buildRoots(aSign: Sign, aMag: string, bSign: Sign, bMag: string): string {
  if (aMag === '' || bMag === '') return ''
  const aAbs = Number(aMag)
  const bAbs = Number(bMag)
  if (!Number.isFinite(aAbs) || !Number.isFinite(bAbs)) return ''
  const a = aAbs === 0 ? 0 : aSign === '-' ? -aAbs : aAbs
  const b = bAbs === 0 ? 0 : bSign === '-' ? -bAbs : bAbs
  return formatRoots(a, b)
}
for (const a of bracketNums) {
  for (const b of bracketNums) {
    if (a === b) continue
    const ab = buildRoots(a < 0 ? '-' : '+', String(Math.abs(a)), b < 0 ? '-' : '+', String(Math.abs(b)))
    const ba = buildRoots(b < 0 ? '-' : '+', String(Math.abs(b)), a < 0 ? '-' : '+', String(Math.abs(a)))
    // Independent render of what the generator stores: smaller root first.
    const generatorAnswer = `x = ${Math.min(a, b)} or x = ${Math.max(a, b)}`
    check(`roots order ${a},${b}`, ab === ba)
    check(`roots display ${a},${b}`, ab === generatorAnswer)
    check(`roots grade ${a},${b}`, gradeAnswer(ab, generatorAnswer) === true)
  }
}
check('roots blank a is no answer', buildRoots('+', '', '+', '5') === '')
check('roots blank b is no answer', buildRoots('+', '3', '+', '') === '')
check('roots never emit -0', buildRoots('-', '0', '+', '5') === 'x = 0 or x = 5')
check('roots no-space accepted', gradeAnswer('x=-5orx=3', 'x = -5 or x = 3') === true)
check('roots uppercase accepted', gradeAnswer('X = -5 OR X = 3', 'x = -5 or x = 3') === true)
check('roots raw swapped order rejected by grader', gradeAnswer('x = 3 or x = -5', 'x = -5 or x = 3') === false)
check('roots wrong sign rejected', gradeAnswer('x = 5 or x = 3', 'x = -5 or x = 3') === false)
check('roots blank rejected', gradeAnswer('', 'x = -5 or x = 3') === false)

console.log(`\nanswer-control gate: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
