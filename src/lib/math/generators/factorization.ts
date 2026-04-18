import { shuffled } from './rand'

export type ProblemType = 'prime_factorization' | 'list_factors' | 'gcf' | 'lcm' | 'factor_pairs' | 'common_factors'

export interface MathProblem {
  id: string
  type: ProblemType
  prompt: string
  // answer formats:
  // prime_factorization: "2 × 3 × 5"        (sorted prime factors joined with ×)
  // list_factors:        "1, 2, 3, 6"        (all factors sorted ascending)
  // gcf:                 "6"                  (single integer as string)
  // lcm:                 "12"                 (single integer as string)
  // factor_pairs:        "1×12, 2×6, 3×4"   (pairs sorted by first factor, joined with ×)
  // common_factors:      "1, 2, 3, 6"        (sorted ascending)
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

function factorPairs(n: number): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) pairs.push([i, n / i])
  }
  return pairs
}

function commonFactors(a: number, b: number): number[] {
  return allFactors(a).filter(f => b % f === 0)
}

// --- Large pools for Level 9/1 ---

const PF_POOL = [
  12, 18, 20, 24, 28, 30, 36, 40, 42, 45,
  48, 50, 54, 56, 60, 63, 66, 70, 72, 75,
  78, 80, 84, 90, 96, 100, 108, 110, 112, 120,
] as const

const LF_POOL = [
  12, 15, 16, 18, 20, 21, 24, 25, 28, 30,
  32, 35, 36, 40, 42, 45, 48, 50, 54, 56,
  60, 63, 66, 70, 72,
] as const

const GCF_POOL: [number, number][] = [
  [12, 18], [24, 36], [30, 45], [18, 27], [16, 24],
  [20, 30], [28, 42], [15, 25], [36, 48], [14, 21],
  [32, 48], [40, 60], [12, 30], [18, 45], [24, 60],
  [15, 35], [21, 28], [16, 40], [27, 36], [20, 50],
  [18, 24], [30, 42], [35, 49], [24, 32], [45, 60],
  [36, 54], [14, 35], [22, 33], [26, 39], [16, 56],
]

const LCM_POOL: [number, number][] = [
  [4, 6], [6, 9], [8, 12], [3, 5], [4, 10],
  [6, 8], [5, 6], [4, 14], [6, 10], [8, 10],
  [3, 8], [4, 9], [5, 7], [6, 14], [8, 14],
  [3, 7], [4, 15], [5, 8], [6, 15], [9, 12],
  [10, 15], [4, 18], [6, 20], [8, 15], [9, 15],
]

// Generates problems for Level 9/1 — Factorization
// Distribution ratio: 3 PF : 2 LF : 3 GCF : 2 LCM
export function generateFactorizationProblems(count = 10, rand: () => number = Math.random): MathProblem[] {
  const pfCount = Math.round(count * 0.3)
  const lfCount = Math.round(count * 0.2)
  const gcfCount = Math.round(count * 0.3)
  const lcmCount = count - pfCount - lfCount - gcfCount

  const pfNums = shuffled(PF_POOL, rand).slice(0, pfCount)
  const lfNums = shuffled(LF_POOL, rand).slice(0, lfCount)
  const gcfPairs = shuffled(GCF_POOL, rand).slice(0, gcfCount)
  const lcmPairs = shuffled(LCM_POOL, rand).slice(0, lcmCount)

  const problems: MathProblem[] = []

  for (let i = 0; i < pfNums.length; i++) {
    const n = pfNums[i]
    problems.push({
      id: `pf_${i + 1}`,
      type: 'prime_factorization',
      prompt: `Write the prime factorization of ${n}.`,
      answer: primeFactors(n).join(' × '),
    })
  }

  for (let i = 0; i < lfNums.length; i++) {
    const n = lfNums[i]
    problems.push({
      id: `lf_${i + 1}`,
      type: 'list_factors',
      prompt: `List all factors of ${n}.`,
      answer: allFactors(n).join(', '),
    })
  }

  for (let i = 0; i < gcfPairs.length; i++) {
    const [a, b] = gcfPairs[i]
    problems.push({
      id: `gcf_${i + 1}`,
      type: 'gcf',
      prompt: `Find the greatest common factor (GCF) of ${a} and ${b}.`,
      answer: String(gcd(a, b)),
    })
  }

  for (let i = 0; i < lcmPairs.length; i++) {
    const [a, b] = lcmPairs[i]
    problems.push({
      id: `lcm_${i + 1}`,
      type: 'lcm',
      prompt: `Find the least common multiple (LCM) of ${a} and ${b}.`,
      answer: String(lcm(a, b)),
    })
  }

  return problems
}

// --- Large pools for Level 9/2 ---

const FP_POOL = [
  12, 15, 18, 20, 24, 28, 30, 32, 36, 40,
  42, 45, 48, 50, 54, 56, 60, 63, 66, 70, 72,
] as const

const CF_POOL: [number, number][] = [
  [12, 18], [24, 36], [18, 27], [30, 45], [16, 24],
  [12, 30], [18, 45], [15, 25], [14, 21], [20, 30],
  [28, 42], [16, 40], [24, 60], [36, 48], [12, 20],
  [18, 24], [30, 42], [21, 28], [15, 35], [24, 32],
  [36, 54], [20, 50], [12, 36], [18, 54], [15, 45],
]

const GCF2_POOL: [number, number][] = [
  [15, 25], [20, 30], [28, 42], [14, 21], [36, 48],
  [10, 25], [12, 28], [18, 30], [24, 40], [15, 45],
  [16, 32], [20, 45], [24, 56], [14, 49], [21, 35],
  [18, 42], [22, 44], [25, 75], [30, 50], [16, 48],
  [12, 42], [18, 36], [20, 60], [14, 56], [21, 42],
]

// Generates problems for Level 9/2 — Factor Pairs and Common Factors
// Distribution ratio: 4 FP : 3 CF : 3 GCF
export function generateFactorizationPairProblems(count = 10, rand: () => number = Math.random): MathProblem[] {
  const fpCount = Math.round(count * 0.4)
  const cfCount = Math.round(count * 0.3)
  const gcfCount = count - fpCount - cfCount

  const fpNums = shuffled(FP_POOL, rand).slice(0, fpCount)
  const cfPairs = shuffled(CF_POOL, rand).slice(0, cfCount)
  const gcfPairs = shuffled(GCF2_POOL, rand).slice(0, gcfCount)

  const problems: MathProblem[] = []

  for (let i = 0; i < fpNums.length; i++) {
    const n = fpNums[i]
    const pairs = factorPairs(n)
    const answer = pairs.map(([a, b]) => `${a}×${b}`).join(', ')
    problems.push({
      id: `fp_${i + 1}`,
      type: 'factor_pairs',
      prompt: `List all factor pairs of ${n}. Write each pair as A×B (e.g. 1×${n}).`,
      answer,
    })
  }

  for (let i = 0; i < cfPairs.length; i++) {
    const [a, b] = cfPairs[i]
    const answer = commonFactors(a, b).join(', ')
    problems.push({
      id: `cf_${i + 1}`,
      type: 'common_factors',
      prompt: `List all common factors of ${a} and ${b}.`,
      answer,
    })
  }

  for (let i = 0; i < gcfPairs.length; i++) {
    const [a, b] = gcfPairs[i]
    problems.push({
      id: `gcf2_${i + 1}`,
      type: 'gcf',
      prompt: `Find the greatest common factor (GCF) of ${a} and ${b}.`,
      answer: String(gcd(a, b)),
    })
  }

  return problems
}
