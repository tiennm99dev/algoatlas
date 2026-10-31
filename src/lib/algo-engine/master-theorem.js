/**
 * Master-theorem calculator for T(n) = a·T(n/b) + f(n) with f(n) = n^d · (log₂ n)^p and
 * T(1) = 1. The trace first sums the recursion tree for a concrete n = bᵏ, level by level,
 * then compares d with the critical exponent c = log_b a and names the case. The comparison
 * is exact: d < c exactly when b^d < a, tested as b^(2d) < a² on whole numbers.
 */

export const MAX_A = 8;
export const MIN_B = 2;
export const MAX_B = 4;
/** Exponents of n in the work term: 1, √n, n, n^1.5, n², n^2.5, n³. */
export const D_VALUES = [0, 0.5, 1, 1.5, 2, 2.5, 3];
/** Exponents of log n in the work term; −1 means dividing by log n. */
export const P_VALUES = [-1, 0, 1, 2];
export const MAX_K = 6;
/** Largest tree drawn: 1 + 8 + 64 nodes for 8T(n/2), or 1 + 4 + 16 + 64 for 4T(n/2). */
export const MAX_NODES = 85;

/**
 * @typedef {object} Recurrence
 * @property {number} a  Subproblems per call, 1..MAX_A.
 * @property {number} b  Size divisor, MIN_B..MAX_B.
 * @property {number} d  Exponent of n in f(n), one of D_VALUES.
 * @property {number} p  Exponent of log n in f(n), one of P_VALUES.
 * @property {number} k  Depth of the drawn tree: n = bᵏ, 1..MAX_K.
 */

/** @typedef {1 | 2 | 3 | 'gap'} MasterCase */

/**
 * @typedef {object} LevelRow
 * @property {number} depth
 * @property {number} calls  aⁱ
 * @property {number} size  n / bⁱ
 * @property {number} nodeCost  f(size), or 1 for a leaf
 * @property {number} cost  calls × nodeCost
 */

/**
 * @typedef {object} MasterFrame
 * @property {'start'|'level'|'leaves'|'exponent'|'compare'|'verdict'|'done'} kind
 * @property {Recurrence} rec
 * @property {number} n  bᵏ
 * @property {number} current  Level being summed, -1 when none.
 * @property {LevelRow[]} levels  Levels summed so far, leaves last once summed.
 * @property {number} total  Sum of the summed level costs.
 * @property {number | null} c  log_b a, from the 'exponent' frame on.
 * @property {-1 | 0 | 1 | null} cmp  Sign of d − c, from the 'compare' frame on.
 * @property {MasterCase | null} verdict  From the 'verdict' frame on.
 * @property {number} ratio  a / b^d: the factor between level costs, and the regularity constant.
 * @property {number[]} lines
 */

export const masterPseudocode = [
  'T(n) = a·T(n/b) + f(n),   f(n) = n^d · (log n)^p',
  'divide into a subproblems of size n/b; f(n) = divide + combine work',
  'for each level i = 0 to k − 1:',
  '  level cost = aⁱ · f(n / bⁱ)',
  'leaves: aᵏ = n^(log_b a) calls of size 1, cost 1 each',
  'c = log_b a  // the leaves grow like n^c',
  'compare d with c:',
  '  d < c: case 1, the leaves dominate → Θ(n^c)',
  '  d = c and p ≥ 0: case 2, every level counts → Θ(n^c · (log n)^(p+1))',
  '  d > c and a·f(n/b) ≤ r·f(n), r < 1: case 3, the root dominates → Θ(f(n))',
  '  otherwise: none of the three cases applies',
];

/** Nodes in a full tree of depth k with branching a. @param {number} a @param {number} k */
export function nodeCount(a, k) {
  let total = 0;
  for (let i = 0; i <= k; i++) total += a ** i;
  return total;
}

/**
 * Sign of d − log_b a, computed exactly on whole numbers.
 * @param {Recurrence} r
 * @returns {-1 | 0 | 1}
 */
export function compareExponent(r) {
  const work = r.b ** (2 * r.d);
  const leaves = r.a * r.a;
  return work < leaves ? -1 : work === leaves ? 0 : 1;
}

/** @param {Recurrence} r @returns {MasterCase} */
export function masterCase(r) {
  const cmp = compareExponent(r);
  if (cmp < 0) return 1;
  if (cmp > 0) return 3;
  return r.p >= 0 ? 2 : 'gap';
}

/** @param {Recurrence} r */
export function validRecurrence(r) {
  const whole = [r.a, r.b, r.k].every((v) => Number.isInteger(v));
  return (
    whole &&
    r.a >= 1 &&
    r.a <= MAX_A &&
    r.b >= MIN_B &&
    r.b <= MAX_B &&
    D_VALUES.includes(r.d) &&
    P_VALUES.includes(r.p) &&
    r.k >= 1 &&
    r.k <= MAX_K &&
    nodeCount(r.a, r.k) <= MAX_NODES
  );
}

/**
 * The work term f(size) = size^d · (log₂ size)^p for an inner call (size ≥ b ≥ 2, so the
 * logarithm is at least 1).
 * @param {Recurrence} r
 * @param {number} size
 */
export function work(r, size) {
  return size ** r.d * Math.log2(size) ** r.p;
}

/**
 * T(size) straight from the recurrence, as an independent check of the level sums.
 * @param {Recurrence} r
 * @param {number} size  A power of r.b.
 * @returns {number}
 */
export function directCost(r, size) {
  return size <= 1 ? 1 : r.a * directCost(r, size / r.b) + work(r, size);
}

/** The verdict's pseudocode line. @param {MasterCase} c */
const verdictLine = (c) => (c === 'gap' ? 10 : 6 + c);

/**
 * @param {Recurrence} rec  Must pass validRecurrence.
 * @returns {MasterFrame[]}
 */
export function masterTrace(rec) {
  const r = { ...rec };
  const n = r.b ** r.k;
  /** @type {MasterFrame[]} */
  const frames = [];
  /** @type {LevelRow[]} */
  const levels = [];
  let total = 0;
  /** @type {number | null} */
  let c = null;
  /** @type {-1 | 0 | 1 | null} */
  let cmp = null;
  /** @type {MasterCase | null} */
  let verdict = null;
  const ratio = r.a / r.b ** r.d;

  /** @param {MasterFrame['kind']} kind @param {number} current @param {number[]} lines */
  function push(kind, current, lines) {
    frames.push({
      kind,
      rec: { ...r },
      n,
      current,
      levels: levels.map((l) => ({ ...l })),
      total,
      c,
      cmp,
      verdict,
      ratio,
      lines: lines.slice(),
    });
  }

  push('start', -1, [0, 1]);
  for (let i = 0; i < r.k; i++) {
    const size = n / r.b ** i;
    const calls = r.a ** i;
    const nodeCost = work(r, size);
    levels.push({ depth: i, calls, size, nodeCost, cost: calls * nodeCost });
    total += calls * nodeCost;
    push('level', i, [2, 3]);
  }
  const leaves = r.a ** r.k;
  levels.push({ depth: r.k, calls: leaves, size: 1, nodeCost: 1, cost: leaves });
  total += leaves;
  push('leaves', r.k, [4]);
  c = Math.log(r.a) / Math.log(r.b);
  push('exponent', -1, [5]);
  cmp = compareExponent(r);
  push('compare', -1, [6]);
  verdict = masterCase(r);
  push('verdict', -1, [verdictLine(verdict)]);
  push('done', -1, [verdictLine(verdict)]);
  return frames;
}

/**
 * Levels the verdict says dominate the sum: the leaves in case 1, the root in case 3, every
 * level in case 2, and none when no case applies.
 * @param {MasterCase} verdict
 * @param {number} k
 * @returns {number[]}
 */
export function dominantLevels(verdict, k) {
  if (verdict === 1) return [k];
  if (verdict === 3) return [0];
  if (verdict === 2) return Array.from({ length: k + 1 }, (_, i) => i);
  return [];
}

/**
 * Colour of one tree level on a frame: the level being summed is active, summed levels are
 * visited, and once the verdict is in the dominant levels turn sorted and the rest go plain.
 * @param {MasterFrame} f
 * @param {number} level
 * @returns {import('$lib/components/visual-state.js').VisualState}
 */
export function levelState(f, level) {
  if (f.verdict !== null) {
    return dominantLevels(f.verdict, f.rec.k).includes(level) ? 'sorted' : '';
  }
  if (level === f.current) return 'active';
  return level < f.levels.length ? 'visited' : '';
}
