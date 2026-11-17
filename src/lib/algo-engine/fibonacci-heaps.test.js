import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  MAX_SIZE,
  countMarked,
  countNodes,
  fibonacciHeapTrace,
  heapPseudocode,
  liveKeys,
  makeFibOps,
  potential,
} from './fibonacci-heaps.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./fibonacci-heaps.js').FibOp} FibOp */
/** @typedef {import('./fibonacci-heaps.js').FibTree} FibTree */
/** @typedef {import('./fibonacci-heaps.js').FibFrame} FibFrame */
/** @typedef {import('./fibonacci-heaps.js').HeapVariant} HeapVariant */

const VARIANTS = /** @type {HeapVariant[]} */ (['fibonacci', 'binomial']);

/**
 * An independent oracle: a plain list of [id, key] pairs, scanned for the minimum.
 * @param {FibOp[]} ops
 */
function oracle(ops) {
  /** @type {[number, number][]} */
  let items = [];
  /** @type {number[]} */
  const out = [];
  let next = 0;
  for (const op of ops) {
    if (op.type === 'insert') items.push([next++, op.value]);
    else if (op.type === 'decrease') {
      items = items.map(([id, key]) =>
        id === op.id && op.value < key ? [id, op.value] : [id, key],
      );
    } else if (items.length) {
      const best = items.reduce((a, b) => (b[1] < a[1] || (b[1] === a[1] && b[0] < a[0]) ? b : a));
      out.push(best[1]);
      items = items.filter((it) => it !== best);
    }
  }
  return { out, rest: items.map(([, key]) => key).sort((x, y) => x - y) };
}

/** @param {FibTree[]} trees @returns {number[]} */
const keysOf = (trees) => trees.flatMap((t) => [t.key, ...keysOf(t.children)]);

/** Every child is no smaller than its parent. @param {FibTree[]} trees @returns {boolean} */
const heapOrdered = (trees) =>
  trees.every((t) => t.children.every((c) => c.key >= t.key) && heapOrdered(t.children));

/** A binomial tree of degree k has 2^k nodes and children of degrees 0..k − 1. @param {FibTree} t @returns {boolean} */
function binomialTree(t) {
  const degrees = t.children.map((c) => c.children.length).sort((x, y) => x - y);
  return (
    countNodes([t]) === 2 ** t.children.length &&
    degrees.every((d, i) => d === i) &&
    t.children.every(binomialTree)
  );
}

/** @param {() => number} rand @returns {FibOp[]} */
function randomOps(rand) {
  /** @type {FibOp[]} */
  const ops = [];
  while (ops.length < MAX_OPS) {
    const live = [...liveKeys(ops)];
    const r = rand();
    if (live.length < MAX_SIZE && (live.length === 0 || r < 0.5)) {
      ops.push({ type: 'insert', value: Math.floor(rand() * 100) });
    } else if (r < 0.75) {
      ops.push({ type: 'extract' });
    } else {
      const candidates = live.filter(([, key]) => key > 0);
      if (candidates.length === 0) continue;
      const [id, key] = candidates[Math.floor(rand() * candidates.length)];
      ops.push({ type: 'decrease', id, value: Math.floor(rand() * key) });
    }
  }
  return ops;
}

describe('binomial and Fibonacci heap trace', () => {
  it.each(VARIANTS)('removes the same keys as a plain list (%s)', (variant) => {
    const rand = seeded(variant === 'fibonacci' ? 3 : 8);
    for (let t = 0; t < 200; t++) {
      const ops = randomOps(rand);
      const frames = fibonacciHeapTrace(ops, variant);
      const want = oracle(ops);
      const last = /** @type {FibFrame} */ (frames.at(-1));
      expect(last.out).toEqual(want.out);
      expect(keysOf(last.trees).sort((x, y) => x - y)).toEqual(want.rest);
    }
  });

  it.each(VARIANTS)('keeps every tree heap-ordered and the min pointer right (%s)', (variant) => {
    const rand = seeded(11);
    for (let t = 0; t < 40; t++) {
      for (const f of fibonacciHeapTrace(randomOps(rand), variant)) {
        // Only a decreased key still on its way up may sit above a larger parent.
        if (f.kind !== 'decrease' && f.kind !== 'sift') expect(heapOrdered(f.trees)).toBe(true);
        if (f.kind === 'rebuild' || f.kind === 'settled' || f.kind === 'done') {
          const keys = keysOf(f.trees);
          const min = f.trees.find((r) => r.id === f.minId);
          expect(min?.key ?? null).toBe(keys.length ? Math.min(...keys) : null);
        }
      }
    }
  });

  it('keeps a binomial heap as one binomial tree per degree, in degree order', () => {
    const rand = seeded(6);
    for (let t = 0; t < 40; t++) {
      const frames = fibonacciHeapTrace(randomOps(rand), 'binomial');
      frames.forEach((f, i) => {
        const next = frames[i + 1];
        if (next && next.opIndex === f.opIndex) return;
        const degrees = f.trees.map((r) => r.children.length);
        expect(degrees).toEqual([...new Set(degrees)].sort((x, y) => x - y));
        expect(f.trees.every(binomialTree)).toBe(true);
      });
    }
  });

  it('follows the binary digits of n on inserts into a binomial heap', () => {
    const frames = fibonacciHeapTrace(makeFibOps('counter'), 'binomial');
    for (let n = 1; n <= 8; n++) {
      const end = /** @type {FibFrame} */ (frames.findLast((f) => f.opIndex === n - 1));
      const digits = n
        .toString(2)
        .split('')
        .reverse()
        .flatMap((b, k) => (b === '1' ? [k] : []));
      expect(end.trees.map((r) => r.children.length)).toEqual(digits);
    }
    // 8 = 1000₂: the counter carries 7 times in all, one link per carry.
    expect(frames.at(-1)?.links).toBe(7);
  });

  it('inserts lazily into a Fibonacci heap and consolidates on extract-min', () => {
    const frames = fibonacciHeapTrace(makeFibOps('lazy'), 'fibonacci');
    const beforeExtract = /** @type {FibFrame} */ (frames.findLast((f) => f.opIndex === 8));
    expect(beforeExtract.trees).toHaveLength(9);
    expect(beforeExtract.links).toBe(0);
    const last = /** @type {FibFrame} */ (frames.at(-1));
    // Eight keys left form one tree of degree 3: 7 links.
    expect(last.trees).toHaveLength(1);
    expect(last.trees[0].children).toHaveLength(3);
    expect(last.links).toBe(7);
    expect(last.out).toEqual([3]);
    expect(potential(last.trees)).toBe(1);
  });

  it('cuts, marks and cascades on decrease-key', () => {
    const frames = fibonacciHeapTrace(makeFibOps('cascade'), 'fibonacci');
    const kinds = frames.filter((f) => f.opIndex >= 10).map((f) => f.kind);
    expect(kinds).toEqual([
      'decrease',
      'cut',
      'mark',
      'settled',
      'decrease',
      'cut',
      'mark',
      'settled',
      'decrease',
      'cut',
      'cascade',
      'settled',
    ]);
    const last = /** @type {FibFrame} */ (frames.at(-1));
    expect(last.cuts).toBe(4);
    expect(countMarked(last.trees)).toBe(0);
    expect(last.trees.map((r) => r.key)).toEqual([7, 15, 20, 2, 26]);
    expect(last.trees.find((r) => r.id === last.minId)?.key).toBe(2);
    // After the second cut the marked 39 and 26 count twice each in Φ = t + 2m.
    const marked = /** @type {FibFrame} */ (frames.findLast((f) => f.opIndex === 11));
    expect(potential(marked.trees)).toBe(3 + 2 * 2);
  });

  it('sifts a decreased key up inside a binomial tree', () => {
    const frames = fibonacciHeapTrace(makeFibOps('cascade'), 'binomial');
    const last = /** @type {FibFrame} */ (frames.at(-1));
    expect(last.cuts).toBe(0);
    expect(last.siftSwaps).toBe(4);
    expect(last.trees).toHaveLength(1);
    expect(last.trees[0].key).toBe(2);
  });

  it('handles edge cases: no ops, one key, extract from empty, ties, a root decrease', () => {
    expect(fibonacciHeapTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    const one = fibonacciHeapTrace([{ type: 'insert', value: 4 }, { type: 'extract' }]);
    expect(one.map((f) => f.kind)).toEqual(['start', 'insert', 'extract', 'promote', 'done']);
    expect(one.at(-1)?.out).toEqual([4]);
    expect(fibonacciHeapTrace([{ type: 'extract' }])[1].kind).toBe('empty');
    /** @type {FibOp[]} */
    const ties = [
      { type: 'insert', value: 5 },
      { type: 'insert', value: 5 },
      { type: 'insert', value: 5 },
      { type: 'extract' },
    ];
    for (const v of VARIANTS) {
      const last = fibonacciHeapTrace(ties, v).at(-1);
      expect(last?.out).toEqual([5]);
      expect(keysOf(last?.trees ?? [])).toEqual([5, 5]);
    }
    const root = fibonacciHeapTrace([
      { type: 'insert', value: 9 },
      { type: 'insert', value: 4 },
      { type: 'decrease', id: 0, value: 1 },
    ]);
    expect(root.at(-2)?.lines).toEqual([12, 17]);
    expect(root.at(-1)?.minId).toBe(0);
  });

  it('reports live keys by item id', () => {
    const live = liveKeys(makeFibOps('cascade'));
    expect(live.has(5)).toBe(false);
    expect(live.get(7)).toBe(2);
    expect(live.size).toBe(8);
  });

  it('builds random presets within the limits', () => {
    const ops = makeFibOps('random', seeded(4));
    expect(ops.length).toBeLessThanOrEqual(MAX_OPS);
    expect(liveKeys(ops).size).toBeLessThanOrEqual(MAX_SIZE);
  });

  it.each(VARIANTS)('stays under 400 frames at the caps (%s)', (variant) => {
    /** @type {FibOp[]} */
    const ops = [];
    for (let i = 0; i < MAX_SIZE; i++) ops.push({ type: 'insert', value: 99 - i });
    while (ops.length < MAX_OPS) ops.push({ type: 'extract' });
    expect(fibonacciHeapTrace(ops, variant).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = fibonacciHeapTrace(makeFibOps('lazy'));
    const at = frames.findIndex((f) => f.kind === 'link');
    const before = JSON.stringify(frames[at + 1]);
    frames[at].trees[0].children.push({ id: 99, key: 0, mark: false, children: [] });
    frames[at].trees[0].key = -1;
    frames[at].out.push(1);
    frames[at].table.push(7);
    expect(JSON.stringify(frames[at + 1])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it.each(VARIANTS)('highlights every line (%s)', (variant) => {
    const frames = [
      ...fibonacciHeapTrace(makeFibOps('cascade'), variant),
      ...fibonacciHeapTrace(makeFibOps('counter'), variant),
      ...fibonacciHeapTrace([{ type: 'extract' }], variant),
      ...fibonacciHeapTrace(
        [
          { type: 'insert', value: 9 },
          { type: 'decrease', id: 0, value: 1 },
        ],
        variant,
      ),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(heapPseudocode(variant).map((_, i) => i));
  });
});
