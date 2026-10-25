/**
 * Recursion-tree method for T(n) = a·T(n/b) + n^d with T(1) = 1 and n = bᵏ. The tree grows one
 * level at a time: level i holds aⁱ subproblems of size n/bⁱ, each costing (n/bⁱ)^d, and the
 * leaves are aᵏ calls of size 1 costing 1 each. Summing the level costs gives T(n) exactly;
 * comparing a with b^d tells which levels dominate (the master theorem's three cases).
 */

export const MAX_A = 4;
export const MIN_B = 2;
export const MAX_B = 4;
export const MAX_D = 2;
export const MAX_K = 6;
/** Largest tree drawn: 1 + 4 + 16 + 64 nodes, so 4T(n/2) still reaches n = 8. */
export const MAX_NODES = 85;

/**
 * @typedef {object} Recurrence
 * @property {number} a  Subproblems per call, 1..MAX_A.
 * @property {number} b  Size divisor, MIN_B..MAX_B.
 * @property {number} d  Exponent of the work per call n^d, 0..MAX_D.
 * @property {number} k  Depth: n = bᵏ, 1..MAX_K.
 */

/** @typedef {'root' | 'equal' | 'leaves'} TreeCase */

/**
 * @typedef {object} LevelRow
 * @property {number} depth
 * @property {number} nodes  aⁱ
 * @property {number} size  n / bⁱ
 * @property {number} nodeCost  size^d (1 for the leaves)
 * @property {number} cost  nodes × nodeCost
 */

/**
 * @typedef {object} RecursionFrame
 * @property {'start'|'level'|'expand'|'leaves'|'done'} kind
 * @property {Recurrence} rec
 * @property {number} n
 * @property {number} depth  Deepest level drawn so far.
 * @property {number} current  Level being summed or expanded, -1 when none.
 * @property {LevelRow[]} levels  Levels summed so far.
 * @property {number} total  Sum of the summed level costs.
 * @property {TreeCase | null} treeCase  Set on the done frame.
 * @property {number[]} lines
 */

export const recursionPseudocode = [
  'T(n) = a·T(n/b) + n^d,  T(1) = 1',
  'start with one node of size n at level 0',
  'while the deepest nodes have size > 1:',
  '  cost of the level = (number of nodes) × (size)^d',
  '  give every deepest node a children of size / b',
  'leaves: aᵏ nodes of size 1, cost 1 each',
  'total = sum of all level costs',
];

/** Nodes in a tree of depth k with branching a. @param {number} a @param {number} k */
export function nodeCount(a, k) {
  let total = 0;
  for (let i = 0; i <= k; i++) total += a ** i;
  return total;
}

/** Which levels dominate: a < b^d the root, a = b^d all equally, a > b^d the leaves. @param {Recurrence} r @returns {TreeCase} */
export function treeCase(r) {
  const work = r.b ** r.d;
  return r.a < work ? 'root' : r.a === work ? 'equal' : 'leaves';
}

/** @param {Recurrence} r @returns {boolean} */
export function validRecurrence(r) {
  const whole = [r.a, r.b, r.d, r.k].every((v) => Number.isInteger(v));
  return (
    whole &&
    r.a >= 1 &&
    r.a <= MAX_A &&
    r.b >= MIN_B &&
    r.b <= MAX_B &&
    r.d >= 0 &&
    r.d <= MAX_D &&
    r.k >= 1 &&
    r.k <= MAX_K &&
    nodeCount(r.a, r.k) <= MAX_NODES
  );
}

/**
 * T(size) evaluated directly from the recurrence: the cost of one call's whole subtree.
 * @param {Recurrence} r
 * @param {number} size  A power of r.b.
 * @returns {number}
 */
export function subtreeCost(r, size) {
  return size <= 1 ? 1 : r.a * subtreeCost(r, size / r.b) + size ** r.d;
}

/**
 * @param {Recurrence} rec  Must pass validRecurrence.
 * @returns {RecursionFrame[]}
 */
export function recursionTrace(rec) {
  const r = { ...rec };
  const n = r.b ** r.k;
  /** @type {RecursionFrame[]} */
  const frames = [];
  /** @type {LevelRow[]} */
  const levels = [];
  let total = 0;
  let depth = 0;

  /** @param {RecursionFrame['kind']} kind @param {number} current @param {number[]} lines @param {TreeCase | null} [tc] */
  function push(kind, current, lines, tc = null) {
    frames.push({
      kind,
      rec: { ...r },
      n,
      depth,
      current,
      levels: levels.map((l) => ({ ...l })),
      total,
      treeCase: tc,
      lines: lines.slice(),
    });
  }

  push('start', -1, [0, 1]);
  for (let i = 0; i < r.k; i++) {
    const size = n / r.b ** i;
    const nodes = r.a ** i;
    const nodeCost = size ** r.d;
    levels.push({ depth: i, nodes, size, nodeCost, cost: nodes * nodeCost });
    total += nodes * nodeCost;
    push('level', i, [2, 3]);
    depth = i + 1;
    push('expand', i + 1, [4]);
  }
  const leaves = r.a ** r.k;
  levels.push({ depth: r.k, nodes: leaves, size: 1, nodeCost: 1, cost: leaves });
  total += leaves;
  push('leaves', r.k, [5]);
  push('done', -1, [6], treeCase(r));
  return frames;
}

/**
 * The drawn tree for a frame as tree-view nodes. Summed levels are visited, the level being
 * summed is active, freshly split subproblems are pending (frontier).
 * @param {RecursionFrame} f
 * @returns {import('$lib/components/tree-layout.js').TreeNode[]}
 */
export function treeRoots(f) {
  /** @param {number} level */
  function stateOf(level) {
    if (f.kind === 'done') return level === f.rec.k ? 'sorted' : 'visited';
    if (f.kind === 'start') return 'frontier';
    if (level === f.current) return f.kind === 'expand' ? 'frontier' : 'active';
    return level < f.current ? 'visited' : '';
  }
  /** @param {number} level @param {number} index @returns {import('$lib/components/tree-layout.js').TreeNode} */
  function build(level, index) {
    const size = f.n / f.rec.b ** level;
    const children =
      level < f.depth
        ? Array.from({ length: f.rec.a }, (_, t) => build(level + 1, index * f.rec.a + t))
        : [];
    return {
      id: `${level}:${index}`,
      label: String(size),
      children,
      state: /** @type {import('$lib/components/visual-state.js').VisualState} */ (stateOf(level)),
    };
  }
  return [build(0, 0)];
}
