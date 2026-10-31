/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').MulFrame} MulFrame */
/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').CallNode} CallNode */
/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').StrassenFrame} StrassenFrame */
/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').SplitMethod} SplitMethod */

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇'];

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/** A signed number in a sum: "+ 3" or "− 3". @param {number} v */
const signed = (v) => (v < 0 ? `− ${-v}` : `+ ${v}`);

/** A factor in a product, bracketed when negative. @param {number} v */
const factor = (v) => (v < 0 ? `(−${-v})` : String(v));

/** @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

const TAGS = /** @type {Record<CallNode['tag'], string>} */ ({
  root: '×',
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  z2: 'z₂',
  z1: 'z₁',
  z0: 'z₀',
});

const FORMULAS = [
  '(A₁₁ + A₂₂)(B₁₁ + B₂₂)',
  '(A₂₁ + A₂₂)·B₁₁',
  'A₁₁·(B₁₂ − B₂₂)',
  'A₂₂·(B₂₁ − B₁₁)',
  '(A₁₁ + A₁₂)·B₂₂',
  '(A₂₁ − A₁₁)(B₁₁ + B₁₂)',
  '(A₁₂ − A₂₂)(B₂₁ + B₂₂)',
];

/** Which M's each entry of C adds, with their signs, row-major. */
const ENTRY_TERMS = /** @type {[number, number][][]} */ ([
  [
    [0, 1],
    [3, 1],
    [4, -1],
    [6, 1],
  ],
  [
    [2, 1],
    [4, 1],
  ],
  [
    [1, 1],
    [3, 1],
  ],
  [
    [0, 1],
    [1, -1],
    [2, 1],
    [5, 1],
  ],
]);
const ENTRY_NAMES = ['C₁₁', 'C₁₂', 'C₂₁', 'C₂₂'];

/** @param {number[]} M @param {number} t */
function entryText(M, t) {
  const terms = ENTRY_TERMS[t];
  const names = terms
    .map(([i, s], at) => `${at === 0 ? '' : s < 0 ? ' − ' : ' + '}M${SUB[i + 1]}`)
    .join('');
  const values = terms
    .map(([i, s], at) => {
      const v = s * M[i];
      return at === 0 ? num(v) : ` ${signed(v)}`;
    })
    .join('');
  return { names, values };
}

/** Whether a sum of two halves grew a digit past both halves. @param {number} a @param {number} b */
const carries = (a, b) => String(a + b).length > Math.max(String(a).length, String(b).length);

/** @param {(number | null)[][]} C */
const matrixText = (C) => `[${C.map((r) => r.map((v) => num(v ?? 0)).join(' ')).join('; ')}]`;

export const en = {
  slug: 'karatsuba-strassen',
  topic: 'divide-and-conquer',
  level: 'Advanced',
  title: 'Karatsuba and Strassen',
  intro:
    'Splitting two n-digit numbers in half gives four half-size products, and four products of half the size cost as much as the schoolbook method: Θ(n²). Karatsuba saw that three products are enough, which brings the cost down to Θ(n^1.585). Strassen found the same trick for matrices: seven block products instead of eight.',
  summary:
    'Build the recursion tree of a multiplication with four products per split, then with Karatsuba’s three, count the one-digit multiplications, and step through Strassen’s seven matrix products.',
  instruction:
    'Pick Numbers or Matrices. For numbers, type two factors and switch between four and three products: the tree shows every recursive call, and you can select a call to see how it splits. For matrices, type A and B and step through M₁ to M₇.',
  modeLabel: 'Multiply',
  modes: { numbers: 'Numbers', matrices: '2×2 matrices' },
  methodLabel: 'Products per split',
  methods: { four: 'Four (plain split)', three: 'Three (Karatsuba)' },
  xLabel: 'x',
  yLabel: 'y',
  exampleLabel: 'Example',
  examplePlaceholder: 'Load an example…',
  examples: {
    clean: '1213 × 3141 (no carries)',
    classic: '1234 × 5678',
    two: '12 × 34',
    big: '999999 × 999999',
  },
  factorErrors: {
    format: 'Type a whole number with digits only. The last valid factor is back.',
    size: 'Use at most 6 digits per factor. The last valid factor is back.',
  },
  aLabel: 'A (row by row)',
  bLabel: 'B (row by row)',
  matrixErrors: {
    format:
      'Type four whole numbers, row by row, such as “1 2; 3 4”. The last valid matrix is back.',
    range: 'Keep every entry between −9 and 9. The last valid matrix is back.',
  },
  methodNotice: {
    four: 'Now using four products per split.',
    three: 'Now using Karatsuba’s three products per split.',
  },
  treeLabel: 'Recursion tree of the multiplication; each call shows its two factors underneath',
  emptyTree: 'No calls yet.',
  /** @param {CallNode['tag']} tag */
  tag: (tag) => TAGS[tag],
  /** @param {CallNode} n */
  noteOf: (n) => `${n.x}·${n.y}`,
  /** @param {CallNode} n @param {string} state */
  nodeLabel: (n, state) =>
    `${n.tag === 'root' ? 'Root' : TAGS[n.tag]}: ${n.x} × ${n.y}${n.result === null ? '' : ` = ${n.result}`}${state ? `, ${state}` : ''}`,
  states: /** @type {Record<string, string>} */ ({
    active: 'current call',
    frontier: 'waiting',
    visited: 'combined',
    sorted: 'one-digit product',
  }),
  markers: /** @type {Record<string, string>} */ ({
    active: '▶',
    frontier: '…',
    visited: '+',
    sorted: '✓',
  }),
  legend: {
    active: 'Current call',
    frontier: 'Waiting',
    visited: 'Combined from its parts',
    sorted: 'One-digit product',
  },
  strassenLegend: {
    active: 'Being computed now',
    visited: 'Product computed',
    sorted: 'Entry of C computed',
  },
  selectedTitle: 'Selected call',
  selectHint:
    'Pick a call (click, or Tab to the tree, use the arrow keys and Enter) to see its split.',
  /** @param {CallNode} n */
  selectedLines(n) {
    const lines = [`${n.x} × ${n.y}${n.result === null ? ' = ?' : ` = ${n.result}`}`];
    if (n.parts) {
      const { x1, x0, y1, y0 } = n.parts;
      lines.push(`m = ${n.m}: x = ${x1}·10^${n.m} + ${x0}, y = ${y1}·10^${n.m} + ${y0}`);
    } else if (n.result !== null) {
      lines.push('Two one-digit factors: one digit multiplication.');
    }
    return lines;
  },
  stats: {
    products: 'One-digit multiplications',
    calls: 'Calls',
    adds: 'Additions and subtractions',
    multiplications: 'Multiplications',
    additions: 'Additions and subtractions',
  },
  compareTitle: 'One-digit multiplications for these factors',
  growthTitle: 'Two n-digit factors, n a power of two, no carries',
  growthHead: ['n digits', 'Four products: n²', 'Three: n^1.585'],
  mTitle: 'Products M₁ to M₇',
  /** @param {number} i */
  mName: (i) => `M${SUB[i + 1]}`,
  matrixA: 'Matrix A',
  matrixB: 'Matrix B',
  matrixC: 'C = A·B',
  definitionTitle: 'The definition, for comparison',
  definitionLine:
    '8 multiplications and 4 additions: each entry of C is a row of A times a column of B.',
  /** @param {string} name @param {(number | string | null)[][]} values */
  matrixAria: (name, values) =>
    `${name}: ${values.map((r) => r.map((v) => (v === null ? 'not computed' : v)).join(', ')).join('; ')}`,
  practiceTitle: 'Check yourself',
  /** @param {MulFrame} f @param {SplitMethod} method */
  describe(f, method) {
    const root = f.nodes[0];
    const node = f.current >= 0 ? f.nodes[f.current] : root;
    switch (f.kind) {
      case 'start':
        return method === 'four'
          ? `Multiply ${root.x} × ${root.y}. Split both factors in half and multiply the four pairs of halves. The recursion stops at two one-digit factors.`
          : `Multiply ${root.x} × ${root.y} the Karatsuba way: split both factors in half, but get the middle term from one product. The recursion stops at two one-digit factors.`;
      case 'split': {
        const p = /** @type {NonNullable<CallNode['parts']>} */ (node.parts);
        const head = `${node.x} × ${node.y}: split at m = ${node.m}, so ${node.x} = ${p.x1}·10^${node.m} + ${p.x0} and ${node.y} = ${p.y1}·10^${node.m} + ${p.y0}.`;
        if (method === 'four')
          return `${head} Four products: ${p.x1}·${p.y1}, ${p.x1}·${p.y0}, ${p.x0}·${p.y1} and ${p.x0}·${p.y0}.`;
        const carry =
          carries(p.x1, p.x0) || carries(p.y1, p.y0)
            ? ' A sum carried into an extra digit, so the middle product is a little longer.'
            : '';
        return `${head} Three products: z₂ = ${p.x1}·${p.y1}, z₀ = ${p.x0}·${p.y0}, and (${p.x1} + ${p.x0})·(${p.y1} + ${p.y0}) = ${p.x1 + p.x0}·${p.y1 + p.y0} for the middle term.${carry}`;
      }
      case 'base':
        return `${node.x} × ${node.y} = ${node.result}: one digit multiplication, ${f.products} so far.`;
      case 'combine': {
        const r = node.children.map((id) => /** @type {number} */ (f.nodes[id].result));
        const mm = node.m;
        if (method === 'four') {
          const [a, b, c, d] = r;
          return `${node.x} × ${node.y} = a·10^${2 * mm} + (b + c)·10^${mm} + d = ${a}·10^${2 * mm} + ${b + c}·10^${mm} + ${d} = ${node.result}.`;
        }
        const [z2, mid, z0] = r;
        const z1 = mid - z2 - z0;
        return `z₁ = ${mid} − ${z2} − ${z0} = ${z1}, so ${node.x} × ${node.y} = ${z2}·10^${2 * mm} + ${z1}·10^${mm} + ${z0} = ${node.result}.`;
      }
      case 'done':
        return `${root.x} × ${root.y} = ${root.result}, using ${plural(f.products, 'one-digit multiplication')} in ${plural(f.calls, 'call')}.`;
    }
  },
  /** @param {StrassenFrame} f */
  describeStrassen(f) {
    switch (f.kind) {
      case 'start':
        return 'Multiply two 2×2 matrices. The definition needs 8 products, 2 per entry of C. Strassen needs only 7, paid for with extra additions.';
      case 'product': {
        const [p, q] = /** @type {[number, number]} */ (f.factors);
        return `M${SUB[f.current + 1]} = ${FORMULAS[f.current]} = ${factor(p)} × ${factor(q)} = ${num(/** @type {number} */ (f.M[f.current]))}. ${plural(f.multiplications, 'multiplication')} so far.`;
      }
      case 'entry': {
        const { names, values } = entryText(/** @type {number[]} */ (f.M), f.current);
        const value = /** @type {number} */ (f.C[Math.floor(f.current / 2)][f.current % 2]);
        return `${ENTRY_NAMES[f.current]} = ${names} = ${values} = ${num(value)}. No multiplication, only additions.`;
      }
      case 'done':
        return `C = ${matrixText(f.C)}, with 7 multiplications and 18 additions. On n×n matrices cut into four n/2 blocks, saving one block product gives T(n) = 7T(n/2) + Θ(n²) = Θ(n^(log₂ 7)) ≈ Θ(n^2.81), against Θ(n³).`;
    }
  },
  takeaways: [
    'Split x = x₁·10^m + x₀ and y = y₁·10^m + y₀. Then x·y = x₁y₁·10^(2m) + (x₁y₀ + x₀y₁)·10^m + x₀y₀: four half-size products, so T(n) = 4T(n/2) + O(n) = Θ(n²), no better than the schoolbook method.',
    'Karatsuba: (x₁ + x₀)(y₁ + y₀) − x₁y₁ − x₀y₀ = x₁y₀ + x₀y₁, so three products are enough. T(n) = 3T(n/2) + O(n) = Θ(n^(log₂ 3)) ≈ Θ(n^1.585). A multiplication is traded for a few O(n) additions.',
    'Strassen does the same for matrices: 2×2 blocks need 8 block products by the definition, and Strassen’s formulas need 7. T(n) = 7T(n/2) + Θ(n²) = Θ(n^(log₂ 7)) ≈ Θ(n^2.81) instead of Θ(n³).',
    'The saving pays only on large inputs: sums can carry into an extra digit and the extra additions cost time, so real libraries switch to the schoolbook method below a size threshold.',
    'Try 1213 × 3141 with four and then three products: 16 against 9 one-digit multiplications. Then load 1234 × 5678, where carries push Karatsuba to 17, and 999999 × 999999, where it wins 43 to 52.',
  ],
  complexityHead: ['Method', 'Time', 'Why'],
  complexity: [
    ['Numbers, four products', 'Θ(n²)', 'T(n) = 4T(n/2) + O(n), and log₂ 4 = 2.'],
    ['Karatsuba, three products', 'Θ(n^1.585)', 'T(n) = 3T(n/2) + O(n), and log₂ 3 ≈ 1.585.'],
    ['Matrices, eight block products', 'Θ(n³)', 'T(n) = 8T(n/2) + Θ(n²), and log₂ 8 = 3.'],
    ['Strassen, seven block products', 'Θ(n^2.81)', 'T(n) = 7T(n/2) + Θ(n²), and log₂ 7 ≈ 2.807.'],
    ['Extra memory', 'O(n) / O(n²)', 'Partial sums and products at each level of the recursion.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Two 8-digit numbers are multiplied by splitting in half with four products per split, down to one-digit factors. How many one-digit multiplications are made?',
      answer: 64,
      unit: 'multiplications',
      hints: [
        'Each split turns one product into four of half the size.',
        '8 → 4 → 2 → 1 digits is three levels.',
      ],
      solution:
        'Three levels of 4-way splitting give 4³ = 64 = 8² one-digit products, exactly as many as the schoolbook method.',
    },
    {
      type: 'number',
      prompt:
        'The same two 8-digit numbers with Karatsuba, assuming no sum ever carries: how many one-digit multiplications?',
      answer: 27,
      unit: 'multiplications',
      hints: ['Each split now makes three products of half the size.', 'Three levels again.'],
      solution:
        '3³ = 27 = 8^(log₂ 3). Load 1213 × 3141 on the widget to see the 4-digit case: 3² = 9.',
    },
    {
      type: 'choice',
      prompt: 'What does (x₁ + x₀)(y₁ + y₀) − x₁y₁ − x₀y₀ equal?',
      options: ['x₁y₁ + x₀y₀', 'x₁y₀ + x₀y₁', 'x₁x₀ + y₁y₀', '2·x₁y₀'],
      answer: 1,
      hints: [
        'Expand (x₁ + x₀)(y₁ + y₀) into four terms.',
        'Two of the four terms are subtracted again.',
      ],
      solution:
        '(x₁ + x₀)(y₁ + y₀) = x₁y₁ + x₁y₀ + x₀y₁ + x₀y₀. Taking away x₁y₁ and x₀y₀ leaves x₁y₀ + x₀y₁, the middle term, from a single product.',
    },
    {
      type: 'text',
      prompt: 'Solve Karatsuba’s recurrence T(n) = 3T(n/2) + n. Give T(n) as Θ(…).',
      accept: [
        'Θ(n^(log₂ 3))',
        'Θ(n^(log2 3))',
        'Θ(n^1.585)',
        'Θ(n^1.58)',
        'Θ(n^1.59)',
        'n^1.585',
        'n^(log2 3)',
        'O(n^1.585)',
        'O(n^(log2 3))',
      ],
      hints: [
        'c = log₂ 3 ≈ 1.585 is bigger than 1, the exponent of f(n) = n.',
        'Master theorem case 1: the leaves dominate.',
      ],
      solution: 'a = 3, b = 2, c = log₂ 3 ≈ 1.585 > 1, so case 1 gives Θ(n^(log₂ 3)) ≈ Θ(n^1.585).',
    },
    {
      type: 'number',
      prompt:
        'Strassen’s method on 4×4 matrices recurses on 2×2 blocks, then on single numbers. How many multiplications of single numbers does it make?',
      answer: 49,
      unit: 'multiplications',
      hints: ['Each level makes 7 products of half the size.', 'Two levels: 4 → 2 → 1.'],
      solution: '7 · 7 = 49 multiplications, against 8 · 8 = 64 = 4³ for the definition.',
    },
  ],
  nextTeaser:
    'Next up: Closest pair of points, which splits the points by x and checks only a narrow strip around the dividing line.',
};
