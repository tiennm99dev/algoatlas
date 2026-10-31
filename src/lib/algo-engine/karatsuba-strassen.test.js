import { describe, expect, it } from 'vitest';
import {
  MAX_DIGITS,
  digitProducts,
  fourPseudocode,
  multiplyTrace,
  naiveProduct,
  parseFactor,
  parseMatrix,
  strassenPseudocode,
  strassenTrace,
  threePseudocode,
} from './karatsuba-strassen.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} x @param {number} y @param {'four'|'three'} method */
const finish = (x, y, method) =>
  /** @type {import('./karatsuba-strassen.js').MulFrame} */ (multiplyTrace(x, y, method).at(-1));

describe.each(/** @type {const} */ (['four', 'three']))('%s-product multiplication', (method) => {
  it('multiplies correctly on edge cases', () => {
    for (const [x, y] of [
      [0, 0],
      [7, 8],
      [10, 10],
      [99, 99],
      [100000, 1],
      [999999, 999999],
      [1213, 3141],
      [5, 123456],
    ]) {
      expect(finish(x, y, method).nodes[0].result).toBe(x * y);
    }
  });

  it('multiplies random factors of every length', () => {
    const rand = seeded(21);
    for (let t = 0; t < 200; t++) {
      const x = Math.floor(rand() * 10 ** (1 + (t % MAX_DIGITS)));
      const y = Math.floor(rand() * 10 ** (1 + ((t * 7) % MAX_DIGITS)));
      const done = finish(x, y, method);
      expect(done.nodes[0].result).toBe(x * y);
      // Every leaf is one digit times one digit, and every inner call is exact too.
      for (const node of done.nodes) {
        expect(node.result).toBe(node.x * node.y);
        if (node.children.length === 0) expect(node.x < 10 && node.y < 10).toBe(true);
      }
      expect(done.products).toBe(done.nodes.filter((n) => n.children.length === 0).length);
    }
  });

  it('gives each split call the right number of children', () => {
    const done = finish(1234, 5678, method);
    const branching = method === 'four' ? 4 : 3;
    for (const node of done.nodes) {
      expect([0, branching]).toContain(node.children.length);
    }
  });

  it('keeps traces small at the digit cap', () => {
    expect(multiplyTrace(999999, 999999, method).length).toBeLessThan(150);
  });

  it('keeps frames independent of each other', () => {
    const frames = multiplyTrace(1213, 3141, method);
    const split = frames.findIndex((f) => f.kind === 'split');
    frames[split].nodes[0].x = -1;
    frames[split].nodes[0].children.push(99);
    /** @type {NonNullable<import('./karatsuba-strassen.js').CallNode['parts']>} */ (
      frames[split].nodes[0].parts
    ).x1 = -1;
    expect(frames[split + 1].nodes[0].x).toBe(1213);
    expect(frames[split + 1].nodes[0].children).not.toContain(99);
    expect(frames[split + 1].nodes[0].parts?.x1).toBe(12);
  });
});

describe('product counts', () => {
  it('uses n² one-digit products with four products per split', () => {
    expect(finish(1234, 5678, 'four').products).toBe(16);
    expect(finish(12, 34, 'four').products).toBe(4);
  });

  it('uses 3^(log₂ n) products with three when no sum carries', () => {
    expect(finish(1213, 3141, 'three').products).toBe(9);
    expect(finish(12, 34, 'three').products).toBe(3);
  });

  it('needs extra products when x₁ + x₀ carries into another digit', () => {
    // 1234 × 5678: 46 × 134 has a three-digit factor, so its subtree goes one level deeper.
    expect(finish(1234, 5678, 'three').products).toBe(17);
  });

  it('wins on larger factors even with carries', () => {
    expect(finish(999999, 999999, 'three').products).toBeLessThan(
      finish(999999, 999999, 'four').products,
    );
  });

  it('tabulates n² against n^(log₂ 3)', () => {
    expect(digitProducts(1)).toEqual({ four: 1, three: 1 });
    expect(digitProducts(8)).toEqual({ four: 64, three: 27 });
    expect(digitProducts(1024)).toEqual({ four: 1048576, three: 59049 });
  });

  it('counts additions: three per four-product split, six per Karatsuba split', () => {
    expect(finish(12, 34, 'four').adds).toBe(3);
    expect(finish(12, 34, 'three').adds).toBe(6);
  });
});

describe('Strassen', () => {
  it('matches the definition on random matrices', () => {
    const rand = seeded(4);
    const r = () => Math.floor(rand() * 19) - 9;
    for (let t = 0; t < 200; t++) {
      /** @type {import('./karatsuba-strassen.js').Matrix2} */
      const A = [
        [r(), r()],
        [r(), r()],
      ];
      /** @type {import('./karatsuba-strassen.js').Matrix2} */
      const B = [
        [r(), r()],
        [r(), r()],
      ];
      expect(strassenTrace(A, B).at(-1)?.C).toEqual(naiveProduct(A, B));
    }
  });

  it('uses 7 multiplications and 18 additions', () => {
    const done = strassenTrace(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    ).at(-1);
    expect(done?.C).toEqual([
      [19, 22],
      [43, 50],
    ]);
    expect(done?.M).toEqual([65, 35, -2, 8, 24, 22, -30]);
    expect(done?.multiplications).toBe(7);
    expect(done?.additions).toBe(18);
  });

  it('fills the products before the entries, one frame each', () => {
    const frames = strassenTrace(
      [
        [1, 0],
        [0, 1],
      ],
      [
        [2, 3],
        [4, 5],
      ],
    );
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      ...Array(7).fill('product'),
      ...Array(4).fill('entry'),
      'done',
    ]);
    expect(frames[1].factors).toEqual([2, 7]);
    frames[3].M[0] = -1;
    frames[3].C[0][0] = -1;
    expect(frames[4].M[0]).toBe(14);
    expect(frames[4].C[0][0]).toBeNull();
  });
});

describe('parsing', () => {
  it('reads factors of up to six digits', () => {
    expect(parseFactor(' 1234 ')).toEqual({ value: 1234 });
    expect(parseFactor('12a')).toEqual({ error: 'format' });
    expect(parseFactor('-3')).toEqual({ error: 'format' });
    expect(parseFactor('1234567')).toEqual({ error: 'size' });
  });

  it('reads 2×2 matrices row by row', () => {
    expect(parseMatrix('1 2; 3 -4')).toEqual({
      matrix: [
        [1, 2],
        [3, -4],
      ],
    });
    expect(parseMatrix('1 2 3')).toEqual({ error: 'format' });
    expect(parseMatrix('1 2 3 x')).toEqual({ error: 'format' });
    expect(parseMatrix('1 2 3 10')).toEqual({ error: 'range' });
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['four', fourPseudocode],
    ['three', threePseudocode],
  ])('%s highlights every line', (method, code) => {
    const frames = multiplyTrace(1234, 5678, /** @type {'four'|'three'} */ (method));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });

  it('Strassen highlights every line', () => {
    const frames = strassenTrace(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(strassenPseudocode.map((_, i) => i));
  });
});
