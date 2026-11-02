import { describe, expect, it } from 'vitest';
import {
  BLOCK_MAX_N,
  MAX_BLOCK_OPS,
  MAX_QUERIES,
  MO_MAX_N,
  blocksPseudocode,
  blocksTrace,
  countMoves,
  defaultBlockSize,
  formatQueries,
  moOrder,
  moPseudocode,
  moTrace,
  parseQueries,
  parseValues,
  planQuery,
  worstReads,
} from './sqrt-decomposition.js';

/** @typedef {import('./sqrt-decomposition.js').BlockFrame} BlockFrame */
/** @typedef {import('./sqrt-decomposition.js').BlockOp} BlockOp */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} a @param {number} l @param {number} r */
function slowSum(a, l, r) {
  let total = 0;
  for (let i = l; i <= r; i++) total += a[i];
  return total;
}

/** @param {number[]} a @param {number} l @param {number} r */
const slowDistinct = (a, l, r) => new Set(a.slice(l, r + 1)).size;

/** @param {BlockFrame[]} frames @param {number} index */
const lastOf = (frames, index) =>
  /** @type {BlockFrame} */ (frames.filter((f) => f.opIndex === index).at(-1));

describe('block queries', () => {
  it('agree with a plain array for every block size', () => {
    const rand = seeded(17);
    for (const n of [1, 2, 7, 16, 25]) {
      const a = Array.from({ length: n }, () => Math.floor(rand() * 199) - 99);
      for (let s = 1; s <= n; s++) {
        for (let l = 0; l < n; l += 2) {
          for (let r = l; r < n; r += 3) {
            const frames = blocksTrace(a, s, [{ type: 'query', l, r }]);
            expect(lastOf(frames, 0).result).toBe(slowSum(a, l, r));
          }
        }
      }
    }
  });

  it('agree with a plain array over random updates', () => {
    const rand = seeded(41);
    for (let round = 0; round < 30; round++) {
      const n = 1 + Math.floor(rand() * BLOCK_MAX_N);
      const s = 1 + Math.floor(rand() * n);
      const start = Array.from({ length: n }, () => Math.floor(rand() * 199) - 99);
      const a = start.slice();
      /** @type {BlockOp[]} */
      const ops = [];
      /** @type {(number | null)[]} */
      const expected = [];
      for (let k = 0; k < MAX_BLOCK_OPS; k++) {
        const i = Math.floor(rand() * n);
        if (rand() < 0.4) {
          const x = Math.floor(rand() * 199) - 99;
          ops.push({ type: 'set', i, x });
          a[i] = x;
          expected.push(null);
        } else {
          const j = Math.floor(rand() * n);
          const l = Math.min(i, j);
          const r = Math.max(i, j);
          ops.push({ type: 'query', l, r });
          expected.push(slowSum(a, l, r));
        }
      }
      const frames = blocksTrace(start, s, ops);
      ops.forEach((_, index) => expect(lastOf(frames, index).result).toBe(expected[index]));
      const last = /** @type {BlockFrame} */ (frames.at(-1));
      expect(last.items).toEqual(a);
      last.sums.forEach((sum, b) => {
        expect(sum).toBe(slowSum(a, b * s, Math.min(n - 1, (b + 1) * s - 1)));
      });
    }
  });

  it('count the short last block as a whole block when it ends by r', () => {
    const plan = planQuery(10, 4, 8, 9);
    expect(plan.blocks).toEqual([2]);
    expect(plan.cells).toEqual([]);
  });

  it('read loose cells, then whole blocks, then loose cells', () => {
    const plan = planQuery(16, 4, 2, 13);
    expect(plan.cells).toEqual([2, 3, 12, 13]);
    expect(plan.blocks).toEqual([1, 2]);
  });
});

describe('block costs', () => {
  it('counts one read per cell or block sum', () => {
    const a = Array(16).fill(1);
    const frames = blocksTrace(a, 4, [{ type: 'query', l: 2, r: 13 }]);
    expect(lastOf(frames, 0).reads).toBe(6);
    expect(lastOf(frames, 0).scan).toBe(12);
  });

  it('finds the worst range for a block size', () => {
    expect(worstReads(16, 4)).toBe(8);
    expect(worstReads(16, 1)).toBe(16);
    expect(worstReads(16, 16)).toBe(15);
  });

  it('does best near the square root', () => {
    for (const n of [9, 16, 25]) {
      const root = defaultBlockSize(n);
      expect(worstReads(n, root)).toBeLessThan(worstReads(n, 1));
      expect(worstReads(n, root)).toBeLessThan(worstReads(n, n));
    }
  });

  it('stays within the bound of 2(s − 1) + ⌈n / s⌉', () => {
    for (const n of [5, 16, 25]) {
      for (let s = 1; s <= n; s++) {
        expect(worstReads(n, s)).toBeLessThanOrEqual(2 * (s - 1) + Math.ceil(n / s));
      }
    }
  });

  it('stays under the frame budget at the caps', () => {
    /** @type {BlockOp[]} */
    const ops = Array(MAX_BLOCK_OPS).fill({ type: 'query', l: 0, r: BLOCK_MAX_N - 2 });
    expect(blocksTrace(Array(BLOCK_MAX_N).fill(1), BLOCK_MAX_N, ops).length).toBeLessThan(400);
  });
});

describe('block frames', () => {
  it('starts and ends with the agreed kinds', () => {
    const frames = blocksTrace([1, 2], 1, []);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('does not alias the input or other frames', () => {
    const input = [1, 2, 3, 4];
    const frames = blocksTrace(input, 2, [{ type: 'query', l: 0, r: 2 }]);
    const before = JSON.stringify(frames.at(-1));
    const earlier = /** @type {BlockFrame} */ (frames.at(-2));
    earlier.items[0] = 99;
    earlier.sums[0] = 99;
    earlier.readCells.push(99);
    earlier.readBlocks.push(99);
    expect(JSON.stringify(frames.at(-1))).toBe(before);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

describe("Mo's algorithm", () => {
  it('answers like a linear count over random queries, in the typed slots', () => {
    const rand = seeded(53);
    for (let round = 0; round < 60; round++) {
      const n = 1 + Math.floor(rand() * MO_MAX_N);
      const a = Array.from({ length: n }, () => Math.floor(rand() * 6));
      const q = 1 + Math.floor(rand() * MAX_QUERIES);
      const queries = Array.from({ length: q }, () => {
        const i = Math.floor(rand() * n);
        const j = Math.floor(rand() * n);
        return { l: Math.min(i, j), r: Math.max(i, j) };
      });
      const last = moTrace(a, queries).at(-1);
      expect(last?.answers).toEqual(queries.map(({ l, r }) => slowDistinct(a, l, r)));
    }
  });

  it('sorts by the block of l, then by r', () => {
    const queries = [
      { l: 9, r: 10 },
      { l: 1, r: 7 },
      { l: 2, r: 3 },
      { l: 5, r: 6 },
    ];
    expect(moOrder(queries, 4)).toEqual([2, 1, 3, 0]);
  });

  it('keeps counts that match the window on every frame', () => {
    const a = [3, 1, 3, 2, 1, 3, 3, 2];
    const frames = moTrace(a, [
      { l: 5, r: 7 },
      { l: 0, r: 3 },
      { l: 2, r: 6 },
    ]);
    for (const f of frames) {
      /** @type {Map<number, number>} */
      const counted = new Map();
      for (let i = f.curL; i <= f.curR; i++) counted.set(a[i], (counted.get(a[i]) ?? 0) + 1);
      expect(f.counts).toEqual([...counted.entries()].sort((x, y) => x[0] - y[0]));
      expect(f.distinct).toBe(counted.size);
    }
  });

  it('counts each add and remove once, and the total matches the plan', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const queries = [
      { l: 0, r: 2 },
      { l: 1, r: 3 },
    ];
    const last = moTrace(a, queries).at(-1);
    // Grow to [0, 2] in 3 moves, then to [1, 3] by adding 3 and removing 0.
    expect(last?.moves).toBe(5);
    expect(last?.sortedMoves).toBe(5);
  });

  it('moves far less than the typed order on queries that jump around', () => {
    const a = Array.from({ length: 16 }, (_, i) => i);
    const queries = [
      { l: 0, r: 3 },
      { l: 12, r: 15 },
      { l: 1, r: 4 },
      { l: 13, r: 14 },
      { l: 2, r: 5 },
      { l: 11, r: 15 },
    ];
    const last = moTrace(a, queries).at(-1);
    expect(last?.inputMoves).toBeGreaterThan(2 * (last?.sortedMoves ?? 0));
  });

  it('computes moves between windows', () => {
    expect(countMoves([{ l: 2, r: 3 }], [0])).toBe(2 + 4);
  });

  it('handles one cell and one query', () => {
    const last = moTrace([5], [{ l: 0, r: 0 }]).at(-1);
    expect(last?.answers).toEqual([1]);
  });

  it('stays under the frame budget at the caps', () => {
    const a = Array.from({ length: MO_MAX_N }, (_, i) => i);
    const queries = Array.from({ length: MAX_QUERIES }, (_, k) =>
      k % 2 ? { l: 0, r: 1 } : { l: MO_MAX_N - 2, r: MO_MAX_N - 1 },
    );
    expect(moTrace(a, queries).length).toBeLessThan(400);
  });

  it('starts and ends with the agreed kinds, and does not alias', () => {
    const input = [1, 1, 2];
    const frames = moTrace(input, [{ l: 0, r: 2 }]);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    const before = JSON.stringify(frames.at(-1));
    const earlier = frames[frames.length - 2];
    earlier.items[0] = 99;
    earlier.order.push(99);
    earlier.answers[0] = 99;
    earlier.counts.push([99, 99]);
    earlier.queries[0].l = 99;
    expect(JSON.stringify(frames.at(-1))).toBe(before);
    expect(input).toEqual([1, 1, 2]);
  });
});

describe('parsing', () => {
  it('reads values and names each kind of refusal', () => {
    expect(parseValues('3, −1 4', 25)).toEqual({ values: [3, -1, 4] });
    expect(parseValues('', 25)).toEqual({ error: 'format' });
    expect(parseValues('2.5', 25)).toEqual({ error: 'format' });
    expect(parseValues('100', 25)).toEqual({ error: 'range' });
    expect(parseValues('1 2 3', 2)).toEqual({ error: 'count' });
  });

  it('reads queries and names each kind of refusal', () => {
    expect(parseQueries('0 3, 1 2', 4)).toEqual({
      queries: [
        { l: 0, r: 3 },
        { l: 1, r: 2 },
      ],
    });
    expect(parseQueries('', 4)).toEqual({ error: 'format' });
    expect(parseQueries('1', 4)).toEqual({ error: 'format' });
    expect(parseQueries('3 1', 4)).toEqual({ error: 'range' });
    expect(parseQueries('0 4', 4)).toEqual({ error: 'range' });
    expect(parseQueries(Array(7).fill('0 1').join(','), 4)).toEqual({ error: 'count' });
  });

  it('writes queries back', () => {
    expect(formatQueries([{ l: 0, r: 3 }])).toBe('0 3');
  });

  it('picks the floor of the square root, at least 1', () => {
    expect([1, 3, 4, 16, 17, 25].map(defaultBlockSize)).toEqual([1, 1, 2, 4, 4, 5]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every block line in some frame', () => {
    const frames = blocksTrace([1, 2, 3, 4, 5, 6], 2, [
      { type: 'query', l: 1, r: 4 },
      { type: 'set', i: 0, x: 9 },
    ]);
    const seen = new Set(frames.flatMap((f) => f.lines));
    blocksPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it("highlights every line of Mo's algorithm in some frame", () => {
    const frames = moTrace(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [
        { l: 0, r: 8 },
        { l: 4, r: 5 },
        { l: 3, r: 7 },
      ],
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    moPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
