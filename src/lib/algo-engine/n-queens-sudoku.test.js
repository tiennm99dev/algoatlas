import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/n-queens-sudoku/copy.en.js';
import {
  MAX_FRAMES,
  MAX_QUEENS,
  MAX_QUEENS_ALL,
  SUDOKU_PRESETS,
  clashOf,
  cycleCell,
  parseSize,
  queensPseudocode,
  queensTrace,
  sudokuPseudocode,
  sudokuTrace,
} from './n-queens-sudoku.js';

/** @typedef {import('./n-queens-sudoku.js').QueensFrame} QueensFrame */
/** @typedef {import('./n-queens-sudoku.js').SudokuFrame} SudokuFrame */

/** @param {number} n @param {{goal?: 'first'|'all', fixed?: number|null}} [o] */
const lastQ = (n, o) => /** @type {QueensFrame} */ (queensTrace(n, o).at(-1));
/** @param {number[][]} g */
const lastS = (g) => /** @type {SudokuFrame} */ (sudokuTrace(g).at(-1));

/** Whether no two queens share a column or a diagonal, checked pair by pair. */
/** @param {number[]} q */
function safe(q) {
  return q.every((c, r) =>
    q.every((d, s) => s === r || (c !== d && Math.abs(c - d) !== Math.abs(r - s))),
  );
}

/** Every solution by trying every permutation, independent of the engine. */
/** @param {number} n */
function allQueens(n) {
  /** @type {number[][]} */
  const out = [];
  /** @param {number[]} q @param {number[]} left */
  const go = (q, left) => {
    if (left.length === 0) {
      if (safe(q)) out.push(q);
      return;
    }
    for (const x of left) {
      go(
        [...q, x],
        left.filter((y) => y !== x),
      );
    }
  };
  go(
    [],
    Array.from({ length: n }, (_, i) => i),
  );
  return out;
}

/** Whether a full grid obeys every row, column and box rule, checked with sets. */
/** @param {number[][]} g */
function validGrid(g) {
  const size = g.length;
  const side = Math.round(Math.sqrt(size));
  /** @param {number[]} xs */
  const full = (xs) => new Set(xs).size === size && xs.every((x) => x >= 1 && x <= size);
  for (let i = 0; i < size; i++) {
    if (!full(g[i]) || !full(g.map((row) => row[i]))) return false;
  }
  for (let t = 0; t < size; t += side) {
    for (let l = 0; l < size; l += side) {
      const box = g.slice(t, t + side).flatMap((row) => row.slice(l, l + side));
      if (!full(box)) return false;
    }
  }
  return true;
}

describe('N-queens', () => {
  it('finds exactly the permutation oracle’s solutions', () => {
    for (let n = 1; n <= 7; n++) {
      const found = lastQ(n, { goal: 'all' }).solutions;
      expect(found.map(String).sort()).toEqual(allQueens(n).map(String).sort());
    }
  });

  it('matches the known solution counts', () => {
    const counts = [1, 0, 0, 2, 10, 4, 40, 92];
    counts.forEach((c, i) => {
      expect(lastQ(i + 1, { goal: 'all' }).solutions).toHaveLength(c);
    });
  });

  it('finds the lexicographically first solution of 8 queens with the known test count', () => {
    const f = lastQ(8);
    expect(f.solutions).toEqual([[0, 4, 7, 5, 2, 6, 1, 3]]);
    expect(f.queens).toEqual([0, 4, 7, 5, 2, 6, 1, 3]);
    expect(f.tested).toBe(876);
    expect(f.placed).toBe(113);
    expect(f.removed).toBe(105);
  });

  it('holds the first queen where it is told to', () => {
    const f = lastQ(6, { goal: 'all', fixed: 1 });
    expect(f.solutions.every((s) => s[0] === 1)).toBe(true);
    expect(f.solutions).toEqual(allQueens(6).filter((s) => s[0] === 1));
    expect(lastQ(4, { fixed: 0 }).solutions).toEqual([]);
  });

  it('reports the boards with no solution', () => {
    expect(lastQ(2).solutions).toEqual([]);
    expect(lastQ(3).solutions).toEqual([]);
    expect(lastQ(1).solutions).toEqual([[0]]);
  });

  it('removes every queen it placed when it runs to the end', () => {
    const f = lastQ(6, { goal: 'all' });
    expect(f.placed).toBe(f.removed);
    expect(f.queens).toEqual([]);
  });

  it('never shows two queens that attack each other', () => {
    for (const f of queensTrace(8)) expect(safe(f.queens)).toBe(true);
  });

  it('keeps frames independent', () => {
    const frames = queensTrace(4);
    frames[1].queens.push(99);
    frames[2].rejected.push(99);
    expect(frames[2].queens).not.toContain(99);
    expect(frames[3].rejected).not.toContain(99);
  });

  it('stays under the frame budget at both caps', () => {
    expect(queensTrace(MAX_QUEENS).length).toBeLessThan(MAX_FRAMES);
    expect(queensTrace(MAX_QUEENS_ALL, { goal: 'all' }).length).toBeLessThan(MAX_FRAMES);
    for (let n = 1; n <= MAX_QUEENS; n++) {
      for (let fixed = 0; fixed < n; fixed++) {
        expect(queensTrace(n, { fixed }).length).toBeLessThan(MAX_FRAMES);
      }
    }
  });

  it('starts and ends with the right kinds', () => {
    const frames = queensTrace(4);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('reads the board size', () => {
    expect(parseSize('8')).toBe(8);
    expect(parseSize('9')).toBeNull();
    expect(parseSize('0')).toBeNull();
    expect(parseSize('x')).toBeNull();
  });
});

describe('Sudoku', () => {
  it('solves every solvable example into a valid grid that keeps its clues', () => {
    for (const p of SUDOKU_PRESETS.filter((x) => x.key !== 'clash')) {
      const f = lastS(p.grid);
      expect(f.solved).toBe(true);
      expect(f.cutoff).toBe(false);
      const solved = /** @type {SudokuFrame} */ (
        sudokuTrace(p.grid).findLast((x) => x.kind === 'solved')
      ).grid;
      expect(validGrid(solved)).toBe(true);
      p.grid.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v !== 0) expect(solved[r][c]).toBe(v);
        }),
      );
    }
  });

  it('backs up on the small example and the full-size one', () => {
    const small = /** @type {number[][]} */ (SUDOKU_PRESETS[0].grid);
    expect(lastS(small).removed).toBeGreaterThan(0);
    const nine = /** @type {number[][]} */ (SUDOKU_PRESETS.find((p) => p.key === 'nine')?.grid);
    expect(lastS(nine).removed).toBeGreaterThan(0);
  });

  it('stops at once when the clues clash', () => {
    const frames = sudokuTrace(
      /** @type {number[][]} */ (SUDOKU_PRESETS.find((p) => p.key === 'clash')?.grid),
    );
    expect(frames.map((f) => f.kind)).toEqual(['start', 'clash', 'done']);
    expect(frames.at(-1)?.solved).toBe(false);
  });

  it('reports no solution when no digit fits the first empty cell', () => {
    const f = lastS([
      [1, 2, 3, 0],
      [0, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(f.solved).toBe(false);
    expect(f.cutoff).toBe(false);
    expect(f.placed).toBe(0);
    expect(f.tested).toBe(4);
  });

  it('cuts a long run off and says so, within the frame budget', () => {
    // Column 0 holds the 1 that the last row needs, which only shows once the rest is filled.
    const grid = Array.from({ length: 9 }, () => new Array(9).fill(0));
    grid[8] = [0, 2, 3, 4, 5, 6, 7, 8, 9];
    grid[7][0] = 1;
    const frames = sudokuTrace(grid);
    const f = /** @type {SudokuFrame} */ (frames.at(-1));
    expect(frames.length).toBeLessThanOrEqual(MAX_FRAMES);
    expect(f.kind).toBe('done');
    expect(f.cutoff).toBe(true);
    expect(f.solved).toBe(false);
  });

  it('names which rule a digit breaks', () => {
    const g = [
      [1, 0, 0, 0],
      [0, 0, 0, 2],
      [0, 3, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(clashOf(g, 0, 3, 1)).toBe('row');
    expect(clashOf(g, 0, 3, 2)).toBe('column');
    expect(clashOf(g, 1, 1, 1)).toBe('box');
    expect(clashOf(g, 0, 1, 4)).toBeNull();
  });

  it('cycles a cell through its digits', () => {
    const g = [
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(cycleCell(g, 0, 0)[0][0]).toBe(0);
    expect(cycleCell(g, 0, 1)[0][1]).toBe(1);
    expect(g[0][1]).toBe(0);
  });

  it('keeps frames independent of each other and of the input', () => {
    const input = SUDOKU_PRESETS[0].grid.map((r) => r.slice());
    const frames = sudokuTrace(input);
    frames[1].grid[0][0] = 9;
    expect(frames[2].grid[0][0]).not.toBe(9);
    expect(input[0][0]).toBe(0);
  });
});

describe('pseudocode coverage', () => {
  it('N-queens highlights every line', () => {
    const seen = new Set(queensTrace(4).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(queensPseudocode.map((_, i) => i));
  });

  it('Sudoku highlights every line', () => {
    const seen = new Set(sudokuTrace(SUDOKU_PRESETS[0].grid).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(sudokuPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(lastQ(4, { goal: 'all' }).solutions).toEqual([
      [1, 3, 0, 2],
      [2, 0, 3, 1],
    ]);
    expect(lastQ(4, { goal: 'all' }).solutions).toHaveLength(answer(0));
    expect(lastQ(6, { goal: 'all' }).solutions).toHaveLength(answer(1));
    expect(lastQ(4).removed).toBe(answer(2));
    expect(lastQ(8).tested).toBe(answer(3));
    expect(2 - 5).toBe(answer(4));
  });
});
