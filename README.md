# MathStep

A math learning app for kids. Parents create an account, add a student, and the student works through a structured curriculum of math levels with streak and points tracking.

---

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript 5**
- **Tailwind CSS v4**
- **Supabase** — Postgres database + Auth

---

## Local Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**

Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get these from your Supabase project → Settings → API.

**3. Set up the database**

Run the SQL in `supabase/schema.sql` via the Supabase SQL editor (Dashboard → SQL Editor → New query).

The `levels` table must also be seeded with curriculum data separately.

**4. Run the dev server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

---

## Current Build Status

Auth, onboarding, and dashboard with curriculum data layer are complete and Playwright-tested.
Practice session flow is the next milestone.

See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for full architecture and implementation details.
See [BUILD_PROGRESS.md](./BUILD_PROGRESS.md) for completed milestones and test results.
