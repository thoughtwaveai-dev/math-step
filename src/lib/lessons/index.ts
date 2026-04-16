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
