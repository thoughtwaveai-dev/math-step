// Smoke test for Level 14.1 inequalities generator. Run: npx tsx scripts/ineq141-smoke.ts
import { generateInequalitiesLevel141 } from '../src/lib/math/generators/inequalities'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { seededRand } from '../src/lib/math/generators/rand'

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) pass++
  else { fail++; console.error('FAIL:', name) }
}

function flipOperator(answer: string): string {
  return answer
    .replace('<=', '§GE§').replace('>=', '§LE§')
    .replace('<', '§GT§').replace('>', '§LT§')
    .replace('§GE§', '>=').replace('§LE§', '<=')
    .replace('§GT§', '>').replace('§LT§', '<')
}

const TYPES = [
  'inequality_one_step',
  'inequality_two_step',
  'inequality_negative_coefficient',
  'inequality_check_value',
  'inequality_from_words',
]

for (const seed of [1, 7, 42, 99, 12345]) {
  const probs = generateInequalitiesLevel141(20, seededRand(seed))
  check(`seed ${seed}: 20 problems`, probs.length === 20)

  // Distribution 4/4/4/4/4
  const counts: Record<string, number> = {}
  for (const p of probs) counts[p.type] = (counts[p.type] ?? 0) + 1
  for (const t of TYPES) check(`seed ${seed}: ${t} == 4`, counts[t] === 4)

  // No duplicate prompts
  check(`seed ${seed}: no dup prompts`, new Set(probs.map(p => p.prompt)).size === 20)

  for (const p of probs) {
    // Correct answer grades true
    check(`seed ${seed} ${p.id}: correct grades true`, gradeAnswer(p.answer, p.answer) === true)

    if (p.type === 'inequality_check_value') {
      check(`${p.id}: yes/no answer`, p.answer === 'yes' || p.answer === 'no')
      const wrong = p.answer === 'yes' ? 'no' : 'yes'
      check(`${p.id}: wrong yes/no rejects`, gradeAnswer(wrong, p.answer) === false)
    } else {
      check(`${p.id}: has inequality op`, /[<>]/.test(p.answer))
      check(`${p.id}: integer only`, /^x\s*[+\-]?\s*\d*\s*(<=|>=|<|>)\s*-?\d+$/.test(p.answer.replace(/\s+/g, ' ')))
      check(`${p.id}: no-space grades true`, gradeAnswer(p.answer.replace(/\s+/g, ''), p.answer) === true)
      check(`${p.id}: unicode grades true`,
        gradeAnswer(p.answer.replace(/<=/g, '≤').replace(/>=/g, '≥'), p.answer) === true)
      check(`${p.id}: flipped op rejects`, gradeAnswer(flipOperator(p.answer), p.answer) === false)
    }
  }
}

// Sign-flip correctness: every negative_coefficient answer must be the
// mathematically correct flipped result of the displayed inequality.
for (const seed of [3, 8, 21, 55, 808]) {
  const probs = generateInequalitiesLevel141(20, seededRand(seed))
  for (const p of probs.filter(x => x.type === 'inequality_negative_coefficient')) {
    const m = p.prompt.match(/-(\d+)x\s*(<=|>=|<|>|≤|≥)\s*(\d+)/)
    check(`${p.id}: prompt parses`, !!m)
    if (!m) continue
    const a = parseInt(m[1], 10)
    const dispOp = m[2].replace('≤', '<=').replace('≥', '>=')
    const b = parseInt(m[3], 10)
    const t = b / a
    check(`${p.id}: integer threshold`, Number.isInteger(t))
    const flipMap: Record<string, string> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }
    const expected = `x ${flipMap[dispOp]} -${t}`
    check(`${p.id}: flip correct (${p.answer})`, p.answer === expected)
  }
}

// Obvious wrong values reject
const sample = generateInequalitiesLevel141(20, seededRand(1))
const oneStep = sample.find(p => p.type === 'inequality_one_step')!
check('bare number rejects', gradeAnswer('6', oneStep.answer) === false)
check('word answer rejects', gradeAnswer('less than 6', oneStep.answer) === false)

console.log(`\nineq141 smoke: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
