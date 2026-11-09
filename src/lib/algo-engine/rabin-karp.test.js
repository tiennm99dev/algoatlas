import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/rabin-karp/copy.en.js';
import {
  MAX_MOD,
  MAX_PATTERN,
  MAX_TEXT,
  RABIN_KARP_PRESETS,
  expectedSpurious,
  polyHash,
  rabinKarpPseudocode,
  rabinKarpTrace,
} from './rabin-karp.js';
import { naiveComparisons } from '$lib/algo-engine/text-match.js';

/** Deterministic LCG so random texts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./rabin-karp.js').RabinKarpFrame[]} frames */
const last = (frames) => /** @type {import('./rabin-karp.js').RabinKarpFrame} */ (frames.at(-1));

/** Every start where the pattern occurs, overlaps included. @param {string} t @param {string} p */
function occurrences(t, p) {
  const out = [];
  for (let s = t.indexOf(p); s !== -1; s = t.indexOf(p, s + 1)) out.push(s);
  return out;
}

/** @param {number} len @param {() => number} rand @param {string} alphabet */
function randomWord(len, rand, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rand() * alphabet.length)];
  return w;
}

describe('Rabin-Karp trace', () => {
  it('finds every occurrence on random inputs and every modulus, against indexOf', () => {
    const rand = seeded(5);
    for (let round = 0; round < 200; round++) {
      const text = randomWord(1 + Math.floor(rand() * MAX_TEXT), rand, 'ab');
      const pattern = randomWord(1 + Math.floor(rand() * 4), rand, 'ab');
      const mod = [2, 3, 5, 7, 13, 101, MAX_MOD][round % 7];
      const f = last(rabinKarpTrace(text, pattern, 31, mod));
      expect(f.matches).toEqual(occurrences(text, pattern));
    }
  });

  it('rolls to the same hash as hashing each window from scratch', () => {
    const rand = seeded(9);
    for (let round = 0; round < 60; round++) {
      const text = randomWord(MAX_TEXT, rand, 'abcdefgxyz');
      const m2 = 1 + Math.floor(rand() * MAX_PATTERN);
      const pattern = text.slice(3, 3 + m2);
      const base = 2 + Math.floor(rand() * 200);
      const mod = [11, 101, 7919, MAX_MOD][round % 4];
      const f = last(rabinKarpTrace(text, pattern, base, mod));
      expect(f.patternHash).toBe(polyHash(pattern, base, mod));
      f.hashes.forEach((h, s) => expect(h).toBe(polyHash(text.slice(s, s + m2), base, mod)));
    }
  });

  it('counts one hash comparison per window and two letters per slide', () => {
    const f = last(rabinKarpTrace('abcdefgh', 'xyz', 31, 101));
    expect(f.hashChecks).toBe(6);
    expect(f.hashWork).toBe(3 + 3 + 2 * 5);
  });

  it('reads no letters when no hash agrees', () => {
    const f = last(rabinKarpTrace('bbbbbb', 'a', 31, 101));
    expect(f.letterReads).toBe(0);
    expect(f.spurious).toEqual([]);
  });

  it('confirms all letters of every window on all repeats', () => {
    const f = last(rabinKarpTrace('aaaaaaaaaa', 'aaa', 31, 101));
    expect(f.matches).toHaveLength(8);
    expect(f.letterReads).toBe(8 * 3);
    expect(naiveComparisons('aaaaaaaaaa', 'aaa')).toBe(8 * 3);
  });

  it('stops at the first bad letter of a spurious hit', () => {
    // Base 10 mod 5 leaves only the last letter, so cba hits aba and the c fails at once.
    const frames = rabinKarpTrace('cba', 'aba', 10, 5);
    expect(last(frames).spurious).toEqual([0]);
    expect(last(frames).letterReads).toBe(1);
    expect(frames.map((f) => f.kind)).toContain('spurious');
  });

  it('handles a pattern as long as the text and a longer one', () => {
    expect(last(rabinKarpTrace('abc', 'abc', 31, 101)).matches).toEqual([0]);
    const frames = rabinKarpTrace('ab', 'abc', 31, 101);
    expect(frames.map((f) => f.kind)).toContain('too-long');
    expect(last(frames).hashChecks).toBe(0);
    expect(last(frames).windowHash).toBeNull();
  });

  it('handles one letter patterns, where the first letter is worth 1', () => {
    const frames = rabinKarpTrace('aba', 'a', 31, 101);
    expect(frames[1].kind).toBe('high');
    expect(frames[1].high).toBe(1);
    expect(last(frames).matches).toEqual([0, 2]);
  });

  it('starts and ends with the agreed kinds', () => {
    const frames = rabinKarpTrace('abc', 'b', 31, 101);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('never aliases frames', () => {
    const frames = rabinKarpTrace('abab', 'ab', 31, 101);
    const copy = JSON.stringify(frames[frames.length - 2]);
    frames[frames.length - 3].hashes[0] = -5;
    frames[frames.length - 3].matches.push(99);
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stays under 400 frames at the caps', () => {
    const text = 'a'.repeat(MAX_TEXT);
    for (let k = 1; k <= MAX_PATTERN; k++) {
      expect(rabinKarpTrace(text, 'a'.repeat(k), 31, 101).length).toBeLessThan(400);
    }
  });

  it('shows what each preset promises', () => {
    const run = (/** @type {keyof typeof RABIN_KARP_PRESETS} */ key) => {
      const { text, pattern, base, mod } = RABIN_KARP_PRESETS[key];
      return last(rabinKarpTrace(text, pattern, base, mod));
    };
    expect(run('plain').matches).toEqual([0, 7]);
    expect(run('plain').spurious).toEqual([1]);
    expect(run('collide').matches).toEqual([4]);
    expect(run('collide').spurious).toEqual([2, 5, 7]);
    expect(run('repeats').spurious).toEqual([]);
    expect(run('large').matches).toEqual([0, 16]);
    expect(run('large').spurious).toEqual([]);
  });
});

describe('helpers', () => {
  it('counts the plain matcher’s comparisons on known inputs', () => {
    // One read at each of the 4 starts, failing at once.
    expect(naiveComparisons('bbbb', 'a')).toBe(4);
    // Each of the starts 0, 1 and 2 reads the a and then the second letter: 2 + 2 + 2.
    expect(naiveComparisons('aaab', 'ab')).toBe(6);
    expect(naiveComparisons('ab', 'abc')).toBe(0);
  });

  it('expects n − m + 1 windows over q', () => {
    expect(expectedSpurious(1002, 3, 100)).toBe(10);
    expect(expectedSpurious(2, 3, 100)).toBe(0);
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('hashes abc by hand', () => {
    expect(practice[0].answer).toBe(polyHash('abc', 10, 1000));
  });

  it('rolls abc to bcd', () => {
    const f = rabinKarpTrace('abcd', 'zzz', 10, 1000).find((x) => x.kind === 'roll');
    expect(practice[1].answer).toBe(f?.roll?.after);
    expect(practice[1].answer).toBe(polyHash('bcd', 10, 1000));
  });

  it('counts the bad base preset’s spurious hits', () => {
    const { text, pattern, base, mod } = RABIN_KARP_PRESETS.collide;
    expect(practice[2].answer).toBe(last(rabinKarpTrace(text, pattern, base, mod)).spurious.length);
  });

  it('estimates chance hits to the nearest whole number', () => {
    expect(Math.abs(practice[4].answer - expectedSpurious(1002, 3, 101))).toBeLessThanOrEqual(
      practice[4].tolerance,
    );
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const { text, pattern, base, mod } = RABIN_KARP_PRESETS.collide;
    const seen = new Set(rabinKarpTrace(text, pattern, base, mod).flatMap((f) => f.lines));
    rabinKarpPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
