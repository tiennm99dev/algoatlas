/** @typedef {import('$lib/algo-engine/recursion-induction.js').InductionFrame} InductionFrame */
/** @typedef {import('$lib/algo-engine/recursion-induction.js').InductionProgram} InductionProgram */
/** @typedef {import('$lib/algo-engine/recursion-induction.js').CheckPhase} CheckPhase */
/** @typedef {import('$lib/algo-engine/recursion-induction.js').CheckEntry} CheckEntry */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number[]} values */
const list = (values) => values.map(num).join(', ');

/**
 * The comparison a check makes, as a sentence fragment.
 * @param {InductionFrame} f
 */
function compare(f) {
  const k = f.prefix;
  const acc = num(f.acc ?? 0);
  const expected = num(f.expected ?? 0);
  switch (f.program) {
    case 'sum':
      return k === 0
        ? `s = ${acc}, and the sum of no values is 0`
        : k === 1
          ? `s = ${acc}, and a[0] = ${expected}`
          : `s = ${acc}, and the first ${k} values add up to ${expected}`;
    case 'max':
      return k === 1
        ? `m = ${acc}, and a[0] = ${expected}`
        : `m = ${acc}, and the largest of the first ${k} values is ${expected}`;
    case 'recursive':
      return k === 0
        ? `sum(a, 0) returned ${acc}, and the sum of no values is 0`
        : k === 1
          ? `sum(a, 1) returned ${acc}, and a[0] = ${expected}`
          : `sum(a, ${k}) returned ${acc}, and the first ${k} values add up to ${expected}`;
    case 'insertion': {
      const p = f.disorder;
      if (p >= 0) {
        return `a[${p}] = ${num(f.items[p])} > a[${p + 1}] = ${num(f.items[p + 1])}, so a[0..${k - 1}] is not sorted`;
      }
      return k === 1
        ? `a[0] = ${num(f.items[0])} alone is sorted`
        : `a[0..${k - 1}] = ${list(f.items.slice(0, k))} is sorted`;
    }
  }
}

/** @param {boolean|null} holds */
const verdict = (holds) => (holds ? 'holds ✓' : 'is broken ✗');

const programs = {
  sum: 'Sum loop',
  max: 'Max loop',
  insertion: 'Insertion sort',
  recursive: 'Recursive sum',
};

export const en = {
  slug: 'recursion-induction',
  topic: 'recursion',
  level: 'Intermediate',
  title: 'Recursion and induction',
  intro:
    'How do you know a loop or a recursion is correct, for every input and not just the ones you tried? A loop invariant is a statement that is true before the loop starts and stays true after every pass, so on exit it says the job is done. A recursion is proved the same way, by induction: show the base case, then show that each call is right whenever the smaller call it makes is right.',
  summary:
    'Check a loop invariant before and after every pass of a loop, and prove a recursive function by induction, with buggy versions that break the argument.',
  instruction:
    'Pick a program and an array, then step. Each check shows the invariant, the values it compares and whether it holds. Tick “Introduce a bug” to change one line and watch where the argument fails.',
  programLabel: 'Program',
  programs,
  presetLabel: 'Preset',
  presetPlaceholder: 'Choose…',
  presets: {
    mixed: 'Mixed',
    negative: 'All negative',
    sorted: 'Sorted',
    reversed: 'Reversed',
    zeroFirst: 'Starts with 0',
  },
  valuesLabel: 'Array a',
  buggyLabel: 'Introduce a bug',
  valueErrors: {
    format: 'Type whole numbers separated by commas, for example 5, −2, 9.',
    count: 'Use between 1 and 10 values.',
    range: 'Keep every value between −99 and 99.',
  },
  /** @param {boolean} on @param {string} program */
  bugNotice: (on, program) =>
    on
      ? `One line of ${program} is now wrong: it is marked “bug” in the pseudocode.`
      : `${program} is correct again.`,
  invariantTitle: { loop: 'Loop invariant', recursive: 'Claim P(k), proved by induction' },
  invariants: {
    sum: 's = a[0] + … + a[i − 1]: s is the sum of the first i values',
    max: 'm = max(a[0], …, a[i − 1]): m is the largest of the first i values',
    insertion: 'a[0..i − 1] holds the first i values of the input, in sorted order',
    recursive: 'sum(a, k) returns a[0] + … + a[k − 1], the sum of the first k values',
  },
  phases: {
    init: 'Initialization',
    maintain: 'Maintenance',
    end: 'Termination',
    base: 'Base case',
    step: 'Inductive step',
  },
  notChecked: 'Not checked on this step',
  /** @param {boolean} holds */
  holdsBadge: (holds) => (holds ? '✓ holds' : '✗ broken'),
  compare,
  checksTitle: 'Checks so far',
  checksEmpty: 'none yet',
  /** @param {CheckEntry} e */
  checkChip(e) {
    const mark = e.holds ? '✓' : '✗';
    if (e.phase === 'base' || e.phase === 'step') return `P(${e.at}) ${mark}`;
    const tag = e.phase === 'init' ? 'start' : e.phase === 'end' ? 'exit' : 'pass';
    return `${tag} i=${e.at} ${mark}`;
  },
  stats: {
    passed: 'Checks passed',
    failed: 'Checks failed',
    result: 'Answer',
  },
  resultPending: '…',
  /** @param {boolean} ok */
  resultNote: (ok) => (ok ? 'right' : 'wrong'),
  /** @param {number} k */
  prefixLabel: (k) => (k === 0 ? 'empty' : `first ${k}`),
  pointerI: 'i',
  pointerK: 'k',
  stackTitle: 'Calls on the stack',
  stackEmpty: 'empty',
  /** @param {number} k */
  callChip: (k) => `sum(a, ${k})`,
  /** @param {number[]} values @param {number} prefix */
  arrayAria: (values, prefix) =>
    `Array a: ${list(values)}. The invariant covers ${prefix === 0 ? 'no values' : `a[0] to a[${prefix - 1}]`}.`,
  legend: {
    covered: 'Covered by the invariant or claim',
    current: 'Being processed now',
    disorder: 'Out of order',
  },
  markers: { covered: '▬', current: '▶', disorder: '!' },
  /** @param {InductionFrame} f */
  describe(f) {
    const name = programs[f.program];
    switch (f.kind) {
      case 'start':
        return f.program === 'recursive'
          ? `Goal: sum(a, ${f.items.length}) returns the sum of all ${f.items.length} values. Prove the claim P(k) for every k by induction: first P(0), then “P(k − 1) is true ⇒ P(k) is true”.`
          : `Goal: ${name.toLowerCase()} is correct on every input. The argument rests on the loop invariant: check it before the first pass, after every pass and on exit.`;
      case 'init':
        return `Initialization, before the first pass (i = ${f.i}): ${compare(f)}. The invariant ${verdict(f.holds)}.`;
      case 'body':
        if (f.program === 'insertion') {
          return `Pass with i = ${f.i}: insert key = ${num(f.key ?? 0)} into the sorted part, shifting ${f.moved} ${f.moved === 1 ? 'value' : 'values'} right. Not checked yet: i still says ${f.i}.`;
        }
        return f.program === 'sum'
          ? `Pass with i = ${f.i}: s = s + a[${f.i}] = ${num(f.acc ?? 0)}. In the middle of a pass the invariant may be broken: s already counts a[${f.i}] but i still says ${f.i}, so nothing is checked here.`
          : `Pass with i = ${f.i}: compare a[${f.i}] = ${num(f.items[f.i])} with m, so m = ${num(f.acc ?? 0)}. Nothing is checked until i moves on.`;
      case 'check':
        return `Maintenance, after the pass (i = ${f.i}): ${compare(f)}. The invariant ${verdict(f.holds)}.`;
      case 'exit': {
        const n = f.items.length;
        const tail = f.holds
          ? 'With i = n, the invariant is exactly the goal.'
          : `The invariant is broken, so the argument proves nothing, and the answer ${f.correct ? 'only happens to be right' : 'is wrong'}.`;
        return `Termination, the loop stops at i = n = ${n}: ${compare(f)}. ${tail}`;
      }
      case 'call':
        return f.i === 0
          ? 'Call sum(a, 0): k = 0, the base case.'
          : `Call sum(a, ${f.i}). It needs sum(a, ${f.i - 1}) first, so another frame goes on the stack.`;
      case 'base':
        return `Base case: ${compare(f)}. P(0) ${verdict(f.holds)}.`;
      case 'step': {
        const k = f.i;
        const prev = f.log.at(-2);
        const shaky =
          prev && !prev.holds
            ? ` The hypothesis P(${k - 1}) was false, so the step stood on a broken claim.`
            : '';
        return `Inductive step for P(${k}): r = sum(a, ${k - 1}), then add a[${k - 1}] = ${num(f.items[k - 1])}. Now ${compare(f)}. P(${k}) ${verdict(f.holds)}.${shaky}`;
      }
      case 'done': {
        const answer = f.program === 'insertion' ? list(f.items) : num(f.acc ?? 0);
        const checks =
          f.failed === 0
            ? `All ${f.passed} checks held, so the argument goes through for this input and, by the same reasoning, for every input.`
            : `${f.failed} of ${f.passed + f.failed} checks failed.`;
        const wrong = f.correct
          ? ''
          : ` The right answer is ${f.program === 'insertion' ? 'the sorted array' : num(f.expected ?? 0)}.`;
        return `Done: the answer is ${answer}. ${checks}${wrong}`;
      }
    }
  },
  takeaways: [
    'A loop invariant is a statement about the loop variables that is true before the first pass (initialization) and stays true after every pass (maintenance).',
    'On exit (termination) the invariant plus the stopping condition, here i = n, gives exactly the result you wanted.',
    'Induction proves a recursion the same way: prove the base case, then assume the smaller call is right and show the current call is right too.',
    'Passing tests is not a proof. The buggy insertion sort is right on every sorted input, and the buggy sum is right whenever a[0] = 0, but the invariant check catches both.',
    'Tick “Introduce a bug” on Insertion sort, then try the Sorted and Reversed presets: which one exposes the bug, and at which pass?',
  ],
  complexityHead: ['Program', 'Cost', 'Why'],
  complexity: [
    [
      'Sum or max loop',
      'O(n) time, O(1) memory',
      'One pass over a. The invariant is reasoning; it costs nothing when the program runs.',
    ],
    [
      'Insertion sort',
      'O(n²) time, O(1) memory',
      'Inserting a[i] can shift all i values before it.',
    ],
    [
      'Recursive sum',
      'O(n) time, O(n) memory',
      'n + 1 calls, all on the stack at the deepest point.',
    ],
    [
      'Checking the invariant every pass',
      'O(n) per check, O(n²) total',
      'Each check rescans the prefix: useful while testing, too slow to leave in.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt: 'Which three facts together prove a loop correct with an invariant?',
      options: [
        'The invariant is true before the first pass.',
        'The invariant stays true in the middle of every pass.',
        'If the invariant is true before a pass, it is true after it.',
        'On exit, the invariant and the stopping condition give the result.',
        'The loop body runs at least once.',
      ],
      answers: [0, 2, 3],
      hints: ['Initialization, maintenance, termination.'],
      solution:
        'Initialization, maintenance and termination. The invariant may be broken in the middle of a pass (watch s in the sum loop), and a loop that never runs is still covered by initialization plus termination.',
    },
    {
      type: 'choice',
      prompt:
        'With the bug on, insertion sort uses “j > 0” instead of “j >= 0”. Which input passes every check?',
      options: ['4, 3, 2, 1', '1, 2, 3, 4', '2, 1', '3, 1, 2'],
      answer: 1,
      hints: [
        'Type each array, tick “Introduce a bug” and step to the end.',
        'The bug only matters when a key must move all the way to slot 0.',
      ],
      solution:
        'On 1, 2, 3, 4 no key is ever smaller than a[0], so no key needs slot 0 and the bug never shows. In the other arrays a smaller value arrives later and gets stuck in slot 1.',
    },
    {
      type: 'number',
      prompt:
        'With the bug on, the recursive sum’s base case returns 1. What does it return for a = 5, −2, 9?',
      answer: 13,
      hints: [
        'Every level adds one value to what the level below returned.',
        'Load the array, tick “Introduce a bug” and step to the end.',
      ],
      solution:
        'sum(a, 0) = 1, then 1 + 5 = 6, 6 − 2 = 4, 4 + 9 = 13. The true sum is 12: a wrong base case puts the same error into every claim above it.',
    },
    {
      type: 'number',
      prompt: 'Induction proves 1 + 3 + 5 + … + (2n − 1) = n². What is 1 + 3 + 5 + … + 19?',
      answer: 100,
      hints: ['19 = 2n − 1, so n = 10.'],
      solution:
        'There are n = 10 odd numbers up to 19, so the sum is 10² = 100. Base case: 1 = 1². Step: n² + (2n + 1) = (n + 1)².',
    },
  ],
  nextTeaser:
    'Next up: practice recursive thinking. Solve the towers of Hanoi and list every subset by trusting the smaller call.',
};
