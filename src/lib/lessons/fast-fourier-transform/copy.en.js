/** @typedef {import('$lib/algo-engine/fast-fourier-transform.js').FftFrame} FftFrame */
/** @typedef {import('$lib/algo-engine/fast-fourier-transform.js').Complex} Complex */

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** @param {number} k */
const sup = (k) => [...String(k)].map((d) => SUP[Number(d)]).join('');
/** @param {number} k */
const sub = (k) => [...String(k)].map((d) => SUB[Number(d)]).join('');

/** Two decimals at most, and never −0. @param {number} x */
const r2 = (x) => {
  const v = Math.round(x * 100) / 100;
  return v === 0 ? 0 : v;
};

/** @param {number} v */
const signed = (v) => (v < 0 ? `−${-v}` : String(v));

/**
 * A complex number rounded to two decimals: 3, −1.41i, 0.71 − 0.71i.
 * @param {Complex} z
 */
const complex = (z) => {
  const re = r2(z.re);
  const im = r2(z.im);
  if (im === 0) return signed(re);
  const imText = Math.abs(im) === 1 ? 'i' : `${Math.abs(im)}i`;
  if (re === 0) return im < 0 ? `−${imText}` : imText;
  return `${signed(re)} ${im < 0 ? '−' : '+'} ${imText}`;
};

/**
 * A polynomial from its coefficients, constant term first: 3 + 7x + 2x².
 * @param {number[]} coeffs
 */
const poly = (coeffs) => {
  const terms = coeffs
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c !== 0)
    .map(({ c, i }) => {
      const size = Math.abs(c) === 1 && i > 0 ? '' : String(Math.abs(c));
      const power = i === 0 ? '' : i === 1 ? 'x' : `x${sup(i)}`;
      return { neg: c < 0, text: `${size}${power}` };
    });
  if (terms.length === 0) return '0';
  return terms
    .map((t, j) => (j === 0 ? `${t.neg ? '−' : ''}${t.text}` : `${t.neg ? '−' : '+'} ${t.text}`))
    .join(' ');
};

/** A polynomial’s value at x = 10, exact however long it is. @param {number[]} coeffs */
const atTen = (coeffs) =>
  coeffs
    .reduceRight((acc, c) => acc * 10n + BigInt(c), 0n)
    .toString()
    .replace('-', '−');

/** ω_n^k written with sub- and superscripts. @param {number} n @param {number} k */
const omega = (n, k) => `ω${sub(n)}${sup(k)}`;

export const en = {
  slug: 'fast-fourier-transform',
  topic: 'algebraic-randomised',
  level: 'Advanced',
  title: 'Fast Fourier transform',
  intro:
    'Multiplying two polynomials coefficient by coefficient takes O(n²) steps. A polynomial of degree below n is also fixed by its values at n points, and values multiply pointwise in O(n). The fast Fourier transform picks the n complex n-th roots of unity as those points, which lets it evaluate a polynomial in O(n log n) by splitting it into even and odd halves; the same trick runs backwards to recover the coefficients.',
  summary:
    'Multiply polynomials in O(n log n): evaluate both at the roots of unity with butterflies, multiply the values, and transform back.',
  instruction:
    'Type the coefficients of A and B (constant term first) or pick an example, then step. The butterfly diagram fills one column per stage: each butterfly reads u and v, multiplies v by the twiddle w on the circle, and writes u + w·v and u − w·v. Watch the three transforms, then compare “Butterflies” with “Schoolbook multiplications”.',
  fields: { a: 'A coefficients', b: 'B coefficients' },
  fieldHint: 'constant term first',
  presetLabel: 'Example',
  presets: {
    linear: '(1 + 2x)(3 + x)',
    square: '(1 + x + x²)²',
    cubes: 'Two cubics',
    carry: '123 × 456 as digits',
    longest: 'Eight terms each (n = 16)',
  },
  /** @param {number} maxN @param {number} maxAbs */
  coeffError: (maxN, maxAbs) =>
    `Type 1 to ${maxN} whole numbers from −${maxAbs} to ${maxAbs}, separated by commas or spaces.`,
  polyTitle: 'The polynomials',
  /** @param {string} name @param {number[]} coeffs */
  polyLine: (name, coeffs) => `${name}(x) = ${poly(coeffs)}`,
  phaseTitles: {
    a: 'Transforming A: values at the roots of unity',
    b: 'Transforming B: values at the roots of unity',
    inverse: 'Inverse transform: back to coefficients',
    '': 'Butterfly diagram',
  },
  /** @param {number} n */
  diagramAria: (n) => `Butterfly diagram for n = ${n}`,
  inputColumn: 'Input',
  /** @param {number} s */
  stageColumn: (s) => `Stage ${s}, len ${2 ** s}`,
  /** @param {FftFrame['phase']} phase @param {number} src */
  inputName: (phase, src) =>
    phase === 'a' ? `a${sub(src)}` : phase === 'b' ? `b${sub(src)}` : `C(ω${sup(src)})`,
  /** @param {FftFrame['phase']} phase @param {number} row @param {boolean} scaled */
  outputName: (phase, row, scaled) =>
    phase === 'a'
      ? `A(ω${sup(row)})`
      : phase === 'b'
        ? `B(ω${sup(row)})`
        : scaled
          ? `c${sub(row)}`
          : `n·c${sub(row)}`,
  roles: { u: 'u', v: 'v', plus: 'u + t', minus: 'u − t' },
  /** @param {number} col @param {number} row @param {string} value @param {string} role */
  nodeLabel: (col, row, value, role) =>
    `Column ${col}, row ${row}: ${value || 'not computed yet'}${role ? `, ${role}` : ''}`,
  legend: {
    input: 'u, v: the butterfly’s inputs',
    output: 'u ± t: the butterfly’s outputs',
    done: 'value already computed',
    empty: '… not computed yet',
  },
  circleTitle: 'Twiddle factor on the unit circle',
  /** @param {number} n */
  circleAria: (n) => `The ${n}-th roots of unity on the unit circle`,
  /** @param {number} n @param {number} k @param {Complex} w */
  twiddleText: (n, k, w) => `w = ${omega(n, k)} = ${complex(w)}`,
  noTwiddle: 'No butterfly on this step.',
  /** @param {number} n @param {number} k @param {boolean} hot */
  rootLabel: (n, k, hot) => `${omega(n, k)}${hot ? ', the twiddle now' : ''}`,
  valuesTitle: 'Values at the roots of unity',
  valuesHead: { k: 'k', a: 'A(ωᵏ)', b: 'B(ωᵏ)', c: 'C(ωᵏ)' },
  pending: '…',
  resultTitle: 'Product C(x) = A(x) · B(x)',
  resultPending: 'step to the end',
  stats: {
    n: 'n (points)',
    butterflies: 'Butterflies',
    naive: 'Schoolbook multiplications',
    stage: 'Stage',
  },
  noStage: '—',
  complex,
  /** @param {FftFrame} f */
  describe(f) {
    const deg = f.a.length + f.b.length - 2;
    switch (f.kind) {
      case 'start':
        return `C = A · B has degree ${deg}, so it has ${deg + 1} coefficients and needs as many points. The smallest power of 2 that holds them is n = ${f.n}. Plan: transform A, transform B, multiply the values, transform back.`;
      case 'reorder':
        if (f.phase === 'inverse')
          return `Inverse transform: the same butterflies run on the values C(ωᵏ), with ω⁻¹ in place of ω. First put them in bit-reversed order.`;
        return `Transform ${f.phase === 'a' ? 'A' : 'B'}: put its ${f.n} coefficients (zeros pad the top) in bit-reversed order: ${f.order.join(', ')}. Each stage then merges neighbouring blocks into blocks twice as long.`;
      case 'butterfly': {
        const prev = f.columns[f.stage - 1];
        const cur = f.columns[f.stage];
        const u = /** @type {Complex} */ (prev[f.top]);
        const out = /** @type {Complex} */ (cur[f.top]);
        const t = { re: out.re - u.re, im: out.im - u.im };
        return `Stage ${f.stage}, len ${2 ** f.stage}: w = ${omega(f.n, f.root)} = ${complex(/** @type {Complex} */ (f.twiddle))}. u = ${complex(u)}, t = w · v = ${complex(t)}. Row ${f.top} gets u + t = ${complex(out)}, row ${f.bottom} gets u − t = ${complex(/** @type {Complex} */ (cur[f.bottom]))}.`;
      }
      case 'pointwise': {
        const fa = /** @type {Complex[]} */ (f.fa);
        const fb = /** @type {Complex[]} */ (f.fb);
        const pr = /** @type {Complex[]} */ (f.prod);
        return `Both transforms are done. Multiply value by value: C(ωᵏ) = A(ωᵏ) · B(ωᵏ), only ${f.n} multiplications. For k = 0 (x = 1): ${complex(fa[0])} · ${complex(fb[0])} = ${complex(pr[0])}.`;
      }
      case 'scale':
        return `The inverse transform returns n times each coefficient, so divide every value by n = ${f.n}.`;
      case 'done': {
        const c = /** @type {number[]} */ (f.result);
        return `Round away the tiny floating-point error: C(x) = ${poly(c)}. Check at x = 10: ${atTen(f.a)} × ${atTen(f.b)} = ${atTen(c)}.`;
      }
    }
  },
  poly,
  takeaways: [
    'A polynomial of degree below n is fixed by its n coefficients or, just as well, by its values at n distinct points. In value form, multiplying two polynomials is n multiplications.',
    'The FFT evaluates at the n-th roots of unity ωᵏ = e^(2πik/n). Splitting A(x) = A_even(x²) + x·A_odd(x²) works because the squares of the n-th roots are the n/2-th roots, so each half is a problem of half the size.',
    'Each butterfly combines one pair: y[top] = u + w·v and y[bottom] = u − w·v, using ωᵏ⁺ⁿᐟ² = −ωᵏ. There are log₂ n stages of n/2 butterflies: O(n log n).',
    'The inverse transform is the same algorithm with ω⁻¹ and a final division by n. Three transforms plus n pointwise products give the product in O(n log n), against O(n²) for the schoolbook method.',
    'Try “123 × 456 as digits”: the digits are coefficients, and the check at x = 10 is ordinary multiplication. Big-number libraries multiply huge integers this way, then carry.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Schoolbook product', 'O(n²)', 'Every coefficient of A meets every coefficient of B.'],
    [
      'One FFT',
      'O(n log n)',
      'log₂ n stages, each with n/2 butterflies of one complex multiplication and two additions.',
    ],
    ['Pointwise product', 'O(n)', 'One multiplication per root of unity.'],
    [
      'Whole product',
      'O(n log n)',
      'Two forward transforms, n products and one inverse transform.',
    ],
    ['Memory', 'O(n)', 'The iterative version works in place in one array of n values.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A has 5 coefficients and B has 6. What n does the FFT use for their product?',
      answer: 16,
      hints: [
        'The product has 5 + 6 − 1 coefficients; n is the smallest power of 2 at least that.',
      ],
      solution: 'C has 10 coefficients, and the smallest power of 2 that is at least 10 is 16.',
    },
    {
      type: 'number',
      prompt:
        'Load “Two cubics” and step to the end. How many butterflies does the whole product take?',
      answer: 36,
      unit: 'butterflies',
      hints: [
        'n = 8, so each transform has log₂ 8 = 3 stages of 8/2 = 4 butterflies. There are three transforms.',
      ],
      solution: 'Each transform does 3 · 4 = 12 butterflies, and A, B and the inverse make 36.',
    },
    {
      type: 'choice',
      prompt: 'Why does the FFT evaluate at the roots of unity instead of at 0, 1, 2, …, n − 1?',
      options: [
        'Their squares are the n/2-th roots of unity, so each half-size problem needs only half as many points',
        'Real numbers cannot be used as evaluation points',
        'Roots of unity make every value a whole number',
        'They avoid the need for an inverse transform',
      ],
      answer: 0,
      hints: ['Think about what the even–odd split A_even(x²) + x·A_odd(x²) needs.'],
      solution:
        'The split evaluates A_even and A_odd at the squares of the points. For the n-th roots of unity those squares are only n/2 distinct values, the n/2-th roots, so the recursion halves cleanly. Ordinary points like 0 … n − 1 have n distinct squares.',
    },
    {
      type: 'text',
      prompt:
        'Load “(1 + 2x)(3 + x)” and step to the end. What is C(x)? Write it like 1 + 2x + 3x^2.',
      accept: ['3 + 7x + 2x^2', '3+7x+2x²', '2x^2 + 7x + 3'],
      hints: ['Multiply out by hand to check: 1·3, then 1·x + 2x·3, then 2x·x.'],
      solution: '(1 + 2x)(3 + x) = 3 + x + 6x + 2x² = 3 + 7x + 2x².',
    },
    {
      type: 'multi',
      prompt: 'Which statements about ω₈ = e^(2πi/8) are true?',
      options: ['ω₈⁴ = −1', 'ω₈² = i', '(ω₈)² = ω₄', 'ω₈⁸ = 0'],
      answers: [0, 1, 2],
      hints: ['ω₈ turns by 45° each power. Look at the circle beside the diagram for n = 8.'],
      solution:
        'ω₈⁴ is half a turn, −1; ω₈² is a quarter turn, i; and squaring an 8th root gives a 4th root, so ω₈² = ω₄. ω₈⁸ is a full turn, 1, not 0.',
    },
  ],
  nextTeaser:
    'Next up: Matrix operations: LUP decomposition, which factors a matrix into triangles to solve linear systems.',
};
