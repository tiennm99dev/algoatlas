import { describe, expect, it } from 'vitest';
import {
  MAX_TOWER,
  balanceFactor,
  refreshHeight,
  rollHeight,
  rotateLeft,
  rotateRight,
  storedHeight,
} from './balanced-core.js';

/** @param {any} [left] @param {any} [right] */
function node(left = null, right = null) {
  const n = { left, right, height: 1 };
  refreshHeight(n);
  return n;
}

describe('rotations', () => {
  it('lift the child and keep heights right', () => {
    const c = node();
    const b = node(null, c);
    const a = node(null, b);
    expect(balanceFactor(a)).toBe(-2);
    const top = rotateLeft(a);
    expect(top).toBe(b);
    expect([top.left, top.right]).toEqual([a, c]);
    expect(storedHeight(top)).toBe(2);
    expect(rotateRight(top)).toBe(a);
    expect(storedHeight(a)).toBe(3);
    expect(storedHeight(null)).toBe(0);
  });
});

describe('rollHeight', () => {
  it('counts heads up to the cap', () => {
    expect(rollHeight(() => 0.9)).toBe(1);
    expect(rollHeight(() => 0.1)).toBe(MAX_TOWER);
  });
});
