'use client'

import { useState } from 'react'

interface Props {
  // The form field name, e.g. "answer_lin131_1". A single hidden input carries the
  // canonical answer string so submitWorksheet / gradeAnswer stay untouched.
  name: string
}

type Sign = '+' | '-'

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

const magInputClass =
  'w-14 rounded-lg border border-[#bae0bd] px-2 py-2.5 text-center text-base text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]'

function SignToggle({
  value,
  onChange,
  label,
}: {
  value: Sign
  onChange: (s: Sign) => void
  label: string
}) {
  return (
    <span className="inline-flex overflow-hidden rounded-lg border border-[#bae0bd]" role="group" aria-label={label}>
      {(['+', '-'] as Sign[]).map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={`w-9 py-2.5 text-base font-bold transition-colors ${
            value === s ? 'bg-[#2d6a35] text-white' : 'bg-white text-[#2d6a35] hover:bg-[#f2faf3]'
          }`}
        >
          {s === '-' ? '−' : '+'}
        </button>
      ))}
    </span>
  )
}

export default function EquationAnswerInput({ name }: Props) {
  const [mSign, setMSign] = useState<Sign>('+')
  const [mMag, setMMag] = useState('')
  const [bSign, setBSign] = useState<Sign>('+')
  const [bMag, setBMag] = useState('')

  const canonical = buildCanonical(mSign, mMag, bSign, bMag)

  // Digits only — strip anything else so the numeric pad can never inject a stray char.
  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '')

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
