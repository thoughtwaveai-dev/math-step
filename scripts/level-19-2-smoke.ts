// Level 19.2 smoke test: every generated problem must be a whole-number area or
// perimeter that an independent recompute from the prompt text agrees with,
// must never show its own answer, and must grade correct through the real
// gradeAnswer signed-integer path.
//
// Run: npx tsx scripts/level-19-2-smoke.ts               (full, needs shared wiring)
//      npx tsx scripts/level-19-2-smoke.ts --no-wiring   (generator checks only)

import { generateAreaPerimeterProblems } from '../src/lib/math/generators/area-perimeter'
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

const TYPES = [
  'area_triangle',
  'area_parallelogram',
  'area_trapezium',
  'area_compound_shape',
  'rectangle_perimeter_area',
]

// Answer range each type can reach, from a brute-force walk of the maker ranges.
const RANGE: Record<string, [number, number]> = {
  area_triangle: [6, 133],
  area_parallelogram: [15, 160],
  area_trapezium: [7, 162],
  area_compound_shape: [25, 206],
  rectangle_perimeter_area: [8, 210],
}

// Placeholders the orchestrator wires. None of these numbers is a reachable
// answer for its type, so the hint can never give an answer away.
const PLACEHOLDER: Record<string, string> = {
  area_triangle: 'e.g. 74',
  area_parallelogram: 'e.g. 74',
  area_trapezium: 'e.g. 74',
  area_compound_shape: 'e.g. 24',
  rectangle_perimeter_area: 'e.g. 74',
}

const HINT = ' Answer with just the number.'
const SQ = '²'

type Recomputed = { answer: number; tag: string } | null

// Reads the numbers back out of the prompt and works the answer out again, so
// the test trusts none of the generator's arithmetic. Each branch also asserts
// the geometric guards the generator promises. Returns null if the prompt does
// not have the exact shape its type should have.
function recompute(type: string, prompt: string): Recomputed {
  let m: RegExpMatchArray | null

  if (type === 'area_triangle') {
    m = prompt.match(
      new RegExp(`^A triangle has a base of (\\d+) (cm|m) and a perpendicular height of (\\d+) \\2\\. What is its area in \\2${SQ}\\?${HINT}$`),
    )
    if (!m) return null
    const base = Number(m[1])
    const height = Number(m[3])
    check((base * height) % 2 === 0, `triangle ${base} x ${height} is odd, half is not whole`)
    return { answer: (base * height) / 2, tag: m[2] }
  }

  if (type === 'area_parallelogram') {
    let base: number, slant: number, height: number, unit: string, order: string
    m = prompt.match(
      new RegExp(`^A parallelogram has a base of (\\d+) (cm|m), a slanted side of (\\d+) \\2 and a perpendicular height of (\\d+) \\2\\. What is its area in \\2${SQ}\\?${HINT}$`),
    )
    if (m) {
      base = Number(m[1]); unit = m[2]; slant = Number(m[3]); height = Number(m[4]); order = 'slant-first'
    } else {
      m = prompt.match(
        new RegExp(`^A parallelogram has a base of (\\d+) (cm|m), a perpendicular height of (\\d+) \\2 and a slanted side of (\\d+) \\2\\. What is its area in \\2${SQ}\\?${HINT}$`),
      )
      if (!m) return null
      base = Number(m[1]); unit = m[2]; height = Number(m[3]); slant = Number(m[4]); order = 'height-first'
    }
    check(slant > height, `parallelogram slant ${slant} is not longer than height ${height}`)
    check(slant !== base, `parallelogram slant equals base ${base}`)
    // The answer must use the perpendicular height: the slant gives a different number.
    check(base * slant !== base * height, `parallelogram slant and height give the same area`)
    return { answer: base * height, tag: `${unit} ${order}` }
  }

  if (type === 'area_trapezium') {
    m = prompt.match(
      new RegExp(`^A trapezium has parallel sides of (\\d+) (cm|m) and (\\d+) \\2, and a perpendicular height of (\\d+) \\2\\. What is its area in \\2${SQ}\\?${HINT}$`),
    )
    if (!m) return null
    const a = Number(m[1])
    const b = Number(m[3])
    const height = Number(m[4])
    check(a !== b, `trapezium parallel sides are equal (${a})`)
    check(((a + b) * height) % 2 === 0, `trapezium (${a} + ${b}) x ${height} is odd`)
    return { answer: ((a + b) * height) / 2, tag: m[2] }
  }

  if (type === 'area_compound_shape') {
    m = prompt.match(
      new RegExp(`^A rectangle (\\d+) (cm|m) by (\\d+) \\2 has an? (\\d+) \\2 by (\\d+) \\2 rectangle cut out of one corner\\. What is the area of the shape that is left, in \\2${SQ}\\?${HINT}$`),
    )
    if (!m) return null
    const length = Number(m[1])
    const width = Number(m[3])
    const cutLength = Number(m[4])
    const cutWidth = Number(m[5])
    check(cutLength < length && cutWidth < width, `cut-out ${cutLength} x ${cutWidth} does not fit inside ${length} x ${width}`)
    return { answer: length * width - cutLength * cutWidth, tag: m[2] }
  }

  if (type === 'rectangle_perimeter_area') {
    // (a) area and width given, perimeter asked
    m = prompt.match(
      new RegExp(`^A rectangle has an area of (\\d+) (cm|m)${SQ} and a width of (\\d+) \\2\\. What is its perimeter in \\2\\?${HINT}$`),
    )
    if (m) {
      const area = Number(m[1])
      const width = Number(m[3])
      const length = area / width
      check(Number.isInteger(length) && length > 0, `area ${area} / width ${width} is not a whole length`)
      check(length !== width, `rectangle is a square (${width})`)
      return { answer: 2 * (length + width), tag: `${m[2]} area-to-perimeter` }
    }
    // (b) perimeter and length given, area asked
    m = prompt.match(
      new RegExp(`^A rectangle has a perimeter of (\\d+) (cm|m) and a length of (\\d+) \\2\\. What is its area in \\2${SQ}\\?${HINT}$`),
    )
    if (!m) return null
    const perimeter = Number(m[1])
    const length = Number(m[3])
    const width = perimeter / 2 - length
    check(Number.isInteger(width) && width > 0, `perimeter ${perimeter} and length ${length} give no whole width`)
    check(width !== length, `rectangle is a square (${length})`)
    return { answer: length * width, tag: `${m[2]} perimeter-to-area` }
  }

  return null
}

const typeCounts = new Map<string, number>()
const tagCounts = new Map<string, number>()

for (let seed = 1; seed <= 300; seed++) {
  const problems = generateAreaPerimeterProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  const seedTypes = new Map<string, number>()
  let areaToPerimeter = 0
  let perimeterToArea = 0

  for (const p of problems) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)
    seedTypes.set(p.type, (seedTypes.get(p.type) ?? 0) + 1)

    check(TYPES.includes(p.type), `seed ${seed}: unexpected type ${p.type}`)
    check(/^ap192_\d+$/.test(p.id), `seed ${seed}: bad id "${p.id}"`)
    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)
    check(p.prompt.endsWith('Answer with just the number.'), `seed ${seed}: missing number hint: "${p.prompt}"`)

    // Positive whole number, no leading zero, inside the type's reachable range.
    check(/^\d+$/.test(p.answer) && !/^0/.test(p.answer), `seed ${seed}: answer "${p.answer}" is not a positive integer`)
    const n = Number(p.answer)
    const [lo, hi] = RANGE[p.type] ?? [1, 0]
    check(n >= lo && n <= hi, `seed ${seed}: ${p.type} answer ${n} outside ${lo} to ${hi}`)
    check(`e.g. ${n}` !== PLACEHOLDER[p.type], `seed ${seed}: ${p.type} answer ${n} equals its placeholder`)

    // The generator's answer must match an independent recompute from its own prompt.
    const r = recompute(p.type, p.prompt)
    check(r !== null, `seed ${seed}: prompt did not parse for ${p.type}: "${p.prompt}"`)
    if (r !== null) {
      check(r.answer === n, `seed ${seed}: prompt works out to ${r.answer} but answer says ${n}: "${p.prompt}"`)
      tagCounts.set(r.tag, (tagCounts.get(r.tag) ?? 0) + 1)
      if (r.tag.endsWith('area-to-perimeter')) areaToPerimeter++
      if (r.tag.endsWith('perimeter-to-area')) perimeterToArea++
    }

    // The prompt must never show the answer as a whole number.
    check(!new RegExp(`\\b${p.answer}\\b`).test(p.prompt), `seed ${seed}: prompt gives away the answer ${p.answer}: "${p.prompt}"`)

    // The real grader must accept the answer (signed-integer path) and reject near misses.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)
    check(gradeAnswer(String(n + 1), p.answer) === false, `seed ${seed}: grader accepted ${n + 1} for ${n}`)
    check(gradeAnswer(String(n - 1), p.answer) === false, `seed ${seed}: grader accepted ${n - 1} for ${n}`)
  }

  // 4 of each type, and both rectangle directions on every worksheet.
  for (const t of TYPES) {
    check(seedTypes.get(t) === 4, `seed ${seed}: ${t} appeared ${seedTypes.get(t) ?? 0} times, expected 4`)
  }
  check(areaToPerimeter === 2 && perimeterToArea === 2, `seed ${seed}: rectangle directions ${areaToPerimeter}/${perimeterToArea}, expected 2/2`)
}

// Every declared type, both units and both parallelogram orders must actually appear.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}
for (const tag of ['cm slant-first', 'cm height-first', 'm slant-first', 'm height-first']) {
  check((tagCounts.get(tag) ?? 0) > 0, `parallelogram variant "${tag}" was never generated`)
}
check((tagCounts.get('cm') ?? 0) > 0 && (tagCounts.get('m') ?? 0) > 0, 'cm and m did not both appear')

// Wiring: shared files the orchestrator edits. Skipped with --no-wiring.
if (WIRING) {
  for (const t of TYPES) {
    const type = t as Parameters<typeof inputModeForType>[0]
    check(inputModeForType(type) === 'numeric', `type ${t}: expected numeric input mode, got ${inputModeForType(type)}`)
    check(placeholderForType(type) === PLACEHOLDER[t], `type ${t}: placeholder "${placeholderForType(type)}", expected "${PLACEHOLDER[t]}"`)
    const label = problemTypeLabel(type)
    check(!!label && label !== t, `type ${t}: missing parent-facing label`)
    check(getAnswerControlType(type) === 'default', `type ${t}: expected the default control, got ${getAnswerControlType(type)}`)
  }

  // The router must serve 19/2.
  const routed = generateProblems(19, 2, 20)
  check(routed.length === 20, `router returned ${routed.length} problems for 19/2`)
  check(
    routed.every(p => TYPES.includes(p.type as string)),
    'router returned problems of an unexpected type for 19/2',
  )
}

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`variants: ${[...tagCounts.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`)
console.log(`${checks} checks, ${failures} failures${WIRING ? '' : ' (wiring skipped)'}`)
process.exit(failures === 0 ? 0 : 1)
