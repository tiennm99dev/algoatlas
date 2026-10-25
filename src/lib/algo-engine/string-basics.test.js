import { describe, expect, it } from 'vitest';
import {
  MAX_CAPACITY,
  MAX_PIECES,
  builderTrace,
  charsOf,
  concatTrace,
  inspectText,
  joinCost,
  joinPseudocode,
  parsePieces,
  utf8Bytes,
} from './string-basics.js';

/** @typedef {import('./string-basics.js').StringFrame} StringFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {StringFrame[]} frames */
const last = (frames) => /** @type {StringFrame} */ (frames.at(-1));

/** Oracle: old characters recopied by s = s + p, the sum of the lengths before each step. @param {string[]} pieces */
function concatCopies(pieces) {
  let len = 0;
  let copies = 0;
  for (const p of pieces) {
    copies += len;
    len += charsOf(p).length;
  }
  return copies;
}

/** Oracle: a doubling buffer's growth copies plus the final copy. @param {string[]} pieces @param {number} cap */
function builderCopies(pieces, cap) {
  let len = 0;
  let copies = 0;
  for (const p of pieces) {
    const need = len + charsOf(p).length;
    if (need > cap) {
      copies += len;
      cap = Math.max(2 * cap, need);
    }
    len = need;
  }
  return copies + len;
}

const rand = seeded(5);
const randomPieces = Array.from({ length: 25 }, () =>
  Array.from({ length: 1 + Math.floor(rand() * MAX_PIECES) }, () =>
    'abcdefgh'.slice(0, 1 + Math.floor(rand() * 2)),
  ),
);

const letters = 'a b c d e f g h i j'.split(' ');

describe('joining', () => {
  it.each([
    { pieces: letters },
    { pieces: ['x'] },
    { pieces: ['Xin', 'chào', 'Việt', 'Nam'] },
    { pieces: ['aaaaaaaa', 'b'] },
    { pieces: ['ab', 'ab', 'ab'] },
    ...randomPieces.map((pieces) => ({ pieces })),
  ])('both methods join $pieces into the same string', ({ pieces }) => {
    const joined = charsOf(pieces.join(''));
    const c = last(concatTrace(pieces));
    expect(c.cells).toEqual(joined);
    expect(c.copies).toBe(concatCopies(pieces));
    expect(c.writes).toBe(joined.length);
    expect(c.allocations).toBe(pieces.length);
    for (const cap of [1, 4, MAX_CAPACITY]) {
      const b = last(builderTrace(pieces, cap));
      expect(b.next).toEqual(joined);
      expect(b.cells.slice(0, b.length)).toEqual(joined);
      expect(b.copies).toBe(builderCopies(pieces, cap));
      expect(b.writes).toBe(joined.length);
      // Doubling: growth copies stay under twice the length, plus the final copy.
      expect(b.copies).toBeLessThan(3 * joined.length + 1);
    }
  });

  it('copies 45 old characters for ten one-letter pieces, but only 22 with a builder', () => {
    expect(joinCost('concat', letters, 4)).toEqual({
      copies: 45,
      writes: 10,
      allocations: 10,
      allocated: 55,
      work: 55,
    });
    // Grows 4 → 8 (copies 4) and 8 → 16 (copies 8), then 10 for toString.
    expect(joinCost('builder', letters, 4)).toEqual({
      copies: 22,
      writes: 10,
      allocations: 4,
      allocated: 38,
      work: 32,
    });
  });

  it('follows k pieces of length L with L·k(k − 1)/2 concatenation copies', () => {
    const pieces = Array.from({ length: 8 }, () => 'abcd');
    expect(joinCost('concat', pieces, 1).copies).toBe((4 * 8 * 7) / 2);
  });

  it('grows straight to the needed size when doubling is not enough', () => {
    const frames = builderTrace(['abcdefgh'], 2);
    const grow = /** @type {StringFrame} */ (frames.find((f) => f.kind === 'grow'));
    expect(grow.next).toHaveLength(8);
    expect(last(frames).garbage).toBe(1);
  });

  it('never grows when the starting capacity already fits', () => {
    const frames = builderTrace(['ab', 'cd'], 4);
    expect(frames.some((f) => f.kind === 'grow')).toBe(false);
    expect(last(frames).copies).toBe(4);
  });

  it('throws away every old string in concatenation', () => {
    expect(last(concatTrace(letters)).garbage).toBe(9);
  });
});

describe('parsing', () => {
  it('splits on spaces', () => {
    expect(parsePieces('  ab  c\td ')).toEqual({ pieces: ['ab', 'c', 'd'] });
  });
  it('rejects bad input', () => {
    expect(parsePieces('   ')).toEqual({ error: 'empty' });
    expect(parsePieces('abcdefghi')).toEqual({ error: 'long' });
    expect(parsePieces(Array.from({ length: MAX_PIECES + 1 }, () => 'a').join(' '))).toEqual({
      error: 'count',
    });
    expect(parsePieces('abcdefgh abcdefgh abcdefgh abcdefgh a')).toEqual({ error: 'total' });
  });
  it('counts characters, not UTF-16 units', () => {
    expect(parsePieces('😀😀😀😀😀😀😀😀')).toEqual({ pieces: ['😀😀😀😀😀😀😀😀'] });
  });
});

describe('encodings', () => {
  it('matches TextEncoder for every code point class', () => {
    const enc = new TextEncoder();
    for (const ch of ['A', '~', 'é', 'ă', 'ß', 'ệ', '€', '中', '😀', '𝄞']) {
      const cp = /** @type {number} */ (ch.codePointAt(0));
      expect(utf8Bytes(cp)).toEqual([...enc.encode(ch)]);
    }
  });

  it('counts characters, UTF-8 bytes and UTF-16 units of Việt 😀', () => {
    const r = inspectText('Việt \u{1F600}');
    if ('error' in r) throw new Error(r.error);
    expect(r.chars.map((c) => c.hex)).toEqual([
      'U+0056',
      'U+0069',
      'U+1EC7',
      'U+0074',
      'U+0020',
      'U+1F600',
    ]);
    expect(r.utf8).toBe(11);
    expect(r.utf16).toBe('Việt \u{1F600}'.length);
  });

  it('sees a decomposed letter as more than one character', () => {
    const r = inspectText('ệ');
    if ('error' in r) throw new Error(r.error);
    expect(r.chars).toHaveLength(3);
    expect(r.utf8).toBe(5);
  });

  it('rejects empty and long text', () => {
    expect(inspectText('')).toEqual({ error: 'empty' });
    expect(inspectText('a'.repeat(17))).toEqual({ error: 'long' });
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = builderTrace(['ab', 'cde'], 2);
    frames[1].cells[0] = 'Z';
    frames[1].lines.push(99);
    expect(frames[2].cells[0]).toBe('a');
    expect(frames[2].lines).not.toContain(99);
    const c = concatTrace(['ab', 'c']);
    const copy = /** @type {StringFrame} */ (c.find((f) => f.kind === 'copy' && f.piece === 1));
    /** @type {(string|null)[]} */ (copy.next)[0] = 'Z';
    expect(c[c.indexOf(copy) + 1].cells[0]).toBe('a');
  });

  it('keeps the old string intact while the new one is filled', () => {
    const frames = concatTrace(['ab', 'cd']);
    const copy = /** @type {StringFrame} */ (
      frames.find((f) => f.kind === 'copy' && f.piece === 1)
    );
    expect(copy.cells).toEqual(['a', 'b']);
    expect(copy.next).toEqual(['a', 'b', null, null]);
    expect(copy.read).toEqual([0, 2]);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['concat', concatTrace(letters), joinPseudocode.concat],
    ['builder', builderTrace(letters, 4), joinPseudocode.builder],
  ])('%s highlights every line', (_, frames, code) => {
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
