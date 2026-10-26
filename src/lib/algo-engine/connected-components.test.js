import { describe, expect, it } from 'vitest';
import {
  MAX_COLS,
  MAX_ROWS,
  componentsPseudocode,
  componentsTrace,
  mapNeighbours,
  randomLand,
} from './connected-components.js';

/** Deterministic LCG so maps are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Independent oracle: union-find over land cells, joining each cell to its right, lower and
 * (for 8-connectivity) lower diagonal neighbours.
 * @param {number} rows @param {number} cols @param {Set<number>} land @param {4 | 8} k
 */
function oracleCount(rows, cols, land, k) {
  const parent = Array.from({ length: rows * cols }, (_, i) => i);
  /** @param {number} x @returns {number} */
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  /** @param {number} a @param {number} b */
  const join = (a, b) => {
    if (land.has(a) && land.has(b)) parent[find(a)] = find(b);
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (c + 1 < cols) join(i, i + 1);
      if (r + 1 < rows) join(i, i + cols);
      if (k === 8 && r + 1 < rows && c + 1 < cols) join(i, i + cols + 1);
      if (k === 8 && r + 1 < rows && c > 0) join(i, i + cols - 1);
    }
  }
  return {
    count: new Set([...land].map(find)).size,
    /** @param {number} a @param {number} b */
    same: (a, b) => find(a) === find(b),
  };
}

/** @param {number} rows @param {number} cols @param {number[]} land @param {4 | 8} [k] */
const map = (rows, cols, land, k = 4) => ({
  rows,
  cols,
  land: new Set(land),
  connectivity: /** @type {4 | 8} */ (k),
});

describe('components trace', () => {
  it('counts islands like a union-find oracle, for both connectivities', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const k of /** @type {(4 | 8)[]} */ ([4, 8])) {
        const land = randomLand(6, 9, 0.45, seeded(seed));
        const last = componentsTrace({ rows: 6, cols: 9, land, connectivity: k }).at(-1);
        const oracle = oracleCount(6, 9, land, k);
        expect(last?.count, `seed ${seed}`).toBe(oracle.count);
        // Two land cells share a label exactly when the oracle joins them.
        const cells = [...land];
        for (const a of cells) {
          for (const b of cells) {
            expect(last?.labels[a] === last?.labels[b]).toBe(oracle.same(a, b));
          }
        }
        expect(last?.sizes.reduce((s, x) => s + x, 0)).toBe(land.size);
      }
    }
  });

  it('numbers islands in row-major order of their first cell', () => {
    // Cell 5 touches cell 0 only at a corner, so with 4-connectivity it is a third island.
    const last = componentsTrace(map(2, 4, [0, 3, 5])).at(-1);
    expect(last?.labels).toEqual([1, 0, 0, 2, 0, 3, 0, 0]);
  });

  it('joins diagonal cells only with 8-connectivity', () => {
    const diag = [0, 4, 8];
    expect(componentsTrace(map(3, 3, diag, 4)).at(-1)?.count).toBe(3);
    expect(componentsTrace(map(3, 3, diag, 8)).at(-1)?.count).toBe(1);
  });

  it('handles an all-water map and a single land cell', () => {
    expect(componentsTrace(map(2, 2, [])).map((f) => f.kind)).toEqual(['start', 'done']);
    const one = componentsTrace(map(1, 1, [0]));
    expect(one.map((f) => f.kind)).toEqual(['start', 'new-island', 'expand', 'done']);
    expect(one.at(-1)?.sizes).toEqual([1]);
  });

  it('examines 4 neighbours per inner cell when the map is all land', () => {
    const all = Array.from({ length: 9 }, (_, i) => i);
    // Each of the 12 side-sharing pairs is checked from both ends.
    expect(componentsTrace(map(3, 3, all)).at(-1)?.checks).toBe(24);
    // 8-connectivity adds 4 diagonal pairs, again from both ends.
    expect(componentsTrace(map(3, 3, all, 8)).at(-1)?.checks).toBe(40);
  });

  it('stays under 400 frames on a full map at the size cap', () => {
    const all = Array.from({ length: MAX_ROWS * MAX_COLS }, (_, i) => i);
    const frames = componentsTrace(map(MAX_ROWS, MAX_COLS, all, 8));
    expect(frames.length).toBeLessThan(400);
  });

  it('lists neighbours inside the map only', () => {
    expect(mapNeighbours(0, 3, 3, 4)).toEqual([1, 3]);
    expect(mapNeighbours(4, 3, 3, 8)).toHaveLength(8);
  });

  it('does not alias frames', () => {
    const frames = componentsTrace(map(2, 2, [0, 1, 2]));
    const before = JSON.stringify(frames[2]);
    frames[1].labels[3] = 9;
    frames[1].queue.push(7);
    frames[1].sizes.push(4);
    expect(JSON.stringify(frames[2])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = componentsTrace(map(2, 2, [0, 1]));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(componentsPseudocode.map((_, i) => i));
  });
});
