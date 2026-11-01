/** @typedef {import('$lib/algo-engine/practice-greedy.js').PuzzleFrame} PuzzleFrame */
/** @typedef {import('$lib/algo-engine/practice-greedy.js').Puzzle} Puzzle */

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/**
 * An answer in words: yes or no, a number of jumps, or a number of boats.
 * @param {Puzzle} puzzle @param {number} x
 */
function answer(puzzle, x) {
  if (puzzle === 'reach') return x === 1 ? 'yes' : 'no';
  if (puzzle === 'jumps') return x < 0 ? 'unreachable' : plural(x, 'jump');
  return plural(x, 'boat');
}

/** @param {PuzzleFrame} f */
function describeBoats(f) {
  const boat = /** @type {number[]} */ (f.boats.at(-1));
  const w = boat.map((k) => f.values[k]);
  const left = f.values.length - f.boats.flat().length;
  if (f.rule === 'right') {
    if (w.length === 2) {
      return `Boat ${f.count}: the heaviest, ${w[0]}, takes the lightest, ${w[1]}: ${w[0] + w[1]} ≤ 10.`;
    }
    return left === 0
      ? `Boat ${f.count}: ${w[0]} is the last one and goes alone.`
      : `Boat ${f.count}: the heaviest, ${w[0]}, goes alone, because not even the lightest left fits with it.`;
  }
  if (w.length === 2) return `Boat ${f.count}: the two lightest, ${w[0]} and ${w[1]}, share it.`;
  return left === 0
    ? `Boat ${f.count}: ${w[0]} is the last one and goes alone.`
    : `Boat ${f.count}: ${w[0]} goes alone, because the next lightest does not fit with it.`;
}

export const en = {
  slug: 'practice-greedy',
  topic: 'greedy',
  level: 'Advanced',
  title: 'Practice: greedy problems',
  intro:
    'A greedy rule is easy to invent and easy to get wrong. The working habit is: state the rule, hunt for a counterexample on small random cases, and only then try to prove it with an exchange argument or by showing that it stays ahead. Each card below holds a rule that is right and one that only sounds right.',
  summary:
    'Pick a greedy puzzle, step a rule through your own input, and test it against a brute-force answer on 200 random cases to prove or break it.',
  instruction:
    'Pick a card and a rule, type an input or keep the example, then step. Press “Test on 200 random cases” to compare the rule with brute force, and load the shortest counterexample it finds.',
  cardsLabel: 'Puzzle',
  cards: {
    reach: {
      title: 'Jump game',
      goal: 'a[i] is the longest jump from cell i. Starting at cell 0, can you reach the last cell?',
    },
    jumps: {
      title: 'Fewest jumps',
      goal: 'Same cells and jumps. What is the fewest number of jumps to the last cell?',
    },
    boats: {
      title: 'Boats',
      goal: 'A boat carries at most two people and at most 10 in weight. What is the fewest boats for everyone?',
    },
  },
  ruleLabel: 'Greedy rule',
  rules: {
    reach: { right: 'Track the farthest reach', wrong: 'Always jump the longest' },
    jumps: { right: 'Jump when the range runs out', wrong: 'Always jump the longest' },
    boats: { right: 'Heaviest with lightest', wrong: 'Two lightest together' },
  },
  valuesLabel: { reach: 'Jump lengths', jumps: 'Jump lengths', boats: 'Weights' },
  errors: {
    format: 'Type whole numbers separated by commas or spaces. The last valid input is back.',
    range: {
      reach: 'Keep every jump length between 0 and 9. The last valid input is back.',
      jumps: 'Keep every jump length between 0 and 9. The last valid input is back.',
      boats: 'Keep every weight between 1 and 9. The last valid input is back.',
    },
    count: 'Use between 2 and 12 values. The last valid input is back.',
  },
  /** @param {string} rule */
  ruleNotice: (rule) => `Rule: ${rule}. The trace starts again.`,
  counterNotice: 'Counterexample loaded: step through it to see where the rule goes wrong.',
  random: 'Random input',
  newInputNotice: 'New input loaded.',
  answer,
  /** @param {number} i @param {number} value @param {string} state */
  cellLabel: (i, value, state) => `Cell ${i}: ${value}${state ? `, ${state}` : ''}`,
  /** @param {number} weight @param {number} boat 0-based, -1 before boarding @param {string} state */
  personLabel: (weight, boat, state) =>
    `Weight ${weight}${boat >= 0 ? `, boat ${boat + 1}` : ''}${state ? `, ${state}` : ''}`,
  /** @param {number[]} values */
  stripAria: (values) => `Cells: ${values.join(', ')}.`,
  pointers: { i: 'i', end: 'end', far: 'far' },
  reachWindow: 'reach',
  /** @param {number} k */
  boatMark: (k) => `b${k + 1}`,
  legend: {
    current: 'Looked at now',
    reachable: 'Known reachable',
    scanned: 'Scanned',
    path: 'Landed on',
    stuck: 'Stuck here',
    boat: 'In the boat just filled',
    done: 'In an earlier boat',
    goal: 'Last cell reached',
  },
  markers: {
    current: '?',
    reachable: '·',
    scanned: '✓',
    path: '•',
    stuck: '✗',
    boat: '',
    done: '',
    goal: '★',
  },
  boatMarkerNote: 'b1, b2, …: boat number',
  stats: {
    got: 'Rule’s answer',
    want: 'Right answer',
    reach: 'Farthest reach',
    jumps: 'Jumps so far',
    boats: 'Boats so far',
  },
  pending: '…',
  boatsTitle: 'Boats',
  boatsEmpty: 'no boat yet',
  /** @param {number[]} w */
  boatChip: (w) => w.join(' + '),
  testTitle: 'Prove or break the rule',
  test: 'Test on 200 random cases',
  untested: 'Not tested yet. Random cases have 2 to 8 values.',
  /** @param {number} tested */
  passed: (tested) =>
    `Passed all ${tested} random cases. That is evidence, not a proof: read the takeaways for the argument that makes it certain.`,
  /** @param {number} failed @param {number} tested */
  failed: (failed, tested) => `Failed ${failed} of ${tested} random cases.`,
  /** @param {Puzzle} puzzle @param {number[]} values @param {number} got @param {number} want */
  counterexample: (puzzle, values, got, want) =>
    `Shortest counterexample: ${values.join(', ')}. The rule says ${answer(puzzle, got)}, the right answer is ${answer(puzzle, want)}.`,
  loadCounter: 'Load the counterexample',
  practiceTitle: 'Puzzles to solve with the widget',
  /** @param {PuzzleFrame} f @param {number} want */
  describe(f, want) {
    const a = f.values;
    if (f.kind === 'done') {
      const got = answer(f.puzzle, f.result);
      return f.result === want
        ? `The rule answers ${got}, which is right on this input.`
        : `The rule answers ${got}, but the right answer is ${answer(f.puzzle, want)}: a counterexample, so this rule is wrong.`;
    }
    if (f.puzzle === 'boats') {
      if (f.kind === 'start') {
        return `Carry ${plural(a.length, 'person')} in boats that hold at most two people and at most 10 in weight.`;
      }
      if (f.kind === 'sort') return `Sort the weights: ${a.join(', ')}.`;
      return describeBoats(f);
    }
    if (f.rule === 'wrong') {
      if (f.kind === 'start')
        return 'Start at cell 0 and always take the longest jump the cell allows.';
      if (f.kind === 'stuck') return `Cell ${f.i} holds 0: the rule is stuck there.`;
      const from = /** @type {number} */ (f.path.at(-2));
      return `Jump ${f.i - from} from cell ${from} to cell ${f.i}${f.i === a.length - 1 ? ', the last cell' : ''}. ${plural(f.count, 'jump')} so far.`;
    }
    if (f.puzzle === 'reach') {
      switch (f.kind) {
        case 'start':
          return 'Scan the cells from the left and keep reach, the farthest cell known to be reachable. Cell 0 is reachable.';
        case 'scan':
          return `Cell ${f.i} is reachable (${f.i} ≤ reach). From it you can get to ${f.i + a[f.i]}, so reach = ${f.reach}.`;
        case 'stuck':
          return `Cell ${f.i} > reach ${f.reach}: no earlier cell gets that far, so cell ${f.i} and every cell after it are out of reach.`;
        default:
          return '';
      }
    }
    switch (f.kind) {
      case 'start':
        return 'Scan the cells the current jump covers and remember far, the farthest cell any of them reaches. When the scan passes end, one more jump is needed.';
      case 'scan':
        return `Cell ${f.i} reaches ${f.i + a[f.i]}, so far = ${f.reach}.`;
      case 'jump':
        return `Cell ${f.i} is the end of the range covered by ${plural(f.count - 1, 'jump')}, so take jump ${f.count}: it can land anywhere up to cell ${f.end}.`;
      case 'stuck':
        return `The range ends at cell ${f.i} and nothing in it reaches past ${f.i}: the last cell is unreachable.`;
      default:
        return '';
    }
  },
  takeaways: [
    'Before proving a greedy rule, try to break it: small random cases checked against brute force find most wrong rules in seconds.',
    'Jump game: the reachable cells always form a prefix 0..reach, because a cell that can jump to cell j can also make every shorter jump. So one scan that grows reach decides the question in O(n). Always taking the longest jump can land on a 0 that a shorter jump would have skipped.',
    'Fewest jumps: the cells reachable in k jumps also form a range, and the next range ends at the farthest cell any of them reaches. Jumping only when the range runs out is a breadth-first search by layers, so it “stays ahead” of any other plan and is optimal in O(n).',
    'Boats: the heaviest person needs a boat anyway. If anyone can share it, the lightest can, and swapping the lightest into that seat never hurts another pair: an exchange argument. Pairing the two lightest wastes light people that heavy ones needed.',
    'Pick “Boats” with “Two lightest together”, press the test button, load the counterexample and step through it, then switch to “Heaviest with lightest” on the same input.',
  ],
  complexityHead: ['Rule', 'Cost', 'Why'],
  complexity: [
    ['Jump game, farthest reach', 'O(n)', 'One scan, one max per cell.'],
    ['Fewest jumps, by layers', 'O(n)', 'One scan; a jump is counted when the range runs out.'],
    ['Boats, heaviest with lightest', 'O(n log n)', 'The sort; the two-pointer pass is O(n).'],
    [
      'Brute force used for testing',
      'O(9n) or exponential',
      'A breadth-first search over every jump, or every way to pair the people.',
    ],
    [
      'Random testing',
      'trials × brute force',
      'Cheap on small cases, which is where counterexamples hide.',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Run “Always jump the longest” on the jump game 2, 3, 0, 1, 4. What happens?',
      options: [
        'It reaches the last cell in 2 jumps',
        'It reaches the last cell in 3 jumps',
        'It lands on the 0 at cell 2 and is stuck',
        'It answers no, which is right',
      ],
      answer: 2,
      hints: [
        'From cell 0 the longest jump has length 2.',
        'Type 2, 3, 0, 1, 4 on the Jump game card and step to the end.',
      ],
      solution:
        'It jumps from cell 0 to cell 2, which holds 0, so it answers no. The farthest-reach rule sees that cell 1 reaches cell 4 and answers yes.',
    },
    {
      type: 'number',
      prompt: 'How many jumps does “Always jump the longest” use on 2, 3, 1, 1, 4?',
      answer: 3,
      unit: 'jumps',
      hints: ['It lands on cells 2 and 3 before the last cell.', 'Use the Fewest jumps card.'],
      solution:
        'It goes 0 → 2 → 3 → 4, 3 jumps, but 0 → 1 → 4 needs only 2: a shorter first jump can lead farther.',
    },
    {
      type: 'number',
      prompt: 'What is the fewest number of jumps to the last cell of 2, 3, 0, 1, 4?',
      answer: 2,
      unit: 'jumps',
      hints: [
        'The first jump covers cells 1 and 2.',
        'Pick “Jump when the range runs out” and step to the end.',
      ],
      solution:
        'One jump reaches cells 1 and 2; cell 1 reaches cell 4, so the second jump lands on the last cell: 2 jumps.',
    },
    {
      type: 'number',
      prompt: 'How many boats does “Two lightest together” use for the weights 1, 2, 8, 9?',
      answer: 3,
      unit: 'boats',
      hints: ['It puts 1 and 2 in the first boat.', '8 and 9 together weigh more than 10.'],
      solution:
        '1 + 2 share a boat, then 8 and 9 each need their own: 3 boats. Heaviest with lightest sends 9 + 1 and 8 + 2, only 2 boats.',
    },
    {
      type: 'multi',
      prompt: 'Which rules pass every random test? Test each one with the widget.',
      options: [
        'Jump game: track the farthest reach',
        'Jump game: always jump the longest',
        'Fewest jumps: jump when the range runs out',
        'Fewest jumps: always jump the longest',
        'Boats: heaviest with lightest',
        'Boats: two lightest together',
      ],
      answers: [0, 2, 4],
      hints: [
        'Exactly one rule per card is right.',
        'Press “Test on 200 random cases” for each rule.',
      ],
      solution:
        'The farthest reach, the layer-by-layer jumps and heaviest with lightest pass, and each has a proof. The longest-jump rules and the two-lightest rule fail on short inputs such as 2, 3, 0, 1, 4 and 1, 2, 8, 9.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of the farthest-reach rule on n cells, in O-notation?',
      accept: ['O(n)', 'Θ(n)', 'n', 'linear'],
      hints: ['Count how often each cell is looked at.', 'There is no sort and no inner loop.'],
      solution: 'One left-to-right scan with one max per cell: O(n).',
    },
  ],
  nextTeaser:
    'Next up: Memoization and tabulation, the two ways dynamic programming solves problems like 0/1 knapsack and coin change where greedy fails.',
};
