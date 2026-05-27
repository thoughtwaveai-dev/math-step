export type WeakAreaSignal = 'low' | 'medium' | 'high'

export interface WeakArea {
  levelId: number
  levelNumber: number
  sublevelNumber: number
  topic: string
  problemType: string | null
  label: string
  totalAttempted: number
  incorrectCount: number
  accuracy: number
  recentExamples: { prompt: string; correctAnswer: string }[]
  signal: WeakAreaSignal
}

export interface MistakeJournalProblem {
  is_correct: boolean | null
  problem_text: string
  correct_answer: string
  session_id: string
  order_index: number | null
  problem_type: string | null
}

export interface MistakeJournalSession {
  id: string
  level_id: number
  completed_at: string | null
}

export interface MistakeJournalLevel {
  id: number
  level_number: number
  sublevel_number: number
  topic: string
}

export interface DeriveWeakAreasInput {
  problems: MistakeJournalProblem[]
  sessions: MistakeJournalSession[]
  levels: MistakeJournalLevel[]
  minAttempts?: number
  maxResults?: number
  examplesPerArea?: number
  minAccuracyExclusion?: number
}

const LEGACY_TYPE_KEY = '__legacy__'

const PARENT_LABELS: Record<string, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  fraction_addition: 'Fraction addition',
  fraction_subtraction: 'Fraction subtraction',
  fraction_multiplication: 'Fraction multiplication',
  fraction_division: 'Fraction division',
  decimal_addition: 'Decimal addition',
  decimal_subtraction: 'Decimal subtraction',
  decimal_multiplication: 'Decimal multiplication',
  percent_of_number: 'Percentages',
  percent_to_decimal: 'Percentages',
  decimal_to_percent: 'Percentages',
  fraction_to_percent: 'Percentages',
  neg_addition: 'Negative numbers',
  neg_subtraction: 'Negative numbers',
  neg_multiplication: 'Negative numbers',
  neg_division: 'Negative numbers',
  order_add_mul: 'Order of operations',
  order_sub_mul: 'Order of operations',
  order_div_add: 'Order of operations',
  order_paren: 'Order of operations',
  expr_combine_like: 'Simplifying expressions',
  expr_multi_terms: 'Simplifying expressions',
  expr_with_constant: 'Simplifying expressions',
  eq_add: 'One-step equations',
  eq_sub: 'One-step equations',
  eq_mul: 'One-step equations',
  eq_div: 'One-step equations',
  linear_equation: 'Linear equations',
  inequality: 'Inequalities',
  sim_eq: 'Simultaneous equations',
  prime_factorization: 'Prime factorization',
  list_factors: 'Listing factors',
  gcf: 'Greatest common factor',
  lcm: 'Least common multiple',
  factor_pairs: 'Factor pairs',
  common_factors: 'Common factors',
  function_evaluate_linear: 'Function evaluation',
  function_evaluate_quadratic: 'Quadratic function evaluation',
  function_evaluate_negative: 'Functions with negatives',
  function_compose_simple: 'Function composition',
  function_inverse_solve: 'Solve for function input',
  read_point_coordinates: 'Reading coordinates',
  identify_slope_from_graph: 'Slope from graph',
  identify_y_intercept_from_graph: 'Y-intercept from graph',
  read_y_for_x: 'Reading values from a graph',
  match_equation_to_graph: 'Matching equations to graphs',
  equation_from_slope_intercept: 'Writing line equations',
  slope_from_two_points: 'Slope from two points',
  y_intercept_from_slope_and_point: 'Finding y-intercepts',
  point_on_line: 'Checking points on lines',
  evaluate_linear_equation: 'Using linear equations',
}

export function parentLabelForType(type: string): string {
  if (PARENT_LABELS[type]) return PARENT_LABELS[type]
  // Fallback: title-case the first word of a snake_case string so we never
  // expose raw identifiers if a future type is added without a label mapping.
  const spaced = type.replace(/_/g, ' ').trim()
  if (!spaced) return type
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function deriveWeakAreas(input: DeriveWeakAreasInput): WeakArea[] {
  const minAttempts = input.minAttempts ?? 4
  const maxResults = input.maxResults ?? 3
  const examplesPerArea = input.examplesPerArea ?? 2
  const minAccuracyExclusion = input.minAccuracyExclusion ?? 80

  const sessionMap = new Map<string, MistakeJournalSession>()
  for (const s of input.sessions) sessionMap.set(s.id, s)

  const levelMap = new Map<number, MistakeJournalLevel>()
  for (const l of input.levels) levelMap.set(l.id, l)

  // Bucket attempts by (level_id, problem_type). Old rows with null
  // problem_type fall into the legacy bucket per level.
  type Bucket = {
    levelId: number
    typeKey: string
    total: number
    incorrect: number
    misses: { prompt: string; correctAnswer: string; completedAt: string | null; orderIndex: number }[]
  }
  const buckets = new Map<string, Bucket>()

  for (const p of input.problems) {
    const session = sessionMap.get(p.session_id)
    if (!session) continue
    const levelId = session.level_id
    const typeKey = p.problem_type ?? LEGACY_TYPE_KEY
    const key = `${levelId}::${typeKey}`
    const bucket = buckets.get(key) ?? { levelId, typeKey, total: 0, incorrect: 0, misses: [] }
    bucket.total += 1
    if (p.is_correct === false) {
      bucket.incorrect += 1
      bucket.misses.push({
        prompt: p.problem_text,
        correctAnswer: p.correct_answer,
        completedAt: session.completed_at,
        orderIndex: p.order_index ?? 0,
      })
    }
    buckets.set(key, bucket)
  }

  const candidates: WeakArea[] = []
  for (const bucket of buckets.values()) {
    if (bucket.total < minAttempts) continue
    if (bucket.incorrect === 0) continue
    const accuracy = Math.round(((bucket.total - bucket.incorrect) / bucket.total) * 100)
    if (accuracy >= minAccuracyExclusion) continue

    const level = levelMap.get(bucket.levelId)
    if (!level) continue

    // Order misses by session completed_at desc, then order_index asc — proper recency
    const orderedMisses = [...bucket.misses].sort((a, b) => {
      const aTime = a.completedAt ? Date.parse(a.completedAt) : 0
      const bTime = b.completedAt ? Date.parse(b.completedAt) : 0
      if (bTime !== aTime) return bTime - aTime
      return a.orderIndex - b.orderIndex
    })

    const signal: WeakAreaSignal = accuracy <= 50 ? 'high' : accuracy <= 70 ? 'medium' : 'low'

    const problemType = bucket.typeKey === LEGACY_TYPE_KEY ? null : bucket.typeKey
    const label = problemType
      ? parentLabelForType(problemType)
      : `Level ${level.level_number}.${level.sublevel_number} — ${level.topic}`

    candidates.push({
      levelId: bucket.levelId,
      levelNumber: level.level_number,
      sublevelNumber: level.sublevel_number,
      topic: level.topic,
      problemType,
      label,
      totalAttempted: bucket.total,
      incorrectCount: bucket.incorrect,
      accuracy,
      recentExamples: orderedMisses.slice(0, examplesPerArea).map(m => ({
        prompt: m.prompt,
        correctAnswer: m.correctAnswer,
      })),
      signal,
    })
  }

  candidates.sort((a, b) => {
    if (b.incorrectCount !== a.incorrectCount) return b.incorrectCount - a.incorrectCount
    return a.accuracy - b.accuracy
  })

  return candidates.slice(0, maxResults)
}
