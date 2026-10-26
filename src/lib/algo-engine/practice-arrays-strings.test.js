import { describe, expect, it } from 'vitest';
import {
  FIT,
  MAX_N,
  PROBLEMS,
  SAMPLES,
  TECHNIQUES,
  parseNumbers,
  parseQueries,
  parseText,
  parseValuesFor,
  pseudocodeFor,
  solveTrace,
  stepsByTechnique,
} from './practice-arrays-strings.js';

/** @typedef {import('./practice-arrays-strings.js').PracticeFrame} PracticeFrame */
/** @typedef {import('./practice-arrays-strings.js').PracticeInput} PracticeInput */
/** @typedef {import('./practice-arrays-strings.js').Technique} Technique */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {PracticeFrame[]} frames */
const last = (frames) => /** @type {PracticeFrame} */ (frames.at(-1));

/** @param {number[]} a @param {number} from @param {number} to */
const sumOf = (a, from, to) => a.slice(from, to).reduce((x, y) => x + y, 0);

/** @param {Partial<PracticeInput>} p @returns {PracticeInput} */
const input = (p) => ({ values: [], text: '', target: 0, queries: [], ...p });

/** @param {import('./practice-arrays-strings.js').ProblemId} problem @returns {Technique[]} */
const fitting = (problem) => TECHNIQUES.filter((t) => FIT[problem][t] !== 'no');

const rand = seeded(11);
/** @param {number} lo @param {number} hi */
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
/** @param {number} lo @param {number} hi */
const randomArray = (lo, hi) => Array.from({ length: between(1, MAX_N) }, () => between(lo, hi));

describe('pair with sum T', () => {
  const cases = [
    { values: [1, 3, 4, 6, 8, 11, 15], target: 14 },
    { values: [1, 2], target: 4 },
    { values: [2, 2], target: 4 },
    { values: [-5, -1, 0, 3], target: -6 },
    ...Array.from({ length: 30 }, () => {
      const values = randomArray(-20, 20).sort((a, b) => a - b);
      if (values.length < 2) values.push(25);
      return { values, target: between(-30, 30) };
    }),
  ];
  it.each(cases)('finds a pair in $values for T = $target exactly when one exists', (c) => {
    const exists = c.values.some((x, i) => c.values.some((y, j) => i < j && x + y === c.target));
    for (const t of fitting('pair-sum')) {
      const f = last(solveTrace('pair-sum', t, input(c)));
      expect(f.verdict).toBe(exists);
      if (f.found) {
        expect(f.found[0]).toBeLessThan(f.found[1]);
        expect(c.values[f.found[0]] + c.values[f.found[1]]).toBe(c.target);
      }
    }
    expect(last(solveTrace('pair-sum', 'pointers', input(c))).steps).toBeLessThanOrEqual(
      c.values.length - 1,
    );
  });

  it('checks 3 sums with two pointers and 10 with brute force on the sample', () => {
    expect(stepsByTechnique('pair-sum', SAMPLES['pair-sum'])).toEqual({
      pointers: 3,
      window: null,
      prefix: null,
      brute: 10,
    });
    expect(last(solveTrace('pair-sum', 'pointers', SAMPLES['pair-sum'])).found).toEqual([1, 5]);
  });

  it('checks all n(n − 1)/2 pairs by brute force when no pair exists', () => {
    const f = last(
      solveTrace('pair-sum', 'brute', input({ values: [1, 2, 3, 4, 5], target: 100 })),
    );
    expect(f.steps).toBe(10);
    expect(f.verdict).toBe(false);
  });
});

describe('palindrome', () => {
  it.each(['racecar', 'abba', 'a', 'ab', 'abca', 'xyzzyx', 'lever', 'noon', 'aaaaaaaaaaaaaaab'])(
    'decides %s',
    (text) => {
      const expected = text === Array.from(text).reverse().join('');
      for (const t of fitting('palindrome')) {
        expect(last(solveTrace('palindrome', t, input({ text }))).verdict).toBe(expected);
      }
    },
  );

  it('compares 3 pairs for racecar, and copies then compares 14 times by brute force', () => {
    expect(stepsByTechnique('palindrome', SAMPLES.palindrome)).toEqual({
      pointers: 3,
      window: null,
      prefix: null,
      brute: 14,
    });
  });

  it('stops at the first differing pair', () => {
    const f = last(solveTrace('palindrome', 'pointers', input({ text: 'abcxba' })));
    expect(f.found).toEqual([2, 3]);
    expect(f.steps).toBe(3);
  });
});

describe('max sum of k in a row', () => {
  const cases = [
    { values: [4, -1, 2, 7, -3, 5, 1, -2], target: 3 },
    { values: [5], target: 1 },
    { values: [-3, -1, -2], target: 2 },
    { values: [1, 2, 3], target: 3 },
    ...Array.from({ length: 30 }, () => {
      const values = randomArray(-99, 99);
      return { values, target: between(1, values.length) };
    }),
  ];
  it.each(cases)('matches brute force on $values with k = $target', (c) => {
    let best = -Infinity;
    for (let i = 0; i + c.target <= c.values.length; i++)
      best = Math.max(best, sumOf(c.values, i, i + c.target));
    for (const t of fitting('max-window')) {
      const f = last(solveTrace('max-window', t, input(c)));
      expect(f.best).toBe(best);
      expect(sumOf(c.values, f.bestFrom, f.bestTo)).toBe(best);
      expect(f.bestTo - f.bestFrom).toBe(c.target);
    }
  });

  it('counts window, prefix and brute-force steps on the sample', () => {
    expect(stepsByTechnique('max-window', SAMPLES['max-window'])).toEqual({
      pointers: null,
      window: 3 + 2 * 5,
      prefix: 8 + 6,
      brute: 6 * 3,
    });
    expect(last(solveTrace('max-window', 'window', SAMPLES['max-window'])).best).toBe(9);
  });
});

describe('shortest run with sum ≥ S', () => {
  const cases = [
    { values: [2, 3, 1, 2, 4, 3], target: 7 },
    { values: [1, 1, 1], target: 10 },
    { values: [7], target: 7 },
    { values: [0, 0, 5, 0], target: 5 },
    ...Array.from({ length: 30 }, () => ({ values: randomArray(0, 20), target: between(1, 60) })),
  ];
  it.each(cases)('matches brute force on $values with S = $target', (c) => {
    let best = null;
    for (let i = 0; i < c.values.length; i++)
      for (let j = i + 1; j <= c.values.length; j++)
        if (sumOf(c.values, i, j) >= c.target && (best === null || j - i < best)) best = j - i;
    for (const t of fitting('shortest-window')) {
      const f = last(solveTrace('shortest-window', t, input(c)));
      expect(f.best).toBe(best);
      if (best !== null) {
        expect(f.bestTo - f.bestFrom).toBe(best);
        expect(sumOf(c.values, f.bestFrom, f.bestTo)).toBeGreaterThanOrEqual(c.target);
      }
    }
    expect(last(solveTrace('shortest-window', 'window', input(c))).steps).toBeLessThanOrEqual(
      2 * c.values.length,
    );
  });

  it('counts the steps on the sample: the window wins, prefix sums do not help', () => {
    expect(stepsByTechnique('shortest-window', SAMPLES['shortest-window'])).toEqual({
      pointers: null,
      window: 11,
      prefix: 6 + 17,
      brute: 17,
    });
  });
});

describe('range sums', () => {
  it('answers every query the same way with both techniques', () => {
    for (let k = 0; k < 20; k++) {
      const values = randomArray(-99, 99);
      const n = values.length;
      /** @type {[number, number][]} */
      const queries = Array.from({ length: between(1, 6) }, () => {
        const l = between(0, n - 1);
        return [l, between(l, n - 1)];
      });
      const expected = queries.map(([l, r]) => sumOf(values, l, r + 1));
      for (const t of fitting('range-sums'))
        expect(last(solveTrace('range-sums', t, input({ values, queries }))).answers).toEqual(
          expected,
        );
      expect(last(solveTrace('range-sums', 'prefix', input({ values, queries }))).steps).toBe(
        n + queries.length,
      );
    }
  });

  it('answers the sample queries 7, 11, −1 and 15', () => {
    const f = last(solveTrace('range-sums', 'prefix', SAMPLES['range-sums']));
    expect(f.answers).toEqual([7, 11, -1, 15]);
    expect(stepsByTechnique('range-sums', SAMPLES['range-sums'])).toEqual({
      pointers: null,
      window: null,
      prefix: 12,
      brute: 17,
    });
  });
});

describe('techniques that do not fit', () => {
  it('give a start and a done frame and no pseudocode', () => {
    for (const p of PROBLEMS)
      for (const t of TECHNIQUES.filter((x) => FIT[p][x] === 'no')) {
        const frames = solveTrace(p, t, SAMPLES[p]);
        expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
        expect(frames[0].fit).toBe('no');
        expect(pseudocodeFor(p, t)).toEqual([]);
      }
  });

  it('every problem has exactly one best technique', () => {
    for (const p of PROBLEMS)
      expect(TECHNIQUES.filter((t) => FIT[p][t] === 'best')).toHaveLength(1);
  });
});

describe('parsing', () => {
  it('reads numbers with minus signs', () => {
    expect(parseNumbers('3, −2 5')).toEqual({ values: [3, -2, 5] });
    expect(parseNumbers('1, x')).toEqual({ error: 'format' });
    expect(parseNumbers('100')).toEqual({ error: 'range' });
    expect(parseNumbers(Array.from({ length: MAX_N + 1 }, () => '1').join(' '))).toEqual({
      error: 'count',
    });
  });
  it('checks what each problem needs', () => {
    expect(parseValuesFor('pair-sum', '3 1')).toEqual({ error: 'unsorted' });
    expect(parseValuesFor('pair-sum', '3')).toEqual({ error: 'short' });
    expect(parseValuesFor('shortest-window', '3 -1')).toEqual({ error: 'negative' });
    expect(parseValuesFor('max-window', '3 -1')).toEqual({ values: [3, -1] });
  });
  it('reads text and queries', () => {
    expect(parseText(' race car ')).toEqual({ text: 'racecar' });
    expect(parseText('  ')).toEqual({ error: 'empty' });
    expect(parseText('a'.repeat(17))).toEqual({ error: 'long' });
    expect(parseQueries('0 3, 2-6; 5..5', 8)).toEqual({
      queries: [
        [0, 3],
        [2, 6],
        [5, 5],
      ],
    });
    expect(parseQueries('3 1', 8)).toEqual({ error: 'range' });
    expect(parseQueries('0 8', 8)).toEqual({ error: 'range' });
    expect(parseQueries('0', 8)).toEqual({ error: 'format' });
    expect(parseQueries('0 1, 0 1, 0 1, 0 1, 0 1, 0 1, 0 1', 8)).toEqual({ error: 'count' });
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = solveTrace('range-sums', 'prefix', SAMPLES['range-sums']);
    frames[2].items[0] = 99;
    /** @type {(number|string|null)[]} */ (frames[2].aux)[0] = 99;
    frames[2].pointers.push({ name: 'x', index: 0 });
    frames[2].answers.push(1);
    expect(frames[3].items[0]).toBe(3);
    expect(/** @type {(number|string|null)[]} */ (frames[3].aux)[0]).toBe(0);
    expect(frames[3].pointers).toHaveLength(1);
    expect(frames[3].answers).toHaveLength(4);
    expect(SAMPLES['range-sums'].values[0]).toBe(3);
  });
});

describe('pseudocode coverage', () => {
  /** @type {[string, PracticeFrame[][], string[]][]} */
  const runs = [];
  for (const p of PROBLEMS)
    for (const t of fitting(p)) {
      const extra =
        p === 'pair-sum'
          ? [input({ values: [1, 2, 3], target: 100 }), input({ values: [1, 9], target: 5 })]
          : p === 'palindrome'
            ? [input({ text: 'abca' })]
            : [];
      runs.push([
        `${p} ${t}`,
        [SAMPLES[p], ...extra].map((x) => solveTrace(p, t, x)),
        pseudocodeFor(p, t),
      ]);
    }
  it.each(runs)('%s highlights every line', (_, traces, code) => {
    const seen = new Set(traces.flat().flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
