import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  countSymbols,
  fixedBits,
  formatFrequencies,
  huffmanPseudocode,
  huffmanTrace,
  parseFrequencies,
} from './huffman-coding.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./huffman-coding.js').SymbolFreq} SymbolFreq */

/**
 * Cheapest code by trying every merge order: any full binary tree can be built by merging some
 * pair again and again, and its cost is the sum of the merged weights.
 * @param {number[]} weights
 * @returns {number}
 */
function bruteCost(weights) {
  if (weights.length <= 1) return 0;
  let best = Infinity;
  for (let i = 0; i < weights.length; i++) {
    for (let j = i + 1; j < weights.length; j++) {
      const rest = weights.filter((_, k) => k !== i && k !== j);
      best = Math.min(
        best,
        weights[i] + weights[j] + bruteCost([...rest, weights[i] + weights[j]]),
      );
    }
  }
  return best;
}

/** @param {number} n @param {() => number} rand @returns {SymbolFreq[]} */
const randomSymbols = (n, rand) =>
  Array.from({ length: n }, (_, i) => ({
    symbol: String.fromCharCode(97 + i),
    freq: 1 + Math.floor(rand() * 30),
  }));

const CLRS = [
  { symbol: 'a', freq: 45 },
  { symbol: 'b', freq: 13 },
  { symbol: 'c', freq: 12 },
  { symbol: 'd', freq: 16 },
  { symbol: 'e', freq: 9 },
  { symbol: 'f', freq: 5 },
];

describe('huffman trace', () => {
  it('builds the textbook code for a:45 b:13 c:12 d:16 e:9 f:5', () => {
    const done = huffmanTrace(CLRS).at(-1);
    expect(done?.codes.slice(0, 6)).toEqual(['0', '101', '100', '111', '1101', '1100']);
    expect(done?.cost).toBe(224);
    expect(done?.merges).toBe(5);
    expect(fixedBits(CLRS)).toBe(300);
  });

  it('matches the cheapest possible code on random inputs', () => {
    const rand = seeded(6);
    for (let t = 0; t < 40; t++) {
      const symbols = randomSymbols(2 + (t % 5), rand);
      const done = huffmanTrace(symbols).at(-1);
      if (!done) throw new Error('empty trace');
      const bits = symbols.reduce((s, x, i) => s + x.freq * done.codes[i].length, 0);
      expect(bits).toBe(done.cost);
      expect(bits).toBe(bruteCost(symbols.map((x) => x.freq)));
    }
  });

  it('gives a prefix-free code that fills the tree (Kraft sum 1)', () => {
    const rand = seeded(13);
    for (let t = 0; t < 30; t++) {
      const symbols = randomSymbols(2 + (t % (MAX_N - 1)), rand);
      const codes = huffmanTrace(symbols).at(-1)?.codes.slice(0, symbols.length) ?? [];
      for (const a of codes) {
        for (const b of codes) if (a !== b) expect(b.startsWith(a)).toBe(false);
      }
      expect(codes.reduce((s, c) => s + 2 ** -c.length, 0)).toBe(1);
    }
  });

  it('always merges the two lightest trees, lighter one on the left', () => {
    const frames = huffmanTrace(randomSymbols(8, seeded(2)));
    for (const f of frames.filter((x) => x.kind === 'pick')) {
      const [x, y] = f.picked;
      const others = f.queue.slice(2).map((id) => f.nodes[id].weight);
      expect(f.nodes[x].weight).toBeLessThanOrEqual(f.nodes[y].weight);
      for (const w of others) expect(f.nodes[y].weight).toBeLessThanOrEqual(w);
    }
  });

  it('codes two symbols with one bit each', () => {
    const done = huffmanTrace([
      { symbol: 'x', freq: 3 },
      { symbol: 'y', freq: 7 },
    ]).at(-1);
    expect(done?.codes).toEqual(['0', '1']);
    expect(done?.cost).toBe(10);
  });

  it('breaks weight ties by creation order', () => {
    const frames = huffmanTrace([
      { symbol: 'a', freq: 1 },
      { symbol: 'b', freq: 1 },
      { symbol: 'c', freq: 2 },
    ]);
    // a + b makes a node of weight 2 that ties with c; c is older, so it is taken first.
    const second = frames.filter((f) => f.kind === 'pick')[1];
    expect(second.picked).toEqual([2, 3]);
  });

  it('starts at start, ends at done, stays small and keeps frames independent', () => {
    const symbols = CLRS.map((s) => ({ ...s }));
    const frames = huffmanTrace(symbols);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(huffmanTrace(randomSymbols(MAX_N, seeded(1))).length).toBeLessThan(400);
    symbols[0].freq = 1;
    expect(frames[0].nodes[0].weight).toBe(45);
    frames[1].nodes[0].weight = -1;
    frames[1].queue[0] = -1;
    frames[1].codes[0] = 'x';
    expect(frames[2].nodes[0].weight).toBe(45);
    expect(frames[2].queue[0]).not.toBe(-1);
    expect(frames[2].codes[0]).toBe('');
  });
});

describe('reading frequencies', () => {
  it('parses symbol:frequency pairs and refuses bad input', () => {
    expect(parseFrequencies('a:45, b:13 ␣:2')).toEqual({
      symbols: [
        { symbol: 'a', freq: 45 },
        { symbol: 'b', freq: 13 },
        { symbol: '␣', freq: 2 },
      ],
    });
    expect(parseFrequencies('a=4')).toEqual({ error: 'format' });
    expect(parseFrequencies('a:0 b:2')).toEqual({ error: 'range' });
    expect(parseFrequencies('a:1 a:2')).toEqual({ error: 'duplicate' });
    expect(parseFrequencies('a:1')).toEqual({ error: 'count' });
    expect(formatFrequencies(CLRS.slice(0, 2))).toBe('a:45, b:13');
  });

  it('counts the characters of a text', () => {
    expect(countSymbols('abracadabra')).toEqual({
      symbols: [
        { symbol: 'a', freq: 5 },
        { symbol: 'b', freq: 2 },
        { symbol: 'r', freq: 2 },
        { symbol: 'c', freq: 1 },
        { symbol: 'd', freq: 1 },
      ],
    });
    expect(countSymbols('a a')).toEqual({
      symbols: [
        { symbol: 'a', freq: 2 },
        { symbol: '␣', freq: 1 },
      ],
    });
    expect(countSymbols('')).toEqual({ error: 'empty' });
    expect(countSymbols('aaaa')).toEqual({ error: 'count' });
    expect(countSymbols('abcdefghijk')).toEqual({ error: 'count' });
    expect(countSymbols('ab'.repeat(101))).toEqual({ error: 'long' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(huffmanTrace(CLRS).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(huffmanPseudocode.map((_, i) => i));
  });
});
