import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/data-compression/copy.en.js';
import {
  COMPRESSION_PRESETS,
  FIRST_LZW_CODE,
  LZW_BITS,
  MAX_LEN,
  RUN_BITS,
  compressionPseudocode,
  compressionTrace,
  lettersOf,
} from './data-compression.js';

/** Deterministic LCG so random texts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./data-compression.js').CompressionFrame[]} frames */
const last = (frames) =>
  /** @type {import('./data-compression.js').CompressionFrame} */ (frames.at(-1));

/** @param {string} text */
const end = (text) => last(compressionTrace(text));

/** @param {number} len @param {() => number} rand @param {string} alphabet */
function randomWord(len, rand, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rand() * alphabet.length)];
  return w;
}

/** Reads a bit stream back with the code table alone. @param {string} bits @param {Record<string, string>} codes */
function huffmanDecode(bits, codes) {
  const byCode = new Map(Object.entries(codes).map(([c, code]) => [code, c]));
  let out = '';
  let at = '';
  for (const bit of bits) {
    at += bit;
    const hit = byCode.get(at);
    if (hit !== undefined) {
      out += hit;
      at = '';
    }
  }
  expect(at).toBe('');
  return out;
}

/** Rebuilds the text and the dictionary from the codes alone. @param {number[]} codes */
function lzwDecode(codes) {
  /** @type {Map<number, string>} */
  const table = new Map();
  /** @param {number} code */
  const lookup = (code) => (code < FIRST_LZW_CODE ? String.fromCharCode(code) : table.get(code));
  let out = '';
  let prev = '';
  for (const code of codes) {
    // A code not in the table yet can only be the entry being built: prev + its first letter.
    const entry = lookup(code) ?? prev + prev[0];
    out += entry;
    if (prev) table.set(FIRST_LZW_CODE + table.size, prev + entry[0]);
    prev = entry;
  }
  return out;
}

describe('run-length encoding', () => {
  it('groups runs on known texts', () => {
    expect(end('aaabbc').runs).toEqual([
      { letter: 'a', count: 3 },
      { letter: 'b', count: 2 },
      { letter: 'c', count: 1 },
    ]);
    expect(end('a').runs).toEqual([{ letter: 'a', count: 1 }]);
    expect(end('aaabbc').runBits).toBe(3 * RUN_BITS);
  });

  it('expands back to the text', () => {
    const rand = seeded(3);
    for (let round = 0; round < 200; round++) {
      const text = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, 'ab');
      const back = end(text)
        .runs.map((r) => r.letter.repeat(r.count))
        .join('');
      expect(back).toBe(text);
    }
  });
});

describe('Huffman coding', () => {
  it('gives the known total on a small text', () => {
    // a:2 and b:3 merge first, then c:4 joins: c gets 1 bit, a and b get 2.
    const f = end('aabbbcccc');
    expect(f.huffBits).toBe(14);
    expect(f.codes.c.length).toBe(1);
    expect(f.codes.a.length).toBe(2);
    expect(f.codes.b.length).toBe(2);
  });

  it('spends one bit per letter when there is only one letter', () => {
    const f = end('aaaa');
    expect(f.codes).toEqual({ a: '0' });
    expect(f.huffBits).toBe(4);
  });

  it('keeps every code prefix-free and decodes back', () => {
    const rand = seeded(5);
    for (let round = 0; round < 200; round++) {
      const text = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, 'abcde');
      const { codes, stream } = end(text);
      const list = Object.values(codes);
      for (const a of list) {
        for (const b of list) if (a !== b) expect(b.startsWith(a)).toBe(false);
      }
      expect(huffmanDecode(stream, codes)).toBe(text);
    }
  });

  it('is optimal: total bits equal the sum of the merge weights', () => {
    const rand = seeded(7);
    for (let round = 0; round < 100; round++) {
      const text = randomWord(2 + Math.floor(rand() * (MAX_LEN - 2)), rand, 'abcd');
      const frames = compressionTrace(text);
      const merges = frames.filter((f) => f.kind === 'merge');
      if (merges.length === 0) continue;
      const total = merges.reduce((sum, f) => {
        const made = f.forest.find((t) => t.id === f.merged);
        return sum + (made?.weight ?? 0);
      }, 0);
      expect(last(frames).huffBits).toBe(total);
    }
  });

  it('merges down to one tree holding every letter', () => {
    const f = end('abracadabra');
    expect(f.forest.length).toBe(1);
    expect([...lettersOf(f.forest[0])].sort().join('')).toBe('abcdr');
    expect(f.forest[0].weight).toBe(11);
  });
});

describe('LZW', () => {
  it('emits the known codes', () => {
    expect(end('abab').output.map((e) => e.code)).toEqual([97, 98, 256]);
    expect(end('abab').dictionary).toEqual([
      { code: 256, text: 'ab' },
      { code: 257, text: 'ba' },
    ]);
    expect(end('tobeornottobeortobeornot').output.map((e) => e.code)).toEqual([
      116, 111, 98, 101, 111, 114, 110, 111, 116, 256, 258, 260, 265, 259, 261, 263,
    ]);
    expect(end('a').output).toEqual([{ code: 97, text: 'a' }]);
  });

  it('round-trips random texts through a decoder that rebuilds the dictionary', () => {
    const rand = seeded(9);
    for (let round = 0; round < 300; round++) {
      const text = randomWord(1 + Math.floor(rand() * MAX_LEN), rand, round % 2 ? 'ab' : 'abc');
      expect(lzwDecode(end(text).output.map((e) => e.code))).toBe(text);
    }
    // The code that arrives before the decoder has made its entry.
    expect(lzwDecode(end('aaaaaaa').output.map((e) => e.code))).toBe('aaaaaaa');
  });

  it('adds one entry per emitted code except the last and fits 9 bits', () => {
    const rand = seeded(11);
    for (let round = 0; round < 100; round++) {
      const f = end(randomWord(MAX_LEN, rand, 'ab'));
      expect(f.dictionary.length).toBe(f.output.length - 1);
      expect(f.lzwBits).toBe(f.output.length * LZW_BITS);
      for (const e of f.output) expect(e.code).toBeLessThan(2 ** LZW_BITS);
    }
  });
});

describe('side by side', () => {
  it('counts bits as the text is read', () => {
    const f = compressionTrace('aab').filter((x) => x.kind === 'read');
    expect(f.map((x) => x.rawBits)).toEqual([8, 16, 24]);
    expect(f.map((x) => x.runBits)).toEqual([0, 0, 16]);
    expect(f.map((x) => x.runEmitted)).toEqual([false, false, true]);
  });

  it('never shrinks a total while reading', () => {
    const frames = compressionTrace('tobeornottobeortobeornot');
    for (let k = 1; k < frames.length; k++) {
      for (const key of /** @type {const} */ (['rawBits', 'runBits', 'huffBits', 'lzwBits'])) {
        expect(frames[k][key]).toBeGreaterThanOrEqual(frames[k - 1][key]);
      }
    }
  });

  it('shows which text suits which method', () => {
    const runs = end(COMPRESSION_PRESETS.runs);
    expect(runs.runBits).toBeLessThan(runs.rawBits);
    const flat = end(COMPRESSION_PRESETS.flat);
    expect(flat.runBits).toBe(2 * flat.rawBits);
    const repeats = end(COMPRESSION_PRESETS.repeats);
    expect(repeats.lzwBits).toBeLessThan(repeats.runBits);
    expect(repeats.lzwBits).toBeLessThan(repeats.rawBits);
  });
});

describe('frames', () => {
  it('never alias', () => {
    const frames = compressionTrace('abab');
    const copy = JSON.stringify(frames[frames.length - 2]);
    const earlier = frames[frames.length - 3];
    earlier.runs.push({ letter: 'z', count: 77 });
    earlier.output.push({ code: 77, text: 'z' });
    earlier.dictionary.push({ code: 77, text: 'z' });
    earlier.codes.z = '77';
    earlier.forest[0].weight = 77;
    if (earlier.openRun) earlier.openRun.count = 77;
    expect(JSON.stringify(frames[frames.length - 2])).toBe(copy);
  });

  it('stay under 400 at the cap', () => {
    expect(compressionTrace('abcdefghijklmnopqrstuvwx').length).toBeLessThan(400);
  });

  it('start with start and end with done', () => {
    const frames = compressionTrace('a');
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
  });
});

describe('practice answers', () => {
  const practice = /** @type {any[]} */ (m.practice);

  it('counts bits for each method', () => {
    expect(practice[0].answer).toBe(end('aaabbc').runBits);
    expect(practice[1].answer).toBe(end('aabbbcccc').huffBits);
    expect(practice[3].answer).toBe(end('abab').output.length);
    expect(practice[4].answer).toBe(end('abababab').lzwBits);
  });

  it('picks the method that grows a flat text', () => {
    const f = end('abcdefgh');
    const q = practice[5];
    expect(f.runBits).toBe(128);
    expect(f.rawBits).toBe(64);
    expect(f.huffBits).toBeLessThanOrEqual(f.rawBits);
    expect(f.lzwBits).toBeGreaterThan(f.rawBits);
    expect(f.runBits).toBeGreaterThan(f.lzwBits);
    expect(q.options[q.answer]).toContain('Run-length');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(
      Object.values(COMPRESSION_PRESETS).flatMap((s) =>
        compressionTrace(s).flatMap((f) => f.lines),
      ),
    );
    compressionPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
