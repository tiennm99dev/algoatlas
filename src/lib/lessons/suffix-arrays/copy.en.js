/** @typedef {import('$lib/algo-engine/suffix-arrays.js').SuffixFrame} SuffixFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'suffix-arrays',
  topic: 'string-algorithms',
  level: 'Advanced',
  title: 'Suffix arrays and LCP',
  intro:
    'A suffix array lists the start of every suffix of a text in sorted order, so any pattern can later be found by binary search. Prefix doubling builds it in about log₂ n rounds by sorting on 2, 4, 8, … letters, and Kasai’s algorithm then finds the longest common prefix of each pair of neighbours in O(n). Together they answer questions about repeats and substrings with one pass.',
  summary:
    'Sort every suffix of a text by prefix doubling, then compute the LCP of each neighbouring pair with Kasai’s algorithm.',
  instruction:
    'Type a string and step. Each round sorts by a pair of ranks that together cover twice as many letters, shown as two tints. Then Kasai fills the bars between neighbours in text order. Watch h: it never drops by more than one, so most letters are never read twice.',
  textLabel: 'String',
  presetLabel: 'Example',
  presets: {
    banana: 'banana',
    mississippi: 'mississippi',
    repeats: 'All one letter',
    blocks: 'Repeating block',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    length: `The string may have at most ${max} letters.`,
  }),
  boardTitle: 'Suffixes in the current order',
  /** @param {string} s */
  boardAria: (s) => `The suffixes of ${s} in their current order, with LCP bars between them.`,
  heads: { rank: 'Row', start: 'Start', key: 'Key' },
  boardNote:
    'Letters past the current sort key do not count yet, so rows that tie may look out of order. A bar between two rows is their longest common prefix.',
  /** @param {number} row @param {number} start @param {string} suffix @param {string} state */
  rowLabel: (row, start, suffix, state) =>
    `Row ${row}: suffix ${suffix}, starting at ${start}${state ? `, ${state}` : ''}`,
  /** @param {number} h */
  barLabel: (h) => `LCP ${h}`,
  states: {
    first: 'first half of the key',
    second: 'second half of the key',
    shared: 'known common prefix',
    equal: 'letters equal',
    miss: 'letters differ',
  },
  rowStates: { current: 'suffix i', above: 'neighbour j above' },
  markers: { first: '¹', second: '²', shared: '=', equal: '✓', miss: '✗' },
  rowMarkers: { current: 'i', above: 'j' },
  legend: {
    first: '¹ Key: first half',
    second: '² Key: second half',
    shared: '= Common prefix',
    equal: '✓ Letters equal',
    miss: '✗ Letters differ',
  },
  rowLegend: 'Row badges: i is the suffix handled now, j its neighbour above.',
  stats: {
    k: 'Letters per rank (k)',
    rounds: 'Sorting rounds',
    keyChecks: 'Key comparisons',
    comparisons: 'Kasai comparisons',
    h: 'Running h',
    direct: 'Letters read by direct sort',
    distinct: 'Distinct substrings',
    repeat: 'Longest repeat',
  },
  repeatNone: 'none',
  arraysTitle: 'Suffix array, row by row',
  lcpTitle: 'LCP array, row by row',
  lcpEmpty: 'not computed yet',
  /** @param {SuffixFrame} f */
  describe(f) {
    const { s, k, i, j, h } = f;
    switch (f.kind) {
      case 'start':
        return `Start from each letter’s rank: a = 0, b = 1, and so on. That sorts by the first letter only, and the rows are still in text order.`;
      case 'pairs':
        return `Each suffix gets a key of two ranks: its own, and the one ${plural(k, 'letter', 'letters')} further on, or −1 past the end. Together they cover ${plural(2 * k, 'letter', 'letters')}.`;
      case 'sorted':
        return `Sort the rows by key. The suffixes are now in order by their first ${plural(2 * k, 'letter', 'letters')}.`;
      case 'rerank':
        return `Give new ranks: equal keys share a rank. ${f.rank.length - new Set(f.rank).size === 0 ? 'All ranks differ.' : 'Some suffixes still tie.'}`;
      case 'double':
        return `Ties remain, so double k to ${k}.`;
      case 'stop':
        return `Every rank is different after ${plural(f.rounds, 'round', 'rounds')}, so the suffix array is finished.`;
      case 'kasai':
        return 'Kasai’s algorithm visits the suffixes in text order, not row order, and keeps a running h.';
      case 'skip':
        return `Suffix ${i} sits in the top row with no neighbour above. Reset h to 0.`;
      case 'visit':
        return h > 0
          ? `Suffix ${i} has neighbour ${j} above. The last step proves ${plural(h, 'letter matches', 'letters match')} already, so start from h = ${h}.`
          : `Suffix ${i} has neighbour ${j} above. Compare from h = 0.`;
      case 'compare':
        return f.equal
          ? `s[${i + h}] = s[${j + h}] = ${s[i + h]}, so h grows to ${h + 1}.`
          : `s[${i + h}] = ${s[i + h]} differs from s[${j + h}] = ${s[j + h]}, so h stays at ${h}.`;
      case 'store':
        return `LCP = ${h} between suffix ${j} and suffix ${i}.`;
      case 'shrink':
        return `The next suffix starts one letter later, so at most one letter of the match is lost: h becomes ${h}.`;
      case 'done':
        return `Done: ${plural(f.rounds, 'sorting round', 'sorting rounds')} and ${plural(f.comparisons, 'Kasai comparison', 'Kasai comparisons')} for ${plural(s.length, 'letter', 'letters')}.`;
    }
  },
  takeaways: [
    'A suffix array is the start of every suffix, in sorted order. It holds n integers, and a pattern can be found in it by binary search in O(m log n).',
    'Prefix doubling turns the order on k letters into the order on 2k letters: a pair of ranks is all the comparison needs.',
    'The LCP array stores the longest common prefix of neighbouring rows. Any two suffixes share the minimum LCP between their rows.',
    'Kasai visits suffixes in text order because h then drops by at most one per step. That bounds the letter comparisons by 2n.',
    'Try “All one letter” and “banana”, then compare the rounds, and read the longest repeat and the count of distinct substrings off the last step.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Prefix doubling',
      'O(n log² n)',
      'At most about log₂ n rounds, each a comparison sort of n keys. A radix sort of the pairs brings this down to O(n log n).',
    ],
    [
      'Kasai LCP',
      'O(n)',
      'h grows with every matching comparison and drops by at most one per suffix, so there are at most 2n comparisons.',
    ],
    [
      'Sorting suffixes directly',
      'O(n² log n)',
      'Each comparison may read up to n letters when the text repeats.',
    ],
    ['Pattern lookup', 'O(m log n)', 'Binary search over the rows, with m letters per comparison.'],
    ['Memory', 'O(n)', 'The suffix array, ranks and LCP array are n integers each.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'order',
      prompt: 'Put the suffixes of banana in sorted order.',
      items: ['banana', 'anana', 'nana', 'ana', 'na', 'a'],
      answer: [5, 3, 1, 0, 4, 2],
      hints: ['A suffix that is a prefix of another comes first, so a comes before ana.'],
      solution: 'a, ana, anana, banana, na, nana. So the suffix array is 5, 3, 1, 0, 4, 2.',
    },
    {
      type: 'number',
      prompt: 'What is the LCP of the neighbours ana and anana?',
      answer: 3,
      unit: 'letters',
      hints: ['Compare them letter by letter until they differ or one ends.'],
      solution: 'ana is a prefix of anana, so all three of its letters are shared.',
    },
    {
      type: 'text',
      prompt: 'What is the longest substring of banana that occurs at least twice?',
      accept: ['ana'],
      hints: ['It is a prefix of the two rows around the largest LCP.'],
      solution: 'The largest LCP is 3, between ana and anana. Their common prefix is ana.',
    },
    {
      type: 'number',
      prompt: 'How many distinct non-empty substrings does banana have?',
      answer: 15,
      unit: 'substrings',
      hints: ['There are n(n + 1) / 2 substrings by position. Subtract the sum of the LCP array.'],
      solution:
        'Six letters give 21 substrings by position. The LCPs are 1, 3, 0, 0 and 2, summing to 6, so 21 − 6 = 15 are distinct.',
    },
    {
      type: 'number',
      prompt: 'Load “All one letter”, with 8 letters. How many sorting rounds does doubling need?',
      answer: 3,
      unit: 'rounds',
      hints: ['Each round covers twice as many letters. Step to the end and read the stat card.'],
      solution:
        'The rounds cover 2, 4 and 8 letters. After 8 letters every suffix differs, since each has a different length.',
    },
  ],
  nextTeaser:
    'Next up: Manacher’s algorithm, which reuses what it knows about mirror positions to find the longest palindrome in linear time.',
};
