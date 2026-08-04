// Smoke test for the Level 14.2 (exponents) and 15.1 (expanding brackets)
// generators. Run: npx tsx scripts/level-14-2-15-1-smoke.ts
//
// Every check re-derives the expected answer from the rendered prompt rather
// than trusting the generator's own arithmetic.
import { generateExponentProblems } from '../src/lib/math/generators/exponents'
import { generateExpandingBracketsProblems } from '../src/lib/math/generators/expanding-brackets'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { seededRand } from '../src/lib/math/generators/rand'

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) pass++
  else { fail++; console.error('FAIL:', name) }
}

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
function unsup(s: string): string {
  return s.split('').map(c => {
    const i = SUPS.indexOf(c)
    return i === -1 ? c : String(i)
  }).join('')
}

const SEEDS = [1, 7, 42, 99, 12345, 2026]

// ---------- Level 14.2 — Exponents ------------------------------------------

const EXP_TYPES = [
  'exponent_evaluate',
  'exponent_multiply_same_base',
  'exponent_divide_same_base',
  'exponent_power_of_power',
  'exponent_zero_and_one',
]

for (const seed of SEEDS) {
  const probs = generateExponentProblems(20, seededRand(seed))
  check(`14.2 seed ${seed}: 20 problems`, probs.length === 20)

  const counts: Record<string, number> = {}
  for (const p of probs) counts[p.type] = (counts[p.type] ?? 0) + 1
  for (const t of EXP_TYPES) check(`14.2 seed ${seed}: ${t} == 4`, counts[t] === 4)

  check(`14.2 seed ${seed}: no dup prompts`, new Set(probs.map(p => p.prompt)).size === 20)

  for (const p of probs) {
    check(`14.2 ${p.id}: integer answer`, /^\d+$/.test(p.answer))
    check(`14.2 ${p.id}: correct grades true`, gradeAnswer(p.answer, p.answer) === true)
    const wrong = String(Number(p.answer) + 1)
    check(`14.2 ${p.id}: off-by-one rejects`, gradeAnswer(wrong, p.answer) === false)
    check(`14.2 ${p.id}: blank rejects`, gradeAnswer('', p.answer) === false)

    const flat = unsup(p.prompt)

    if (p.type === 'exponent_evaluate' || p.type === 'exponent_zero_and_one') {
      const m = flat.match(/Work out (\d+)(\d)\.$/)
      check(`14.2 ${p.id}: evaluate prompt parses`, !!m)
      if (!m) continue
      // The trailing digit is the index; everything before it is the base.
      const base = parseInt(m[1], 10)
      const exp = parseInt(m[2], 10)
      check(`14.2 ${p.id}: ${base}^${exp} = ${p.answer}`, Math.pow(base, exp) === Number(p.answer))
      if (p.type === 'exponent_evaluate') {
        check(`14.2 ${p.id}: exponent >= 2`, exp >= 2)
        check(`14.2 ${p.id}: result <= 1000`, Number(p.answer) <= 1000)
      } else {
        check(`14.2 ${p.id}: index is 0 or 1`, exp === 0 || exp === 1)
      }
    }

    if (p.type === 'exponent_multiply_same_base') {
      const m = flat.match(/Simplify: ([a-z])(\d) × ([a-z])(\d)\./)
      check(`14.2 ${p.id}: multiply prompt parses`, !!m)
      if (!m) continue
      check(`14.2 ${p.id}: same base`, m[1] === m[3])
      check(`14.2 ${p.id}: indices add`, Number(m[2]) + Number(m[4]) === Number(p.answer))
    }

    if (p.type === 'exponent_divide_same_base') {
      const m = flat.match(/Simplify: ([a-z])(\d) ÷ ([a-z])(\d)\./)
      check(`14.2 ${p.id}: divide prompt parses`, !!m)
      if (!m) continue
      check(`14.2 ${p.id}: same base`, m[1] === m[3])
      check(`14.2 ${p.id}: indices subtract`, Number(m[2]) - Number(m[4]) === Number(p.answer))
      check(`14.2 ${p.id}: positive power`, Number(p.answer) >= 1)
    }

    if (p.type === 'exponent_power_of_power') {
      const m = flat.match(/Simplify: \(([a-z])(\d)\)(\d)\./)
      check(`14.2 ${p.id}: power-of-power prompt parses`, !!m)
      if (!m) continue
      check(`14.2 ${p.id}: indices multiply`, Number(m[2]) * Number(m[3]) === Number(p.answer))
    }
  }
}

// ---------- Level 15.1 — Expanding brackets ---------------------------------

const EXB_TYPES = [
  'expand_single_bracket',
  'expand_bracket_subtraction',
  'expand_negative_multiplier',
  'expand_and_simplify',
  'factorise_single_bracket',
]

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

for (const seed of SEEDS) {
  const probs = generateExpandingBracketsProblems(20, seededRand(seed))
  check(`15.1 seed ${seed}: 20 problems`, probs.length === 20)

  const counts: Record<string, number> = {}
  for (const p of probs) counts[p.type] = (counts[p.type] ?? 0) + 1
  for (const t of EXB_TYPES) check(`15.1 seed ${seed}: ${t} == 4`, counts[t] === 4)

  check(`15.1 seed ${seed}: no dup prompts`, new Set(probs.map(p => p.prompt)).size === 20)

  for (const p of probs) {
    check(`15.1 ${p.id}: correct grades true`, gradeAnswer(p.answer, p.answer) === true)
    check(`15.1 ${p.id}: no-space grades true`,
      gradeAnswer(p.answer.replace(/\s+/g, ''), p.answer) === true)
    check(`15.1 ${p.id}: uppercase grades true`,
      gradeAnswer(p.answer.toUpperCase(), p.answer) === true)
    check(`15.1 ${p.id}: blank rejects`, gradeAnswer('', p.answer) === false)
    check(`15.1 ${p.id}: hint does not leak answer`, !p.prompt.includes(p.answer))
    check(`15.1 ${p.id}: no 1x term`, !/(^|[^\d])1x/.test(p.answer))
    check(`15.1 ${p.id}: no zero term`, !/[+-] 0$/.test(p.answer))

    if (p.type === 'expand_single_bracket' || p.type === 'expand_bracket_subtraction') {
      const m = p.prompt.match(/Expand: (\d+)\(x ([+-]) (\d+)\)\./)
      check(`15.1 ${p.id}: expand prompt parses`, !!m)
      if (!m) continue
      const a = Number(m[1])
      const b = Number(m[3])
      const expected = `${a}x ${m[2]} ${a * b}`
      check(`15.1 ${p.id}: expands to ${expected}`, p.answer === expected)
      // Classic error — multiplying only the first term — must be rejected.
      check(`15.1 ${p.id}: unmultiplied constant rejects`,
        gradeAnswer(`${a}x ${m[2]} ${b}`, p.answer) === false)
    }

    if (p.type === 'expand_negative_multiplier') {
      const m = p.prompt.match(/Expand: -(\d+)\(x ([+-]) (\d+)\)\./)
      check(`15.1 ${p.id}: negative prompt parses`, !!m)
      if (!m) continue
      const a = Number(m[1])
      const b = Number(m[3])
      const constant = m[2] === '+' ? -(a * b) : a * b
      const expected = `-${a}x ${constant < 0 ? '-' : '+'} ${Math.abs(constant)}`
      check(`15.1 ${p.id}: expands to ${expected}`, p.answer === expected)
      // Forgetting to distribute the negative must be rejected.
      check(`15.1 ${p.id}: undistributed sign rejects`,
        gradeAnswer(`-${a}x ${m[2]} ${a * b}`, p.answer) === false)
    }

    if (p.type === 'expand_and_simplify') {
      const m = p.prompt.match(/Expand and simplify: (\d+)\(x ([+-]) (\d+)\) \+ (\d+)x\./)
      check(`15.1 ${p.id}: simplify prompt parses`, !!m)
      if (!m) continue
      const a = Number(m[1])
      const b = Number(m[3])
      const c = Number(m[4])
      const expected = `${a + c}x ${m[2]} ${a * b}`
      check(`15.1 ${p.id}: simplifies to ${expected}`, p.answer === expected)
    }

    if (p.type === 'factorise_single_bracket') {
      const pm = p.prompt.match(/factor: (\d+)x \+ (\d+)\./)
      const am = p.answer.match(/^(\d+)\((\d*)x \+ (\d+)\)$/)
      check(`15.1 ${p.id}: factorise prompt parses`, !!pm)
      check(`15.1 ${p.id}: factorise answer shape`, !!am)
      if (!pm || !am) continue
      const coeff = Number(pm[1])
      const constant = Number(pm[2])
      const g = Number(am[1])
      const inner = am[2] === '' ? 1 : Number(am[2])
      const q = Number(am[3])
      check(`15.1 ${p.id}: factors multiply back`, g * inner === coeff && g * q === constant)
      // g must be the HIGHEST common factor, otherwise the answer is not unique.
      check(`15.1 ${p.id}: g is the HCF`, gcd(coeff, constant) === g)
    }
  }
}

// Cross-level sanity: neither generator's answers can collide with another
// gradeAnswer path (no inequality signs, no "x =" pairs, no fractions).
for (const p of [
  ...generateExponentProblems(20, seededRand(5)),
  ...generateExpandingBracketsProblems(20, seededRand(5)),
]) {
  check(`${p.id}: no inequality op in answer`, !/[<>]/.test(p.answer))
  check(`${p.id}: no x= pair in answer`, !(/x\s*=/.test(p.answer) && /y\s*=/.test(p.answer)))
  check(`${p.id}: no fraction slash`, !p.answer.includes('/'))
}

console.log(`\n14.2 + 15.1 smoke: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
