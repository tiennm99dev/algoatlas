import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  MAX_OPS,
  bstPseudocode,
  bstTrace,
  inorderKeys,
  layoutTree,
  makeOps,
  treeHeight,
} from './bst.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./bst.js').BstFrame} BstFrame @typedef {import('./bst.js').BstOp} BstOp */

/** @param {number[]} keys @returns {BstOp[]} */
const inserts = (...keys) => keys.map((key) => ({ type: 'insert', key }));
const BALANCED = [50, 30, 70, 20, 40, 60, 80];

/** @param {BstFrame[]} frames */
const last = (frames) => /** @type {BstFrame} */ (frames.at(-1));

/** Last frame of each op, in op order. @param {BstFrame[]} frames */
function opEnds(frames) {
  /** @type {BstFrame[]} */
  const ends = [];
  for (const f of frames) if (f.opIndex >= 0) ends[f.opIndex] = f;
  return ends;
}

/** @param {BstFrame} f @param {number} slot @param {number} lo @param {number} hi @returns {boolean} */
function ordered(f, slot, lo, hi) {
  if (slot === -1) return true;
  const key = /** @type {number} */ (f.nodes[slot].key);
  return (
    key > lo &&
    key < hi &&
    ordered(f, f.nodes[slot].left, lo, key) &&
    ordered(f, f.nodes[slot].right, key, hi)
  );
}

/** @param {BstFrame} f @param {number} slot @returns {number} */
const h = (f, slot) =>
  slot === -1 ? 0 : 1 + Math.max(h(f, f.nodes[slot].left), h(f, f.nodes[slot].right));

/** @param {BstFrame} f @param {number} slot @returns {number} */
const n = (f, slot) => (slot === -1 ? 0 : 1 + n(f, f.nodes[slot].left) + n(f, f.nodes[slot].right));

/** @param {(rand: () => number) => BstOp[]} build @param {number} seed */
function randomOps(build, seed) {
  return build(seeded(seed));
}

/** @param {() => number} rand @returns {BstOp[]} */
function randomLog(rand) {
  const types = /** @type {const} */ (['insert', 'search', 'delete']);
  const count = 1 + Math.floor(rand() * 30);
  return Array.from({ length: count }, () => ({
    type: types[Math.floor(rand() * 3)],
    key: Math.floor(rand() * 21),
  }));
}

describe('bst trace', () => {
  it('matches a reference set after random operation logs, keeping the BST invariant', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const ops = randomOps(randomLog, seed);
      const frames = bstTrace(ops);
      const ref = new Set();
      for (const op of ops) {
        if (op.type === 'insert') ref.add(op.key);
        else if (op.type === 'delete') ref.delete(op.key);
      }
      expect(inorderKeys(last(frames))).toEqual([...ref].sort((a, b) => a - b));
      for (const end of opEnds(frames))
        expect(ordered(end, end.root, -Infinity, Infinity)).toBe(true);
    }
  });

  it('deletes a leaf, a left-only child, a right-only child, and the only node', () => {
    const leaf = last(bstTrace([...inserts(...BALANCED), { type: 'delete', key: 20 }]));
    expect(inorderKeys(leaf)).toEqual([30, 40, 50, 60, 70, 80]);

    const left = last(bstTrace([...inserts(50, 30, 20), { type: 'delete', key: 30 }]));
    expect(inorderKeys(left)).toEqual([20, 50]);
    expect(left.nodes[left.root].left).not.toBe(-1);

    const right = last(bstTrace([...inserts(50, 30, 40), { type: 'delete', key: 30 }]));
    expect(inorderKeys(right)).toEqual([40, 50]);

    const only = last(bstTrace([...inserts(5), { type: 'delete', key: 5 }]));
    expect(only.root).toBe(-1);
    expect(only.size).toBe(0);
    expect(only.height).toBe(0);
  });

  it('deletes the root with one child and with two children', () => {
    const one = last(bstTrace([...inserts(50, 70), { type: 'delete', key: 50 }]));
    expect(inorderKeys(one)).toEqual([70]);
    expect(one.nodes[one.root].key).toBe(70);

    const two = last(bstTrace([...inserts(...BALANCED), { type: 'delete', key: 50 }]));
    expect(inorderKeys(two)).toEqual([20, 30, 40, 60, 70, 80]);
    expect(two.nodes[two.root].key).toBe(60);
    expect(two.height).toBe(3);
  });

  it('leaves the tree unchanged when deleting an absent key', () => {
    const frames = bstTrace([...inserts(...BALANCED), { type: 'delete', key: 55 }]);
    expect(last(frames).size).toBe(7);
    expect(frames.some((f) => f.kind === 'missing' && f.opIndex === 7)).toBe(true);
  });

  it('gives an empty-tree search or delete a single missing frame', () => {
    const frames = bstTrace([{ type: 'search', key: 3 }]);
    expect(frames.filter((f) => f.opIndex === 0).map((f) => f.kind)).toEqual(['missing']);
  });

  it('re-links the successor right child on a two-child delete', () => {
    const ops = /** @type {BstOp[]} */ ([
      ...inserts(...BALANCED),
      { type: 'insert', key: 65 },
      { type: 'delete', key: 50 },
    ]);
    const end = last(bstTrace(ops));
    expect(inorderKeys(end)).toEqual([20, 30, 40, 60, 65, 70, 80]);
    const sixty = end.nodes[end.root];
    expect(sixty.key).toBe(60);
    expect(end.nodes[sixty.right].left).not.toBe(-1);
    expect(end.nodes[end.nodes[sixty.right].left].key).toBe(65);
  });

  it('counts one comparison per visited node', () => {
    const ops = /** @type {BstOp[]} */ ([...inserts(...BALANCED), { type: 'search', key: 60 }]);
    const ends = opEnds(bstTrace(ops));
    const hit = ends[7];
    expect(hit.kind).toBe('found');
    expect(hit.comparisons).toBe(hit.path.length);
    expect(hit.comparisons).toBe(3);
  });

  it('resets the comparison count at each operation', () => {
    const ends = opEnds(bstTrace(inserts(...BALANCED)));
    expect(ends[0].comparisons).toBe(0);
    expect(ends[6].comparisons).toBe(2);
  });

  it('lays out x as in-order rank and y as depth', () => {
    const ops = randomOps(randomLog, 11);
    for (const f of bstTrace(ops)) {
      const layout = layoutTree(f);
      expect(layout).toHaveLength(f.nodes.length);
      const placed = layout.flatMap((p, slot) => (p ? [{ ...p, key: f.nodes[slot].key }] : []));
      placed.sort((a, b) => a.x - b.x);
      expect(placed.map((p) => p.x)).toEqual(placed.map((_, i) => i));
      expect(placed).toHaveLength(f.size);
    }
    const f = last(bstTrace(inserts(...BALANCED)));
    const layout = layoutTree(f);
    expect(layout[f.root]).toEqual({ x: 3, y: 0 });
    expect(layout.filter((p) => p?.y === 2)).toHaveLength(4);
  });

  it('keeps freed and unreachable slots out of the layout', () => {
    const f = last(bstTrace([...inserts(...BALANCED), { type: 'delete', key: 20 }]));
    expect(layoutTree(f).filter((p) => p === null)).toHaveLength(1);
    expect(f.nodes.filter((nd) => nd.key === null)).toHaveLength(1);
  });

  it('reports size and height that match a recomputation on every frame', () => {
    for (const seed of [3, 4, 5]) {
      for (const f of bstTrace(randomOps(randomLog, seed))) {
        expect(f.size).toBe(n(f, f.root));
        expect(f.height).toBe(h(f, f.root));
        expect(treeHeight(f)).toBe(f.height);
      }
    }
  });

  it('builds a list from the sorted preset and a height 3 tree from the balanced one', () => {
    expect(last(bstTrace(makeOps('sorted'))).height).toBe(7);
    const balanced = last(bstTrace(makeOps('balanced')));
    expect(balanced.height).toBe(3);
    expect(balanced.size).toBe(7);
  });

  it('makes seven distinct random keys within 1-99', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const keys = makeOps('random', seeded(seed)).map((op) => op.key);
      expect(new Set(keys).size).toBe(7);
      expect(keys.every((k) => k >= 1 && k <= 99)).toBe(true);
    }
  });

  it('emits dup for a duplicate insert and leaves the size unchanged', () => {
    const frames = bstTrace([...inserts(...BALANCED), { type: 'insert', key: 30 }]);
    expect(frames.some((f) => f.kind === 'dup')).toBe(true);
    expect(last(frames).size).toBe(7);
  });

  it('does not alias frames', () => {
    const frames = bstTrace(inserts(...BALANCED));
    const before = { ...frames[3].nodes[0] };
    frames[2].nodes[0].key = 999;
    frames[2].nodes[0].left = 42;
    expect(frames[3].nodes[0]).toEqual(before);
  });

  it('keeps the trace bounded at the operation cap', () => {
    // Longest walks: a 15-key list searched for its deepest key over and over.
    const ops = /** @type {BstOp[]} */ (
      Array.from({ length: MAX_OPS }, (_, i) => ({
        type: i < MAX_NODES ? 'insert' : 'search',
        key: i < MAX_NODES ? i + 1 : MAX_NODES,
      }))
    );
    expect(bstTrace(ops).length).toBeLessThan(1000);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const ops = /** @type {BstOp[]} */ ([
      ...inserts(...BALANCED),
      { type: 'search', key: 60 },
      { type: 'search', key: 55 },
      { type: 'insert', key: 30 },
      { type: 'delete', key: 20 },
      { type: 'delete', key: 50 },
    ]);
    const seen = new Set(bstTrace(ops).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(bstPseudocode.map((_, i) => i));
  });
});
