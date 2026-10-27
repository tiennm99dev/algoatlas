import { describe, expect, it } from 'vitest';
import {
  MAX_DEPTH,
  PRESETS,
  SLOTS,
  addChild,
  binaryTreePseudocode,
  binaryTreeTrace,
  emptySlots,
  isTree,
  makeTree,
  nextLabel,
  removeSubtree,
} from './binary-trees.js';
import { childrenOf, depthOf, lastFilled, parentOf } from '$lib/components/slot-tree.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./binary-trees.js').BinaryTreeFrame} BinaryTreeFrame */
/** @typedef {import('./binary-trees.js').Slots} Slots */

/** @param {BinaryTreeFrame[]} frames */
const last = (frames) => /** @type {BinaryTreeFrame} */ (frames.at(-1));

/** Oracle: height in edges by plain recursion, -1 for an empty subtree. @param {Slots} s @param {number} i @returns {number} */
const oracleHeight = (s, i) =>
  i >= SLOTS || s[i] === null
    ? -1
    : 1 + Math.max(oracleHeight(s, 2 * i + 1), oracleHeight(s, 2 * i + 2));

/** Oracle: complete by a level-order walk that may never see a node after a gap. @param {Slots} s */
function oracleComplete(s) {
  let gap = false;
  for (const v of s) {
    if (v === null) gap = true;
    else if (gap) return false;
  }
  return true;
}

/** Oracle: full means every node has zero or two children. @param {Slots} s */
const oracleFull = (s) => s.every((v, i) => v === null || childrenOf(s, i).length !== 1);

describe('binary tree measure trace', () => {
  it('sets depth from the slot and height by recursion on random trees', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const slots = makeTree('random', seeded(seed));
      const end = last(binaryTreeTrace(slots));
      slots.forEach((v, i) => {
        if (v === null) {
          expect(end.depth[i]).toBeNull();
          expect(end.height[i]).toBeNull();
        } else {
          expect(end.depth[i]).toBe(depthOf(i));
          expect(end.height[i]).toBe(oracleHeight(slots, i));
        }
      });
      expect(end.full).toBe(oracleFull(slots));
      expect(end.complete).toBe(oracleComplete(slots));
      const n = slots.filter((v) => v !== null).length;
      expect(end.size).toBe(n);
      expect(end.calls).toBe(n);
      expect(end.perfect).toBe(n === 2 ** (oracleHeight(slots, 0) + 1) - 1);
    }
  });

  it('classifies the presets', () => {
    /** @param {Slots} s */
    const props = (s) => {
      const f = last(binaryTreeTrace(s));
      return [f.full, f.complete, f.perfect];
    };
    expect(props(makeTree('complete'))).toEqual([false, true, false]);
    expect(props(makeTree('perfect'))).toEqual([true, true, true]);
    expect(props(makeTree('full'))).toEqual([true, false, false]);
    expect(props(makeTree('chain'))).toEqual([false, false, false]);
  });

  it('names the offending node and gap', () => {
    const frames = binaryTreeTrace(makeTree('complete'));
    expect(frames.find((f) => f.kind === 'full')?.offender).toBe(2);
    const chain = binaryTreeTrace(makeTree('chain'));
    expect(chain.find((f) => f.kind === 'complete')?.offender).toBe(1);
    const full = binaryTreeTrace(makeTree('full'));
    expect(full.find((f) => f.kind === 'complete')?.offender).toBe(3);
    expect(full.find((f) => f.kind === 'full')?.offender).toBe(-1);
  });

  it('handles the empty tree and a single node', () => {
    const empty = binaryTreeTrace(emptySlots());
    expect(empty.map((f) => f.kind)).toEqual(['start', 'full', 'complete', 'done']);
    expect(last(empty)).toMatchObject({ size: 0, full: true, complete: true, perfect: true });
    const one = emptySlots();
    one[0] = 'A';
    const frames = binaryTreeTrace(one);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'enter',
      'leaf',
      'full',
      'complete',
      'done',
    ]);
    expect(last(frames)).toMatchObject({ leaves: 1, arrayLength: 1, perfect: true });
  });

  it('counts leaves and the array length the chain wastes', () => {
    const end = last(binaryTreeTrace(makeTree('chain')));
    expect(end.size).toBe(4);
    expect(end.leaves).toBe(1);
    expect(end.arrayLength).toBe(15);
    expect(end.height[0]).toBe(3);
  });

  it('visits in preorder with a stack as deep as the current node', () => {
    const frames = binaryTreeTrace(makeTree('perfect'));
    const order = frames.filter((f) => f.kind === 'enter').map((f) => f.current);
    expect(order).toEqual([0, 1, 3, 4, 2, 5, 6]);
    for (const f of frames.filter((g) => g.kind === 'enter')) {
      expect(f.stack.length).toBe(depthOf(f.current) + 1);
      expect(f.stack.at(-1)).toBe(f.current);
    }
    expect(last(frames).stack).toEqual([]);
  });

  it('refuses a node without a parent', () => {
    const bad = emptySlots();
    bad[0] = 'A';
    bad[3] = 'D';
    expect(isTree(bad)).toBe(false);
    expect(() => binaryTreeTrace(bad)).toThrow();
  });

  it('does not alias frames', () => {
    const frames = binaryTreeTrace(makeTree('perfect'));
    const before = frames[3].depth.slice();
    frames[2].depth[0] = 99;
    frames[2].slots[0] = 'Z';
    frames[2].stack.push(42);
    expect(frames[3].depth).toEqual(before);
    expect(frames[3].slots[0]).toBe('A');
  });

  it('stays small at the cap', () => {
    const fullTree = makeTree('random', () => 0);
    expect(fullTree.every((v) => v !== null)).toBe(true);
    expect(binaryTreeTrace(fullTree).length).toBeLessThan(60);
  });
});

describe('editing the slot array', () => {
  it('adds children at 2i + 1 and 2i + 2 with the next free letter', () => {
    const r = addChild(emptySlots(), -1, 'left');
    if (!r.ok) throw new Error('root refused');
    expect(r.slots[0]).toBe('A');
    const l = addChild(r.slots, 0, 'right');
    if (!l.ok) throw new Error('child refused');
    expect(l.slots[2]).toBe('B');
    expect(nextLabel(l.slots)).toBe('C');
  });

  it('refuses a taken slot, a missing parent and a level past the limit', () => {
    const chain = makeTree('chain');
    expect(addChild(chain, 0, 'right')).toEqual({ ok: false, error: 'taken' });
    expect(addChild(chain, 1, 'left')).toEqual({ ok: false, error: 'missing' });
    expect(addChild(chain, 14, 'left')).toEqual({ ok: false, error: 'depth' });
    expect(addChild(chain, -1, 'left')).toEqual({ ok: false, error: 'missing' });
  });

  it('removes a whole subtree', () => {
    const next = removeSubtree(makeTree('perfect'), 1);
    expect(next.slice(0, 7)).toEqual(['A', null, 'C', null, null, 'F', 'G']);
    expect(isTree(next)).toBe(true);
    expect(lastFilled(removeSubtree(next, 0))).toBe(-1);
  });

  it('computes parent and children slots', () => {
    expect(parentOf(0)).toBe(-1);
    expect(parentOf(5)).toBe(2);
    expect(parentOf(6)).toBe(2);
    expect(depthOf(6)).toBe(2);
    expect(depthOf(7)).toBe(MAX_DEPTH);
  });

  it('builds valid trees for every preset', () => {
    for (const p of PRESETS)
      for (const seed of [1, 2, 3]) expect(isTree(makeTree(p, seeded(seed)))).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(binaryTreeTrace(makeTree('complete')).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(binaryTreePseudocode.map((_, i) => i));
  });
});
