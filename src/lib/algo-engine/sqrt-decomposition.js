/**
 * Two ways to use blocks of about √n cells, on a 0-based array with inclusive ranges.
 *
 * - Sqrt decomposition, online: split a into blocks of s cells and keep each block's sum. A query
 *   reads the loose cells at its two ends and one stored sum per whole block in between, so it
 *   makes at most 2(s − 1) + ⌈n / s⌉ reads, which is O(√n) when s is about √n. A point update
 *   changes one cell and one block sum.
 * - Mo's algorithm, offline: when all queries are known in advance, sort them by the block of
 *   their left end and then by their right end, and slide a window from one query to the next,
 *   adding or removing one cell at a time. The sorted order keeps the total sliding at
 *   O((n + q)·√n). Here each query counts the distinct values in its range, which has no simple
 *   merge, and is where Mo's algorithm earns its place.
 */

export const BLOCK_MAX_N = 25;
export const MO_MAX_N = 16;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;
export const MAX_BLOCK_OPS = 8;
export const MAX_QUERIES = 6;

export const blocksPseudocode = [
  'build(a, s):',
  '  for i = 0 to n − 1: sum[⌊i / s⌋] += a[i]',
  'query(l, r):',
  '  total = 0; i = l',
  '  while i ≤ r:',
  '    if i starts a block and the block ends by r:',
  '      total += sum[⌊i / s⌋]; i = next block start',
  '    else: total += a[i]; i += 1',
  '  return total',
  'set(i, x):',
  '  sum[⌊i / s⌋] += x − a[i]; a[i] = x',
];

export const moPseudocode = [
  'sort queries by (⌊l / s⌋, r)',
  'curL = 0, curR = −1, distinct = 0',
  'for each query (l, r) in sorted order:',
  '  while curL > l: curL −= 1; add(a[curL])',
  '  while curR < r: curR += 1; add(a[curR])',
  '  while curL < l: remove(a[curL]); curL += 1',
  '  while curR > r: remove(a[curR]); curR −= 1',
  '  answer[query] = distinct',
  'add(x): count[x] += 1; if count[x] == 1: distinct += 1',
  'remove(x): count[x] −= 1; if count[x] == 0: distinct −= 1',
];

/**
 * @typedef {{ type: 'query', l: number, r: number } | { type: 'set', i: number, x: number }} BlockOp
 */

/**
 * @typedef {object} BlockFrame
 * @property {'start'|'build'|'query-start'|'read-cell'|'read-block'|'answer'|'set'|'done'} kind
 * @property {number[]} items
 * @property {number} blockSize  s.
 * @property {number[]} sums  The sum of each block.
 * @property {number} at  The cell just read or written, -1 when none.
 * @property {number} block  The block just read or written, -1 when none.
 * @property {number[]} readCells  Cells this query has read one by one.
 * @property {number[]} readBlocks  Blocks whose stored sum this query has read.
 * @property {number} opIndex  Index into the operations, -1 outside them.
 * @property {BlockOp | null} op
 * @property {number} total  The running total of the query.
 * @property {number | null} result  The answer, once the query has finished.
 * @property {number} reads  Cells and block sums this query has read.
 * @property {number} scan  Reads the same query would make with no blocks.
 * @property {number} worst  The most reads any range can need at this n and s.
 * @property {number[]} lines
 */

/**
 * @typedef {object} MoQuery
 * @property {number} l
 * @property {number} r
 */

/**
 * @typedef {object} MoFrame
 * @property {'start'|'sort'|'query-start'|'add-left'|'add-right'|'remove-left'|'remove-right'|'answer'|'done'} kind
 * @property {number[]} items
 * @property {number} blockSize  s.
 * @property {MoQuery[]} queries  In the order they were typed.
 * @property {number[]} order  Query numbers in the order they run; identity before sorting.
 * @property {number} current  Position in `order` of the running query, -1 when none.
 * @property {(number|null)[]} answers  By query number; null until answered.
 * @property {number} curL  Left end of the window.
 * @property {number} curR  Right end of the window; curR = curL − 1 means empty.
 * @property {number} at  The cell just added or removed, -1 when none.
 * @property {[number, number][]} counts  Each value in the window with its count, by value.
 * @property {number} distinct
 * @property {number} moves  Cells added or removed so far.
 * @property {number} inputMoves  Total moves the queries would cost in the order typed.
 * @property {number} sortedMoves  Total moves the queries cost in the sorted order.
 * @property {number[]} lines
 */

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text @param {number} maxN
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseValues(text, maxN) {
  const tokens = text
    .replace(/[−–]/g, '-')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length > maxN) return { error: 'count' };
  return { values };
}

/**
 * Reads queries written as "l r" pairs separated by commas or semicolons, for n values.
 * @param {string} text @param {number} n
 * @returns {{ queries: MoQuery[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseQueries(text, n) {
  const parts = text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { error: 'format' };
  /** @type {MoQuery[]} */
  const queries = [];
  for (const part of parts) {
    const t = part.split(/\s+/);
    if (t.length !== 2 || !t.every((s) => /^\d+$/.test(s))) return { error: 'format' };
    const [l, r] = t.map(Number);
    if (l > r || r >= n) return { error: 'range' };
    queries.push({ l, r });
  }
  if (queries.length > MAX_QUERIES) return { error: 'count' };
  return { queries };
}

/** Writes queries back as text. @param {MoQuery[]} queries */
export const formatQueries = (queries) => queries.map((q) => `${q.l} ${q.r}`).join(', ');

/** The block size that balances the two costs: ⌊√n⌋, at least 1. @param {number} n */
export const defaultBlockSize = (n) => Math.max(1, Math.floor(Math.sqrt(n)));

/**
 * Reads one range makes under the query loop, and what it reads.
 * @param {number} n @param {number} s @param {number} l @param {number} r
 * @returns {{ cells: number[], blocks: number[] }}
 */
export function planQuery(n, s, l, r) {
  /** @type {number[]} */
  const cells = [];
  /** @type {number[]} */
  const blocks = [];
  let i = l;
  while (i <= r) {
    const end = Math.min(i + s - 1, n - 1);
    if (i % s === 0 && end <= r) {
      blocks.push(i / s);
      i = end + 1;
    } else {
      cells.push(i);
      i += 1;
    }
  }
  return { cells, blocks };
}

/** The most reads any range needs, by trying them all. @param {number} n @param {number} s */
export function worstReads(n, s) {
  let worst = 0;
  for (let l = 0; l < n; l++) {
    for (let r = l; r < n; r++) {
      const { cells, blocks } = planQuery(n, s, l, r);
      worst = Math.max(worst, cells.length + blocks.length);
    }
  }
  return worst;
}

/**
 * Builds the block sums, then replays the operations. At the caps of 25 values and 8 queries the
 * trace stays under 400 frames; the test holds it to that.
 * @param {number[]} values  1 to BLOCK_MAX_N entries.
 * @param {number} blockSize  From 1 to n.
 * @param {BlockOp[]} ops
 * @returns {BlockFrame[]}
 */
export function blocksTrace(values, blockSize, ops) {
  const n = values.length;
  const s = blockSize;
  const items = values.slice();
  const sums = Array(Math.ceil(n / s)).fill(0);
  const worst = worstReads(n, s);
  /** @type {BlockFrame[]} */
  const frames = [];
  let at = -1;
  let block = -1;
  /** @type {number[]} */
  let readCells = [];
  /** @type {number[]} */
  let readBlocks = [];
  let opIndex = -1;
  /** @type {BlockOp | null} */
  let op = null;
  let total = 0;
  /** @type {number | null} */
  let result = null;
  let reads = 0;
  let scan = 0;

  /** @param {BlockFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) => {
    frames.push({
      kind,
      items: items.slice(),
      blockSize: s,
      sums: sums.slice(),
      at,
      block,
      readCells: readCells.slice(),
      readBlocks: readBlocks.slice(),
      opIndex,
      op,
      total,
      result,
      reads,
      scan,
      worst,
      lines,
    });
  };

  push('start', [0]);
  for (let i = 0; i < n; i++) {
    at = i;
    block = Math.floor(i / s);
    sums[block] += items[i];
    push('build', [1]);
  }

  for (const [index, next] of ops.entries()) {
    opIndex = index;
    op = { ...next };
    readCells = [];
    readBlocks = [];
    total = 0;
    result = null;
    reads = 0;
    at = -1;
    block = -1;
    if (next.type === 'set') {
      scan = 0;
      at = next.i;
      block = Math.floor(next.i / s);
      sums[block] += next.x - items[next.i];
      items[next.i] = next.x;
      push('set', [9, 10]);
      continue;
    }
    scan = next.r - next.l + 1;
    push('query-start', [2, 3]);
    let i = next.l;
    while (i <= next.r) {
      const end = Math.min(i + s - 1, n - 1);
      reads++;
      if (i % s === 0 && end <= next.r) {
        block = i / s;
        at = -1;
        readBlocks.push(block);
        total += sums[block];
        push('read-block', [4, 5, 6]);
        i = end + 1;
      } else {
        at = i;
        block = -1;
        readCells.push(i);
        total += items[i];
        push('read-cell', [4, 7]);
        i += 1;
      }
    }
    at = -1;
    block = -1;
    result = total;
    push('answer', [8]);
  }

  at = -1;
  block = -1;
  opIndex = -1;
  op = null;
  readCells = [];
  readBlocks = [];
  result = null;
  total = 0;
  reads = 0;
  scan = 0;
  push('done', [0]);
  return frames;
}

/**
 * Query numbers in Mo's order: by block of the left end, then by right end.
 * @param {MoQuery[]} queries @param {number} s
 * @returns {number[]}
 */
export function moOrder(queries, s) {
  return queries
    .map((_, i) => i)
    .sort((a, b) => {
      const qa = queries[a];
      const qb = queries[b];
      const byBlock = Math.floor(qa.l / s) - Math.floor(qb.l / s);
      return byBlock !== 0 ? byBlock : qa.r - qb.r || qa.l - qb.l || a - b;
    });
}

/**
 * Cells added or removed to run the queries in this order, from an empty window.
 * @param {MoQuery[]} queries @param {number[]} order
 */
export function countMoves(queries, order) {
  let curL = 0;
  let curR = -1;
  let moves = 0;
  for (const k of order) {
    const { l, r } = queries[k];
    moves += Math.abs(curL - l) + Math.abs(curR - r);
    curL = l;
    curR = r;
  }
  return moves;
}

/**
 * Runs Mo's algorithm for distinct-value counts. At the caps of 16 values and 6 queries the trace
 * stays under 400 frames; the test holds it to that.
 * @param {number[]} values  1 to MO_MAX_N entries.
 * @param {MoQuery[]} queries  1 to MAX_QUERIES entries.
 * @returns {MoFrame[]}
 */
export function moTrace(values, queries) {
  const s = defaultBlockSize(values.length);
  const typed = queries.map((_, i) => i);
  const sorted = moOrder(queries, s);
  const inputMoves = countMoves(queries, typed);
  const sortedMoves = countMoves(queries, sorted);
  /** @type {Map<number, number>} */
  const count = new Map();
  /** @type {(number|null)[]} */
  const answers = Array(queries.length).fill(null);
  /** @type {MoFrame[]} */
  const frames = [];
  let order = typed;
  let current = -1;
  let curL = 0;
  let curR = -1;
  let at = -1;
  let distinct = 0;
  let moves = 0;

  /** @param {MoFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) => {
    frames.push({
      kind,
      items: values.slice(),
      blockSize: s,
      queries: queries.map((q) => ({ ...q })),
      order: order.slice(),
      current,
      answers: answers.slice(),
      curL,
      curR,
      at,
      counts: /** @type {[number, number][]} */ (
        [...count.entries()].sort((a, b) => a[0] - b[0]).map(([v, c]) => [v, c])
      ),
      distinct,
      moves,
      inputMoves,
      sortedMoves,
      lines,
    });
  };

  /** @param {number} x */
  const addValue = (x) => {
    const c = (count.get(x) ?? 0) + 1;
    count.set(x, c);
    if (c === 1) distinct++;
    moves++;
  };

  /** @param {number} x */
  const removeValue = (x) => {
    const c = /** @type {number} */ (count.get(x)) - 1;
    if (c === 0) {
      count.delete(x);
      distinct--;
    } else count.set(x, c);
    moves++;
  };

  push('start', [1]);
  order = sorted;
  push('sort', [0]);

  for (const [position, k] of sorted.entries()) {
    const { l, r } = queries[k];
    current = position;
    at = -1;
    push('query-start', [2]);
    while (curL > l) {
      curL -= 1;
      at = curL;
      addValue(values[curL]);
      push('add-left', [3, 8]);
    }
    while (curR < r) {
      curR += 1;
      at = curR;
      addValue(values[curR]);
      push('add-right', [4, 8]);
    }
    while (curL < l) {
      at = curL;
      removeValue(values[curL]);
      curL += 1;
      push('remove-left', [5, 9]);
    }
    while (curR > r) {
      at = curR;
      removeValue(values[curR]);
      curR -= 1;
      push('remove-right', [6, 9]);
    }
    at = -1;
    answers[k] = distinct;
    push('answer', [7]);
  }

  current = -1;
  push('done', [2]);
  return frames;
}
