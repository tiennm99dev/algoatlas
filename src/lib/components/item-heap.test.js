import { describe, expect, it } from 'vitest';
import { makeHeap } from './item-heap.js';

describe('makeHeap', () => {
  it('pops items in order and counts comparisons', () => {
    const h = makeHeap((/** @type {number} */ a, /** @type {number} */ b) => a < b);
    for (const x of [5, 1, 4, 2, 3]) h.push(x);
    expect(h.a[0]).toBe(1);
    const out = [];
    while (h.a.length) out.push(h.pop());
    expect(out).toEqual([1, 2, 3, 4, 5]);
    expect(h.counter.comparisons).toBeGreaterThan(0);
  });

  it('orders a max-heap and replaces the top in place', () => {
    const h = makeHeap((/** @type {number} */ a, /** @type {number} */ b) => a > b);
    for (const x of [2, 9, 4]) h.push(x);
    expect(h.a[0]).toBe(9);
    const slot = h.replaceTop(1);
    expect(h.a[0]).toBe(4);
    expect(h.a[slot]).toBe(1);
  });

  it('reports the slot a pushed item settles in', () => {
    const h = makeHeap((/** @type {number} */ a, /** @type {number} */ b) => a < b);
    h.push(5);
    h.push(7);
    expect(h.push(1)).toBe(0);
  });
});
