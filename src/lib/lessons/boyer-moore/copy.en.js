/** @typedef {import('$lib/algo-engine/boyer-moore.js').BoyerMooreFrame} BoyerMooreFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'boyer-moore',
  topic: 'string-algorithms',
  level: 'Intermediate',
  title: 'Boyer-Moore',
  intro:
    'Boyer-Moore compares the pattern with the text from right to left. A mismatch reveals a text letter, and the pattern can jump until that letter lines up with its rightmost copy in the pattern, or past it when the pattern has no such letter. On long patterns over large alphabets it can skip most of the text without reading it. This lesson uses the bad-character rule alone.',
  summary:
    'Slide a pattern across a text from right to left comparisons, and see the bad-character rule leap over letters it never reads.',
  instruction:
    'Type a text and a pattern, then step. At each mismatch the panel shows the rule that gives the skip. Letters the search has read turn grey with a dot, so at the end the white letters are the ones it never looked at. Compare the “No shared letters” and “Worst case” examples.',
  textLabel: 'Text',
  patternLabel: 'Pattern',
  presetLabel: 'Example',
  presets: {
    classic: 'Classic example',
    absent: 'No shared letters',
    matches: 'Several matches',
    worst: 'Worst case',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    textLength: `The text may have at most ${maxText} letters.`,
    patternLength: `The pattern may have at most ${maxPattern} letters.`,
  }),
  boardTitle: 'The pattern against the text',
  rows: { text: 'T', pattern: 'P' },
  /** @param {string} text @param {string} pattern @param {number} shift */
  boardAria: (text, pattern, shift) =>
    `Text ${text} with the pattern ${pattern} at position ${shift}.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} column ${c}: ${value || 'empty'}${state ? `, ${state}` : ''}`,
  rowNames: { text: 'Text', pattern: 'Pattern', letter: 'Letter', last: 'Last index' },
  states: {
    read: 'already read',
    equal: 'letters equal',
    miss: 'letters differ',
    bad: 'decides the skip',
    found: 'full match',
  },
  markers: { read: '·', equal: '✓', miss: '✗', bad: '!', found: '★' },
  legend: {
    read: 'Already read',
    equal: 'Letters equal',
    miss: 'Letters differ',
    bad: 'Decides the skip',
    found: 'Full match',
  },
  tableTitle: 'Rightmost index of each letter',
  tableRows: { letter: 'c', last: 'last' },
  tableNote: 'Any letter not listed has last = −1.',
  /** @param {string} pattern */
  tableAria: (pattern) => `Rightmost index of each letter of ${pattern}.`,
  ruleTitle: 'The skip',
  /** @param {BoyerMooreFrame} f */
  ruleLine(f) {
    if (f.kind !== 'shift') return 'Each skip is worked out here as it happens.';
    const lastBad = f.last[f.badLetter] ?? -1;
    const m = f.pattern.length;
    if (f.afterMatch) {
      return f.badAt < 0
        ? 'Match at the end of the text: skip 1.'
        : `m − last[${f.badLetter}] = ${m} − (${lastBad}) = ${f.skip}`;
    }
    return `max(1, j − last[${f.badLetter}]) = max(1, ${f.j} − (${lastBad})) = ${f.skip}`;
  },
  stats: {
    comparisons: 'Letter comparisons',
    alignments: 'Alignments tried',
    unread: 'Text letters not read',
    naive: 'Plain matcher’s comparisons',
  },
  skipsTitle: 'Skips',
  skipsEmpty: 'none yet',
  matchesTitle: 'Matches at',
  matchesEmpty: 'none yet',
  /** @param {BoyerMooreFrame} f */
  describe(f) {
    const { pattern: P, text: T, shift: s, j } = f;
    const unread = T.length - f.reads.length;
    switch (f.kind) {
      case 'start':
        return `First note where each letter of ${P} last appears.`;
      case 'table':
        return `P[${j}] = ${P[j]}, so last[${P[j]}] = ${j}.`;
      case 'align':
        return `Put P at position ${s} and start from its last letter.`;
      case 'compare':
        return f.equal
          ? `P[${j}] = ${P[j]} equals T[${s + j}]. Move one letter left.`
          : `P[${j}] = ${P[j]} differs from T[${s + j}] = ${T[s + j]}.`;
      case 'match':
        return `All ${P.length} letters match: ${P} occurs at ${s}.`;
      case 'shift': {
        if (f.afterMatch) {
          return f.badAt < 0
            ? 'The match ends at the end of the text, so move by 1 and stop.'
            : `Line up the next letter, ${f.badLetter}, with its rightmost copy in P: skip ${f.skip}.`;
        }
        const at = f.last[f.badLetter] ?? -1;
        if (at < 0)
          return `P has no ${f.badLetter}, so no alignment overlapping it can match: jump past it, skip ${f.skip}.`;
        if (at > j)
          return `The rightmost ${f.badLetter} in P lies to the right of j, so lining it up would move P backwards. Skip just 1.`;
        return `The rightmost ${f.badLetter} in P is at ${at}: line it up with the text, skip ${f.skip}.`;
      }
      case 'done':
        return `Done: ${plural(f.matches.length, 'match', 'matches')} with ${plural(f.comparisons, 'comparison', 'comparisons')}, and ${plural(unread, 'letter', 'letters')} of the text never read.`;
    }
  },
  takeaways: [
    'Comparing from the right means a mismatch often shows a letter that rules out many alignments at once.',
    'The bad-character rule skips j − last[c] places, and always at least 1. A letter missing from the pattern lets it jump past that letter entirely.',
    'On a good input the search reads only about n/m letters, which is sublinear: longer patterns make it faster.',
    'Bad character alone can still take O(n · m), as in the worst-case example. The full algorithm adds the good-suffix rule, which brings the worst case down to O(n + m) when the pattern does not occur, and Galil’s refinement extends that to every input.',
    'Try “No shared letters” and lengthen the pattern with more missing letters: the comparison count drops as the pattern grows.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    [
      'Set-up',
      'O(m + σ)',
      'One table slot per letter of the alphabet, filled in one pass over the pattern.',
    ],
    [
      'Best case',
      'O(n / m)',
      'Every alignment fails on its first comparison at a letter P does not contain.',
    ],
    ['Worst case', 'O(n · m)', 'Every alignment reads nearly all of P and then moves by just 1.'],
    ['Memory', 'O(σ)', 'The table of last positions, one entry per letter of the alphabet.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'P = example, and the first comparison, at j = 6, meets the text letter s. How far does the pattern skip?',
      answer: 7,
      unit: 'places',
      hints: ['example has no s, so last[s] = −1. Use j − last[s].'],
      solution: 'max(1, 6 − (−1)) = 7: the whole pattern moves past the s.',
    },
    {
      type: 'number',
      prompt:
        'P = abcab. The comparison at j = 4 meets the text letter c. How far does the pattern skip?',
      answer: 2,
      unit: 'places',
      hints: ['The rightmost c in abcab is at index 2.'],
      solution: 'j − last[c] = 4 − 2 = 2, which lines the c of P up with the c of the text.',
    },
    {
      type: 'number',
      prompt:
        'P = abcab. Positions 4 and 3 match, then the comparison at j = 2 meets the text letter b. How far does the pattern skip?',
      answer: 1,
      unit: 'places',
      hints: ['The rightmost b is at index 4, to the right of j.'],
      solution:
        'j − last[b] = 2 − 4 = −2. Moving by that would go backwards, so the rule uses max(1, −2) = 1.',
    },
    {
      type: 'number',
      prompt:
        'Load “No shared letters” (20 letters of a, pattern xyz) and step to the end. How many comparisons does it make?',
      answer: 6,
      unit: 'comparisons',
      hints: ['Each alignment fails at once on an a, and P has no a.'],
      solution:
        'Each failure skips 3, so the pattern sits at 0, 3, 6, 9, 12 and 15, and each spot costs one comparison: 6 in all. The plain matcher would make 18.',
    },
    {
      type: 'number',
      prompt:
        'Load “Worst case” (16 letters of a, pattern baaaa) and step to the end. How many comparisons does it make?',
      answer: 60,
      unit: 'comparisons',
      hints: [
        'There are 12 alignments. How many letters does each one read before failing at the b?',
      ],
      solution:
        'Each of the 12 alignments reads all 5 letters, failing on the b, and then moves by 1: 12 × 5 = 60. The plain matcher fails at once on this input and makes just 12.',
    },
  ],
  nextTeaser:
    'Next up: Z-function, which records for each position how long a stretch of the string repeats its own prefix.',
};
