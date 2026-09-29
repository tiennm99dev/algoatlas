/** @typedef {import('$lib/algo-engine/lower-upper-bound.js').BoundFrame} BoundFrame */

export const en = {
  slug: 'lower-upper-bound',
  topic: 'searching',
  level: 'Intermediate',
  title: 'Lower bound & upper bound',
  intro:
    'Binary search can answer more than "is it here?". Lower bound finds the first position whose value is at least x; upper bound finds the first position whose value is greater than x. Every copy of x sits between the two.',
  summary:
    'Use binary search to find the first position at least x or greater than x, and count duplicates in O(log n).',
  instruction:
    'Choose lower or upper bound and a target, then step through. The window is half-open: lo is inside it, hi is just past its end. When the search ends, a caret marks where x would be inserted.',
  takeaways: [
    'Both bounds are the same loop. Only the test on a[mid] changes: < for lower bound, ≤ for upper bound.',
    'The window [lo, hi) is half-open, so it shrinks with hi = mid, not mid − 1. Mixing this with the closed window of plain binary search is the classic off-by-one bug.',
    'The answer is always a valid insertion point from 0 to n, even when x is missing, smaller than everything, or larger than everything.',
    'upper − lower counts the copies of x in O(log n), without scanning the run of equal values.',
    'There is no early exit on a hit, so every search reads about log₂ n cells.',
    'Try “Missing target”: the search still ends at a valid insertion point, and lower and upper bound agree.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    ['Time', 'O(log n)', 'The window halves on every read, with no early exit.'],
    ['Counting x', 'O(log n)', 'Two searches: upper − lower.'],
    ['Memory', 'O(1)', 'Only lo, hi, and mid.'],
  ],
  nextTeaser: 'Next up: hash tables, which find a key in O(1) on average with no sorting at all.',
  variantLabel: 'Search for',
  variants: { lower: 'Lower bound', upper: 'Upper bound' },
  targetLabel: 'Target x',
  sizeLabel: 'Size',
  newArray: 'New array',
  randomPresent: 'Present target',
  /** @param {number} n @param {number} x */
  newArrayNotice: (n, x) => `New array of ${n} values. Target is ${x}.`,
  randomAbsent: 'Missing target',
  /** @param {number[]} values @param {number} lo @param {number} hi */
  arrayLabel: (values, lo, hi) => `Sorted array: ${values.join(', ')}. Window [${lo}, ${hi}).`,
  windowHint: 'The window is half-open: [lo, hi) includes lo and excludes hi.',
  legend: {
    mid: 'Midpoint being read',
    /** @param {string} test */
    left: (test) => `a[i] ${test} x held: left of lo`,
    /** @param {string} keep */
    right: (keep) => `a[i] ${keep} x: hi and beyond`,
    range: 'Copies of x',
    answer: 'Answer',
  },
  readsLabel: 'Reads',
  ceilingLabel: 'Most reads needed',
  resultTitle: 'Result',
  lowerLabel: 'Lower bound',
  upperLabel: 'Upper bound',
  /** @param {number} x @param {number} c */
  countText: (x, c) => `${c} ${c === 1 ? 'copy' : 'copies'} of ${x}`,
  pending: '—',
  /** @param {BoundFrame} f @param {number[]} a @param {number} x */
  describe(f, a, x) {
    const lower = f.variant === 'lower';
    const test = lower ? '<' : '≤';
    const keep = lower ? '≥' : '>';
    switch (f.kind) {
      case 'start':
        return `Looking for the ${f.variant} bound of ${x} in [0, ${a.length}).`;
      case 'probe':
        return `Middle of [${f.lo}, ${f.hi}) is index ${f.mid}. Read a[${f.mid}] = ${a[f.mid]} and test ${a[f.mid]} ${test} ${x}.`;
      case 'go-right':
        return `${a[f.mid]} ${test} ${x} holds, so lo = ${f.lo}. Everything left of lo is ${test} ${x}.`;
      case 'go-left':
        return `${a[f.mid]} ${test} ${x} fails, so hi = ${f.hi}. Mid could still be the answer; everything from hi on is ${keep} ${x}.`;
      case 'done':
        return `The window is empty. ${lower ? 'Lower' : 'Upper'} bound of ${x} is ${f.answer}.`;
    }
  },
};
