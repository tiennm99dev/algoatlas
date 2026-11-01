import { describe, expect, it } from 'vitest';
import {
  INTERVAL_PRESETS,
  MAX_DIM,
  MAX_MATRICES,
  MAX_PRICE,
  MAX_ROD,
  intervalPseudocode,
  intervalTrace,
  orderCount,
  parseInput,
  worstOrderCost,
} from './interval-dp.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Fewest multiplications by trying every split, with no table. */
/** @param {number[]} p @param {number} i @param {number} j @returns {number} */
function chainBrute(p, i, j) {
  if (i === j) return 0;
  let best = Infinity;
  for (let k = i; k < j; k++)
    best = Math.min(best, chainBrute(p, i, k) + chainBrute(p, k + 1, j) + p[i - 1] * p[k] * p[j]);
  return best;
}

/** Most money over all 2^(n − 1) sets of cuts. @param {number[]} prices */
function rodBrute(prices) {
  const n = prices.length;
  let best = 0;
  for (let mask = 0; mask < 1 << (n - 1); mask++) {
    let total = 0;
    let piece = 1;
    for (let k = 0; k < n - 1; k++) {
      if (mask & (1 << k)) {
        total += prices[piece - 1];
        piece = 1;
      } else piece++;
    }
    total += prices[piece - 1];
    best = Math.max(best, total);
  }
  return best;
}

/** Evaluates an order like ((A1 A2) A3): returns its cost and the shape of its product. */
/** @param {string} order @param {number[]} p */
function costOfOrder(order, p) {
  /** @type {{rows: number, cols: number}[]} */
  const stack = [];
  let cost = 0;
  for (const tok of order.match(/A\d+|\)/g) ?? []) {
    if (tok === ')') {
      const b = /** @type {{rows: number, cols: number}} */ (stack.pop());
      const a = /** @type {{rows: number, cols: number}} */ (stack.pop());
      expect(a.cols).toBe(b.rows);
      cost += a.rows * a.cols * b.cols;
      stack.push({ rows: a.rows, cols: b.cols });
    } else {
      const i = Number(tok.slice(1));
      stack.push({ rows: p[i - 1], cols: p[i] });
    }
  }
  expect(stack).toHaveLength(1);
  return cost;
}

describe('matrix chain', () => {
  it('finds the textbook answer and order', () => {
    const last = intervalTrace('matrix', INTERVAL_PRESETS.matrix[2].input).at(-1);
    expect(last?.result).toBe(15125);
    expect(last?.order).toBe('((A1 (A2 A3)) ((A4 A5) A6))');
    expect(last?.table[1][4]).toBe(7125);
  });

  it('matches brute force and rebuilds an order of that cost', () => {
    const rand = seeded(21);
    const cases = [
      [3, 4],
      [2, 3, 4],
      [5, 5, 5, 5],
    ];
    for (let t = 0; t < 40; t++) {
      const n = 1 + Math.floor(rand() * 6);
      cases.push(Array.from({ length: n + 1 }, () => 1 + Math.floor(rand() * 20)));
    }
    for (const p of cases) {
      const last = intervalTrace('matrix', p).at(-1);
      expect(last?.result).toBe(chainBrute(p, 1, p.length - 1));
      expect(costOfOrder(last?.order ?? '', p)).toBe(last?.result);
    }
  });

  it('counts (n³ − n) / 6 splits and n(n + 1) / 2 intervals', () => {
    for (const n of [1, 2, 3, 4, 5, 6, MAX_MATRICES]) {
      const last = intervalTrace('matrix', Array(n + 1).fill(2)).at(-1);
      expect(last?.tried).toBe((n ** 3 - n) / 6);
      expect(last?.filled).toBe((n * (n + 1)) / 2);
    }
  });

  it('fills by non-decreasing length', () => {
    const frames = intervalTrace('matrix', INTERVAL_PRESETS.matrix[2].input);
    const lens = frames.filter((f) => f.kind === 'settle').map((f) => f.len);
    expect(lens).toEqual(lens.slice().sort((a, b) => a - b));
  });

  it('reads only finished cells on every split', () => {
    const frames = intervalTrace('matrix', INTERVAL_PRESETS.matrix[2].input);
    for (const f of frames.filter((x) => x.kind === 'try')) {
      expect(f.table[f.i - 1][f.k - 1]).toBe(f.left);
      expect(f.table[f.k][f.j - 1]).toBe(f.right);
    }
  });

  it('compares with the worst order', () => {
    expect(worstOrderCost([10, 100, 5, 50])).toBe(75000);
    expect(worstOrderCost([2, 3])).toBe(0);
  });

  it('treats one matrix as nothing to do', () => {
    const frames = intervalTrace('matrix', [3, 4]);
    expect(frames.at(-1)?.result).toBe(0);
    expect(frames.at(-1)?.order).toBe('A1');
    expect(frames.some((f) => f.kind === 'try')).toBe(false);
  });

  it('keeps the first smallest split on a tie', () => {
    const frames = intervalTrace('matrix', [1, 1, 1]);
    const last = frames.at(-1);
    expect(last?.splits[0][1]).toBe(1);
    const cube = intervalTrace('matrix', [2, 2, 2, 2]).at(-1);
    expect(cube?.splits[0][2]).toBe(1);
  });
});

describe('rod cutting', () => {
  it('finds the textbook answers', () => {
    const [four, eight, whole] = INTERVAL_PRESETS.rod;
    expect(intervalTrace('rod', four.input).at(-1)?.result).toBe(10);
    const best = intervalTrace('rod', eight.input).at(-1);
    expect(best?.result).toBe(22);
    expect(best?.order).toBe('2 + 6');
    const sold = intervalTrace('rod', whole.input).at(-1);
    expect(sold?.result).toBe(9);
    expect(sold?.order).toBe('3');
  });

  it('matches every set of cuts by brute force, and its pieces add up', () => {
    const rand = seeded(22);
    for (let t = 0; t < 60; t++) {
      const n = 1 + Math.floor(rand() * MAX_ROD);
      const prices = Array.from({ length: n }, () => Math.floor(rand() * 30));
      const last = intervalTrace('rod', prices).at(-1);
      expect(last?.result).toBe(rodBrute(prices));
      const pieces = (last?.order ?? '').split(' + ').map(Number);
      expect(pieces.reduce((s, x) => s + x, 0)).toBe(n);
      expect(pieces.reduce((s, x) => s + prices[x - 1], 0)).toBe(last?.result);
    }
  });

  it('repeats one value along each diagonal', () => {
    const last = intervalTrace('rod', INTERVAL_PRESETS.rod[1].input).at(-1);
    const n = last?.n ?? 0;
    for (let r = 0; r < n; r++)
      for (let c = r; c < n; c++) expect(last?.table[r][c]).toBe(last?.table[0][c - r]);
  });

  it('matches the one-row recurrence', () => {
    const rand = seeded(23);
    for (let t = 0; t < 30; t++) {
      const n = 1 + Math.floor(rand() * MAX_ROD);
      const prices = Array.from({ length: n }, () => Math.floor(rand() * 30));
      const row = [0];
      for (let len = 1; len <= n; len++) {
        row[len] = 0;
        for (let i = 1; i <= len; i++) row[len] = Math.max(row[len], prices[i - 1] + row[len - i]);
      }
      expect(intervalTrace('rod', prices).at(-1)?.result).toBe(row[n]);
    }
  });

  it('stores 0 when a piece sells whole', () => {
    const last = intervalTrace('rod', [1, 2, 9]).at(-1);
    expect(last?.splits[0][2]).toBe(0);
  });
});

describe('order counts', () => {
  it('gives the Catalan numbers and the powers of two', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((n) => orderCount('matrix', n))).toEqual([
      1, 1, 2, 5, 14, 42, 132,
    ]);
    expect([1, 2, 3, 8].map((n) => orderCount('rod', n))).toEqual([1, 2, 4, 128]);
  });
});

describe('parseInput', () => {
  it('reads dimensions and prices', () => {
    expect(parseInput('matrix', '10, 100 × 5 x 50')).toEqual({ input: [10, 100, 5, 50] });
    expect(parseInput('rod', '1 5 8')).toEqual({ input: [1, 5, 8] });
  });

  it('refuses bad lists', () => {
    expect(parseInput('matrix', '5')).toEqual({ error: 'count' });
    expect(
      parseInput(
        'matrix',
        Array(MAX_MATRICES + 2)
          .fill(1)
          .join(),
      ),
    ).toEqual({
      error: 'count',
    });
    expect(parseInput('rod', '')).toEqual({ error: 'count' });
    expect(
      parseInput(
        'rod',
        Array(MAX_ROD + 1)
          .fill(1)
          .join(),
      ),
    ).toEqual({ error: 'count' });
    expect(parseInput('matrix', '2, a')).toEqual({ error: 'format' });
    expect(parseInput('matrix', `0, ${MAX_DIM}`)).toEqual({ error: 'range' });
    expect(parseInput('matrix', `1, ${MAX_DIM + 1}`)).toEqual({ error: 'range' });
    expect(parseInput('rod', String(MAX_PRICE + 1))).toEqual({ error: 'range' });
    expect(parseInput('rod', '0')).toEqual({ input: [0] });
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const input = [10, 100, 5, 50];
    const frames = intervalTrace('matrix', input);
    const before = JSON.stringify(frames[3]);
    frames[2].table[0][0] = 99;
    frames[2].splits[0][0] = 99;
    frames[2].input[0] = 99;
    frames[2].lines.push(9);
    frames.at(-1)?.path.push([9, 9]);
    expect(JSON.stringify(frames[3])).toBe(before);
    expect(input[0]).toBe(10);
    expect(frames.at(-2)?.path).not.toContainEqual([9, 9]);
  });

  it('start and end with the named kinds', () => {
    const frames = intervalTrace('rod', [1, 5]);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('stay under 400 frames at the cap', () => {
    expect(intervalTrace('matrix', Array(MAX_MATRICES + 1).fill(2)).length).toBeLessThan(400);
    expect(intervalTrace('rod', Array(MAX_ROD).fill(2)).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['matrix', 'rod']))('%s highlights every line', (p) => {
    const input = INTERVAL_PRESETS[p][1].input;
    const used = new Set(intervalTrace(p, input).flatMap((f) => f.lines));
    intervalPseudocode[p].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
