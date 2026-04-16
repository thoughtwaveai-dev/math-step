import type { Lesson } from '@/lib/lessons'

interface Props {
  lesson: Lesson
}

export default function LessonCard({ lesson }: Props) {
  return (
    <details
      open
      className="group rounded-2xl border border-[#bae0bd] bg-white overflow-hidden"
    >
      <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 hover:bg-[#f2faf3] transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2d6a35] text-xs font-bold text-white">
            ?
          </span>
          <span className="text-base font-bold text-[#1a2e1c]">Learn: {lesson.title}</span>
        </div>
        <span className="text-[#4a6b4e] text-sm group-open:hidden">Show</span>
        <span className="text-[#4a6b4e] text-sm hidden group-open:inline">Hide</span>
      </summary>

      <div className="border-t border-[#e8f4e9] px-5 pb-5 pt-4 space-y-4">
        {/* Explanation */}
        <p className="text-sm text-[#2d4a31] leading-relaxed">{lesson.explanation}</p>

        {/* Worked example */}
        <div className="rounded-xl bg-[#f2faf3] border border-[#bae0bd] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#2d6a35]">Worked Example</span>
          </div>
          <p className="text-base font-semibold text-[#1a2e1c]">{lesson.example.problem}</p>
          <ol className="space-y-1.5">
            {lesson.example.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#2d4a31]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#bae0bd] text-xs font-bold text-[#2d6a35]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="rounded-lg bg-[#2d6a35] px-3.5 py-2 text-sm font-semibold text-white inline-block">
            Answer: {lesson.example.answer}
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-base leading-none mt-0.5">💡</span>
          <p className="text-sm text-amber-900 leading-relaxed">{lesson.tip}</p>
        </div>
      </div>
    </details>
  )
}
