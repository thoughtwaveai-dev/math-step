// Seeded PRNG (mulberry32) — lets tests pass a deterministic rand function.
// Production callers pass nothing; generators default to Math.random.
export function seededRand(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

export function randInt(min: number, max: number, rand: () => number = Math.random): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

// Fisher-Yates shuffle; returns a new array.
export function shuffled<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
