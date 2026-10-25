/**
 * Growth-rate comparison behind Big-O, Omega and Theta. The learner's function is the
 * quadratic f(n) = a·n² + b·n + c with whole, non-negative coefficients; it is evaluated at
 * n = 1, 2, …, N next to the reference curves n, n log₂ n, n² and 2ⁿ, and the ratio f(n)/g(n)
 * against one chosen bound g decides the relation. The verdict compares growth orders exactly
 * (not from the sampled ratios), and each verdict comes with explicit witness constants.
 */

export const MAX_N = 40;
export const MIN_N = 2;
export const MAX_A = 10;
export const MAX_B = 100;
export const MAX_C = 1000;

/** @typedef {'n' | 'nlogn' | 'n2' | 'exp'} GrowthKey */
/** @typedef {'1' | 'n' | 'n2'} PolyOrder */
/** @typedef {'theta' | 'big-o' | 'omega'} Verdict */

export const GROWTH_KEYS = /** @type {const} */ (['n', 'nlogn', 'n2', 'exp']);

/** @type {Record<GrowthKey, (n: number) => number>} */
export const growth = {
  n: (n) => n,
  nlogn: (n) => n * Math.log2(n),
  n2: (n) => n * n,
  exp: (n) => 2 ** n,
};

/** Growth order, so comparing ranks compares the functions asymptotically. */
const RANK = { 1: 0, n: 1, nlogn: 2, n2: 3, exp: 4 };

/**
 * Smallest n from which the order term of f is at most g, so f ≤ S·g holds from there
 * (n ≤ n log₂ n needs n ≥ 2; n² ≤ 2ⁿ holds at n = 1, 2 and every n ≥ 4).
 * @type {Record<PolyOrder, Record<GrowthKey, number>>}
 */
const UPPER_FROM = {
  1: { n: 1, nlogn: 2, n2: 1, exp: 1 },
  n: { n: 1, nlogn: 2, n2: 1, exp: 1 },
  n2: { n: 1, nlogn: 1, n2: 1, exp: 4 },
};

export const asymptoticPseudocode = [
  'f(n) = a·n² + b·n + c,  g(n) = the chosen bound',
  'for n = 1 to N:',
  '  evaluate f(n), n, n log₂ n, n², 2ⁿ',
  '  r = f(n) / g(n)',
  'r settles at a constant > 0  →  f = Θ(g)',
  'r shrinks toward 0           →  f = O(g), not Ω(g)',
  'r grows without bound        →  f = Ω(g), not O(g)',
];

/**
 * @typedef {object} Poly
 * @property {number} a
 * @property {number} b
 * @property {number} c
 */

/**
 * @typedef {object} GrowthPoint
 * @property {number} n
 * @property {number} f
 * @property {Record<GrowthKey, number>} g
 */

/**
 * @typedef {object} AsymptoticFrame
 * @property {'start'|'eval'|'done'} kind
 * @property {number} n  The latest evaluated n (0 on start).
 * @property {GrowthPoint[]} points  Every evaluated n so far.
 * @property {number | null} f
 * @property {number | null} g  The chosen bound at n.
 * @property {number | null} ratio  f(n)/g(n); null when g(n) = 0 or nothing is evaluated.
 * @property {number | null} leadShare  Share of f(n) from its leading term, 0..1.
 * @property {Verdict | null} verdict  Set on the done frame.
 * @property {Witness | null} witness  Constants proving the verdict, on the done frame.
 * @property {number[]} lines
 */

/** @param {Poly} p @param {number} n */
export const evalPoly = (p, n) => p.a * n * n + p.b * n + p.c;

/** The term that dominates f, or null when f is identically 0. @param {Poly} p @returns {PolyOrder | null} */
export function polyOrder(p) {
  if (p.a > 0) return 'n2';
  if (p.b > 0) return 'n';
  if (p.c > 0) return '1';
  return null;
}

/** Coefficient of the dominant term. @param {Poly} p */
export const leadCoefficient = (p) => (p.a > 0 ? p.a : p.b > 0 ? p.b : p.c);

/** The sum a + b + c, an upper constant: f(n) ≤ (a + b + c)·n^k for every n ≥ 1. @param {Poly} p */
export const coefficientSum = (p) => p.a + p.b + p.c;

/**
 * @param {Poly} p  Not identically zero.
 * @param {GrowthKey} bound
 * @returns {Verdict}
 */
export function verdictOf(p, bound) {
  const order = /** @type {PolyOrder} */ (polyOrder(p));
  const diff = RANK[order] - RANK[bound];
  return diff === 0 ? 'theta' : diff < 0 ? 'big-o' : 'omega';
}

/**
 * @typedef {object} Witness
 * @property {Verdict} verdict
 * @property {number | null} upper
 * @property {number | null} upperFrom
 * @property {number | null} lower
 */

/**
 * Witness constants for the verdict: `upper` and `upperFrom` give f(n) ≤ upper·g(n) for every
 * n ≥ upperFrom (O and Θ); `lower` gives f(n) ≥ lower·g(n) for every n ≥ 1 (Ω and Θ).
 * @param {Poly} p
 * @param {GrowthKey} bound
 * @returns {Witness}
 */
export function witness(p, bound) {
  const order = /** @type {PolyOrder} */ (polyOrder(p));
  const verdict = verdictOf(p, bound);
  return {
    verdict,
    upper: verdict === 'omega' ? null : coefficientSum(p),
    upperFrom: verdict === 'omega' ? null : UPPER_FROM[order][bound],
    lower: verdict === 'big-o' ? null : leadCoefficient(p),
  };
}

/** @param {Poly} p @param {number} n */
function leadTerm(p, n) {
  const order = polyOrder(p);
  return order === 'n2' ? p.a * n * n : order === 'n' ? p.b * n : p.c;
}

/**
 * @param {Poly} p  Whole coefficients within the caps, not all zero.
 * @param {GrowthKey} bound
 * @param {number} maxN  MIN_N ≤ maxN ≤ MAX_N.
 * @returns {AsymptoticFrame[]}
 */
export function asymptoticTrace(p, bound, maxN) {
  /** @type {AsymptoticFrame[]} */
  const frames = [
    {
      kind: 'start',
      n: 0,
      points: [],
      f: null,
      g: null,
      ratio: null,
      leadShare: null,
      verdict: null,
      witness: null,
      lines: [0],
    },
  ];
  /** @type {GrowthPoint[]} */
  const points = [];
  for (let n = 1; n <= maxN; n++) {
    const f = evalPoly(p, n);
    /** @type {Record<GrowthKey, number>} */
    const g = { n: growth.n(n), nlogn: growth.nlogn(n), n2: growth.n2(n), exp: growth.exp(n) };
    points.push({ n, f, g });
    const gn = g[bound];
    frames.push({
      kind: 'eval',
      n,
      points: points.map((pt) => ({ ...pt, g: { ...pt.g } })),
      f,
      g: gn,
      ratio: gn === 0 ? null : f / gn,
      leadShare: leadTerm(p, n) / f,
      verdict: null,
      witness: null,
      lines: [1, 2, 3],
    });
  }
  const last = frames[frames.length - 1];
  const w = witness(p, bound);
  const verdict = w.verdict;
  frames.push({
    ...last,
    kind: 'done',
    points: last.points.map((pt) => ({ ...pt, g: { ...pt.g } })),
    verdict,
    witness: w,
    lines: [verdict === 'theta' ? 4 : verdict === 'big-o' ? 5 : 6],
  });
  return frames;
}
