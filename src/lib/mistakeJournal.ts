export type WeakAreaSignal = 'low' | 'medium' | 'high'

export interface WeakArea {
  levelId: number
  levelNumber: number
  sublevelNumber: number
  topic: string
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

export function deriveWeakAreas(input: DeriveWeakAreasInput): WeakArea[] {
  const minAttempts = input.minAttempts ?? 4
  const maxResults = input.maxResults ?? 3
  const examplesPerArea = input.examplesPerArea ?? 2
  const minAccuracyExclusion = input.minAccuracyExclusion ?? 80

  const sessionMap = new Map<string, MistakeJournalSession>()
  for (const s of input.sessions) sessionMap.set(s.id, s)

  const levelMap = new Map<number, MistakeJournalLevel>()
  for (const l of input.levels) levelMap.set(l.id, l)

  // Bucket attempts by level_id
  type Bucket = {
    levelId: number
    total: number
    incorrect: number
    misses: { prompt: string; correctAnswer: string; completedAt: string | null; orderIndex: number }[]
  }
  const buckets = new Map<number, Bucket>()

  for (const p of input.problems) {
    const session = sessionMap.get(p.session_id)
    if (!session) continue
    const levelId = session.level_id
    const bucket = buckets.get(levelId) ?? { levelId, total: 0, incorrect: 0, misses: [] }
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
    buckets.set(levelId, bucket)
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

    candidates.push({
      levelId: bucket.levelId,
      levelNumber: level.level_number,
      sublevelNumber: level.sublevel_number,
      topic: level.topic,
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
