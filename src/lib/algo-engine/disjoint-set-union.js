/**
 * A plain disjoint-set forest (quick-union, no rank and no path compression): every element
 * stores a parent, a root is its own parent and names its set. `union(a, b)` hangs the root of
 * b's tree under the root of a's tree, so the tree shape depends on the order of the calls.
 * The whole operation log is replayed into one frame trace.
 */

/** Elements are 0 … N − 1. */
export const N = 10;
export const MAX_OPS = 16;

export const dsuPseudocode = [
  'find(x):',
  '  while parent[x] ≠ x:',
  '    x = parent[x]',
  '  return x          // the root names the set',
  'union(a, b):',
  '  ra = find(a); rb = find(b)',
  '  if ra == rb: same set already, stop',
  '  parent[rb] = ra   // b’s tree hangs under a’s root',
  'same(a, b): return find(a) == find(b)',
];

/**
 * @typedef {object} DsuOp
 * @property {'union'|'find'|'same'} type
 * @property {number} a
 * @property {number} [b]  Second element, for union and same.
 */

/**
 * @typedef {object} DsuFrame
 * @property {'start'|'visit'|'climb'|'root'|'same-set'|'link'|'answer'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {DsuOp | null} op
 * @property {'a'|'b'|''} side  Which operand the running find started from.
 * @property {number[]} parent
 * @property {number} current  Element the find is standing on, -1 when none.
 * @property {number[]} path   Elements walked by the running find so far.
 * @property {number} ra       Root found for a in this op, -1 until found.
 * @property {number} rb       Root found for b in this op, -1 until found.
 * @property {number} linked   Root that was just hung under another root, -1 otherwise.
 * @property {boolean | null} answer  Result of a same query on its answer frame.
 * @property {number} opSteps  Parent links followed in this op.
 * @property {number} steps    Parent links followed since the start.
 * @property {number} sets
 * @property {number} height   Most links from any element up to its root.
 * @property {number[]} lines
 */

/** @param {number[]} parent @param {number} x */
export function rootOf(parent, x) {
  while (parent[x] !== x) x = parent[x];
  return x;
}

/** Links from x up to its root. @param {number[]} parent @param {number} x */
export function depthOf(parent, x) {
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
 * The sets as sorted member lists, ordered by their smallest member.
 * @param {number[]} parent
 * @returns {number[][]}
 */
export function groupsOf(parent) {
  /** @type {Map<number, number[]>} */
  const byRoot = new Map();
  parent.forEach((_, i) => {
    const r = rootOf(parent, i);
    const list = byRoot.get(r);
    if (list) list.push(i);
    else byRoot.set(r, [i]);
  });
  return [...byRoot.values()].sort((x, y) => x[0] - y[0]);
}

/**
 * @param {DsuOp[]} ops
 * @param {number} [n]
 * @returns {DsuFrame[]}
 */
export function dsuTrace(ops, n = N) {
  const parent = Array.from({ length: n }, (_, i) => i);
  let sets = n;
  let steps = 0;
  let opSteps = 0;
  let current = -1;
  /** @type {number[]} */
  let path = [];
  let ra = -1;
  let rb = -1;
  let linked = -1;
  /** @type {boolean | null} */
  let answer = null;
  /** @type {'a'|'b'|''} */
  let side = '';
  /** @type {DsuFrame[]} */
  const frames = [];

  /** @param {DsuFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      side,
      parent: parent.slice(),
      current,
      path: path.slice(),
      ra,
      rb,
      linked,
      answer,
      opSteps,
      steps,
      sets,
      height: forestHeight(parent),
      lines: lines.slice(),
    });
  }

  /**
   * Walk from x to its root, one frame per link.
   * @param {number} x @param {number} opIndex @param {number[]} caller @param {'a'|'b'} who
   */
  function find(x, opIndex, caller, who) {
    side = who;
    path = [x];
    current = x;
    push('visit', opIndex, [...caller, 1]);
    while (parent[x] !== x) {
      x = parent[x];
      current = x;
      path.push(x);
      steps++;
      opSteps++;
      push('climb', opIndex, [2]);
    }
    if (who === 'a') ra = x;
    else rb = x;
    push('root', opIndex, [3]);
    return x;
  }

  push('start', -1, []);

  ops.forEach((op, i) => {
    opSteps = 0;
    ra = -1;
    rb = -1;
    linked = -1;
    answer = null;
    if (op.type === 'find') {
      find(op.a, i, [0], 'a');
      return;
    }
    const b = /** @type {number} */ (op.b);
    const caller = op.type === 'union' ? [4, 5] : [8];
    const x = find(op.a, i, caller, 'a');
    const y = find(b, i, caller, 'b');
    current = -1;
    path = [];
    side = '';
    if (op.type === 'same') {
      answer = x === y;
      push('answer', i, [8]);
      return;
    }
    if (x === y) {
      push('same-set', i, [6]);
      return;
    }
    parent[y] = x;
    linked = y;
    sets--;
    push('link', i, [7]);
  });

  current = -1;
  path = [];
  side = '';
  ra = -1;
  rb = -1;
  linked = -1;
  answer = null;
  opSteps = 0;
  push('done', -1, []);
  return frames;
}

/**
 * @param {'friends'|'chain'|'random'} preset
 * @param {() => number} [rand]
 * @returns {DsuOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  if (preset === 'friends') {
    return [
      { type: 'union', a: 0, b: 1 },
      { type: 'union', a: 2, b: 3 },
      { type: 'union', a: 4, b: 5 },
      { type: 'same', a: 1, b: 3 },
      { type: 'union', a: 1, b: 3 },
      { type: 'union', a: 5, b: 6 },
      { type: 'same', a: 0, b: 3 },
      { type: 'union', a: 0, b: 2 },
      { type: 'find', a: 3 },
    ];
  }
  if (preset === 'chain') {
    /** @type {DsuOp[]} */
    const ops = [];
    for (let k = 1; k <= 6; k++) ops.push({ type: 'union', a: k, b: k - 1 });
    ops.push({ type: 'find', a: 0 });
    return ops;
  }
  const pick = () => Math.floor(rand() * N);
  /** @type {DsuOp[]} */
  const ops = [];
  for (let k = 0; k < 8; k++) {
    const a = pick();
    let b = pick();
    if (b === a) b = (a + 1) % N;
    ops.push({ type: 'union', a, b });
  }
  const a = pick();
  ops.push({ type: 'same', a, b: (a + 3) % N });
  return ops;
}
