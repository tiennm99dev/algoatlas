import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  MAX_OPS,
  eagerWrites,
  lazyPseudocode,
  lazySpans,
  lazyTrace,
  parseLazyValues,
} from './lazy-propagation.js';

/** @typedef {import('./lazy-propagation.js').LazyFrame} LazyFrame */
/** @typedef {import('./lazy-propagation.js').LazyOp} LazyOp */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {LazyFrame[]} frames @param {number} index */
const lastOf = (frames, index) =>
  /** @type {LazyFrame} */ (frames.filter((f) => f.opIndex === index).at(-1));

/** @param {number[]} a @param {number} l @param {number} r */
function slowSum(a, l, r) {
  let total = 0;
  for (let i = l; i <= r; i++) total += a[i];
  return total;
}

/**
 * The invariant at the end of an operation: a node's sum plus every tag waiting above it,
 * times its length, is the true sum of its range. Leaves never hold a tag.
 * @param {LazyFrame} f
 */
function expectConsistent(f) {
  /** @param {number} v @param {number} above */
  const walk = (v, above) => {
    const span = /** @type {import('./lazy-propagation.js').LazySpan} */ (
      f.spans.find((s) => s.v === v)
    );
    const len = span.hi - span.lo + 1;
    expect(f.sum[v]).toBe(slowSum(f.items, span.lo, span.hi) - above * len);
    if (span.lo === span.hi) {
      expect(f.tag[v]).toBe(0);
      return;
    }
    walk(2 * v, above + f.tag[v]);
    walk(2 * v + 1, above + f.tag[v]);
  };
  walk(1, 0);
}

describe('lazy propagation correctness', () => {
  it('agrees with a plain array over random operations', () => {
    const rand = seeded(31);
    for (let round = 0; round < 60; round++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const start = Array.from({ length: n }, () => Math.floor(rand() * 199) - 99);
      const a = start.slice();
      /** @type {LazyOp[]} */
      const ops = [];
      /** @type {(number | null)[]} */
      const expected = [];
      for (let k = 0; k < MAX_OPS; k++) {
        const i = Math.floor(rand() * n);
        const j = Math.floor(rand() * n);
        const l = Math.min(i, j);
        const r = Math.max(i, j);
        if (rand() < 0.5) {
          const x = Math.floor(rand() * 199) - 99;
          ops.push({ type: 'add', l, r, x });
          for (let q = l; q <= r; q++) a[q] += x;
          expected.push(null);
        } else {
          ops.push({ type: 'query', l, r });
          expected.push(slowSum(a, l, r));
        }
      }
      const frames = lazyTrace(start, ops);
      ops.forEach((_, index) => {
        const last = lastOf(frames, index);
        expect(last.result).toBe(expected[index]);
        expectConsistent(last);
      });
      expect(frames.at(-1)?.items).toEqual(a);
    }
  });

  it('handles one element', () => {
    const frames = lazyTrace(
      [7],
      [
        { type: 'add', l: 0, r: 0, x: 3 },
        { type: 'query', l: 0, r: 0 },
      ],
    );
    expect(lastOf(frames, 1).result).toBe(10);
    expect(frames.at(-1)?.tag[1]).toBe(0);
  });

  it('removes a tag when additions cancel', () => {
    const frames = lazyTrace(
      [1, 2],
      [
        { type: 'add', l: 0, r: 1, x: 5 },
        { type: 'add', l: 0, r: 1, x: -5 },
      ],
    );
    expect(frames.at(-1)?.tag[1]).toBe(0);
    expect(frames.at(-1)?.sum[1]).toBe(3);
  });
});

describe('lazy behaviour', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8];

  it('writes only the root when the update covers the whole array', () => {
    const frames = lazyTrace(a, [{ type: 'add', l: 0, r: 7, x: 5 }]);
    const last = lastOf(frames, 0);
    expect(last.visits).toBe(1);
    expect(last.writes).toBe(1);
    expect(last.tag[1]).toBe(5);
    expect(last.sum[1]).toBe(76);
    expect(last.eager).toBe(15);
  });

  it('leaves the leaves behind the true array until a push reaches them', () => {
    const frames = lazyTrace(a, [
      { type: 'add', l: 0, r: 7, x: 5 },
      { type: 'query', l: 5, r: 5 },
    ]);
    expect(lastOf(frames, 0).leaves).toEqual(a);
    expect(lastOf(frames, 0).items).toEqual(a.map((v) => v + 5));
    const after = lastOf(frames, 1);
    expect(after.result).toBe(11);
    expect(after.leaves[5]).toBe(11);
    expect(after.leaves[0]).toBe(1);
  });

  it('does not push for a query answered by a node that holds the tag', () => {
    const frames = lazyTrace(a, [
      { type: 'add', l: 0, r: 7, x: 5 },
      { type: 'query', l: 0, r: 7 },
    ]);
    expect(lastOf(frames, 1).pushes).toBe(0);
    expect(lastOf(frames, 1).result).toBe(76);
    expect(lastOf(frames, 1).tag[1]).toBe(5);
  });

  it('pushes along the path a query needs, and no further', () => {
    const frames = lazyTrace(a, [
      { type: 'add', l: 0, r: 7, x: 5 },
      { type: 'add', l: 4, r: 7, x: 2 },
      { type: 'query', l: 5, r: 5 },
    ]);
    const second = lastOf(frames, 1);
    expect(second.pushes).toBe(1);
    expect(second.tag[3]).toBe(7);
    expect(second.tag[2]).toBe(5);
    expect(second.sum[3]).toBe(54);
    const third = lastOf(frames, 2);
    expect(third.pushes).toBe(2);
    expect(third.result).toBe(13);
    // The left half keeps its tag: this query never went there.
    expect(third.tag[2]).toBe(5);
  });

  it('skips the push frame when no tag waits', () => {
    const frames = lazyTrace(a, [{ type: 'query', l: 2, r: 5 }]);
    expect(frames.filter((f) => f.kind === 'push')).toHaveLength(0);
  });

  it('counts the nodes an update without tags would change', () => {
    expect(eagerWrites(8, 0, 7)).toBe(15);
    expect(eagerWrites(8, 5, 5)).toBe(4);
    expect(lazySpans(8)).toHaveLength(15);
  });

  it('stays under the frame budget at the caps', () => {
    /** @type {LazyOp[]} */
    const ops = Array.from({ length: MAX_OPS }, (_, k) => ({
      type: 'add',
      l: 1,
      r: MAX_N - 2,
      x: k + 1,
    }));
    expect(lazyTrace(Array(MAX_N).fill(1), ops).length).toBeLessThan(400);
  });
});

describe('lazy frames', () => {
  it('starts and ends with the agreed kinds', () => {
    const frames = lazyTrace([1, 2], []);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('does not alias the input or other frames', () => {
    const input = [1, 2, 3, 4];
    const frames = lazyTrace(input, [{ type: 'add', l: 0, r: 3, x: 1 }]);
    const before = JSON.stringify(frames.at(-1));
    const earlier = /** @type {LazyFrame} */ (frames.at(-2));
    earlier.items[0] = 99;
    earlier.sum[1] = 99;
    earlier.tag[1] = 99;
    earlier.leaves[0] = 99;
    earlier.covered.push(99);
    earlier.spans[0].lo = 99;
    expect(JSON.stringify(frames.at(-1))).toBe(before);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

describe('parseLazyValues', () => {
  it('reads values and names each kind of refusal', () => {
    expect(parseLazyValues('3, −1 4')).toEqual({ values: [3, -1, 4] });
    expect(parseLazyValues(' ')).toEqual({ error: 'format' });
    expect(parseLazyValues('a')).toEqual({ error: 'format' });
    expect(parseLazyValues('-100')).toEqual({ error: 'range' });
    expect(parseLazyValues(Array(13).fill(1).join(' '))).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const frames = lazyTrace(
      [1, 2, 3, 4],
      [
        { type: 'add', l: 0, r: 3, x: 1 },
        { type: 'add', l: 1, r: 2, x: 1 },
        { type: 'query', l: 1, r: 2 },
      ],
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    lazyPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
