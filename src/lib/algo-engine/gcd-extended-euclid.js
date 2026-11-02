/**
 * The extended Euclidean algorithm in its iterative table form, for positive a and b. Each row
 * keeps the invariant r = s·a + t·b, so the last non-zero remainder comes with its Bézout
 * coefficients. Each division also cuts q squares of side r₁ off a rectangle a wide and b tall;
 * the side of the last squares is the gcd, and those squares tile the whole rectangle.
 */

export const MAX_VALUE = 999;
export const MAX_C = 9999;

export const gcdPseudocode = [
  '(r₀, s₀, t₀) = (a, 1, 0)',
  '(r₁, s₁, t₁) = (b, 0, 1)',
  'while r₁ ≠ 0:',
  '  q = ⌊r₀ / r₁⌋   // cut q squares of side r₁',
  '  (r₀, r₁) = (r₁, r₀ − q·r₁)',
  '  (s₀, s₁) = (s₁, s₀ − q·s₁)',
  '  (t₀, t₁) = (t₁, t₀ − q·t₁)',
  'g = r₀, x = s₀, y = t₀   // g = a·x + b·y',
  'if g does not divide c: no integer solution',
  'x₀ = x·c/g, y₀ = y·c/g   // a·x₀ + b·y₀ = c',
  'all solutions: (x₀ + k·b/g, y₀ − k·a/g)',
];

/**
 * @typedef {object} GcdRow
 * @property {number} r
 * @property {number|null} q  The quotient that produced this remainder; null on the first two rows.
 * @property {number} s
 * @property {number} t
 */

/**
 * @typedef {object} GcdSquare
 * @property {number} x
 * @property {number} y
 * @property {number} side
 * @property {number} step  The division that cut it, from 1.
 */

/**
 * @typedef {object} GcdFrame
 * @property {'start'|'divide'|'update'|'gcd'|'none'|'solve'|'general'|'done'} kind
 * @property {number} a
 * @property {number} b
 * @property {number} c
 * @property {GcdRow[]} rows
 * @property {GcdSquare[]} squares
 * @property {{x: number, y: number, w: number, h: number}} rest  The part not yet cut.
 * @property {number} step  Divisions so far, which is also the step of the newest squares.
 * @property {number} q  The current quotient.
 * @property {number} r0
 * @property {number} r1
 * @property {number} divisions
 * @property {number} subtractions  Squares cut so far: what subtraction alone would need.
 * @property {number|null} g
 * @property {number|null} x  Bézout coefficient of a.
 * @property {number|null} y  Bézout coefficient of b.
 * @property {boolean|null} solvable  Whether a·x + b·y = c has integer solutions.
 * @property {number|null} x0
 * @property {number|null} y0
 * @property {number|null} stepX  How far x moves between solutions: b/g.
 * @property {number|null} stepY  How far y moves between solutions: a/g.
 * @property {number|null} smallX  The smallest solution x that is not negative.
 * @property {number|null} smallY  The y that goes with it.
 * @property {number[]} lines
 */

/**
 * @param {number} a  From 1 to MAX_VALUE.
 * @param {number} b  From 1 to MAX_VALUE.
 * @param {number} c  The right-hand side of a·x + b·y = c.
 * @returns {GcdFrame[]}
 */
export function gcdTrace(a, b, c) {
  /** @type {GcdRow[]} */
  const rows = [
    { r: a, q: null, s: 1, t: 0 },
    { r: b, q: null, s: 0, t: 1 },
  ];
  /** @type {GcdSquare[]} */
  const squares = [];
  const rest = { x: 0, y: 0, w: a, h: b };
  /** @type {GcdFrame[]} */
  const frames = [];
  let [r0, r1, s0, s1, t0, t1] = [a, b, 1, 0, 0, 1];
  let step = 0;
  let q = 0;
  let subtractions = 0;
  /** @type {Pick<GcdFrame, 'g'|'x'|'y'|'solvable'|'x0'|'y0'|'stepX'|'stepY'|'smallX'|'smallY'>} */
  const answer = {
    g: null,
    x: null,
    y: null,
    solvable: null,
    x0: null,
    y0: null,
    stepX: null,
    stepY: null,
    smallX: null,
    smallY: null,
  };

  /** @param {GcdFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      a,
      b,
      c,
      rows: rows.map((row) => ({ ...row })),
      squares: squares.map((sq) => ({ ...sq })),
      rest: { ...rest },
      step,
      q,
      r0,
      r1,
      divisions: step,
      subtractions,
      ...answer,
      lines,
    });

  push('start', [0, 1]);

  while (r1 !== 0) {
    q = Math.floor(r0 / r1);
    step++;
    subtractions += q;
    for (let k = 0; k < q; k++) {
      squares.push({ x: rest.x, y: rest.y, side: r1, step });
      if (rest.h === r1) {
        rest.x += r1;
        rest.w -= r1;
      } else {
        rest.y += r1;
        rest.h -= r1;
      }
    }
    push('divide', [2, 3]);
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
    rows.push({ r: r1, q, s: s1, t: t1 });
    push('update', [4, 5, 6]);
  }

  answer.g = r0;
  answer.x = s0;
  answer.y = t0;
  push('gcd', [2, 7]);

  answer.solvable = c % r0 === 0;
  if (answer.solvable) {
    const times = c / r0;
    answer.x0 = s0 * times + 0;
    answer.y0 = t0 * times + 0;
    push('solve', [8, 9]);
    answer.stepX = b / r0;
    answer.stepY = a / r0;
    answer.smallX = ((answer.x0 % answer.stepX) + answer.stepX) % answer.stepX;
    answer.smallY = (c - a * answer.smallX) / b + 0;
    push('general', [10]);
  } else {
    push('none', [8]);
  }

  push('done', []);
  return frames;
}

/** @type {Record<'classic'|'fibonacci'|'tall'|'multiple'|'noSolution', {a: number, b: number, c: number}>} */
export const GCD_PRESETS = {
  classic: { a: 240, b: 46, c: 10 },
  fibonacci: { a: 233, b: 144, c: 1 },
  tall: { a: 46, b: 240, c: 10 },
  multiple: { a: 252, b: 84, c: 168 },
  noSolution: { a: 6, b: 9, c: 7 },
};
