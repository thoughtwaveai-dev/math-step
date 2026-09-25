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
  inequality_one_step: 'One-step inequalities',
  inequality_two_step: 'Two-step inequalities',
  inequality_negative_coefficient: 'Flipping inequality signs',
  inequality_check_value: 'Checking inequalities',
  inequality_from_words: 'Writing inequalities',
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
  system_substitution_simple: 'Solving by substitution',
  system_elimination_simple: 'Solving by elimination',
  system_find_missing_value: 'Finding missing values',
  system_check_solution: 'Checking solutions',
  system_word_problem_simple: 'System word problems',
  exponent_evaluate: 'Working out powers',
  exponent_multiply_same_base: 'Multiplying powers',
  exponent_divide_same_base: 'Dividing powers',
  exponent_power_of_power: 'Power of a power',
  exponent_zero_and_one: 'Zero and first index',
  expand_single_bracket: 'Expanding brackets',
  expand_bracket_subtraction: 'Expanding brackets with subtraction',
  expand_negative_multiplier: 'Expanding with a negative outside',
  expand_and_simplify: 'Expanding and simplifying',
  factorise_single_bracket: 'Factorising into brackets',
  bracket_equation_simple: 'Equations with brackets',
  bracket_equation_subtraction: 'Equations with brackets and subtraction',
  bracket_equation_negative: 'Equations with a negative bracket',
  bracket_equation_both_sides: 'Brackets on both sides',
  bracket_equation_expand_collect: 'Expanding then solving',
  expand_double_positive: 'Expanding double brackets',
  expand_double_mixed: 'Double brackets with a minus',
  expand_double_negative: 'Double brackets, both negative',
  expand_double_square_positive: 'Squaring a bracket',
  expand_double_square_negative: 'Squaring a negative bracket',
  factorise_quadratic_positive: 'Factorising quadratics',
  factorise_quadratic_negative: 'Factorising, both negative',
  factorise_quadratic_mixed_positive: 'Factorising, minus constant',
  factorise_quadratic_mixed_negative: 'Factorising, minus x term and constant',
  factorise_difference_of_squares: 'Difference of two squares',
  solve_quadratic_factorised: 'Solving a factorised quadratic',
  solve_quadratic_positive_roots: 'Solving quadratics with two positive answers',
  solve_quadratic_negative_roots: 'Solving quadratics with two negative answers',
  solve_quadratic_mixed_roots: 'Solving quadratics with one positive and one negative answer',
  solve_quadratic_difference_of_squares: 'Solving a difference of two squares',
  sequence_next_term: 'Finding the next term of a sequence',
  sequence_missing_term: 'Finding a missing term in a sequence',
  sequence_nth_term_value: 'Working out a term from the nth term rule',
  sequence_find_nth_term: 'Writing the nth term rule',
  sequence_term_position: 'Finding which term has a given value',
  pythagoras_hypotenuse: 'Finding the hypotenuse',
  pythagoras_shorter_side: 'Finding a shorter side',
  pythagoras_check_right_angle: 'Checking if a triangle is right-angled',
  pythagoras_word_problem: 'Pythagoras word problems',
  pythagoras_distance_points: 'Distance between two points',
  ratio_share_larger: 'Sharing an amount in a ratio (larger share)',
  ratio_share_smaller: 'Sharing an amount in a ratio (smaller share)',
  ratio_missing_value: 'Finding a missing number in equivalent ratios',
  ratio_find_total: 'Finding the total from one share of a ratio',
  proportion_unitary: 'Direct proportion (the unitary method)',
  percent_increase_amount: 'Increasing an amount by a percentage',
  percent_decrease_amount: 'Decreasing an amount by a percentage',
  percent_change_find: 'Finding a percentage change',
  percent_reverse: 'Finding the original amount (reverse percentages)',
  percent_multiplier: 'Decimal multipliers for percentage change',
  area_triangle: 'Area of a triangle',
  area_parallelogram: 'Area of a parallelogram',
  area_trapezium: 'Area of a trapezium',
  area_compound_shape: 'Area of a compound shape',
  rectangle_perimeter_area: 'Rectangle perimeter and area',
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
