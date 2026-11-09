import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/boyer-moore/copy.en.js';
import {
  BOYER_MOORE_PRESETS,
  MAX_PATTERN,
  MAX_TEXT,
  boyerMoorePseudocode,
  boyerMooreTrace,
  lastOccurrence,
} from './boyer-moore.js';
import { naiveComparisons } from '$lib/algo-engine/text-match.js';

/** Deterministic LCG so random texts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./boyer-moore.js').BoyerMooreFrame[]} frames */
const last = (frames) => /** @type {import('./boyer-moore.js').BoyerMooreFrame} */ (frames.at(-1));

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

describe('Boyer-Moore trace', () => {
  it('finds every occurrence on random inputs, against indexOf', () => {
    const rand = seeded(17);
    for (let round = 0; round < 400; round++) {
      const alphabet = round % 2 ? 'ab' : 'abcd';
      const text = randomWord(1 + Math.floor(rand() * MAX_TEXT), rand, alphabet);
      const pattern = randomWord(1 + Math.floor(rand() * 5), rand, alphabet);
      expect(last(boyerMooreTrace(text, pattern)).matches).toEqual(occurrences(text, pattern));
    }
  });

  it('builds the table with the rightmost index of each letter', () => {
    expect(lastOccurrence('abcab')).toEqual({ a: 3, b: 4, c: 2 });
    expect(last(boyerMooreTrace('zz', 'abcab')).last).toEqual({ a: 3, b: 4, c: 2 });
  });

  it('compares from the right end of the pattern', () => {
    const compares = boyerMooreTrace('abc', 'abc').filter((f) => f.kind === 'compare');
    expect(compares.map((f) => f.j)).toEqual([2, 1, 0]);
  });

  it('skips the whole pattern when the letter is absent', () => {
    const f = last(boyerMooreTrace('aaaaaaaaaaaaaaaaaaaa', 'xyz'));
    expect(f.comparisons).toBe(6);
    expect(f.alignments).toBe(6);
    expect(f.skips).toEqual([3, 3, 3, 3, 3, 3]);
    expect(f.reads).toEqual([2, 5, 8, 11, 14, 17]);
  });

  it('never skips by less than 1, even when the last occurrence is to the right', () => {
    // At j = 0 the letter a has its rightmost occurrence at 4, so j − last is negative.
    const f = last(boyerMooreTrace('aaaaaaaaaaaaaaaa', 'baaaa'));
    expect(f.skips.every((s) => s === 1)).toBe(true);
    expect(f.alignments).toBe(12);
    expect(f.comparisons).toBe(12 * 5);
    expect(naiveComparisons('aaaaaaaaaaaaaaaa', 'baaaa')).toBe(12);
  });

  it('uses the letter just past the window after a match', () => {
    const frames = boyerMooreTrace('abcabd', 'abc');
    const shift = frames.find((f) => f.kind === 'shift');
    expect(shift?.afterMatch).toBe(true);
    expect(shift?.badLetter).toBe('a');
    expect(shift?.skip).toBe(3);
    expect(last(boyerMooreTrace('abab', 'ab')).matches).toEqual([0, 2]);
    expect(last(boyerMooreTrace('aaaa', 'aa')).matches).toEqual([0, 1, 2]);
  });

  it('moves by one after a match at the end of the text', () => {
    const shift = boyerMooreTrace('ab', 'ab').find((f) => f.kind === 'shift');
    expect(shift?.skip).toBe(1);
    expect(shift?.badAt).toBe(-1);
  });

  it('runs no alignment when the pattern is longer than the text', () => {
    const frames = boyerMooreTrace('ab', 'abc');
    expect(last(frames).alignments).toBe(0);
    expect(last(frames).shift).toBe(0);
  });

  it('starts and ends with the agreed kinds', () => {
    const frames = boyerMooreTrace('abc', 'c');
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('never aliases frames', () => {
    const frames = boyerMooreTrace('abab', 'ab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    const f = frames[frames.length - 3];
    f.last.z = 9;
    f.reads.push(99);
    f.skips.push(99);
    f.matches.push(99);
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stays under 400 frames at the caps', () => {
    const cases = [
      ['a'.repeat(MAX_TEXT), 'a'.repeat(MAX_PATTERN)],
      ['a'.repeat(MAX_TEXT), `b${'a'.repeat(MAX_PATTERN - 1)}`],
    ];
    for (const [t, p] of cases) expect(boyerMooreTrace(t, p).length).toBeLessThan(400);
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);
  /** @param {string} t @param {string} p */
  const firstSkip = (t, p) => boyerMooreTrace(t, p).find((f) => f.kind === 'shift')?.skip;

  it('recomputes each skip through the trace', () => {
    // Mismatch at j = 6 on s, which example does not contain.
    expect(practice[0].answer).toBe(firstSkip('xxxxxxs', 'example'));
    // abcab over xxxxc: mismatch at j = 4 on c, whose rightmost index is 2.
    expect(practice[1].answer).toBe(firstSkip('xxxxc', 'abcab'));
    // abcab over xxbab: j = 4 and 3 match, then c meets b, whose rightmost index is 4.
    expect(practice[2].answer).toBe(firstSkip('xxbab', 'abcab'));
  });

  it('counts the presets', () => {
    const absent = BOYER_MOORE_PRESETS.absent;
    expect(practice[3].answer).toBe(last(boyerMooreTrace(absent.text, absent.pattern)).comparisons);
    const worst = BOYER_MOORE_PRESETS.worst;
    expect(practice[4].answer).toBe(last(boyerMooreTrace(worst.text, worst.pattern)).comparisons);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(BOYER_MOORE_PRESETS).flatMap(({ text, pattern }) =>
        boyerMooreTrace(text, pattern).flatMap((f) => f.lines),
      ),
    );
    boyerMoorePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
