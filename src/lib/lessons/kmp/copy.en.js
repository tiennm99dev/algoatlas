/** @typedef {import('$lib/algo-engine/kmp.js').KmpFrame} KmpFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'kmp',
  topic: 'string-algorithms',
  level: 'Intermediate',
  title: 'Prefix function and KMP',
  intro:
    'When a plain search fails after matching several letters, it starts over and rereads them. Knuth-Morris-Pratt never does: the prefix function of the pattern says how much of what just matched can still be the start of a match. So the text is read in one pass, for O(n + m) in total.',
  summary:
    'Build the prefix function of a pattern, then watch KMP fall back along it on a mismatch without moving backwards in the text.',
  instruction:
    'Type a text and a pattern, then step. First the pattern is compared with itself to fill the π row. In the search, the pattern row jumps right on a mismatch while the column being read stays put. Watch the ↩ cells: they are the border that lets the matched letters be kept.',
  textLabel: 'Text',
  patternLabel: 'Pattern',
  presetLabel: 'Example',
  presets: {
    classic: 'Partial match',
    border: 'Long border',
    overlap: 'Overlapping matches',
    repeats: 'Repeated letters',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    textLength: `The text may have at most ${maxText} letters.`,
    patternLength: `The pattern may have at most ${maxPattern} letters.`,
  }),
  boardTitle: { build: 'The pattern against itself', search: 'The pattern against the text' },
  rows: { top: { build: 'P', search: 'T' }, under: 'P' },
  /** @param {string} top @param {string} pattern */
  boardAria: (top, pattern) => `${top} with the pattern ${pattern} aligned under it.`,
  piTitle: 'Prefix function',
  piRows: { letter: 'P', pi: 'π' },
  piNote: 'π[i] is the length of the longest proper prefix of P[0..i] that is also its suffix.',
  /** @param {string} pattern */
  piAria: (pattern) => `Prefix function of ${pattern}.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} column ${c}: ${value || 'empty'}${state ? `, ${state}` : ''}`,
  rowNames: { top: 'Upper row', under: 'Pattern row', letter: 'Pattern letter', pi: 'π value' },
  states: {
    matched: 'matched so far',
    read: 'read now',
    equal: 'letters equal',
    miss: 'letters differ',
    border: 'border kept after the jump',
    found: 'full match',
  },
  markers: { matched: '=', read: '?', equal: '✓', miss: '✗', border: '↩', found: '★' },
  legend: {
    matched: 'Matched so far',
    read: 'Read now',
    equal: 'Letters equal',
    miss: 'Letters differ',
    border: 'Border kept after a jump',
    found: 'Full match',
  },
  stats: {
    i: 'Index i',
    k: 'Letters matched',
    build: 'Comparisons building π',
    comparisons: 'Comparisons searching',
    falls: 'Fallback jumps',
    naive: 'Plain matcher’s comparisons',
  },
  /** @param {number} n */
  bound: (n) => `The search never exceeds 2n = ${2 * n} comparisons on this text.`,
  matchesTitle: 'Matches at',
  matchesEmpty: 'none yet',
  /** @param {KmpFrame} f */
  describe(f) {
    const { text: T, pattern: P, i, k } = f;
    const top = f.phase === 'build' ? 'P' : 'T';
    const topAt = f.phase === 'build' ? P[i] : T[i];
    switch (f.kind) {
      case 'start':
        return `First compute the prefix function of ${P}. π[0] is always 0: a proper prefix of one letter is empty.`;
      case 'build-compare':
      case 'compare': {
        const compared = `${top}[${i}] = ${topAt} against P[${k}] = ${P[k]}`;
        if (f.equal)
          return `${compared}: equal, so ${k + 1} ${k === 0 ? 'letter matches' : 'letters match'}.`;
        return k === 0
          ? `${compared}: different, and nothing is matched, so move on to the next letter.`
          : `${compared}: different, but ${plural(k, 'letter', 'letters')} just matched.`;
      }
      case 'build-fall':
      case 'fall':
        if (k === 0)
          return `Fall back: π[${f.fallFrom - 1}] = 0. No part of what matched can start a match, so slide P right by ${f.fallFrom}. Index i stays at ${i}.`;
        return `Fall back: π[${f.fallFrom - 1}] = ${k}. The last ${plural(k, 'letter', 'letters')} of what matched ${k === 1 ? 'is' : 'are'} also the first ${plural(k, 'letter', 'letters')} of P, so keep ${k === 1 ? 'it' : 'them'} and slide P right by ${f.fallFrom - k}. Index i stays at ${i}.`;
      case 'build-store':
        return `So π[${i}] = ${k}: the first ${i + 1} letters of P have a border of length ${k}.`;
      case 'search-start':
        return `π is ready. Now scan ${T} from the left with no letters matched.`;
      case 'match':
        return `All ${P.length} letters match: ${P} occurs at ${i - P.length + 1}.`;
      case 'advance':
        return `To catch overlaps, fall back to π[${f.fallFrom - 1}] = ${k} and keep scanning.`;
      case 'done':
        return `Done: ${plural(f.matches.length, 'match', 'matches')} with ${plural(f.comparisons, 'comparison', 'comparisons')}, and i never moved backwards.`;
    }
  },
  takeaways: [
    'π[i], also called the failure function, is the length of the longest proper prefix of P[0..i] that is also a suffix of it: its longest border.',
    'After a mismatch with q letters matched, those letters are known without reading the text again, so q can jump straight to π[q − 1].',
    'The text index only moves forward. Each comparison either advances i or shrinks q, and q cannot shrink more often than it grew, so the search takes at most 2n comparisons.',
    'Building π is the same algorithm with the pattern searching itself, so it costs O(m).',
    'Try “Repeated letters”: compare the plain matcher’s count with the comparisons here, then type a pattern with no repeated prefix and watch every jump go back to 0.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    ['Build π', 'O(m)', 'k rises by at most 1 per letter, and each fallback lowers it.'],
    [
      'Search',
      'O(n)',
      'i never goes back, and q falls at most as often as it rose: at most 2n comparisons.',
    ],
    ['Memory', 'O(m)', 'One π value per pattern letter; the text can even be a stream.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'For P = abcabd, what is π[4], the value for the prefix abcab?',
      answer: 2,
      hints: ['Look for the longest proper prefix of abcab that is also its suffix.'],
      solution:
        'ab is both a prefix and a suffix of abcab. The longer candidates fail: abc is not cab, and abca is not bcab. So π[4] = 2.',
    },
    {
      type: 'number',
      prompt: 'For P = aabaaab, what is π[6]? Type the pattern in the widget to check.',
      answer: 3,
      hints: ['Check whether aab, the first three letters, is also the end of aabaaab.'],
      solution: 'aab is a suffix and a prefix of aabaaab. No longer border exists, so π[6] = 3.',
    },
    {
      type: 'number',
      prompt:
        'Searching with P = ababd, the first four letters match and the fifth mismatches. How many letters are still matched after the fallback?',
      answer: 2,
      unit: 'letters',
      hints: ['After q = 4 the jump goes to π[3], the longest border of abab.'],
      solution: 'π[3] = 2 because ab is a border of abab, so q becomes 2 and P slides right by 2.',
    },
    {
      type: 'number',
      prompt:
        'Load “Repeated letters” and step to the end. How many fewer comparisons does the search use than the plain matcher?',
      answer: 33,
      unit: 'comparisons',
      hints: ['Read both stat cards at the last step and subtract.'],
      solution:
        'The plain matcher does 60 comparisons and KMP’s search does 27, so 60 − 27 = 33 fewer.',
    },
    {
      type: 'choice',
      prompt: 'Why can the search skip rereading the letters that just matched?',
      options: [
        'They are stored in a hash table',
        'Those letters equal a known part of the pattern, so π already says how they overlap',
        'The text is sorted first',
        'A mismatch means no later match can overlap them',
      ],
      answer: 1,
      hints: ['What do you know about the text letters that just matched?'],
      solution:
        'The matched text letters are exactly P[0..q), so everything about their overlaps is a fact about the pattern, computed in advance in π.',
    },
  ],
  nextTeaser:
    'Next up: Boyer-Moore, which compares from the right end of the pattern and often leaps over whole stretches of the text.',
};
