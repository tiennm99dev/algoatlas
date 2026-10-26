/** @typedef {import('$lib/algo-engine/practice-searching.js').DebugFrame} DebugFrame */
/** @typedef {import('$lib/algo-engine/practice-searching.js').Outcome} Outcome */
/** @typedef {import('$lib/algo-engine/practice-searching.js').Version} Version */

/** @param {number} k @param {string} one @param {string} many */
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

/** @type {Record<Outcome, string>} */
const OUTCOMES = {
  ok: 'correct',
  miss: 'misses x',
  loop: 'loops forever',
  'out-of-bounds': 'reads past the end',
};

export const en = {
  slug: 'practice-searching',
  topic: 'searching',
  level: 'Intermediate',
  title: 'Practice: searching problems',
  intro:
    'Binary search is short, and almost every bug in it sits on a boundary: the loop test, the update of lo or hi, or the starting value of hi. Here five versions of the same search differ by one line each. Run them on your own array, try every target at once, and see exactly where a version loops, misses or reads past the end.',
  summary:
    'Debug four binary searches that differ from a correct one by a single boundary line: find the targets where each loops, misses or reads out of bounds.',
  instruction:
    'Pick a version, then step through its run on the target. The Every target row runs the version on each whole number from one below the smallest value to one above the largest; click a cell to load that target. Compare the code with version A, the correct one.',
  takeaways: [
    'Pick one window convention and keep it everywhere. Closed [lo, hi] goes with hi = n − 1, while lo <= hi, lo = mid + 1 and hi = mid − 1.',
    'while lo < hi on a closed window stops one cell early: when the window shrinks to a single cell, that cell is never read, so x there is missed.',
    'An update that can leave the window unchanged loops forever. lo = mid does this when hi = lo + 1, because floor((lo + hi) / 2) = lo; hi = mid does it when lo = hi.',
    'Every update must shrink the window and every read must stay inside the array. Test the edges: x below all values, above all, in the first and last cell, and a one-element array.',
    'Try the array 5 alone: each buggy version fails on exactly one of the targets 4, 5 and 6.',
  ],
  complexityHead: ['Version', 'Cost', 'Why'],
  complexity: [
    [
      'A (correct)',
      'O(log n)',
      'The closed window loses at least half on every pass; O(1) memory.',
    ],
    [
      'B: while lo < hi',
      'O(log n)',
      'Fast but wrong: it stops at a one-cell window without reading that cell.',
    ],
    [
      'C: lo = mid',
      'Unbounded',
      'When a[mid] < x and hi = lo + 1, mid = lo and the window stays [lo, lo + 1].',
    ],
    [
      'D: hi = n',
      'O(log n)',
      'Fast but unsafe: when x is above every value, mid reaches n and reads a[n].',
    ],
    [
      'E: else: hi = mid',
      'Unbounded',
      'When lo = hi and a[mid] > x, hi = mid leaves the window unchanged.',
    ],
  ],
  nextTeaser:
    'Next up: Singly linked lists, the next chapter, where data lives in nodes joined by pointers instead of a block of cells.',
  versionLabel: 'Version',
  /** @param {Version} v */
  versionName: (v) => `Version ${v}`,
  valuesLabel: 'Sorted array',
  targetLabel: 'Target x',
  newArray: 'New array',
  showChange: 'Show the changed line',
  /** @param {number} line @param {string} code */
  changeNote: (line, code) => `Changed line ${line}: ${code.trim()}`,
  noChange: 'Version A is the correct search: no line is changed.',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 3, 8, 12.',
    range: 'Every value must be from 0 to 60.',
    count: 'Type from 1 to 12 values.',
    order: 'Binary search needs sorted input: type the values in non-decreasing order.',
  },
  targetError: 'The target must be a whole number from 0 to 60.',
  /** @param {number[]} values @param {number} lo @param {number} hi */
  arrayLabel: (values, lo, hi) => `Sorted array: ${values.join(', ')}. lo = ${lo}, hi = ${hi}.`,
  windowLabel: 'window',
  legend: {
    compare: 'a[mid] being read',
    sorted: 'Returned index',
    visited: 'Outside the window [lo, hi]',
  },
  markers: { compare: '?', sorted: '✓' },
  outcomes: OUTCOMES,
  outcomeMarks: /** @type {Record<Outcome, string>} */ ({
    ok: '✓',
    miss: '✕',
    loop: '↻',
    'out-of-bounds': '⚠',
  }),
  targetsTitle: 'Every target',
  /** @param {number} x @param {Outcome} o */
  targetAria: (x, o) => `Target ${x}: ${OUTCOMES[o]}`,
  /** @param {Version} v @param {number} bad @param {number} total */
  targetsSummary: (v, bad, total) =>
    bad === 0
      ? `Version ${v} is correct on all ${total} targets.`
      : `Version ${v} fails on ${bad} of ${total} targets.`,
  stats: {
    probes: 'Probes',
    result: 'Returned',
    verdict: 'Verdict',
    broken: 'Failing targets',
  },
  pending: '—',
  never: 'never',
  /** @param {number} bad @param {number} total */
  brokenValue: (bad, total) => `${bad} of ${total}`,
  statesTitle: '(lo, hi) at the top of each pass',
  statesEmpty: 'No pass yet',
  practiceTitle: 'Debugging questions',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt:
        'Starting array 3, 8, 12, 17, 21, 26, 30. Which stored values does version B miss (return −1 although they are there)?',
      options: ['3', '8', '12', '17', '21', '26', '30'],
      answers: [0, 2, 4, 6],
      hints: [
        'Pick version B and read the ✕ cells in the Every target row.',
        'A value is missed when the search reaches it only as a one-cell window lo = hi.',
      ],
      solution:
        '3, 12, 21 and 30, the values at indices 0, 2, 4 and 6. Version B reads 17 as the first mid and 8 and 26 as the second, but the other four are only reached as one-cell windows, where while lo < hi is already false.',
    },
    {
      type: 'number',
      prompt:
        'Version C, starting array, target 30. The run repeats a (lo, hi) state. What is lo in that state?',
      answer: 5,
      hints: [
        'Click target 30 in the Every target row and step to the end.',
        'Read the (lo, hi) list: the last pass is a state seen before.',
      ],
      solution:
        'lo = 5, hi = 6: mid = floor(11 / 2) = 5, a[5] = 26 < 30, and lo = mid sets lo back to 5. The window never shrinks, so index 6 is never read.',
    },
    {
      type: 'number',
      prompt:
        'Version E on the starting array: on how many of the 30 targets does it loop forever?',
      answer: 22,
      unit: 'targets',
      hints: [
        'Pick version E and read the Failing targets card.',
        'Every missing target from 2 to 29 shrinks the window to one cell whose value is larger than x.',
      ],
      solution:
        '22: every target from 2 to 29 that is not in the array. Once lo = hi with a[mid] > x, hi = mid leaves the window unchanged. Present targets are found first, and 31 ends with lo past hi.',
    },
    {
      type: 'choice',
      prompt: 'Version D (hi = n) fails on exactly one target of the starting array. Which one?',
      options: ['2', '3', '30', '31'],
      answer: 3,
      hints: [
        'Pick version D and look for the ⚠ cell.',
        'The window must grow past the last index before mid can reach n.',
      ],
      solution:
        '31, the target above every value: lo climbs to 7 = n, the window [7, 7] is still open, and mid = 7 reads a[7], one past the end.',
    },
    {
      type: 'choice',
      prompt:
        'Type the one-value array 5. Which version returns the wrong answer for the target 5 itself?',
      options: ['A', 'B', 'C', 'D', 'E'],
      answer: 1,
      hints: [
        'Type 5 as the array, then try each version with target 5.',
        'With one value, the very first window is already a single cell.',
      ],
      solution:
        'Version B: lo = hi = 0 from the start, so while lo < hi never runs and it returns −1. C and E only fail on the missing targets 6 and 4, and D on 6.',
    },
    {
      type: 'choice',
      prompt: 'Which one-line fix makes version C correct?',
      options: [
        'while lo < hi:',
        'if a[mid] < x: lo = mid + 1',
        'mid = floor((lo + hi) / 2) + 1',
        'else: hi = mid',
      ],
      answer: 1,
      hints: [
        'Compare C with version A line by line.',
        'Every update must move lo or hi past mid, because mid has just been ruled out.',
      ],
      solution:
        'lo = mid + 1: a[mid] < x rules out mid itself, so the next window starts after it and always shrinks. That is exactly version A.',
    },
  ],
  /** @param {DebugFrame} f @param {number[]} a @param {number} x */
  describe(f, a, x) {
    switch (f.kind) {
      case 'start':
        return `Version ${f.version}: look for ${x} in ${plural(a.length, 'sorted value', 'sorted values')}, starting with lo = ${f.lo} and hi = ${f.hi}.`;
      case 'probe':
        return `Window [${f.lo}, ${f.hi}], mid = ${f.mid}. Read a[${f.mid}] = ${a[f.mid]} and compare it with ${x}${a[f.mid] === x ? ': equal.' : '.'}`;
      case 'go-right':
        return `${a[f.mid]} < ${x}, so lo = ${f.lo}.`;
      case 'go-left':
        return `${a[f.mid]} > ${x}, so hi = ${f.hi}.`;
      case 'done':
        switch (f.outcome) {
          case 'ok':
            return f.answer >= 0
              ? `Return ${f.answer}: a[${f.answer}] = ${x}. Correct after ${plural(f.probes, 'probe', 'probes')}.`
              : `The loop test fails at lo = ${f.lo}, hi = ${f.hi}, so it returns −1. Correct: ${x} is not in the array.`;
          case 'miss':
            return `The loop test fails at lo = ${f.lo}, hi = ${f.hi}, so it returns −1. Wrong: ${x} is at index ${a.indexOf(x)}, and that cell was never read.`;
          case 'loop':
            return `lo = ${f.lo}, hi = ${f.hi} is a state this run has been in before. Same state, same steps: the loop never ends.`;
          case 'out-of-bounds':
            return `mid = ${f.mid} = n, so reading a[${f.mid}] goes past the end of the array. Many languages crash here; some read garbage.`;
        }
        return '';
    }
  },
};
