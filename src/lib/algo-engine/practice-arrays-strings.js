/**
 * A problem runner for array and string problems: pick a problem and a technique, and the
 * technique runs on the problem's input, step by step, with its work counted.
 *
 * Each technique fits some problems and not others:
 *
 * | Problem              | Two pointers | Sliding window | Prefix sums | Brute force |
 * | -------------------- | ------------ | -------------- | ----------- | ----------- |
 * | Pair with sum T      | best         | no             | no          | works       |
 * | Palindrome check     | best         | no             | no          | works       |
 * | Max sum of k in a row| no           | best           | works       | works       |
 * | Shortest sum ≥ S     | no           | best           | works       | works       |
 * | Many range sums      | no           | no             | best        | works       |
 *
 * A technique that does not fit gives a two-frame trace (start, done) with `fit: 'no'`, so
 * the page can explain why instead of running it.
 *
 * Steps count the basic work: one per pair sum or character comparison checked, one per
 * element added to or subtracted from a sum, one per prefix-sum entry built or subtraction of
 * two entries, and one per character copied. Ranges are 0-based; queries are inclusive l..r.
 */

export const MAX_N = 12;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;
export const MAX_TEXT = 16;
export const MAX_QUERIES = 6;
export const MAX_TARGET = MAX_N * MAX_VALUE;

/** @typedef {'pair-sum' | 'palindrome' | 'max-window' | 'shortest-window' | 'range-sums'} ProblemId */
/** @typedef {'pointers' | 'window' | 'prefix' | 'brute'} Technique */
/** @typedef {'best' | 'works' | 'no'} Fit */

/** @type {ProblemId[]} */
export const PROBLEMS = ['pair-sum', 'palindrome', 'max-window', 'shortest-window', 'range-sums'];
/** @type {Technique[]} */
export const TECHNIQUES = ['pointers', 'window', 'prefix', 'brute'];

/** @type {Record<ProblemId, Record<Technique, Fit>>} */
export const FIT = {
  'pair-sum': { pointers: 'best', window: 'no', prefix: 'no', brute: 'works' },
  palindrome: { pointers: 'best', window: 'no', prefix: 'no', brute: 'works' },
  'max-window': { pointers: 'no', window: 'best', prefix: 'works', brute: 'works' },
  'shortest-window': { pointers: 'no', window: 'best', prefix: 'works', brute: 'works' },
  'range-sums': { pointers: 'no', window: 'no', prefix: 'best', brute: 'works' },
};

/**
 * The input of one problem. `values` feeds every problem but the palindrome, which reads
 * `text`; `target` is T, k or S; `queries` are inclusive (l, r) pairs.
 * @typedef {object} PracticeInput
 * @property {number[]} values
 * @property {string} text
 * @property {number} target
 * @property {[number, number][]} queries
 */

/** @type {Record<ProblemId, PracticeInput>} */
export const SAMPLES = {
  'pair-sum': { values: [1, 3, 4, 6, 8, 11, 15], text: '', target: 14, queries: [] },
  palindrome: { values: [], text: 'racecar', target: 0, queries: [] },
  'max-window': { values: [4, -1, 2, 7, -3, 5, 1, -2], text: '', target: 3, queries: [] },
  'shortest-window': { values: [2, 3, 1, 2, 4, 3], text: '', target: 7, queries: [] },
  'range-sums': {
    values: [3, -2, 5, 1, 4, -1, 2, 6],
    text: '',
    target: 0,
    queries: [
      [0, 3],
      [2, 6],
      [5, 5],
      [1, 7],
    ],
  },
};

const BUILD = '  for i = 0 to n − 1: P[i + 1] = P[i] + a[i]';

/** @type {Record<ProblemId, Partial<Record<Technique, string[]>>>} */
export const practicePseudocode = {
  'pair-sum': {
    pointers: [
      'pairSum(a, T):          ▹ a sorted ascending',
      '  lo = 0; hi = n − 1',
      '  while lo < hi:',
      '    s = a[lo] + a[hi]',
      '    if s == T: return (lo, hi)',
      '    else if s < T: lo = lo + 1',
      '    else: hi = hi − 1',
      '  return none',
    ],
    brute: [
      'pairSumBrute(a, T):',
      '  for i = 0 to n − 2:',
      '    for j = i + 1 to n − 1:',
      '      if a[i] + a[j] == T: return (i, j)',
      '  return none',
    ],
  },
  palindrome: {
    pointers: [
      'isPalindrome(s):',
      '  lo = 0; hi = n − 1',
      '  while lo < hi:',
      '    if s[lo] ≠ s[hi]: return false',
      '    lo = lo + 1; hi = hi − 1',
      '  return true',
    ],
    brute: [
      'isPalindromeByCopy(s):',
      '  r = new string of n characters   ▹ O(n) extra memory',
      '  for i = 0 to n − 1: r[i] = s[n − 1 − i]',
      '  for i = 0 to n − 1:',
      '    if s[i] ≠ r[i]: return false',
      '  return true',
    ],
  },
  'max-window': {
    window: [
      'maxWindowSum(a, k):',
      '  sum = a[0] + … + a[k − 1]',
      '  best = sum',
      '  for r = k to n − 1:',
      '    sum = sum + a[r] − a[r − k]',
      '    best = max(best, sum)',
      '  return best',
    ],
    prefix: [
      'maxWindowByPrefix(a, k):',
      '  P[0] = 0',
      BUILD,
      '  best = −∞',
      '  for l = 0 to n − k:',
      '    best = max(best, P[l + k] − P[l])',
      '  return best',
    ],
    brute: [
      'maxWindowBrute(a, k):',
      '  best = −∞',
      '  for l = 0 to n − k:',
      '    sum = a[l] + … + a[l + k − 1]   ▹ k additions',
      '    best = max(best, sum)',
      '  return best',
    ],
  },
  'shortest-window': {
    window: [
      'shortestWindow(a, S):    ▹ every a[i] ≥ 0',
      '  l = 0; sum = 0; best = ∞',
      '  for r = 0 to n − 1:',
      '    sum = sum + a[r]',
      '    while sum ≥ S:',
      '      best = min(best, r − l + 1)',
      '      sum = sum − a[l]; l = l + 1',
      '  return best',
    ],
    prefix: [
      'shortestByPrefix(a, S):',
      '  P[0] = 0',
      BUILD,
      '  best = ∞',
      '  for l = 0 to n − 1:',
      '    for r = l to n − 1:',
      '      if P[r + 1] − P[l] ≥ S:',
      '        best = min(best, r − l + 1); break',
      '  return best',
    ],
    brute: [
      'shortestBrute(a, S):',
      '  best = ∞',
      '  for l = 0 to n − 1:',
      '    sum = 0',
      '    for r = l to n − 1:',
      '      sum = sum + a[r]',
      '      if sum ≥ S: best = min(best, r − l + 1); break',
      '  return best',
    ],
  },
  'range-sums': {
    prefix: [
      'rangeSums(a, queries):',
      '  P[0] = 0',
      BUILD,
      '  for each (l, r) in queries:',
      '    answer P[r + 1] − P[l]      ▹ one subtraction',
      '  return answers',
    ],
    brute: [
      'rangeSumsBrute(a, queries):',
      '  for each (l, r) in queries:',
      '    answer a[l] + … + a[r]      ▹ r − l + 1 additions',
      '  return answers',
    ],
  },
};

/** @param {ProblemId} problem @param {Technique} technique @returns {string[]} */
export const pseudocodeFor = (problem, technique) => practicePseudocode[problem][technique] ?? [];

/**
 * @typedef {object} PracticeFrame
 * @property {'start'|'check'|'compare'|'copy'|'fill'|'first'|'slide'|'expand'|'record'|'shrink'|'build'|'lookup'|'sum'|'add'|'done'} kind
 * @property {ProblemId} problem
 * @property {Technique} technique
 * @property {Fit} fit
 * @property {(number|string)[]} items  The array, or the characters of the string.
 * @property {(number|string|null)[] | null} aux  Prefix sums P or the reversed copy r; null = not filled.
 * @property {number} target  T, k or S; 0 when the problem has none.
 * @property {[number, number][]} queries
 * @property {{name: string, index: number}[]} pointers  Named indices into `items`.
 * @property {{name: string, index: number}[]} auxPointers  Named indices into `aux`.
 * @property {[number, number] | null} range  Half-open range of `items` summed on this frame.
 * @property {number[]} reads  Indices of `items` read on this frame.
 * @property {number[]} auxReads  Indices of `aux` read on this frame.
 * @property {number} auxWrite  Index of `aux` written on this frame, -1 when none.
 * @property {number | null} value  The sum or comparison of this frame.
 * @property {-1 | 0 | 1 | null} cmp  value against the target (pair, window), or 0 for equal and 1
 *   for different characters (palindrome).
 * @property {number | null} best  Best window sum or shortest length so far.
 * @property {number} bestFrom  Start of the best window, -1 when none.
 * @property {number} bestTo  One past its end, -1 when none.
 * @property {boolean} improved  The best changed on this frame.
 * @property {[number, number] | null} found  The pair found, or the two characters that differ.
 * @property {boolean | null} verdict  Pair found or palindrome, once known.
 * @property {number} query  The query running now, -1 when none.
 * @property {(number | null)[]} answers  One result per query, null until answered.
 * @property {number} steps
 * @property {number[]} lines
 */

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text @param {number} min @param {number} max
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseNumbers(text, min = MIN_VALUE, max = MAX_VALUE) {
  const tokens = text
    .replace(/[−–]/g, '-')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < min || v > max)) return { error: 'range' };
  if (values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Values for one problem: a pair search needs them sorted, the shortest window needs no
 * negative values, and a pair needs at least two of them.
 * @param {ProblemId} problem @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' | 'unsorted' | 'negative' | 'short' }}
 */
export function parseValuesFor(problem, text) {
  const parsed = parseNumbers(text, problem === 'shortest-window' ? -Infinity : MIN_VALUE);
  if ('error' in parsed) return parsed;
  const v = parsed.values;
  if (problem === 'shortest-window' && v.some((x) => x < 0)) return { error: 'negative' };
  if (problem === 'pair-sum' && v.length < 2) return { error: 'short' };
  if (problem === 'pair-sum' && v.some((x, i) => i > 0 && v[i - 1] > x))
    return { error: 'unsorted' };
  return parsed;
}

/**
 * Reads the palindrome text: 1 to MAX_TEXT characters, spaces removed.
 * @param {string} text
 * @returns {{ text: string } | { error: 'empty' | 'long' }}
 */
export function parseText(text) {
  const t = text.replace(/\s+/g, '');
  if (t.length === 0) return { error: 'empty' };
  if (Array.from(t).length > MAX_TEXT) return { error: 'long' };
  return { text: t };
}

/**
 * Reads inclusive queries written as "l r" or "l-r", separated by commas.
 * @param {string} text @param {number} n  Length of the array.
 * @returns {{ queries: [number, number][] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseQueries(text, n) {
  const parts = text
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { error: 'format' };
  /** @type {[number, number][]} */
  const queries = [];
  for (const part of parts) {
    const m = /^(\d+)\s*(?:-|–|\.\.|\s)\s*(\d+)$/.exec(part);
    if (!m) return { error: 'format' };
    const l = Number(m[1]);
    const r = Number(m[2]);
    if (l > r || r >= n) return { error: 'range' };
    queries.push([l, r]);
  }
  if (queries.length > MAX_QUERIES) return { error: 'count' };
  return { queries };
}

/**
 * @param {ProblemId} problem @param {Technique} technique @param {PracticeInput} input
 */
function recorder(problem, technique, input) {
  const items =
    problem === 'palindrome'
      ? Array.from(input.text)
      : /** @type {(number|string)[]} */ (input.values.slice());
  /** @type {PracticeFrame[]} */
  const frames = [];
  // P is drawn empty from the first frame, so the learner sees the extra array it costs.
  const prefixRun = technique === 'prefix' && FIT[problem][technique] !== 'no';
  const s = {
    /** @type {(number|string|null)[] | null} */
    aux: prefixRun ? Array.from({ length: items.length + 1 }, () => null) : null,
    /** @type {{name: string, index: number}[]} */
    pointers: [],
    /** @type {{name: string, index: number}[]} */
    auxPointers: [],
    /** @type {[number, number] | null} */
    range: null,
    /** @type {number[]} */
    reads: [],
    /** @type {number[]} */
    auxReads: [],
    auxWrite: -1,
    /** @type {number | null} */
    value: null,
    /** @type {-1 | 0 | 1 | null} */
    cmp: null,
    /** @type {number | null} */
    best: null,
    bestFrom: -1,
    bestTo: -1,
    improved: false,
    /** @type {[number, number] | null} */
    found: null,
    /** @type {boolean | null} */
    verdict: null,
    query: -1,
    /** @type {(number | null)[]} */
    answers: problem === 'range-sums' ? input.queries.map(() => null) : [],
    steps: 0,
  };
  /** @param {PracticeFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      problem,
      technique,
      fit: FIT[problem][technique],
      items: items.slice(),
      target: input.target,
      queries: input.queries.map(([l, r]) => /** @type {[number, number]} */ ([l, r])),
      ...s,
      aux: s.aux ? s.aux.slice() : null,
      pointers: s.pointers.map((p) => ({ ...p })),
      auxPointers: s.auxPointers.map((p) => ({ ...p })),
      range: s.range ? [s.range[0], s.range[1]] : null,
      reads: s.reads.slice(),
      auxReads: s.auxReads.slice(),
      found: s.found ? [s.found[0], s.found[1]] : null,
      answers: s.answers.slice(),
      lines: lines.slice(),
    });
    s.reads = [];
    s.auxReads = [];
    s.auxWrite = -1;
    s.improved = false;
  }
  /** @param {number | null} best @param {number} from @param {number} to */
  function setBest(best, from, to) {
    s.best = best;
    s.bestFrom = from;
    s.bestTo = to;
    s.improved = true;
  }
  /** Builds P one entry per frame. @param {number[]} a */
  function buildPrefix(a) {
    const P = /** @type {(number|null)[]} */ (s.aux);
    P[0] = 0;
    for (let i = 0; i < a.length; i++) {
      P[i + 1] = /** @type {number} */ (P[i]) + a[i];
      s.steps++;
      s.reads = [i];
      s.auxReads = [i];
      s.auxWrite = i + 1;
      s.pointers = [{ name: 'i', index: i }];
      s.auxPointers = [];
      push('build', [2]);
    }
    s.pointers = [];
    return /** @type {number[]} */ (P);
  }
  return { items, frames, s, push, setBest, buildPrefix };
}

/** @param {number} a @param {number} b @returns {-1 | 0 | 1} */
const sign = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** @param {number} from @param {number} to */
const span = (from, to) => Array.from({ length: to - from }, (_, i) => from + i);

/** @type {Record<string, (r: ReturnType<typeof recorder>, input: PracticeInput) => void>} */
const RUNS = {
  'pair-sum/pointers'({ items, s, push }, { target }) {
    const a = /** @type {number[]} */ (items);
    let lo = 0;
    let hi = a.length - 1;
    s.pointers = [
      { name: 'lo', index: lo },
      { name: 'hi', index: hi },
    ];
    push('start', [0, 1]);
    while (lo < hi) {
      s.pointers = [
        { name: 'lo', index: lo },
        { name: 'hi', index: hi },
      ];
      s.value = a[lo] + a[hi];
      s.cmp = sign(s.value, target);
      s.reads = [lo, hi];
      s.steps++;
      if (s.cmp === 0) {
        s.found = [lo, hi];
        s.verdict = true;
        push('check', [2, 3, 4]);
        push('done', [4]);
        return;
      }
      push('check', s.cmp < 0 ? [2, 3, 5] : [2, 3, 6]);
      if (s.cmp < 0) lo++;
      else hi--;
    }
    s.pointers = [
      { name: 'lo', index: lo },
      { name: 'hi', index: hi },
    ];
    s.verdict = false;
    s.value = null;
    s.cmp = null;
    push('done', [2, 7]);
  },
  'pair-sum/brute'({ items, s, push }, { target }) {
    const a = /** @type {number[]} */ (items);
    push('start', [0]);
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = i + 1; j < a.length; j++) {
        s.pointers = [
          { name: 'i', index: i },
          { name: 'j', index: j },
        ];
        s.value = a[i] + a[j];
        s.cmp = sign(s.value, target);
        s.reads = [i, j];
        s.steps++;
        if (s.cmp === 0) {
          s.found = [i, j];
          s.verdict = true;
          push('check', [1, 2, 3]);
          push('done', [3]);
          return;
        }
        push('check', [1, 2, 3]);
      }
    }
    s.verdict = false;
    s.value = null;
    s.cmp = null;
    s.pointers = [];
    push('done', [4]);
  },
  'palindrome/pointers'({ items, s, push }) {
    let lo = 0;
    let hi = items.length - 1;
    s.pointers = [
      { name: 'lo', index: lo },
      { name: 'hi', index: hi },
    ];
    push('start', [0, 1]);
    while (lo < hi) {
      s.pointers = [
        { name: 'lo', index: lo },
        { name: 'hi', index: hi },
      ];
      s.reads = [lo, hi];
      s.steps++;
      if (items[lo] !== items[hi]) {
        s.cmp = 1;
        s.found = [lo, hi];
        s.verdict = false;
        push('compare', [2, 3]);
        push('done', [3]);
        return;
      }
      s.cmp = 0;
      push('compare', [2, 3, 4]);
      lo++;
      hi--;
    }
    s.pointers = [
      { name: 'lo', index: lo },
      { name: 'hi', index: hi },
    ];
    s.cmp = null;
    s.verdict = true;
    push('done', [2, 5]);
  },
  'palindrome/brute'({ items, s, push }) {
    const n = items.length;
    s.aux = Array.from({ length: n }, () => null);
    push('start', [0, 1]);
    for (let i = 0; i < n; i++) {
      s.aux[i] = items[n - 1 - i];
      s.steps++;
      s.reads = [n - 1 - i];
      s.auxWrite = i;
      s.auxPointers = [{ name: 'i', index: i }];
      push('copy', [2]);
    }
    for (let i = 0; i < n; i++) {
      s.pointers = [{ name: 'i', index: i }];
      s.auxPointers = [{ name: 'i', index: i }];
      s.reads = [i];
      s.auxReads = [i];
      s.steps++;
      if (items[i] !== s.aux[i]) {
        s.cmp = 1;
        s.found = [i, n - 1 - i];
        s.verdict = false;
        push('compare', [3, 4]);
        push('done', [4]);
        return;
      }
      s.cmp = 0;
      push('compare', [3, 4]);
    }
    s.cmp = null;
    s.verdict = true;
    push('done', [5]);
  },
  'max-window/window'({ items, s, push, setBest }, { target: k }) {
    const a = /** @type {number[]} */ (items);
    push('start', [0]);
    let sum = 0;
    for (let r = 0; r < k; r++) {
      sum += a[r];
      s.steps++;
      s.value = sum;
      s.range = [0, r + 1];
      s.reads = [r];
      s.pointers = [{ name: 'r', index: r }];
      push('fill', [1]);
    }
    setBest(sum, 0, k);
    push('first', [2]);
    for (let r = k; r < a.length; r++) {
      sum += a[r] - a[r - k];
      s.steps += 2;
      s.value = sum;
      s.range = [r - k + 1, r + 1];
      s.reads = [r, r - k];
      s.pointers = [{ name: 'r', index: r }];
      if (sum > /** @type {number} */ (s.best)) setBest(sum, r - k + 1, r + 1);
      push('slide', [3, 4, 5]);
    }
    s.pointers = [];
    s.range = null;
    s.value = null;
    push('done', [6]);
  },
  'max-window/prefix'(rec, { target: k }) {
    const { items, s, push, setBest, buildPrefix } = rec;
    push('start', [0, 1]);
    const P = buildPrefix(/** @type {number[]} */ (items));
    for (let l = 0; l + k <= items.length; l++) {
      s.value = P[l + k] - P[l];
      s.steps++;
      s.range = [l, l + k];
      s.auxReads = [l, l + k];
      s.auxPointers = [
        { name: 'l', index: l },
        { name: 'l + k', index: l + k },
      ];
      if (s.best === null || s.value > s.best) setBest(s.value, l, l + k);
      push('lookup', l === 0 ? [3, 4, 5] : [4, 5]);
    }
    s.auxPointers = [];
    s.range = null;
    s.value = null;
    push('done', [6]);
  },
  'max-window/brute'({ items, s, push, setBest }, { target: k }) {
    const a = /** @type {number[]} */ (items);
    push('start', [0, 1]);
    for (let l = 0; l + k <= a.length; l++) {
      let sum = 0;
      for (let i = l; i < l + k; i++) sum += a[i];
      s.steps += k;
      s.value = sum;
      s.range = [l, l + k];
      s.reads = span(l, l + k);
      s.pointers = [{ name: 'l', index: l }];
      if (s.best === null || sum > s.best) setBest(sum, l, l + k);
      push('sum', [2, 3, 4]);
    }
    s.pointers = [];
    s.range = null;
    s.value = null;
    push('done', [5]);
  },
  'shortest-window/window'({ items, s, push, setBest }, { target }) {
    const a = /** @type {number[]} */ (items);
    let l = 0;
    let sum = 0;
    s.value = 0;
    push('start', [0, 1]);
    for (let r = 0; r < a.length; r++) {
      sum += a[r];
      s.steps++;
      s.value = sum;
      s.range = [l, r + 1];
      s.reads = [r];
      s.pointers = [
        { name: 'l', index: l },
        { name: 'r', index: r },
      ];
      s.cmp = sum >= target ? 1 : -1;
      push('expand', [2, 3]);
      while (sum >= target) {
        if (s.best === null || r - l + 1 < s.best) setBest(r - l + 1, l, r + 1);
        push('record', [4, 5]);
        sum -= a[l];
        s.reads = [l];
        l++;
        s.steps++;
        s.value = sum;
        s.range = [l, r + 1];
        s.pointers = [
          { name: 'l', index: l },
          { name: 'r', index: r },
        ];
        s.cmp = sum >= target ? 1 : -1;
        push('shrink', [6]);
      }
    }
    s.pointers = [];
    s.range = null;
    s.value = null;
    s.cmp = null;
    push('done', [7]);
  },
  'shortest-window/prefix'(rec, { target }) {
    const { items, s, push, setBest, buildPrefix } = rec;
    push('start', [0, 1]);
    const P = buildPrefix(/** @type {number[]} */ (items));
    for (let l = 0; l < items.length; l++) {
      for (let r = l; r < items.length; r++) {
        s.value = P[r + 1] - P[l];
        s.steps++;
        s.range = [l, r + 1];
        s.auxReads = [l, r + 1];
        s.auxPointers = [
          { name: 'l', index: l },
          { name: 'r + 1', index: r + 1 },
        ];
        s.cmp = s.value >= target ? 1 : -1;
        const lines = l === 0 && r === 0 ? [3, 4, 5, 6] : r === l ? [4, 5, 6] : [5, 6];
        if (s.cmp > 0) {
          if (s.best === null || r - l + 1 < s.best) setBest(r - l + 1, l, r + 1);
          push('lookup', [...lines, 7]);
          break;
        }
        push('lookup', lines);
      }
    }
    s.auxPointers = [];
    s.range = null;
    s.value = null;
    s.cmp = null;
    push('done', [8]);
  },
  'shortest-window/brute'({ items, s, push, setBest }, { target }) {
    const a = /** @type {number[]} */ (items);
    push('start', [0, 1]);
    for (let l = 0; l < a.length; l++) {
      let sum = 0;
      for (let r = l; r < a.length; r++) {
        sum += a[r];
        s.steps++;
        s.value = sum;
        s.range = [l, r + 1];
        s.reads = [r];
        s.pointers = [
          { name: 'l', index: l },
          { name: 'r', index: r },
        ];
        s.cmp = sum >= target ? 1 : -1;
        const lines = r === l ? [2, 3, 4, 5, 6] : [4, 5, 6];
        if (s.cmp > 0) {
          if (s.best === null || r - l + 1 < s.best) setBest(r - l + 1, l, r + 1);
          push('add', lines);
          break;
        }
        push('add', lines);
      }
    }
    s.pointers = [];
    s.range = null;
    s.value = null;
    s.cmp = null;
    push('done', [7]);
  },
  'range-sums/prefix'(rec, { queries }) {
    const { items, s, push, buildPrefix } = rec;
    push('start', [0, 1]);
    const P = buildPrefix(/** @type {number[]} */ (items));
    queries.forEach(([l, r], q) => {
      s.query = q;
      s.value = P[r + 1] - P[l];
      s.answers[q] = s.value;
      s.steps++;
      s.range = [l, r + 1];
      s.auxReads = [l, r + 1];
      s.auxPointers = [
        { name: 'l', index: l },
        { name: 'r + 1', index: r + 1 },
      ];
      push('lookup', [3, 4]);
    });
    s.query = -1;
    s.auxPointers = [];
    s.range = null;
    s.value = null;
    push('done', [5]);
  },
  'range-sums/brute'({ items, s, push }, { queries }) {
    const a = /** @type {number[]} */ (items);
    push('start', [0]);
    queries.forEach(([l, r], q) => {
      let sum = 0;
      for (let i = l; i <= r; i++) sum += a[i];
      s.query = q;
      s.value = sum;
      s.answers[q] = sum;
      s.steps += r - l + 1;
      s.range = [l, r + 1];
      s.reads = span(l, r + 1);
      s.pointers = [
        { name: 'l', index: l },
        { name: 'r', index: r },
      ];
      push('sum', [1, 2]);
    });
    s.query = -1;
    s.pointers = [];
    s.range = null;
    s.value = null;
    push('done', [3]);
  },
};

/**
 * Runs one technique on one problem.
 * @param {ProblemId} problem @param {Technique} technique @param {PracticeInput} input
 * @returns {PracticeFrame[]}
 */
export function solveTrace(problem, technique, input) {
  const rec = recorder(problem, technique, input);
  const run = RUNS[`${problem}/${technique}`];
  if (!run) {
    rec.push('start', []);
    rec.push('done', []);
  } else run(rec, input);
  return rec.frames;
}

/**
 * Steps every technique takes on this input, null for one that does not fit.
 * @param {ProblemId} problem @param {PracticeInput} input
 * @returns {Record<Technique, number | null>}
 */
export function stepsByTechnique(problem, input) {
  return /** @type {Record<Technique, number | null>} */ (
    Object.fromEntries(
      TECHNIQUES.map((t) => [
        t,
        FIT[problem][t] === 'no'
          ? null
          : /** @type {PracticeFrame} */ (solveTrace(problem, t, input).at(-1)).steps,
      ]),
    )
  );
}
