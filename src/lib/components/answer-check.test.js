import { describe, expect, it } from 'vitest';
import {
  checkAnswer,
  exerciseProblems,
  normalizeText,
  normalizeUnit,
  parseNumber,
} from './answer-check.js';

/** @typedef {import('./answer-check.js').Exercise} Exercise */

const base = { prompt: 'p', hints: ['h'], solution: 's' };

/**
 * @param {Exercise} ex
 * @param {unknown} response
 */
const reason = (ex, response) => checkAnswer(ex, response).reason;

describe('parseNumber', () => {
  it.each([
    ['3.5', 3.5],
    ['42', 42],
    ['  7  ', 7],
    ['-2.25', -2.25],
    ['−2.25', -2.25],
    ['+4', 4],
    ['.5', 0.5],
    ['1,000', 1000],
    ['1,000,000', 1000000],
    ['1 000 000', 1000000],
    ['12,345.75', 12345.75],
    ['0', 0],
  ])('reads %j as %d', (input, value) => {
    expect(parseNumber(input)).toEqual({ value, unit: '' });
  });

  it.each([
    ['7 comparisons', 7, 'comparisons'],
    ['12ms', 12, 'ms'],
    ['50%', 50, '%'],
    ['1,024 bytes', 1024, 'bytes'],
  ])('splits %j into a value and a unit', (input, value, unit) => {
    expect(parseNumber(input)).toEqual({ value, unit });
  });

  it.each(['', 'abc', '3,5', '1,00', '1,0000', '1.2.3', '12 34', '3.', '3..5', '-', '1,000 000'])(
    'rejects %j',
    (input) => {
      expect(parseNumber(input)).toBeNull();
    },
  );
});

describe('normalizeUnit', () => {
  it('ignores case, spaces, carets and superscripts', () => {
    expect(normalizeUnit('MS')).toBe('ms');
    expect(normalizeUnit('n²')).toBe('n2');
    expect(normalizeUnit('n ^2')).toBe('n2');
  });
});

describe('normalizeText', () => {
  it('folds case, accents, spaces and trailing punctuation', () => {
    expect(normalizeText('  Binary   Search. ')).toBe('binary search');
    expect(normalizeText('Dijkstra’s algorithm!')).toBe('dijkstra’s algorithm');
    expect(normalizeText('Café')).toBe('cafe');
  });

  it('ignores spacing around brackets and operators in cost formulas', () => {
    expect(normalizeText('O( n log n )')).toBe('o(n log n)');
    expect(normalizeText('O(N²)')).toBe(normalizeText('o(n ^ 2)'));
    expect(normalizeText('O(V + E)')).toBe('o(v+e)');
  });
});

describe('checkAnswer: number', () => {
  /** @type {Exercise} */
  const ex = { ...base, type: 'number', answer: 3.5 };
  /** @type {Exercise} */
  const withUnit = { ...base, type: 'number', answer: 7, unit: 'comparisons' };
  /** @type {Exercise} */
  const approx = { ...base, type: 'number', answer: 3.1416, tolerance: 0.01 };

  it('accepts the value typed or passed as a number', () => {
    expect(checkAnswer(ex, '3.5')).toEqual({ correct: true, reason: 'correct' });
    expect(reason(ex, '3.50')).toBe('correct');
    expect(reason(ex, 3.5)).toBe('correct');
  });

  it('rejects a wrong value', () => {
    expect(checkAnswer(ex, '3.6')).toEqual({ correct: false, reason: 'wrong' });
  });

  it('reports empty and unreadable input', () => {
    expect(reason(ex, '')).toBe('empty');
    expect(reason(ex, '   ')).toBe('empty');
    expect(reason(ex, undefined)).toBe('empty');
    expect(reason(ex, 'three and a half')).toBe('invalid');
    expect(reason(ex, '3,5')).toBe('invalid');
    expect(reason(ex, ['3.5'])).toBe('invalid');
  });

  it('rejects a unit when the exercise has none', () => {
    expect(reason(ex, '3.5 ms')).toBe('invalid');
  });

  it('accepts the unit written or left out', () => {
    expect(reason(withUnit, '7')).toBe('correct');
    expect(reason(withUnit, '7 comparisons')).toBe('correct');
    expect(reason(withUnit, '7 Comparisons')).toBe('correct');
  });

  it('flags a right value in the wrong unit', () => {
    expect(reason(withUnit, '7 swaps')).toBe('unit');
    expect(reason(withUnit, '8 swaps')).toBe('wrong');
    expect(reason(withUnit, '8 comparisons')).toBe('wrong');
  });

  it('honours tolerance', () => {
    expect(reason(approx, '3.14')).toBe('correct');
    expect(reason(approx, '3.15')).toBe('correct');
    expect(reason(approx, '3.2')).toBe('wrong');
  });

  it('absorbs float noise without a tolerance', () => {
    /** @type {Exercise} */
    const sum = { ...base, type: 'number', answer: 0.1 + 0.2 };
    expect(reason(sum, '0.3')).toBe('correct');
  });

  it('handles negatives and grouped thousands', () => {
    /** @type {Exercise} */
    const neg = { ...base, type: 'number', answer: -12 };
    /** @type {Exercise} */
    const big = { ...base, type: 'number', answer: 1048576 };
    expect(reason(neg, '-12')).toBe('correct');
    expect(reason(neg, '−12')).toBe('correct');
    expect(reason(neg, '12')).toBe('wrong');
    expect(reason(big, '1,048,576')).toBe('correct');
    expect(reason(big, '1 048 576')).toBe('correct');
  });
});

describe('checkAnswer: choice', () => {
  /** @type {Exercise} */
  const ex = { ...base, type: 'choice', options: ['a', 'b', 'c'], answer: 1 };

  it('checks the picked index', () => {
    expect(reason(ex, 1)).toBe('correct');
    expect(reason(ex, 0)).toBe('wrong');
    expect(reason(ex, 2)).toBe('wrong');
  });

  it('reports no pick and junk', () => {
    expect(reason(ex, undefined)).toBe('empty');
    expect(reason(ex, null)).toBe('empty');
    expect(reason(ex, '1')).toBe('invalid');
    expect(reason(ex, 1.5)).toBe('invalid');
  });
});

describe('checkAnswer: multi', () => {
  /** @type {Exercise} */
  const ex = { ...base, type: 'multi', options: ['a', 'b', 'c', 'd'], answers: [0, 2] };

  it('compares as a set', () => {
    expect(reason(ex, [0, 2])).toBe('correct');
    expect(reason(ex, [2, 0])).toBe('correct');
    expect(reason(ex, [2, 0, 2])).toBe('correct');
  });

  it('rejects missing or extra picks', () => {
    expect(reason(ex, [0])).toBe('wrong');
    expect(reason(ex, [0, 2, 3])).toBe('wrong');
    expect(reason(ex, [1, 3])).toBe('wrong');
  });

  it('reports no pick and junk', () => {
    expect(reason(ex, [])).toBe('empty');
    expect(reason(ex, undefined)).toBe('empty');
    expect(reason(ex, ['0'])).toBe('invalid');
    expect(reason(ex, 0)).toBe('invalid');
  });
});

describe('checkAnswer: text', () => {
  /** @type {Exercise} */
  const ex = { ...base, type: 'text', accept: ['O(n log n)', 'n log n'] };

  it('ignores case, spacing and trailing punctuation', () => {
    expect(reason(ex, 'O(n log n)')).toBe('correct');
    expect(reason(ex, '  o( N  log N ) ')).toBe('correct');
    expect(reason(ex, 'n log n.')).toBe('correct');
  });

  it('rejects other answers', () => {
    expect(reason(ex, 'O(n)')).toBe('wrong');
    expect(reason(ex, 'nlogn')).toBe('wrong');
  });

  it('reports empty and junk', () => {
    expect(reason(ex, '')).toBe('empty');
    expect(reason(ex, 4)).toBe('invalid');
  });
});

describe('checkAnswer: order', () => {
  /** @type {Exercise} */
  const ex = { ...base, type: 'order', items: ['3', '1', '2'], answer: [1, 2, 0] };

  it('needs the exact sequence', () => {
    expect(reason(ex, [1, 2, 0])).toBe('correct');
    expect(reason(ex, [0, 1, 2])).toBe('wrong');
    expect(reason(ex, [2, 1, 0])).toBe('wrong');
  });

  it('reports partial and junk input', () => {
    expect(reason(ex, [1, 2])).toBe('incomplete');
    expect(reason(ex, undefined)).toBe('empty');
    expect(reason(ex, 'abc')).toBe('invalid');
  });
});

describe('exerciseProblems', () => {
  it('passes well-formed exercises of every type', () => {
    /** @type {Exercise[]} */
    const good = [
      { ...base, type: 'number', answer: 4 },
      { ...base, type: 'choice', options: ['a', 'b'], answer: 1 },
      { ...base, type: 'multi', options: ['a', 'b', 'c'], answers: [0, 2] },
      { ...base, type: 'text', accept: ['stack'] },
      { ...base, type: 'order', items: ['b', 'a'], answer: [1, 0] },
    ];
    for (const ex of good) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('flags missing prose and hints', () => {
    /** @type {Exercise} */
    const ex = { type: 'number', answer: 1, prompt: ' ', hints: [], solution: '' };
    expect(exerciseProblems(ex)).toEqual([
      'prompt is empty',
      'needs at least one hint',
      'solution is empty',
    ]);
  });

  it('flags answers that point outside the options', () => {
    expect(exerciseProblems({ ...base, type: 'choice', options: ['a', 'b'], answer: 2 })).toEqual([
      'answer is not an option index',
    ]);
    expect(
      exerciseProblems({ ...base, type: 'multi', options: ['a', 'b'], answers: [1, 1, 5] }),
    ).toEqual(['answers holds an index that is not an option', 'answers repeats an index']);
  });

  it('flags an order question that is not a permutation or is already solved', () => {
    expect(exerciseProblems({ ...base, type: 'order', items: ['a', 'b'], answer: [0, 0] })).toEqual(
      ['answer is not a permutation of the item indices'],
    );
    expect(
      exerciseProblems({ ...base, type: 'order', items: ['a', 'b', 'c'], answer: [0, 1, 2] }),
    ).toEqual(['items already start in the answer order']);
  });

  it('flags an empty accept list', () => {
    expect(exerciseProblems({ ...base, type: 'text', accept: ['  '] })).toEqual([
      'accept needs at least one non-empty answer',
    ]);
  });
});
