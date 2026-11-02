import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/z-function/copy.en.js';
import {
  MAX_LEN,
  Z_PRESETS,
  naiveZComparisons,
  zInput,
  zPseudocode,
  zTrace,
} from './z-function.js';

/** Deterministic LCG so random texts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./z-function.js').ZFrame[]} frames */
const last = (frames) => /** @type {import('./z-function.js').ZFrame} */ (frames.at(-1));

/** Z read straight off the definition. @param {string} s */
function zByDefinition(s) {
  return [...s].map((_, i) => {
    if (i === 0) return null;
    let k = 0;
    while (i + k < s.length && s[k] === s[i + k]) k++;
    return k;
  });
}

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

describe('Z-function trace', () => {
  it('matches the definition on random strings and known cases', () => {
    expect(last(zTrace('aabxaab')).z).toEqual([null, 1, 0, 0, 3, 1, 0]);
    expect(last(zTrace('aaaaa')).z).toEqual([null, 4, 3, 2, 1]);
    expect(last(zTrace('abacaba')).z).toEqual([null, 0, 1, 0, 3, 0, 1]);
    const rand = seeded(19);
    for (let round = 0; round < 300; round++) {
      const s = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, round % 2 ? 'ab' : 'abc');
      expect(last(zTrace(s)).z).toEqual(zByDefinition(s));
    }
  });

  it('finds every occurrence of a pattern on random inputs, against indexOf', () => {
    const rand = seeded(23);
    for (let round = 0; round < 300; round++) {
      const pattern = randomWord(1 + Math.floor(rand() * 4), rand, 'ab');
      const text = randomWord(1 + Math.floor(rand() * 14), rand, 'ab');
      expect(last(zTrace(text, pattern)).matches).toEqual(occurrences(text, pattern));
    }
  });

  it('never lets a Z value exceed the pattern when searching', () => {
    const f = last(zTrace('aaaa', 'aa'));
    expect(Math.max(.../** @type {number[]} */ (f.z.slice(1)))).toBe(2);
    expect(f.matches).toEqual([0, 1, 2]);
  });

  it('keeps the box as the segment that reaches furthest right', () => {
    const rand = seeded(29);
    for (let round = 0; round < 50; round++) {
      const s = randomWord(MAX_LEN, rand, 'ab');
      let furthest = 0;
      for (const f of zTrace(s)) {
        expect(f.r).toBeGreaterThanOrEqual(furthest);
        furthest = f.r;
        if (f.r > f.l) expect(s.slice(f.l, f.r)).toBe(s.slice(0, f.r - f.l));
      }
    }
  });

  it('stays within 2n comparisons and beats the plain count on repeats', () => {
    const rand = seeded(31);
    for (let round = 0; round < 100; round++) {
      const s = randomWord(MAX_LEN, rand, 'ab');
      expect(last(zTrace(s)).comparisons).toBeLessThanOrEqual(2 * s.length);
    }
    const f = last(zTrace('aaaaaaaaaaaa'));
    expect(f.comparisons).toBe(11);
    expect(f.reused).toBe(10 + 9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1);
    expect(naiveZComparisons('aaaaaaaaaaaa')).toBe(66);
  });

  it('counts the plain comparisons on a known string', () => {
    // i = 1 reads a≠b, i = 2 reads a=a then end of string.
    expect(naiveZComparisons('aba')).toBe(2);
    expect(naiveZComparisons('a')).toBe(0);
  });

  it('handles a single letter and a two letter string', () => {
    expect(zTrace('a').map((f) => f.kind)).toEqual(['start', 'done']);
    expect(last(zTrace('ab')).z).toEqual([null, 0]);
  });

  it('builds the separated string only when there is a pattern', () => {
    expect(zInput('abc', '')).toBe('abc');
    expect(zInput('abc', 'b')).toBe('b$abc');
  });

  it('never aliases frames', () => {
    const frames = zTrace('abab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    frames[frames.length - 3].z[1] = 77;
    frames[frames.length - 3].matches.push(77);
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stays under 400 frames at the cap', () => {
    for (const s of ['a'.repeat(MAX_LEN), 'ab'.repeat(MAX_LEN / 2), 'aabxaabxcaabxaabxayz']) {
      expect(zTrace(s).length).toBeLessThan(400);
    }
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('reads Z values off the trace', () => {
    expect(practice[0].answer).toBe(last(zTrace('abacaba')).z[4]);
    expect(practice[1].answer).toBe(last(zTrace('aaaaa')).z[2]);
  });

  it('computes the start value inside the box', () => {
    const f = zTrace('aabxaabxc').find((x) => x.kind === 'inside' && x.i === 5);
    expect(f?.l).toBe(4);
    expect(f?.r).toBe(8);
    expect(practice[2].answer).toBe(f?.value);
  });

  it('counts matches and the comparisons saved', () => {
    expect(practice[3].answer).toBe(last(zTrace('abab', 'ab')).matches.length);
    const { text } = Z_PRESETS.repeats;
    expect(practice[4].answer).toBe(naiveZComparisons(text) - last(zTrace(text)).comparisons);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(Z_PRESETS).flatMap(({ text, pattern }) =>
        zTrace(text, pattern).flatMap((f) => f.lines),
      ),
    );
    zPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
