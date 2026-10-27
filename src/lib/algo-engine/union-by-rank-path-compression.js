/**
 * A disjoint-set forest with two optional heuristics, replayed over an operation log into one
 * frame trace:
 * - union by rank: the root with the smaller rank goes under the other; equal ranks pick a's
 *   root and raise its rank by one. Rank is an upper bound on the tree height and never drops,
 *   even when compression makes the tree shorter.
 * - path compression (two-pass): after find reaches the root, every element on the walked
 *   path is re-pointed straight at the root.
 * With both off it is the plain quick-union forest, where union sets parent[rb] = ra.
 */

/** Elements are 0 … N − 1. */
export const N = 10;
export const MAX_OPS = 16;

export const rankPseudocode = [
  'find(x):',
  '  r = x',
  '  while parent[r] ≠ r: r = parent[r]',
  '  if path compression is on:',
  '    for each v on the path from x up to r: parent[v] = r',
  '  return r',
  'union(a, b):',
  '  ra = find(a); rb = find(b)',
  '  if ra == rb: stop',
  '  if by rank and rank[ra] < rank[rb]: swap ra and rb',
  '  parent[rb] = ra',
  '  if by rank and rank[ra] == rank[rb]: rank[ra] += 1',
];

/**
 * @typedef {object} RankOp
 * @property {'union'|'find'} type
 * @property {number} a
 * @property {number} [b]
 */

/**
 * @typedef {object} RankOptions
 * @property {boolean} byRank
 * @property {boolean} compress
 */

/**
 * @typedef {object} RankFrame
 * @property {'start'|'visit'|'climb'|'root'|'compress'|'found'|'same-set'|'swap'|'link'|'rank-up'|'done'} kind
 * @property {number} opIndex
 * @property {RankOp | null} op
 * @property {'a'|'b'|''} side
 * @property {number[]} parent
 * @property {number[]} rank
 * @property {number} current   Element the find stands on, or the element just re-pointed.
 * @property {number[]} path    Elements walked by the running find, from x up to the root.
 * @property {number[]} moved   Elements re-pointed at the root by the running find.
 * @property {number} ra
 * @property {number} rb
 * @property {number} linked
 * @property {number} opSteps   Parent links followed in this op.
 * @property {number} steps     Parent links followed since the start.
 * @property {number} writes    Parent entries rewritten by path compression since the start.
 * @property {number} sets
 * @property {number} height
 * @property {number[]} lines
 */

/** @param {number[]} parent @param {number} x */
function depthOf(parent, x) {
  let d = 0;
  while (parent[x] !== x) {
    x = parent[x];
    d++;
  }
  return d;
}

/** @param {number[]} parent */
export function forestHeight(parent) {
  return parent.reduce((h, _, i) => Math.max(h, depthOf(parent, i)), 0);
}

/**
 * @param {RankOp[]} ops
 * @param {RankOptions} options
 * @param {number} [n]
 * @returns {RankFrame[]}
 */
export function rankTrace(ops, { byRank, compress }, n = N) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  let sets = n;
  let steps = 0;
  let writes = 0;
  let opSteps = 0;
  let current = -1;
  /** @type {number[]} */
  let path = [];
  /** @type {number[]} */
  let moved = [];
  let ra = -1;
  let rb = -1;
  let linked = -1;
  /** @type {'a'|'b'|''} */
  let side = '';
  /** @type {RankFrame[]} */
  const frames = [];

  /** @param {RankFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      side,
      parent: parent.slice(),
      rank: rank.slice(),
      current,
      path: path.slice(),
      moved: moved.slice(),
      ra,
      rb,
      linked,
      opSteps,
      steps,
      writes,
      sets,
      height: forestHeight(parent),
      lines: lines.slice(),
    });
  }

  /** @param {number} x @param {number} opIndex @param {number[]} caller @param {'a'|'b'} who */
  function find(x, opIndex, caller, who) {
    side = who;
    path = [x];
    moved = [];
    current = x;
    push('visit', opIndex, [...caller, 1]);
    let r = x;
    while (parent[r] !== r) {
      r = parent[r];
      current = r;
      path.push(r);
      steps++;
      opSteps++;
      push('climb', opIndex, [2]);
    }
    push('root', opIndex, [2]);
    if (compress) {
      // The root and its direct children already point at the root.
      for (const v of path) {
        if (v === r || parent[v] === r) continue;
        parent[v] = r;
        moved.push(v);
        writes++;
        current = v;
        push('compress', opIndex, [3, 4]);
      }
    }
    current = r;
    if (who === 'a') ra = r;
    else rb = r;
    push('found', opIndex, compress && moved.length === 0 ? [3, 5] : [5]);
    return r;
  }

  push('start', -1, []);

  ops.forEach((op, i) => {
    opSteps = 0;
    ra = -1;
    rb = -1;
    linked = -1;
    if (op.type === 'find') {
      find(op.a, i, [0], 'a');
      return;
    }
    let x = find(op.a, i, [6, 7], 'a');
    let y = find(/** @type {number} */ (op.b), i, [6, 7], 'b');
    current = -1;
    path = [];
    moved = [];
    side = '';
    if (x === y) {
      push('same-set', i, [8]);
      return;
    }
    if (byRank && rank[x] < rank[y]) {
      [x, y] = [y, x];
      ra = x;
      rb = y;
      push('swap', i, [9]);
    }
    parent[y] = x;
    linked = y;
    sets--;
    push('link', i, byRank ? [9, 10] : [10]);
    if (byRank && rank[x] === rank[y]) {
      rank[x]++;
      push('rank-up', i, [11]);
    }
  });

  current = -1;
  path = [];
  moved = [];
  side = '';
  ra = -1;
  rb = -1;
  linked = -1;
  opSteps = 0;
  push('done', -1, []);
  return frames;
}

/** The four heuristic settings, in the order the comparison table lists them. */
export const VARIANTS = /** @type {const} */ ([
  { key: 'plain', byRank: false, compress: false },
  { key: 'rank', byRank: true, compress: false },
  { key: 'compress', byRank: false, compress: true },
  { key: 'both', byRank: true, compress: true },
]);

/**
 * Totals of the same log under each setting: links followed, compression writes and the
 * final tallest tree.
 * @param {RankOp[]} ops
 */
export function compareVariants(ops) {
  return VARIANTS.map((v) => {
    const last = /** @type {RankFrame} */ (rankTrace(ops, v).at(-1));
    return { key: v.key, steps: last.steps, writes: last.writes, height: last.height };
  });
}

/**
 * @param {'chain'|'mixed'|'random'} preset
 * @param {() => number} [rand]
 * @returns {RankOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  if (preset === 'chain') {
    /** @type {RankOp[]} */
    const ops = [];
    for (let k = 1; k < N; k++) ops.push({ type: 'union', a: k, b: k - 1 });
    ops.push({ type: 'find', a: 0 }, { type: 'find', a: 1 });
    return ops;
  }
  if (preset === 'mixed') {
    return [
      { type: 'union', a: 0, b: 1 },
      { type: 'union', a: 2, b: 3 },
      { type: 'union', a: 0, b: 2 },
      { type: 'union', a: 4, b: 5 },
      { type: 'union', a: 6, b: 7 },
      { type: 'union', a: 4, b: 6 },
      { type: 'union', a: 4, b: 0 },
      { type: 'find', a: 3 },
      { type: 'find', a: 7 },
      { type: 'union', a: 8, b: 3 },
      { type: 'union', a: 5, b: 2 },
    ];
  }
  const pick = () => Math.floor(rand() * N);
  /** @type {RankOp[]} */
  const ops = [];
  for (let k = 0; k < 9; k++) {
    const a = pick();
    let b = pick();
    if (b === a) b = (a + 1) % N;
    ops.push({ type: 'union', a, b });
  }
  for (let k = 0; k < 3; k++) ops.push({ type: 'find', a: pick() });
  return ops;
}
