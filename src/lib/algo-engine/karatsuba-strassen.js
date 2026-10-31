/**
 * Divide-and-conquer multiplication. For whole numbers, split both factors at m = floor(d/2)
 * digits (d = the longer factor's digit count): x = x₁·10^m + x₀, y = y₁·10^m + y₀. The
 * schoolbook split needs four products x₁y₁, x₁y₀, x₀y₁, x₀y₀; Karatsuba gets the middle term
 * from one product, (x₁ + x₀)(y₁ + y₀) − x₁y₁ − x₀y₀, so three are enough. Recursion stops at
 * two one-digit factors, so every leaf is exactly one digit multiplication. Strassen does the
 * same for 2×2 (block) matrices: seven products instead of eight.
 */

export const MAX_DIGITS = 6;

/** @typedef {'four' | 'three'} SplitMethod */

/**
 * @typedef {object} CallNode
 * @property {number} id  Creation order; the root is 0.
 * @property {number} parent  -1 for the root.
 * @property {'root'|'a'|'b'|'c'|'d'|'z2'|'z1'|'z0'} tag  The product this call computes.
 * @property {number} x
 * @property {number} y
 * @property {number} m  Split position in digits, 0 for a one-digit product.
 * @property {{x1: number, x0: number, y1: number, y0: number} | null} parts
 * @property {number | null} result  Null until computed.
 * @property {number[]} children
 */

/**
 * @typedef {object} MulFrame
 * @property {'start'|'split'|'base'|'combine'|'done'} kind
 * @property {CallNode[]} nodes  Every call created so far.
 * @property {number} current  The call acted on, -1 on start and done.
 * @property {number} products  One-digit multiplications so far.
 * @property {number} adds  Additions and subtractions of partial results so far.
 * @property {number} calls  Calls created so far.
 * @property {number[]} lines
 */

export const fourPseudocode = [
  'multiply(x, y):',
  '  if x < 10 and y < 10: return x · y            // one digit product',
  '  m = floor(digits / 2)',
  '  split x = x₁·10^m + x₀ and y = y₁·10^m + y₀',
  '  a = multiply(x₁, y₁);  b = multiply(x₁, y₀)',
  '  c = multiply(x₀, y₁);  d = multiply(x₀, y₀)    // four products',
  '  return a·10^(2m) + (b + c)·10^m + d',
];

export const threePseudocode = [
  'multiply(x, y):',
  '  if x < 10 and y < 10: return x · y            // one digit product',
  '  m = floor(digits / 2)',
  '  split x = x₁·10^m + x₀ and y = y₁·10^m + y₀',
  '  z₂ = multiply(x₁, y₁);  z₀ = multiply(x₀, y₀)',
  '  z₁ = multiply(x₁ + x₀, y₁ + y₀) − z₂ − z₀    // one product, not two',
  '  return z₂·10^(2m) + z₁·10^m + z₀',
];

/** @param {number} v */
const digits = (v) => String(v).length;

/**
 * Reads a whole number with 1..MAX_DIGITS digits.
 * @param {string} text
 * @returns {{value: number} | {error: 'format'|'size'}}
 */
export function parseFactor(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return { error: 'format' };
  const value = Number(t);
  if (digits(value) > MAX_DIGITS) return { error: 'size' };
  return { value };
}

/**
 * One-digit products for two n-digit factors when n is a power of two and no carry grows
 * a sum: n² for four products, 3^(log₂ n) = n^(log₂ 3) for three.
 * @param {number} n
 */
export function digitProducts(n) {
  return { four: n * n, three: 3 ** Math.round(Math.log2(n)) };
}

/**
 * @param {number} x
 * @param {number} y
 * @param {SplitMethod} method
 * @returns {MulFrame[]}
 */
export function multiplyTrace(x, y, method) {
  /** @type {CallNode[]} */
  const nodes = [];
  /** @type {MulFrame[]} */
  const frames = [];
  let products = 0;
  let adds = 0;
  const code = method === 'four' ? fourPseudocode : threePseudocode;
  const last = code.length - 1;

  /** @param {MulFrame['kind']} kind @param {number} current @param {number[]} lines */
  const push = (kind, current, lines) =>
    frames.push({
      kind,
      nodes: nodes.map((n) => ({
        ...n,
        parts: n.parts ? { ...n.parts } : null,
        children: n.children.slice(),
      })),
      current,
      products,
      adds,
      calls: nodes.length,
      lines: lines.slice(),
    });

  /** @param {CallNode['tag']} tag @param {number} parent @param {number} a @param {number} b */
  function create(tag, parent, a, b) {
    const node = /** @type {CallNode} */ ({
      id: nodes.length,
      parent,
      tag,
      x: a,
      y: b,
      m: 0,
      parts: null,
      result: null,
      children: [],
    });
    nodes.push(node);
    if (parent >= 0) nodes[parent].children.push(node.id);
    return node;
  }

  /** @param {CallNode} node @returns {number} */
  function solve(node) {
    if (node.x < 10 && node.y < 10) {
      node.result = node.x * node.y;
      products++;
      push('base', node.id, [0, 1]);
      return node.result;
    }
    const m = Math.floor(Math.max(digits(node.x), digits(node.y)) / 2);
    const p = 10 ** m;
    const parts = {
      x1: Math.floor(node.x / p),
      x0: node.x % p,
      y1: Math.floor(node.y / p),
      y0: node.y % p,
    };
    node.m = m;
    node.parts = parts;
    if (method === 'four') {
      const kids = [
        create('a', node.id, parts.x1, parts.y1),
        create('b', node.id, parts.x1, parts.y0),
        create('c', node.id, parts.x0, parts.y1),
        create('d', node.id, parts.x0, parts.y0),
      ];
      push('split', node.id, [0, 2, 3, 4, 5]);
      const [a, b, c, d] = kids.map(solve);
      node.result = a * p * p + (b + c) * p + d;
      adds += 3;
      push('combine', node.id, [last]);
    } else {
      adds += 2;
      const kids = [
        create('z2', node.id, parts.x1, parts.y1),
        create('z1', node.id, parts.x1 + parts.x0, parts.y1 + parts.y0),
        create('z0', node.id, parts.x0, parts.y0),
      ];
      push('split', node.id, [0, 2, 3, 4, 5]);
      const [z2, mid, z0] = kids.map(solve);
      const z1 = mid - z2 - z0;
      node.result = z2 * p * p + z1 * p + z0;
      adds += 4;
      push('combine', node.id, [5, last]);
    }
    return node.result;
  }

  const root = create('root', -1, x, y);
  push('start', -1, [0]);
  solve(root);
  push('done', -1, [last]);
  return frames;
}

/** @typedef {[[number, number], [number, number]]} Matrix2 */

/**
 * @typedef {object} StrassenFrame
 * @property {'start'|'product'|'entry'|'done'} kind
 * @property {Matrix2} A
 * @property {Matrix2} B
 * @property {(number | null)[]} M  M₁..M₇, null until computed.
 * @property {(number | null)[][]} C  Null until computed.
 * @property {number} current  Index into M on 'product', into C row-major on 'entry'; -1 otherwise.
 * @property {[number, number] | null} factors  The two sums multiplied on a 'product' frame.
 * @property {number} multiplications
 * @property {number} additions
 * @property {number[]} lines
 */

export const strassenPseudocode = [
  'C = A·B, with A, B split into 2×2 blocks (here single numbers):',
  'M₁ = (A₁₁ + A₂₂)(B₁₁ + B₂₂)',
  'M₂ = (A₂₁ + A₂₂)·B₁₁',
  'M₃ = A₁₁·(B₁₂ − B₂₂)',
  'M₄ = A₂₂·(B₂₁ − B₁₁)',
  'M₅ = (A₁₁ + A₁₂)·B₂₂',
  'M₆ = (A₂₁ − A₁₁)(B₁₁ + B₁₂)',
  'M₇ = (A₁₂ − A₂₂)(B₂₁ + B₂₂)',
  'C₁₁ = M₁ + M₄ − M₅ + M₇',
  'C₁₂ = M₃ + M₅',
  'C₂₁ = M₂ + M₄',
  'C₂₂ = M₁ − M₂ + M₃ + M₆',
];

export const MIN_ENTRY = -9;
export const MAX_ENTRY = 9;

/**
 * Reads four whole numbers MIN_ENTRY..MAX_ENTRY, row by row.
 * @param {string} text
 * @returns {{matrix: Matrix2} | {error: 'format'|'range'}}
 */
export function parseMatrix(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length !== 4 || !tokens.every((s) => /^[-−]?\d+$/.test(s))) {
    return { error: 'format' };
  }
  const v = tokens.map((s) => Number(s.replace('−', '-')));
  if (v.some((e) => e < MIN_ENTRY || e > MAX_ENTRY)) return { error: 'range' };
  return {
    matrix: [
      [v[0], v[1]],
      [v[2], v[3]],
    ],
  };
}

/** The definition: eight products. @param {Matrix2} A @param {Matrix2} B @returns {Matrix2} */
export function naiveProduct(A, B) {
  // Adding 0 turns a −0 (from a negative times zero) into 0.
  const z = (/** @type {number} */ v) => v + 0;
  return /** @type {Matrix2} */ (
    [
      [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
      [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
    ].map((row) => row.map(z))
  );
}

/**
 * @param {Matrix2} A
 * @param {Matrix2} B
 * @returns {StrassenFrame[]}
 */
export function strassenTrace(A, B) {
  const [[a11, a12], [a21, a22]] = A;
  const [[b11, b12], [b21, b22]] = B;
  /** @type {[number, number, number][]} factors and the additions spent forming them */
  const factors = [
    [a11 + a22, b11 + b22, 2],
    [a21 + a22, b11, 1],
    [a11, b12 - b22, 1],
    [a22, b21 - b11, 1],
    [a11 + a12, b22, 1],
    [a21 - a11, b11 + b12, 2],
    [a12 - a22, b21 + b22, 2],
  ];
  /** @type {StrassenFrame[]} */
  const frames = [];
  /** @type {(number | null)[]} */
  const M = Array(7).fill(null);
  /** @type {(number | null)[][]} */
  const C = [
    [null, null],
    [null, null],
  ];
  let multiplications = 0;
  let additions = 0;

  /**
   * @param {StrassenFrame['kind']} kind @param {number} current @param {number[]} lines
   * @param {[number, number] | null} [f]
   */
  const push = (kind, current, lines, f = null) =>
    frames.push({
      kind,
      A: [
        [a11, a12],
        [a21, a22],
      ],
      B: [
        [b11, b12],
        [b21, b22],
      ],
      M: M.slice(),
      C: C.map((r) => r.slice()),
      current,
      factors: f ? [f[0], f[1]] : null,
      multiplications,
      additions,
      lines: lines.slice(),
    });

  push('start', -1, [0]);
  factors.forEach(([p, q, cost], t) => {
    M[t] = p * q + 0;
    multiplications++;
    additions += cost;
    push('product', t, [t + 1], [p, q]);
  });
  const m = /** @type {number[]} */ (M);
  const entries = [
    [m[0] + m[3] - m[4] + m[6], 3],
    [m[2] + m[4], 1],
    [m[1] + m[3], 1],
    [m[0] - m[1] + m[2] + m[5], 3],
  ];
  entries.forEach(([value, cost], t) => {
    C[Math.floor(t / 2)][t % 2] = value + 0;
    additions += cost;
    push('entry', t, [8 + t]);
  });
  push('done', -1, [8, 9, 10, 11]);
  return frames;
}
