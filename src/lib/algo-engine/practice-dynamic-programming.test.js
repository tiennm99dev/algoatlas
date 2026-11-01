import { describe, expect, it } from 'vitest';
import { en as copy } from '$lib/lessons/practice-dynamic-programming/copy.en.js';
import {
  ANSWERS,
  BASES,
  COMBINES,
  CORRECT,
  MAX_N,
  PROBLEMS,
  SAMPLES,
  STARTERS,
  STATES,
  TERMS,
  designPseudocode,
  designTrace,
  expectedAnswer,
  normalizeTerms,
  parseValues,
  randomValues,
  runDesign,
  truthOf,
} from './practice-dynamic-programming.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** @typedef {import('./practice-dynamic-programming.js').Design} Design */
/** @typedef {import('./practice-dynamic-programming.js').Problem} Problem */

/** Every design a problem's controls can build. @param {Problem} problem @returns {Design[]} */
function everyDesign(problem) {
  const terms = TERMS[problem];
  /** @type {Design[]} */
  const all = [];
  for (const state of STATES[problem])
    for (const combine of COMBINES)
      for (const base of BASES)
        for (const answer of ANSWERS)
          for (let mask = 0; mask < 1 << terms.length; mask++)
            all.push({
              state,
              combine,
              base,
              answer,
              terms: terms.filter((_, k) => mask & (1 << k)),
            });
  return all;
}

/** @param {number[]} digits */
function lettersOf(digits) {
  /** @type {string[][]} */
  const out = [];
  /** @param {number} i @param {string[]} acc */
  const walk = (i, acc) => {
    if (i === digits.length) {
      out.push(acc);
      return;
    }
    if (digits[i] === 0) return;
    walk(i + 1, [...acc, String(digits[i])]);
    if (i + 1 < digits.length && digits[i] * 10 + digits[i + 1] <= 26)
      walk(i + 2, [...acc, `${digits[i]}${digits[i + 1]}`]);
  };
  walk(0, []);
  return out;
}

describe('brute-force truth', () => {
  it('knows the maximum subarray of the textbook input', () => {
    const a = SAMPLES['max-subarray'][0];
    expect(expectedAnswer('max-subarray', a)).toBe(6);
    expect(a.map((_, k) => truthOf('ending', a, k + 1))).toEqual([-2, 1, -2, 4, 3, 5, 6, 1, 5]);
    expect(a.map((_, k) => truthOf('within', a, k + 1))).toEqual([-2, 1, 1, 4, 4, 5, 6, 6, 6]);
  });

  it('answers an all-negative input with its largest value', () => {
    expect(expectedAnswer('max-subarray', [-3, -1, -2])).toBe(-1);
  });

  it('counts decodings as an explicit list does', () => {
    const rand = seeded(41);
    for (let t = 0; t < 40; t++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const digits = randomValues('decode', n, rand);
      expect(expectedAnswer('decode', digits)).toBe(lettersOf(digits).length);
    }
    expect(lettersOf([2, 2, 6])).toEqual([
      ['2', '2', '6'],
      ['2', '26'],
      ['22', '6'],
    ]);
  });

  it('finds the climb that skips the costly steps', () => {
    expect(expectedAnswer('climb', SAMPLES.climb[1])).toBe(6);
    expect(expectedAnswer('climb', [10, 15, 20])).toBe(30);
  });

  it('splits decodings into those ending in a single digit', () => {
    expect(truthOf('single', [2, 2, 6], 3)).toBe(2);
    expect(truthOf('single', [1, 0], 2)).toBe(0);
  });
});

describe('the correct designs', () => {
  it.each(PROBLEMS)('%s passes every sample and random inputs', (problem) => {
    const rand = seeded(42);
    const inputs = [...SAMPLES[problem]];
    for (let t = 0; t < 40; t++)
      inputs.push(randomValues(problem, 1 + Math.floor(rand() * MAX_N), rand));
    for (const a of inputs) {
      const r = runDesign(problem, CORRECT[problem], a);
      expect(r.ok, a.join()).toBe(true);
    }
  });

  it.each(PROBLEMS)('%s is the only design that passes every sample', (problem) => {
    const passing = everyDesign(problem).filter((d) =>
      SAMPLES[problem].every((a) => runDesign(problem, d, a).ok),
    );
    expect(passing).toEqual([CORRECT[problem]]);
  });

  it('counts the cells read', () => {
    const last = designTrace('decode', CORRECT.decode, [2, 2, 6]).at(-1);
    expect(last?.dp).toEqual([1, 1, 2, 3]);
    expect(last?.reads).toBe(5);
    expect(last?.got).toBe(3);
  });
});

describe('wrong designs fail in the way the lesson says', () => {
  it('starts every problem on a failing design', () => {
    for (const problem of PROBLEMS)
      expect(SAMPLES[problem].some((a) => !runDesign(problem, STARTERS[problem], a).ok)).toBe(true);
  });

  it('“every step” keeps its cells and still gives the wrong answer', () => {
    /** @type {Design} */
    const d = { state: 'every', combine: 'min', terms: ['prev-a'], base: 0, answer: 'last' };
    const r = runDesign('climb', d, [10, 15, 20]);
    expect(r.cellsOk).toBe(true);
    expect(r.answerOk).toBe(false);
    expect(r.got).toBe(45);
  });

  it('no terms can make “best anywhere” keep its promise on every sample', () => {
    const passing = everyDesign('max-subarray').filter(
      (d) =>
        d.state === 'within' &&
        SAMPLES['max-subarray'].every((a) => runDesign('max-subarray', d, a).cellsOk),
    );
    expect(passing).toEqual([]);
  });

  it('a right answer with the wrong meaning is flagged', () => {
    const r = runDesign(
      'max-subarray',
      { ...CORRECT['max-subarray'], state: 'within' },
      SAMPLES['max-subarray'][0],
    );
    expect(r.answerOk).toBe(true);
    expect(r.cellsOk).toBe(false);
    expect(r.ok).toBe(false);
  });

  it('dp[0] = 0 zeroes every decode cell', () => {
    const last = designTrace('decode', { ...CORRECT.decode, base: 0 }, [2, 2, 6]).at(-1);
    expect(last?.dp).toEqual([0, 0, 0, 0]);
  });

  it('leaves a cell empty when no term offers anything to max or min', () => {
    const last = designTrace('climb', { ...CORRECT.climb, terms: [] }, [1, 2]).at(-1);
    expect(last?.dp).toEqual([0, null, null]);
    expect(last?.got).toBeNull();
    expect(last?.answerOk).toBe(false);
  });

  it('a sum of nothing is 0', () => {
    const last = designTrace('decode', { ...CORRECT.decode, terms: [] }, [1]).at(-1);
    expect(last?.dp).toEqual([1, 0]);
  });
});

describe('term conditions', () => {
  it('dp[i−2] never reads off the table', () => {
    const f = designTrace('climb', CORRECT.climb, [1, 2]).find((x) => x.kind === 'cell');
    expect(f?.options).toEqual([
      { term: 'prev-a', value: 1 },
      { term: 'prev2-a', value: null },
    ]);
  });

  it('a pair must read as 10 to 26', () => {
    const cases = /** @type {[number[], number][]} */ ([
      [[1, 0], 1],
      [[2, 6], 2],
      [[2, 7], 1],
      [[0, 5], 0],
      [[3, 0], 0],
    ]);
    for (const [a, ways] of cases)
      expect(designTrace('decode', CORRECT.decode, a).at(-1)?.got).toBe(ways);
  });
});

describe('designPseudocode', () => {
  it('writes the design, with the same line count for any design', () => {
    expect(designPseudocode('max-subarray', CORRECT['max-subarray'])).toEqual([
      'solve(a[1..n]):',
      '  dp[0] = 0',
      '  for i = 1 to n:',
      '    dp[i] = max(a[i], dp[i-1] + a[i])',
      '  return max(dp[1..n])',
    ]);
    expect(designPseudocode('decode', CORRECT.decode)[3]).toBe(
      '    dp[i] = (dp[i-1] if a[i] ≠ 0) + (dp[i-2] if a[i-1]a[i] is 10..26)',
    );
    expect(designPseudocode('climb', { ...CORRECT.climb, terms: [] })[3]).toBe(
      '    dp[i] = nothing',
    );
  });

  it('keeps the listed order of the terms', () => {
    expect(normalizeTerms('climb', ['prev2-a', 'prev-a', 'prev-a'])).toEqual(['prev-a', 'prev2-a']);
  });
});

describe('parseValues', () => {
  it('reads each problem’s input', () => {
    expect(parseValues('max-subarray', '−2, 1 -3')).toEqual({ values: [-2, 1, -3] });
    expect(parseValues('climb', '10,15')).toEqual({ values: [10, 15] });
    expect(parseValues('decode', ' 2 26 ')).toEqual({ values: [2, 2, 6] });
  });

  it('refuses bad input', () => {
    expect(parseValues('max-subarray', '')).toEqual({ error: 'count' });
    expect(
      parseValues(
        'max-subarray',
        Array(MAX_N + 1)
          .fill(1)
          .join(),
      ),
    ).toEqual({ error: 'count' });
    expect(parseValues('max-subarray', '1, x')).toEqual({ error: 'format' });
    expect(parseValues('max-subarray', '100')).toEqual({ error: 'range' });
    expect(parseValues('climb', '0')).toEqual({ error: 'range' });
    expect(parseValues('climb', '-1')).toEqual({ error: 'range' });
    expect(parseValues('decode', '12a')).toEqual({ error: 'format' });
    expect(parseValues('decode', '')).toEqual({ error: 'count' });
    expect(parseValues('decode', '12345678901')).toEqual({ error: 'count' });
  });

  it('random inputs parse back', () => {
    const rand = seeded(43);
    for (const problem of PROBLEMS) {
      const a = randomValues(problem, 8, rand);
      const text = problem === 'decode' ? a.join('') : a.join(', ');
      expect(parseValues(problem, text)).toEqual({ values: a });
    }
  });
});

describe('stored practice answers', () => {
  it('agree with the engine', () => {
    /** @param {number} k */
    const answer = (k) => /** @type {{answer: number}} */ (copy.practice[k]).answer;
    expect(runDesign('decode', CORRECT.decode, [2, 2, 6]).got).toBe(answer(0));
    const last = designTrace(
      'max-subarray',
      CORRECT['max-subarray'],
      SAMPLES['max-subarray'][0],
    ).at(-1);
    expect(last?.dp[7]).toBe(answer(1));
    expect(runDesign('climb', CORRECT.climb, SAMPLES.climb[1]).got).toBe(answer(2));
    expect(runDesign('decode', CORRECT.decode, [1, 0, 0]).got).toBe(answer(3));
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const a = [2, 2, 6];
    const frames = designTrace('decode', CORRECT.decode, a);
    const before = JSON.stringify(frames[3]);
    frames[2].dp[0] = 99;
    frames[2].a[0] = 99;
    frames[2].truth[0] = 99;
    frames[2].right[0] = true;
    frames[2].options[0].value = 99;
    frames[2].lines.push(9);
    expect(JSON.stringify(frames[3])).toBe(before);
    expect(a[0]).toBe(2);
  });

  it('run from start to done with one frame per cell', () => {
    const frames = designTrace('climb', CORRECT.climb, [1, 2, 3]);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'base',
      'cell',
      'cell',
      'cell',
      'answer',
      'done',
    ]);
    expect(frames.length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it.each(PROBLEMS)('%s highlights every line', (problem) => {
    const used = new Set(
      designTrace(problem, CORRECT[problem], SAMPLES[problem][0]).flatMap((f) => f.lines),
    );
    designPseudocode(problem, CORRECT[problem]).forEach((_, i) =>
      expect(used.has(i), `line ${i}`).toBe(true),
    );
  });
});
