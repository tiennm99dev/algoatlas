import { describe, expect, it } from 'vitest';
import { treeSpans } from './segment-spans.js';

describe('treeSpans', () => {
  it('lists 2n - 1 nodes in pre-order with heap numbering', () => {
    expect(treeSpans(3)).toEqual([
      { v: 1, lo: 0, hi: 2 },
      { v: 2, lo: 0, hi: 1 },
      { v: 4, lo: 0, hi: 0 },
      { v: 5, lo: 1, hi: 1 },
      { v: 3, lo: 2, hi: 2 },
    ]);
    expect(treeSpans(8)).toHaveLength(15);
  });
});
