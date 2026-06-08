'use client'

import { useEffect, useRef, useState } from 'react'
import { SignToggle, magInputClass, onlyDigits, type Sign } from './signToggle'

interface Props {
  // A single hidden input carries the canonical "x = 3, y = -2" string so
  // submitWorksheet / gradeAnswer (sim-eq pair path) stay untouched.
  name: string
  onValueChange?: (canonical: string) => void
}

// Build "x = 3, y = -2" exactly as the generators emit it (simultaneous-equations.ts
// and graphing.ts both use `x = ${x}, y = ${y}`). Returns '' ("no answer") only when a
// field is blank — magnitude 0 is a VALID coordinate (axis points like x = 0, y = 3).
function buildCanonical(xSign: Sign, xMag: string, ySign: Sign, yMag: string): string {
  if (xMag === '' || yMag === '') return ''
  const xAbs = Number(xMag)
  const yAbs = Number(yMag)
  if (!Number.isFinite(xAbs) || !Number.isFinite(yAbs)) return ''
  // Never emit "-0": force a positive zero.
  const x = xAbs === 0 ? 0 : xSign === '-' ? -xAbs : xAbs
  const y = yAbs === 0 ? 0 : ySign === '-' ? -yAbs : yAbs
  return `x = ${x}, y = ${y}`
}

export default function CoordinatePairInput({ name, onValueChange }: Props) {
  const [xSign, setXSign] = useState<Sign>('+')
  const [xMag, setXMag] = useState('')
  const [ySign, setYSign] = useState<Sign>('+')
  const [yMag, setYMag] = useState('')

  const canonical = buildCanonical(xSign, xMag, ySign, yMag)

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
        <span>x =</span>
        <SignToggle value={xSign} onChange={setXSign} label="x sign" />
        <input
          type="text"
          inputMode="numeric"
          value={xMag}
          onChange={(e) => setXMag(onlyDigits(e.target.value))}
          placeholder="x"
          aria-label="x value"
          autoComplete="off"
          className={magInputClass}
        />
        <span className="ml-1">y =</span>
        <SignToggle value={ySign} onChange={setYSign} label="y sign" />
        <input
          type="text"
          inputMode="numeric"
          value={yMag}
          onChange={(e) => setYMag(onlyDigits(e.target.value))}
          placeholder="y"
          aria-label="y value"
          autoComplete="off"
          className={magInputClass}
        />
      </div>
      <p className="mt-2 text-xs text-[#4a6b4e]">Fill in the x and y values.</p>
    </div>
  )
}
