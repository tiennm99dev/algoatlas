import { describe, expect, it } from 'vitest';
import {
  ELEMENT_BYTES,
  FIRST_BASE,
  GROWTHS,
  MAX_CAPACITY,
  MAX_PUSHES,
  MIN_CAPACITY,
  addressOf,
  arrayTrace,
  pushPseudocode,
  pushedValue,
} from './static-dynamic-arrays.js';

/** @typedef {import('./static-dynamic-arrays.js').Growth} Growth */
/** @typedef {import('./static-dynamic-arrays.js').ArrayFrame} ArrayFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Independent oracle: simulate the capacity only, adding size to the copy count whenever a
 * push finds the array full.
 * @param {Growth} growth @param {number} capacity @param {number} n
 */
function oracle(growth, capacity, n) {
  let cap = capacity;
  let size = 0;
  let copies = 0;
  let resizes = 0;
  let stored = 0;
  for (let k = 1; k <= n; k++) {
    if (size === cap) {
      if (growth === 'static') break;
      copies += size;
      resizes++;
      cap = growth === 'double' ? cap * 2 : cap + 1;
    }
    size++;
    stored++;
  }
  return { cap, size, copies, resizes, refused: n - stored };
}

/** @param {Growth} g @param {number} c @param {number} n */
const last = (g, c, n) => /** @type {ArrayFrame} */ (arrayTrace(g, c, n).at(-1));

const rand = seeded(11);
/** @type {[Growth, number, number][]} */
const cases = [
  ['double', 1, 0],
  ['double', 1, 1],
  ['double', 1, 17],
  ['double', 4, 4],
  ['double', 3, MAX_PUSHES],
  ['plus-one', 1, 8],
  ['plus-one', MAX_CAPACITY, MAX_PUSHES],
  ['static', 4, 3],
  ['static', 4, 4],
  ['static', 4, 9],
  ...Array.from({ length: 9 }, (_, i) => {
    const g = GROWTHS[i % 3];
    const c = MIN_CAPACITY + Math.floor(rand() * (MAX_CAPACITY - MIN_CAPACITY + 1));
    const n = Math.floor(rand() * (MAX_PUSHES + 1));
    return /** @type {[Growth, number, number]} */ ([g, c, n]);
  }),
];

describe('array pushes', () => {
  it.each(cases)('%s, capacity %i, %i pushes: matches the oracle', (g, c, n) => {
    const f = last(g, c, n);
    const o = oracle(g, c, n);
    expect(f.capacity).toBe(o.cap);
    expect(f.size).toBe(o.size);
    expect(f.copies).toBe(o.copies);
    expect(f.resizes).toBe(o.resizes);
    expect(f.refused).toBe(o.refused);
    expect(f.writes).toBe(o.size);
    expect(f.cells.slice(0, f.size)).toEqual(
      Array.from({ length: f.size }, (_, i) => pushedValue(i + 1)),
    );
    expect(f.cells.slice(f.size).every((v) => v === null)).toBe(true);
    expect(f.kind).toBe('done');
  });

  it('copies 1 + 2 + 4 + 8 + 16 = 31 elements for 17 doubling pushes from capacity 1', () => {
    const f = last('double', 1, 17);
    expect(f.copies).toBe(31);
    expect(f.capacity).toBe(32);
    expect(f.resizes).toBe(5);
  });

  it('copies 1 + 2 + … + 7 = 28 elements for 8 pushes that grow by one', () => {
    expect(last('plus-one', 1, 8).copies).toBe(28);
  });

  it('refuses the fifth push onto a static array of capacity 4 and stops', () => {
    const frames = arrayTrace('static', 4, 9);
    const full = frames.filter((f) => f.kind === 'full');
    expect(full).toHaveLength(1);
    expect(full[0].op).toBe(5);
    expect(full[0].refused).toBe(5);
    expect(frames.some((f) => f.kind === 'copy')).toBe(false);
  });

  it('copies element by element into a fresh block at a higher address', () => {
    const frames = arrayTrace('double', 2, 3);
    const alloc = /** @type {ArrayFrame} */ (frames.find((f) => f.kind === 'allocate'));
    expect(alloc.base).toBe(FIRST_BASE);
    expect(alloc.nextBase).toBeGreaterThanOrEqual(addressOf(FIRST_BASE, 2));
    expect(alloc.next).toEqual([null, null, null, null]);
    const copies = frames.filter((f) => f.kind === 'copy');
    expect(copies.map((f) => f.at)).toEqual([0, 1]);
    expect(copies[1].next).toEqual([10, 20, null, null]);
    const free = /** @type {ArrayFrame} */ (frames.find((f) => f.kind === 'free'));
    expect(free.base).toBe(alloc.nextBase);
    expect(free.next).toBeNull();
    expect(free.capacity).toBe(4);
  });

  it('places element i at base + 4i', () => {
    expect(addressOf(1000, 6)).toBe(1000 + 6 * ELEMENT_BYTES);
    expect(addressOf(1000, 6)).toBe(1024);
  });

  it('starts with start, ends with done and stays under 400 frames', () => {
    for (const g of GROWTHS) {
      for (const c of [MIN_CAPACITY, MAX_CAPACITY]) {
        const frames = arrayTrace(g, c, MAX_PUSHES);
        expect(frames[0].kind).toBe('start');
        expect(frames.at(-1)?.kind).toBe('done');
        expect(frames.length).toBeLessThan(400);
      }
    }
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = arrayTrace('double', 1, 3);
    const k = frames.findIndex((f) => f.kind === 'copy');
    const next = /** @type {(number|null)[]} */ (frames[k].next);
    next[0] = 99;
    frames[k].cells[0] = 99;
    frames[k].lines.push(99);
    expect(frames[k + 1].cells[0]).toBe(10);
    expect(frames[k + 1].next).toBeNull();
    expect(frames[k + 1].lines).not.toContain(99);
    const again = arrayTrace('double', 1, 3);
    expect(again[k].next?.[0]).toBe(10);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the static push', () => {
    const seen = new Set(arrayTrace('static', 2, 3).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(pushPseudocode.static.map((_, i) => i));
  });

  it('highlights every line of the dynamic push', () => {
    const seen = new Set(arrayTrace('double', 1, 3).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(pushPseudocode.dynamic.map((_, i) => i));
  });
});
