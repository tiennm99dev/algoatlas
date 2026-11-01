import { describe, expect, it } from 'vitest';
import {
  MAX_KEYS,
  heightOf,
  inorderKeys,
  makeKeys,
  parseKeys,
  whyBalancePseudocode,
  whyBalanceTrace,
} from './why-balance-matters.js';

/** @typedef {import('./why-balance-matters.js').WhyBalanceFrame} Frame */
/** @typedef {import('./why-balance-matters.js').BalanceNode} Node */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));

/** @param {Node | null} node @returns {boolean} */
function balanced(node) {
  if (!node) return true;
  return (
    Math.abs(heightOf(node.left) - heightOf(node.right)) <= 1 &&
    balanced(node.left) &&
    balanced(node.right)
  );
}

/** Shape of the plain tree, built by an independent recursive insert. */
/** @param {number[]} keys */
function oracleHeight(keys) {
  /** @typedef {{k: number, l: any, r: any}} O */
  /** @type {O | null} */
  let root = null;
  let total = 0;
  /** @param {O | null} n @param {number} k @returns {O} */
  const add = (n, k) => {
    if (!n) return { k, l: null, r: null };
    total++;
    if (k < n.k) n.l = add(n.l, k);
    else n.r = add(n.r, k);
    return n;
  };
  for (const k of keys) root = add(root, k);
  /** @param {O | null} n @returns {number} */
  const h = (n) => (n ? 1 + Math.max(h(n.l), h(n.r)) : 0);
  return { height: h(root), total };
}

describe('why balance matters trace', () => {
  it('starts empty and ends with both trees holding the sorted keys', () => {
    const frames = whyBalanceTrace([5, 2, 8]);
    expect(frames[0].kind).toBe('start');
    expect(frames[0].plain).toBeNull();
    expect(last(frames).kind).toBe('done');
    expect(inorderKeys(last(frames).plain)).toEqual([2, 5, 8]);
    expect(inorderKeys(last(frames).avl)).toEqual([2, 5, 8]);
  });

  it('handles an empty list and a single key', () => {
    expect(whyBalanceTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    const one = last(whyBalanceTrace([7]));
    expect(one.plainHeight).toBe(1);
    expect(one.avlHeight).toBe(1);
    expect(one.plainComparisons).toBe(0);
    expect(one.idealHeight).toBe(1);
  });

  it('ignores a repeated key', () => {
    const f = last(whyBalanceTrace([4, 4, 2, 4]));
    expect(f.count).toBe(2);
    expect(inorderKeys(f.avl)).toEqual([2, 4]);
  });

  it('turns sorted keys into a list in the plain tree but not in the AVL tree', () => {
    const f = last(whyBalanceTrace([1, 2, 3, 4, 5, 6, 7]));
    expect(f.plainHeight).toBe(7);
    expect(f.avlHeight).toBe(3);
    expect(f.idealHeight).toBe(3);
    expect(f.plainComparisons).toBe(21);
    expect(f.rotations).toBe(4);
  });

  it('spends no rotation when the input already builds a perfect tree', () => {
    const f = last(whyBalanceTrace(makeKeys('balanced')));
    expect(f.plainHeight).toBe(4);
    expect(f.avlHeight).toBe(4);
    expect(f.rotations).toBe(0);
    expect(f.plainComparisons).toBe(f.avlComparisons);
  });

  it('shows both halves of a double rotation', () => {
    const rotations = whyBalanceTrace([30, 10, 20])
      .filter((f) => f.kind === 'rotate')
      .map((f) => f.rotation);
    expect(rotations).toEqual([
      { direction: 'left', pivot: 10, up: 20, prepares: true },
      { direction: 'right', pivot: 30, up: 20, prepares: false },
    ]);
  });

  it('matches an independent plain BST and keeps the AVL invariant on random input', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rand = seeded(seed);
      /** @type {number[]} */
      const keys = [];
      while (keys.length < MAX_KEYS) {
        const k = Math.floor(rand() * 100);
        if (!keys.includes(k)) keys.push(k);
      }
      const frames = whyBalanceTrace(keys);
      const f = last(frames);
      const oracle = oracleHeight(keys);
      expect(f.plainHeight).toBe(oracle.height);
      expect(f.plainComparisons).toBe(oracle.total);
      expect(balanced(f.avl)).toBe(true);
      expect(inorderKeys(f.avl)).toEqual([...keys].sort((a, b) => a - b));
      expect(f.avlHeight).toBeLessThanOrEqual(1.4405 * Math.log2(keys.length + 2));
      for (const fr of frames) {
        if (fr.kind === 'rotate')
          expect(inorderKeys(fr.avl)).toEqual(inorderKeys(fr.avl).sort((a, b) => a - b));
      }
    }
  });

  it('stays under the frame budget at the size cap', () => {
    const keys = Array.from({ length: MAX_KEYS }, (_, i) => i);
    expect(whyBalanceTrace(keys).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = whyBalanceTrace([1, 2, 3]);
    const f = /** @type {Frame} */ (frames.find((x) => x.kind === 'insert-avl'));
    const next = frames[frames.indexOf(f) + 1];
    const before = JSON.stringify(next);
    /** @type {Node} */ (f.avl).key = 999;
    /** @type {Node} */ (f.plain).key = 999;
    f.lines.push(99);
    expect(JSON.stringify(next)).toBe(before);
  });
});

describe('key input', () => {
  it('parses separators and reports each problem', () => {
    expect(parseKeys('3, 1;2 4').keys).toEqual([3, 1, 2, 4]);
    expect(parseKeys('  ').error).toBe('empty');
    expect(parseKeys('1, x').error).toBe('format');
    expect(parseKeys('1, -2').error).toBe('format');
    expect(parseKeys('1, 100').error).toBe('range');
    expect(parseKeys('1, 1').error).toBe('duplicate');
    expect(parseKeys(Array.from({ length: 16 }, (_, i) => i).join(',')).error).toBe('count');
  });

  it('gives every preset unique keys within the limits', () => {
    for (const preset of /** @type {const} */ ([
      'sorted',
      'reversed',
      'zigzag',
      'balanced',
      'random',
    ])) {
      const keys = makeKeys(preset, seeded(3));
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys.length).toBeLessThanOrEqual(MAX_KEYS);
      expect(parseKeys(keys.join(',')).error).toBeNull();
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line on the sorted preset', () => {
    const seen = new Set(whyBalanceTrace(makeKeys('sorted')).flatMap((f) => f.lines));
    whyBalancePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});

describe('numbers the practice questions rely on', () => {
  const eight = last(whyBalanceTrace([10, 20, 30, 40, 50, 60, 70, 80]));
  it('eight sorted keys', () => {
    expect(eight.plainComparisons).toBe(28);
    expect(eight.plainHeight).toBe(8);
    expect(eight.avlHeight).toBe(4);
  });
  it('the balanced order of seven keys costs the same in both trees', () => {
    const f = last(whyBalanceTrace([4, 2, 6, 1, 3, 5, 7]));
    expect(f.plainComparisons).toBe(10);
    expect(f.avlComparisons).toBe(10);
    expect(f.rotations).toBe(0);
  });
});
