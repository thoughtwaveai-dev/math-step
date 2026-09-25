import { randInt } from './rand'

export type SequenceProblemType =
  | 'sequence_next_term'
  | 'sequence_missing_term'
  | 'sequence_nth_term_value'
  | 'sequence_find_nth_term'
  | 'sequence_term_position'

export interface SequenceProblem {
  id: string
  type: SequenceProblemType
  prompt: string
  answer: string
}

// --- Level 17/2 - Sequences --------------------------------------------------
// Linear (arithmetic) sequences: spot the common difference, fill gaps, then use
// and build the nth term rule an + b.
//
// Four of the five types (next term, missing term, nth term value, term
// position) answer with a plain positive integer, so they ride the signed
// integer path in gradeAnswer (^-?\d+$) and are safe on the numeric keypad.
//
// sequence_find_nth_term answers with a rule like "3n + 4" or "5n - 2". The
// letter n sends it down the algebraic path (lowercase, strip whitespace, strict
// match, no reordering), so the prompt ends with a fixed format hint,
// "Write it like 10n + 11.". a is always 2 to 9 and b is always -9 to 9, so
// neither "10n" nor "11" can be part of a real answer and the hint never leaks
// one, not even the coefficient. The answer never holds
// x, =, < or >, so it cannot drift onto the sim-eq or inequality branches.
//
// Every maker picks the sequence (first term or last term, and the difference)
// or the rule and position first, and derives the question from it, so every
// answer is an exact integer by construction and every term shown is >= 1.

const FORMAT_HINT = 'Write it like 10n + 11.'

type Seq172 = { type: SequenceProblemType; prompt: string; answer: string }

// Renders the nth term rule "4n + 3" / "4n - 5" (one space around the sign).
function renderNthTerm(a: number, b: number): string {
  return `${a}n ${b < 0 ? '-' : '+'} ${Math.abs(b)}`
}

// Ordinal label for a term number: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st.
export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

// Builds `length` terms of an arithmetic sequence that stay >= 1. Increasing:
// difference 2 to 12, first term picked first. Decreasing: difference -2 to -9,
// LAST term picked first (1 to 30) and the first term worked back from it, so
// nothing ever drops below 1 and no retry is needed.
function pickSequence(length: number, rand: () => number): number[] {
  let first: number
  let d: number
  if (rand() < 0.5) {
    d = randInt(2, 12, rand)
    first = randInt(1, 20, rand)
  } else {
    d = -randInt(2, 9, rand)
    const last = randInt(1, 30, rand)
    first = last - (length - 1) * d
  }
  const terms: number[] = []
  for (let k = 0; k < length; k++) terms.push(first + k * d)
  return terms
}

// (1) Show four terms, ask for the fifth. The fifth term is part of the picked
// sequence, so it is >= 1 like every shown term.
function makeNextTerm(rand: () => number): Seq172 {
  const t = pickSequence(5, rand)
  return {
    type: 'sequence_next_term',
    prompt: `Find the next term in this sequence: ${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ...`,
    answer: String(t[4]),
  }
}

// (2) Show five terms with position 2, 3 or 4 blanked out as "__". The blank is
// never at an end, so the difference can always be read from two neighbours.
function makeMissingTerm(rand: () => number): Seq172 {
  const t = pickSequence(5, rand)
  const gap = randInt(1, 3, rand)
  const shown = t.map((v, i) => (i === gap ? '__' : String(v)))
  return {
    type: 'sequence_missing_term',
    prompt: `Find the missing term in this sequence: ${shown.join(', ')}.`,
    answer: String(t[gap]),
  }
}

// (3) Given the rule an + b, work out the kth term. Smallest possible answer is
// 2 x 5 - 9 = 1, so it is always a positive integer.
function makeNthTermValue(rand: () => number): Seq172 {
  const a = randInt(2, 9, rand)
  let b = randInt(-9, 8, rand)
  if (b >= 0) b += 1
  const k = randInt(5, 20, rand)
  return {
    type: 'sequence_nth_term_value',
    prompt: `The nth term of a sequence is ${renderNthTerm(a, b)}. What is the ${ordinal(k)} term?`,
    answer: String(a * k + b),
  }
}

// (4) Show the first four terms of an + b and ask for the rule. a + b >= 1 keeps
// the first term (and so every later one) positive. Algebraic answer, so the
// prompt carries the fixed format hint.
function makeFindNthTerm(rand: () => number): Seq172 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = randInt(2, 9, rand)
    let b = randInt(-9, 8, rand)
    if (b >= 0) b += 1
    if (a + b < 1) continue
    const terms = [1, 2, 3, 4].map(n => a * n + b)
    return {
      type: 'sequence_find_nth_term',
      prompt: `Find the nth term of this sequence: ${terms.join(', ')}. ${FORMAT_HINT}`,
      answer: renderNthTerm(a, b),
    }
  }
  // Deterministic fallback: 7, 10, 13, 16 -> 3n + 4.
  return {
    type: 'sequence_find_nth_term',
    prompt: `Find the nth term of this sequence: 7, 10, 13, 16. ${FORMAT_HINT}`,
    answer: renderNthTerm(3, 4),
  }
}

// (5) Given the rule and a value, find which term it is. The term number n is
// picked first and the value built from it, so an + b = value always has a whole
// number solution. value >= 1 always holds (min 2 x 5 - 9 = 1); the guard stays
// in case the ranges change.
function makeTermPosition(rand: () => number): Seq172 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = randInt(2, 9, rand)
    let b = randInt(-9, 8, rand)
    if (b >= 0) b += 1
    const n = randInt(5, 25, rand)
    const value = a * n + b
    if (value < 1) continue
    return {
      type: 'sequence_term_position',
      prompt: `The nth term of a sequence is ${renderNthTerm(a, b)}. Which term is equal to ${value}?`,
      answer: String(n),
    }
  }
  // Deterministic fallback: 3n + 5 = 41 -> n = 12.
  return {
    type: 'sequence_term_position',
    prompt: 'The nth term of a sequence is 3n + 5. Which term is equal to 41?',
    answer: '12',
  }
}

type Maker172 = (rand: () => number) => Seq172

// Distribution for count=20 -> 4/4/4/4/4.
function buildPlan172(count: number): Maker172[] {
  const makers: Maker172[] = [
    makeNextTerm,
    makeMissingTerm,
    makeNthTermValue,
    makeFindNthTerm,
    makeTermPosition,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker172[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeNextTerm)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 17/2 - Sequences.
export function generateSequenceProblems(
  count = 10,
  rand: () => number = Math.random,
): SequenceProblem[] {
  const plan = buildPlan172(count)
  const problems: SequenceProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `seq172_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
