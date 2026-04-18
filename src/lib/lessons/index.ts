export interface Lesson {
  title: string
  explanation: string
  example: {
    problem: string
    steps: string[]
    answer: string
  }
  tip: string
}

type LessonKey = string

const lessons: Record<LessonKey, Lesson> = {
  '1/1': {
    title: 'Single-Digit Addition',
    explanation: 'Adding two small numbers together gives you a total. Count up from the first number by the second number.',
    example: {
      problem: '6 + 3 = ?',
      steps: [
        'Start with 6',
        'Count up 3 more: 7, 8, 9',
        '6 + 3 = 9',
      ],
      answer: '9',
    },
    tip: 'You can always switch the order — 3 + 6 gives the same answer as 6 + 3!',
  },
  '1/2': {
    title: 'Double-Digit Addition',
    explanation: 'When adding bigger numbers, add the ones column first, then the tens column. If the ones add up to 10 or more, carry the extra ten over.',
    example: {
      problem: '27 + 35 = ?',
      steps: [
        'Ones column: 7 + 5 = 12 → write 2, carry 1',
        'Tens column: 2 + 3 = 5, plus the 1 carried = 6',
        '27 + 35 = 62',
      ],
      answer: '62',
    },
    tip: 'Line up your numbers so the ones are under ones and tens are under tens — it makes carrying much easier!',
  },
  '2/1': {
    title: 'Single-Digit Subtraction',
    explanation: 'Subtraction means taking away. Start with the first number and count backwards by the second number.',
    example: {
      problem: '9 - 4 = ?',
      steps: [
        'Start with 9',
        'Count back 4: 8, 7, 6, 5',
        '9 - 4 = 5',
      ],
      answer: '5',
    },
    tip: 'If you know your addition facts, subtraction is easy — 5 + 4 = 9, so 9 - 4 = 5!',
  },
  '2/2': {
    title: 'Double-Digit Subtraction',
    explanation: 'Subtract the ones column first, then the tens column. If the top ones digit is smaller than the bottom, borrow a ten from the tens column.',
    example: {
      problem: '52 - 27 = ?',
      steps: [
        'Ones column: 2 is less than 7, so borrow from tens',
        '12 - 7 = 5 (ones digit)',
        'Tens column: 4 - 2 = 2 (after lending 1)',
        '52 - 27 = 25',
      ],
      answer: '25',
    },
    tip: 'After borrowing, remember to reduce the tens digit by 1 before you subtract the tens column!',
  },
  '3/1': {
    title: 'Multiplication Facts',
    explanation: 'Multiplication is a fast way to add the same number many times. 3 × 4 means "three groups of four" — the same as 4 + 4 + 4.',
    example: {
      problem: '4 × 6 = ?',
      steps: [
        'Think: 4 groups of 6',
        '6 + 6 = 12 (two groups)',
        '12 + 12 = 24 (four groups)',
        '4 × 6 = 24',
      ],
      answer: '24',
    },
    tip: 'The order doesn\'t matter — 4 × 6 = 6 × 4 = 24. Use whichever you know better!',
  },
  '4/1': {
    title: 'Division Facts',
    explanation: 'Division means splitting a number into equal groups. If 3 × 4 = 12, then 12 ÷ 3 = 4 and 12 ÷ 4 = 3. Knowing your multiplication facts makes division easy!',
    example: {
      problem: '35 ÷ 7 = ?',
      steps: [
        'Ask: what number times 7 equals 35?',
        '7 × 5 = 35',
        'So 35 ÷ 7 = 5',
      ],
      answer: '5',
    },
    tip: 'Division is the reverse of multiplication — think of each division problem as a missing multiplication fact!',
  },
  '4/2': {
    title: 'Long Division',
    explanation: 'Long division splits a larger number by a one-digit number. Work through the digits from left to right: divide, multiply, subtract, then bring down the next digit.',
    example: {
      problem: '96 ÷ 4 = ?',
      steps: [
        'How many times does 4 go into 9? → 2 times (2 × 4 = 8)',
        'Write 2 above the 9. Subtract: 9 - 8 = 1',
        'Bring down the 6 → now you have 16',
        'How many times does 4 go into 16? → 4 times (4 × 4 = 16)',
        '96 ÷ 4 = 24',
      ],
      answer: '24',
    },
    tip: 'Check your answer by multiplying: 24 × 4 = 96 ✓. If it matches, you\'re correct!',
  },
  '3/2': {
    title: 'Multi-Digit Multiplication',
    explanation: 'To multiply a two-digit number by a one-digit number, split the big number into tens and ones, multiply each part, then add the results together.',
    example: {
      problem: '14 × 3 = ?',
      steps: [
        'Split 14 into 10 + 4',
        '10 × 3 = 30',
        '4 × 3 = 12',
        '30 + 12 = 42',
      ],
      answer: '42',
    },
    tip: 'This is called the distributive property — breaking a big multiplication into smaller, easier ones!',
  },
  '9/2': {
    title: 'Factor Pairs and Common Factors',
    explanation: 'A factor pair is two numbers that multiply together to make a target number. Common factors are factors that two numbers share. The greatest common factor (GCF) is the largest one they share.',
    example: {
      problem: 'List all factor pairs of 12, then find the GCF of 12 and 18.',
      steps: [
        'Factor pairs of 12: 1×12, 2×6, 3×4',
        'Factors of 12: 1, 2, 3, 4, 6, 12',
        'Factors of 18: 1, 2, 3, 6, 9, 18',
        'Common factors: 1, 2, 3, 6',
        'Greatest common factor: 6',
      ],
      answer: 'GCF = 6',
    },
    tip: 'For factor pairs, always start with 1×N and work inward. Stop when the two numbers in the pair meet or cross!',
  },
  '10/2': {
    title: 'Variables on Both Sides',
    explanation: 'When an equation has x on both sides, collect all the x terms on one side and all the numbers on the other. Subtract the smaller x term from both sides first, then solve as normal.',
    example: {
      problem: '3x - 4 = x + 10',
      steps: [
        'Subtract x from both sides: 3x - x - 4 = 10 → 2x - 4 = 10',
        'Add 4 to both sides: 2x = 14',
        'Divide both sides by 2: x = 7',
        'Check: 3(7) - 4 = 17 and 7 + 10 = 17 ✓',
      ],
      answer: 'x = 7',
    },
    tip: 'Always move the smaller x term to avoid negatives — subtract it from both sides so the x coefficient stays positive!',
  },
  '10/1': {
    title: 'Linear Equations',
    explanation: 'A linear equation has one unknown, usually called x. Your goal is to find the value of x that makes the equation true. Whatever you do to one side of the equals sign, you must do to the other side too.',
    example: {
      problem: '2x + 5 = 13',
      steps: [
        'We want x on its own',
        'Subtract 5 from both sides: 2x + 5 − 5 = 13 − 5 → 2x = 8',
        'Divide both sides by 2: 2x ÷ 2 = 8 ÷ 2 → x = 4',
        'Check: 2(4) + 5 = 8 + 5 = 13 ✓',
      ],
      answer: 'x = 4',
    },
    tip: 'Always check your answer by substituting x back into the original equation — if both sides match, you\'re right!',
  },
  '11/1': {
    title: 'One-Variable Inequalities',
    explanation: 'An inequality is like an equation but uses >, <, >= (greater than or equal), or <= (less than or equal) instead of =. Solve it the same way as an equation — but if you multiply or divide by a negative number, flip the direction of the inequality sign.',
    example: {
      problem: '2x ≤ 10',
      steps: [
        'Divide both sides by 2: x ≤ 5',
        'The solution is all values of x that are 5 or less',
        'Write your answer as: x <= 5',
      ],
      answer: 'x <= 5',
    },
    tip: 'Use >= for ≥ and <= for ≤ when typing your answer. No Unicode needed — just two characters!',
  },
  '5/1': {
    title: 'Fractions: Addition & Subtraction',
    explanation: 'A fraction like 3/4 means "3 out of 4 equal parts". To add or subtract fractions, the denominators (bottom numbers) must be the same. If they already match, just add or subtract the numerators and keep the denominator. If they are different, find a common denominator first, then add or subtract. Always simplify your answer — divide the top and bottom by their greatest common factor.',
    example: {
      problem: '1/4 + 2/4 = ?',
      steps: [
        'The denominators are both 4 — they already match!',
        'Add the numerators: 1 + 2 = 3',
        'Keep the denominator: 3/4',
        'Check if it simplifies: 3 and 4 share no common factor, so 3/4 is already simplified',
      ],
      answer: '3/4',
    },
    tip: 'Unlike denominators? Find the smallest number both denominators divide into (that\'s the LCM), convert each fraction, then add or subtract. For example: 1/2 + 1/3 → use denominator 6 → 3/6 + 2/6 = 5/6.',
  },
  '5/2': {
    title: 'Fractions: Multiplication & Division',
    explanation: 'To multiply fractions, multiply the numerators together and the denominators together, then simplify. To divide fractions, flip the second fraction (take its reciprocal) and multiply — this is sometimes called "keep, change, flip". Always simplify your answer by dividing the top and bottom by their greatest common factor.',
    example: {
      problem: '2/3 ÷ 1/6 = ?',
      steps: [
        'Keep the first fraction: 2/3',
        'Change ÷ to ×',
        'Flip the second fraction: 1/6 becomes 6/1',
        'Multiply: 2/3 × 6/1 = (2×6)/(3×1) = 12/3',
        'Simplify: 12 ÷ 3 = 4',
      ],
      answer: '4',
    },
    tip: 'For multiplication: 1/2 × 2/3 = 2/6 = 1/3. For division: remember "keep, change, flip" — keep the first fraction, change ÷ to ×, flip the second fraction.',
  },
  '6/1': {
    title: 'Decimals: Addition, Subtraction & Multiplication',
    explanation: 'A decimal number uses a dot (called the decimal point) to show parts smaller than one. The digit after the dot is tenths (0.1 = one tenth). Line up the decimal points when adding or subtracting — then it works just like whole numbers. To multiply a decimal by a whole number, ignore the dot, multiply, then put the dot back in the right place.',
    example: {
      problem: '2.4 + 1.3 = ?',
      steps: [
        'Line up the decimal points',
        'Add the tenths column: 4 + 3 = 7',
        'Add the ones column: 2 + 1 = 3',
        '2.4 + 1.3 = 3.7',
      ],
      answer: '3.7',
    },
    tip: 'Always line up the decimal points before adding or subtracting — the dot must stay directly above or below the other dot. For multiplication: 2.5 × 3 → think 25 × 3 = 75, then move the dot one place left → 7.5.',
  },
  '6/2': {
    title: 'Percentages: Basics & Conversions',
    explanation: 'A percentage is a number out of 100. "25%" means 25 out of 100, or 25/100. Percentages show up everywhere — sale discounts, test scores, tips at restaurants. To find a percentage of a number, convert the percentage to a decimal first (move the decimal point two places left), then multiply. To convert a fraction to a percent, ask: what is the equivalent fraction with denominator 100?',
    example: {
      problem: 'What is 25% of 80?',
      steps: [
        'Convert 25% to a decimal: 25 ÷ 100 = 0.25',
        'Multiply: 0.25 × 80 = 20',
        'Answer: 25% of 80 = 20',
        'Quick check: 25% is a quarter, and 80 ÷ 4 = 20 ✓',
      ],
      answer: '20',
    },
    tip: 'Memorise the big ones: 10% = ÷10, 50% = ÷2, 25% = ÷4, 75% = ÷4×3. These shortcuts are faster than any calculator!',
  },
  '7/1': {
    title: 'Negative Numbers',
    explanation: 'Numbers can go below zero. Think of a number line stretching left and right — positive numbers are to the right of zero, negative numbers are to the left. A negative number has a minus sign in front: −5 means "five below zero". The further left you go, the smaller the number (so −8 is less than −3). When you add a negative, you move left. When you subtract a negative, the two minuses cancel and you move right.',
    example: {
      problem: '4 − (−3) = ?',
      steps: [
        'Subtracting a negative is the same as adding a positive',
        '4 − (−3) = 4 + 3',
        '4 + 3 = 7',
      ],
      answer: '7',
    },
    tip: 'Sign rules to memorise: (+) × (+) = +, (−) × (−) = +, (+) × (−) = −. Two negatives multiplied or divided always give a positive!',
  },
  '9/1': {
    title: 'Factorization',
    explanation: 'Factors are numbers that divide evenly into another number. Prime factorization breaks a number down into its prime building blocks. GCF (Greatest Common Factor) is the biggest factor shared by two numbers. LCM (Least Common Multiple) is the smallest number both can divide into.',
    example: {
      problem: 'Prime factorization of 12',
      steps: [
        '12 ÷ 2 = 6',
        '6 ÷ 2 = 3',
        '3 is prime — stop here',
        '12 = 2 × 2 × 3',
      ],
      answer: '2 × 2 × 3',
    },
    tip: 'Always start dividing by the smallest prime (2), then 3, then 5, and so on until you can\'t divide any further.',
  },
}

export function getLesson(level: number, sublevel: number): Lesson | null {
  return lessons[`${level}/${sublevel}`] ?? null
}
