import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/suffix-arrays/copy.en.js';
import {
  MAX_LEN,
  SUFFIX_PRESETS,
  directSortComparisons,
  distinctSubstrings,
  longestRepeat,
  suffixPseudocode,
  suffixTrace,
} from './suffix-arrays.js';

/** Deterministic LCG so random texts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./suffix-arrays.js').SuffixFrame[]} frames */
const last = (frames) => /** @type {import('./suffix-arrays.js').SuffixFrame} */ (frames.at(-1));

/** @param {number} len @param {() => number} rand @param {string} alphabet */
function randomWord(len, rand, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rand() * alphabet.length)];
  return w;
}

/** The suffix array by sorting the suffix strings. @param {string} s */
const saByDefinition = (s) =>
  Array.from(s, (_, i) => i).sort((a, b) => (s.slice(a) < s.slice(b) ? -1 : 1));

/** The LCP array by comparing neighbours letter by letter. @param {string} s */
function lcpByDefinition(s) {
  const sa = saByDefinition(s);
  return sa.map((at, r) => {
    if (r === 0) return null;
    const before = sa[r - 1];
    let h = 0;
    while (at + h < s.length && before + h < s.length && s[at + h] === s[before + h]) h++;
    return h;
  });
}

describe('suffix array', () => {
  it('matches known answers', () => {
    const f = last(suffixTrace('banana'));
    expect(f.sa).toEqual([5, 3, 1, 0, 4, 2]);
    expect(f.lcp).toEqual([null, 1, 3, 0, 0, 2]);
    expect(last(suffixTrace('aaaa')).sa).toEqual([3, 2, 1, 0]);
    expect(last(suffixTrace('a')).sa).toEqual([0]);
    expect(last(suffixTrace('a')).lcp).toEqual([null]);
  });

  it('matches sorted suffixes and direct LCPs on random strings', () => {
    const rand = seeded(5);
    for (let round = 0; round < 300; round++) {
      const s = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, round % 2 ? 'ab' : 'abc');
      const f = last(suffixTrace(s));
      expect(f.sa).toEqual(saByDefinition(s));
      expect(f.lcp).toEqual(lcpByDefinition(s));
    }
  });

  it('orders by the first 2k letters after each round', () => {
    const rand = seeded(9);
    for (let round = 0; round < 60; round++) {
      const s = randomWord(MAX_LEN, rand, 'ab');
      for (const f of suffixTrace(s)) {
        if (f.kind !== 'rerank') continue;
        for (let r = 1; r < s.length; r++) {
          const a = s.slice(f.sa[r - 1], f.sa[r - 1] + 2 * f.k);
          const b = s.slice(f.sa[r], f.sa[r] + 2 * f.k);
          expect(a <= b).toBe(true);
          expect(f.rank[f.sa[r]] === f.rank[f.sa[r - 1]]).toBe(a === b);
        }
      }
    }
  });
});

describe('cost counters', () => {
  it('needs about log₂ n rounds and at most 2n Kasai comparisons', () => {
    const rand = seeded(11);
    for (let round = 0; round < 100; round++) {
      const s = randomWord(MAX_LEN, rand, 'ab');
      const f = last(suffixTrace(s));
      expect(f.rounds).toBeLessThanOrEqual(Math.ceil(Math.log2(s.length)));
      expect(f.comparisons).toBeLessThanOrEqual(2 * s.length);
    }
    expect(last(suffixTrace('aaaaaaaa')).rounds).toBe(3);
    expect(last(suffixTrace('abc')).rounds).toBe(1);
  });

  it('lets h shrink by at most one per suffix', () => {
    const frames = suffixTrace('mississippi');
    for (const f of frames) {
      if (f.kind === 'shrink') {
        const stored = frames[frames.indexOf(f) - 1];
        expect(f.h).toBe(stored.h - 1);
      }
    }
  });

  it('counts direct sorting comparisons on a small case', () => {
    expect(directSortComparisons('ab')).toBe(1);
    expect(directSortComparisons('a')).toBe(0);
    expect(directSortComparisons('aaaaaaaa')).toBeGreaterThan(
      last(suffixTrace('aaaaaaaa')).comparisons,
    );
  });
});

describe('what the LCP array answers', () => {
  it('counts distinct substrings against a set', () => {
    const rand = seeded(21);
    for (let round = 0; round < 100; round++) {
      const s = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, 'abc');
      const all = new Set();
      for (let a = 0; a < s.length; a++) {
        for (let b = a + 1; b <= s.length; b++) all.add(s.slice(a, b));
      }
      expect(distinctSubstrings(s.length, last(suffixTrace(s)).lcp)).toBe(all.size);
    }
  });

  it('finds the longest repeat against a direct search', () => {
    const rand = seeded(23);
    for (let round = 0; round < 100; round++) {
      const s = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, 'ab');
      const f = last(suffixTrace(s));
      const repeat = longestRepeat(s, f.sa, f.lcp);
      let best = 0;
      for (let a = 0; a < s.length; a++) {
        for (let b = a + 1; b < s.length; b++) {
          let h = 0;
          while (b + h < s.length && s[a + h] === s[b + h]) h++;
          best = Math.max(best, h);
        }
      }
      expect(repeat.length).toBe(best);
      if (best > 0) expect(s.indexOf(repeat)).not.toBe(s.lastIndexOf(repeat));
    }
    expect(longestRepeat('banana', [5, 3, 1, 0, 4, 2], [null, 1, 3, 0, 0, 2])).toBe('ana');
  });
});

describe('frames', () => {
  it('never alias', () => {
    const frames = suffixTrace('abab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    const earlier = frames[frames.length - 3];
    earlier.sa[0] = 77;
    earlier.rank[0] = 77;
    earlier.lcp[0] = 77;
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
    const pairs = suffixTrace('abab').find((f) => f.kind === 'pairs');
    const sorted = suffixTrace('abab').find((f) => f.kind === 'sorted');
    expect(pairs?.keys).not.toBe(sorted?.keys);
  });

  it('stay under 400 at the cap', () => {
    for (const s of ['a'.repeat(MAX_LEN), 'ab'.repeat(MAX_LEN / 2), 'mississippimissi']) {
      expect(suffixTrace(s).length).toBeLessThan(400);
    }
  });

  it('start with start and end with done', () => {
    const frames = suffixTrace('a');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);
  const banana = last(suffixTrace('banana'));

  it('orders the suffixes of banana', () => {
    const q = practice[0];
    const order = q.answer.map((/** @type {number} */ x) => q.items[x]);
    expect(order).toEqual(banana.sa.map((at) => 'banana'.slice(at)));
  });

  it('reads the LCP and what it gives', () => {
    expect(practice[1].answer).toBe(banana.lcp[2]);
    expect(practice[2].accept).toContain(longestRepeat('banana', banana.sa, banana.lcp));
    expect(practice[3].answer).toBe(distinctSubstrings(6, banana.lcp));
  });

  it('counts the rounds on one repeated letter', () => {
    expect(practice[4].answer).toBe(last(suffixTrace(SUFFIX_PRESETS.repeats)).rounds);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(SUFFIX_PRESETS).flatMap((s) => suffixTrace(s).flatMap((f) => f.lines)),
    );
    suffixPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
