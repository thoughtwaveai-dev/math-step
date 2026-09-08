'use client'

import { useEffect, useRef, useState } from 'react'
import { formatQuadratic } from '@/lib/math/generators/double-brackets'
import { SignToggle, magInputClass, onlyDigits, type Sign } from './signToggle'

interface Props {
  // The form field name, e.g. "answer_dbr161_1". A single hidden input carries the
  // canonical answer string so submitWorksheet / gradeAnswer stay untouched.
  name: string
  // Optional callback for controlled surfaces (PracticeForm) that grade client-side
  // and need the canonical string in their own state.
  onValueChange?: (canonical: string) => void
}

// Build "x2 + 8x + 15" through the generator's own formatQuadratic, so the control
// and the generator can never drift apart. Returns '' ("no answer") when a field is
// blank or the x coefficient is 0 - the generator never produces a 0 x term.
function buildCanonical(bSign: Sign, bMag: string, cSign: Sign, cMag: string): string {
  if (bMag === '' || cMag === '') return ''
  const bAbs = Number(bMag)
  const cAbs = Number(cMag)
  if (!Number.isFinite(bAbs) || !Number.isFinite(cAbs)) return ''
  if (bAbs === 0) return ''
  return formatQuadratic(bSign === '-' ? -bAbs : bAbs, cSign === '-' ? -cAbs : cAbs)
}

export default function QuadraticExpressionInput({ name, onValueChange }: Props) {
  const [bSign, setBSign] = useState<Sign>('+')
  const [bMag, setBMag] = useState('')
  const [cSign, setCSign] = useState<Sign>('+')
  const [cMag, setCMag] = useState('')

  const canonical = buildCanonical(bSign, bMag, cSign, cMag)

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
        <span>x&sup2;</span>
        <SignToggle value={bSign} onChange={setBSign} label="x term sign" />
        <input
          type="text"
          inputMode="numeric"
          value={bMag}
          onChange={(e) => setBMag(onlyDigits(e.target.value))}
          placeholder="b"
          aria-label="number in front of x"
          autoComplete="off"
          className={magInputClass}
        />
        <span>x</span>
        <SignToggle value={cSign} onChange={setCSign} label="constant sign" />
        <input
          type="text"
          inputMode="numeric"
          value={cMag}
          onChange={(e) => setCMag(onlyDigits(e.target.value))}
          placeholder="c"
          aria-label="constant number"
          autoComplete="off"
          className={magInputClass}
        />
      </div>
      <p className="mt-2 text-xs text-[#4a6b4e]">Fill in the x term and the last number.</p>
    </div>
  )
}
