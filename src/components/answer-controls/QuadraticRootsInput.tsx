'use client'

import { useEffect, useRef, useState } from 'react'
import { formatRoots } from '@/lib/math/generators/solving-quadratics'
import { SignToggle, magInputClass, onlyDigits, type Sign } from './signToggle'

interface Props {
  // The form field name, e.g. "answer_sq171_1". A single hidden input carries the
  // canonical answer string so submitWorksheet / gradeAnswer stay untouched.
  name: string
  // Optional callback for controlled surfaces (PracticeForm) that grade client-side
  // and need the canonical string in their own state.
  onValueChange?: (canonical: string) => void
}

// Build "x = -5 or x = 3" through the generator's own formatRoots, which puts the
// smaller root first, so the student can fill the two answers in either order.
// Returns '' ("no answer") only when a field is blank. A 0 is passed through (never
// as "-0"); the generator never produces a 0 root, so it just grades wrong.
function buildCanonical(aSign: Sign, aMag: string, bSign: Sign, bMag: string): string {
  if (aMag === '' || bMag === '') return ''
  const aAbs = Number(aMag)
  const bAbs = Number(bMag)
  if (!Number.isFinite(aAbs) || !Number.isFinite(bAbs)) return ''
  const a = aAbs === 0 ? 0 : aSign === '-' ? -aAbs : aAbs
  const b = bAbs === 0 ? 0 : bSign === '-' ? -bAbs : bAbs
  return formatRoots(a, b)
}

export default function QuadraticRootsInput({ name, onValueChange }: Props) {
  const [aSign, setASign] = useState<Sign>('+')
  const [aMag, setAMag] = useState('')
  const [bSign, setBSign] = useState<Sign>('+')
  const [bMag, setBMag] = useState('')

  const canonical = buildCanonical(aSign, aMag, bSign, bMag)

  // Fire onValueChange only when the canonical string actually changes - use a ref so a
  // changing parent-callback identity (inline arrow) can't retrigger and cause a loop.
  const cb = useRef(onValueChange)
  useEffect(() => {
    cb.current = onValueChange
  }, [onValueChange])
  useEffect(() => {
    cb.current?.(canonical)
  }, [canonical])

  return (
    <div>
      <input type="hidden" name={name} value={canonical} />
      <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-[#1a2e1c]">
        <span className="inline-flex items-center gap-2">
          <span>x =</span>
          <SignToggle value={aSign} onChange={setASign} label="first answer sign" />
          <input
            type="text"
            inputMode="numeric"
            value={aMag}
            onChange={(e) => setAMag(onlyDigits(e.target.value))}
            placeholder="a"
            aria-label="first answer number"
            autoComplete="off"
            className={magInputClass}
          />
        </span>
        <span className="inline-flex items-center gap-2">
          <span>or x =</span>
          <SignToggle value={bSign} onChange={setBSign} label="second answer sign" />
          <input
            type="text"
            inputMode="numeric"
            value={bMag}
            onChange={(e) => setBMag(onlyDigits(e.target.value))}
            placeholder="b"
            aria-label="second answer number"
            autoComplete="off"
            className={magInputClass}
          />
        </span>
      </div>
      <p className="mt-2 text-xs text-[#4a6b4e]">Fill in both answers. The order does not matter.</p>
    </div>
  )
}
