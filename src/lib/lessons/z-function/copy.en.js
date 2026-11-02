/** @typedef {import('$lib/algo-engine/z-function.js').ZFrame} ZFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'z-function',
  topic: 'string-algorithms',
  level: 'Intermediate',
  title: 'Z-function',
  intro:
    'The Z-function records, for each position of a string, how many letters from there match the start of the string. Computing each value from scratch can take O(n²), but the rightmost match found so far, the Z-box, already tells what the letters inside it look like. That gets the whole array in O(n), and with a separator it is a pattern matcher too.',
  summary:
    'Compute the longest prefix match at every position in linear time, reusing the Z-box, and use it to search for a pattern.',
  instruction:
    'Type a string and step. The middle row slides the prefix under position i, and the [ ] marks bound the Z-box. When i is inside the box, watch the value copied from the mirror position: no letters are read for it. Add a pattern to search with P$T, where Z values equal to the pattern’s length mark the matches.',
  textLabel: 'String or text',
  patternLabel: 'Pattern (optional)',
  presetLabel: 'Example',
  presets: {
    classic: 'Repeating blocks',
    palindrome: 'Palindrome',
    repeats: 'All one letter',
    search: 'Find a pattern',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    length: `The string may have at most ${max} letters.`,
    combined: `The pattern, the separator and the text may have at most ${max} characters together.`,
  }),
  boardTitle: 'Z-box over the string',
  rows: { s: 'S', prefix: 'pre', z: 'Z' },
  boardNote:
    'Row pre is the start of S, moved so its first letter sits under i. Z[0] is left blank, since the whole string trivially matches itself.',
  /** @param {string} s */
  boardAria: (s) => `The string ${s}, its prefix aligned under position i, and its Z values.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} column ${c}: ${value || 'empty'}${state ? `, ${state}` : ''}`,
  rowNames: { s: 'String', prefix: 'Prefix', z: 'Z value' },
  states: {
    box: 'inside the Z-box',
    mirror: 'mirror of position i',
    matched: 'matched so far',
    equal: 'letters equal',
    miss: 'letters differ',
    current: 'position i',
    found: 'pattern found',
  },
  markers: { box: '', mirror: 'm', matched: '=', equal: '✓', miss: '✗', current: 'i', found: '★' },
  legend: {
    box: '[ ] Inside the Z-box',
    mirror: 'Mirror of i',
    matched: 'Matched so far',
    equal: 'Letters equal',
    miss: 'Letters differ',
    current: 'Position i',
    found: 'Pattern found',
  },
  boxEnds: { left: '[', right: ']' },
  stats: {
    i: 'Position i',
    box: 'Z-box [l, r)',
    comparisons: 'Letter comparisons',
    reused: 'Letters reused without reading',
    naive: 'Comparisons without the box',
    matches: 'Pattern matches',
  },
  /** @param {number} l @param {number} r */
  boxValue: (l, r) => (l === r ? '—' : `[${l}, ${r})`),
  matchesTitle: 'Matches at',
  matchesEmpty: 'none yet',
  /** @param {ZFrame} f */
  describe(f) {
    const { s, i, value, l, r } = f;
    switch (f.kind) {
      case 'start':
        return f.patternLength > 0
          ? `Search with S = ${s}: the separator $ occurs nowhere else, so no Z value can pass ${f.patternLength}.`
          : `Compute the Z-function of ${s}. The Z-box starts empty.`;
      case 'outside':
        return `i = ${i} is past the box, so nothing is known: start from Z[${i}] = 0.`;
      case 'inside':
        return value === r - i
          ? `i = ${i} is inside the box [${l}, ${r}), with mirror ${f.mirror}. Start from min(r − i, Z[${f.mirror}]) = ${value}, and everything to r is known. Read on from there.`
          : `i = ${i} is inside the box [${l}, ${r}), with mirror ${f.mirror}. Start from min(r − i, Z[${f.mirror}]) = ${value}, without reading those letters.`;
      case 'compare':
        return f.equal
          ? `S[${value}] = ${s[value]} equals S[${i + value}], so Z[${i}] grows to ${value + 1}.`
          : `S[${value}] = ${s[value]} differs from S[${i + value}] = ${s[i + value]}, so Z[${i}] stops at ${value}.`;
      case 'box':
        return `This match reaches further right than the box did, so the Z-box becomes [${l}, ${r}).`;
      case 'store':
        return `Z[${i}] = ${value}: ${plural(value, 'letter', 'letters')} from ${i} ${value === 1 ? 'matches' : 'match'} the start of S.`;
      case 'report':
        return `Z[${i}] equals the pattern’s length, ${f.patternLength}, so the pattern occurs at ${i - f.patternLength - 1} in the text.`;
      case 'done':
        return f.patternLength > 0
          ? `Done: ${plural(f.matches.length, 'match', 'matches')} with ${plural(f.comparisons, 'comparison', 'comparisons')}.`
          : `Done: ${plural(f.comparisons, 'comparison', 'comparisons')}, and ${plural(f.reused, 'letter', 'letters')} reused without reading.`;
    }
  },
  takeaways: [
    'Z[i] is the length of the longest substring starting at i that is also a prefix of S.',
    'The Z-box [l, r) is the match reaching furthest right so far. S[l..r) equals S[0..r − l), so position i inside it looks like position i − l.',
    'Inside the box, Z[i] starts from min(r − i, Z[i − l]). Only letters past r are ever read for the first time, so r moves forward at most n times.',
    'To find P in T, compute the Z-function of P + $ + T: wherever Z equals m, P occurs. The separator keeps every Z value at most m.',
    'Try “All one letter”, then the same length with no repeats: compare the comparisons with the count without the box.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Z-function',
      'O(n)',
      'Each comparison that matches pushes r right, and each i has at most one that fails: at most 2n in all.',
    ],
    ['Pattern search', 'O(n + m)', 'One run on the string P + $ + T, whose length is n + m + 1.'],
    [
      'Without the box',
      'O(n²)',
      'A string of one letter makes each position read all the way to the end.',
    ],
    ['Memory', 'O(n)', 'One Z value per position of the string.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'For S = abacaba, what is Z[4]?',
      answer: 3,
      unit: 'letters',
      hints: ['From index 4 the letters are aba. How many match the start of S?'],
      solution: 'From index 4 the rest is aba, and aba is exactly the start of S, so Z[4] = 3.',
    },
    {
      type: 'number',
      prompt: 'For S = aaaaa, what is Z[2]?',
      answer: 3,
      unit: 'letters',
      hints: ['Every letter matches, so only the end of the string stops the match.'],
      solution:
        'Indices 2, 3 and 4 hold letters that all match the start, then the string ends. So Z[2] = 3.',
    },
    {
      type: 'number',
      prompt:
        'For S = aabxaabxc the Z-box is [4, 8) when i = 5, and Z[1] = 1. What value does Z[5] start from, before any letter is read?',
      answer: 1,
      unit: 'letters',
      hints: ['Use min(r − i, Z[i − l]).'],
      solution: 'min(8 − 5, Z[5 − 4]) = min(3, Z[1]) = min(3, 1) = 1.',
    },
    {
      type: 'number',
      prompt:
        'Search for P = ab in T = abab. Using S = ab$abab, how many positions of S have a Z value of exactly 2?',
      answer: 2,
      unit: 'positions',
      hints: ['Type the text and the pattern into the widget, and read the Z row.'],
      solution:
        'S has Z values 0, 0, 2, 0, 2, 0 from index 1 on. The two 2s are the matches at 0 and 2 in the text.',
    },
    {
      type: 'number',
      prompt:
        'Load “All one letter” and step to the end. How many comparisons does the box save, compared with computing each value from zero?',
      answer: 55,
      unit: 'comparisons',
      hints: ['Read both stat cards at the last step and subtract.'],
      solution:
        'Without the box each position reads to the end: 11 + 10 + … + 1 = 66. With the box only the first position reads letters: 11. So 66 − 11 = 55 are saved.',
    },
  ],
  nextTeaser:
    'Next up: Aho-Corasick, which adds failure links to a trie so that many patterns can be found in a single pass over the text.',
};
