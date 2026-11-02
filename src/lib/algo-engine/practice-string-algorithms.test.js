import { describe, expect, it } from 'vitest';
import {
  HASH_BASE,
  HASH_MOD,
  MATCHER_IDS,
  MAX_PATTERN,
  MAX_TEXT,
  STRING_PRESETS,
  palindromeAt,
  parseWord,
  searchPseudocode,
  searchTrace,
  structurePseudocode,
  structureTrace,
  tryPeriodComparisons,
} from './practice-string-algorithms.js';

/** @typedef {import('./practice-string-algorithms.js').SearchFrame} SearchFrame */
/** @typedef {import('./practice-string-algorithms.js').StructureFrame} StructureFrame */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {() => number} rand @param {number} length @param {number} letters */
function randomWord(rand, length, letters) {
  let word = '';
  for (let i = 0; i < length; i++) word += String.fromCharCode(97 + Math.floor(rand() * letters));
  return word;
}

/** Every start of the pattern, read with the language's own search. @param {string} t @param {string} p */
function oracleMatches(t, p) {
  const out = [];
  for (let at = t.indexOf(p); at >= 0; at = t.indexOf(p, at + 1)) out.push(at);
  return out;
}

/** Every period from its definition, smallest first. @param {string} s */
function oraclePeriods(s) {
  const out = [];
  for (let p = 1; p <= s.length; p++) {
    if (s.slice(p) === s.slice(0, s.length - p)) out.push(p);
  }
  return out;
}

/** The count and longest length of palindromic substrings, from the definition. @param {string} s */
function oraclePalindromes(s) {
  let total = 0;
  let longest = 0;
  for (let a = 0; a < s.length; a++) {
    for (let b = a + 1; b <= s.length; b++) {
      const piece = s.slice(a, b);
      if (piece === [...piece].reverse().join('')) {
        total++;
        longest = Math.max(longest, b - a);
      }
    }
  }
  return { total, longest };
}

/** @param {string} s */
function hashOf(s) {
  let h = 0;
  for (const c of s) h = (h * HASH_BASE + c.charCodeAt(0) - 96) % HASH_MOD;
  return h;
}

/** @template T @param {T[]} frames @returns {T} */
const last = (frames) => /** @type {T} */ (frames.at(-1));

describe('parseWord', () => {
  it('normalises case and space and refuses what is not a word', () => {
    expect(parseWord('  AbC ', 5)).toEqual({ word: 'abc' });
    expect(parseWord('  ', 5)).toEqual({ error: 'empty' });
    expect(parseWord('a b', 5)).toEqual({ error: 'format' });
    expect(parseWord('abcdef', 5)).toEqual({ error: 'length' });
  });
});

describe('search race', () => {
  it('has all five matchers agree with the oracle on random and edge inputs', () => {
    const rand = seeded(7);
    const cases = [
      ['a', 'a'],
      ['ab', 'b'],
      ['aaaa', 'aa'],
      ['abc', 'abc'],
      ['abc', 'x'],
      ['abababab', 'aba'],
    ];
    for (let round = 0; round < 300; round++) {
      const letters = 1 + Math.floor(rand() * 4);
      const n = 1 + Math.floor(rand() * MAX_TEXT);
      const m = 1 + Math.floor(rand() * Math.min(n, MAX_PATTERN));
      cases.push([randomWord(rand, n, letters), randomWord(rand, m, letters)]);
    }
    for (const [text, pattern] of cases) {
      const expected = oracleMatches(text, pattern);
      const done = last(searchTrace(text, pattern));
      for (const id of MATCHER_IDS) {
        const found = done.runs[id].matches.slice().sort((a, b) => a - b);
        expect(found, `${id} on ${text} / ${pattern}`).toEqual(expected);
      }
    }
  });

  it('counts the known steps of each matcher', () => {
    const steps = (/** @type {string} */ t, /** @type {string} */ p) => {
      const done = last(searchTrace(t, p));
      return MATCHER_IDS.map((id) => done.runs[id].steps);
    };
    const a40 = 'a'.repeat(MAX_TEXT);
    // Plain: 4 letters at each of 37 starts. KMP: 3 to build, one read per text letter.
    // Boyer-Moore: 4 table entries plus 4 letters per start. Rabin-Karp: 8 letters hashed,
    // 37 hash checks, 148 letters verified and 72 letters rolled.
    expect(steps(a40, 'aaaa')).toEqual([148, 8 + 37 + 148 + 72, 3 + 40, 4 + 148, 83]);
    // Boyer-Moore fails at once on the b at every start and skips 1.
    expect(steps(a40, 'aaab')[3]).toBe(4 + 37);
    // The plain scan fails at once on the b at every start.
    expect(steps(a40, 'baaa')[0]).toBe(37);
    expect(steps(a40, 'baaa')[3]).toBe(4 + 148);
  });

  it('reads each lesson variant right on a small example', () => {
    const frames = searchTrace('hereisasimpleexample', 'example');
    const done = last(frames);
    expect(done.runs.boyer.matches).toEqual([13]);
    expect(done.runs.boyer.prep).toBe(7);
    // Compared from the right, the classic example needs only a few reads per alignment.
    expect(done.runs.boyer.search).toBeLessThan(20);
    // KMP reads each of the 20 text letters once, plus one more read after each fallback.
    expect(done.runs.kmp.search).toBeGreaterThanOrEqual(20);
    expect(done.runs.kmp.search).toBeLessThan(40);
  });

  it('keeps the rolling hash equal to a hash computed from scratch', () => {
    const rand = seeded(11);
    for (let round = 0; round < 40; round++) {
      const text = randomWord(rand, 30, 26);
      const pattern = randomWord(rand, 1 + Math.floor(rand() * 5), 26);
      for (const f of searchTrace(text, pattern)) {
        const r = f.runs.rabin;
        if (r.finished || r.kind !== 'hash-check') continue;
        expect(r.hash).toBe(hashOf(text.slice(r.shift, r.shift + pattern.length)));
        expect(r.target).toBe(hashOf(pattern));
      }
    }
  });

  it('counts a spurious hit when a hash collides and never a true match as one', () => {
    const done = last(searchTrace(STRING_PRESETS.english.text, STRING_PRESETS.english.pattern));
    expect(done.runs.rabin.hits).toBe(1);
    expect(hashOf('kbro')).toBe(hashOf('lazy'));
    const clean = last(searchTrace('aaaa', 'aa'));
    expect(clean.runs.rabin.hits).toBe(0);
  });

  it('spends one step per tick and marks each matcher finished one tick after its last', () => {
    const frames = searchTrace('abcabc', 'ca');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
    for (const f of frames) {
      for (const id of MATCHER_IDS) {
        const r = f.runs[id];
        const total = last(frames).runs[id].steps;
        expect(r.steps).toBe(Math.min(f.tick, total));
        expect(r.prep + r.search).toBe(r.steps);
        expect(r.finished).toBe(f.tick > total);
      }
    }
  });

  it('orders the finishers by steps and names every cheapest matcher', () => {
    const { text, pattern } = STRING_PRESETS.head;
    const done = last(searchTrace(text, pattern));
    expect(done.cheapest).toEqual(['naive']);
    expect(done.finishers[0]).toBe('naive');
    expect(done.finishers.at(-1)).toBe('boyer');
    expect(searchTrace(text, pattern)[1].cheapest).toEqual([]);
    const tied = last(searchTrace('a', 'b'));
    expect(tied.cheapest).toEqual(['naive', 'kmp']);
  });

  it('stays under about 400 frames at the size caps', () => {
    const frames = searchTrace('a'.repeat(MAX_TEXT), 'a'.repeat(MAX_PATTERN));
    expect(frames.length).toBeLessThanOrEqual(400);
    expect(frames.length).toBeGreaterThan(300);
  });

  it('does not alias frames', () => {
    const frames = searchTrace('aaaa', 'aa');
    const before = frames[frames.length - 2].runs.kmp.matches.length;
    last(frames).runs.kmp.matches.push(99);
    last(frames).runs.kmp.lines.push(99);
    expect(frames[frames.length - 2].runs.kmp.matches.length).toBe(before);
    expect(frames[frames.length - 2].runs.kmp.lines).not.toContain(99);
  });
});

describe('structure reading', () => {
  it('matches the definitions of period and palindrome on random and edge texts', () => {
    const rand = seeded(13);
    const texts = ['a', 'ab', 'aa', 'aba', 'abab', 'aaaa', 'abcabcabc', 'forgeeksskeegfor'];
    for (let round = 0; round < 200; round++) {
      texts.push(randomWord(rand, 1 + Math.floor(rand() * MAX_TEXT), 1 + Math.floor(rand() * 3)));
    }
    for (const text of texts) {
      const done = last(structureTrace(text));
      const periods = oraclePeriods(text);
      expect(done.periods, text).toEqual(periods);
      expect(done.period, text).toBe(periods[0]);
      expect(done.repeats, text).toBe(
        text.length % periods[0] === 0 ? text.length / periods[0] : 1,
      );
      expect(done.borders, text).toEqual(periods.slice(0, -1).map((p) => text.length - p));
      const { total, longest } = oraclePalindromes(text);
      expect(done.palindromes, text).toBe(total);
      expect(done.best, text).toBe(longest);
      const best = palindromeAt(text, done.bestCentre, done.best);
      expect(best.length).toBe(longest);
      expect(best).toBe([...best].reverse().join(''));
      expect(text).toContain(best);
    }
  });

  it('counts the known comparisons of all-equal letters', () => {
    const done = last(structureTrace('aaaa'));
    expect(done.piComparisons).toBe(3);
    expect(done.tryPeriods).toBe(3);
    expect(done.palComparisons).toBe(7);
    expect(done.tryCentres).toBe(16);
    const a40 = last(structureTrace('a'.repeat(MAX_TEXT)));
    expect(a40.palComparisons).toBe(79);
    expect(a40.tryCentres).toBe(1600);
    expect(a40.palindromes).toBe(820);
  });

  it('counts the comparisons of testing periods until one holds', () => {
    expect(tryPeriodComparisons('a')).toBe(0);
    expect(tryPeriodComparisons('ab')).toBe(1);
    // Period 1 fails on the first pair; period 2 holds over its 2 pairs.
    expect(tryPeriodComparisons('abab')).toBe(3);
  });

  it('reads a text with no border as its own only period', () => {
    const done = last(structureTrace('abc'));
    expect(done.period).toBe(3);
    expect(done.repeats).toBe(1);
    expect(done.borders).toEqual([]);
    expect(done.periods).toEqual([3]);
  });

  it('opens on start and closes on done with a frame for every letter and centre', () => {
    const frames = structureTrace('abba');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
    expect(frames.filter((f) => f.kind === 'pi')).toHaveLength(3);
    expect(frames.filter((f) => f.kind === 'period')).toHaveLength(1);
    expect(frames.filter((f) => f.kind === 'centre')).toHaveLength(9);
    expect(structureTrace('a'.repeat(MAX_TEXT)).length).toBeLessThanOrEqual(400);
  });

  it('does not alias frames', () => {
    const frames = structureTrace('abab');
    frames[1].pi[0] = 99;
    frames[1].radii[0] = 99;
    expect(frames[2].pi[0]).toBe(0);
    expect(frames[2].radii[0]).toBe(null);
  });
});

describe('pseudocode coverage', () => {
  const inputs = [
    ['aabaacaabaab', 'aabaa'],
    ['thequickbrownfoxjumpsoverthelazydog', 'lazy'],
    ['aaaaaa', 'aa'],
    ['a', 'a'],
  ];

  it.each(MATCHER_IDS)('%s highlights every line of its pseudocode', (id) => {
    const seen = new Set();
    for (const [text, pattern] of inputs) {
      for (const f of searchTrace(text, pattern)) {
        for (const line of f.runs[id].lines) seen.add(line);
      }
    }
    searchPseudocode[id].forEach((_, line) => expect(seen.has(line), `line ${line}`).toBe(true));
  });

  it('highlights every line of the structure pseudocode', () => {
    const seen = new Set();
    for (const text of ['aabaabaaa', 'abba', 'a']) {
      for (const f of structureTrace(text)) for (const line of f.lines) seen.add(line);
    }
    structurePseudocode.forEach((_, line) => expect(seen.has(line), `line ${line}`).toBe(true));
  });
});
