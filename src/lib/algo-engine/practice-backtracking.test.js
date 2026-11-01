import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/practice-backtracking/copy.en.js';
import {
  MAX_FRAMES,
  SUM_PRESETS,
  WORD_PRESETS,
  parseCandidates,
  parseGrid,
  parseTotal,
  parseWord,
  sumPseudocode,
  sumTrace,
  wordPseudocode,
  wordTrace,
} from './practice-backtracking.js';

/** @typedef {import('./practice-backtracking.js').WordFrame} WordFrame */
/** @typedef {import('./practice-backtracking.js').SumFrame} SumFrame */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {string} rows */
const grid = (rows) => /** @type {string[][]} */ (parseGrid(rows));
/** @param {string} rows @param {string} word */
const lastW = (rows, word) => /** @type {WordFrame} */ (wordTrace(grid(rows), word).at(-1));
/** @param {number[]} c @param {number} t */
const lastS = (c, t) => /** @type {SumFrame} */ (sumTrace(c, t).at(-1));

/** Every string readable along a simple path, breadth first over (cell, visited set) states. */
/** @param {string[][]} g @param {number} maxLength */
function allPathStrings(g, maxLength) {
  const rows = g.length;
  const cols = g[0].length;
  const seen = new Set();
  /** @type {{r: number, c: number, mask: number, text: string}[]} */
  let layer = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      layer.push({ r, c, mask: 1 << (r * cols + c), text: g[r][c] });
    }
  }
  while (layer.length) {
    /** @type {typeof layer} */
    const next = [];
    for (const s of layer) {
      seen.add(s.text);
      if (s.text.length === maxLength) continue;
      for (const [dy, dx] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ]) {
        const y = s.r + dy;
        const x = s.c + dx;
        if (y < 0 || y >= rows || x < 0 || x >= cols) continue;
        const bit = 1 << (y * cols + x);
        if (s.mask & bit) continue;
        next.push({ r: y, c: x, mask: s.mask | bit, text: s.text + g[y][x] });
      }
    }
    layer = next;
  }
  return seen;
}

/** How many multisets add up to the total, by the coin-change table. */
/** @param {number[]} coins @param {number} total */
function coinWays(coins, total) {
  const ways = new Array(total + 1).fill(0);
  ways[0] = 1;
  for (const coin of coins) {
    for (let t = coin; t <= total; t++) ways[t] += ways[t - coin];
  }
  return ways[total];
}

describe('word search', () => {
  it('answers the known examples', () => {
    expect(lastW('ABCE SFCS ADEE', 'ABCCED').found).toBe(true);
    expect(lastW('ABCE SFCS ADEE', 'SEE').found).toBe(true);
    expect(lastW('ABCE SFCS ADEE', 'ABCB').found).toBe(false);
  });

  it('agrees with an exhaustive oracle on random grids and words', () => {
    const rand = seeded(13);
    for (let t = 0; t < 150; t++) {
      const rows = 1 + Math.floor(rand() * 3);
      const cols = 1 + Math.floor(rand() * 3);
      const g = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => 'AB'[Math.floor(rand() * 2)]),
      );
      const len = 1 + Math.floor(rand() * 5);
      const word = Array.from({ length: len }, () => 'AB'[Math.floor(rand() * 2)]).join('');
      const f = /** @type {WordFrame} */ (wordTrace(g, word).at(-1));
      expect(f.cutoff).toBe(false);
      expect(f.found).toBe(allPathStrings(g, len).has(word));
    }
  });

  it('returns a path that spells the word through neighbouring cells, each used once', () => {
    const frames = wordTrace(grid('ABAB BABA ABAC'), 'ABAC');
    const hit = /** @type {WordFrame} */ (frames.find((f) => f.kind === 'found'));
    expect(hit.path.map(([r, c]) => hit.grid[r][c]).join('')).toBe('ABAC');
    expect(new Set(hit.path.map(String)).size).toBe(hit.path.length);
    hit.path.slice(1).forEach(([r, c], i) => {
      const [y, x] = hit.path[i];
      expect(Math.abs(r - y) + Math.abs(c - x)).toBe(1);
    });
  });

  it('never reuses a cell, so one A cannot spell AA', () => {
    expect(lastW('A', 'AA').found).toBe(false);
    expect(lastW('AA', 'AAA').found).toBe(false);
    expect(lastW('A', 'A').found).toBe(true);
  });

  it('counts the known runs', () => {
    expect(lastW('ABCE SFCS ADEE', 'ABCCED').checked).toBe(9);
    expect(lastW('ABCE SFCS ADEE', 'ABCCED').retreats).toBe(0);
    expect(lastW('ABCE SFCS ADEE', 'ABCB').retreats).toBe(4);
    expect(lastW('ABCE SFCS ADEE', 'Z').checked).toBe(12);
  });

  it('clears the path on every retreat, and ends with none when the word is absent', () => {
    const frames = wordTrace(grid('ABCE SFCS ADEE'), 'ABCB');
    expect(frames.at(-1)?.path).toEqual([]);
    for (const f of frames.filter((x) => x.kind === 'retreat')) {
      expect(f.path.map(String)).not.toContain(String([f.r, f.c]));
    }
  });

  it('stops a run that has too many paths, within the frame budget', () => {
    const frames = wordTrace(grid('AAA AAA AAB'), 'AAAAAAAAC');
    const f = /** @type {WordFrame} */ (frames.at(-1));
    expect(frames.length).toBeLessThanOrEqual(MAX_FRAMES);
    expect(f.kind).toBe('done');
    expect(f.cutoff).toBe(true);
    expect(f.found).toBe(false);
  });

  it('keeps frames independent', () => {
    const frames = wordTrace(grid('ABCE SFCS ADEE'), 'ABC');
    frames[1].path.push([9, 9]);
    frames[1].grid[0][0] = 'Z';
    expect(frames[2].path.map(String)).not.toContain('9,9');
    expect(frames[2].grid[0][0]).toBe('A');
  });
});

describe('combination sum', () => {
  it('lists the known combinations', () => {
    expect(lastS([2, 3, 6, 7], 7).solutions).toEqual([[2, 2, 3], [7]]);
    expect(lastS([2, 3, 5], 8).solutions).toEqual([
      [2, 2, 2, 2],
      [2, 3, 3],
      [3, 5],
    ]);
    expect(lastS([4, 6], 7).solutions).toEqual([]);
  });

  it('agrees with the coin-change count, with every list adding up and sorted', () => {
    const rand = seeded(17);
    for (let t = 0; t < 60; t++) {
      const coins = [...new Set(Array.from({ length: 3 }, () => 2 + Math.floor(rand() * 7)))];
      const total = 1 + Math.floor(rand() * 15);
      const f = lastS(coins, total);
      expect(f.cutoff).toBe(false);
      expect(f.solutions).toHaveLength(coinWays(coins, total));
      expect(new Set(f.solutions.map(String)).size).toBe(f.solutions.length);
      for (const s of f.solutions) {
        expect(s.reduce((a, b) => a + b, 0)).toBe(total);
        expect(s).toEqual(s.slice().sort((a, b) => a - b));
      }
    }
  });

  it('counts the known runs', () => {
    expect(lastS([2, 3, 6, 7], 7).calls).toBe(10);
    expect(lastS([2, 3, 6, 7], 7).stops).toBe(7);
    expect(lastS([1, 2], 10).solutions).toHaveLength(6);
  });

  it('sorts the candidates, whatever order they come in', () => {
    expect(lastS([7, 2, 6, 3], 7).solutions).toEqual([[2, 2, 3], [7]]);
  });

  it('stops a run with too many combinations, within the frame budget', () => {
    const frames = sumTrace([1, 2, 3, 4, 5, 6], 30);
    const f = /** @type {SumFrame} */ (frames.at(-1));
    expect(frames.length).toBeLessThanOrEqual(MAX_FRAMES);
    expect(f.kind).toBe('done');
    expect(f.cutoff).toBe(true);
    expect(f.nodes.every((n) => !n.open)).toBe(true);
  });

  it('keeps frames independent', () => {
    const frames = sumTrace([2, 3], 5);
    frames[1].nodes[0].remaining = 99;
    frames[1].path.push(99);
    expect(frames[2].nodes[0].remaining).toBe(5);
    expect(frames[2].path).not.toContain(99);
  });
});

describe('input', () => {
  it('reads grids', () => {
    expect(parseGrid('ab cd')).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
    expect(parseGrid('AB/CD')).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
    expect(parseGrid('')).toBeNull();
    expect(parseGrid('AB C')).toBeNull();
    expect(parseGrid('A1')).toBeNull();
    expect(parseGrid('ABCDEF')).toBeNull();
    expect(parseGrid('A B C D E F')).toBeNull();
  });

  it('reads words, candidates and totals', () => {
    expect(parseWord(' see ')).toBe('SEE');
    expect(parseWord('')).toBeNull();
    expect(parseWord('A1')).toBeNull();
    expect(parseWord('ABCDEFGHIJKLM')).toBeNull();
    expect(parseCandidates('7, 2 2 3')).toEqual([2, 3, 7]);
    expect(parseCandidates('')).toBeNull();
    expect(parseCandidates('0')).toBeNull();
    expect(parseCandidates('21')).toBeNull();
    expect(parseCandidates('1 2 3 4 5 6 7')).toBeNull();
    expect(parseTotal('30')).toBe(30);
    expect(parseTotal('31')).toBeNull();
    expect(parseTotal('x')).toBeNull();
  });
});

describe('presets', () => {
  it('fit their limits and stay within the frame budget', () => {
    for (const p of WORD_PRESETS) {
      const frames = wordTrace(grid(p.rows.join(' ')), p.word);
      expect(frames.length).toBeLessThanOrEqual(MAX_FRAMES);
    }
    for (const p of SUM_PRESETS) {
      expect(lastS(p.candidates, p.total).cutoff).toBe(false);
    }
  });
});

describe('pseudocode coverage', () => {
  it('word search highlights every line', () => {
    const frames = [
      ...wordTrace(grid('ABCE SFCS ADEE'), 'ABCB'),
      ...wordTrace(grid('ABCE SFCS ADEE'), 'SEE'),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(wordPseudocode.map((_, i) => i));
  });

  it('combination sum highlights every line', () => {
    const seen = new Set(sumTrace([2, 3, 6, 7], 7).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(sumPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(lastW('ABCE SFCS ADEE', 'ABCB').retreats).toBe(answer(0));
    expect(lastW('ABCE SFCS ADEE', 'ABCCED').checked).toBe(answer(1));
    const words = /** @type {{options: string[], answers: number[]}} */ (m.practice[2]);
    words.options.forEach((word, i) => {
      expect(lastW('ABCE SFCS ADEE', word).found).toBe(words.answers.includes(i));
    });
    expect(lastS([2, 3, 6, 7], 7).solutions).toHaveLength(answer(3));
    expect(lastS([2, 3, 5], 8).solutions).toHaveLength(answer(4));
    expect(lastS([1, 2], 10).solutions).toHaveLength(answer(5));
  });
});
