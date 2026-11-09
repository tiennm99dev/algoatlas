import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/kmp/copy.en.js';
import {
  KMP_PRESETS,
  MAX_PATTERN,
  MAX_TEXT,
  kmpPseudocode,
  kmpTrace,
  prefixFunction,
} from './kmp.js';
import { naiveComparisons } from '$lib/algo-engine/text-match.js';

/** Deterministic LCG so random texts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./kmp.js').KmpFrame[]} frames */
const last = (frames) => /** @type {import('./kmp.js').KmpFrame} */ (frames.at(-1));

/** Every start where the pattern occurs, overlaps included. @param {string} t @param {string} p */
function occurrences(t, p) {
  const out = [];
  for (let s = t.indexOf(p); s !== -1; s = t.indexOf(p, s + 1)) out.push(s);
  return out;
}

/** π read straight off the definition: longest proper prefix that is also a suffix. @param {string} p */
function piByDefinition(p) {
  return [...p].map((_, i) => {
    const whole = p.slice(0, i + 1);
    for (let len = i; len > 0; len--) {
      if (whole.slice(0, len) === whole.slice(whole.length - len)) return len;
    }
    return 0;
  });
}

/** @param {number} len @param {() => number} rand @param {string} alphabet */
function randomWord(len, rand, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rand() * alphabet.length)];
  return w;
}

describe('prefix function', () => {
  it('matches the definition on random patterns and known cases', () => {
    expect(prefixFunction('ababd')).toEqual([0, 0, 1, 2, 0]);
    expect(prefixFunction('aabaaab')).toEqual([0, 1, 0, 1, 2, 2, 3]);
    expect(prefixFunction('aaaa')).toEqual([0, 1, 2, 3]);
    expect(prefixFunction('a')).toEqual([0]);
    const rand = seeded(3);
    for (let round = 0; round < 200; round++) {
      const p = randomWord(1 + Math.floor(rand() * MAX_PATTERN), rand, 'ab');
      expect(prefixFunction(p)).toEqual(piByDefinition(p));
      expect(last(kmpTrace('a', p)).pi).toEqual(piByDefinition(p));
    }
  });
});

describe('KMP trace', () => {
  it('finds every occurrence on random inputs, against indexOf', () => {
    const rand = seeded(7);
    for (let round = 0; round < 300; round++) {
      const text = randomWord(1 + Math.floor(rand() * MAX_TEXT), rand, 'ab');
      const pattern = randomWord(1 + Math.floor(rand() * 5), rand, 'ab');
      expect(last(kmpTrace(text, pattern)).matches).toEqual(occurrences(text, pattern));
    }
  });

  it('never moves the text index backwards', () => {
    const rand = seeded(13);
    for (let round = 0; round < 50; round++) {
      const text = randomWord(MAX_TEXT, rand, 'ab');
      const frames = kmpTrace(text, randomWord(4, rand, 'ab')).filter(
        (f) => f.phase === 'search' && f.kind !== 'search-start',
      );
      for (let k = 1; k < frames.length; k++) {
        expect(frames[k].i).toBeGreaterThanOrEqual(frames[k - 1].i);
      }
    }
  });

  it('counts comparisons on a hand-checked input', () => {
    // i0 a=a, i1 a=a, i2 b≠a, a=a, i3 b≠a, a=a, i4 b=b.
    const f = last(kmpTrace('aaaab', 'aab'));
    expect(f.comparisons).toBe(7);
    expect(f.falls).toBe(2);
    expect(f.matches).toEqual([2]);
  });

  it('stays within 2n comparisons while the plain matcher does not', () => {
    const { text, pattern } = KMP_PRESETS.repeats;
    const f = last(kmpTrace(text, pattern));
    expect(f.comparisons).toBeLessThanOrEqual(2 * text.length);
    expect(naiveComparisons(text, pattern)).toBeGreaterThan(f.comparisons);
    const rand = seeded(21);
    for (let round = 0; round < 100; round++) {
      const t = randomWord(MAX_TEXT, rand, 'ab');
      const c = last(kmpTrace(t, randomWord(3, rand, 'ab'))).comparisons;
      expect(c).toBeLessThanOrEqual(2 * t.length);
    }
  });

  it('finds overlapping matches by falling back after each one', () => {
    expect(last(kmpTrace('abababab', 'abab')).matches).toEqual([0, 2, 4]);
    expect(last(kmpTrace('aaaa', 'a')).matches).toEqual([0, 1, 2, 3]);
  });

  it('handles a pattern longer than the text and a one letter pattern', () => {
    expect(last(kmpTrace('ab', 'abc')).matches).toEqual([]);
    const frames = kmpTrace('b', 'a');
    expect(frames.at(-1)?.matches).toEqual([]);
    expect(frames.some((f) => f.kind.startsWith('build-'))).toBe(false);
  });

  it('starts and ends with the agreed kinds', () => {
    const frames = kmpTrace('ab', 'a');
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('never aliases frames', () => {
    const frames = kmpTrace('abab', 'ab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    frames[frames.length - 3].pi[0] = 42;
    frames[frames.length - 3].matches.push(42);
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stays under 400 frames at the caps', () => {
    const cases = [
      ['a'.repeat(MAX_TEXT), 'a'.repeat(MAX_PATTERN)],
      ['ab'.repeat(MAX_TEXT / 2), 'ababababab'],
      ['aaaaaaaaab'.repeat(2), 'aaaaaaaaab'],
    ];
    for (const [t, p] of cases) expect(kmpTrace(t, p).length).toBeLessThan(400);
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('reads π[4] of abcabd and π[6] of aabaaab', () => {
    expect(practice[0].answer).toBe(prefixFunction('abcabd')[4]);
    expect(practice[1].answer).toBe(prefixFunction('aabaaab')[6]);
  });

  it('jumps to π[3] of abab after four matched letters', () => {
    expect(practice[2].answer).toBe(prefixFunction('ababd')[3]);
  });

  it('counts both matchers on the repeats example', () => {
    const { text, pattern } = KMP_PRESETS.repeats;
    expect(practice[3].answer).toBe(
      naiveComparisons(text, pattern) - last(kmpTrace(text, pattern)).comparisons,
    );
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(KMP_PRESETS).flatMap(({ text, pattern }) =>
        kmpTrace(text, pattern).flatMap((f) => f.lines),
      ),
    );
    kmpPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
