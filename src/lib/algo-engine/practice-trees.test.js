import { describe, expect, it } from 'vitest';
import {
  MAX_SLOTS,
  PRESETS,
  PRESET_TEXT,
  defaultPicks,
  formatKeys,
  inorder,
  isBst,
  lcaByParents,
  lcaPseudocode,
  lcaTrace,
  parseKeys,
  validatePseudocode,
  validateTrace,
} from './practice-trees.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./practice-trees.js').KeySlots} KeySlots */

/** @template T @param {T[]} frames @returns {T} */
const last = (frames) => /** @type {T} */ (frames.at(-1));

/** @param {string} text @returns {KeySlots} */
function tree(text) {
  const r = parseKeys(text);
  if ('error' in r) throw new Error(r.error);
  return r.slots;
}

/** Random shape with distinct random keys, often not a BST. @param {() => number} rand @returns {KeySlots} */
function randomTree(rand) {
  const pool = Array.from({ length: 100 }, (_, i) => i).sort(() => rand() - 0.5);
  /** @type {KeySlots} */
  const s = [pool[0]];
  for (let i = 1; i < MAX_SLOTS; i++)
    s.push(s[Math.floor((i - 1) / 2)] !== null && rand() < 0.65 ? pool[i] : null);
  return s;
}

/** Random BST built by inserting distinct keys, kept only if it fits the 15 slots. @param {() => number} rand @returns {KeySlots} */
function randomBst(rand) {
  for (;;) {
    /** @type {KeySlots} */
    const s = Array(MAX_SLOTS).fill(null);
    const keys = new Set();
    const count = 3 + Math.floor(rand() * 6);
    while (keys.size < count) keys.add(Math.floor(rand() * 100));
    let fits = true;
    for (const k of keys) {
      let i = 0;
      while (i < MAX_SLOTS && s[i] !== null)
        i = k < /** @type {number} */ (s[i]) ? 2 * i + 1 : 2 * i + 2;
      if (i >= MAX_SLOTS) fits = false;
      else s[i] = k;
    }
    if (fits) return s;
  }
}

/** Oracle by the definition: every key in the left subtree is smaller, every key right larger. @param {KeySlots} s */
function oracleBst(s) {
  /** @param {number} i @returns {number[]} */
  const keysUnder = (i) =>
    i >= s.length || s[i] === null
      ? []
      : [/** @type {number} */ (s[i]), ...keysUnder(2 * i + 1), ...keysUnder(2 * i + 2)];
  return s.every(
    (k, i) =>
      k === null ||
      (keysUnder(2 * i + 1).every((x) => x < k) && keysUnder(2 * i + 2).every((x) => x > k)),
  );
}

/** The parent-only check, written plainly. @param {KeySlots} s */
const oracleLocal = (s) =>
  s.every((k, i) => {
    if (k === null) return true;
    const l = s[2 * i + 1];
    const r = s[2 * i + 2];
    return (l === undefined || l === null || l < k) && (r === undefined || r === null || r > k);
  });

describe('BST validation trace', () => {
  it('agrees with the definition (range) and with the parent-only rule (local)', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const s = seed % 2 ? randomTree(seeded(seed)) : randomBst(seeded(seed));
      expect(last(validateTrace(s, 'range')).result).toBe(oracleBst(s));
      expect(last(validateTrace(s, 'local')).result).toBe(oracleLocal(s));
      expect(isBst(s)).toBe(oracleBst(s));
    }
  });

  it('catches the trap that the parent-only check misses', () => {
    const s = tree(PRESET_TEXT.trap);
    const range = last(validateTrace(s, 'range'));
    expect(range.result).toBe(false);
    expect(s[range.bad]).toBe(60);
    expect(range.bounds[range.bad]).toEqual({ lo: 30, hi: 50 });
    expect(last(validateTrace(s, 'local')).result).toBe(true);
    const deep = tree(PRESET_TEXT['deep-trap']);
    expect(deep[last(validateTrace(deep, 'range')).bad]).toBe(15);
    expect(last(validateTrace(deep, 'local')).result).toBe(true);
  });

  it('fails both checks on swapped children', () => {
    const s = tree(PRESET_TEXT.swapped);
    expect(s[last(validateTrace(s, 'local')).bad]).toBe(70);
    expect(s[last(validateTrace(s, 'range')).bad]).toBe(80);
  });

  it('checks every node of a valid tree with two comparisons each', () => {
    const s = tree(PRESET_TEXT.valid);
    const end = last(validateTrace(s, 'range'));
    expect(end.result).toBe(true);
    expect(end.comparisons).toBe(14);
    expect(end.status.filter((x) => x === 'ok')).toHaveLength(7);
    expect(last(validateTrace(s, 'local')).comparisons).toBe(6);
    expect(end.bounds[5]).toEqual({ lo: 50, hi: 70 });
  });

  it('stops at the first failure', () => {
    const frames = validateTrace(tree(PRESET_TEXT.trap), 'range');
    const fail = frames.findIndex((f) => f.kind === 'fail');
    expect(frames.slice(fail + 1).map((f) => f.kind)).toEqual(['done']);
  });

  it('handles a single node', () => {
    const frames = validateTrace(tree('7'), 'range');
    expect(last(frames).result).toBe(true);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'enter',
      'go-left',
      'empty',
      'go-right',
      'empty',
      'done',
    ]);
  });

  it('does not alias frames', () => {
    const frames = validateTrace(tree(PRESET_TEXT.valid), 'range');
    const before = JSON.stringify(frames[3]);
    frames[2].status[0] = 'bad';
    frames[2].stack.push(9);
    const b = frames[2].bounds[0];
    if (b) b.lo = 1;
    expect(JSON.stringify(frames[3])).toBe(before);
  });

  it('stays small at the cap', () => {
    expect(validateTrace(tree(PRESET_TEXT.big), 'range').length).toBeLessThan(80);
  });
});

describe('lowest common ancestor walk', () => {
  it('matches the parent-link answer on random BSTs for every pair', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = randomBst(seeded(seed));
      const keys = s.filter((k) => k !== null);
      for (const p of keys)
        for (const q of keys) {
          const end = last(lcaTrace(s, p, q));
          expect(end.answer).toBe(lcaByParents(s, p, q));
        }
    }
  });

  it('splits at the right node on the presets', () => {
    const v = tree(PRESET_TEXT.valid);
    expect(v[last(lcaTrace(v, 20, 40)).answer]).toBe(30);
    expect(v[last(lcaTrace(v, 40, 60)).answer]).toBe(50);
    const big = tree(PRESET_TEXT.big);
    const end = last(lcaTrace(big, 54, 78));
    expect(big[end.answer]).toBe(72);
    expect(end.path).toHaveLength(2);
    const own = last(lcaTrace(big, 30, 36));
    expect(big[own.answer]).toBe(36);
    expect(own.path.map((i) => big[i])).toEqual([48, 24, 36]);
  });

  it('can go wrong on a tree that is not a BST', () => {
    const s = tree(PRESET_TEXT.trap);
    expect(s[last(lcaTrace(s, 20, 60)).answer]).toBe(50);
    expect(s[lcaByParents(s, 20, 60)]).toBe(30);
  });

  it('reports falling off when a key is missing', () => {
    const frames = lcaTrace(tree(PRESET_TEXT.valid), 10, 15);
    expect(frames.map((f) => f.kind)).toContain('fell-off');
    expect(last(frames).answer).toBe(-1);
  });
});

describe('keys text and helpers', () => {
  it('parses, refuses and round-trips', () => {
    expect(tree('5 3 - 1')).toEqual([5, 3, null, 1]);
    expect(formatKeys([5, 3, null, 1])).toBe('5, 3, -, 1');
    expect(parseKeys('')).toEqual({ error: 'empty' });
    expect(parseKeys('5 100')).toEqual({ error: 'format' });
    expect(parseKeys('5 x')).toEqual({ error: 'format' });
    expect(parseKeys('5 3 3')).toEqual({ error: 'duplicate' });
    expect(parseKeys('5 - 7 1')).toEqual({ error: 'orphan' });
    expect(parseKeys(Array.from({ length: 16 }, (_, i) => i).join(' '))).toEqual({
      error: 'count',
    });
    for (const p of PRESETS) expect('slots' in parseKeys(PRESET_TEXT[p])).toBe(true);
  });

  it('lists inorder and picks two leaves', () => {
    const v = tree(PRESET_TEXT.valid);
    expect(inorder(v).map((i) => v[i])).toEqual([20, 30, 40, 50, 60, 70, 80]);
    expect(defaultPicks(v)).toEqual([20, 40]);
    expect(defaultPicks(tree('5'))).toEqual([5, 5]);
    expect(defaultPicks(tree('5 3'))).toEqual([5, 3]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of both checks and the walk', () => {
    for (const method of /** @type {const} */ (['range', 'local'])) {
      const seen = new Set(
        [PRESET_TEXT.valid, PRESET_TEXT.swapped].flatMap((t) =>
          validateTrace(tree(t), method).flatMap((f) => f.lines),
        ),
      );
      expect([...seen].sort((a, b) => a - b)).toEqual(validatePseudocode[method].map((_, i) => i));
    }
    const v = tree(PRESET_TEXT.valid);
    const seen = new Set(
      [lcaTrace(v, 20, 40), lcaTrace(v, 60, 80)].flatMap((fs) => fs.flatMap((f) => f.lines)),
    );
    expect([...seen].sort((a, b) => a - b)).toEqual(lcaPseudocode.map((_, i) => i));
  });
});
