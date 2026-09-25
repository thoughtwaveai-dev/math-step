// Level 18.2 smoke test: every generated problem must have ONE positive integer
// answer (never a ratio string, which the grader's digit-set fallback would
// accept in either order), that answer must match an independent recompute from
// the numbers in the prompt, and it must grade correct through the real
// gradeAnswer path while a near miss grades wrong.
//
// Run: npx tsx scripts/level-18-2-smoke.ts
//      npx tsx scripts/level-18-2-smoke.ts --no-wiring   (generator checks only)

import { generateRatioProblems, type RatioProblemType } from '../src/lib/math/generators/ratio'
import { seededRand } from '../src/lib/math/generators/rand'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { inputModeForType, placeholderForType, problemTypeLabel } from '../src/lib/math/inputMode'
import { getAnswerControlType } from '../src/lib/math/answerControl'

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

const NUMBER_HINT = 'Answer with just the number.'
const PLACEHOLDER = 'e.g. 37'
const BANNED_NAMES = ['Joaquin', 'Jude', 'Roman', 'Jacob', 'Vilma', 'Aryan', 'Leica', 'Enzo']

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// A ratio shown to the student must be in simplest form with two different
// terms from 1 to 9.
function checkRatio(a: number, b: number, where: string) {
  check(
    a >= 1 && a <= 9 && b >= 1 && b <= 9 && a !== b && gcd(a, b) === 1,
    `${where}: ratio ${a}:${b} is not a simplest-form pair of different terms 1 to 9`,
  )
}

// Recompute the answer from the prompt text alone, trusting none of the
// generator's arithmetic. Returns null when the prompt does not parse or does
// not give a whole-number answer.
function recompute(type: string, prompt: string, where: string): number | null {
  if (type === 'ratio_share_larger' || type === 'ratio_share_smaller') {
    const m = prompt.match(/^Share (\d+) in the ratio (\d+):(\d+)\. How much is the (larger|smaller) share\?$/)
    if (!m) return null
    const total = Number(m[1])
    const a = Number(m[2])
    const b = Number(m[3])
    checkRatio(a, b, where)
    if ((m[4] === 'larger') !== (type === 'ratio_share_larger')) return null
    if (total % (a + b) !== 0) return null
    const part = total / (a + b)
    return (m[4] === 'larger' ? Math.max(a, b) : Math.min(a, b)) * part
  }

  if (type === 'ratio_missing_value') {
    const m = prompt.match(
      /^The ratios (\d+|\?):(\d+|\?) and (\d+|\?):(\d+|\?) are equivalent\. What is the missing number\?$/,
    )
    if (!m) return null
    const raw = m.slice(1, 5)
    if (raw.filter(v => v === '?').length !== 1) return null
    const [p, q, r, s] = raw.map(v => (v === '?' ? NaN : Number(v)))
    // p:q = r:s exactly when p * s = q * r.
    let x: number
    if (raw[0] === '?') x = (q * r) / s
    else if (raw[1] === '?') x = (p * s) / r
    else if (raw[2] === '?') x = (p * s) / q
    else x = (q * r) / p
    if (!Number.isInteger(x)) return null
    const full = raw.map(v => (v === '?' ? x : Number(v)))
    // The first pair is the simplest-form ratio, the second is it scaled by 2 to 9.
    checkRatio(full[0], full[1], where)
    const k = full[2] / full[0]
    check(
      Number.isInteger(k) && k >= 2 && k <= 9 && full[3] === k * full[1],
      `${where}: second pair is not the first scaled by a whole number 2 to 9`,
    )
    return x
  }

  if (type === 'ratio_find_total') {
    const m = prompt.match(
      /^(\w+) and (\w+) share some (sweets|stickers|money) in the ratio (\d+):(\d+)\. (\w+) gets (\$?)(\d+)( sweets| stickers)?\. How (many sweets|many stickers|much money) (are|is) there altogether\?( Answer with just the number\.)?$/,
    )
    if (!m) return null
    const [, first, second, thing, aText, bText, who, dollar, knownText, unitWord, ask, verb, hint] = m
    const a = Number(aText)
    const b = Number(bText)
    checkRatio(a, b, where)
    check(first !== second, `${where}: the two people have the same name`)
    const isMoney = thing === 'money'
    check(
      isMoney
        ? dollar === '$' && unitWord === undefined && ask === 'much money' && verb === 'is' && hint !== undefined
        : dollar === '' && unitWord === ` ${thing}` && ask === `many ${thing}` && verb === 'are' && hint === undefined,
      `${where}: wording does not match the ${thing} context`,
    )
    const part = who === first ? a : who === second ? b : NaN
    if (Number.isNaN(part)) return null
    const known = Number(knownText)
    if (known % part !== 0) return null
    return (known / part) * (a + b)
  }

  if (type === 'proportion_unitary') {
    // Each context gives: amount for q1, q1, and q2. Answer = amount / q1 * q2.
    const shapes: RegExp[] = [
      /^(\d+) (pens|notebooks|muffins|bus tickets) cost \$(\d+)\. How much do (\d+) (pens|notebooks|muffins|bus tickets) cost\? Answer with just the number\.$/,
      /^A recipe uses (\d+) g of (flour|sugar|rice) for (\d+) people\. How much (flour|sugar|rice) is needed for (\d+) people\? Answer with just the number\.$/,
      /^A car travels (\d+) km in (\d+) hours at a steady speed\. How far does it travel in (\d+) hours\? Answer with just the number\.$/,
      /^A printer prints (\d+) pages in (\d+) minutes\. How many pages does it print in (\d+) minutes\?$/,
    ]
    let amount = NaN
    let q1 = NaN
    let q2 = NaN
    let m = prompt.match(shapes[0])
    if (m) {
      if (m[2] !== m[5]) return null
      ;[q1, amount, q2] = [Number(m[1]), Number(m[3]), Number(m[4])]
    } else if ((m = prompt.match(shapes[1]))) {
      if (m[2] !== m[4]) return null
      ;[amount, q1, q2] = [Number(m[1]), Number(m[3]), Number(m[5])]
    } else if ((m = prompt.match(shapes[2])) || (m = prompt.match(shapes[3]))) {
      ;[amount, q1, q2] = [Number(m[1]), Number(m[2]), Number(m[3])]
    } else {
      return null
    }
    check(q1 !== q2 && q1 >= 2 && q2 >= 2, `${where}: the two quantities must differ and be 2 or more`)
    if (amount % q1 !== 0) return null
    const one = amount / q1
    check(one >= 2, `${where}: the value of one is ${one}, expected 2 or more`)
    return one * q2
  }

  return null
}

const TYPES: RatioProblemType[] = [
  'ratio_share_larger',
  'ratio_share_smaller',
  'ratio_missing_value',
  'ratio_find_total',
  'proportion_unitary',
]

// Intended answer range per type, from the generator's number ranges.
const RANGE: Record<string, [number, number]> = {
  ratio_share_larger: [4, 108],
  ratio_share_smaller: [2, 96],
  ratio_missing_value: [1, 81],
  ratio_find_total: [6, 204],
  proportion_unitary: [4, 1200],
}

const typeCounts = new Map<string, number>()
const unitaryContexts = new Map<string, number>()
const missingPositions = new Map<number, number>()

async function main() {
  for (let seed = 1; seed <= 300; seed++) {
    const problems = generateRatioProblems(20, seededRand(seed))
    check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

    const prompts = new Set<string>()
    const perSeed = new Map<string, number>()
    for (const p of problems) {
      const where = `seed ${seed} ${p.id}`
      typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)
      perSeed.set(p.type, (perSeed.get(p.type) ?? 0) + 1)

      check(TYPES.includes(p.type), `${where}: unexpected type ${p.type}`)
      check(/^rat182_\d+$/.test(p.id), `${where}: bad id`)
      check(!prompts.has(p.prompt), `${where}: duplicate prompt "${p.prompt}"`)
      prompts.add(p.prompt)

      // ONE positive integer, never a ratio or anything else.
      check(/^[1-9]\d*$/.test(p.answer), `${where}: answer "${p.answer}" is not a positive integer`)
      const n = Number(p.answer)
      const [lo, hi] = RANGE[p.type] ?? [NaN, NaN]
      check(n >= lo && n <= hi, `${where}: answer ${n} outside ${lo} to ${hi} for ${p.type}`)

      // Independent recompute from the prompt text.
      const expected = recompute(p.type, p.prompt, where)
      check(expected !== null, `${where}: prompt did not parse: "${p.prompt}"`)
      if (expected !== null) {
        check(expected === n, `${where}: prompt gives ${expected} but answer says ${n}: "${p.prompt}"`)
      }

      // No number shown in the prompt may equal the answer.
      check(
        !(p.prompt.match(/\d+/g) ?? ([] as string[])).includes(p.answer),
        `${where}: prompt shows the answer ${p.answer}: "${p.prompt}"`,
      )

      // A unit a student might type ($, g, km) means the prompt ends with the hint.
      if (/\$| g | km /.test(p.prompt)) {
        check(p.prompt.endsWith(NUMBER_HINT), `${where}: unit prompt lacks the number hint: "${p.prompt}"`)
      }
      check(!/[\u2013\u2014\u2212]/.test(p.prompt), `${where}: dash character in prompt`)
      check(!BANNED_NAMES.some(name => p.prompt.includes(name)), `${where}: banned name in prompt`)

      // The placeholder must never be a real answer.
      check(`e.g. ${p.answer}` !== PLACEHOLDER, `${where}: answer equals the placeholder`)

      // Real grader: accepts the answer on the signed-integer path, rejects near misses.
      check(gradeAnswer(p.answer, p.answer) === true, `${where}: grader rejected "${p.answer}"`)
      check(gradeAnswer(String(n + 1), p.answer) === false, `${where}: grader accepted ${n + 1} for ${n}`)
      if (n > 1) {
        check(gradeAnswer(String(n - 1), p.answer) === false, `${where}: grader accepted ${n - 1} for ${n}`)
      }

      if (p.type === 'proportion_unitary') {
        const ctx = /pens|notebooks|muffins|bus tickets/.test(p.prompt)
          ? 'shop'
          : p.prompt.startsWith('A recipe')
            ? 'recipe'
            : p.prompt.startsWith('A car')
              ? 'car'
              : 'printer'
        unitaryContexts.set(ctx, (unitaryContexts.get(ctx) ?? 0) + 1)
      }
      if (p.type === 'ratio_missing_value') {
        const pos = (p.prompt.match(/\d+|\?/g) ?? ([] as string[])).indexOf('?')
        missingPositions.set(pos, (missingPositions.get(pos) ?? 0) + 1)
      }
    }

    for (const t of TYPES) {
      check(perSeed.get(t) === 4, `seed ${seed}: expected 4 of ${t}, got ${perSeed.get(t) ?? 0}`)
    }
  }

  // Every declared type, every unitary context and every missing position must appear.
  for (const t of TYPES) {
    check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
  }
  for (const ctx of ['shop', 'recipe', 'car', 'printer']) {
    check((unitaryContexts.get(ctx) ?? 0) > 0, `unitary context ${ctx} was never generated`)
  }
  for (const pos of [0, 1, 2, 3]) {
    check((missingPositions.get(pos) ?? 0) > 0, `missing value position ${pos} was never used`)
  }

  // Wiring: these fail until the orchestrator wires the shared files.
  if (WIRING) {
    for (const t of TYPES) {
      check(inputModeForType(t) === 'numeric', `type ${t}: expected numeric input mode`)
      check(placeholderForType(t) === PLACEHOLDER, `type ${t}: expected placeholder "${PLACEHOLDER}"`)
      const label = problemTypeLabel(t)
      check(!!label && label !== t, `type ${t}: missing problemTypeLabel`)
      check(getAnswerControlType(t) === 'default', `type ${t}: expected the default answer control`)
    }
    // Loaded here so the --no-wiring run never depends on the shared router.
    const { generateProblems } = await import('../src/lib/math/generators')
    const routed = generateProblems(18, 2, 20)
    check(routed.length === 20, `router returned ${routed.length} problems for 18/2`)
    check(
      routed.every(p => TYPES.includes(p.type as RatioProblemType)),
      'router returned problems of an unexpected type for 18/2',
    )
  }

  console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
  console.log(`unitary contexts: ${[...unitaryContexts].map(([k, v]) => `${k}=${v}`).join(', ')}`)
  console.log(`missing positions: ${[0, 1, 2, 3].map(i => `${i}=${missingPositions.get(i) ?? 0}`).join(', ')}`)
  console.log(`wiring checks: ${WIRING ? 'on' : 'skipped (--no-wiring)'}`)
  console.log(`${checks} checks, ${failures} failures`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
