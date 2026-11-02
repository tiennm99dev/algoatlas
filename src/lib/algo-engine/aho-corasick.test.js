import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/aho-corasick/copy.en.js';
import {
  AHO_PRESETS,
  MAX_PATTERNS,
  MAX_PATTERN_LEN,
  MAX_TEXT,
  ROOT,
  ahoPseudocode,
  ahoTrace,
  naiveComparisons,
  parsePatterns,
  prefixOf,
} from './aho-corasick.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./aho-corasick.js').AcFrame[]} frames */
const last = (frames) => /** @type {import('./aho-corasick.js').AcFrame} */ (frames.at(-1));

/** @param {number} len @param {() => number} rand @param {string} alphabet */
function randomWord(len, rand, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rand() * alphabet.length)];
  return w;
}

/** Every occurrence of every pattern, by plain search. @param {string[]} words @param {string} t */
function occurrences(words, t) {
  const out = [];
  for (const word of words) {
    for (let s = t.indexOf(word); s !== -1; s = t.indexOf(word, s + 1)) {
      out.push(`${word}@${s}`);
    }
  }
  return out.sort();
}

/** @param {import('./aho-corasick.js').AcMatch[]} matches */
const keys = (matches) => matches.map((x) => `${x.word}@${x.start}`).sort();

/** @param {() => number} rand @param {string} alphabet */
function randomPatterns(rand, alphabet) {
  const words = new Set();
  const count = 1 + Math.floor(rand() * MAX_PATTERNS);
  while (words.size < count) words.add(randomWord(1 + Math.floor(rand() * 4), rand, alphabet));
  return [...words];
}

describe('Aho-Corasick search', () => {
  it('finds every occurrence on known inputs', () => {
    const f = last(ahoTrace(['he', 'she', 'his', 'hers'], 'ushers'));
    expect(keys(f.matches)).toEqual(['he@2', 'hers@2', 'she@1']);
    expect(last(ahoTrace(['a', 'aa'], 'aaa')).matches).toEqual([
      { word: 'a', start: 0 },
      { word: 'aa', start: 0 },
      { word: 'a', start: 1 },
      { word: 'aa', start: 1 },
      { word: 'a', start: 2 },
    ]);
  });

  it('matches a plain search on random patterns and texts', () => {
    const rand = seeded(7);
    for (let round = 0; round < 300; round++) {
      const alphabet = round % 2 ? 'ab' : 'abc';
      const words = randomPatterns(rand, alphabet);
      const text = randomWord(Math.floor(rand() * MAX_TEXT), rand, alphabet);
      expect(keys(last(ahoTrace(words, text)).matches)).toEqual(occurrences(words, text));
    }
  });

  it('reports a match on the frame that reads its last letter', () => {
    for (const f of ahoTrace(['he', 'she'], 'she')) {
      if (f.kind === 'report') expect(f.i).toBe(2);
    }
    expect(last(ahoTrace(['abc'], '')).matches).toEqual([]);
  });
});

describe('failure and output links', () => {
  it('sets the known links of the classic trie', () => {
    const { nodes } = last(ahoTrace(['he', 'she', 'his', 'hers'], ''));
    /** @param {string} prefix */
    const find = (prefix) => nodes.findIndex((n) => prefixOf(nodes, n.id) === prefix);
    /** @param {string} prefix */
    const failOf = (prefix) => prefixOf(nodes, /** @type {number} */ (nodes[find(prefix)].fail));
    expect(nodes.length).toBe(10);
    expect(failOf('she')).toBe('he');
    expect(failOf('sh')).toBe('h');
    expect(failOf('his')).toBe('s');
    expect(failOf('hers')).toBe('s');
    expect(failOf('her')).toBe('');
    expect(nodes[find('she')].out).toBe(find('he'));
    expect(nodes[find('his')].out).toBe(null);
  });

  it('points every link at the longest proper suffix, by definition', () => {
    const rand = seeded(13);
    for (let round = 0; round < 200; round++) {
      const words = randomPatterns(rand, 'ab');
      const { nodes } = last(ahoTrace(words, ''));
      const prefixes = new Set(nodes.map((n) => prefixOf(nodes, n.id)));
      for (const n of nodes) {
        const p = prefixOf(nodes, n.id);
        if (n.id === ROOT) continue;
        let longest = '';
        let longestWord = null;
        for (let k = p.length - 1; k >= 0; k--) {
          const suffix = p.slice(p.length - k);
          if (longest === '' && prefixes.has(suffix)) longest = suffix;
          if (longestWord === null && words.includes(suffix)) longestWord = suffix;
        }
        expect(prefixOf(nodes, /** @type {number} */ (n.fail))).toBe(longest);
        expect(n.out === null ? null : nodes[n.out].word).toBe(longestWord);
      }
    }
  });
});

describe('cost counters', () => {
  it('reads each letter once and never hops more than it advanced', () => {
    const rand = seeded(17);
    for (let round = 0; round < 200; round++) {
      const words = randomPatterns(rand, 'ab');
      const text = randomWord(MAX_TEXT, rand, 'ab');
      const frames = ahoTrace(words, text);
      expect(frames.filter((f) => f.kind === 'read').length).toBe(text.length);
      const f = last(frames);
      expect(f.hops).toBeLessThanOrEqual(f.edges);
      expect(f.edges).toBeLessThanOrEqual(text.length);
    }
  });

  it('counts the known scan of ushers', () => {
    const f = last(ahoTrace(['he', 'she', 'his', 'hers'], 'ushers'));
    expect(f.edges).toBe(5);
    expect(f.hops).toBe(1);
    expect(f.matches.length).toBe(3);
  });

  it('counts naive comparisons on a small case', () => {
    // at 0: a=a, b≠a; at 1: a≠b; at 2: a=a, b=b.
    expect(naiveComparisons(['ab'], 'aab')).toBe(4);
  });
});

describe('parsePatterns', () => {
  it('accepts commas or spaces and refuses bad lists', () => {
    expect(parsePatterns('He, she  his')).toEqual({ words: ['he', 'she', 'his'] });
    expect(parsePatterns(' , ')).toEqual({ error: 'empty' });
    expect(parsePatterns('a1')).toEqual({ error: 'format' });
    expect(parsePatterns('a b c d e f g')).toEqual({ error: 'count' });
    expect(parsePatterns('a'.repeat(MAX_PATTERN_LEN + 1))).toEqual({ error: 'length' });
    expect(parsePatterns('a a')).toEqual({ error: 'duplicate' });
  });
});

describe('frames', () => {
  it('never alias', () => {
    const frames = ahoTrace(['ab', 'b'], 'ab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    const earlier = frames[frames.length - 3];
    earlier.nodes[1].next.z = 77;
    earlier.nodes[1].fail = 77;
    earlier.queue.push(77);
    earlier.matches.push({ word: 'z', start: 77 });
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stay under 400 at the cap', () => {
    const nested = Array.from({ length: MAX_PATTERNS }, (_, k) => 'a'.repeat(k + 1));
    expect(ahoTrace(nested, 'a'.repeat(MAX_TEXT)).length).toBeLessThan(400);
    const apart = ['aaaaaa', 'bbbbbb', 'cccccc', 'dddddd', 'eeeeee', 'ffffff'];
    expect(ahoTrace(apart, 'abcdef'.repeat(4)).length).toBeLessThan(400);
    expect(
      ahoTrace(['aaaaab', 'aaaab', 'aaab', 'aab', 'ab', 'b'], 'a'.repeat(23) + 'b').length,
    ).toBeLessThan(400);
  });

  it('start with start and end with done', () => {
    const frames = ahoTrace(['a'], 'a');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);
  const classic = ['he', 'she', 'his', 'hers'];

  it('counts the trie and its matches', () => {
    expect(practice[0].answer).toBe(last(ahoTrace(classic, '')).nodes.length);
    expect(practice[2].answer).toBe(last(ahoTrace(classic, 'ushers')).matches.length);
    expect(practice[3].answer).toBe(last(ahoTrace(['a', 'aa', 'aaa'], 'aaaa')).matches.length);
  });

  it('names the failure target of she', () => {
    const { nodes } = last(ahoTrace(classic, ''));
    const she = nodes.findIndex((n) => prefixOf(nodes, n.id) === 'she');
    expect(practice[1].accept).toContain(prefixOf(nodes, /** @type {number} */ (nodes[she].fail)));
  });

  it('reads the state after the fallback', () => {
    const f = ahoTrace(['abcd', 'bc', 'c', 'bcx'], 'abcx').filter((x) => x.kind === 'fallback');
    expect(f.length).toBe(practice[4].answer);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(AHO_PRESETS).flatMap(({ patterns, text }) =>
        ahoTrace(patterns, text).flatMap((f) => f.lines),
      ),
    );
    ahoPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
