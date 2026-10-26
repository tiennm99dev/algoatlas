import { describe, expect, it } from 'vitest';
import {
  MAX_WORDS,
  PRESET_TEXT,
  countPseudocode,
  countTrace,
  parseWords,
} from './sets-maps-counting.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Counts with nested loops: for each distinct word, count its copies.
 * @param {string[]} words
 */
function oracle(words) {
  /** @type {string[]} */
  const distinct = [];
  for (const w of words) if (!distinct.includes(w)) distinct.push(w);
  return distinct
    .map((w, first) => ({ word: w, count: words.filter((x) => x === w).length, first }))
    .sort((a, b) => b.count - a.count || a.first - b.first)
    .map(({ word, count }) => ({ word, count }));
}

/** @param {import('./sets-maps-counting.js').CountEntry[]} entries */
const strip = (entries) => entries.map(({ word, count }) => ({ word, count }));

describe('countTrace', () => {
  it('matches a nested-loop count on random streams', () => {
    const rand = seeded(9);
    const vocab = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let run = 0; run < 100; run++) {
      const n = 1 + Math.floor(rand() * MAX_WORDS);
      const words = Array.from({ length: n }, () => vocab[Math.floor(rand() * vocab.length)]);
      const frames = countTrace(words);
      const last = frames.at(-1);
      expect(last?.kind).toBe('done');
      expect(strip(last?.entries ?? [])).toEqual(oracle(words));
      expect(last?.lookups).toBe(n);
      expect(last?.repeats).toBe(n - (last?.entries.length ?? 0));
      expect(frames.filter((f) => f.kind === 'miss')).toHaveLength(last?.entries.length ?? -1);
    }
  });

  it('counts the list-scan comparisons of a front-to-back search', () => {
    const words = parseWords(PRESET_TEXT.hamlet);
    if ('error' in words) throw new Error('preset must parse');
    const last = countTrace(words.words).at(-1);
    // Misses cost 0 + 1 + 2 + 3 + 4 + 5 + 6 + 7; "to" and "be" are found at positions 1 and 2.
    expect(last?.listCompares).toBe(31);
    expect(last?.firstRepeat).toBe('to');
  });

  it('pays (n − 1)n/2 list comparisons on all-distinct words but n hash lookups', () => {
    const words = Array.from({ length: 10 }, (_, i) => String.fromCharCode(97 + i));
    const last = countTrace(words).at(-1);
    expect(last?.listCompares).toBe(45);
    expect(last?.lookups).toBe(10);
    expect(last?.firstRepeat).toBe('');
  });

  it('pays one list comparison per repeat of a single word', () => {
    const last = countTrace(['x', 'x', 'x', 'x']).at(-1);
    expect(last?.listCompares).toBe(3);
    expect(last?.entries).toEqual([{ word: 'x', count: 4, first: 0 }]);
  });

  it('handles an empty stream', () => {
    expect(countTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('breaks count ties by first appearance', () => {
    const last = countTrace(['b', 'a', 'a', 'b', 'c']).at(-1);
    expect(last?.entries.map((e) => e.word)).toEqual(['b', 'a', 'c']);
  });
});

describe('frames', () => {
  it('are not aliased', () => {
    const frames = countTrace(['a', 'b', 'a']);
    const next = JSON.stringify(frames[4].entries);
    frames[3].entries[0].count = 99;
    frames[3].entries.push({ word: 'z', count: 1, first: 9 });
    expect(JSON.stringify(frames[4].entries)).toBe(next);
  });

  it('stay under 400 at the word cap', () => {
    expect(countTrace(Array(MAX_WORDS).fill('w')).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(countTrace(['a', 'a']).flatMap((f) => f.lines));
    for (const mode of /** @type {const} */ (['map', 'set'])) {
      expect([...seen].sort((a, b) => a - b)).toEqual(countPseudocode[mode].map((_, i) => i));
    }
  });
});

describe('parseWords', () => {
  it('lower-cases and keeps inner apostrophes', () => {
    expect(parseWords('The cat, the HAT! Don’t stop.')).toEqual({
      words: ['the', 'cat', 'the', 'hat', "don't", 'stop'],
    });
  });

  it('rejects empty, long and over-long input', () => {
    expect(parseWords(' 123 !! ')).toEqual({ error: 'empty' });
    expect(parseWords(Array(41).fill('a').join(' '))).toEqual({ error: 'count' });
    expect(parseWords('supercalifragilistic')).toEqual({ error: 'length' });
  });

  it('parses every preset', () => {
    for (const text of Object.values(PRESET_TEXT)) expect('words' in parseWords(text)).toBe(true);
  });
});
