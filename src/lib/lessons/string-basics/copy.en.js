/** @typedef {import('$lib/algo-engine/string-basics.js').StringFrame} StringFrame */
/** @typedef {import('$lib/algo-engine/string-basics.js').JoinMode} JoinMode */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** Characters of a string, so lengths count code points. @param {string} s */
const len = (s) => Array.from(s).length;

/** @param {(string | null)[]} cells */
const text = (cells) => cells.filter((c) => c !== null).join('');

export const en = {
  slug: 'string-basics',
  topic: 'arrays-strings',
  level: 'Beginner',
  title: 'String basics and manipulation',
  intro:
    'A string is an array of characters, and every character is a number, its code point, stored in bytes by an encoding such as UTF-8 or UTF-16. In Java, Python and JavaScript strings are immutable: an operation that seems to change a string builds a new one. That makes s = s + p in a loop copy everything again and again, and a string builder the right tool for joining many pieces.',
  summary:
    'Join pieces with repeated concatenation or with a growing builder buffer, count every character copy, and see how characters become UTF-8 bytes and UTF-16 units.',
  instruction:
    'Pick a method and a preset, or type your own pieces, then step. Watch concatenation copy the whole string into a new one for every piece, while the builder writes into spare slots and copies only when it doubles. Compare the total work with the other method’s card.',
  modeLegend: 'Method',
  modes: /** @type {Record<JoinMode, string>} */ ({
    concat: 's = s + p',
    builder: 'Builder',
  }),
  piecesLabel: 'Pieces (space-separated)',
  capacityLabel: 'Start capacity',
  presetsLegend: 'Presets',
  presets: {
    letters: 'Ten letters',
    words: 'Words',
    vietnamese: 'Vietnamese',
  },
  pieceErrors: {
    empty: 'Type at least one piece.',
    long: 'Each piece can have at most 8 characters.',
    count: 'Type at most 12 pieces.',
    total: 'The pieces can have at most 32 characters in total.',
  },
  capacityError: 'The start capacity must be a whole number from 1 to 16.',
  blocks: {
    s: 'String s',
    t: 'New string t',
    buffer: 'Buffer',
    newBuffer: 'New buffer',
    result: 'Result string',
  },
  /** @param {number} length @param {number} capacity */
  blockLine: (length, capacity) =>
    length === capacity
      ? `${plural(length, 'character')}`
      : `${plural(length, 'character')} in ${plural(capacity, 'slot')}`,
  emptyString: 's is the empty string "": nothing allocated yet.',
  /** @param {string} name */
  blockAria: (name) => `${name}, index 0 first`,
  spare: '·',
  markers: { read: '◦', written: '+' },
  /** @param {number} i @param {string | null} c @param {string} state */
  cellLabel: (i, c, state) =>
    `Index ${i}: ${c === null ? 'spare slot' : c === ' ' ? 'space' : c}${state ? `, ${state}` : ''}`,
  states: { read: 'copied from', written: 'just written' },
  legend: {
    stored: 'Character',
    spare: 'Spare slot (· marks it)',
    read: '◦ Copied from',
    written: '+ Just written',
  },
  stats: {
    copies: 'Old chars copied',
    writes: 'New chars written',
    work: 'Total work',
    other: 'Other method',
    allocations: 'Allocations',
    garbage: 'Garbage blocks',
  },
  /** @param {JoinMode} mode */
  otherNote: (mode) =>
    `Total work is copies plus writes. The other card runs ${mode === 'concat' ? 'the builder' : 's = s + p'} on the same pieces.`,
  piecesTitle: 'Pieces to join',
  piecesEmpty: 'none',
  piecesHot: 'being joined',
  inspectTitle: 'Characters and encodings',
  inspectLabel: 'Text to inspect',
  inspectErrors: {
    empty: 'Type at least one character.',
    long: 'Type at most 16 characters.',
  },
  inspectHead: ['Char', 'Code point', 'UTF-8 bytes', 'UTF-16 units'],
  /** @param {string} c */
  showChar: (c) => (c === ' ' ? '(space)' : c),
  /** @param {number} chars @param {number} utf8 @param {number} utf16 */
  inspectSummary: (chars, utf8, utf16) =>
    `${plural(chars, 'character')} (code points), ${plural(utf8, 'UTF-8 byte')}, ${plural(utf16, 'UTF-16 unit')}. JavaScript’s length and Java’s length() count UTF-16 units, so they say ${utf16}.`,
  inspectNote:
    'UTF-8 spends 1 byte on ASCII, 2 on most accented Latin letters such as ă or ơ, 3 on letters like ệ and on most other scripts, and 4 on emoji. A code point above U+FFFF needs two UTF-16 units, a surrogate pair.',
  practiceTitle: 'Check yourself',
  /** @param {StringFrame} f */
  describe(f) {
    const p = f.piece >= 0 ? f.pieces[f.piece] : '';
    const pl = len(p);
    switch (f.kind) {
      case 'start':
        return f.mode === 'concat'
          ? `Join ${plural(f.pieces.length, 'piece')} with s = s + p. s starts as the empty string, and strings are immutable: once made, a string never changes.`
          : `Join ${plural(f.pieces.length, 'piece')} with a builder. Its buffer starts with ${plural(f.capacity, 'spare slot')}, and the buffer itself can change.`;
      case 'allocate':
        return `Piece ${f.piece + 1}, “${p}”: s cannot grow in place, so allocate a new string t of ${f.length} + ${pl} = ${f.length + pl} characters.`;
      case 'copy':
        if (f.mode === 'concat')
          return f.length === 0
            ? 's is empty, so there is nothing to copy yet.'
            : `Copy all ${plural(f.length, 'character')} of s into t. s itself stays unchanged; only t is written.`;
        return f.length === 0
          ? 'The buffer is still empty, so there is nothing to copy.'
          : `Copy the ${plural(f.length, 'character')} already in the buffer across, once, then drop the old buffer.`;
      case 'append': {
        if (f.mode === 'concat')
          return `Write “${p}” after them and let s = t: ${plural(pl, 'write')} and ${plural(f.opCopies, 'copy', 'copies')} for this piece.${f.piece > 0 ? ' The old s is garbage now.' : ''}`;
        return `Write “${p}” into the spare slots: ${plural(pl, 'write')}${f.opCopies > 0 ? ` after ${plural(f.opCopies, 'copy', 'copies')}` : ', no copies'}. ${f.length} of ${f.capacity} slots used.`;
      }
      case 'grow':
        return `Piece ${f.piece + 1}, “${p}”, needs ${f.length + pl} slots but the buffer has ${f.capacity}. Allocate a new buffer of max(2 × ${f.capacity}, ${f.length + pl}) = ${f.next?.length ?? 0}.`;
      case 'build':
        return `toString: copy the ${plural(f.length, 'character')} out of the buffer into the final string, once.`;
      case 'done': {
        const result = f.mode === 'concat' ? text(f.cells) : text(f.next ?? []);
        return `Done: “${result}” after ${plural(f.copies, 'copy', 'copies')} of old characters and ${plural(f.writes, 'write')}, ${plural(f.copies + f.writes, 'step')} in total.`;
      }
    }
  },
  takeaways: [
    'Every character is a number, its code point (A is U+0041, ệ is U+1EC7). An encoding stores it as bytes: UTF-8 uses 1 to 4 bytes per code point, UTF-16 uses 1 or 2 units of 2 bytes. Length in JavaScript and Java counts UTF-16 units, not characters.',
    'Strings in Java, Python and JavaScript are immutable. Reading s[i] is O(1) as in any array, but “changing” a string always builds a new one and leaves the old one as garbage.',
    's = s + p copies all of s into a new string. Joining k pieces copies the old part again and again: k one-letter pieces cost 0 + 1 + … + (k − 1) = k(k − 1)/2 copies, so O(n²).',
    'A builder (StringBuilder in Java, a list and "".join in Python, an array and join in JavaScript) writes into spare capacity and doubles when full: every character is written once, growth copies stay under 2n, and one final copy makes the string. O(n) in total.',
    'Try the Ten letters preset in both methods: 45 copies against 22. Then set the start capacity to 16 and watch the builder never grow at all.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Read s[i]', 'O(1)', 'The characters (code units) sit side by side, as in an array.'],
    ['One s + p', 'O(len(s) + len(p))', 'Both strings are copied into a new one.'],
    [
      'Join k pieces with s = s + p',
      'O(k·n)',
      'Step i copies everything joined so far; n single characters give O(n²).',
    ],
    [
      'Join with a builder',
      'O(n)',
      'n writes, under 2n growth copies when it doubles, n for the final copy.',
    ],
    ['Builder memory', 'O(n)', 'The buffer holds at most about 2n slots, plus the result.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'You join six pieces “ab”, “cd”, “ef”, “gh”, “ij”, “kl” with s = s + p. How many old characters are copied in total?',
      answer: 30,
      unit: 'copies',
      hints: [
        'Before each piece, s holds 0, 2, 4, 6, 8 and then 10 characters.',
        'Type the six pieces into the widget and look at Old chars copied.',
      ],
      solution:
        'Each step copies all of s first: 0 + 2 + 4 + 6 + 8 + 10 = 30 copies, on top of the 12 writes of the pieces themselves.',
    },
    {
      type: 'number',
      prompt:
        'A builder starts with capacity 4 and joins ten one-letter pieces. How many old characters does it copy, counting the final toString?',
      answer: 22,
      unit: 'copies',
      hints: [
        'It grows when the 5th and the 9th letter do not fit.',
        'Growing copies what is in the buffer: 4, then 8. The final copy moves all 10.',
      ],
      solution:
        'Capacity 4 → 8 copies 4 letters, 8 → 16 copies 8, and toString copies 10: 4 + 8 + 10 = 22. Concatenation copies 0 + 1 + … + 9 = 45.',
    },
    {
      type: 'number',
      prompt: 'How many bytes does “Việt” take in UTF-8? (ệ is U+1EC7.)',
      answer: 6,
      unit: 'bytes',
      hints: [
        'V, i and t are ASCII. A code point from U+0800 to U+FFFF takes 3 bytes.',
        'Type Việt into the inspector.',
      ],
      solution:
        'V, i and t take 1 byte each and ệ takes 3: 1 + 1 + 3 + 1 = 6 bytes for 4 characters.',
    },
    {
      type: 'number',
      prompt: 'What does "😀".length give in JavaScript? (😀 is U+1F600.)',
      answer: 2,
      hints: ['JavaScript strings are sequences of UTF-16 code units.'],
      solution:
        'U+1F600 is above U+FFFF, so UTF-16 stores it as a surrogate pair of two units, and length counts 2, although it is one character.',
    },
    {
      type: 'choice',
      prompt: 'Why does s = s + p inside a loop over n one-letter pieces take O(n²) time?',
      options: [
        'Strings are immutable, so every step copies the whole string built so far into a new one',
        'Each character takes up to 4 bytes in UTF-8',
        'Reading s[i] is O(n)',
        'The loop runs n² times',
      ],
      answer: 0,
      hints: ['Look at what the copy frames do to s in the widget.'],
      solution:
        'The loop runs only n times, but step i copies the i characters joined so far: 0 + 1 + … + (n − 1) = n(n − 1)/2 copies. A builder avoids that by writing into spare capacity.',
    },
  ],
  nextTeaser:
    'Next up: Practice: array and string problems, where you pick two pointers, a sliding window or prefix sums for each problem and watch it run.',
};
