'use client'

import { useState } from 'react'
import WarmupSection from './WarmupSection'

interface WarmupProblem {
  prompt: string
  answer: string
  type: string
}

interface Props {
  warmupProblems: WarmupProblem[]
  warmupTopicLabel: string
  hasWarmup: boolean
}

export default function StuckSupportCard({ warmupProblems, warmupTopicLabel, hasWarmup }: Props) {
  const [showWarmup, setShowWarmup] = useState(false)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-amber-900">Need a little help?</p>
        <p className="mt-1 text-xs text-amber-800">
          It&apos;s okay if this topic feels hard — that means you&apos;re working on something important.
          The <span className="font-semibold">Learn</span> card above has the worked example.
          {hasWarmup && ' You can also try a quick warm-up below to build confidence.'}
        </p>
      </div>

      {hasWarmup && !showWarmup && (
        <button
          onClick={() => setShowWarmup(true)}
          className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
        >
          Try warm-up problems first
        </button>
      )}

      {hasWarmup && showWarmup && (
        <WarmupSection problems={warmupProblems} warmupTopicLabel={warmupTopicLabel} />
      )}
    </div>
  )
}
