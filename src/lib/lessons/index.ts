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
  '7/2': {
    title: 'Order of Operations',
    explanation: 'When a calculation has more than one operation, you must follow a specific order — otherwise different people get different answers! The rule is: Brackets first, then Multiplication and Division (left to right), then Addition and Subtraction (left to right). A handy way to remember: BODMAS (Brackets, Orders, Division, Multiplication, Addition, Subtraction). The key insight: multiplication and division are done before addition and subtraction, unless brackets say otherwise.',
    example: {
      problem: '3 + 4 × 2 = ?',
      steps: [
        'Multiplication comes before addition',
        'Do 4 × 2 first: 4 × 2 = 8',
        'Now add: 3 + 8 = 11',
        'Answer: 11 (not 14, which would be wrong)',
      ],
      answer: '11',
    },
    tip: 'Brackets always win! If you see (3 + 4) × 2, do the brackets first: 7 × 2 = 14. Without brackets, 3 + 4 × 2 = 11. The brackets completely change the answer.',
  },
  '8/1': {
    title: 'Simplifying Expressions',
    explanation: 'An algebraic expression has numbers and letters (called variables). The letter stands for an unknown number. "Like terms" are terms that have the same variable — you can add or subtract them just like regular numbers. Terms with different variables, or a variable and a plain number, are unlike terms and must stay separate. Simplifying means collecting all like terms together to write the expression in its shortest form.',
    example: {
      problem: '2x + 3 + x + 4 = ?',
      steps: [
        'Identify the variable terms: 2x and x',
        'Combine them: 2x + x = 3x',
        'Identify the constant terms: 3 and 4',
        'Combine them: 3 + 4 = 7',
        'Write the simplified expression: 3x + 7',
      ],
      answer: '3x + 7',
    },
    tip: 'Only combine terms that are alike — 3x and 5x can be added (same variable), but 3x and 5 cannot (one has a variable, one does not). Think of x as a mystery box: you can count the boxes, but you cannot mix boxes with plain numbers.',
  },
  '8/2': {
    title: 'One-step Equations',
    explanation: 'An equation is like a balanced scale — both sides must be equal. To solve it, you do one operation to find the value of x. The key idea: whatever you do to one side, do the same to the other side.',
    example: {
      problem: '3x = 12',
      steps: [
        'We need to get x by itself',
        'Both sides are divided by 3',
        '3x ÷ 3 = 12 ÷ 3',
        'x = 4',
      ],
      answer: '4',
    },
    tip: 'Undo the operation to isolate x: if it is added, subtract; if it is multiplied, divide. The answer is just one number — no variables needed!',
  },
  '11/2': {
    title: 'Simultaneous Equations',
    explanation: 'Sometimes you have two unknowns (x and y) and two equations that both hold true at the same time. To solve them, use the elimination method: add or subtract the two equations to cancel out one of the variables. Once you know one variable, substitute it back into either equation to find the other. Always check your answer by substituting both values into both equations.',
    example: {
      problem: 'x + y = 10\nx − y = 2',
      steps: [
        'Add both equations together to eliminate y:',
        '(x + y) + (x − y) = 10 + 2',
        '2x = 12, so x = 6',
        'Substitute x = 6 into the first equation:',
        '6 + y = 10, so y = 4',
        'Check: 6 + 4 = 10 ✓ and 6 − 4 = 2 ✓',
      ],
      answer: 'x = 6, y = 4',
    },
    tip: 'Give your answer with x first, then y — like this: x = 6, y = 4. To check, put both numbers back into both original equations. If both equations balance, your answer is correct!',
  },
  '12/1': {
    title: 'Functions',
    explanation: 'A function is a rule that takes a number in and gives a number out. We write the rule as f(x) — read "f of x". The letter inside the brackets is the input, and the rule on the right tells you what to do with it. To evaluate a function, replace x with the value you are given and work out the answer. Function composition like f(g(x)) means: do g first, then put the result into f. To find the input that gives a certain output, set the rule equal to that output and solve for x.',
    example: {
      problem: 'f(x) = 2x + 3. Find f(4).',
      steps: [
        'Substitute x = 4 into the rule',
        'f(4) = 2 × 4 + 3',
        '= 8 + 3',
        '= 11',
      ],
      answer: '11',
    },
    tip: 'Always replace every x with the input number — even when the input is negative, like f(-2). For composition f(g(c)), do the inside first: work out g(c), then put that result into f.',
  },
  '12/2': {
    title: 'Reading Graphs',
    explanation: 'A coordinate plane has two number lines that cross at zero — the x-axis runs left-right and the y-axis runs up-down. Any point can be described by two numbers: how far across (x) and how far up or down (y). A line on the plane has two things you can read off: its slope (how steep it is, found by rise ÷ run between two points) and its y-intercept (where it crosses the y-axis). To find the y-value for a given x, find that x on the bottom axis, go up or down until you hit the line, then read across to the y-axis.',
    example: {
      problem: 'A point sits 3 to the right and 2 down from the origin.',
      steps: [
        'Across (x) = 3 (positive, right of zero)',
        'Up/down (y) = -2 (negative, below zero)',
        'Coordinates: x = 3, y = -2',
        'Always give x first, then y.',
      ],
      answer: 'x = 3, y = -2',
    },
    tip: 'Slope is how many squares the line goes up (or down) for every one square it moves to the right. Count the gridlines — if the line rises 2 squares per 1 across, the slope is 2. If it falls 2 squares per 1 across, the slope is -2.',
  },
  '13/1': {
    title: 'Linear Equations',
    explanation: 'Every straight line can be written as y = mx + b. The number m is the slope — how many units y rises for every 1 unit x moves right. The number b is the y-intercept — the y-value where the line crosses the y-axis (this is also y when x = 0). When you write the equation of a line, y = mx + b is just the pattern — replace m and b with the numbers from the question. For example, slope 2 and y-intercept 3 gives y = 2x + 3. To check whether a point is on a line, substitute its x and y into the equation: if both sides match, the point is on the line. To find a missing y when you know x, just substitute x and calculate. To find a missing x when you know y, substitute y and solve the one-step equation for x.',
    example: {
      problem: 'For y = 2x + 3, what is y when x = 4?',
      steps: [
        'Start with the equation: y = 2x + 3',
        'Substitute x = 4: y = 2(4) + 3',
        'Multiply first: y = 8 + 3',
        'Add: y = 11',
      ],
      answer: '11',
    },
    tip: 'The y-intercept is just y when x = 0 — you can read it straight off the equation. For slope between two points, count "rise ÷ run": how much y changes, divided by how much x changes.',
  },
  '13/2': {
    title: 'Systems of Equations',
    explanation: 'A system of equations is two equations that must both be true at the same time. The solution is the one pair of values (x and y) that works in both equations. There are two main ways to solve a system. Substitution: when one equation already tells you what a variable equals (like y = x + 2), put that into the other equation so only one variable is left, solve it, then find the other. Elimination: when the equations line up nicely, add or subtract them so one variable cancels out. To check a solution, substitute the x and y into both equations — if both balance, it is the solution.',
    example: {
      problem: 'x + y = 8\nx - y = 2',
      steps: [
        'The y terms are +y and -y — add the equations to eliminate y:',
        '(x + y) + (x - y) = 8 + 2',
        '2x = 10, so x = 5',
        'Substitute x = 5 into the first equation: 5 + y = 8, so y = 3',
        'Check: 5 + 3 = 8 ✓ and 5 - 3 = 2 ✓',
      ],
      answer: 'x = 5, y = 3',
    },
    tip: 'Give your answer with x first, then y — like this: x = 5, y = 3. Always put both values back into both equations to check. If both balance, you have the solution!',
  },
  '14/1': {
    title: 'Inequalities',
    explanation: 'An inequality compares two sides instead of saying they are equal. < means less than, > means greater than, <= means at most (less than or equal), and >= means at least (greater than or equal). You solve an inequality almost exactly like an equation — do the same thing to both sides to get x by itself. There is one special rule: when you multiply or divide both sides by a negative number, flip the inequality sign around.',
    example: {
      problem: '-3x > 12',
      steps: [
        'We want x on its own, so divide both sides by -3',
        'Dividing by a negative means we flip the > sign to <',
        '-3x ÷ -3 = x, and 12 ÷ -3 = -4',
        'x < -4',
      ],
      answer: 'x < -4',
    },
    tip: 'Type <= for ≤ and >= for ≥ — no special symbols needed. Only flip the sign when you multiply or divide by a negative number; adding or subtracting never flips it.',
  },
  '14/2': {
    title: 'Exponents (Powers)',
    explanation: 'A power is a short way of writing repeated multiplication. In 3⁴ the small raised number (4) is the index or power, and it tells you how many 3s to multiply together: 3 × 3 × 3 × 3 = 81. Three index laws let you simplify powers of the same base without working them out. Multiplying: keep the base and ADD the indices, because x³ × x⁴ is just seven xs multiplied together. Dividing: keep the base and SUBTRACT the indices, because the ones on the bottom cancel the ones on top. Power of a power: MULTIPLY the indices, because (x²)³ means x² three times over. Two special cases: anything to the power of 1 is itself, and anything to the power of 0 is 1.',
    example: {
      problem: 'Simplify: x³ × x⁴',
      steps: [
        'Both parts have the same base, x',
        'x³ means x × x × x, and x⁴ means x × x × x × x',
        'Altogether that is seven xs multiplied together',
        'So add the indices: 3 + 4 = 7, giving x⁷',
      ],
      answer: '7 (the power)',
    },
    tip: 'The index laws only work when the bases match — x³ × y⁴ cannot be combined. When a question asks for the missing power, type just that number, not the whole x-to-a-power expression.',
  },
  '15/1': {
    title: 'Expanding Brackets',
    explanation: 'Expanding means multiplying everything inside the brackets by the number outside. In 3(x + 4), the 3 multiplies BOTH the x and the 4, giving 3x + 12. A common mistake is multiplying only the first term, so always check that every term inside got multiplied. If the number outside is negative, it flips the sign of every term inside: -2(x + 5) becomes -2x - 10, and -2(x - 5) becomes -2x + 10. Sometimes you expand and then collect like terms, for example 3(x + 2) + 4x expands to 3x + 6 + 4x, and the two x terms combine to give 7x + 6. Factorising is the reverse: find the highest common factor of both terms and pull it out the front, so 6x + 15 becomes 3(2x + 5).',
    example: {
      problem: 'Expand: 3(x + 4)',
      steps: [
        'Multiply the 3 by the first term: 3 × x = 3x',
        'Multiply the 3 by the second term: 3 × 4 = 12',
        'The + sign between them stays the same',
        '3(x + 4) = 3x + 12',
      ],
      answer: '3x + 12',
    },
    tip: 'Write the x term first, then the number — like 3x + 12, not 12 + 3x. To check a factorised answer, expand it back out: if you get the original expression, you factorised correctly.',
  },
  '15/2': {
    title: 'Equations with Brackets',
    explanation: 'This is expanding put to work. When an equation has brackets, expand them first, then solve the way you already know. For 3(x + 4) = 27, expand the left side to 3x + 12 = 27, take 12 off both sides to get 3x = 15, then divide by 3 to get x = 5. A negative outside the bracket flips both signs inside, so -2(x + 5) = -18 becomes -2x - 10 = -18, then -2x = -8, and dividing by -2 gives x = 4. When brackets appear on both sides, expand both first, then gather the x terms on one side and the numbers on the other. Some questions have an extra x term outside, like 3(x + 2) + 4x = 34, so expand the bracket and combine the x terms before you solve.',
    example: {
      problem: 'Solve for x: 3(x + 4) = 27',
      steps: [
        'Expand the bracket: 3x + 12 = 27',
        'Subtract 12 from both sides: 3x = 15',
        'Divide both sides by 3: x = 5',
        'Check it: 3(5 + 4) = 3 × 9 = 27 ✓',
      ],
      answer: '5',
    },
    tip: 'Answer with just the number, so 5 and not x = 5. Always expand before you move anything across, and check your answer by putting it back into the original equation: if both sides match, you are right.',
  },
  '16/1': {
    title: 'Expanding Double Brackets',
    explanation: 'Two brackets multiplied together means every term in the first bracket multiplies every term in the second. That is four small multiplications, and then you collect the two x terms into one. For (x + 3)(x + 5) you get x², 5x, 3x and 15, and the middle terms join up to make 8x. Watch the signs: a minus inside a bracket travels with its number, so in (x + 7)(x - 2) the second bracket contributes -2, giving x² + 5x - 14. When both brackets are negative, the two minus signs multiply to a plus, so (x - 4)(x - 6) gives x² - 10x + 24. A squared bracket like (x + 5)² just means (x + 5)(x + 5), so it expands to x² + 10x + 25.',
    example: {
      problem: 'Expand and simplify: (x + 3)(x + 5)',
      steps: [
        'x times x = x²',
        'x times 5 = 5x',
        '3 times x = 3x',
        '3 times 5 = 15',
        'Collect the two x terms: 5x + 3x = 8x',
        '(x + 3)(x + 5) = x² + 8x + 15',
      ],
      answer: 'x² + 8x + 15',
    },
    tip: 'The biggest trap is squaring. (x + 5)² is NOT x² + 25, because you still have to do all four multiplications. Write it out as (x + 5)(x + 5) first and you will not forget the middle term. To check any answer, put x = 1 into the brackets and into your expansion: both should give the same number.',
  },
  '16/2': {
    title: 'Factorising Quadratics',
    explanation: 'Factorising is expanding backwards. You start with x² + bx + c and find the two brackets that multiply to make it. Look for two numbers that multiply to give c and add to give b. For x² + 8x + 15 you need two numbers that multiply to 15 and add to 8: that is 3 and 5, so the answer is (x + 3)(x + 5). The signs tell you a lot. If c is positive, both numbers have the same sign as b. If c is negative, one number is plus and one is minus. When there is no x term at all, like x² - 25, it is a difference of two squares: (x + 5)(x - 5).',
    example: {
      problem: 'Factorise: x² + 2x - 15',
      steps: [
        'c is -15, so the two numbers multiply to -15',
        'b is 2, so the two numbers add to 2',
        'c is negative, so one number is plus and one is minus',
        'Try 5 and -3: 5 times -3 = -15 and 5 + (-3) = 2',
        'x² + 2x - 15 = (x + 5)(x - 3)',
      ],
      answer: '(x + 5)(x - 3)',
    },
    tip: 'Always check by expanding your brackets. If (x + 5)(x - 3) does not give back the question, swap a sign and try again. The order of the two brackets does not matter.',
  },
  '17/1': {
    title: 'Solving Quadratics',
    explanation: 'A quadratic equation like x² - 2x - 15 = 0 has two answers. The trick is to factorise it into two brackets first, then use one simple fact: if two things multiply to make 0, one of them must be 0. To factorise x² + bx + c, look for two numbers that multiply to c and add to b. For x² - 2x - 15 those are 3 and -5, so it becomes (x + 3)(x - 5) = 0. Then set each bracket to 0: x + 3 = 0 gives x = -3, and x - 5 = 0 gives x = 5. Notice that each answer has the opposite sign to the number in its bracket. For something like x² - 49 = 0, think of it as (x - 7)(x + 7) = 0, which gives x = -7 or x = 7. Write both answers, like x = -3 or x = 5.',
    example: {
      problem: 'Solve: x² - 2x - 15 = 0',
      steps: [
        'Find two numbers that multiply to -15 and add to -2: they are 3 and -5',
        'So x² - 2x - 15 = (x + 3)(x - 5)',
        'Now (x + 3)(x - 5) = 0, so one of the brackets must be 0',
        'x + 3 = 0 gives x = -3',
        'x - 5 = 0 gives x = 5',
      ],
      answer: 'x = -3 or x = 5',
    },
    tip: 'The most common slip is the sign. (x + 4) = 0 means x = -4, not 4, because -4 + 4 = 0. And do not forget that x² - 25 = 0 has two answers, x = -5 and x = 5, since both square to 25. You can check any answer by putting it back into the equation: it should give exactly 0.',
  },
  '17/2': {
    title: 'Sequences',
    explanation: 'A sequence is a list of numbers that follows a rule. In a linear sequence the numbers go up or down by the same amount every time, and that amount is called the common difference. In 4, 9, 14, 19 the difference is 5, so the next term is 19 + 5 = 24. If the numbers go down, the difference is negative: 30, 26, 22 goes down by 4 each time, so the next term is 18. The nth term is a rule that gives you any term from its position n. For the rule 4n + 3, the 1st term is 4 times 1 plus 3 = 7, and the 12th term is 4 times 12 plus 3 = 51. To work out which term a number is, set the rule equal to it and solve: 3n + 5 = 41 gives 3n = 36, so n = 12 and it is the 12th term.',
    example: {
      problem: 'Find the nth term of this sequence: 5, 8, 11, 14.',
      steps: [
        'The terms go up by 3 each time, so the rule starts with 3n',
        '3n on its own gives 3, 6, 9, 12',
        'Each term in the sequence is 2 more than that',
        'So the nth term is 3n + 2',
        'Check with n = 1: 3 times 1 plus 2 = 5, the first term',
      ],
      answer: '3n + 2',
    },
    tip: 'The number in front of n is always the common difference. For the number on the end, take the difference away from the first term: 5 - 3 = 2, so the rule is 3n + 2. If the first term is smaller than the difference, the number on the end is negative, like 4n - 2 for 2, 6, 10, 14. Always write the n term first and the number second, like 3n + 2, and check your rule by putting n = 1 back in.',
  },
  '18/1': {
    title: 'Pythagoras\' Theorem',
    explanation: 'In a right-angled triangle, the longest side is the one opposite the right angle. It is called the hypotenuse. If the two shorter sides are a and b and the hypotenuse is c, then a² + b² = c². To find the hypotenuse, square the two shorter sides, add them, then take the square root. To find a shorter side, square the hypotenuse, take away the square of the side you know, then take the square root. The rule also works as a test: if the two smaller squares add up to the biggest square, the triangle has a right angle. And it finds the distance between two points, because the gap across and the gap up are the two shorter sides of a right-angled triangle.',
    example: {
      problem: 'A right-angled triangle has shorter sides of 6 cm and 8 cm. How long is the longest side?',
      steps: [
        'Square the two shorter sides: 6² = 36 and 8² = 64',
        'Add the squares: 36 + 64 = 100',
        'That total is c², so c² = 100',
        'Take the square root: 10 × 10 = 100, so c = 10',
        'The longest side is 10 cm',
      ],
      answer: '10',
    },
    tip: 'Find the hypotenuse first: it is the longest side, opposite the right angle. If the question gives you the hypotenuse, you take away instead of adding. Quick check: the hypotenuse must be longer than both other sides, so if your answer for a shorter side comes out bigger than the hypotenuse, you added when you should have taken away. For two points, work out how far apart the x values are and how far apart the y values are, and use those as the two shorter sides.',
  },
  '18/2': {
    title: 'Ratio and Proportion',
    explanation: 'A ratio compares amounts. The ratio 3:5 means that for every 3 of one thing there are 5 of the other, so the whole amount is split into 3 + 5 = 8 equal parts. To share an amount in a ratio, add the parts, divide the amount by that total to find ONE part, then multiply. To share 56 in the ratio 3:5, one part is 56 ÷ 8 = 7, so the shares are 3 × 7 = 21 and 5 × 7 = 35. Equivalent ratios work like equivalent fractions: multiply or divide both numbers by the same thing, so 3:5 is the same as 12:20. If you know the share of one person, divide it by their number of parts to find one part, then multiply by the total number of parts to get the whole amount. For proportion questions, use the unitary method: find the value of ONE first, then multiply. If 5 pens cost $15, one pen costs $3, so 8 pens cost $24.',
    example: {
      problem: 'Share 56 in the ratio 3:5. How much is the larger share?',
      steps: [
        'Add the parts: 3 + 5 = 8 parts',
        'Find one part: 56 ÷ 8 = 7',
        'The larger share is 5 parts: 5 × 7 = 35',
        'Check: the smaller share is 3 × 7 = 21, and 21 + 35 = 56 ✓',
      ],
      answer: '35',
    },
    tip: 'Always find ONE part (or the cost of ONE item) first, then multiply. Answer with just the number, so 35 and not $35 or 21:35. To check a sharing answer, add the shares back up: they should make the amount you started with.',
  },
  '19/1': {
    title: 'Percentage Change',
    explanation: 'A percentage change makes an amount bigger or smaller by a percent of itself. To increase 80 by 15%, find 15% of 80, which is 12, and add it on to get 92. To decrease, find the percent and take it away instead. A quicker way is a multiplier. After a 15% increase you have 115% of what you started with, so you multiply by 1.15. After a 30% decrease you have 70% left, so you multiply by 0.7. To find a percentage change, divide the change by the ORIGINAL amount and times by 100: going from $40 to $50 is a change of 10, and 10 ÷ 40 × 100 = 25%. To work backwards to an original price, divide by the multiplier: after a 20% increase a price is $96, so the original was 96 ÷ 1.2 = $80.',
    example: {
      problem: 'A jacket costs $240. It is reduced by 35% in a sale. What is the sale price?',
      steps: [
        '10% of 240 is 24, and 5% is half of that, which is 12',
        '35% is 10% + 10% + 10% + 5%, so 24 + 24 + 24 + 12 = 84',
        'Take it off the price: 240 - 84 = 156',
        'Check with a multiplier: 100% - 35% = 65%, and 240 × 0.65 = 156',
      ],
      answer: '156',
    },
    tip: 'The big trap is working backwards. If a price went up 20% to $96, the original is NOT $96 take away 20% of $96. Divide by the multiplier 1.2 instead, then check: 20% more than your answer should give the price in the question. For a percentage change, always divide by the amount you started with, not the new amount.',
  },
  '19/2': {
    title: 'Area and Perimeter',
    explanation: 'Area is the space inside a flat shape, measured in square units like cm² or m². Perimeter is the distance all the way around the outside, measured in plain cm or m. A rectangle is length × width, and a parallelogram is base × perpendicular height. A triangle is half a rectangle, so its area is base × perpendicular height ÷ 2. A trapezium has two parallel sides: add them, halve the total, then multiply by the perpendicular height. For a rectangle with a piece cut out of the corner, find the area of the whole rectangle and take away the piece. If you know the area of a rectangle and one side, divide to find the other side. If you know the perimeter and one side, halve the perimeter and take that side away.',
    example: {
      problem: 'A trapezium has parallel sides of 6 cm and 10 cm, and a perpendicular height of 5 cm. What is its area in cm²?',
      steps: [
        'Add the parallel sides: 6 + 10 = 16',
        'Halve the total: 16 ÷ 2 = 8',
        'Multiply by the perpendicular height: 8 × 5 = 40',
        'The area is 40 cm²',
      ],
      answer: '40',
    },
    tip: 'Always use the perpendicular height, the one that meets the base at a right angle. A slanted side is a trap: it is longer than the height and gives the wrong answer. Watch the units too: area is in square units like cm², perimeter is in plain cm. Answer with just the number, so 40 and not 40 cm².',
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
