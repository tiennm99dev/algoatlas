/** @typedef {import('$lib/algo-engine/digit-dp.js').DigitFrame} DigitFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number} a @param {number} b */
const span = (a, b) => (a === b ? `sum ${a}` : `sums ${a}..${b}`);

export const en = {
  slug: 'digit-dp',
  topic: 'advanced-dp',
  level: 'Advanced',
  title: 'Digit DP',
  intro:
    'How many numbers from 0 to N have a digit sum of exactly S? Checking each one costs O(N), far too slow for N = 10¹⁸. Digit DP builds the numbers digit by digit instead, keeping only what the future needs: the digit sum so far, and one tight flag that says whether the prefix still equals N’s prefix, so the next digit is capped by N’s digit.',
  summary:
    'Count numbers up to N with a given digit sum by filling digits position by position, with a tight flag that caps each digit by N.',
  instruction:
    'Type N and S, or pick an example, and step. The top row is N: ▲ marks the tight prefix that still equals it. The digit row shows which next digits are allowed: ○ keeps a prefix loose, ▲ keeps it tight, ✕ is blocked. In the table, row i counts loose prefixes of i digits by their digit sum.',
  limitLabel: 'N',
  targetLabel: 'Digit sum S',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    small: 'N = 345, S = 10',
    round: 'N = 1000, S = 5',
    big: 'N = 52817, S = 14',
  },
  /** @param {number} max */
  limitError: (max) => `N must be a whole number from 0 to ${max}.`,
  /** @param {number} max */
  targetError: (max) => `S must be a whole number from 0 to ${max}.`,
  numberTitle: 'N, digit by digit',
  /** @param {number} limit */
  numberAria: (limit) => `The digits of N = ${limit}.`,
  /** @param {number} i @param {number} d @param {string} state */
  numberCell: (i, d, state) => `Position ${i + 1}: digit ${d}${state ? `, ${state}` : ''}`,
  numberStates: { tight: 'tight so far', current: 'filled now', dead: 'tight prefix died' },
  choiceTitle: 'Next digit',
  choiceAria: 'Digits 0 to 9 and whether each may follow.',
  /** @param {number} d @param {string} state */
  choiceCell: (d, state) => `Digit ${d}${state ? `: ${state}` : ''}`,
  choiceStates: {
    loose: 'allowed, the prefix is loose',
    tight: 'allowed, stays tight',
    above: 'blocked, the number would pass N',
    over: 'blocked, the sum would pass S',
  },
  tableTitle: 'Loose prefixes cnt[s]',
  /** @param {number} len @param {number} target */
  tableAria: (len, target) =>
    `Table of loose prefix counts, ${len + 1} rows by digit sums 0 to ${target}.`,
  /** @param {number} r */
  rowHead: (r) => `${r}`,
  tableNote:
    'Row i: prefixes of i digits already below N, counted by digit sum. ▲ marks the one tight prefix, which the counts leave out.',
  /** @param {number} r @param {number} s @param {string} v @param {string} state */
  cellLabel: (r, s, v, state) =>
    `${plural(r, 'digit', 'digits')}, sum ${s}: ${v === '' ? 'not filled' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    source: 'spread now',
    target: 'receives',
    branch: 'receives from the tight prefix',
    tight: 'tight prefix here',
    answer: 'the answer',
  },
  legend: {
    source: 'Spread now',
    target: 'Receives a count',
    tight: 'Tight prefix',
    over: 'Blocked digit',
    answer: 'The answer',
  },
  markers: { source: '●', target: '○', tight: '▲', over: '✕', answer: '★' },
  stats: {
    transitions: 'Digit choices tried',
    answer: 'Numbers found',
    brute: 'Numbers brute force checks',
    states: 'States in the table',
  },
  pending: '…',
  /** @param {DigitFrame} f */
  describe(f) {
    const D = f.digits[f.i];
    const len = f.digits.length;
    const S = f.target;
    switch (f.kind) {
      case 'start':
        return `Count the numbers from 0 to ${f.limit} whose digits add up to ${S}. Write each with ${plural(len, 'digit', 'digits')}, padding with leading zeros, which add nothing to the sum.`;
      case 'init':
        return 'Before the first digit there is no loose prefix yet. The empty prefix is tight, with sum t = 0.';
      case 'position':
        return `Position ${f.i + 1}: N’s digit here is ${D}. Start a new row for prefixes of ${plural(f.i + 1, 'digit', 'digits')}.`;
      case 'spread': {
        const top = Math.min(f.s + 9, S);
        const cut =
          f.s + 9 > S ? ` Sums above ${S} are dropped: digits never make a sum smaller.` : '';
        return `${plural(f.from, 'loose prefix has', 'loose prefixes have')} sum ${f.s}. ${f.from === 1 ? 'It is' : 'They are'} already below N, so any digit 0–9 may follow: add ${f.from} to ${span(f.s, top)}.${cut}`;
      }
      case 'branch': {
        const top = Math.min(f.s + D - 1, S);
        const reach = f.s > S ? 'none fit under S' : `+1 to ${span(f.s, top)}`;
        return `The tight prefix (sum ${f.s}) may take a digit below ${D}, from 0 to ${D - 1}. Each one falls below N and becomes loose: ${reach}.`;
      }
      case 'stay': {
        const t = f.tight[f.i + 1];
        return t === null
          ? `Taking ${D} itself would make the tight sum ${f.s + D} > ${S}, so the tight prefix can no longer reach S. It dies.`
          : `Or the tight prefix takes ${D} itself and still equals N’s prefix: t = ${f.s} + ${D} = ${t}.`;
      }
      case 'row':
        return `Row ${f.i + 1} is done: ${plural(f.table[f.i + 1][S] ?? 0, 'loose prefix sums', 'loose prefixes sum')} to ${S} so far.`;
      case 'done': {
        const loose = f.table[len][S] ?? 0;
        return f.tight[len] === S
          ? `${plural(f.result ?? 0, 'number', 'numbers')}: ${plural(loose, 'loose one', 'loose ones')} with sum ${S}, plus N itself, whose tight prefix ends at ${S}.`
          : `${plural(f.result ?? 0, 'number', 'numbers')} from 0 to ${f.limit} ${f.result === 1 ? 'has' : 'have'} digit sum ${S}: the count in cnt[${S}] of the last row.`;
      }
    }
  },
  takeaways: [
    'Build numbers position by position from the most significant digit. Count prefixes, not numbers: all prefixes that share the same state have the same futures.',
    'The tight flag says whether the prefix still equals N’s prefix. Tight: the next digit may go up to N’s digit only, and only that digit keeps it tight. Loose: any digit 0–9 is allowed, and it stays loose forever.',
    'The state here is (position, digit sum, tight). There are O(len · S) states with 10 choices each: about 10 · 18 · 162 steps for N up to 10¹⁸, instead of 10¹⁸ checks.',
    'A range L..R comes from two counts: f(R) − f(L − 1). Other properties change only the state: the last digit for “no two equal neighbours”, the remainder for “divisible by 7”.',
    'Try N = 999 and N = 1000 with the same S: one more digit adds a row, but the tight prefix of 1000 drops out at once.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Time', 'O(len · S · 10)', 'Each position spreads up to S + 1 loose sums over 10 digits.'],
    [
      'Memory',
      'O(S)',
      'Only the current and next row are needed; the page keeps them all to show them.',
    ],
    ['Tight prefix', 'O(len)', 'One prefix, one sum, at most 10 choices per position.'],
    ['Brute force', 'O(N · len)', 'Every number from 0 to N, each digit added up.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many numbers from 0 to 345 have digit sum 10?',
      answer: 33,
      unit: 'numbers',
      hints: ['Load the first example and step to the end.'],
      solution:
        '33. The last row holds 33 loose prefixes with sum 10, and the tight prefix 3, 4 → 7 dies at the last digit, since 7 + 5 = 12 > 10, so 345 itself does not count.',
    },
    {
      type: 'number',
      prompt: 'How many numbers from 0 to 1000 have digit sum 5?',
      answer: 21,
      unit: 'numbers',
      hints: ['Load N = 1000, S = 5.', 'Three digits that add up to 5: stars and bars.'],
      solution:
        '21. 1000 has sum 1, so only 0..999 count: three digits adding up to 5 can be chosen in C(7, 2) = 21 ways.',
    },
    {
      type: 'choice',
      prompt:
        'The prefix so far is tight and N’s next digit is 4. Which next digits keep it tight?',
      options: ['0, 1, 2 and 3', 'Only 4', 'Any digit from 0 to 9', '4 and above'],
      answer: 1,
      hints: ['Tight means equal to N’s prefix.'],
      solution:
        'Only 4 keeps the prefix equal to N’s. 0..3 make it smaller, so it turns loose; 5..9 would pass N and are blocked.',
    },
    {
      type: 'number',
      prompt:
        'Count the numbers from 100 to 345 with digit sum 10, using f(R) − f(L − 1). f(99) is 9. What is the answer?',
      answer: 24,
      unit: 'numbers',
      hints: ['f(345) comes from the first example.', 'f(99) counts 19, 28, …, 91.'],
      solution: 'f(345) − f(99) = 33 − 9 = 24.',
    },
    {
      type: 'text',
      prompt: 'Roughly how many steps does digit DP need for N with len digits and target sum S?',
      accept: [
        'O(len·S·10)',
        'O(10·len·S)',
        'O(len*S*10)',
        'O(10*len*S)',
        'O(len S)',
        'O(len·S)',
        'O(len*S)',
        'O(S·len)',
        'O(S*len)',
      ],
      hints: ['Count positions, sums and digit choices.'],
      solution: 'len positions × (S + 1) sums × 10 digits: O(len · S · 10).',
    },
  ],
  nextTeaser:
    'Next up: DP optimisations, such as the convex hull trick that keeps only the lines of a lower envelope.',
};
