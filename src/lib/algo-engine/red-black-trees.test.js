import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  MAX_OPS,
  blackHeightOf,
  checkRules,
  inorderKeys,
  makeOps,
  redBlackPseudocode,
  redBlackTrace,
} from './red-black-trees.js';

/** @typedef {import('./red-black-trees.js').RbFrame} Frame */
/** @typedef {import('./red-black-trees.js').RbOp} Op */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} keys @returns {Op[]} */
const inserts = (...keys) => keys.map((key) => ({ type: 'insert', key }));
/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));
/** @param {Frame[]} frames @param {Frame['kind']} kind */
const has = (frames, kind) => frames.some((f) => f.kind === kind);

/** Independent walk: BST order, no red-red, one black count on every path. @param {Frame} f */
function assertRedBlack(f) {
  if (f.root === -1) return;
  expect(f.nodes[f.root].color).toBe('black');
  /** @param {number} s @param {number} lo @param {number} hi @returns {number} */
  const check = (s, lo, hi) => {
    if (s === -1) return 1;
    const n = f.nodes[s];
    expect(n.key).toBeGreaterThan(lo);
    expect(n.key).toBeLessThan(hi);
    if (n.color === 'red') {
      for (const c of [n.left, n.right]) if (c !== -1) expect(f.nodes[c].color).toBe('black');
    }
    const l = check(n.left, lo, n.key);
    const r = check(n.right, n.key, hi);
    expect(l).toBe(r);
    return l + (n.color === 'black' ? 1 : 0);
  };
  const paths = check(f.root, -Infinity, Infinity);
  // The count from the root includes the root itself; black height leaves it out.
  expect(blackHeightOf(f.nodes, f.root)).toBe(paths - 1);
}

describe('red-black trace', () => {
  it('starts empty and ends on done', () => {
    const frames = redBlackTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].blackHeight).toBe(0);
  });

  it('paints a lone root black', () => {
    const frames = redBlackTrace(inserts(5));
    expect(/** @type {Frame} */ (frames.find((f) => f.kind === 'attach')).nodes[0].color).toBe(
      'red',
    );
    expect(has(frames, 'paint-root')).toBe(true);
    const end = last(frames);
    expect(end.nodes[0].color).toBe('black');
    expect(end.blackHeight).toBe(1);
    expect(end.recolours).toBe(1);
  });

  it('recolours when the uncle is red and rotates nothing', () => {
    const frames = redBlackTrace(makeOps('uncle'));
    expect(has(frames, 'recolour-uncle')).toBe(true);
    const end = last(frames);
    expect(end.rotations).toBe(0);
    expect(end.recolours).toBe(5);
    expect(end.blackHeight).toBe(2);
  });

  it('straightens an inner child before the outer rotation', () => {
    const frames = redBlackTrace(makeOps('inner'));
    const kinds = frames.map((f) => f.kind);
    expect(kinds.indexOf('rotate-inner')).toBeGreaterThan(-1);
    expect(kinds.indexOf('rotate-inner')).toBeLessThan(kinds.indexOf('recolour-outer'));
    const end = last(frames);
    expect(end.rotations).toBe(2);
    expect(end.nodes[end.root].key).toBe(20);
  });

  it('shows the red-red violation before the repair and clears it after', () => {
    const frames = redBlackTrace(makeOps('outer'));
    const broken = /** @type {Frame} */ (frames.find((f) => f.kind === 'red-red'));
    expect(broken.rules.noRedRed).toBe(false);
    expect(last(frames).rules).toEqual({ rootBlack: true, noRedRed: true, sameBlack: true });
    expect(last(frames).rotations).toBe(1);
    expect(last(frames).recolours).toBe(3);
  });

  it('reports a broken root on the frame before it is painted', () => {
    const frames = redBlackTrace(makeOps('uncle'));
    const fix = /** @type {Frame} */ (frames.find((f) => f.kind === 'recolour-uncle'));
    expect(fix.rules.rootBlack).toBe(false);
  });

  it('matches the textbook example', () => {
    const end = last(redBlackTrace(makeOps('clrs')));
    expect(end.nodes[end.root].key).toBe(7);
    expect(inorderKeys(end)).toEqual([1, 2, 4, 5, 7, 8, 11, 14, 15]);
    expect(end.blackHeight).toBe(2);
    expect(end.height).toBe(4);
    expect(end.rotations).toBe(2);
  });

  it('searches without changing anything and ignores a duplicate', () => {
    const frames = redBlackTrace([...inserts(20, 10), { type: 'search', key: 10 }]);
    const found = /** @type {Frame} */ (frames.find((f) => f.kind === 'found'));
    expect(found.comparisons).toBe(2);
    expect(has(redBlackTrace([...inserts(20), { type: 'search', key: 1 }]), 'missing')).toBe(true);
    const dup = redBlackTrace(inserts(20, 20));
    expect(has(dup, 'dup')).toBe(true);
    expect(last(dup).size).toBe(1);
  });

  it('agrees with a sorted set, keeps every rule and rotates at most twice per insert', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rand = seeded(seed);
      const set = new Set();
      /** @type {Op[]} */
      const ops = [];
      for (let i = 0; i < 30; i++) {
        const key = Math.floor(rand() * 100);
        const type = rand() < 0.85 ? 'insert' : 'search';
        ops.push({ type, key });
        if (type === 'insert') set.add(key);
        const frames = redBlackTrace(ops);
        const end = last(frames);
        expect(inorderKeys(end)).toEqual([...set].sort((a, b) => a - b));
        assertRedBlack(end);
        expect(end.height).toBeLessThanOrEqual(2 * Math.log2(end.size + 1));
        const during = frames.filter((f) => f.opIndex === i);
        const start = during.length ? during[0].rotations : 0;
        const finish = during.length ? /** @type {Frame} */ (during.at(-1)).rotations : 0;
        expect(finish - start).toBeLessThanOrEqual(2);
      }
    }
  });

  it('handles sorted and reversed input', () => {
    for (const keys of [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    ]) {
      const end = last(redBlackTrace(inserts(...keys)));
      assertRedBlack(end);
      expect(end.size).toBe(15);
    }
  });

  it('stays under the frame budget at the log cap', () => {
    const keys = Array.from({ length: MAX_NODES }, (_, i) => i);
    /** @type {Op[]} */
    const ops = [
      ...inserts(...keys),
      ...Array.from({ length: MAX_OPS - MAX_NODES }, () => ({
        type: /** @type {const} */ ('search'),
        key: 14,
      })),
    ];
    expect(redBlackTrace(ops).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = redBlackTrace(inserts(1, 2, 3));
    const i = frames.findIndex((f) => f.kind === 'red-red');
    const before = JSON.stringify(frames[i + 1]);
    frames[i].nodes[0].key = 99;
    frames[i].path.push(99);
    frames[i].lines.push(99);
    expect(JSON.stringify(frames[i + 1])).toBe(before);
  });

  it('checks rules on a hand-made bad tree', () => {
    /** @type {import('./red-black-trees.js').RbNode[]} */
    const nodes = [
      { key: 2, color: 'black', left: 1, right: -1, parent: -1 },
      { key: 1, color: 'black', left: -1, right: -1, parent: 0 },
    ];
    expect(checkRules(nodes, 0).sameBlack).toBe(false);
    expect(blackHeightOf(nodes, 0)).toBe(-1);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line on the textbook example', () => {
    const seen = new Set(redBlackTrace(makeOps('clrs')).flatMap((f) => f.lines));
    redBlackPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});

describe('numbers the practice questions rely on', () => {
  it('seven sorted keys', () => {
    const end = last(redBlackTrace(inserts(1, 2, 3, 4, 5, 6, 7)));
    expect(end.height).toBe(4);
    expect(end.blackHeight).toBe(2);
    expect(end.rotations).toBe(3);
    expect(end.nodes[end.root].key).toBe(2);
  });
});
