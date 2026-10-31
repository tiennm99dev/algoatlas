/** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').DcFrame} DcFrame */
/** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').Problem} Problem */
/** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').Part} Part */

/** A value with a real minus sign. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

/** @param {Problem} p @param {number | null} v */
const value = (p, v) => (v === null ? (p === 'max-subarray' ? 'nothing' : 'none') : num(v));

/** @param {number} k @param {string} one @param {string} many */
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

/** @param {number} lo @param {number} hi */
const range = (lo, hi) => `[${lo}, ${hi}]`;

/** @param {DcFrame} f */
function verdict(f) {
  return f.ok
    ? `✓ Right for ${range(f.lo, f.hi)}.`
    : `✕ Wrong: the right answer for ${range(f.lo, f.hi)} is ${value(f.problem, f.expected)}.`;
}

/** @param {number[]} a @param {number} from @param {number} to */
const sum = (a, from, to) => a.slice(from, to + 1).reduce((s, v) => s + v, 0);

export const en = {
  slug: 'practice-divide-and-conquer',
  topic: 'divide-and-conquer',
  level: 'Intermediate',
  title: 'Practice: divide and conquer problems',
  intro:
    'In divide and conquer the split and the recursive calls are almost always the same: cut the range at mid and solve both halves. The real work, and nearly every bug, is in the combine step. Here you build the combine step for two classic problems, maximum subarray and majority element, check it on samples, and step through the run to find the first call it gets wrong.',
  summary:
    'Build the combine step for maximum subarray and majority element, check it on sample arrays, and step through the recursion to see which call goes wrong.',
  instruction:
    'Pick a problem, switch the parts of your combine step on or off, and read the Check on samples list. Click a sample to load it, then step through the run: a ✕ in the recursion tree marks a call that returned a wrong value for its own range. Jump to the first wrong call to see why.',
  takeaways: [
    'Every call answers the question for its own range, so the combine must turn the two halves’ answers into the answer for the whole range. Check it on one call, not only on the final result.',
    'Maximum subarray: the best run lies in the left half (L), in the right half (R), or crosses mid. A crossing run is a suffix of the left half joined to a prefix of the right half, so C = best suffix + best prefix and the answer is max(L, R, C). Without C, any best run across mid is missed.',
    'Majority element: a value filling more than half of a range fills more than half of at least one half, so only L and R can win. Neither is sure to win, so count each in the whole range and keep one only when its count is more than half; ties are not a majority.',
    'Both combines read the range once, so T(n) = 2T(n/2) + O(n) = O(n log n). Kadane’s scan and the Boyer–Moore vote solve the same two problems in O(n), and a summary of four values per half (total, best prefix, best suffix, best) gives an O(n) divide and conquer for maximum subarray too.',
    'Passing every sample is not proof. Use only C for maximum subarray: four samples still pass, yet the tree shows wrong calls on all of them. Then find the sample that catches it.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Maximum subarray, divide and conquer',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): C needs one scan outward from mid.',
    ],
    [
      'Majority element, divide and conquer',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): counting L and R reads the range once.',
    ],
    ['Kadane / Boyer–Moore', 'O(n)', 'One left-to-right pass with O(1) state each.'],
    ['Brute force', 'O(n²)', 'Every subarray sum, or a count of every value.'],
    ['Extra memory', 'O(log n)', 'The call stack is about log₂ n calls deep.'],
  ],
  nextTeaser:
    'Next up: Greedy choice and exchange arguments, the next chapter, where one local choice per step can be enough for the best answer.',
  problemLabel: 'Problem',
  /** @type {Record<Problem, string>} */
  problems: { 'max-subarray': 'Maximum subarray', majority: 'Majority element' },
  /** @type {Record<Problem, string>} */
  goals: {
    'max-subarray':
      'Return the largest sum of a non-empty run of neighbouring cells a[lo..hi]. All negative? Then the largest single value.',
    majority:
      'Return the value that fills more than half of a[lo..hi], or none when no value does. Exactly half is not enough.',
  },
  valuesLabel: 'Array (up to 16 whole numbers)',
  randomArray: 'Random array',
  combineTitle: 'Your combine step',
  /** @type {Record<Problem, Partial<Record<Part, string>>>} */
  parts: {
    'max-subarray': {
      left: 'L: the best sum inside the left half',
      right: 'R: the best sum inside the right half',
      cross: 'C: best suffix of the left half + best prefix of the right half',
      total: 'T: the sum of the whole range',
    },
    majority: {
      left: 'Try L, the left half’s majority',
      right: 'Try R, the right half’s majority',
      count: 'Count x in the whole range; return it only if it fills more than half',
    },
  },
  /** @type {Record<Problem, string>} */
  combineHint: {
    'max-subarray': 'The call returns the largest of the terms you tick.',
    majority: 'The call returns the first ticked candidate that passes, else none.',
  },
  errors: {
    format: 'Type whole numbers separated by commas or spaces, for example 4, −1, 2.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 1 to 16 values.',
  },
  jumpWrong: 'Jump to the first wrong call',
  noWrong: 'No call has returned a wrong value on this array.',
  samplesTitle: 'Check on samples',
  yourArray: 'Your array',
  /** @param {number} k */
  sampleName: (k) => `Sample ${k}`,
  /** @param {number} pass @param {number} total */
  samplesSummary: (pass, total) =>
    pass === total
      ? `Your combine passes all ${total} arrays. Step through them too: a pass can still hide a wrong call.`
      : `Your combine passes ${pass} of ${total} arrays.`,
  expectedLabel: 'right answer',
  gotLabel: 'yours',
  /** @param {string} name @param {number[]} a @param {Problem} p @param {number | null} exp @param {number | null} got @param {boolean} ok */
  sampleAria: (name, a, p, exp, got, ok) =>
    `${name}: ${a.map(num).join(', ')}. Right answer ${value(p, exp)}, yours ${value(p, got)}, ${ok ? 'pass' : 'fail'}. Load it.`,
  pass: '✓',
  fail: '✕',
  /** @param {Problem} p @param {number | null} v */
  value,
  num,
  /** @param {number} n */
  treeLabel: (n) =>
    `Recursion tree of the calls on ${plural(n, 'value', 'values')}, each node a range.`,
  /** @param {number} lo @param {number} hi @param {string} state @param {string} result */
  callLabel: (lo, hi, state, result) =>
    `Call ${range(lo, hi)}: ${state}${result ? `, returned ${result}` : ''}.`,
  /** @param {number} lo @param {number} hi */
  note: (lo, hi) => (lo === hi ? String(lo) : `${lo}–${hi}`),
  /** @param {number[]} a @param {number} lo @param {number} hi */
  arrayLabel: (a, lo, hi) =>
    lo < 0
      ? `Array: ${a.map(num).join(', ')}.`
      : `Array: ${a.map(num).join(', ')}. The current call works on ${range(lo, hi)}.`,
  callStates: {
    active: 'running now',
    frontier: 'waiting for its halves',
    sorted: 'right for its range',
    swap: 'wrong for its range',
    '': 'not called yet',
  },
  markers: { active: '▶', frontier: '…', sorted: '✓', swap: '✕', compare: '·' },
  legend: {
    active: 'Call running now',
    frontier: 'Waiting for its halves',
    sorted: 'Returned the right value for its range',
    swap: 'Returned a wrong value for its range',
    idle: 'Not called yet',
    compare: 'In the best crossing run, or a copy of a counted candidate',
  },
  windows: { left: 'left', right: 'right', suffix: 'suffix', prefix: 'prefix' },
  stats: {
    calls: 'Calls',
    reads: 'Cells read',
    returned: 'Your answer',
    expected: 'Right answer',
  },
  pending: '—',
  stackTitle: 'Open calls, outermost first',
  stackEmpty: 'none',
  /** @param {string} id */
  stackChip: (id) => `[${id.replace('-', ', ')}]`,
  practiceTitle: 'Combine-step questions',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Maximum subarray, combine max(L, R) only, Sample 1 (−2, 1, −3, 4, −1, 2, 1, −5, 4). What does your combine return for the whole array?',
      answer: 4,
      hints: [
        'This is the combine the page starts with. Read Your answer after the last step.',
        'Without C, every answer is a single cell or a run that never crosses a mid.',
      ],
      solution:
        '4. The best run is 4, −1, 2, 1 = 6, at indices 3 to 6, and it crosses mid = 4 of the top call. max(L, R) can never build it, so the best it keeps is the single 4.',
    },
    {
      type: 'choice',
      prompt:
        'Same combine and sample. Which call is the first to return a wrong value for its own range?',
      options: ['[0, 1]', '[3, 4]', '[5, 6]', '[0, 8]'],
      answer: 2,
      hints: [
        'Press Jump to the first wrong call.',
        'Look for a two-cell range whose cells are both positive.',
      ],
      solution:
        '[5, 6]: it holds 2 and 1, so its best run is 2 + 1 = 3, but max(L, R) = max(2, 1) = 2. [0, 1] (−2, 1) and [3, 4] (4, −1) are right, because their best run is one cell.',
    },
    {
      type: 'choice',
      prompt:
        'Maximum subarray with only C ticked. Four samples still get the right final answer. Which sample catches the bug?',
      options: ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5'],
      answer: 2,
      hints: [
        'Tick only C and read the ✕ in Check on samples.',
        'C always takes at least one cell from each half. When does a single cell beat that?',
      ],
      solution:
        'Sample 3 (−8, −3, −6, −2, −5, −4), all negative. Its best run is the single −2, but C always joins at least one cell from each half, so the top call returns C = −6 + (−2) = −8. On the other samples the best run crosses the top mid, so the final answer comes out right even though smaller calls are wrong.',
    },
    {
      type: 'number',
      prompt:
        'Majority element with the correct combine (L, R and counting), Sample 1 (3, 3, 4, 2, 4, 4, 2, 4, 4). How many cells does the whole run read?',
      answer: 38,
      unit: 'cells',
      hints: [
        'Tick all three parts and step to the end, then read Cells read.',
        'Each of the 9 leaves reads one cell; each split call that still has a candidate reads its whole range once.',
      ],
      solution:
        '38: the 9 leaves read 9 cells, and the 8 split calls count over their ranges of 9, 5, 3, 2, 2, 4, 2 and 2 cells, which is 29 more. About n per level over about log₂ n levels: the O(n log n) of the recurrence.',
    },
    {
      type: 'choice',
      prompt:
        'Majority element, tick R and counting but not L. Which sample does the combine fail?',
      options: ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5'],
      answer: 1,
      hints: [
        'Read the ✕ in Check on samples.',
        'Find a sample whose majority lives only in its left half.',
      ],
      solution:
        'Sample 2 (4, 4, 4, 1, 2): the left half [0, 2] is all 4s, the right half [3, 4] has no majority. With only R tried, the top call has no candidate and returns none, although 4 fills 3 of 5 cells.',
    },
    {
      type: 'number',
      prompt:
        'Majority element, tick L and R but not counting. On how many of the five samples is the final answer still right?',
      answer: 2,
      unit: 'samples',
      hints: [
        'Untick counting and read the Check on samples list.',
        'Without counting, a call returns L whenever the left half has a majority, even if it is not a majority of the whole range.',
      ],
      solution:
        '2: Samples 2 and 3 pass because their left-half candidate happens to be the overall majority. Sample 1 returns 3, Sample 4 returns 1 and Sample 5 returns 1, all wrong.',
    },
    {
      type: 'multi',
      prompt: 'Which combine steps are correct for maximum subarray on every array?',
      options: ['max(L, R)', 'max(L, R, C)', 'max(L, R, C, T)', 'max(C)', 'max(L, R, T)'],
      answers: [1, 2],
      hints: [
        'Try each on the samples and a few random arrays, and watch the tree for ✕.',
        'T is one crossing run, the whole range. Can it ever beat C?',
      ],
      solution:
        'max(L, R, C) covers all three places a best run can be. Adding T changes nothing, because the whole range is itself a suffix of the left half joined to a prefix of the right, so T ≤ C. max(L, R) and max(L, R, T) miss crossing runs, and max(C) misses runs inside one half.',
    },
    {
      type: 'text',
      prompt:
        'Both correct combines read the range once, so T(n) = 2T(n/2) + n. What is the running time in O-notation?',
      accept: ['O(n log n)', 'n log n', 'Θ(n log n)', 'O(nlogn)', 'O(n log2 n)'],
      hints: ['a = 2, b = 2, so n^(log_b a) = n.', 'f(n) = n matches it: master theorem case 2.'],
      solution:
        'a = b = 2 gives n^(log₂ 2) = n, which matches f(n) = n, so case 2 adds a log: Θ(n log n).',
    },
  ],
  /** @param {DcFrame} f @param {number[]} a */
  describe(f, a) {
    const p = f.problem;
    const name = p === 'max-subarray' ? 'best' : 'major';
    switch (f.kind) {
      case 'start':
        return `Call ${name}(0, ${a.length - 1}) on ${plural(a.length, 'value', 'values')}. Each call splits its range at mid, solves both halves, then runs your combine step.`;
      case 'split':
        return `${name}(${f.lo}, ${f.hi}): split at mid = ${f.mid} into ${range(f.lo, f.mid)} and ${range(f.mid + 1, f.hi)}, and solve the left half first.`;
      case 'base':
        return `${range(f.lo, f.hi)} is one cell, so return a[${f.lo}] = ${num(a[f.lo])}. ${verdict(f)}`;
      case 'measure': {
        const [s, m] = /** @type {[number, number]} */ (f.suffix);
        const [m1, e] = /** @type {[number, number]} */ (f.prefix);
        return `Back in ${range(f.lo, f.hi)} with L = ${value(p, f.L)} and R = ${value(p, f.R)}. Best suffix a[${s}..${m}] = ${num(sum(a, s, m))}, best prefix a[${m1}..${e}] = ${num(sum(a, m1, e))}, so C = ${num(/** @type {number} */ (f.C))}; T = ${num(/** @type {number} */ (f.T))}.`;
      }
      case 'count': {
        const len = f.hi - f.lo + 1;
        const parts = [];
        if (f.countL >= 0)
          parts.push(`L = ${value(p, f.L)} appears ${plural(f.countL, 'time', 'times')}`);
        if (f.countR >= 0)
          parts.push(`R = ${value(p, f.R)} appears ${plural(f.countR, 'time', 'times')}`);
        return `Back in ${range(f.lo, f.hi)}: count in all ${len} cells. ${parts.join(', ')}. A majority needs more than ${len / 2}.`;
      }
      case 'combine': {
        if (p === 'max-subarray') {
          const head = f.picked
            ? `Your combine returns ${num(/** @type {number} */ (f.result))}, from ${f.picked}.`
            : 'Your combine has no term, so it returns nothing.';
          return `${head} ${verdict(f)}`;
        }
        const back =
          f.countL < 0 && f.countR < 0
            ? `Back in ${range(f.lo, f.hi)} with L = ${value(p, f.L)} and R = ${value(p, f.R)}. `
            : '';
        const head = f.picked
          ? `${back}Return ${f.picked} = ${value(p, f.result)}.`
          : `${back}No candidate passes, so return none.`;
        return `${head} ${verdict(f)}`;
      }
      case 'done': {
        const got = value(p, f.result);
        if (!f.ok) {
          return `Your combine returns ${got} for the whole array, but the right answer is ${value(p, f.expected)}. The first wrong call was [${f.firstWrong.replace('-', ', ')}].`;
        }
        return f.firstWrong
          ? `Your combine returns ${got}, the right answer, but call [${f.firstWrong.replace('-', ', ')}] was wrong on the way. This array did not catch the bug; another will.`
          : `Your combine returns ${got}, the right answer, and every call was right for its own range.`;
      }
    }
    return '';
  },
};
