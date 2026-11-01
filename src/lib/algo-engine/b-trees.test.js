import { describe, expect, it } from 'vitest';
import {
  MAX_KEYS,
  MAX_OPS,
  ORDERS,
  bTreePseudocode,
  bTreeTrace,
  inorderKeys,
  layoutBTree,
  makeOps,
  minKeys,
} from './b-trees.js';

/** @typedef {import('./b-trees.js').BFrame} Frame */
/** @typedef {import('./b-trees.js').BNode} Node */
/** @typedef {import('./b-trees.js').BOp} Op */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} keys @returns {Op[]} */
const inserts = (...keys) => keys.map((key) => ({ type: 'insert', key }));
/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));
/** @param {Node | null} root */
const levels = (root) => {
  /** @type {number[][][]} */
  const out = [];
  /** @param {Node} n @param {number} d */
  const go = (n, d) => {
    (out[d] ??= []).push(n.keys);
    n.children.forEach((c) => go(c, d + 1));
  };
  if (root) go(root, 0);
  return out;
};

/** @param {Node | null} root @param {number} order */
function assertBTree(root, order) {
  if (!root) return;
  /** @type {Set<number>} */
  const leafDepths = new Set();
  /** @param {Node} n @param {number} d */
  const go = (n, d) => {
    expect(n.keys.length).toBeLessThanOrEqual(order - 1);
    if (n !== root) expect(n.keys.length).toBeGreaterThanOrEqual(minKeys(order));
    else expect(n.keys.length).toBeGreaterThanOrEqual(1);
    expect([...n.keys].sort((a, b) => a - b)).toEqual(n.keys);
    if (n.children.length) expect(n.children.length).toBe(n.keys.length + 1);
    else leafDepths.add(d);
    n.children.forEach((c) => go(c, d + 1));
  };
  go(root, 0);
  expect(leafDepths.size).toBe(1);
}

describe('b-tree trace', () => {
  it('starts empty and ends on done', () => {
    const frames = bTreeTrace([], 3);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].height).toBe(0);
  });

  it('splits upward and grows a new root at order 3', () => {
    const frames = bTreeTrace(inserts(10, 20, 30), 3);
    expect(frames.some((f) => f.kind === 'overflow')).toBe(true);
    const f = last(frames);
    expect(levels(f.root)).toEqual([[[20]], [[10], [30]]]);
    expect(f.splits).toBe(1);
    expect(f.height).toBe(2);
  });

  it('builds the known tree from seven sorted keys at each order', () => {
    const grow = makeOps('grow');
    expect(levels(last(bTreeTrace(grow, 3)).root)).toEqual([
      [[40]],
      [[20], [60]],
      [[10], [30], [50], [70]],
    ]);
    expect(last(bTreeTrace(grow, 3)).splits).toBe(4);
    expect(levels(last(bTreeTrace(grow, 4)).root)).toEqual([
      [[20, 40]],
      [[10], [30], [50, 60, 70]],
    ]);
    expect(levels(last(bTreeTrace(grow, 5)).root)).toEqual([
      [[30]],
      [
        [10, 20],
        [40, 50, 60, 70],
      ],
    ]);
  });

  it('counts one read per level on a search', () => {
    const frames = bTreeTrace([...makeOps('grow'), { type: 'search', key: 70 }], 3);
    const found = /** @type {Frame} */ (frames.find((f) => f.kind === 'found'));
    expect(found.reads).toBe(3);
    expect(found.scanned).toBe(3);
  });

  it('reports a missing key and ignores a duplicate', () => {
    const miss = bTreeTrace([...inserts(5), { type: 'search', key: 1 }], 3);
    expect(miss.some((f) => f.kind === 'missing')).toBe(true);
    const gone = bTreeTrace([...inserts(5), { type: 'delete', key: 1 }], 3);
    expect(last(gone).size).toBe(1);
    const dup = bTreeTrace(inserts(5, 5), 3);
    expect(dup.some((f) => f.kind === 'dup')).toBe(true);
    expect(last(dup).size).toBe(1);
  });

  it('merges twice, shrinks, then borrows on the merge preset at order 3', () => {
    const frames = bTreeTrace(makeOps('merge'), 3);
    const kinds = frames.map((f) => f.kind);
    expect(kinds).toContain('shrink');
    expect(kinds).toContain('swap-in');
    expect(kinds).toContain('borrow');
    const end = last(frames);
    expect(end.merges).toBe(2);
    expect(end.borrows).toBe(1);
    expect(levels(end.root)).toEqual([[[20, 50]], [[10], [30], [60]]]);
  });

  it('borrows from the right sibling when the left cannot spare a key', () => {
    const f = bTreeTrace([...inserts(10, 20, 30, 40), { type: 'delete', key: 10 }], 3);
    expect(f.some((x) => x.kind === 'borrow')).toBe(true);
    expect(levels(last(f).root)).toEqual([[[30]], [[20], [40]]]);
  });

  it('merges with the right sibling when the first child runs short', () => {
    const f = bTreeTrace([...inserts(10, 20, 30, 40, 50), { type: 'delete', key: 10 }], 3);
    expect(f.some((x) => x.kind === 'merge')).toBe(true);
    assertBTree(last(f).root, 3);
    expect(inorderKeys(last(f).root)).toEqual([20, 30, 40, 50]);
  });

  it('empties the tree when the last key goes', () => {
    const f = last(bTreeTrace([...inserts(5), { type: 'delete', key: 5 }], 3));
    expect(f.root).toBeNull();
    expect(f.height).toBe(0);
  });

  it('agrees with a sorted set and keeps every invariant on random logs', () => {
    for (const order of ORDERS) {
      for (let seed = 1; seed <= 25; seed++) {
        const rand = seeded(seed * order);
        const set = new Set();
        /** @type {Op[]} */
        const ops = [];
        for (let i = 0; i < 60; i++) {
          const key = Math.floor(rand() * 40);
          const roll = rand();
          const type = roll < 0.55 ? 'insert' : roll < 0.9 ? 'delete' : 'search';
          ops.push({ type, key });
          if (type === 'insert') set.add(key);
          if (type === 'delete') set.delete(key);
        }
        const f = last(bTreeTrace(ops, order));
        expect(inorderKeys(f.root)).toEqual([...set].sort((a, b) => a - b));
        assertBTree(f.root, order);
        expect(f.size).toBe(set.size);
      }
    }
  });

  it('stays valid after each operation of a mixed log', () => {
    const ops = [
      ...inserts(8, 3, 11, 1, 6, 9, 14, 4, 7, 13),
      ...[3, 11, 8].map((key) => ({ type: /** @type {const} */ ('delete'), key })),
    ];
    for (let i = 1; i <= ops.length; i++) assertBTree(last(bTreeTrace(ops.slice(0, i), 3)).root, 3);
  });

  it('stays under the frame budget at the log cap', () => {
    for (const order of ORDERS) {
      /** @type {Op[]} */
      const ops = inserts(...Array.from({ length: MAX_KEYS }, (_, i) => i));
      for (let k = 0; ops.length < MAX_OPS; k += 3) ops.push({ type: 'delete', key: k });
      expect(bTreeTrace(ops, order).length).toBeLessThan(400);
    }
  });

  it('does not alias frames', () => {
    const frames = bTreeTrace(inserts(1, 2, 3, 4), 3);
    const i = frames.findIndex((f) => f.kind === 'overflow');
    const before = JSON.stringify(frames[i + 1]);
    /** @type {Node} */ (frames[i].root).keys.push(99);
    frames[i].path.push(99);
    frames[i].lines.push(99);
    expect(JSON.stringify(frames[i + 1])).toBe(before);
  });
});

describe('b-tree layout', () => {
  it('places nothing for an empty tree', () => {
    expect(layoutBTree(null)).toEqual({ nodes: [], edges: [], width: 0, levels: 0 });
  });

  it('keeps sibling nodes from overlapping and parents over their children', () => {
    const layout = layoutBTree(last(bTreeTrace(makeOps('grow'), 3)).root);
    expect(layout.levels).toBe(3);
    const byDepth = Object.groupBy(layout.nodes, (n) => n.depth);
    for (const row of Object.values(byDepth)) {
      const sorted = (row ?? []).slice().sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].x).toBeGreaterThanOrEqual(sorted[i - 1].x + sorted[i - 1].width);
      }
    }
    expect(layout.edges).toHaveLength(6);
    expect(layout.width).toBeGreaterThan(0);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line on the merge preset at order 3', () => {
    const seen = new Set(bTreeTrace(makeOps('merge'), 3).flatMap((f) => f.lines));
    bTreePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});

describe('numbers the practice questions rely on', () => {
  it('seven sorted keys at order 3', () => {
    const f = last(bTreeTrace(makeOps('grow'), 3));
    expect(f.height).toBe(3);
    expect(f.splits).toBe(4);
  });

  it('the delete of 70 merges twice and lowers the tree', () => {
    const ops = makeOps('merge').slice(0, 8);
    const f = last(bTreeTrace(ops, 3));
    expect(f.merges).toBe(2);
    expect(f.height).toBe(2);
  });

  it('capacity and minimum fill', () => {
    expect(3 ** 3 - 1).toBe(26);
    expect(1001 ** 3 - 1).toBe(1003003000);
    expect(minKeys(5)).toBe(2);
    expect(minKeys(3)).toBe(1);
  });
});
