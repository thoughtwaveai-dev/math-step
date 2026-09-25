'use client'

import { useEffect, useRef, useState } from 'react'
import { formatBracketPair } from '@/lib/math/generators/factorising-quadratics'
import { SignToggle, magInputClass, onlyDigits, type Sign } from './signToggle'

interface Props {
  // The form field name, e.g. "answer_fq162_1". A single hidden input carries the
  // canonical answer string so submitWorksheet / gradeAnswer stay untouched.
  name: string
  // Optional callback for controlled surfaces (PracticeForm) that grade client-side
  // and need the canonical string in their own state.
  onValueChange?: (canonical: string) => void
}

// Build "(x + 3)(x + 5)" through the generator's own formatBracketPair, which also
// sorts the two brackets into one canonical order, so the student can fill them in
// either way round. Returns '' ("no answer") when a field is blank or a bracket
// number is 0 - the generator never produces a 0.
function buildCanonical(pSign: Sign, pMag: string, qSign: Sign, qMag: string): string {
  if (pMag === '' || qMag === '') return ''
  const pAbs = Number(pMag)
  const qAbs = Number(qMag)
  if (!Number.isFinite(pAbs) || !Number.isFinite(qAbs)) return ''
  if (pAbs === 0 || qAbs === 0) return ''
  return formatBracketPair(pSign === '-' ? -pAbs : pAbs, qSign === '-' ? -qAbs : qAbs)
}

export default function BracketPairInput({ name, onValueChange }: Props) {
  const [pSign, setPSign] = useState<Sign>('+')
  const [pMag, setPMag] = useState('')
  const [qSign, setQSign] = useState<Sign>('+')
  const [qMag, setQMag] = useState('')

  const canonical = buildCanonical(pSign, pMag, qSign, qMag)

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
          <span>(x</span>
          <SignToggle value={pSign} onChange={setPSign} label="first bracket sign" />
          <input
            type="text"
            inputMode="numeric"
            value={pMag}
            onChange={(e) => setPMag(onlyDigits(e.target.value))}
            placeholder="p"
            aria-label="first bracket number"
            autoComplete="off"
            className={magInputClass}
          />
          <span>)</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span>(x</span>
          <SignToggle value={qSign} onChange={setQSign} label="second bracket sign" />
          <input
            type="text"
            inputMode="numeric"
            value={qMag}
            onChange={(e) => setQMag(onlyDigits(e.target.value))}
            placeholder="q"
            aria-label="second bracket number"
            autoComplete="off"
            className={magInputClass}
          />
          <span>)</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-[#4a6b4e]">Fill in the number in each bracket. The order does not matter.</p>
    </div>
  )
}
