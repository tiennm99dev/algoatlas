import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  MAX_OPS,
  blockStart,
  fenwickPseudocode,
  fenwickTrace,
  lowbit,
  parseFenwickValues,
} from './fenwick-tree.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./fenwick-tree.js').FenwickFrame | undefined} f */
const must = (f) => /** @type {import('./fenwick-tree.js').FenwickFrame} */ (f);

/** The sum a[from..to] of a 1-based array, by reading every element. @param {number[]} a @param {number} from @param {number} to */
function slowSum(a, from, to) {
  let total = 0;
  for (let i = from; i <= to; i++) total += a[i];
  return total;
}

describe('lowbit', () => {
  it('finds the lowest set bit', () => {
    expect([1, 2, 3, 4, 6, 8, 12].map(lowbit)).toEqual([1, 2, 1, 4, 2, 8, 4]);
  });

  it('gives each cell the block it covers', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(blockStart)).toEqual([1, 1, 3, 1, 5, 5, 7, 1]);
  });
});

describe('Fenwick tree correctness', () => {
  it('stores the sum of its block in every cell after the build', () => {
    const rand = seeded(5);
    for (const n of [1, 2, 3, 7, 8, 13, 16]) {
      const values = Array.from({ length: n }, () => Math.floor(rand() * 199) - 99);
      const last = must(fenwickTrace(values, []).at(-1));
      for (let i = 1; i <= n; i++) {
        expect(last.t[i]).toBe(slowSum(last.a, blockStart(i), i));
      }
    }
  });

  it('agrees with a plain array over random operations', () => {
    const rand = seeded(23);
    for (let round = 0; round < 40; round++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const a = [0, ...Array.from({ length: n }, () => Math.floor(rand() * 199) - 99)];
      /** @type {import('./fenwick-tree.js').FenwickOp[]} */
      const ops = [];
      /** @type {number[]} */
      const answers = [];
      for (let k = 0; k < MAX_OPS; k++) {
        const pick = rand();
        const i = 1 + Math.floor(rand() * n);
        if (pick < 0.4) {
          const delta = Math.floor(rand() * 199) - 99;
          ops.push({ type: 'add', i, delta });
          a[i] += delta;
        } else if (pick < 0.7) {
          ops.push({ type: 'prefix', i });
          answers.push(slowSum(a, 1, i));
        } else {
          const j = 1 + Math.floor(rand() * n);
          const l = Math.min(i, j);
          const r = Math.max(i, j);
          ops.push({ type: 'range', l, r });
          answers.push(slowSum(a, l, r));
        }
      }
      const values = a.slice(1);
      // Undo the updates to recover the input the operations start from.
      for (const op of ops) if (op.type === 'add') values[op.i - 1] -= op.delta;
      const run = fenwickTrace(values, ops);
      const got = ops.flatMap((op, index) => {
        if (op.type === 'add') return [];
        const lastOfOp = run.filter((f) => f.opIndex === index).at(-1);
        return [lastOfOp?.result];
      });
      expect(got).toEqual(answers);
      const last = must(run.at(-1));
      expect(last.a).toEqual(a);
      for (let i = 1; i <= n; i++) expect(last.t[i]).toBe(slowSum(last.a, blockStart(i), i));
    }
  });

  it('handles a single element', () => {
    const frames = fenwickTrace([7], [{ type: 'prefix', i: 1 }]);
    expect(frames.filter((f) => f.opIndex === 0).at(-1)?.result).toBe(7);
  });

  it('answers a range that starts at 1, where prefix(0) is empty', () => {
    const frames = fenwickTrace([1, 2, 3], [{ type: 'range', l: 1, r: 3 }]);
    expect(frames.filter((f) => f.opIndex === 0).at(-1)?.result).toBe(6);
  });
});

describe('Fenwick tree costs', () => {
  const values = [3, 1, 4, 1, 5, 9, 2, 6];

  it('reads one cell per set bit of the index', () => {
    const at = (/** @type {number} */ i) =>
      fenwickTrace(values, [{ type: 'prefix', i }])
        .filter((f) => f.opIndex === 0)
        .at(-1)?.reads;
    expect(at(7)).toBe(3);
    expect(at(8)).toBe(1);
    expect(at(5)).toBe(2);
  });

  it('writes the expected cells on an update', () => {
    const frames = fenwickTrace(values, [{ type: 'add', i: 3, delta: 2 }]);
    expect(frames.filter((f) => f.opIndex === 0).at(-1)?.visited).toEqual([3, 4, 8]);
    expect(frames.filter((f) => f.opIndex === 0).at(-1)?.writes).toBe(3);
  });

  it('walks the expected cells for a prefix', () => {
    const frames = fenwickTrace(values, [{ type: 'prefix', i: 7 }]);
    expect(frames.filter((f) => f.opIndex === 0).at(-1)?.visited).toEqual([7, 6, 4]);
  });

  it('builds with one addition per cell plus one push per cell that has a parent', () => {
    expect(fenwickTrace(values, []).at(-1)?.buildSteps).toBe(8 + 7);
    expect(fenwickTrace([1, 2, 3], []).at(-1)?.buildSteps).toBe(3 + 1);
  });

  it('keeps the trace under the frame budget at the caps', () => {
    const big = Array(MAX_N).fill(1);
    /** @type {import('./fenwick-tree.js').FenwickOp[]} */
    const ops = Array(MAX_OPS).fill({ type: 'range', l: 8, r: 15 });
    expect(fenwickTrace(big, ops).length).toBeLessThan(250);
  });
});

describe('Fenwick tree frames', () => {
  it('starts and ends with the agreed kinds', () => {
    const frames = fenwickTrace([1, 2], []);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('does not alias the input or other frames', () => {
    const input = [1, 2, 3, 4];
    const frames = fenwickTrace(input, [{ type: 'prefix', i: 3 }]);
    const before = JSON.stringify(frames[3]);
    frames[2].t[1] = 99;
    frames[2].a[1] = 99;
    frames[2].visited.push(99);
    expect(JSON.stringify(frames[3])).toBe(before);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('draws each jump with its true end', () => {
    const frames = fenwickTrace([1, 2, 3, 4, 5], [{ type: 'add', i: 3, delta: 1 }]);
    const jumps = frames.filter((f) => f.kind === 'add-jump').map((f) => [f.from, f.to]);
    expect(jumps).toEqual([
      [3, 4],
      [4, 8],
    ]);
  });
});

describe('parseFenwickValues', () => {
  it('reads values and names each kind of refusal', () => {
    expect(parseFenwickValues('3, −1 4')).toEqual({ values: [3, -1, 4] });
    expect(parseFenwickValues('')).toEqual({ error: 'format' });
    expect(parseFenwickValues('1.5')).toEqual({ error: 'format' });
    expect(parseFenwickValues('100')).toEqual({ error: 'range' });
    expect(parseFenwickValues(Array(17).fill(1).join(','))).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const frames = fenwickTrace(
      [1, 2, 3, 4],
      [
        { type: 'add', i: 1, delta: 1 },
        { type: 'range', l: 2, r: 3 },
      ],
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    fenwickPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
