/**
 * Ten code snippets to sort into growth classes, and a doubling experiment that measures
 * each one: run the snippet for n = 1, 2, 4, … and count how often its marked basic
 * operation executes. The counts come from actually running the loops and recursions, not
 * from a formula, so the measurement is independent of the answer key.
 *
 * What the count does when n doubles points at the class: stays the same (O(1)), grows by
 * a constant (O(log n)), doubles (O(n)), a little more than doubles (O(n log n)), grows
 * four times (O(n²)), or explodes (exponential).
 */

/** @typedef {'1' | 'log' | 'n' | 'nlogn' | 'n2' | 'exp'} Bucket */
/** @typedef {'formula' | 'halving' | 'single' | 'fixed-inner' | 'nested' | 'triangle' | 'loglinear' | 'geometric' | 'split' | 'fib'} SnippetId */

/** @type {Bucket[]} */
export const BUCKETS = ['1', 'log', 'n', 'nlogn', 'n2', 'exp'];

/**
 * @typedef {object} Snippet
 * @property {SnippetId} id
 * @property {string[]} code  Pseudocode, two-space indents.
 * @property {number} hot  The line whose executions are counted.
 * @property {Bucket} bucket  The tight growth class of the count.
 * @property {number} maxN  The largest n the doubling experiment runs.
 */

const MAX_N = 1024;
const MAX_N_EXP = 16;

/** @type {Snippet[]} */
export const SNIPPETS = [
  {
    id: 'nested',
    code: ['for i = 1 to n:', '  for j = 1 to n:', '    c = c + 1'],
    hot: 2,
    bucket: 'n2',
    maxN: MAX_N,
  },
  {
    id: 'halving',
    code: ['i = n', 'while i > 1:', '  i = ⌊i / 2⌋'],
    hot: 2,
    bucket: 'log',
    maxN: MAX_N,
  },
  {
    id: 'geometric',
    code: ['i = 1', 'while i ≤ n:', '  for j = 1 to i:', '    c = c + 1', '  i = 2 · i'],
    hot: 3,
    bucket: 'n',
    maxN: MAX_N,
  },
  {
    id: 'formula',
    code: ['s = n · (n + 1) / 2', 'return s'],
    hot: 0,
    bucket: '1',
    maxN: MAX_N,
  },
  {
    id: 'loglinear',
    code: ['for i = 1 to n:', '  j = 1', '  while j < n:', '    j = 2 · j'],
    hot: 3,
    bucket: 'nlogn',
    maxN: MAX_N,
  },
  {
    id: 'fib',
    code: ['fib(n):', '  c = c + 1', '  if n < 2: return n', '  return fib(n − 1) + fib(n − 2)'],
    hot: 1,
    bucket: 'exp',
    maxN: MAX_N_EXP,
  },
  {
    id: 'fixed-inner',
    code: ['for i = 1 to n:', '  for j = 1 to 10:', '    c = c + 1'],
    hot: 2,
    bucket: 'n',
    maxN: MAX_N,
  },
  {
    id: 'triangle',
    code: ['for i = 1 to n:', '  for j = 1 to i:', '    c = c + 1'],
    hot: 2,
    bucket: 'n2',
    maxN: MAX_N,
  },
  {
    id: 'split',
    code: [
      'split(n):',
      '  if n ≤ 1: return',
      '  for i = 1 to n:',
      '    c = c + 1',
      '  split(⌊n / 2⌋)',
      '  split(⌈n / 2⌉)',
    ],
    hot: 3,
    bucket: 'nlogn',
    maxN: MAX_N,
  },
  {
    id: 'single',
    code: ['s = 0', 'for i = 0 to n − 1:', '  s = s + A[i]', 'return s'],
    hot: 2,
    bucket: 'n',
    maxN: MAX_N,
  },
];

/** @param {SnippetId} id */
export function snippetById(id) {
  const s = SNIPPETS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown snippet ${id}`);
  return s;
}

/**
 * Runs a snippet for one n and counts the executions of its marked line.
 * @param {SnippetId} id
 * @param {number} n  n ≥ 1.
 */
export function countOps(id, n) {
  let c = 0;
  switch (id) {
    case 'formula':
      c = 1;
      break;
    case 'halving':
      for (let i = n; i > 1; i = Math.floor(i / 2)) c++;
      break;
    case 'single':
      for (let i = 0; i <= n - 1; i++) c++;
      break;
    case 'fixed-inner':
      for (let i = 1; i <= n; i++) for (let j = 1; j <= 10; j++) c++;
      break;
    case 'nested':
      for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) c++;
      break;
    case 'triangle':
      for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j++) c++;
      break;
    case 'loglinear':
      for (let i = 1; i <= n; i++) for (let j = 1; j < n; j *= 2) c++;
      break;
    case 'geometric':
      for (let i = 1; i <= n; i *= 2) for (let j = 1; j <= i; j++) c++;
      break;
    case 'split': {
      /** @param {number} k */
      const split = (k) => {
        if (k <= 1) return;
        for (let i = 1; i <= k; i++) c++;
        split(Math.floor(k / 2));
        split(Math.ceil(k / 2));
      };
      split(n);
      break;
    }
    case 'fib': {
      /** @param {number} k @returns {number} */
      const fib = (k) => {
        c++;
        if (k < 2) return k;
        return fib(k - 1) + fib(k - 2);
      };
      fib(n);
      break;
    }
  }
  return c;
}

/**
 * @typedef {object} DoublingRow
 * @property {number} n
 * @property {number} count
 * @property {number | null} ratio  count ÷ the previous count, null for the first row or after 0.
 * @property {number | null} diff  count − the previous count, null for the first row.
 */

/**
 * @typedef {object} DoublingFrame
 * @property {'start' | 'measure' | 'done'} kind
 * @property {SnippetId} id
 * @property {DoublingRow[]} rows  The measurements so far.
 * @property {number} total  Rows the whole experiment will have.
 * @property {number[]} lines
 */

/** The n values of a snippet's experiment: 1, 2, 4, …, maxN. @param {SnippetId} id */
export function doublingSizes(id) {
  const out = [];
  for (let n = 1; n <= snippetById(id).maxN; n *= 2) out.push(n);
  return out;
}

/**
 * @param {SnippetId} id
 * @returns {DoublingFrame[]}
 */
export function doublingTrace(id) {
  const snippet = snippetById(id);
  const sizes = doublingSizes(id);
  /** @type {DoublingFrame[]} */
  const frames = [];
  /** @type {DoublingRow[]} */
  const rows = [];

  /** @param {DoublingFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      id,
      rows: rows.map((r) => ({ ...r })),
      total: sizes.length,
      lines: lines.slice(),
    });

  push(
    'start',
    snippet.code.map((_, i) => i),
  );
  for (const n of sizes) {
    const count = countOps(id, n);
    const prev = rows.at(-1);
    rows.push({
      n,
      count,
      ratio: prev && prev.count > 0 ? count / prev.count : null,
      diff: prev ? count - prev.count : null,
    });
    push('measure', [snippet.hot]);
  }
  push('done', [snippet.hot]);
  return frames;
}

/** @typedef {'right' | 'wrong' | 'unplaced'} Verdict */

/**
 * Grades the learner's sorting: each card is right, wrong, or still unplaced.
 * @param {Partial<Record<SnippetId, Bucket | null>>} placement
 */
export function gradePlacement(placement) {
  /** @type {Record<SnippetId, Verdict>} */
  const verdicts = /** @type {Record<SnippetId, Verdict>} */ ({});
  let right = 0;
  for (const s of SNIPPETS) {
    const at = placement[s.id] ?? null;
    const v = at === null ? 'unplaced' : at === s.bucket ? 'right' : 'wrong';
    if (v === 'right') right++;
    verdicts[s.id] = v;
  }
  return { verdicts, right, total: SNIPPETS.length };
}
