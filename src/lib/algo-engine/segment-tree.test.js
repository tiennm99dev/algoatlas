import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  MAX_OPS,
  SEG_MERGES,
  canonicalCover,
  foldRange,
  parseSegmentValues,
  segmentPseudocode,
  segmentTrace,
  treeSpans,
} from './segment-tree.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./segment-tree.js').SegFrame[]} frames @param {number} index */
const lastOf = (frames, index) =>
  /** @type {import('./segment-tree.js').SegFrame} */ (
    frames.filter((f) => f.opIndex === index).at(-1)
  );

describe('segment tree correctness', () => {
  it.each(SEG_MERGES)('answers every range like a linear scan with %s', (merge) => {
    const rand = seeded(13);
    for (const n of [1, 2, 3, 5, 8, 12]) {
      const a = Array.from({ length: n }, () => Math.floor(rand() * 199) - 99);
      for (let l = 0; l < n; l++) {
        for (let r = l; r < n; r++) {
          const frames = segmentTrace(a, [{ type: 'query', l, r }], merge);
          expect(lastOf(frames, 0).result).toBe(foldRange(a, l, r, merge));
        }
      }
    }
  });

  it.each(SEG_MERGES)('agrees with a plain array over random operations with %s', (merge) => {
    const rand = seeded(29);
    for (let round = 0; round < 30; round++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const start = Array.from({ length: n }, () => Math.floor(rand() * 199) - 99);
      const a = start.slice();
      /** @type {import('./segment-tree.js').SegOp[]} */
      const ops = [];
      /** @type {(number | null)[]} */
      const expected = [];
      for (let k = 0; k < MAX_OPS; k++) {
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
          expected.push(foldRange(a, l, r, merge));
        }
      }
      const frames = segmentTrace(start, ops, merge);
      ops.forEach((_, index) => expect(lastOf(frames, index).result).toBe(expected[index]));
      const last = /** @type {import('./segment-tree.js').SegFrame} */ (frames.at(-1));
      expect(last.items).toEqual(a);
      for (const { v, lo, hi } of last.spans) {
        expect(last.tree[v]).toBe(foldRange(a, lo, hi, merge));
      }
    }
  });

  it('handles one element', () => {
    const frames = segmentTrace(
      [7],
      [
        { type: 'query', l: 0, r: 0 },
        { type: 'set', i: 0, x: 9 },
        { type: 'query', l: 0, r: 0 },
      ],
      'min',
    );
    expect(lastOf(frames, 0).result).toBe(7);
    expect(lastOf(frames, 2).result).toBe(9);
  });

  it('handles duplicates', () => {
    const frames = segmentTrace([4, 4, 4, 4], [{ type: 'query', l: 1, r: 2 }], 'max');
    expect(lastOf(frames, 0).result).toBe(4);
  });
});

describe('canonical cover', () => {
  it('splits the range into disjoint nodes that fill it exactly', () => {
    for (const n of [1, 2, 5, 8, 12]) {
      for (let l = 0; l < n; l++) {
        for (let r = l; r < n; r++) {
          const cover = canonicalCover(n, l, r);
          let next = l;
          for (const span of cover) {
            expect(span.lo).toBe(next);
            next = span.hi + 1;
          }
          expect(next).toBe(r + 1);
        }
      }
    }
  });

  it('uses at most two nodes per level', () => {
    for (const n of [8, 12]) {
      for (let l = 0; l < n; l++) {
        for (let r = l; r < n; r++) {
          /** @type {Map<number, number>} */
          const perLevel = new Map();
          for (const { v } of canonicalCover(n, l, r)) {
            const depth = 31 - Math.clz32(v);
            perLevel.set(depth, (perLevel.get(depth) ?? 0) + 1);
          }
          for (const count of perLevel.values()) expect(count).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('is what the query records as covered', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const frames = segmentTrace(a, [{ type: 'query', l: 2, r: 6 }], 'sum');
    expect(lastOf(frames, 0).covered).toEqual(canonicalCover(8, 2, 6).map((s) => s.v));
  });
});

describe('segment tree costs', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8];

  it('has 2n − 1 nodes and n − 1 build merges', () => {
    for (const n of [1, 2, 5, 8, 12]) {
      expect(treeSpans(n)).toHaveLength(2 * n - 1);
      const last = segmentTrace(Array(n).fill(1), [], 'sum').at(-1);
      expect(last?.buildMerges).toBe(n - 1);
    }
  });

  it('visits only the root for the whole range', () => {
    const frames = segmentTrace(a, [{ type: 'query', l: 0, r: 7 }], 'sum');
    expect(lastOf(frames, 0).visits).toBe(1);
    expect(lastOf(frames, 0).covered).toEqual([1]);
  });

  it('walks one root-to-leaf path on a point update', () => {
    const frames = segmentTrace(a, [{ type: 'set', i: 5, x: 0 }], 'sum');
    expect(lastOf(frames, 0).visits).toBe(4);
    expect(lastOf(frames, 0).merges).toBe(3);
  });

  it('merges once per split node on a query', () => {
    const frames = segmentTrace(a, [{ type: 'query', l: 1, r: 6 }], 'sum');
    const last = lastOf(frames, 0);
    expect(last.merges).toBe(last.split.length);
    expect(last.visits).toBe(last.split.length + last.covered.length + last.outside.length);
  });

  it('visits at most about 4 log n nodes, and stays under the frame budget', () => {
    /** @type {import('./segment-tree.js').SegOp[]} */
    const ops = Array(MAX_OPS).fill({ type: 'query', l: 1, r: MAX_N - 2 });
    const frames = segmentTrace(Array(MAX_N).fill(1), ops, 'sum');
    expect(lastOf(frames, 0).visits).toBeLessThanOrEqual(4 * Math.ceil(Math.log2(MAX_N)));
    expect(frames.length).toBeLessThan(400);
  });
});

describe('segment tree frames', () => {
  it('starts and ends with the agreed kinds', () => {
    const frames = segmentTrace([1, 2], [], 'sum');
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('does not alias the input or other frames', () => {
    const input = [1, 2, 3, 4];
    const frames = segmentTrace(input, [{ type: 'query', l: 1, r: 2 }], 'sum');
    const before = JSON.stringify(frames.at(-2));
    const earlier = /** @type {import('./segment-tree.js').SegFrame} */ (frames.at(-3));
    earlier.items[0] = 99;
    earlier.tree[1] = 99;
    earlier.covered.push(99);
    earlier.spans[0].lo = 99;
    expect(JSON.stringify(frames.at(-2))).toBe(before);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

describe('parseSegmentValues', () => {
  it('reads values and names each kind of refusal', () => {
    expect(parseSegmentValues('3, −1 4')).toEqual({ values: [3, -1, 4] });
    expect(parseSegmentValues('')).toEqual({ error: 'format' });
    expect(parseSegmentValues('x')).toEqual({ error: 'format' });
    expect(parseSegmentValues('100')).toEqual({ error: 'range' });
    expect(parseSegmentValues(Array(13).fill(1).join(' '))).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const frames = segmentTrace(
      [1, 2, 3, 4],
      [
        { type: 'query', l: 1, r: 2 },
        { type: 'set', i: 0, x: 9 },
      ],
      'sum',
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    segmentPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
