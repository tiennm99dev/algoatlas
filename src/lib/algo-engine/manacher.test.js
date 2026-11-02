import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/manacher/copy.en.js';
import {
  MANACHER_PRESETS,
  MAX_LEN,
  manacherPseudocode,
  manacherTrace,
  naiveExpansions,
  palindromeAt,
  separate,
} from './manacher.js';

/** Deterministic LCG so random strings are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./manacher.js').ManacherFrame[]} frames */
const last = (frames) => /** @type {import('./manacher.js').ManacherFrame} */ (frames.at(-1));

/** @param {number} len @param {() => number} rand @param {string} alphabet */
function randomWord(len, rand, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rand() * alphabet.length)];
  return w;
}

/** Radii by expanding around every centre. @param {string} t */
function radiiByExpansion(t) {
  return [...t].map((_, i) => {
    let k = 0;
    while (i - k - 1 >= 0 && i + k + 1 < t.length && t[i - k - 1] === t[i + k + 1]) k++;
    return k;
  });
}

/** The length of the longest palindromic substring, by trying them all. @param {string} s */
function longestByTrying(s) {
  let best = 0;
  for (let a = 0; a < s.length; a++) {
    for (let b = a + 1; b <= s.length; b++) {
      const piece = s.slice(a, b);
      if (piece.length > best && piece === [...piece].reverse().join('')) best = piece.length;
    }
  }
  return best;
}

describe('palindromic radii', () => {
  it('match known arrays', () => {
    expect(last(manacherTrace('aba')).p).toEqual([0, 1, 0, 3, 0, 1, 0]);
    expect(last(manacherTrace('abba')).p).toEqual([0, 1, 0, 1, 4, 1, 0, 1, 0]);
    expect(last(manacherTrace('a')).p).toEqual([0, 1, 0]);
  });

  it('match expanding around every centre on random strings', () => {
    const rand = seeded(3);
    for (let round = 0; round < 300; round++) {
      const s = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, round % 2 ? 'ab' : 'abc');
      expect(last(manacherTrace(s)).p).toEqual(radiiByExpansion(separate(s)));
    }
  });

  it('find a longest palindrome on random strings', () => {
    const rand = seeded(5);
    for (let round = 0; round < 300; round++) {
      const s = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, 'ab');
      const f = last(manacherTrace(s));
      const found = palindromeAt(s, f.bestCentre, f.best);
      expect(found.length).toBe(longestByTrying(s));
      expect(found).toBe([...found].reverse().join(''));
      expect(s).toContain(found);
    }
    const f = last(manacherTrace('forgeeksskeegfor'));
    expect(palindromeAt('forgeeksskeegfor', f.bestCentre, f.best)).toBe('geeksskeeg');
  });

  it('keep the furthest palindrome valid while running', () => {
    const rand = seeded(7);
    for (let round = 0; round < 50; round++) {
      const s = randomWord(MAX_LEN, rand, 'ab');
      let furthest = 0;
      for (const f of manacherTrace(s)) {
        expect(f.r).toBeGreaterThanOrEqual(furthest);
        furthest = f.r;
        const piece = f.t.slice(f.c - (f.r - f.c), f.r + 1);
        expect(piece).toBe([...piece].reverse().join(''));
      }
    }
  });
});

describe('cost counters', () => {
  it('stay within 2|T| comparisons and beat expansion on repeats', () => {
    const rand = seeded(11);
    for (let round = 0; round < 100; round++) {
      const s = randomWord(MAX_LEN, rand, 'ab');
      expect(last(manacherTrace(s)).comparisons).toBeLessThanOrEqual(2 * separate(s).length);
    }
    const t = separate('aaaaaaaa');
    expect(last(manacherTrace('aaaaaaaa')).comparisons).toBeLessThan(naiveExpansions(t));
  });

  it('counts expansions on a small case', () => {
    // #a#: i = 1 compares # with # once, the two ends have nothing to compare.
    expect(naiveExpansions('#a#')).toBe(1);
    expect(naiveExpansions('#')).toBe(0);
  });
});

describe('frames', () => {
  it('never alias', () => {
    const frames = manacherTrace('aba');
    const copy = JSON.stringify(frames[frames.length - 2]);
    frames[frames.length - 3].p[0] = 77;
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stay under 400 at the cap', () => {
    for (const s of ['a'.repeat(MAX_LEN), 'ab'.repeat(MAX_LEN / 2), 'forgeeksskeegfor']) {
      expect(manacherTrace(s).length).toBeLessThan(400);
    }
  });

  it('start with start and end with done', () => {
    const frames = manacherTrace('a');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('reads the separated string and radii', () => {
    expect(practice[0].answer).toBe(separate('abba').length);
    expect(practice[1].answer).toBe(last(manacherTrace('abba')).p[4]);
  });

  it('computes the mirror', () => {
    expect(practice[2].answer).toBe(2 * 7 - 9);
    expect(practice[3].answer).toBe(Math.min(12 - 9, 1));
  });

  it('finds the longest palindrome and the comparisons saved', () => {
    const f = last(manacherTrace('xabbay'));
    expect(practice[4].accept).toContain(palindromeAt('xabbay', f.bestCentre, f.best));
    const { repeats } = MANACHER_PRESETS;
    expect(practice[5].answer).toBe(
      naiveExpansions(separate(repeats)) - last(manacherTrace(repeats)).comparisons,
    );
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(MANACHER_PRESETS).flatMap((s) => manacherTrace(s).flatMap((f) => f.lines)),
    );
    manacherPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
