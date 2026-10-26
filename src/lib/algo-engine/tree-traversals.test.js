import { describe, expect, it } from 'vitest';
import {
  MAX_SLOTS,
  ORDERS,
  PRESETS,
  PRESET_TEXT,
  formatTree,
  parseTree,
  traversalOrder,
  traversalPseudocode,
  traversalTrace,
} from './tree-traversals.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./tree-traversals.js').Slots} Slots */
/** @typedef {import('./tree-traversals.js').TraversalFrame} TraversalFrame */

/** @param {TraversalFrame[]} frames */
const last = (frames) => /** @type {TraversalFrame} */ (frames.at(-1));

/** @param {string} text @returns {Slots} */
function tree(text) {
  const r = parseTree(text);
  if ('error' in r) throw new Error(r.error);
  return r.slots;
}

/** @param {Slots} slots @param {number[]} order */
const labels = (slots, order) => order.map((i) => slots[i]).join(' ');

/** A random valid tree in array order. @param {() => number} rand @returns {Slots} */
function randomTree(rand) {
  /** @type {Slots} */
  const slots = ['n0'];
  for (let i = 1; i < MAX_SLOTS; i++)
    slots.push(slots[Math.floor((i - 1) / 2)] !== null && rand() < 0.6 ? `n${i}` : null);
  return slots;
}

/** Independent oracle on an explicit node structure. @param {Slots} s @param {string} order */
function oracle(s, order) {
  /** @typedef {{ v: string, l: any, r: any } | null} N */
  /** @param {number} i @returns {N} */
  const build = (i) =>
    i < s.length && s[i] !== null
      ? { v: String(s[i]), l: build(2 * i + 1), r: build(2 * i + 2) }
      : null;
  const root = build(0);
  /** @type {string[]} */
  const out = [];
  /** @param {N} n @returns {void} */
  const pre = (n) => {
    if (!n) return;
    out.push(n.v);
    pre(n.l);
    pre(n.r);
  };
  /** @param {N} n @returns {void} */
  const ino = (n) => {
    if (!n) return;
    ino(n.l);
    out.push(n.v);
    ino(n.r);
  };
  /** @param {N} n @returns {void} */
  const post = (n) => {
    if (!n) return;
    post(n.l);
    post(n.r);
    out.push(n.v);
  };
  if (order === 'pre') pre(root);
  else if (order === 'in') ino(root);
  else if (order === 'post') post(root);
  else {
    const q = [root];
    while (q.length) {
      const n = q.shift();
      if (!n) continue;
      out.push(n.v);
      q.push(n.l, n.r);
    }
  }
  return out.join(' ');
}

describe('iterative traversal trace', () => {
  it('matches recursive traversals on random trees for all four orders', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const slots = randomTree(seeded(seed));
      for (const order of ORDERS) {
        const end = last(traversalTrace(slots, order));
        expect(labels(slots, end.output)).toBe(oracle(slots, order));
        expect(end.output).toEqual(traversalOrder(slots, order));
        expect(end.work).toEqual([]);
      }
    }
  });

  it('reads the expression tree as prefix, infix and postfix', () => {
    const s = tree(PRESET_TEXT.expression);
    const out = (/** @type {import('./tree-traversals.js').TraversalOrder} */ o) =>
      labels(s, last(traversalTrace(s, o)).output);
    expect(out('pre')).toBe('× + a b − c d');
    expect(out('in')).toBe('a + b × c − d');
    expect(out('post')).toBe('a b + c d − ×');
    expect(out('level')).toBe('× + − a b c d');
  });

  it('numbers each node with its visit position', () => {
    const s = tree(PRESET_TEXT.letters);
    const end = last(traversalTrace(s, 'in'));
    expect(labels(s, end.output)).toBe('D B E A C F');
    end.output.forEach((slot, k) => expect(end.number[slot]).toBe(k + 1));
  });

  it('counts one push and one pop per item: 2n for the stack, n for the queue', () => {
    const s = tree(PRESET_TEXT.perfect);
    for (const order of /** @type {const} */ (['pre', 'in', 'post'])) {
      const end = last(traversalTrace(s, order));
      expect(end.pushes).toBe(30);
      expect(end.pops).toBe(30);
    }
    const level = last(traversalTrace(s, 'level'));
    expect(level.pushes).toBe(15);
    expect(level.pops).toBe(15);
    expect(level.peak).toBe(8);
  });

  it('grows the stack with the height on a chain', () => {
    const s = tree(PRESET_TEXT.chain);
    expect(last(traversalTrace(s, 'post')).peak).toBe(4);
    expect(last(traversalTrace(s, 'level')).peak).toBe(1);
  });

  it('handles a single node', () => {
    const frames = traversalTrace(tree('A'), 'pre');
    expect(frames.map((f) => f.kind)).toEqual(['start', 'expand', 'visit', 'done']);
    const level = traversalTrace(tree('A'), 'level');
    expect(level.map((f) => f.kind)).toEqual(['start', 'visit', 'done']);
  });

  it('does not alias frames', () => {
    const frames = traversalTrace(tree(PRESET_TEXT.letters), 'pre');
    const before = JSON.stringify(frames[2]);
    frames[1].work.push({ slot: 9, visit: true });
    frames[1].output.push(9);
    frames[1].number[0] = 99;
    if (frames[1].work[0]) frames[1].work[0].slot = 7;
    expect(JSON.stringify(frames[2])).toBe(before);
  });
});

describe('tree text', () => {
  it('parses array order with gaps and round-trips', () => {
    const s = tree('A B - C');
    expect(s).toEqual(['A', 'B', null, 'C']);
    expect(formatTree(s)).toBe('A, B, -, C');
    expect(tree('A, B, -, -, -')).toEqual(['A', 'B']);
  });

  it('refuses bad trees', () => {
    expect(parseTree('')).toEqual({ error: 'empty' });
    expect(parseTree('- A')).toEqual({ error: 'orphan' });
    expect(parseTree('A - B C')).toEqual({ error: 'orphan' });
    expect(parseTree('A B A')).toEqual({ error: 'duplicate' });
    expect(parseTree('A BCD')).toEqual({ error: 'format' });
    expect(parseTree(Array.from({ length: 16 }, (_, i) => `n${i}`).join(' '))).toEqual({
      error: 'count',
    });
  });

  it('keeps every preset valid', () => {
    for (const p of PRESETS) expect('slots' in parseTree(PRESET_TEXT[p])).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line for every order', () => {
    for (const order of ORDERS) {
      const seen = new Set(
        traversalTrace(tree(PRESET_TEXT.letters), order).flatMap((f) => f.lines),
      );
      expect([...seen].sort((a, b) => a - b)).toEqual(traversalPseudocode[order].map((_, i) => i));
    }
  });
});
