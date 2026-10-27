import { describe, expect, it } from 'vitest';
import {
  childrenOf,
  depthOf,
  filled,
  formatSlots,
  lastFilled,
  leftOf,
  parentOf,
  parseSlots,
  rightOf,
} from './slot-tree.js';

const letters = {
  max: 15,
  isEntry: (/** @type {string} */ p) => /^[A-Z]$/.test(p),
  toValue: String,
};
const numbers = {
  max: 7,
  isEntry: (/** @type {string} */ p) => /^\d{1,2}$/.test(p),
  toValue: Number,
};

describe('slot tree', () => {
  it('finds children, parents and depths in the array layout', () => {
    expect([leftOf(2), rightOf(2)]).toEqual([5, 6]);
    expect(parentOf(0)).toBe(-1);
    expect(parentOf(5)).toBe(2);
    expect(depthOf(6)).toBe(2);
    const s = ['A', 'B', null, 'D'];
    expect(filled(s, 1)).toBe(true);
    expect(filled(s, 2)).toBe(false);
    expect(filled(s, 9)).toBe(false);
    expect(childrenOf(s, 1)).toEqual([3]);
    expect(lastFilled(s)).toBe(3);
    expect(lastFilled([null, null])).toBe(-1);
  });

  it('reads a tree in array order and writes it back', () => {
    const r = parseSlots('A, B, -, D, - -', letters);
    expect(r).toEqual({ slots: ['A', 'B', null, 'D'] });
    if ('slots' in r) expect(formatSlots(r.slots)).toBe('A, B, -, D');
    expect(parseSlots('5 3 8', numbers)).toEqual({ slots: [5, 3, 8] });
  });

  it('reports each kind of bad input', () => {
    expect(parseSlots('  ', letters)).toEqual({ error: 'empty' });
    expect(parseSlots('1 2 3 4 5 6 7 8', numbers)).toEqual({ error: 'count' });
    expect(parseSlots('A b', letters)).toEqual({ error: 'format' });
    expect(parseSlots('5 05', numbers)).toEqual({ error: 'duplicate' });
    expect(parseSlots('- A', letters)).toEqual({ error: 'orphan' });
    expect(parseSlots('A - B C', letters)).toEqual({ error: 'orphan' });
  });
});
