/** @typedef {import('$lib/algo-engine/data-compression.js').CompressionFrame} CompressionFrame */
import { lettersOf } from '$lib/algo-engine/data-compression.js';

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'data-compression',
  topic: 'string-algorithms',
  level: 'Intermediate',
  title: 'Data compression: run-length, Huffman and LZW',
  intro:
    'Text compresses because it repeats, but there is more than one kind of repetition. Run-length encoding collapses a letter repeated in a row, Huffman coding gives common letters short codes, and LZW builds a dictionary of strings it has already seen. Running all three on one text shows what each one can and cannot see.',
  summary:
    'Compress one text with run-length encoding, Huffman coding and LZW side by side, and watch the bits and the dictionary grow.',
  instruction:
    'Type some text and step. First the Huffman tree is built from the letter counts. Then each letter goes through all three compressors at once, and the bars show the bits each has spent. Try text with long runs, then text that repeats without runs, and see which bar stays shortest.',
  textLabel: 'Text',
  presetLabel: 'Example',
  presets: {
    runs: 'Long runs',
    skewed: 'Uneven letters',
    repeats: 'Repeats, no runs',
    classic: 'to be or not to be',
    flat: 'All letters different',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    length: `The text may have at most ${max} letters.`,
  }),
  textTitle: 'Text',
  textAria: 'The text being compressed, letter by letter.',
  textMarker: '↓',
  /** @param {number} i @param {string} c @param {string} state */
  textCell: (i, c, state) => `Letter ${i}: ${c}${state ? `, ${state}` : ''}`,
  textStates: { now: 'read now', past: 'already read' },
  barsTitle: 'Bits spent so far',
  bars: {
    raw: 'Raw, 8 bits per letter',
    run: 'Run-length, 16 bits per run',
    huff: 'Huffman, code lengths',
    lzw: 'LZW, 9 bits per code',
  },
  /** @param {number} n */
  bitsValue: (n) => plural(n, 'bit', 'bits'),
  runTitle: 'Run-length encoding',
  runNote: 'Each run costs one letter and one count: 8 + 8 bits.',
  runChips: 'Runs emitted, as letter × count',
  runEmpty: 'none yet',
  /** @param {import('$lib/algo-engine/data-compression.js').LetterRun} r */
  runChip: (r) => `${r.letter} × ${r.count}`,
  /** @param {import('$lib/algo-engine/data-compression.js').LetterRun | null} r */
  openRun: (r) => (r ? `Open run: ${r.letter} × ${r.count}` : 'No open run'),
  huffTitle: 'Huffman coding',
  huffNote:
    'The number under each node is its count. Left edges are 0 and right edges are 1. The cost of sending the table is left out.',
  /** @param {string} letter @param {string} code */
  huffChip: (letter, code) => `${letter} = ${code}`,
  huffChips: 'Codes',
  huffEmpty: 'not ready until the tree is finished',
  streamTitle: 'Bit stream',
  streamEmpty: 'nothing emitted yet',
  treeAria: 'The Huffman forest as it merges into one tree.',
  /** @param {string} label @param {string} note @param {string} state */
  treeNode: (label, note, state) =>
    `${label || 'Merged tree'}, count ${note}${state ? `, ${state}` : ''}`,
  treeStates: { merged: 'just merged' },
  treeMarker: '★',
  treeLegend: '★ Just merged',
  lzwTitle: 'LZW',
  lzwNote:
    'The dictionary starts with all 256 single characters, codes 0 to 255, and adds one entry per code emitted. The decoder rebuilds it, so it is never sent.',
  /** @param {string} w */
  lzwCurrent: (w) => (w ? `Growing string w: ${w}` : 'Growing string w is empty'),
  lzwOutput: 'Codes emitted',
  lzwOutputEmpty: 'none yet',
  /** @param {import('$lib/algo-engine/data-compression.js').LzwEntry} e */
  lzwChip: (e) => `${e.code} (${e.text})`,
  lzwDict: 'Dictionary entries added',
  lzwDictEmpty: 'none yet',
  /** @param {import('$lib/algo-engine/data-compression.js').LzwEntry} e */
  dictChip: (e) => `${e.code} = ${e.text}`,
  /** @param {CompressionFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Huffman needs the letter counts before it can emit anything, so build its tree first. Each letter starts as a tree of its own.';
      case 'merge': {
        const made = f.forest.find((t) => t.id === f.merged);
        return made
          ? `Merge the two lightest trees into ${lettersOf(made)}, with count ${made.weight}.`
          : '';
      }
      case 'codes':
        return 'One tree remains. Each letter’s code is its path from the root, so a common letter near the root gets a short code.';
      case 'ready':
        return 'Now read the text, one letter at a time, through all three compressors.';
      case 'read': {
        const c = f.text[f.i];
        const run = f.runEmitted
          ? `Run-length closes a run and starts one for ${c}.`
          : `Run-length extends the run of ${c}.`;
        const code = `Huffman emits ${f.codes[c]}.`;
        const last = f.dictionary.at(-1);
        const lzw =
          f.codeEmitted && last
            ? `LZW emits ${f.output.at(-1)?.code}, adds ${last.text} as ${last.code}, and restarts from ${c}.`
            : `LZW already knows ${f.w}, so it keeps growing.`;
        return `${c}: ${run} ${code} ${lzw}`;
      }
      case 'flush':
        return 'The text is finished. Run-length emits its open run, and LZW emits the code of w.';
      case 'done':
        return `Done. Raw ${f.rawBits} bits, run-length ${f.runBits}, Huffman ${f.huffBits}, LZW ${f.lzwBits}, with ${plural(f.dictionary.length, 'dictionary entry', 'dictionary entries')} added.`;
    }
  },
  takeaways: [
    'Run-length encoding stores (letter, count). It is excellent on long runs, and it doubles the size of text with no runs at all.',
    'Huffman coding gives each letter a prefix-free code by frequency: no code starts another, so the bits decode with no separators.',
    'LZW emits the code of the longest string it knows, then adds that string plus the next letter to its dictionary. The dictionary grows with the text.',
    'The LZW decoder rebuilds the same dictionary from the codes alone, so nothing extra has to be sent.',
    'Try “Repeats, no runs” and “All letters different”: Huffman sees only letter counts, while LZW also sees repeated strings, and with no repeats it costs more than raw.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    ['Run-length encoding', 'O(n)', 'One pass, comparing each letter with the one before.'],
    [
      'Huffman coding',
      'O(n + k log k)',
      'Count n letters, make k − 1 merges with a heap of k trees, then one table lookup per letter.',
    ],
    [
      'LZW',
      'O(n)',
      'One dictionary lookup per letter, in expected constant time when the dictionary is a hash table or a trie.',
    ],
    ['Memory', 'O(k) or O(n)', 'A table of k letters for Huffman; up to n entries for LZW.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many bits does run-length encoding, at 16 bits per run, spend on aaabbc?',
      answer: 48,
      unit: 'bits',
      hints: ['Count the runs first.'],
      solution: 'There are three runs, a × 3, b × 2 and c × 1, so 3 × 16 = 48 bits.',
    },
    {
      type: 'number',
      prompt: 'How many bits does a Huffman code spend on aabbbcccc, leaving out the table?',
      answer: 14,
      unit: 'bits',
      hints: ['Merge a (2) with b (3) first. Then c (4) joins them.'],
      solution:
        'c gets a 1-bit code; a and b get 2 bits each. The total is 4 × 1 + 2 × 2 + 3 × 2 = 14 bits.',
    },
    {
      type: 'choice',
      prompt: 'Why can a Huffman bit stream be decoded with no separators?',
      options: [
        'Every code has the same length.',
        'No code is the start of another code, so a code ends as soon as it is complete.',
        'The decoder counts how many bits each letter needs from a header.',
      ],
      answer: 1,
      hints: ['Think about walking the tree from the root, bit by bit.'],
      solution:
        'The code is prefix-free: letters sit only at leaves, so reaching a leaf ends the code without doubt, and the next bit starts at the root again.',
    },
    {
      type: 'number',
      prompt: 'How many codes does LZW emit for abab?',
      answer: 3,
      unit: 'codes',
      hints: ['Type abab into the widget and step through it.'],
      solution:
        'It emits a and adds ab, emits b and adds ba, then grows ab from the dictionary and emits it at the end: three codes.',
    },
    {
      type: 'number',
      prompt: 'How many bits does LZW, at 9 bits per code, spend on abababab?',
      answer: 45,
      unit: 'bits',
      hints: ['Follow the codes: a, b, ab, aba, then the last b.'],
      solution:
        'It emits a, b, ab, aba and b. That is 5 codes, so 5 × 9 = 45 bits, against 64 raw.',
    },
    {
      type: 'choice',
      prompt: 'Which method spends the most bits on abcdefgh, with every letter different?',
      options: ['Run-length', 'Huffman', 'LZW'],
      answer: 0,
      hints: ['Every letter is its own run.'],
      solution:
        'Eight runs cost 128 bits. LZW emits 8 codes for 72 bits, and Huffman gives each letter 3 bits for 24.',
    },
  ],
  nextTeaser:
    'Next up: Practice: string problems, where you choose the right matcher and work with palindromes and periods.',
};
