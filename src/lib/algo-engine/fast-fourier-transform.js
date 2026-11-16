/**
 * Polynomial multiplication with the iterative radix-2 fast Fourier transform (Cooley–Tukey, as
 * in CLRS’s ITERATIVE-FFT). Coefficients are listed from the constant term up. n is the smallest
 * power of two that holds every coefficient of the product. The transform puts the input in
 * bit-reversed order, then for len = 2, 4, …, n combines pairs with butterflies
 * y[top] = u + w·v, y[bottom] = u − w·v, where w = ω_len^j and ω_len = e^(2πi/len). Output k is
 * the polynomial’s value at ω_n^k. The product’s values are the pointwise products, and the
 * inverse transform (ω⁻¹ in place of ω, then divide by n) turns them back into coefficients.
 */

export const MAX_COEFFS = 8;
export const MAX_ABS = 9;

export const fftPseudocode = [
  'n = smallest power of 2 > deg A + deg B',
  'y = coefficients in bit-reversed order',
  'for len = 2, 4, …, n:',
  '  for each block of len, j = 0 … len/2 − 1:',
  '    w = ω_len^j;  u = y[top];  t = w · y[bottom]',
  '    y[top] = u + t;  y[bottom] = u − t',
  'C(ωᵏ) = A(ωᵏ) · B(ωᵏ) for every k',
  'inverse FFT: same loops with ω⁻¹, then divide by n',
  'round each coefficient to a whole number',
];

/** @typedef {{ re: number, im: number }} Complex */

/**
 * @typedef {object} FftFrame
 * @property {'start'|'reorder'|'butterfly'|'pointwise'|'scale'|'done'} kind
 * @property {'a'|'b'|'inverse'|''} phase  The transform the diagram shows.
 * @property {number} n
 * @property {number[]} a
 * @property {number[]} b
 * @property {number[]} order  order[row] = the input index that starts in that row.
 * @property {(Complex | null)[][]} columns  Column 0 after reordering, column s after stage s.
 * @property {number} stage  The stage being built (1 … log₂ n); 0 when none.
 * @property {number} top  The butterfly’s rows; -1 when none.
 * @property {number} bottom
 * @property {number} root  The twiddle as a power of ω_n (k in ω_n^k, reduced mod n); -1 when none.
 * @property {Complex | null} twiddle
 * @property {Complex[] | null} fa  A at the n-th roots of unity, once known.
 * @property {Complex[] | null} fb
 * @property {Complex[] | null} prod
 * @property {number[] | null} result  The product’s coefficients.
 * @property {number} butterflies
 * @property {number} naive  Multiplications the schoolbook method needs.
 * @property {number[]} lines
 */

/** @param {number} n */
export function sizeFor(n) {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/** @param {number} i @param {number} bits */
export function reverseBits(i, bits) {
  let out = 0;
  for (let b = 0; b < bits; b++) out = (out << 1) | ((i >> b) & 1);
  return out;
}

/** Drops the tiny rounding noise so a value prints as 0, not −0.00. @param {number} x */
const clean = (x) => (Math.abs(x) < 1e-9 ? 0 : x);

/** ω_n^k = e^(2πik/n). @param {number} k @param {number} n @returns {Complex} */
export function rootOfUnity(k, n) {
  const angle = (2 * Math.PI * k) / n;
  return { re: clean(Math.cos(angle)), im: clean(Math.sin(angle)) };
}

/** @param {Complex} p @param {Complex} q @returns {Complex} */
const mul = (p, q) => ({ re: p.re * q.re - p.im * q.im, im: p.re * q.im + p.im * q.re });

/**
 * The schoolbook product, the oracle and the cost to beat.
 * @param {number[]} a @param {number[]} b
 */
export function naiveProduct(a, b) {
  const out = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return out;
}

/**
 * @param {number[]} a  1 to MAX_COEFFS whole coefficients, constant term first.
 * @param {number[]} b
 * @returns {FftFrame[]}
 */
export function fftTrace(a, b) {
  const n = sizeFor(a.length + b.length - 1);
  const bits = Math.log2(n);
  const order = Array.from({ length: n }, (_, i) => reverseBits(i, bits));
  /** @type {FftFrame[]} */
  const frames = [];
  /** @type {FftFrame['phase']} */
  let phase = '';
  /** @type {(Complex | null)[][]} */
  let columns = [];
  let stage = 0;
  let top = -1;
  let bottom = -1;
  let root = -1;
  /** @type {Complex | null} */
  let twiddle = null;
  /** @type {Complex[] | null} */
  let fa = null;
  /** @type {Complex[] | null} */
  let fb = null;
  /** @type {Complex[] | null} */
  let prod = null;
  /** @type {number[] | null} */
  let result = null;
  let butterflies = 0;

  /** @param {FftFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      phase,
      n,
      a: a.slice(),
      b: b.slice(),
      order: order.slice(),
      columns: columns.map((col) => col.map((z) => (z ? { ...z } : null))),
      stage,
      top,
      bottom,
      root,
      twiddle: twiddle ? { ...twiddle } : null,
      fa: fa ? fa.map((z) => ({ ...z })) : null,
      fb: fb ? fb.map((z) => ({ ...z })) : null,
      prod: prod ? prod.map((z) => ({ ...z })) : null,
      result: result ? result.slice() : null,
      butterflies,
      naive: a.length * b.length,
      lines,
    });

  /**
   * One transform, frame by frame.
   * @param {Complex[]} input  n values in natural order.
   * @param {boolean} inverse
   * @param {number[]} reorderLines
   */
  const transform = (input, inverse, reorderLines) => {
    columns = [order.map((src) => ({ ...input[src] }))];
    for (let s = 1; s <= bits; s++) columns.push(Array(n).fill(null));
    stage = 0;
    top = bottom = root = -1;
    twiddle = null;
    push('reorder', reorderLines);
    for (let s = 1; s <= bits; s++) {
      stage = s;
      const len = 2 ** s;
      const prev = columns[s - 1];
      const cur = columns[s];
      for (let start = 0; start < n; start += len) {
        for (let j = 0; j < len / 2; j++) {
          top = start + j;
          bottom = top + len / 2;
          const k = ((inverse ? -j : j) * (n / len) + n) % n;
          root = k;
          twiddle = rootOfUnity(k, n);
          const u = /** @type {Complex} */ (prev[top]);
          const t = mul(twiddle, /** @type {Complex} */ (prev[bottom]));
          cur[top] = { re: clean(u.re + t.re), im: clean(u.im + t.im) };
          cur[bottom] = { re: clean(u.re - t.re), im: clean(u.im - t.im) };
          butterflies++;
          push('butterfly', start === 0 && j === 0 ? [2, 3, 4, 5] : [3, 4, 5]);
        }
      }
    }
    stage = 0;
    top = bottom = root = -1;
    twiddle = null;
    return /** @type {Complex[]} */ (columns[bits]).map((z) => ({ ...z }));
  };

  /** @param {number[]} coeffs @returns {Complex[]} */
  const padded = (coeffs) => Array.from({ length: n }, (_, i) => ({ re: coeffs[i] ?? 0, im: 0 }));

  push('start', [0]);
  phase = 'a';
  fa = transform(padded(a), false, [1]);
  phase = 'b';
  fb = transform(padded(b), false, [1]);
  const pa = fa;
  const pb = fb;
  prod = pa.map((z, k) => {
    const p = mul(z, pb[k]);
    return { re: clean(p.re), im: clean(p.im) };
  });
  push('pointwise', [6]);
  phase = 'inverse';
  const back = transform(prod, true, [7, 1]);
  columns = [
    ...columns.slice(0, bits),
    back.map((z) => ({ re: clean(z.re / n), im: clean(z.im / n) })),
  ];
  push('scale', [7]);
  result = back.slice(0, a.length + b.length - 1).map((z) => Math.round(z.re / n) + 0);
  push('done', [8]);
  return frames;
}

/** @type {Record<'linear'|'square'|'cubes'|'carry'|'longest', {a: number[], b: number[]}>} */
export const FFT_PRESETS = {
  linear: { a: [1, 2], b: [3, 1] },
  square: { a: [1, 1, 1], b: [1, 1, 1] },
  cubes: { a: [2, 0, -1, 3], b: [1, -2, 0, 4] },
  carry: { a: [3, 2, 1], b: [6, 5, 4] },
  longest: { a: [1, 2, 3, 4, 5, 6, 7, 8], b: [8, 7, 6, 5, 4, 3, 2, 1] },
};
