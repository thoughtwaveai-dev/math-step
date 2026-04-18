export type PlacementQuestion = {
  id: number
  prompt: string
  answer: string
  inputMode: 'numeric' | 'text'
  band: 'arithmetic' | 'numbertheory' | 'algebra'
  hint?: string
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // Band A — Arithmetic (Q1–Q4)
  { id: 1, prompt: '4 + 3 = ?', answer: '7', inputMode: 'numeric', band: 'arithmetic' },
  { id: 2, prompt: '25 + 13 = ?', answer: '38', inputMode: 'numeric', band: 'arithmetic' },
  { id: 3, prompt: '9 − 4 = ?', answer: '5', inputMode: 'numeric', band: 'arithmetic' },
  { id: 4, prompt: '6 × 7 = ?', answer: '42', inputMode: 'numeric', band: 'arithmetic' },
  // Band B — Number Theory (Q5–Q7)
  {
    id: 5,
    prompt: 'Write 12 as a product of its prime factors',
    answer: '2×2×3',
    inputMode: 'text',
    band: 'numbertheory',
    hint: 'e.g. 2×3×5 for 30',
  },
  {
    id: 6,
    prompt: 'List all factors of 18',
    answer: '1, 2, 3, 6, 9, 18',
    inputMode: 'text',
    band: 'numbertheory',
    hint: 'e.g. 1, 2, 5, 10 for the number 10',
  },
  {
    id: 7,
    prompt: 'Find the GCF of 12 and 18',
    answer: '6',
    inputMode: 'numeric',
    band: 'numbertheory',
  },
  // Band C — Algebra (Q8–Q10)
  { id: 8, prompt: 'Solve for x:  x + 5 = 12', answer: '7', inputMode: 'numeric', band: 'algebra' },
  { id: 9, prompt: 'Solve for x:  2x + 3 = x + 8', answer: '5', inputMode: 'numeric', band: 'algebra' },
  {
    id: 10,
    prompt: 'Solve:  x + 3 > 7',
    answer: 'x > 4',
    inputMode: 'text',
    band: 'algebra',
    hint: 'e.g. x > 5',
  },
]

export type PlacementResult = {
  level: number
  sublevel: number
  topic: string
  explanation: string
}

const PLACEMENT_INFO: Record<string, { topic: string; explanation: string }> = {
  '11/1': {
    topic: 'One-Variable Inequalities',
    explanation: 'Excellent algebra performance — placed at one-variable inequalities.',
  },
  '10/2': {
    topic: 'Variables on Both Sides',
    explanation: 'Strong equation-solving skills — placed at equations with variables on both sides.',
  },
  '10/1': {
    topic: 'Linear Equations',
    explanation: 'Good number sense — placed at linear equations.',
  },
  '9/2': {
    topic: 'Factor Pairs and Common Factors',
    explanation: 'Strong factorisation knowledge — placed at factor pairs and common factors.',
  },
  '9/1': {
    topic: 'Prime Factorisation',
    explanation: 'Solid arithmetic foundation — placed at prime factorisation and factors.',
  },
  '2/2': {
    topic: 'Subtraction',
    explanation: 'Good subtraction skills — placed at double-digit subtraction.',
  },
  '3/2': {
    topic: 'Multiplication',
    explanation: 'Strong arithmetic — placed at multi-digit multiplication.',
  },
  '3/1': {
    topic: 'Multiplication',
    explanation: 'Good arithmetic skills — placed at basic multiplication facts.',
  },
  '2/1': {
    topic: 'Subtraction',
    explanation: 'Good addition skills — placed at single-digit subtraction.',
  },
  '1/2': {
    topic: 'Addition',
    explanation: 'Good basic addition — placed at double-digit addition.',
  },
  '1/1': {
    topic: 'Addition',
    explanation: 'Starting at the beginning with single-digit addition.',
  },
}

function normalizeInequality(s: string): string {
  return s.trim().toLowerCase().replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/\s+/g, '')
}

function gradeAnswer(studentAnswer: string, correctAnswer: string): boolean {
  if (!studentAnswer.trim()) return false
  if (/[<>]/.test(correctAnswer)) {
    return normalizeInequality(studentAnswer) === normalizeInequality(correctAnswer)
  }
  const correctNums = (correctAnswer.match(/\d+/g) ?? []).map(Number)
  if (correctNums.length === 1) {
    const n = parseInt(studentAnswer.trim(), 10)
    return !isNaN(n) && n === correctNums[0]
  }
  const normalize = (s: string) =>
    (s.match(/\d+/g) ?? []).map(Number).sort((a, b) => a - b).join(' ')
  return normalize(studentAnswer) === normalize(correctAnswer)
}

export function scorePlacement(answers: string[]): PlacementResult {
  const correct = PLACEMENT_QUESTIONS.map((q, i) =>
    gradeAnswer(answers[i] ?? '', q.answer)
  )
  const [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10] = correct

  const algScore = [q8, q9, q10].filter(Boolean).length
  const numScore = [q5, q6, q7].filter(Boolean).length

  let key: string
  if (algScore >= 3) key = '11/1'
  else if (algScore >= 2) key = '10/2'
  else if (algScore >= 1 && numScore >= 2) key = '10/1'
  else if (numScore >= 2) key = '9/2'
  else if (numScore >= 1) key = '9/1'
  else if (q4) key = '3/2'
  else if (q3) key = '2/2'
  else if (q2) key = '2/1'
  else if (q1) key = '1/2'
  else key = '1/1'

  const [levelStr, sublevelStr] = key.split('/')
  const { topic, explanation } = PLACEMENT_INFO[key]

  return {
    level: parseInt(levelStr, 10),
    sublevel: parseInt(sublevelStr, 10),
    topic,
    explanation,
  }
}
