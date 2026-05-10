/**
 * One-off backfill of problems.problem_type for legacy null rows.
 *
 * Local-only — not part of any runtime path. Service role key is read from
 * .env.local and is never logged.
 *
 * Background:
 *   problem_type was added around Milestone 54. All problems created before
 *   that have problem_type IS NULL. Null rows fall into a coarse legacy bucket
 *   in the Mistake Journal instead of showing precise type labels.
 *
 *   Audit (2026-05-10): 680 null rows across exactly 3 levels:
 *     - Level 1/1 Addition     (200 rows) → addition
 *     - Level 9/1 Factorization (260 rows) → prime_factorization / list_factors / gcf / lcm
 *     - Level 9/2 Factorization (220 rows) → factor_pairs / common_factors / gcf
 *
 * Usage:
 *   npm run backfill:problem-types              (dry-run, default)
 *   npm run backfill:problem-types -- --apply   (write to DB)
 *
 * Safety:
 *   - Never overwrites a non-null problem_type (UPDATE ... WHERE problem_type IS NULL)
 *   - Dry-run reports what would change without touching anything
 *   - Leaves unrecognised prompts as null and reports them
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ---------- env loader ----------

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    console.error(`.env.local not found at ${envPath}`)
    process.exit(1)
  }
  const raw = readFileSync(envPath, 'utf8')
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ---------- inference ----------

type InferredType =
  | 'addition'
  | 'prime_factorization'
  | 'list_factors'
  | 'gcf'
  | 'lcm'
  | 'factor_pairs'
  | 'common_factors'

function inferType(problemText: string): InferredType | null {
  if (problemText.startsWith('Write the prime factorization')) return 'prime_factorization'
  if (problemText.startsWith('List all factors of'))           return 'list_factors'
  if (problemText.startsWith('Find the greatest common factor')) return 'gcf'
  if (problemText.startsWith('Find the least common multiple')) return 'lcm'
  if (problemText.startsWith('List all factor pairs'))         return 'factor_pairs'
  if (problemText.startsWith('List all common factors'))       return 'common_factors'
  if (/^\d+ \+ \d+ = \?$/.test(problemText))                  return 'addition'
  return null
}

// ---------- helpers ----------

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ---------- main ----------

async function main() {
  const applyMode = process.argv.includes('--apply')
  const mode = applyMode ? 'APPLY' : 'DRY RUN'
  console.log(`[${mode}] backfill-problem-types starting…\n`)

  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Fetch all null-problem_type rows (paginated).
  type ProblemRow = { id: string; problem_text: string }
  const allRows: ProblemRow[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('problems')
      .select('id, problem_text')
      .is('problem_type', null)
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('Fetch error:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    allRows.push(...(data as ProblemRow[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`Inspected: ${allRows.length} problems with null problem_type\n`)

  // Run inference on each row.
  const byType = new Map<InferredType, string[]>()
  const leftNull: { id: string; problem_text: string }[] = []

  for (const row of allRows) {
    const inferred = inferType(row.problem_text.trim())
    if (inferred) {
      const arr = byType.get(inferred) ?? []
      arr.push(row.id)
      byType.set(inferred, arr)
    } else {
      leftNull.push({ id: row.id, problem_text: row.problem_text })
    }
  }

  const wouldUpdate = allRows.length - leftNull.length

  // Report counts by type.
  console.log('Inferred types:')
  const typeOrder: InferredType[] = [
    'addition',
    'prime_factorization',
    'list_factors',
    'gcf',
    'lcm',
    'factor_pairs',
    'common_factors',
  ]
  for (const t of typeOrder) {
    const ids = byType.get(t)
    if (ids && ids.length > 0) {
      console.log(`  ${t.padEnd(26)} ${ids.length}`)
    }
  }

  console.log(`\nLeft null (unrecognised): ${leftNull.length}`)
  if (leftNull.length > 0) {
    for (const r of leftNull.slice(0, 5)) {
      console.log(`  - [${r.id}] "${r.problem_text.slice(0, 60)}"`)
    }
    if (leftNull.length > 5) console.log(`  … and ${leftNull.length - 5} more`)
  }

  // Sample rows (up to 3 per inferred type).
  console.log('\nSample inferences (up to 3 per type):')
  for (const t of typeOrder) {
    const ids = byType.get(t)
    if (!ids || ids.length === 0) continue
    // Re-map from original rows for display.
    const samples = allRows
      .filter(r => ids.slice(0, 3).includes(r.id))
      .slice(0, 3)
    for (const s of samples) {
      console.log(`  ${t}: "${s.problem_text.slice(0, 60)}"`)
    }
  }

  console.log(`\nWould update: ${wouldUpdate} of ${allRows.length} rows.`)

  if (!applyMode) {
    console.log('\nDry-run only. To execute:')
    console.log('  npm run backfill:problem-types -- --apply')
    return
  }

  // ---------- apply ----------
  console.log('\nApplying updates…')
  let totalUpdated = 0

  for (const t of typeOrder) {
    const ids = byType.get(t)
    if (!ids || ids.length === 0) continue
    const batches = chunked(ids, 500)
    for (const batch of batches) {
      const { error } = await supabase
        .from('problems')
        .update({ problem_type: t })
        .in('id', batch)
        .is('problem_type', null) // safety guard — never overwrite non-null rows
      if (error) {
        console.error(`  ✗ Update failed for type "${t}": ${error.message}`)
        process.exit(1)
      }
    }
    console.log(`  ✓ ${t.padEnd(26)} ${ids.length} rows updated`)
    totalUpdated += ids.length
  }

  console.log(`\nDone. Updated ${totalUpdated} rows, left null ${leftNull.length}.`)
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e)
  console.error(`Unexpected error: ${msg}`)
  process.exit(1)
})
