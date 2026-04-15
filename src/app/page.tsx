import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900">MathStep</h1>
      <p className="mb-8 text-zinc-500">Step-by-step math learning.</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
