export type ProblemType = 'prime_factorization' | 'list_factors' | 'gcf' | 'lcm'

export interface MathProblem {
  id: string
  type: ProblemType
  prompt: string
  // answer formats:
  // prime_factorization: "2 × 3 × 5"  (sorted prime factors joined with ×)
  // list_factors:        "1, 2, 3, 6"  (all factors sorted ascending)
  // gcf:                 "6"           (single integer as string)
  // lcm:                 "12"          (single integer as string)
  answer: string
}

// --- Math helpers ---

function primeFactors(n: number): number[] {
  const factors: number[] = []
  let d = 2
  while (d * d <= n) {
    while (n % d === 0) {
      factors.push(d)
      n = Math.floor(n / d)
    }
    d++
  }
  if (n > 1) factors.push(n)
  return factors
}

function allFactors(n: number): number[] {
  const factors: number[] = []
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) factors.push(i)
  }
  return factors
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    ;[a, b] = [b, a % b]
  }
  return a
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

// --- Fixed pools (deterministic, no randomness) ---

const PF_NUMBERS = [12, 18, 24, 30, 36, 42, 48, 60, 72, 84]
const LF_NUMBERS = [12, 18, 24, 30, 36, 48, 60, 72]
const GCF_PAIRS: [number, number][] = [
  [12, 18], [24, 36], [30, 45], [18, 27], [16, 24],
]
const LCM_PAIRS: [number, number][] = [
  [4, 6], [6, 9], [8, 12],
]

// Generates problems for level 9 / sublevel 1 — Factorization
// Default count is 10. Distribution ratio: 3 PF : 2 LF : 3 GCF : 2 LCM (out of 10).
// For other counts, the same ratio is scaled proportionally, cycling pools as needed.
export function generateFactorizationProblems(count: number = 10): MathProblem[] {
  // Distribute by ratio 3:2:3:2
  const pfCount = Math.round(count * 0.3)
  const lfCount = Math.round(count * 0.2)
  const gcfCount = Math.round(count * 0.3)
  // LCM gets the remainder so total always equals count
  const lcmCount = count - pfCount - lfCount - gcfCount

  const problems: MathProblem[] = []

  for (let i = 0; i < pfCount; i++) {
    const n = PF_NUMBERS[i % PF_NUMBERS.length]
    problems.push({
      id: `pf_${i + 1}`,
      type: 'prime_factorization',
      prompt: `Write the prime factorization of ${n}.`,
      answer: primeFactors(n).join(' × '),
    })
  }

  for (let i = 0; i < lfCount; i++) {
    const n = LF_NUMBERS[i % LF_NUMBERS.length]
    problems.push({
      id: `lf_${i + 1}`,
      type: 'list_factors',
      prompt: `List all factors of ${n}.`,
      answer: allFactors(n).join(', '),
    })
  }

  for (let i = 0; i < gcfCount; i++) {
    const [a, b] = GCF_PAIRS[i % GCF_PAIRS.length]
    problems.push({
      id: `gcf_${i + 1}`,
      type: 'gcf',
      prompt: `Find the greatest common factor (GCF) of ${a} and ${b}.`,
      answer: String(gcd(a, b)),
    })
  }

  for (let i = 0; i < lcmCount; i++) {
    const [a, b] = LCM_PAIRS[i % LCM_PAIRS.length]
    problems.push({
      id: `lcm_${i + 1}`,
      type: 'lcm',
      prompt: `Find the least common multiple (LCM) of ${a} and ${b}.`,
      answer: String(lcm(a, b)),
    })
  }

  return problems
}
