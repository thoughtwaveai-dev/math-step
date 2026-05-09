/**
 * One-off cleanup of old test/dev users in Supabase Auth.
 *
 * Local-only — not part of any runtime path. Service role key is read from
 * .env.local and is never logged.
 *
 * Usage:
 *   npm run cleanup:auth-users               (dry-run, default)
 *   npm run cleanup:auth-users -- --delete   (actually delete)
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------- env loader (no dotenv dep) ----------

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
    if (!(key in process.env)) {
      process.env[key] = val
    }
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
  )
  process.exit(1)
}

// ---------- config ----------

const HARD_KEEP = new Set([
  'onlinemarketingsols@gmail.com',
  'smithozqu@gmail.com',
  'roctorio@gmail.com',
  'judevictortorio@gmail.com',
  'vilma.tungol@gmail.com',
])

const TEST_DOMAINS = new Set([
  'example.com',
  'mailinator.com',
  'mathstep.test',
  'test.local',
  'mailtest.dev',
])

const TEST_PREFIXES = ['frac', 'negtest', 'divtest', 'stuck-test', 'lessontest']

// ---------- classification ----------

type Verdict =
  | { action: 'keep'; reason: string }
  | { action: 'delete'; primaryRule: string; allRules: string[] }

function classify(email: string | null | undefined): Verdict {
  if (!email || !email.trim()) {
    return { action: 'keep', reason: 'no email' }
  }
  const lower = email.trim().toLowerCase()
  if (HARD_KEEP.has(lower)) {
    return { action: 'keep', reason: 'hardlist' }
  }
  const atIdx = lower.indexOf('@')
  const localPart = atIdx === -1 ? lower : lower.slice(0, atIdx)
  const domain = atIdx === -1 ? '' : lower.slice(atIdx + 1)

  const rules: string[] = []
  if (TEST_DOMAINS.has(domain)) rules.push(`domain '${domain}'`)
  for (const p of TEST_PREFIXES) {
    if (localPart.startsWith(p)) rules.push(`starts with '${p}'`)
  }
  if (lower.includes('m51')) rules.push("contains 'm51'")
  if (lower.includes('m52')) rules.push("contains 'm52'")
  if (lower.includes('m55')) rules.push("contains 'm55'")
  if (lower.includes('playwright')) rules.push("contains 'playwright'")
  if (lower.includes('claude-validation'))
    rules.push("contains 'claude-validation'")
  if (lower.includes('mistake')) rules.push("contains 'mistake'")
  if (lower.includes('habit')) rules.push("contains 'habit'")
  if (lower.includes('test')) rules.push("contains 'test'")

  if (rules.length === 0) {
    return { action: 'keep', reason: 'no test match' }
  }

  // Primary rule order: domain > starts-with > m5x > playwright >
  // claude-validation > mistake > habit > test (broadest last).
  const order = [
    /^domain /,
    /^starts with /,
    /^contains 'm5/,
    /^contains 'playwright'/,
    /^contains 'claude-validation'/,
    /^contains 'mistake'/,
    /^contains 'habit'/,
    /^contains 'test'/,
  ]
  let primary = rules[0]
  for (const re of order) {
    const hit = rules.find((r) => re.test(r))
    if (hit) {
      primary = hit
      break
    }
  }
  return { action: 'delete', primaryRule: primary, allRules: rules }
}

// ---------- main ----------

async function listAllAuthUsers(
  supabase: SupabaseClient
): Promise<{ id: string; email: string | null }[]> {
  const out: { id: string; email: string | null }[] = []
  const perPage = 1000
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) {
      console.error(
        `listUsers failed on page ${page}: ${error.message}. Aborting — no deletions performed.`
      )
      process.exit(1)
    }
    const users = data?.users ?? []
    console.log(`Fetched page ${page} (${users.length} users)`)
    if (users.length === 0) break
    for (const u of users) {
      out.push({ id: u.id, email: u.email ?? null })
    }
    if (users.length < perPage) break
    page += 1
  }
  return out
}

async function main() {
  const deleteMode = process.argv.includes('--delete')
  const mode = deleteMode ? 'DELETE' : 'DRY RUN'

  console.log(`[${mode}] Scanning Supabase auth.users …`)
  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const users = await listAllAuthUsers(supabase)
  console.log(`Total auth users: ${users.length}\n`)

  type DeleteRow = {
    id: string
    email: string
    primaryRule: string
    allRules: string[]
  }
  type KeepRow = { id: string; email: string | null; reason: string }

  const toDelete: DeleteRow[] = []
  const toKeep: KeepRow[] = []

  for (const u of users) {
    const v = classify(u.email)
    if (v.action === 'keep') {
      toKeep.push({ id: u.id, email: u.email, reason: v.reason })
    } else {
      toKeep // no-op for type narrowing
      toDelete.push({
        id: u.id,
        email: u.email!.trim().toLowerCase(),
        primaryRule: v.primaryRule,
        allRules: v.allRules,
      })
    }
  }

  // KEEP section
  console.log(`KEEP (${toKeep.length}):`)
  toKeep.sort((a, b) => {
    const ea = (a.email ?? '').toLowerCase()
    const eb = (b.email ?? '').toLowerCase()
    return ea.localeCompare(eb)
  })
  for (const k of toKeep) {
    const label = k.email ?? `<${k.id}>`
    console.log(`  - ${label.padEnd(40)} [${k.reason}]`)
  }

  // DELETE candidates grouped by primary rule
  console.log(`\nDELETE candidates (${toDelete.length}):`)
  const groups = new Map<string, DeleteRow[]>()
  for (const d of toDelete) {
    const arr = groups.get(d.primaryRule) ?? []
    arr.push(d)
    groups.set(d.primaryRule, arr)
  }
  const groupOrder = [...groups.keys()].sort((a, b) => {
    const rank = (s: string): number => {
      if (s.startsWith('domain ')) return 0
      if (s.startsWith('starts with ')) return 1
      if (s.includes("'m5")) return 2
      if (s.includes("'playwright'")) return 3
      if (s.includes("'claude-validation'")) return 4
      if (s.includes("'mistake'")) return 5
      if (s.includes("'habit'")) return 6
      if (s.includes("'test'")) return 7
      return 99
    }
    return rank(a) - rank(b) || a.localeCompare(b)
  })
  for (const key of groupOrder) {
    const arr = groups.get(key)!
    arr.sort((a, b) => a.email.localeCompare(b.email))
    const note = key.includes("'test'") ? '   ← review this bucket carefully' : ''
    console.log(`\n  ${key} (${arr.length}):${note}`)
    for (const d of arr) {
      const extras = d.allRules.filter((r) => r !== d.primaryRule)
      const tail = extras.length ? `   [+ ${extras.join(', ')}]` : ''
      console.log(`    - ${d.email}${tail}`)
    }
  }

  // Reason breakdown summary
  console.log('\nReason breakdown:')
  for (const key of groupOrder) {
    console.log(`  ${key}: ${groups.get(key)!.length}`)
  }

  console.log(
    `\nSummary: ${toDelete.length} to delete, ${toKeep.length} to keep, total ${users.length}.`
  )

  if (!deleteMode) {
    console.log('\nDry-run only. To execute deletion:')
    console.log('  npm run cleanup:auth-users -- --delete')
    return
  }

  // ---------- delete pass ----------
  console.log(`\nAbout to delete ${toDelete.length} auth users. Proceeding…\n`)
  let ok = 0
  const failures: { email: string; message: string }[] = []
  for (const d of toDelete) {
    const { error } = await supabase.auth.admin.deleteUser(d.id)
    if (error) {
      console.error(`  ✗ failed: ${d.email} — ${error.message}`)
      failures.push({ email: d.email, message: error.message })
    } else {
      console.log(`  ✓ deleted: ${d.email}`)
      ok += 1
    }
  }
  console.log(`\nDeleted: ${ok}`)
  console.log(`Failed:  ${failures.length}`)
  if (failures.length > 0) {
    for (const f of failures) {
      console.log(`  - ${f.email}: ${f.message}`)
    }
    process.exit(1)
  }
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e)
  console.error(`Unexpected error: ${msg}`)
  process.exit(1)
})
