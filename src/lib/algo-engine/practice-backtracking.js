/**
 * Two classic backtracking problems, each traced once per input.
 *
 * - Word search: does a word appear in a letter grid as a path of neighbouring cells, each used
 *   at most once? Neighbours are tried right, down, left, up, and starting cells in reading
 *   order. A run stops at the first path found.
 * - Combination sum: every multiset of distinct positive candidates that adds up to a total,
 *   each candidate usable any number of times. Candidates are sorted, so the loop can stop at
 *   the first one too big, and a call passes its own index so a candidate may repeat but an
 *   earlier one can never come back, which keeps each multiset to one order.
 *
 * Both can take exponential time on a small input, such as AAAAAAB in a grid of As, so a trace
 * stops at MAX_FRAMES and says so.
 */

/** @typedef {[number, number]} Cell */

/**
 * @typedef {object} WordFrame
 * @property {'start'|'match'|'wrong'|'used'|'retreat'|'found'|'done'} kind
 * @property {string[][]} grid
 * @property {string} word
 * @property {Cell[]} path  Cells of the path being tried, in order.
 * @property {number} r  The cell acted on, -1 for none.
 * @property {number} c
 * @property {number} k  Index in the word of the letter wanted.
 * @property {number} checked  Cells checked so far.
 * @property {number} retreats  Steps back so far.
 * @property {boolean} found
 * @property {boolean} cutoff  The trace stopped at MAX_FRAMES before the search finished.
 * @property {number[]} lines
 */

/**
 * @typedef {object} SumNode
 * @property {number} id  Visit order, from 0 at the root.
 * @property {number} parent  Parent id, -1 for the root.
 * @property {number} picked  The candidate picked on the way here, 0 at the root.
 * @property {number} remaining  What is still to reach.
 * @property {boolean} open  Whether the call is still running.
 * @property {boolean} hit  Whether this call reached the total exactly.
 */

/**
 * @typedef {object} SumFrame
 * @property {'start'|'pick'|'hit'|'stop'|'unpick'|'done'} kind
 * @property {number[]} candidates  Sorted.
 * @property {number} total
 * @property {SumNode[]} nodes  Only the calls made so far.
 * @property {number} current  The node acted on, -1 at the end.
 * @property {number} at  Index of the candidate acted on, -1 for none.
 * @property {number} remaining  What is still to reach.
 * @property {number[]} path  The candidates picked now.
 * @property {number[][]} solutions  Every combination found so far.
 * @property {number} calls  Calls made so far, the first one included.
 * @property {number} stops  Loops stopped early by the too-big check.
 * @property {boolean} cutoff  The trace stopped at MAX_FRAMES before the search finished.
 * @property {number[]} lines
 */

export const MAX_SIDE = 5;
export const MAX_WORD = 12;
export const MAX_CANDIDATES = 6;
export const MAX_CANDIDATE = 20;
export const MAX_TOTAL = 30;
export const MAX_FRAMES = 400;

/** @type {{key: string, rows: string[], word: string}[]} */
export const WORD_PRESETS = [
  { key: 'found', rows: ['ABCE', 'SFCS', 'ADEE'], word: 'ABCCED' },
  { key: 'absent', rows: ['ABCE', 'SFCS', 'ADEE'], word: 'ABCB' },
  { key: 'retreat', rows: ['ABAB', 'BABA', 'ABAC'], word: 'ABAC' },
  { key: 'trap', rows: ['AAA', 'AAA', 'AAB'], word: 'AAAAAAAAC' },
];

/** @type {{key: string, candidates: number[], total: number}[]} */
export const SUM_PRESETS = [
  { key: 'seven', candidates: [2, 3, 6, 7], total: 7 },
  { key: 'eight', candidates: [2, 3, 5], total: 8 },
  { key: 'none', candidates: [4, 6], total: 7 },
  { key: 'ten', candidates: [1, 2], total: 10 },
];

export const wordPseudocode = [
  'exists(grid, word):',
  '  for each cell (r, c): if dfs(r, c, 0): return true',
  '  return false',
  'dfs(r, c, k):',
  '  if (r, c) is used or grid[r][c] != word[k]: return false',
  '  mark (r, c) as used',
  '  if k == len(word) - 1: return true',
  '  for each neighbour (x, y) on the grid:',
  '    if dfs(x, y, k + 1): return true',
  '  unmark (r, c)   // retreat',
  '  return false',
];

export const sumPseudocode = [
  'combine(start, remaining, path):',
  '  if remaining == 0: record a copy of path; return',
  '  for i = start to n-1:',
  '    if a[i] > remaining: break   // sorted, so nothing later fits',
  '    path.push(a[i])',
  '    combine(i, remaining - a[i], path)   // i again: it may repeat',
  '    path.pop()',
];

/**
 * Reads a letter grid: rows of equal length separated by spaces, slashes or commas.
 * @param {string} text
 * @returns {string[][]|null}
 */
export function parseGrid(text) {
  const rows = text
    .toUpperCase()
    .split(/[\s,/]+/)
    .filter(Boolean);
  if (rows.length === 0 || rows.length > MAX_SIDE) return null;
  if (!rows.every((row) => /^[A-Z]+$/.test(row))) return null;
  const width = rows[0].length;
  if (width > MAX_SIDE || rows.some((row) => row.length !== width)) return null;
  return rows.map((row) => [...row]);
}

/**
 * Reads a word of 1 to MAX_WORD letters.
 * @param {string} text
 * @returns {string|null}
 */
export function parseWord(text) {
  const word = text.trim().toUpperCase();
  return /^[A-Z]+$/.test(word) && word.length <= MAX_WORD ? word : null;
}

/**
 * Reads candidates: up to MAX_CANDIDATES whole numbers from 1 to MAX_CANDIDATE. Returns them
 * sorted with repeats removed, since a candidate may already be used any number of times.
 * @param {string} text
 * @returns {number[]|null}
 */
export function parseCandidates(text) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0 || !parts.every((p) => /^\d+$/.test(p))) return null;
  const values = parts.map(Number);
  if (values.some((v) => v < 1 || v > MAX_CANDIDATE)) return null;
  const distinct = [...new Set(values)].sort((a, b) => a - b);
  return distinct.length > MAX_CANDIDATES ? null : distinct;
}

/**
 * Reads the total, a whole number from 1 to MAX_TOTAL.
 * @param {string} text
 * @returns {number|null}
 */
export function parseTotal(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n < 1 || n > MAX_TOTAL ? null : n;
}

/** @type {Cell[]} Right, down, left, up. */
const NEIGHBOURS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

/**
 * Runs word search once and records every step.
 * @param {string[][]} grid
 * @param {string} word
 * @returns {WordFrame[]}
 */
export function wordTrace(grid, word) {
  const rows = grid.length;
  const cols = grid[0].length;
  const used = grid.map((row) => row.map(() => false));
  /** @type {Cell[]} */
  const path = [];
  /** @type {WordFrame[]} */
  const frames = [];
  let checked = 0;
  let retreats = 0;
  let found = false;
  let cutoff = false;

  /**
   * @param {WordFrame['kind']} kind @param {number} r @param {number} c @param {number} k
   * @param {number[]} lines
   */
  function record(kind, r, c, k, lines) {
    frames.push({
      kind,
      grid: grid.map((row) => row.slice()),
      word,
      path: path.map(([y, x]) => [y, x]),
      r,
      c,
      k,
      checked,
      retreats,
      found,
      cutoff,
      lines,
    });
  }

  function outOfRoom() {
    if (frames.length >= MAX_FRAMES - 2) cutoff = true;
    return cutoff;
  }

  /**
   * @param {number} r @param {number} c @param {number} k
   * @returns {boolean} true when the search should stop.
   */
  function dfs(r, c, k) {
    if (outOfRoom()) return true;
    checked++;
    const from = k === 0 ? 1 : 8;
    if (used[r][c]) {
      record('used', r, c, k, [from, 3, 4]);
      return false;
    }
    if (grid[r][c] !== word[k]) {
      record('wrong', r, c, k, [from, 3, 4]);
      return false;
    }
    used[r][c] = true;
    path.push([r, c]);
    if (k === word.length - 1) {
      found = true;
      record('found', r, c, k, [5, 6]);
      return true;
    }
    record('match', r, c, k, [from, 5, 7]);
    for (const [dy, dx] of NEIGHBOURS) {
      const y = r + dy;
      const x = c + dx;
      if (y < 0 || y >= rows || x < 0 || x >= cols) continue;
      if (dfs(y, x, k + 1)) return true;
    }
    if (outOfRoom()) return true;
    used[r][c] = false;
    path.pop();
    retreats++;
    record('retreat', r, c, k, [9, 10]);
    return false;
  }

  record('start', -1, -1, 0, [0]);
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) break outer;
    }
  }
  record('done', -1, -1, 0, found ? [1] : [2]);
  return frames;
}

/**
 * Runs combination sum once and records every step.
 * @param {number[]} input  Distinct positive candidates.
 * @param {number} total
 * @returns {SumFrame[]}
 */
export function sumTrace(input, total) {
  const candidates = input.slice().sort((a, b) => a - b);
  /** @type {SumNode[]} */
  const nodes = [{ id: 0, parent: -1, picked: 0, remaining: total, open: true, hit: false }];
  /** @type {number[]} */
  const path = [];
  /** @type {number[][]} */
  const solutions = [];
  /** @type {SumFrame[]} */
  const frames = [];
  let stops = 0;
  let cutoff = false;

  /**
   * @param {SumFrame['kind']} kind @param {number} current @param {number} at
   * @param {number} remaining @param {number[]} lines
   */
  function record(kind, current, at, remaining, lines) {
    frames.push({
      kind,
      candidates: candidates.slice(),
      total,
      nodes: nodes.map((x) => ({ ...x })),
      current,
      at,
      remaining,
      path: path.slice(),
      solutions: solutions.map((s) => s.slice()),
      calls: nodes.length,
      stops,
      cutoff,
      lines,
    });
  }

  function outOfRoom() {
    if (frames.length >= MAX_FRAMES - 2) cutoff = true;
    return cutoff;
  }

  /**
   * @param {number} id @param {number} start @param {number} remaining
   * @returns {boolean} true when the trace ran out of room.
   */
  function combine(id, start, remaining) {
    if (remaining === 0) {
      solutions.push(path.slice());
      nodes[id].hit = true;
      record('hit', id, -1, remaining, [1]);
      return false;
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remaining) {
        stops++;
        record('stop', id, i, remaining, [2, 3]);
        break;
      }
      if (outOfRoom()) return true;
      path.push(candidates[i]);
      const child = nodes.length;
      nodes.push({
        id: child,
        parent: id,
        picked: candidates[i],
        remaining: remaining - candidates[i],
        open: true,
        hit: false,
      });
      record('pick', child, i, remaining - candidates[i], [2, 4, 5]);
      if (combine(child, i, remaining - candidates[i])) return true;
      nodes[child].open = false;
      path.pop();
      record('unpick', id, i, remaining, [6]);
    }
    return false;
  }

  record('start', 0, -1, total, [0]);
  combine(0, 0, total);
  nodes.forEach((x) => {
    x.open = false;
  });
  record('done', -1, -1, total, [0]);
  return frames;
}
