import { describe, expect, it } from 'vitest';
import {
  LUCAS_PRESETS,
  MAX_CATALAN_N,
  MAX_LUCAS_N,
  MAX_PRIME,
  MAX_ROWS,
  bracketPseudocode,
  bracketTrace,
  binomial,
  catalan,
  factorialTables,
  heightsOf,
  isPrime,
  lucasPseudocode,
  lucasTrace,
  pascalPseudocode,
  pascalTrace,
  treeOfSequence,
} from './combinatorics.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** C(n, k) from factorials in exact arithmetic. @param {number} n @param {number} k */
function exact(n, k) {
  if (k > n) return 0n;
  /** @param {number} x */
  const fact = (x) => {
    let out = 1n;
    for (let i = 2n; i <= BigInt(x); i++) out *= i;
    return out;
  };
  return fact(n) / (fact(k) * fact(n - k));
}

/** @template T @param {T[]} frames @returns {T} */
const end = (frames) => /** @type {T} */ (frames.at(-1));

/** Every balanced sequence, by filtering all 2^(2n) strings. @param {number} n */
function balancedByBrute(n) {
  const out = [];
  for (let mask = 0; mask < 2 ** (2 * n); mask++) {
    let s = '';
    let depth = 0;
    let ok = true;
    for (let i = 2 * n - 1; i >= 0; i--) {
      const open = (mask >> i) % 2 === 0;
      s += open ? '(' : ')';
      depth += open ? 1 : -1;
      if (depth < 0) ok = false;
    }
    if (ok && depth === 0) out.push(s);
  }
  return out;
}

describe('binomial and Catalan helpers', () => {
  it('agree with exact factorials', () => {
    for (let n = 0; n <= 30; n++) {
      for (let k = 0; k <= n; k++) expect(BigInt(binomial(n, k))).toBe(exact(n, k));
    }
    expect(binomial(4, 5)).toBe(0);
    expect(binomial(4, -1)).toBe(0);
  });

  it('give the known Catalan numbers', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(catalan)).toEqual([1, 1, 2, 5, 14, 42, 132, 429]);
  });

  it('tell primes from composites', () => {
    expect([2, 3, 13, 1009].every(isPrime)).toBe(true);
    expect([0, 1, 4, 9, 1001, 2.5].some(isPrime)).toBe(false);
  });
});

describe('Pascal triangle trace', () => {
  it('fills every cell with the exact binomial', () => {
    const f = end(pascalTrace(MAX_ROWS));
    for (let n = 0; n <= MAX_ROWS; n++) {
      for (let k = 0; k <= n; k++)
        expect(BigInt(/** @type {number} */ (f.table[n][k]))).toBe(exact(n, k));
    }
  });

  it('counts one addition per inner cell', () => {
    expect(end(pascalTrace(0)).additions).toBe(0);
    expect(end(pascalTrace(1)).additions).toBe(0);
    expect(end(pascalTrace(4)).additions).toBe(6);
    expect(end(pascalTrace(MAX_ROWS)).additions).toBe((MAX_ROWS * (MAX_ROWS - 1)) / 2);
  });

  it('counts the filled cells and never reads an empty one', () => {
    const f = pascalTrace(5);
    expect(end(f).filled).toBe(21);
    for (const frame of f) {
      if (frame.kind !== 'add') continue;
      expect(frame.table[frame.n - 1][frame.k - 1]).not.toBeNull();
      expect(frame.table[frame.n - 1][frame.k]).not.toBeNull();
    }
  });

  it('makes each full row sum to a power of two', () => {
    const f = end(pascalTrace(10));
    f.table.forEach((row, n) => {
      expect(
        row.reduce((sum, v) => /** @type {number} */ (sum) + /** @type {number} */ (v), 0),
      ).toBe(2 ** n);
    });
  });
});

describe('Lucas trace', () => {
  it('agrees with exact binomials on random inputs', () => {
    const rand = seeded(7);
    const primes = [2, 3, 5, 7, 13, 97, 101, 1009];
    for (let round = 0; round < 300; round++) {
      const n = Math.floor(rand() * 400);
      const k = Math.floor(rand() * 420);
      const p = primes[Math.floor(rand() * primes.length)];
      expect(BigInt(end(lucasTrace(n, k, p)).result), `C(${n},${k}) mod ${p}`).toBe(
        exact(n, k) % BigInt(p),
      );
    }
  });

  it('builds factorial tables whose entries are true inverses', () => {
    for (const p of [2, 3, 13, 1009]) {
      const { fact, inv } = factorialTables(p);
      for (let i = 0; i < p; i++) expect((fact[i] * inv[i]) % p).toBe(1 % p);
    }
  });

  it('handles the edge cases', () => {
    expect(end(lucasTrace(0, 0, 2)).result).toBe(1);
    expect(end(lucasTrace(5, 0, 7)).result).toBe(1);
    expect(end(lucasTrace(5, 5, 7)).result).toBe(1);
    expect(end(lucasTrace(3, 5, 7)).result).toBe(0);
    expect(end(lucasTrace(6, 2, 3)).result).toBe(0);
    expect(end(lucasTrace(6, 2, 3)).rows).toHaveLength(1);
  });

  it('reads one row per base-p digit', () => {
    const f = end(lucasTrace(1000, 300, 13));
    expect(f.result).toBe(10);
    expect(f.rows).toEqual([
      { pos: 0, ni: 12, ki: 1, term: 12 },
      { pos: 1, ni: 11, ki: 10, term: 11 },
      { pos: 2, ni: 5, ki: 1, term: 5 },
    ]);
  });

  it('stays small at the caps', () => {
    expect(lucasTrace(MAX_LUCAS_N, MAX_LUCAS_N - 1, 2).length).toBeLessThan(400);
    expect(end(lucasTrace(MAX_LUCAS_N, 1, MAX_PRIME)).rows.length).toBeLessThanOrEqual(3);
    for (const { n, k, p } of Object.values(LUCAS_PRESETS)) {
      expect(isPrime(p)).toBe(true);
      expect(lucasTrace(n, k, p).at(-1)?.kind).toBe('done');
    }
  });
});

describe('bracket trace', () => {
  it('outputs exactly the balanced sequences, in order, and a Catalan number of them', () => {
    for (let n = 0; n <= MAX_CATALAN_N; n++) {
      const f = end(bracketTrace(n));
      expect(f.found).toEqual(balancedByBrute(n));
      expect(f.found.length).toBe(catalan(n));
      expect(f.found.length).toBe(binomial(2 * n, n) - binomial(2 * n, n + 1));
    }
  });

  it('keeps the path on or above the baseline at every step', () => {
    for (const f of bracketTrace(4)) {
      expect(Math.min(...heightsOf(f.prefix))).toBe(0);
      expect(f.close).toBeLessThanOrEqual(f.open);
      expect(f.open).toBeLessThanOrEqual(4);
    }
  });

  it('counts the calls', () => {
    expect(end(bracketTrace(0)).calls).toBe(1);
    expect(end(bracketTrace(1)).calls).toBe(3);
    expect(end(bracketTrace(2)).calls).toBe(8);
  });

  it('says how much is undone on the way back', () => {
    const f = bracketTrace(2);
    expect(f.map((x) => x.prefix)).toEqual([
      '',
      '(',
      '((',
      '(()',
      '(())',
      '(())',
      '()',
      '()(',
      '()()',
      '()()',
      '()()',
    ]);
    expect(f[6].dropped).toBe(3);
    expect(f[3].dropped).toBe(0);
  });

  it('maps every sequence to a different binary tree with n nodes', () => {
    /** @param {any} t @returns {string} */
    const shape = (t) => (t ? `(${shape(t.children[0])})${shape(t.children[1])}` : '');
    /** @param {any} t @returns {number} */
    const size = (t) => (t ? 1 + size(t.children[0]) + size(t.children[1]) : 0);
    for (let n = 0; n <= MAX_CATALAN_N; n++) {
      for (const seq of balancedByBrute(n)) {
        const tree = treeOfSequence(seq);
        expect(shape(tree)).toBe(seq);
        expect(size(tree)).toBe(n);
      }
    }
    expect(treeOfSequence('')).toBeNull();
  });

  it('stays under the frame cap', () => {
    expect(bracketTrace(MAX_CATALAN_N).length).toBeLessThan(400);
    expect(pascalTrace(MAX_ROWS).length).toBeLessThan(400);
  });
});

describe('frames', () => {
  it('start and end as the contract says', () => {
    for (const f of [pascalTrace(3), lucasTrace(10, 3, 13), bracketTrace(2)]) {
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
    }
  });

  it('do not alias each other', () => {
    const p = pascalTrace(3);
    const later = JSON.stringify(p[4]);
    p[3].table[0][0] = -1;
    expect(JSON.stringify(p[4])).toBe(later);

    const l = lucasTrace(1000, 300, 13);
    const laterL = JSON.stringify(l[4]);
    l[3].rows[0].ni = -1;
    expect(JSON.stringify(l[4])).toBe(laterL);

    const b = bracketTrace(2);
    const laterB = JSON.stringify(b[8]);
    b[7].found.push('x');
    expect(JSON.stringify(b[8])).toBe(laterB);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the Pascal code', () => {
    const seen = new Set(pascalTrace(3).flatMap((f) => f.lines));
    pascalPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it('highlights every line of the Lucas code', () => {
    const seen = new Set(
      [...lucasTrace(10, 3, 13), ...lucasTrace(6, 2, 3)].flatMap((f) => f.lines),
    );
    lucasPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it('highlights every line of the bracket code', () => {
    const seen = new Set(bracketTrace(2).flatMap((f) => f.lines));
    bracketPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
