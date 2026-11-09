import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/tries/copy.en.js';
import {
  MAX_LEN,
  MAX_OPS,
  MAX_WORDS,
  makeTrieOps,
  matchPrefix,
  prefixOf,
  triePseudocode,
  trieTrace,
} from './tries.js';
import { parseLetters } from '$lib/algo-engine/text-match.js';

/** Deterministic LCG so random words are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {string[]} words @returns {import('./tries.js').TrieOp[]} */
const inserts = (words) => words.map((word) => ({ type: 'insert', word }));

/** @param {import('./tries.js').TrieFrame[]} frames */
const last = (frames) => /** @type {import('./tries.js').TrieFrame} */ (frames.at(-1));

/** The frames of one operation. @param {import('./tries.js').TrieFrame[]} frames @param {number} i */
const ofOp = (frames, i) => frames.filter((f) => f.opIndex === i);

/** Node count, root included, read off the set of all prefixes. @param {string[]} words */
const prefixCount = (words) => {
  const seen = new Set(['']);
  for (const w of words) for (let k = 1; k <= w.length; k++) seen.add(w.slice(0, k));
  return seen.size;
};

describe('trie trace', () => {
  it('starts with only the root and ends with start and done frames', () => {
    const frames = trieTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].nodeCount).toBe(1);
  });

  it('agrees with a sorted word list and a prefix set on random logs', () => {
    const rand = seeded(11);
    for (let round = 0; round < 40; round++) {
      /** @type {string[]} */
      const words = [];
      for (let i = 0; i < 8; i++) {
        let w = '';
        const len = 1 + Math.floor(rand() * 5);
        for (let k = 0; k < len; k++) w += 'abc'[Math.floor(rand() * 3)];
        words.push(w);
      }
      const unique = [...new Set(words)];
      /** @type {import('./tries.js').TrieOp[]} */
      const ops = [...inserts(words)];
      const probes = ['a', 'ab', 'abc', 'b', 'cab', 'ca', 'bbb'];
      for (const word of probes) ops.push({ type: 'search', word }, { type: 'complete', word });
      const frames = trieTrace(ops);
      expect(last(frames).wordCount).toBe(unique.length);
      expect(last(frames).nodeCount).toBe(prefixCount(unique));
      probes.forEach((word, p) => {
        const search = ofOp(frames, words.length + 2 * p).at(-1);
        expect(search?.kind === 'found').toBe(unique.includes(word));
        const complete = ofOp(frames, words.length + 2 * p + 1).at(-1);
        const expected = unique.filter((w) => w.startsWith(word)).sort();
        expect(complete?.results ?? []).toEqual(expected);
        expect(matchPrefix(last(frames).nodes, word).words).toEqual(expected);
      });
    }
  });

  it('creates only the letters a new word does not share', () => {
    const before = last(trieTrace(inserts(['car']))).nodeCount;
    const frames = trieTrace(inserts(['car', 'card']));
    expect(last(frames).nodeCount).toBe(before + 1);
    expect(ofOp(frames, 1).map((f) => f.kind)).toEqual([
      'begin',
      'follow',
      'follow',
      'follow',
      'create',
      'mark',
    ]);
  });

  it('counts one step per letter of a search however many words are stored', () => {
    for (const words of [['tea'], ['tea', 'ten', 'to', 'team', 'dog', 'dot', 'do', 'ant']]) {
      const frames = trieTrace([...inserts(words), { type: 'search', word: 'tea' }]);
      expect(ofOp(frames, words.length).at(-1)?.steps).toBe(3);
    }
  });

  it('tells a stored word from a prefix that is only on the way to one', () => {
    const frames = trieTrace([
      ...inserts(['car']),
      { type: 'search', word: 'ca' },
      { type: 'search', word: 'car' },
      { type: 'search', word: 'cab' },
    ]);
    expect(ofOp(frames, 1).at(-1)?.kind).toBe('prefix-only');
    expect(ofOp(frames, 2).at(-1)?.kind).toBe('found');
    expect(ofOp(frames, 3).at(-1)?.kind).toBe('missing');
  });

  it('ignores a duplicate insert without counting it twice', () => {
    const frames = trieTrace(inserts(['do', 'do']));
    expect(ofOp(frames, 1).at(-1)?.kind).toBe('dup');
    expect(last(frames).wordCount).toBe(1);
    expect(last(frames).letterCount).toBe(2);
  });

  it('reports completions depth-first, a word before the words it starts', () => {
    const frames = trieTrace([
      ...inserts(['cat', 'care', 'car', 'card']),
      { type: 'complete', word: 'ca' },
    ]);
    expect(ofOp(frames, 4).at(-1)?.results).toEqual(['car', 'card', 'care', 'cat']);
    // The walk reads c and a, then the four nodes below a: r, d, e, t.
    expect(ofOp(frames, 4).at(-1)?.steps).toBe(6);
  });

  it('counts the letters and nodes of stored words together, never a word still going in', () => {
    for (const f of trieTrace(makeTrieOps('shared'))) {
      expect(f.storedNodeCount).toBeLessThanOrEqual(f.letterCount);
    }
    const creating = trieTrace([{ type: 'insert', word: 'dog' }]).find((f) => f.kind === 'create');
    expect(creating?.nodeCount).toBe(2);
    expect(creating?.storedNodeCount).toBe(0);
  });

  it('never aliases frames', () => {
    const frames = trieTrace(inserts(['ab', 'ac']));
    const snapshot = JSON.stringify(frames.at(-2));
    frames[2].nodes[0].next.z = 99;
    frames[2].path.push(99);
    expect(JSON.stringify(frames.at(-2))).toBe(snapshot);
    expect(frames[3].nodes[0].next.z).toBeUndefined();
  });

  it('stays under 400 frames at the size caps', () => {
    const words = Array.from({ length: MAX_WORDS }, (_, i) =>
      `aaaaaaa${'abcdefghij'[i]}`.slice(0, MAX_LEN),
    );
    /** @type {import('./tries.js').TrieOp[]} */
    const ops = [...inserts(words)];
    while (ops.length < MAX_OPS) ops.push({ type: 'complete', word: 'a' });
    expect(trieTrace(ops).length).toBeLessThan(400);
  });
});

describe('helpers', () => {
  it('reads words and refuses anything else', () => {
    expect(parseLetters('  CaT ', 8)).toEqual({ word: 'cat' });
    expect(parseLetters('   ', 8)).toEqual({ error: 'empty' });
    expect(parseLetters('a b', 8)).toEqual({ error: 'format' });
    expect(parseLetters('abcdefghi', 8)).toEqual({ error: 'length' });
  });

  it('follows a typed prefix as far as the trie goes', () => {
    const { nodes } = last(trieTrace(inserts(['car', 'cat'])));
    const partial = matchPrefix(nodes, 'cub');
    expect(partial.matched).toBe(1);
    expect(partial.words).toEqual([]);
    const whole = matchPrefix(nodes, 'ca');
    expect(whole.matched).toBe(2);
    expect(whole.isWord).toBe(false);
    expect(whole.words).toEqual(['car', 'cat']);
    expect(prefixOf(nodes, whole.path[2])).toBe('ca');
  });

  it('builds the presets with the promised sharing', () => {
    const shared = last(trieTrace(makeTrieOps('shared')));
    expect(shared.nodeCount).toBe(11);
    expect(shared.letterCount).toBe(20);
    const apart = last(trieTrace(makeTrieOps('apart')));
    expect(apart.nodeCount - 1).toBe(apart.letterCount);
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('counts the nodes of the tea, ten, team, to trie', () => {
    const nodes = last(trieTrace(inserts(['tea', 'ten', 'team', 'to']))).nodeCount;
    expect(practice[0].answer).toBe(nodes);
  });

  it('counts the nodes card adds to a trie holding car', () => {
    const before = last(trieTrace(inserts(['car']))).nodeCount;
    const after = last(trieTrace(inserts(['car', 'card']))).nodeCount;
    expect(practice[1].answer).toBe(after - before);
  });

  it('orders the completions the way the trace reports them', () => {
    const { items, answer } = practice[3];
    const frames = trieTrace([
      ...inserts(['cat', 'car', 'care', 'card']),
      { type: 'complete', word: 'ca' },
    ]);
    expect(answer.map((/** @type {number} */ i) => items[i])).toEqual(
      ofOp(frames, 4).at(-1)?.results,
    );
  });

  it('counts the letters and nodes saved by sharing', () => {
    const f = last(trieTrace(inserts(['stop', 'star', 'start'])));
    expect(practice[4].answer).toBe(f.letterCount - (f.nodeCount - 1));
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const frames = trieTrace([
      ...makeTrieOps('shared'),
      { type: 'search', word: 'zebra' },
      { type: 'complete', word: 'zoo' },
    ]);
    const seen = new Set(frames.flatMap((f) => f.lines));
    triePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
