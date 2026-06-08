'use client'

import { useEffect, useRef, useState } from 'react'
import { SignToggle, magInputClass, onlyDigits, type Sign } from './signToggle'

interface Props {
  // The form field name, e.g. "answer_lin131_1". A single hidden input carries the
  // canonical answer string so submitWorksheet / gradeAnswer stay untouched.
  name: string
  // Optional callback for controlled surfaces (PracticeForm) that grade client-side
  // and need the canonical string in their own state.
  onValueChange?: (canonical: string) => void
}

// Build the canonical "y = mx + b" string exactly as the generator's formatEquation does
// (with spaces) so the stored answer matches the correct answer on the results page and
// grades via the existing algebraic path. Returns '' (treated as "no answer") when a field
// is blank or the slope magnitude is 0 — the generator never produces slope 0.
function buildCanonical(mSign: Sign, mMag: string, bSign: Sign, bMag: string): string {
  if (mMag === '' || bMag === '') return ''
  const mAbs = Number(mMag)
  const bAbs = Number(bMag)
  if (!Number.isFinite(mAbs) || !Number.isFinite(bAbs)) return ''
  if (mAbs === 0) return ''
  const m = mSign === '-' ? -mAbs : mAbs
  const b = bSign === '-' ? -bAbs : bAbs
  return `y = ${m}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`
}

export default function EquationSlopeInterceptInput({ name, onValueChange }: Props) {
  const [mSign, setMSign] = useState<Sign>('+')
  const [mMag, setMMag] = useState('')
  const [bSign, setBSign] = useState<Sign>('+')
  const [bMag, setBMag] = useState('')

  const canonical = buildCanonical(mSign, mMag, bSign, bMag)

  // Fire onValueChange only when the canonical string actually changes — use a ref so a
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
        <span>y =</span>
        <SignToggle value={mSign} onChange={setMSign} label="slope sign" />
        <input
          type="text"
          inputMode="numeric"
          value={mMag}
          onChange={(e) => setMMag(onlyDigits(e.target.value))}
          placeholder="m"
          aria-label="slope"
          autoComplete="off"
          className={magInputClass}
        />
        <span>x</span>
        <SignToggle value={bSign} onChange={setBSign} label="y-intercept sign" />
        <input
          type="text"
          inputMode="numeric"
          value={bMag}
          onChange={(e) => setBMag(onlyDigits(e.target.value))}
          placeholder="b"
          aria-label="y-intercept"
          autoComplete="off"
          className={magInputClass}
        />
      </div>
      <p className="mt-2 text-xs text-[#4a6b4e]">Fill in the slope and y-intercept.</p>
    </div>
  )
}
