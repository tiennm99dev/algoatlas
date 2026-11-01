import { describe, expect, it } from 'vitest';
import {
  MAX_INTERVALS,
  MAX_KEYS,
  MAX_OPS,
  inorderSlots,
  intervalPseudocode,
  intervalTrace,
  makeIntervalOps,
  makeOrderOps,
  orderPseudocode,
  orderTrace,
  overlaps,
} from './augmented-trees.js';

/** @typedef {import('./augmented-trees.js').AugFrame} Frame */
/** @typedef {import('./augmented-trees.js').OrderOp} OrderOp */
/** @typedef {import('./augmented-trees.js').IntervalOp} IntervalOp */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} keys @returns {OrderOp[]} */
const inserts = (...keys) => keys.map((key) => ({ type: 'insert', key }));
/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));
/** @param {Frame[]} frames @param {number} opIndex */
const opEnd = (frames, opIndex) =>
  /** @type {Frame} */ (frames.filter((f) => f.opIndex === opIndex).at(-1));
/** @param {Frame} f */
const keysOf = (f) => inorderSlots(f).map((s) => f.nodes[s].key);

/** Every reachable node: ordered, balanced, with correct height, size and max. @param {Frame} f */
function assertTree(f) {
  /** @param {number} s @returns {{ h: number, n: number, max: number }} */
  const check = (s) => {
    if (s === -1) return { h: 0, n: 0, max: -Infinity };
    const node = f.nodes[s];
    const l = check(node.left);
    const r = check(node.right);
    expect(Math.abs(l.h - r.h)).toBeLessThanOrEqual(1);
    const h = 1 + Math.max(l.h, r.h);
    const n = 1 + l.n + r.n;
    const max = Math.max(node.high, l.max, r.max);
    expect(node.height).toBe(h);
    expect(node.size).toBe(n);
    expect(node.max).toBe(max);
    return { h, n, max };
  };
  const whole = check(f.root);
  expect(whole.n).toBe(f.size);
  expect(whole.h).toBe(f.height);
  const low = keysOf(f);
  const pairs = inorderSlots(f).map((s) => [f.nodes[s].key, f.nodes[s].high]);
  low.forEach((_, i) => {
    if (i === 0) return;
    const [a, b] = pairs[i - 1];
    const [c, d] = pairs[i];
    expect(a < c || (a === c && b < d)).toBe(true);
  });
}

describe('order-statistic tree', () => {
  it('starts empty and ends on done', () => {
    const frames = orderTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].root).toBe(-1);
  });

  it('keeps sizes right through inserts, rotations and deletes, against a sorted array', () => {
    const rand = seeded(7);
    for (let round = 0; round < 25; round++) {
      /** @type {OrderOp[]} */
      const ops = [];
      /** @type {number[]} */
      const oracle = [];
      for (let i = 0; i < MAX_OPS; i++) {
        const key = Math.floor(rand() * 40);
        const type = rand() < 0.6 ? 'insert' : 'delete';
        ops.push({ type, key });
        const at = oracle.indexOf(key);
        if (type === 'insert' && at < 0) {
          oracle.push(key);
          oracle.sort((a, b) => a - b);
        } else if (type === 'delete' && at >= 0) oracle.splice(at, 1);
      }
      const frames = orderTrace(ops);
      expect(keysOf(last(frames))).toEqual(oracle);
      ops.forEach((_, i) => assertTree(opEnd(frames, i)));
    }
  });

  it('select finds the k-th smallest for every k', () => {
    const keys = [55, 82, 17, 93, 41, 68, 29, 76, 3, 60, 12, 99, 48, 35, 71];
    expect(keys).toHaveLength(MAX_KEYS);
    const sorted = keys.slice().sort((a, b) => a - b);
    sorted.forEach((want, i) => {
      const frames = orderTrace([...inserts(...keys), { type: 'select', key: i + 1 }]);
      const f = opEnd(frames, keys.length);
      expect(f.kind).toBe('select-found');
      expect(f.result).toBe(want);
      expect(f.nodes[f.answer].key).toBe(want);
      expect(f.counted).toBe(i);
    });
  });

  it('rank counts the keys before a key, present or absent', () => {
    const keys = [55, 82, 17, 93, 41, 68, 29, 76];
    for (let k = 0; k < 100; k++) {
      const frames = orderTrace([...inserts(...keys), { type: 'rank', key: k }]);
      const f = opEnd(frames, keys.length);
      expect(f.result).toBe(1 + keys.filter((x) => x < k).length);
      expect(f.kind).toBe(keys.includes(k) ? 'rank-found' : 'rank-missing');
    }
  });

  it('rank and select are inverses', () => {
    const keys = [40, 20, 60, 10, 30, 50, 70];
    keys.forEach((key) => {
      const r = opEnd(orderTrace([...inserts(...keys), { type: 'rank', key }]), keys.length);
      const s = opEnd(
        orderTrace([
          ...inserts(...keys),
          { type: 'select', key: /** @type {number} */ (r.result) },
        ]),
        keys.length,
      );
      expect(s.result).toBe(key);
    });
  });

  it('the counted keys are always a prefix of the sorted order', () => {
    const frames = orderTrace(makeOrderOps('queries'));
    for (const f of frames.filter((x) => x.kind.startsWith('rank-') && x.kind !== 'rank-begin')) {
      const before = keysOf(f).slice(0, f.counted);
      const key = /** @type {NonNullable<Frame['op']>} */ (f.op).key;
      expect(before.every((k) => k < key)).toBe(true);
    }
  });

  it('refuses an out-of-range k by looking only at the root size', () => {
    for (const k of [0, 4]) {
      const frames = orderTrace([...inserts(1, 2, 3), { type: 'select', key: k }]);
      const f = opEnd(frames, 3);
      expect(f.kind).toBe('select-range');
      expect(f.comparisons).toBe(0);
      expect(f.result).toBeNull();
    }
  });

  it('handles queries on an empty tree', () => {
    const frames = orderTrace([
      { type: 'rank', key: 5 },
      { type: 'select', key: 1 },
      { type: 'delete', key: 5 },
    ]);
    expect(opEnd(frames, 0).kind).toBe('rank-missing');
    expect(opEnd(frames, 0).result).toBe(1);
    expect(opEnd(frames, 1).kind).toBe('select-range');
    expect(opEnd(frames, 2).kind).toBe('missing');
  });

  it('ignores a duplicate insert without touching any size', () => {
    const frames = orderTrace([...inserts(2, 1, 3), { type: 'insert', key: 3 }]);
    const f = opEnd(frames, 3);
    expect(f.kind).toBe('dup');
    expect(f.updates).toBe(0);
    expect(f.size).toBe(3);
    assertTree(f);
  });

  it('counts inspections and recomputed nodes on a known input', () => {
    // 10, 20, 30: the third insert compares twice, refreshes 2 ancestors and rotates once.
    const frames = orderTrace(inserts(10, 20, 30));
    const f = opEnd(frames, 2);
    expect(f.comparisons).toBe(2);
    expect(f.updates).toBe(4);
    expect(f.rotations).toBe(1);
    expect(f.nodes[f.root].key).toBe(20);
    expect(f.nodes[f.root].size).toBe(3);
  });

  it('a rotation hands the subtree size to the lifted node and recomputes the lowered one', () => {
    const frames = orderTrace(inserts(10, 20, 30));
    const f = /** @type {Frame} */ (frames.find((x) => x.kind === 'rotate'));
    expect(f.nodes[f.moved].size).toBe(3);
    expect(f.nodes[f.sunk].size).toBe(1);
  });

  it('deletes a two-child node through its successor', () => {
    const frames = orderTrace([...inserts(2, 1, 4, 3, 5), { type: 'delete', key: 2 }]);
    expect(frames.some((f) => f.kind === 'successor')).toBe(true);
    expect(frames.some((f) => f.kind === 'copy')).toBe(true);
    const f = opEnd(frames, 5);
    expect(keysOf(f)).toEqual([1, 3, 4, 5]);
    assertTree(f);
  });

  it('does not alias frames', () => {
    const frames = orderTrace(inserts(1, 2, 3));
    const before = JSON.stringify(frames[3]);
    frames[2].nodes[0].key = 99;
    frames[2].path.push(99);
    frames[2].lines.push(99);
    expect(JSON.stringify(frames[3])).toBe(before);
  });

  it('stays under the frame budget at the caps', () => {
    /** @type {OrderOp[]} */
    const ops = inserts(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
    for (let i = 0; i < 5; i++) ops.push({ type: 'delete', key: 8 + i });
    expect(ops).toHaveLength(MAX_OPS);
    expect(orderTrace(ops).length).toBeLessThan(400);
  });
});

describe('interval tree', () => {
  /** @param {[number, number][]} list @returns {IntervalOp[]} */
  const put = (list) => list.map(([key, high]) => ({ type: 'insert', key, high }));

  it('keeps max right and the order by low then high, including equal lows', () => {
    const frames = intervalTrace(
      put([
        [5, 9],
        [5, 7],
        [5, 20],
        [1, 2],
        [8, 8],
      ]),
    );
    assertTree(last(frames));
    expect(keysOf(last(frames))).toEqual([1, 5, 5, 5, 8]);
  });

  it('finds an overlap exactly when one exists, against a scan of every interval', () => {
    const rand = seeded(11);
    for (let round = 0; round < 60; round++) {
      /** @type {[number, number][]} */
      const list = [];
      while (list.length < MAX_INTERVALS) {
        const lo = Math.floor(rand() * 90);
        const hi = lo + Math.floor(rand() * 15);
        if (!list.some(([a, b]) => a === lo && b === hi)) list.push([lo, hi]);
      }
      for (let q = 0; q < 8; q++) {
        const lo = Math.floor(rand() * 95);
        const hi = lo + Math.floor(rand() * 5);
        const frames = intervalTrace([...put(list), { type: 'overlap', key: lo, high: hi }]);
        const f = opEnd(frames, MAX_INTERVALS);
        const any = list.some(([a, b]) => overlaps(a, b, lo, hi));
        expect(f.kind).toBe(any ? 'overlap-found' : 'overlap-none');
        if (any) {
          const n = f.nodes[f.answer];
          expect(overlaps(n.key, n.high, lo, hi)).toBe(true);
        }
        expect(f.comparisons).toBeLessThanOrEqual(f.height);
      }
    }
  });

  it('counts a shared endpoint as an overlap, because the intervals are closed', () => {
    const frames = intervalTrace([...put([[5, 8]]), { type: 'overlap', key: 8, high: 9 }]);
    expect(opEnd(frames, 1).kind).toBe('overlap-found');
    expect(overlaps(5, 8, 9, 10)).toBe(false);
  });

  it('follows the stored max left to a long interval that a low-only walk would miss', () => {
    const frames = intervalTrace(makeIntervalOps('long'));
    const f = opEnd(frames, 7);
    expect(f.kind).toBe('overlap-found');
    expect([f.nodes[f.answer].key, f.nodes[f.answer].high]).toEqual([10, 90]);
    expect(f.comparisons).toBe(3);
  });

  it('walks one path and reports nothing when no interval reaches the query', () => {
    const frames = intervalTrace(makeIntervalOps('long'));
    const f = opEnd(frames, 8);
    expect(f.kind).toBe('overlap-none');
    expect(f.comparisons).toBe(3);
  });

  it('deletes by exact interval and rebuilds max on the way up', () => {
    const list = /** @type {[number, number][]} */ ([
      [40, 45],
      [20, 25],
      [60, 65],
      [10, 90],
    ]);
    const frames = intervalTrace([
      ...put(list),
      { type: 'delete', key: 10, high: 11 },
      { type: 'delete', key: 10, high: 90 },
    ]);
    expect(opEnd(frames, 4).kind).toBe('missing');
    const f = opEnd(frames, 5);
    assertTree(f);
    expect(f.nodes[f.root].max).toBe(65);
  });

  it('the textbook preset answers both queries', () => {
    const frames = intervalTrace(makeIntervalOps('textbook'));
    const hit = opEnd(frames, 10);
    expect(hit.kind).toBe('overlap-found');
    const n = hit.nodes[hit.answer];
    expect(overlaps(n.key, n.high, 22, 25)).toBe(true);
    expect(opEnd(frames, 11).kind).toBe('overlap-none');
  });
});

describe('presets', () => {
  it('random presets are reproducible with an injected generator', () => {
    expect(makeOrderOps('random', seeded(3))).toEqual(makeOrderOps('random', seeded(3)));
    expect(makeIntervalOps('random', seeded(3))).toEqual(makeIntervalOps('random', seeded(3)));
    orderTrace(makeOrderOps('random', seeded(3)));
    intervalTrace(makeIntervalOps('random', seeded(3)));
  });
});

describe('pseudocode coverage', () => {
  it('highlights every order-statistic line across the presets', () => {
    const seen = new Set(
      /** @type {const} */ (['queries', 'rotations', 'scores']).flatMap((p) =>
        orderTrace(makeOrderOps(p)).flatMap((f) => f.lines),
      ),
    );
    orderPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it('highlights every interval line across the presets', () => {
    const seen = new Set(
      /** @type {const} */ (['textbook', 'long', 'rotations']).flatMap((p) =>
        intervalTrace(makeIntervalOps(p)).flatMap((f) => f.lines),
      ),
    );
    intervalPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});

describe('numbers the practice questions rely on', () => {
  const keys = [40, 20, 60, 10, 30, 50, 70];

  it('select(6) leaves the root with k = 2 and returns 60', () => {
    const frames = orderTrace([...inserts(...keys), { type: 'select', key: 6 }]);
    const right = /** @type {Frame} */ (frames.find((f) => f.kind === 'select-right'));
    expect(right.remaining).toBe(2);
    expect(opEnd(frames, keys.length).result).toBe(60);
  });

  it('rank(45) is 5, and a range count from two ranks gives 3', () => {
    /** @param {number} key */
    const rankOf = (key) =>
      opEnd(orderTrace([...inserts(...keys), { type: 'rank', key }]), keys.length).result;
    expect(rankOf(45)).toBe(5);
    expect(rankOf(56)).toBe(6);
    expect(rankOf(25)).toBe(3);
  });

  it('a single rotation recomputes exactly two nodes', () => {
    const frames = orderTrace(makeOrderOps('rotations'));
    const at = frames.findIndex((f) => f.kind === 'rotate');
    expect(frames[at].updates - frames[at - 1].updates).toBe(2);
    expect(frames[at].nodes[frames[at].moved].key).toBe(20);
  });

  it('the long interval is found, and deleting it drops the root max to 75', () => {
    const ops = makeIntervalOps('long');
    const f = opEnd(intervalTrace(ops), 7);
    expect(f.nodes[f.answer].high).toBe(90);
    const del = intervalTrace([...ops, { type: 'delete', key: 10, high: 90 }]);
    const after = opEnd(del, ops.length);
    expect(after.nodes[after.root].max).toBe(75);
  });
});
