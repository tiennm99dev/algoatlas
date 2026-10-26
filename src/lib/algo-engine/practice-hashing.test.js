import { describe, expect, it } from 'vitest';
import {
  ANAGRAM_PRESETS,
  MAX_NUMS,
  MAX_WORDS,
  TWO_SUM_PRESETS,
  anagramKey,
  anagramTrace,
  hashPracticePseudocode,
  parseAnagramWords,
  parseNums,
  twoSumTrace,
} from './practice-hashing.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * The double loop: the first i (then the latest j < i) with nums[j] + nums[i] = target.
 * @param {number[]} nums
 * @param {number} target
 */
function bruteTwoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i - 1; j >= 0; j--) if (nums[j] + nums[i] === target) return [j, i];
  }
  return [];
}

describe('twoSumTrace', () => {
  it('finds the same pair as the double loop on random inputs', () => {
    const rand = seeded(13);
    for (let run = 0; run < 300; run++) {
      const n = Math.floor(rand() * (MAX_NUMS + 1));
      const nums = Array.from({ length: n }, () => Math.floor(rand() * 21) - 10);
      const target = Math.floor(rand() * 41) - 20;
      const last = twoSumTrace(nums, target).at(-1);
      const want = bruteTwoSum(nums, target);
      expect(last?.kind).toBe('done');
      expect(last?.pair).toEqual(want);
      if (want.length) {
        expect(nums[want[0]] + nums[want[1]]).toBe(target);
        expect(last?.lookups).toBe(want[1] + 1);
      } else {
        expect(last?.lookups).toBe(n);
        expect(last?.covered).toBe((n * (n - 1)) / 2);
      }
    }
  });

  it('never pairs an element with itself', () => {
    const last = twoSumTrace([5], 10).at(-1);
    expect(last?.pair).toEqual([]);
    expect(twoSumTrace([5, 5], 10).at(-1)?.pair).toEqual([0, 1]);
  });

  it('runs the presets', () => {
    const { classic, late, repeat, none } = TWO_SUM_PRESETS;
    expect(twoSumTrace(classic.nums, classic.target).at(-1)?.pair).toEqual([0, 1]);
    const lateLast = twoSumTrace(late.nums, late.target).at(-1);
    expect(lateLast?.pair).toEqual([4, 5]);
    expect(lateLast?.lookups).toBe(6);
    expect(lateLast?.covered).toBe(15);
    expect(twoSumTrace(repeat.nums, repeat.target).at(-1)?.pair).toEqual([0, 2]);
    const noneFrames = twoSumTrace(none.nums, none.target);
    expect(noneFrames.at(-2)?.kind).toBe('none');
    expect(noneFrames.at(-1)?.entries).toHaveLength(4);
  });

  it('handles an empty array', () => {
    expect(twoSumTrace([], 3).map((f) => f.kind)).toEqual(['start', 'none', 'done']);
  });

  it('keeps the latest index of a repeated value', () => {
    const last = twoSumTrace([4, 1, 4], 100).at(-1);
    expect(last?.entries).toEqual([
      { key: '4', value: '2' },
      { key: '1', value: '1' },
    ]);
  });
});

describe('anagramTrace', () => {
  it('groups words with equal sorted letters, in first-seen order', () => {
    const rand = seeded(21);
    const pool = ['ab', 'ba', 'abc', 'cab', 'bca', 'zz', 'a'];
    for (let run = 0; run < 100; run++) {
      const words = Array.from(
        { length: Math.floor(rand() * (MAX_WORDS + 1)) },
        () => pool[Math.floor(rand() * pool.length)],
      );
      const last = anagramTrace(words).at(-1);
      /** @type {string[]} */
      const keys = [];
      for (const w of words) {
        const k = [...w].sort().join('');
        if (!keys.includes(k)) keys.push(k);
      }
      expect(last?.entries).toEqual(
        keys.map((k) => ({
          key: k,
          value: words.filter((w) => [...w].sort().join('') === k).join(', '),
        })),
      );
      expect(last?.lookups).toBe(words.length);
    }
  });

  it('groups the presets', () => {
    expect(anagramTrace(ANAGRAM_PRESETS.classic).at(-1)?.entries).toEqual([
      { key: 'aet', value: 'eat, tea, ate' },
      { key: 'ant', value: 'tan, nat' },
      { key: 'abt', value: 'bat' },
    ]);
    expect(anagramTrace(ANAGRAM_PRESETS.listen).at(-1)?.entries).toHaveLength(3);
    expect(anagramKey('tea')).toBe('aet');
  });
});

describe('frames', () => {
  it('are not aliased', () => {
    const frames = anagramTrace(ANAGRAM_PRESETS.classic);
    const next = JSON.stringify(frames[3].entries);
    frames[2].entries.push({ key: 'x', value: 'y' });
    if (frames[3].entries[0]) frames[2].entries[0].value = 'changed';
    expect(JSON.stringify(frames[3].entries)).toBe(next);
    const sums = twoSumTrace([1, 2, 3], 100);
    const after = JSON.stringify(sums[3].entries);
    sums[2].entries.push({ key: 'x', value: 'y' });
    expect(JSON.stringify(sums[3].entries)).toBe(after);
  });

  it('stay under 400 at the caps', () => {
    expect(twoSumTrace(Array(MAX_NUMS).fill(1), 100).length).toBeLessThan(400);
    expect(anagramTrace(Array(MAX_WORDS).fill('abc')).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const sums = [...twoSumTrace([1, 2], 3), ...twoSumTrace([1], 3)];
    const seenSums = new Set(sums.flatMap((f) => f.lines));
    expect([...seenSums].sort((a, b) => a - b)).toEqual(
      hashPracticePseudocode['two-sum'].map((_, i) => i),
    );
    const seenWords = new Set(anagramTrace(['ab', 'ba']).flatMap((f) => f.lines));
    expect([...seenWords].sort((a, b) => a - b)).toEqual(
      hashPracticePseudocode.anagrams.map((_, i) => i),
    );
  });
});

describe('parsers', () => {
  it('parse numbers', () => {
    expect(parseNums('2, -7, −3')).toEqual({ nums: [2, -7, -3] });
    expect(parseNums('1, x')).toEqual({ error: 'format' });
    expect(parseNums('100')).toEqual({ error: 'range' });
    expect(parseNums(Array(13).fill('1').join(','))).toEqual({ error: 'count' });
  });

  it('parse words', () => {
    expect(parseAnagramWords('Eat, tea  TAN')).toEqual({ words: ['eat', 'tea', 'tan'] });
    expect(parseAnagramWords('  ')).toEqual({ error: 'empty' });
    expect(parseAnagramWords('a1')).toEqual({ error: 'format' });
    expect(parseAnagramWords('abcdefghi')).toEqual({ error: 'length' });
    expect(parseAnagramWords(Array(13).fill('a').join(' '))).toEqual({ error: 'count' });
  });
});
