/**
 * Three lossless compressors run over the same text, one letter at a time, with the bits each has
 * spent so far. Sizes follow one simple accounting: raw text is 8 bits per letter; a run is one
 * letter plus one count, 8 bits each; a Huffman code is its own length, with the table left out
 * of the count; an LZW code is 9 bits wide, because the 256 starting entries plus one new entry
 * per letter of a short text fit in 512. Huffman ties go to the older tree.
 */

import { makeHeap } from '$lib/components/item-heap.js';

export const MAX_LEN = 24;
export const RAW_BITS = 8;
export const RUN_BITS = 16;
export const LZW_BITS = 9;
export const FIRST_LZW_CODE = 256;

export const compressionPseudocode = [
  'Huffman: count letters, merge the two rarest trees until one remains',
  'code[c] = path from the root, 0 for left and 1 for right',
  'run = none; w = empty',
  'for each letter c of the text:',
  '  Run-length: if c ≠ run letter: emit (letter, count), start a new run',
  '  Huffman: emit code[c]',
  '  LZW: if w + c is in the dictionary: w = w + c',
  '       else: emit code[w], add w + c to the dictionary, w = c',
  'at the end: emit the last run and code[w]',
];

/**
 * @typedef {object} HuffTree
 * @property {number} id  Leaves first, by letter, then merged trees in order.
 * @property {number} weight
 * @property {string} letter  Empty on a merged tree.
 * @property {HuffTree | null} left
 * @property {HuffTree | null} right
 *
 * @typedef {{letter: string, count: number}} LetterRun
 * @typedef {{code: number, text: string}} LzwEntry
 *
 * @typedef {object} CompressionFrame
 * @property {'start'|'merge'|'codes'|'ready'|'read'|'flush'|'done'} kind
 * @property {string} text
 * @property {number} i  The letter just read, -1 when none.
 * @property {HuffTree[]} forest  Lightest first.
 * @property {number} merged  merge: id of the new tree, -1 otherwise.
 * @property {Record<string, string>} codes  Empty until the tree is finished.
 * @property {LetterRun[]} runs  Runs emitted so far.
 * @property {LetterRun | null} openRun
 * @property {boolean} runEmitted  This frame closed a run.
 * @property {string} stream  Huffman bits emitted so far.
 * @property {string} w  LZW: the string being grown.
 * @property {LzwEntry[]} output  LZW codes emitted so far.
 * @property {LzwEntry[]} dictionary  LZW entries added to the starting 256.
 * @property {boolean} codeEmitted  This frame emitted an LZW code.
 * @property {number} rawBits
 * @property {number} runBits
 * @property {number} huffBits
 * @property {number} lzwBits
 * @property {number[]} lines
 */

/** @param {HuffTree} t @returns {HuffTree} */
const cloneTree = (t) => ({
  ...t,
  left: t.left && cloneTree(t.left),
  right: t.right && cloneTree(t.right),
});

/**
 * The code of every leaf: 0 for left, 1 for right. A tree of one leaf still needs one bit.
 * @param {HuffTree} root
 * @returns {Record<string, string>}
 */
function codesOf(root) {
  /** @type {Record<string, string>} */
  const codes = {};
  /** @param {HuffTree} t @param {string} path */
  const walk = (t, path) => {
    if (t.left && t.right) {
      walk(t.left, `${path}0`);
      walk(t.right, `${path}1`);
    } else {
      codes[t.letter] = path || '0';
    }
  };
  walk(root, '');
  return codes;
}

/**
 * The letters of a tree, left to right.
 * @param {HuffTree} t
 * @returns {string}
 */
export const lettersOf = (t) =>
  t.left && t.right ? lettersOf(t.left) + lettersOf(t.right) : t.letter;

/**
 * @param {string} text
 * @returns {CompressionFrame[]}
 */
export function compressionTrace(text) {
  /** @type {CompressionFrame[]} */
  const frames = [];
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const c of text) counts.set(c, (counts.get(c) ?? 0) + 1);
  const heap = /** @type {ReturnType<typeof makeHeap<HuffTree>>} */ (
    makeHeap(
      (/** @type {HuffTree} */ a, /** @type {HuffTree} */ b) =>
        a.weight < b.weight || (a.weight === b.weight && a.id < b.id),
    )
  );
  let id = 0;
  for (const letter of [...counts.keys()].sort()) {
    heap.push({
      id: id++,
      weight: /** @type {number} */ (counts.get(letter)),
      letter,
      left: null,
      right: null,
    });
  }

  /** @type {Record<string, string>} */
  let codes = {};
  /** @type {LetterRun[]} */
  const runs = [];
  /** @type {LetterRun | null} */
  let openRun = null;
  let stream = '';
  let w = '';
  /** @type {LzwEntry[]} */
  const output = [];
  /** @type {LzwEntry[]} */
  const dictionary = [];
  /** @type {Map<string, number>} */
  const known = new Map();
  let rawBits = 0;

  /** @param {string} s */
  const codeOfString = (s) =>
    s.length === 1 ? s.charCodeAt(0) : /** @type {number} */ (known.get(s));

  /**
   * @param {CompressionFrame['kind']} kind
   * @param {number[]} lines
   * @param {{i?: number, merged?: number, runEmitted?: boolean, codeEmitted?: boolean}} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      text,
      i: extra.i ?? -1,
      forest: heap.a
        .slice()
        .sort((a, b) => a.weight - b.weight || a.id - b.id)
        .map(cloneTree),
      merged: extra.merged ?? -1,
      codes: { ...codes },
      runs: runs.map((r) => ({ ...r })),
      openRun: openRun && { ...openRun },
      runEmitted: extra.runEmitted ?? false,
      stream,
      w,
      output: output.map((e) => ({ ...e })),
      dictionary: dictionary.map((e) => ({ ...e })),
      codeEmitted: extra.codeEmitted ?? false,
      rawBits,
      runBits: runs.length * RUN_BITS,
      huffBits: stream.length,
      lzwBits: output.length * LZW_BITS,
      lines,
    });

  push('start', [0]);

  while (heap.a.length > 1) {
    const left = heap.pop();
    const right = heap.pop();
    const merged = id++;
    heap.push({ id: merged, weight: left.weight + right.weight, letter: '', left, right });
    push('merge', [0], { merged });
  }
  codes = codesOf(heap.a[0]);
  push('codes', [1]);
  push('ready', [2]);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    rawBits += RAW_BITS;
    let runEmitted = false;
    if (openRun && openRun.letter === c) {
      openRun.count++;
    } else {
      if (openRun) {
        runs.push(openRun);
        runEmitted = true;
      }
      openRun = { letter: c, count: 1 };
    }
    stream += codes[c];

    const longer = w + c;
    let codeEmitted = false;
    if (longer.length === 1 || known.has(longer)) {
      w = longer;
    } else {
      output.push({ code: codeOfString(w), text: w });
      const code = FIRST_LZW_CODE + dictionary.length;
      dictionary.push({ code, text: longer });
      known.set(longer, code);
      w = c;
      codeEmitted = true;
    }
    push('read', [3, 4, 5, codeEmitted ? 7 : 6], { i, runEmitted, codeEmitted });
  }

  if (openRun) runs.push(openRun);
  openRun = null;
  output.push({ code: codeOfString(w), text: w });
  w = '';
  push('flush', [8], { runEmitted: true, codeEmitted: true });
  push('done', []);
  return frames;
}

/** @type {Record<'runs'|'skewed'|'repeats'|'classic'|'flat', string>} */
export const COMPRESSION_PRESETS = {
  runs: 'aaaaaaaabbbbcc',
  skewed: 'abracadabra',
  repeats: 'abababababababab',
  classic: 'tobeornottobeortobeornot',
  flat: 'abcdefghij',
};
