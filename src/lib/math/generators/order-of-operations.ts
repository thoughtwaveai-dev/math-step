import { randInt } from './rand'

export type OrderOfOperationsProblemType =
  | 'order_add_mul'   // e.g. 3 + 4 × 2 (do × first)
  | 'order_sub_mul'   // e.g. 12 - 2 × 4 (do × first)
  | 'order_div_add'   // e.g. 18 ÷ 3 + 5 (do ÷ first)
  | 'order_paren'     // e.g. (3 + 4) × 2 (do parens first)

export interface OrderOfOperationsProblem {
  id: string
  type: OrderOfOperationsProblemType
  prompt: string
  answer: string
}

function generateOneProblem(
  rand: () => number
): { type: OrderOfOperationsProblemType; prompt: string; answer: string } | null {
  const pick = rand()

  if (pick < 0.25) {
    // a + b × c — multiply b×c first, then add a
    const b = randInt(2, 9, rand)
    const c = randInt(2, 9, rand)
    const a = randInt(1, 15, rand)
    const answer = a + b * c
    if (answer > 100) return null
    return {
      type: 'order_add_mul',
      prompt: `${a} + ${b} × ${c} = ?`,
      answer: answer.toString(),
    }
  }

  if (pick < 0.50) {
    // a - b × c — multiply first; keep answer positive
    const b = randInt(2, 6, rand)
    const c = randInt(2, 6, rand)
    const product = b * c
    const a = randInt(product + 1, product + 20, rand)
    const answer = a - product
    return {
      type: 'order_sub_mul',
      prompt: `${a} - ${b} × ${c} = ?`,
      answer: answer.toString(),
    }
  }

  if (pick < 0.75) {
    // dividend ÷ divisor + c — divide first; integer quotient guaranteed
    const divisor = randInt(2, 9, rand)
    const quotient = randInt(2, 9, rand)
    const dividend = divisor * quotient
    const c = randInt(1, 12, rand)
    const answer = quotient + c
    return {
      type: 'order_div_add',
      prompt: `${dividend} ÷ ${divisor} + ${c} = ?`,
      answer: answer.toString(),
    }
  }

  // (a op b) × c — parens change the order
  const useAdd = rand() < 0.5
  const c = randInt(2, 9, rand)
  if (useAdd) {
    // (a + b) × c
    const a = randInt(1, 10, rand)
    const b = randInt(1, 10, rand)
    const answer = (a + b) * c
    if (answer > 100) return null
    return {
      type: 'order_paren',
      prompt: `(${a} + ${b}) × ${c} = ?`,
      answer: answer.toString(),
    }
  } else {
    // (a - b) × c — keep a > b so result is positive
    const b = randInt(1, 8, rand)
    const a = randInt(b + 1, b + 10, rand)
    const answer = (a - b) * c
    if (answer > 100) return null
    return {
      type: 'order_paren',
      prompt: `(${a} - ${b}) × ${c} = ?`,
      answer: answer.toString(),
    }
  }
}

export function generateOrderOfOperationsProblems(
  count = 10,
  rand: () => number = Math.random
): OrderOfOperationsProblem[] {
  const problems: OrderOfOperationsProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateOneProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `ops72_${problems.length + 1}`, ...p })
  }

  return problems
}
