/**
 * Matrix transpose B = Aᵀ in the external-memory (ideal-cache) model. Both N × N matrices live
 * in memory, which moves in blocks of B consecutive words. A cache holds C blocks (M = C · B
 * words); an access to a word whose block is cached is a hit, otherwise the block is transferred
 * in (a miss) and, when the cache is full, the least recently used block is evicted.
 *
 * Two traversal orders and two layouts:
 *
 * - `rows`: the plain double loop, for i, for j: B[j][i] = A[i][j]. A is read along rows but B
 *   is written down columns, so every write can land in a different block.
 * - `recursive`: split the longer side of the current sub-matrix in half and transpose the
 *   halves, down to single cells. It never mentions B or M (it is cache-oblivious), yet once a
 *   sub-matrix fits in the cache every block it touches is loaded only once.
 * - `row` layout stores row after row; `z` layout (Morton order) stores each quadrant
 *   contiguously, recursively, so a square sub-matrix is a few whole blocks.
 *
 * One frame per copied element: read A[i][j], then write B[j][i].
 */

/**
 * @typedef {'rows'|'recursive'} Traversal
 * @typedef {'row'|'z'} Layout
 * @typedef {{n: number, block: number, cache: number, order: Traversal, layout: Layout}} TransposeSetup
 */

/**
 * @typedef {object} TransposeFrame
 * @property {'start'|'copy'|'done'} kind
 * @property {number} i  Row of A read now, or -1.
 * @property {number} j  Column of A read now, or -1.
 * @property {boolean} hitA  Whether the read of A hit the cache.
 * @property {boolean} hitB  Whether the write of B hit the cache.
 * @property {number[]} evicted  Blocks evicted in this step.
 * @property {number[]} cache  Cached block ids, least recently used first.
 * @property {number} copied  Elements copied so far.
 * @property {number} missA  Block transfers caused by reads of A so far.
 * @property {number} missB  Block transfers caused by writes of B so far.
 * @property {number[]} lines
 */

export const SIZES = [4, 8, 16];
export const BLOCK_SIZES = [2, 4, 8];
export const MIN_CACHE = 2;
export const MAX_CACHE = 16;

export const rowsPseudocode = [
  'for i = 0 to N − 1:',
  '  for j = 0 to N − 1:',
  '    B[j][i] = A[i][j]',
];

export const recursivePseudocode = [
  'TRANSPOSE(sub-matrix of A):',
  '  if it is one cell (i, j):',
  '    B[j][i] = A[i][j]',
  '  else if rows ≥ columns:',
  '    TRANSPOSE(top half); TRANSPOSE(bottom half)',
  '  else:',
  '    TRANSPOSE(left half); TRANSPOSE(right half)',
];

/** @param {Traversal} order */
export const transposePseudocode = (order) =>
  order === 'rows' ? rowsPseudocode : recursivePseudocode;

/**
 * The word address of cell (i, j) of an N × N matrix in a layout.
 * @param {Layout} layout @param {number} n @param {number} i @param {number} j
 */
export function addressOf(layout, n, i, j) {
  if (layout === 'row') return i * n + j;
  let z = 0;
  for (let b = 0; 1 << b < n; b++) {
    z |= ((j >> b) & 1) << (2 * b);
    z |= ((i >> b) & 1) << (2 * b + 1);
  }
  return z;
}

/**
 * Block ids: A's blocks are 0 … N²/B − 1, B's follow on.
 * @param {TransposeSetup} s @param {'A'|'B'} matrix @param {number} i @param {number} j
 */
export function blockOf(s, matrix, i, j) {
  const own = Math.floor(addressOf(s.layout, s.n, i, j) / s.block);
  return matrix === 'A' ? own : (s.n * s.n) / s.block + own;
}

/**
 * The cells of A in the order a traversal copies them, each with the pseudocode lines of the
 * calls that lead to it: the split that reaches it, and every call that starts with it.
 * @param {Traversal} order @param {number} n
 * @returns {{i: number, j: number, lines: number[]}[]}
 */
export function visitOrder(order, n) {
  /** @type {{i: number, j: number, lines: number[]}[]} */
  const out = [];
  if (order === 'rows') {
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) out.push({ i, j, lines: j === 0 ? [0, 1, 2] : [1, 2] });
    return out;
  }
  /**
   * @param {number} r0 @param {number} r1 @param {number} c0 @param {number} c1 Half-open.
   * @param {number[]} via  Lines of the calls that start with this sub-matrix's first cell.
   */
  const go = (r0, r1, c0, c1, via) => {
    const rows = r1 - r0;
    const cols = c1 - c0;
    if (rows === 1 && cols === 1) {
      out.push({ i: r0, j: c0, lines: [...new Set([...via, 1, 2])].sort((a, b) => a - b) });
    } else if (rows >= cols) {
      const mid = r0 + rows / 2;
      go(r0, mid, c0, c1, [...via, 3, 4]);
      go(mid, r1, c0, c1, [3, 4]);
    } else {
      const mid = c0 + cols / 2;
      go(r0, r1, c0, mid, [...via, 5, 6]);
      go(r0, r1, mid, c1, [5, 6]);
    }
  };
  go(0, n, 0, n, [0]);
  return out;
}

/**
 * The trace of the transpose with an LRU cache of `cache` blocks.
 * @param {TransposeSetup} s
 * @returns {TransposeFrame[]}
 */
export function transposeTrace(s) {
  /** Cached blocks, least recently used first. @type {number[]} */
  const cache = [];
  let missA = 0;
  let missB = 0;
  /** @param {number} b @param {number[]} evicted */
  const touch = (b, evicted) => {
    const at = cache.indexOf(b);
    if (at >= 0) {
      cache.splice(at, 1);
      cache.push(b);
      return true;
    }
    if (cache.length === s.cache) evicted.push(/** @type {number} */ (cache.shift()));
    cache.push(b);
    return false;
  };
  /** @type {TransposeFrame[]} */
  const frames = [
    {
      kind: 'start',
      i: -1,
      j: -1,
      hitA: false,
      hitB: false,
      evicted: [],
      cache: [],
      copied: 0,
      missA: 0,
      missB: 0,
      lines: [0],
    },
  ];
  let copied = 0;
  for (const { i, j, lines } of visitOrder(s.order, s.n)) {
    /** @type {number[]} */
    const evicted = [];
    const hitA = touch(blockOf(s, 'A', i, j), evicted);
    if (!hitA) missA++;
    const hitB = touch(blockOf(s, 'B', j, i), evicted);
    if (!hitB) missB++;
    copied++;
    frames.push({
      kind: 'copy',
      i,
      j,
      hitA,
      hitB,
      evicted,
      cache: cache.slice(),
      copied,
      missA,
      missB,
      lines,
    });
  }
  frames.push({
    ...frames[frames.length - 1],
    kind: 'done',
    i: -1,
    j: -1,
    evicted: [],
    cache: cache.slice(),
    lines: [0],
  });
  return frames;
}

/**
 * The bounding box of every block of one matrix, for drawing block outlines.
 * @param {TransposeSetup} s @param {'A'|'B'} matrix
 * @returns {{id: number, top: number, left: number, bottom: number, right: number}[]}
 */
export function blockBoxes(s, matrix) {
  /** @type {Map<number, {id: number, top: number, left: number, bottom: number, right: number}>} */
  const boxes = new Map();
  for (let i = 0; i < s.n; i++) {
    for (let j = 0; j < s.n; j++) {
      const id = blockOf(s, matrix, i, j);
      const b = boxes.get(id);
      if (!b) boxes.set(id, { id, top: i, left: j, bottom: i, right: j });
      else {
        b.top = Math.min(b.top, i);
        b.left = Math.min(b.left, j);
        b.bottom = Math.max(b.bottom, i);
        b.right = Math.max(b.right, j);
      }
    }
  }
  return [...boxes.values()];
}
