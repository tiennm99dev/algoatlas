import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  MAX_OPS,
  avlPseudocode,
  avlTrace,
  balanceOf,
  inorderKeys,
  makeOps,
} from './avl-trees.js';

/** @typedef {import('./avl-trees.js').AvlFrame} Frame */
/** @typedef {import('./avl-trees.js').AvlOp} Op */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} keys @returns {Op[]} */
const inserts = (...keys) => keys.map((key) => ({ type: 'insert', key }));
/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));
/** @param {Frame[]} frames */
const cases = (frames) => frames.filter((f) => f.kind === 'unbalanced').map((f) => f.imbalance);

/** Every node: ordered, heights correct, balance within one. @param {Frame} f */
function assertAvl(f) {
  /** @param {number} s @param {number} lo @param {number} hi @returns {number} */
  const check = (s, lo, hi) => {
    if (s === -1) return 0;
    const n = f.nodes[s];
    const key = /** @type {number} */ (n.key);
    expect(key).toBeGreaterThan(lo);
    expect(key).toBeLessThan(hi);
    const l = check(n.left, lo, key);
    const r = check(n.right, key, hi);
    expect(Math.abs(l - r)).toBeLessThanOrEqual(1);
    expect(n.height).toBe(1 + Math.max(l, r));
    return 1 + Math.max(l, r);
  };
  check(f.root, -Infinity, Infinity);
}

describe('avl trace', () => {
  it('starts empty and ends on done', () => {
    const frames = avlTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].root).toBe(-1);
  });

  it('fixes each of the four cases with the matching rotations', () => {
    expect(cases(avlTrace(makeOps('ll')))).toEqual(['LL']);
    expect(cases(avlTrace(makeOps('rr')))).toEqual(['RR']);
    expect(cases(avlTrace(makeOps('lr')))).toEqual(['LR']);
    expect(cases(avlTrace(makeOps('rl')))).toEqual(['RL']);
    for (const preset of /** @type {const} */ (['ll', 'rr', 'lr', 'rl'])) {
      const f = last(avlTrace(makeOps(preset)));
      expect(f.height).toBe(2);
      expect(inorderKeys(f)).toEqual([10, 20, 30]);
      expect(f.nodes[f.root].key).toBe(20);
    }
    expect(last(avlTrace(makeOps('ll'))).rotations).toBe(1);
    expect(last(avlTrace(makeOps('lr'))).rotations).toBe(2);
  });

  it('marks the first half of a double rotation', () => {
    const rotates = avlTrace(makeOps('rl')).filter((f) => f.kind === 'rotate');
    expect(rotates.map((f) => f.direction)).toEqual(['right', 'left']);
    expect(rotates.map((f) => f.prepares)).toEqual([true, false]);
  });

  it('searches without changing anything and counts comparisons', () => {
    const frames = avlTrace([...inserts(20, 10, 30), { type: 'search', key: 30 }]);
    const found = /** @type {Frame} */ (frames.find((f) => f.kind === 'found'));
    expect(found.comparisons).toBe(2);
    expect(last(frames).size).toBe(3);
  });

  it('reports a missing key and ignores a duplicate', () => {
    const miss = avlTrace([...inserts(20), { type: 'search', key: 5 }]);
    expect(miss.some((f) => f.kind === 'missing')).toBe(true);
    const gone = avlTrace([...inserts(20), { type: 'delete', key: 5 }]);
    expect(gone.some((f) => f.kind === 'missing')).toBe(true);
    expect(last(gone).size).toBe(1);
    const dup = avlTrace(inserts(20, 20));
    expect(dup.some((f) => f.kind === 'dup')).toBe(true);
    expect(last(dup).size).toBe(1);
  });

  it('deletes a leaf, a one-child node, a two-child node and the last node', () => {
    const base = inserts(20, 10, 30, 25);
    expect(inorderKeys(last(avlTrace([...base, { type: 'delete', key: 10 }])))).toEqual([
      20, 25, 30,
    ]);
    expect(inorderKeys(last(avlTrace([...base, { type: 'delete', key: 30 }])))).toEqual([
      10, 20, 25,
    ]);
    const two = avlTrace([...base, { type: 'delete', key: 20 }]);
    expect(two.some((f) => f.kind === 'copy')).toBe(true);
    expect(inorderKeys(last(two))).toEqual([10, 25, 30]);
    const none = last(avlTrace([...inserts(5), { type: 'delete', key: 5 }]));
    expect(none.root).toBe(-1);
    expect(none.size).toBe(0);
  });

  it('rebalances at two levels on the cascading delete', () => {
    const ops = makeOps('cascade');
    const frames = avlTrace(ops);
    const before = last(avlTrace(ops.slice(0, -1)));
    expect(before.height).toBe(5);
    expect(before.size).toBe(12);
    const fixes = frames.filter((f) => f.kind === 'unbalanced' && f.opIndex === ops.length - 1);
    expect(fixes.length).toBe(2);
    expect(fixes.map((f) => f.nodes[f.current].key)).toEqual([70, 50]);
    expect(last(frames).rotations - before.rotations).toBe(3);
    assertAvl(last(frames));
  });

  it('rebalances at most once on any insert', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rand = seeded(seed);
      /** @type {Op[]} */
      const ops = [];
      for (let i = 0; i < MAX_NODES; i++)
        ops.push({ type: 'insert', key: Math.floor(rand() * 100) });
      const frames = avlTrace(ops);
      for (let i = 0; i < ops.length; i++) {
        expect(
          frames.filter((f) => f.opIndex === i && f.kind === 'unbalanced').length,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it('agrees with a sorted set and keeps every invariant on random logs', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rand = seeded(seed);
      const set = new Set();
      /** @type {Op[]} */
      const ops = [];
      for (let i = 0; i < 40; i++) {
        const key = Math.floor(rand() * 25);
        const roll = rand();
        const type = roll < 0.55 ? 'insert' : roll < 0.8 ? 'delete' : 'search';
        ops.push({ type, key });
        if (type === 'insert') set.add(key);
        if (type === 'delete') set.delete(key);
        const f = last(avlTrace(ops));
        expect(inorderKeys(f)).toEqual([...set].sort((a, b) => a - b));
        assertAvl(f);
      }
    }
  });

  it('keeps the search order sorted through every rotation', () => {
    for (const f of avlTrace(makeOps('sorted')).filter((x) => x.kind === 'rotate')) {
      const keys = inorderKeys(f);
      expect(keys).toEqual([...keys].sort((a, b) => a - b));
    }
  });

  it('shows the factor at 2 on an unbalanced frame', () => {
    const f = /** @type {Frame} */ (avlTrace(makeOps('ll')).find((x) => x.kind === 'unbalanced'));
    expect(balanceOf(f.nodes, f.current)).toBe(2);
  });

  it('stays under the frame budget at the log cap', () => {
    const rand = seeded(9);
    /** @type {Op[]} */
    const ops = [];
    /** @type {number[]} */
    const held = [];
    for (let i = 0; i < MAX_OPS; i++) {
      if (held.length < MAX_NODES && (i < MAX_NODES || rand() < 0.3)) {
        const key = held.length * 5 + 1;
        held.push(key);
        ops.push({ type: 'insert', key });
      } else {
        ops.push({ type: 'delete', key: /** @type {number} */ (held.pop()) });
      }
    }
    expect(avlTrace(ops).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = avlTrace(inserts(1, 2, 3));
    const before = JSON.stringify(frames[3]);
    frames[2].nodes[0].key = 99;
    frames[2].path.push(99);
    frames[2].lines.push(99);
    expect(JSON.stringify(frames[3])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across the presets', () => {
    const seen = new Set(
      /** @type {const} */ (['ll', 'rr', 'lr', 'rl', 'cascade']).flatMap((p) =>
        avlTrace(makeOps(p)).flatMap((f) => f.lines),
      ),
    );
    avlPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});

describe('numbers the practice questions rely on', () => {
  it('the left-right example', () => {
    const frames = avlTrace(inserts(40, 20, 60, 10, 30, 25));
    const f = /** @type {Frame} */ (frames.find((x) => x.kind === 'unbalanced'));
    expect(f.nodes[f.current].key).toBe(40);
    expect(balanceOf(f.nodes, f.current)).toBe(2);
    expect(f.imbalance).toBe('LR');
    const end = last(frames);
    expect(end.nodes[end.root].key).toBe(30);
  });

  it('ten sorted keys', () => {
    const f = last(avlTrace(makeOps('sorted')));
    expect(f.rotations).toBe(6);
    expect(f.height).toBe(4);
  });

  it('the fewest keys for each height follow the recurrence', () => {
    /** @type {Record<number, number>} */
    const fewest = { 0: 0, 1: 1 };
    for (let h = 2; h <= 6; h++) fewest[h] = fewest[h - 1] + fewest[h - 2] + 1;
    expect(fewest[5]).toBe(12);
    expect(fewest[6]).toBe(20);
  });
});
