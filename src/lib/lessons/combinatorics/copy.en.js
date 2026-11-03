/** @typedef {import('$lib/algo-engine/combinatorics.js').PascalFrame} PascalFrame */
/** @typedef {import('$lib/algo-engine/combinatorics.js').LucasFrame} LucasFrame */
/** @typedef {import('$lib/algo-engine/combinatorics.js').BracketFrame} BracketFrame */

/** @param {number} n */
const big = (n) => n.toLocaleString('en-US');

export const en = {
  slug: 'combinatorics',
  topic: 'number-theory',
  level: 'Intermediate',
  title: 'Combinatorics: binomials and Catalan numbers',
  intro:
    'C(n, k), read “n choose k”, counts the ways to pick k items from n. Pascal’s triangle builds every C(n, k) by adding, so a contest answer “mod p” never needs a huge number. Factorial tables and Lucas’s theorem reach n far beyond any table. The Catalan numbers, which come straight out of the triangle, count balanced brackets, binary trees and many other shapes.',
  summary:
    'Build Pascal’s triangle, compute n choose k modulo a prime with factorial tables and Lucas’s theorem, and count balanced brackets with the Catalan numbers.',
  instruction:
    'Pick a view. In Pascal’s triangle, step through the additions, type a modulus p and watch which cells it divides, then select a cell to read its meaning. In n choose k mod p, watch n and k split into base-p digits. In Catalan brackets, follow the path as it climbs and falls but never goes below the baseline, and see each finished sequence become a binary tree.',
  modeLegend: 'View',
  modes: {
    pascal: 'Pascal’s triangle',
    lucas: 'n choose k mod p',
    brackets: 'Catalan brackets',
  },
  presetLabel: 'Example',
  fields: {
    rows: 'Last row N',
    p: 'Prime p',
    modulus: 'Modulus p',
    n: 'n',
    k: 'k',
    pairs: 'Bracket pairs n',
  },
  viewLegend: 'Cells show',
  views: { exact: 'Exact values', mod: 'Remainders mod p' },
  pascalPresets: {
    small: 'Rows 0 to 6, mod 2',
    sierpinski: 'Rows 0 to 15, mod 2',
    primeRow: 'Row 7, mod 7',
  },
  lucasPresets: {
    single: 'C(10, 3) mod 13',
    lucas: 'C(1000, 300) mod 13',
    zero: 'C(6, 2) mod 3',
    parity: 'C(12, 4) mod 2',
    huge: 'C(10⁹, 5·10⁸) mod 1009',
  },
  /** @param {number} max */
  rowsError: (max) => `The last row must be a whole number from 0 to ${max}.`,
  /** @param {number} max */
  modulusError: (max) => `The modulus must be a whole number from 2 to ${max}.`,
  /** @param {number} max */
  numberError: (max) => `n and k must be whole numbers from 0 to ${big(max)}.`,
  /** @param {number} max */
  primeError: (max) => `p must be a prime number no larger than ${big(max)}.`,
  /** @param {number} max */
  pairsError: (max) => `The number of pairs must be a whole number from 0 to ${max}.`,

  triangleTitle: 'C[n][k]: rows are n, columns are k',
  /** @param {number} p */
  triangleAria: (p) => `Pascal’s triangle, with the multiples of ${p} marked.`,
  /**
   * @param {number} n @param {number} k @param {string} shown @param {string} state
   */
  cellLabel: (n, k, shown, state) =>
    `C(${n}, ${k})${shown ? ` shows ${shown}` : ', not filled yet'}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'being filled',
    read: 'read by this addition',
    multiple: 'divisible by p',
    mirror: 'the mirror of the selected cell',
    plain: '',
  },
  cellMarkers: { current: '▲', read: '+', multiple: '÷', mirror: '↔', plain: '' },
  legend: {
    current: '▲ Being filled',
    read: '+ Read by this addition',
    multiple: '÷ Divisible by p',
    mirror: '↔ Mirror of the selected cell',
  },
  selectedTitle: 'Selected cell',
  selectedEmpty: 'Select a filled cell to read what it counts.',
  /**
   * @param {number} n @param {number} k @param {number} value
   */
  selectedCount: (n, k, value) =>
    `C(${n}, ${k}) = ${big(value)}: the ways to pick ${k} items from ${n}.`,
  /** @param {number} n @param {number} k */
  selectedMirror: (n, k) =>
    n === 2 * k
      ? 'This cell is the middle of its row, so it is its own mirror.'
      : `Picking ${k} is the same as leaving out ${n - k}, so C(${n}, ${k}) = C(${n}, ${n - k}).`,
  /** @param {number} n @param {number} k @param {number} a @param {number} b */
  selectedSum: (n, k, a, b) =>
    `Item ${n} is either left out or taken: C(${n - 1}, ${k}) + C(${n - 1}, ${k - 1}) = ${big(a)} + ${big(b)}.`,
  selectedEdge: 'An edge of the triangle: there is one way to pick nothing or everything.',
  pascalStats: {
    additions: 'Additions',
    filled: 'Cells filled',
    multiples: 'Divisible by p',
    rowSum: 'Sum of the last full row',
  },
  /** @param {number} r @param {number} sum */
  rowSumNote: (r, sum) => `Row ${r}: 2^${r} = ${big(sum)}`,
  rowSumEmpty: '—',
  /** @param {PascalFrame} f @param {number} p @param {boolean} reduced */
  describePascal(f, p, reduced) {
    switch (f.kind) {
      case 'start':
        return `Build rows 0 to ${f.N} of the triangle. Every cell will be the sum of the two above it.`;
      case 'edge':
        return f.n === 0
          ? 'C(0, 0) = 1: there is one way to pick nothing from nothing.'
          : `Row ${f.n} starts and ends with 1, since C(${f.n}, 0) = C(${f.n}, ${f.n}) = 1.`;
      case 'add': {
        const a = /** @type {number} */ (f.table[f.n - 1][f.k - 1]);
        const b = /** @type {number} */ (f.table[f.n - 1][f.k]);
        const sum = a + b;
        return reduced
          ? `C(${f.n}, ${f.k}) ≡ ${a % p} + ${b % p} ≡ ${sum % p} (mod ${p}). Reducing as you add keeps every number below p.`
          : `C(${f.n}, ${f.k}) = C(${f.n - 1}, ${f.k - 1}) + C(${f.n - 1}, ${f.k}) = ${a} + ${b} = ${sum}.`;
      }
      case 'done':
        return `Done: ${f.filled} ${f.filled === 1 ? 'cell' : 'cells'} with ${f.additions} ${f.additions === 1 ? 'addition' : 'additions'}, about N²/2 in all. Now select a cell.`;
    }
  },

  digitsTitle: 'n and k in base p, lowest digit first',
  digitsEmpty: 'Step to read the first digit.',
  digitsNone: 'n and k are both 0, so there are no digits to read.',
  digitsHead: { pos: 'Digit', ni: 'nᵢ', ki: 'kᵢ', term: 'C(nᵢ, kᵢ) mod p' },
  /** @param {number} ni @param {number} ki */
  termZero: (ni, ki) => `0, since ${ki} > ${ni}`,
  termWaiting: '…',
  currentRow: '→',
  formulaTitle: 'This step',
  /** @param {LucasFrame} f */
  lucasFormula(f) {
    if (f.kind === 'multiply') {
      return `fact[${f.ni}]·inv[${f.ki}]·inv[${f.ni - f.ki}] = ${f.factN}·${f.invK}·${f.invD} ≡ ${f.term}`;
    }
    if (f.kind === 'done' && f.result !== 0)
      return `C(${big(f.n0)}, ${big(f.k0)}) ≡ ${f.result} (mod ${f.p})`;
    if (f.result === 0 && f.kind !== 'start') {
      return `C(${big(f.n0)}, ${big(f.k0)}) ≡ 0 (mod ${f.p})`;
    }
    return `C(n, k) ≡ ∏ C(nᵢ, kᵢ) (mod ${f.p})`;
  },
  lucasStats: {
    result: 'Result so far',
    digits: 'Digits read',
    table: 'Entries in each table',
    pascal: 'Cells a full triangle needs',
  },
  /** @param {LucasFrame} f */
  describeLucas(f) {
    switch (f.kind) {
      case 'start':
        if (f.n0 === 0 && f.k0 === 0) {
          return `Find C(0, 0) mod ${f.p}. n and k are both 0, so there are no digits and the result stays 1.`;
        }
        if (f.k0 > f.n0) {
          return `Find C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p}. Since k > n there is no way to pick, and the digits will show it: some digit of k must be larger.`;
        }
        return f.n0 < f.p
          ? `Find C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p}. Since n < p, one digit is enough: this is the plain factorial formula, with division done by inverses.`
          : `Find C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p}. Here n ≥ p, so fact[n] would be 0 and the plain formula fails. Lucas’s theorem works on base-${f.p} digits instead.`;
      case 'digit':
        return `Digit ${f.rows.length - 1}: nᵢ = ${big(f.n)} mod ${f.p} = ${f.ni} and kᵢ = ${big(f.k)} mod ${f.p} = ${f.ki}.`;
      case 'zero':
        return `kᵢ = ${f.ki} is more than nᵢ = ${f.ni}, so C(${f.ni}, ${f.ki}) = 0 and the whole product is 0.`;
      case 'multiply':
        return `C(${f.ni}, ${f.ki}) ≡ ${f.term}, so result = ${f.before}·${f.term} mod ${f.p} = ${f.result}. Drop the digit from n and k.`;
      case 'done':
        return f.rows.length === 0
          ? `C(0, 0) mod ${f.p} = 1, with no digits to read.`
          : `C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p} = ${f.result}, from ${f.rows.length} base-${f.p} ${f.rows.length === 1 ? 'digit' : 'digits'}.`;
    }
  },

  pathTitle: 'The sequence as a path: ( climbs, ) falls',
  /** @param {string} prefix */
  pathAria: (prefix) => `The path of the bracket sequence ${prefix || 'with no brackets yet'}.`,
  baseline: 'baseline',
  emptyPrefix: 'empty',
  treeTitle: 'The last sequence as a binary tree, from (left)right',
  treeAria: 'The binary tree of the sequence last output.',
  treeEmpty: 'Finish a sequence to see its tree.',
  treeNone: 'With no pairs, the tree has no nodes.',
  foundTitle: 'Sequences output',
  foundEmpty: 'none yet',
  catalanTitle: 'Catalan numbers C₀, C₁, C₂, …',
  bracketStats: {
    found: 'Sequences found',
    calls: 'Calls to generate',
    all: 'All arrangements: C(2n, n)',
    bad: 'Dip below: C(2n, n + 1)',
    catalan: 'Cₙ = the difference',
  },
  /** @param {BracketFrame} f */
  describeBrackets(f) {
    switch (f.kind) {
      case 'start':
        return f.n === 0
          ? 'With no pairs, the empty sequence is the only balanced one.'
          : `List every balanced sequence of ${f.n} ${f.n === 1 ? 'pair' : 'pairs'}. A ) is only allowed while some ( is still unmatched, so the path never goes below the baseline.`;
      case 'open':
        return `open = ${f.open - 1} < ${f.n}, so add (. The prefix is now ${f.prefix}.`;
      case 'close':
        return f.dropped > 0
          ? `Back up ${f.dropped} ${f.dropped === 1 ? 'character' : 'characters'}, then take the other branch: add ). The prefix is now ${f.prefix}.`
          : `All ${f.n} ( are used and close = ${f.close - 1} < ${f.open}, so add ). The prefix is now ${f.prefix}.`;
      case 'emit':
        return `All ${2 * f.n} brackets are placed: output ${f.prefix || 'the empty sequence'}. That makes ${f.found.length}.`;
      case 'done':
        return `Done: ${f.found.length} ${f.found.length === 1 ? 'sequence' : 'sequences'}, which is exactly Cₙ from the formula.`;
    }
  },

  takeaways: [
    'C(n, k) = C(n − 1, k − 1) + C(n − 1, k): item n is either taken or left out. That one rule fills the whole triangle, and it also works mod any number, prime or not.',
    'For one value with n < p, use C(n, k) = n!·(k!)⁻¹·((n − k)!)⁻¹ mod p, with the inverses from Fermat’s little theorem. Division has no direct meaning mod p, so inverses replace it.',
    'When n ≥ p, n! contains the factor p and the formula breaks. Lucas’s theorem saves it: write n and k in base p, and C(n, k) ≡ ∏ C(nᵢ, kᵢ) (mod p).',
    'Cₙ = C(2n, n) − C(2n, n + 1) = C(2n, n)/(n + 1). There are C(2n, n) arrangements, and reflecting the bad part of a path that dips below the baseline matches the bad ones with C(2n, n + 1).',
    'Try “Rows 0 to 15, mod 2” and step to the end: the unmarked cells, the odd ones, draw Sierpiński’s triangle. Then try n = 3 in the Catalan view and see the same 5 as binary trees.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Pascal’s triangle',
      'O(n²) time, O(n²) memory',
      'One addition per cell. Keeping only the last row cuts memory to O(n), and any modulus works.',
    ],
    [
      'Factorial tables',
      'O(n) to build, O(1) per query',
      'Two arrays up to n, with one Fermat power for the largest inverse. It needs a prime p > n.',
    ],
    [
      'Lucas’s theorem',
      'O(p) to build, O(log_p n) per query',
      'Tables below p, then one O(1) lookup per base-p digit. It needs p to be prime, and p small enough to build.',
    ],
    [
      'Listing balanced brackets',
      'O(n·Cₙ) time, O(n) stack',
      'Each of the Cₙ outputs takes 2n characters, and the rules never lead to a dead end.',
    ],
    [
      'Cₙ alone',
      'O(n)',
      'One binomial, or O(n²) from the recurrence Cₙ₊₁ = Σ Cᵢ·Cₙ₋ᵢ, which needs no division.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Using the triangle, how many ways are there to pick 3 lessons out of 7?',
      answer: 35,
      unit: 'ways',
      hints: ['Set the last row to 7 and read row 7, column 3 at the last step.'],
      solution: 'C(7, 3) = C(6, 2) + C(6, 3) = 15 + 20 = 35.',
    },
    {
      type: 'number',
      prompt: 'Load “C(1000, 300) mod 13” and step to the end. What is the result?',
      answer: 10,
      hints: [
        '1000 has base-13 digits 5, 11, 12 and 300 has digits 1, 10, 1, from the highest down.',
        'Multiply C(5, 1), C(11, 10) and C(12, 1), reducing mod 13.',
      ],
      solution:
        'C(5, 1)·C(11, 10)·C(12, 1) = 5·11·12 = 660, and 660 = 50·13 + 10, so the answer is 10.',
    },
    {
      type: 'choice',
      prompt: 'Without computing it, is C(12, 4) odd or even? Use Lucas’s theorem with p = 2.',
      options: ['Odd', 'Even'],
      answer: 0,
      hints: ['12 is 1100 in binary and 4 is 0100. Is any bit of k larger than the same bit of n?'],
      solution:
        'No bit of 4 exceeds the bit of 12 above it, so every factor is 1 and the result is 1 mod 2: odd. Indeed C(12, 4) = 495.',
    },
    {
      type: 'number',
      prompt: 'Find C₄ as C(8, 4) − C(8, 5).',
      answer: 14,
      hints: ['Read the two values from row 8 of the triangle.'],
      solution:
        'C(8, 4) = 70 and C(8, 5) = 56, so C₄ = 70 − 56 = 14. The Catalan view with n = 4 lists all 14.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are counted by C₃ = 5?',
      options: [
        'Balanced sequences of 3 bracket pairs',
        'Binary trees with 3 nodes',
        'Ways to cut a convex pentagon into triangles',
        'Subsets of a set of 5 items',
      ],
      answers: [0, 1, 2],
      hints: ['Set n = 3 in the Catalan view and count. How many subsets does 5 items have?'],
      solution:
        'Balanced brackets, binary trees with n nodes and triangulations of an (n + 2)-sided polygon are all counted by Cₙ. A set of 5 items has 2⁵ = 32 subsets.',
    },
  ],
  nextTeaser:
    'Next up: Public-key cryptography and RSA, where fast powers and modular inverses let strangers exchange secrets in public.',
};
