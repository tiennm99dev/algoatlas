/** @typedef {import('$lib/algo-engine/analysing-loops-recursion.js').RecursionFrame} RecursionFrame */
/** @typedef {import('$lib/algo-engine/analysing-loops-recursion.js').Recurrence} Recurrence */

const SUB = /** @type {Record<string, string>} */ ({ 2: '₂', 3: '₃', 4: '₄' });

/** The work term n^d as text. @param {number} d */
const work = (d) => (d === 0 ? '1' : d === 1 ? 'n' : 'n²');

/** @param {Recurrence} r */
function recText(r) {
  return `${r.a === 1 ? '' : r.a}T(n/${r.b}) + ${work(r.d)}`;
}

/** The Θ class the recursion tree gives. @param {Recurrence} r */
function thetaText(r) {
  const bd = r.b ** r.d;
  if (r.a < bd) return `Θ(${work(r.d)})`;
  if (r.a === bd) return r.d === 0 ? 'Θ(log n)' : `Θ(${work(r.d)} log n)`;
  const e = Math.log(r.a) / Math.log(r.b);
  const whole = Math.round(e);
  if (Math.abs(e - whole) < 1e-9) return `Θ(${whole === 1 ? 'n' : 'n²'})`;
  return `Θ(n^(log${SUB[r.b]} ${r.a})) ≈ Θ(n^${e.toFixed(2)})`;
}

export const en = {
  slug: 'analysing-loops-recursion',
  topic: 'complexity',
  level: 'Intermediate',
  title: 'Analysing loops and recursion',
  intro:
    'A loop’s cost is a sum: add up what each pass does. A recursive algorithm’s cost is a recurrence such as T(n) = 2T(n/2) + n, and a recursion tree turns that recurrence back into a sum, one level at a time.',
  summary:
    'Build the recursion tree of T(n) = a·T(n/b) + n^d level by level, sum the cost of each level, and see which levels dominate.',
  instruction:
    'Pick a recurrence or set a, b, d and the depth k (n = bᵏ), then step: each level is summed, then split into smaller calls. Compare the level costs in the table on the right.',
  fields: { a: 'a (calls)', b: 'b (divisor)', d: 'd (work n^d)', k: 'Depth k' },
  presetLabel: 'Recurrence',
  presetPlaceholder: 'Load a recurrence…',
  presets: {
    binary: 'Binary search: T(n/2) + 1',
    halving: 'Halving scan: T(n/2) + n',
    traversal: 'Tree walk: 2T(n/2) + 1',
    merge: 'Merge sort: 2T(n/2) + n',
    karatsuba: 'Karatsuba: 3T(n/2) + n',
    quad: 'Four halves: 4T(n/2) + n',
  },
  /** @param {number} max */
  fieldError: (max) =>
    `Use whole numbers with 1 ≤ a ≤ 4, 2 ≤ b ≤ 4, 0 ≤ d ≤ 2 and 1 ≤ k ≤ 6, and keep the tree at ${max} nodes or fewer.`,
  recText,
  thetaText,
  /** @param {Recurrence} r */
  nLine: (r) => `n = ${r.b}^${r.k} = ${r.b ** r.k}`,
  treeLabel: 'Recursion tree; each node shows its subproblem size',
  emptyTree: 'No tree yet.',
  /** @param {import('$lib/components/tree-layout.js').TreeNode} node @param {number} depth */
  nodeLabel: (node, depth) =>
    `Call of size ${node.label} at level ${depth}${node.state ? `, ${en.states[node.state] ?? node.state}` : ''}`,
  states: /** @type {Record<string, string>} */ ({
    active: 'being summed',
    frontier: 'new subproblem',
    visited: 'summed',
    sorted: 'leaf, summed',
  }),
  legend: {
    active: 'Level being summed',
    frontier: 'New subproblems',
    visited: 'Summed',
    sorted: 'Leaves, summed',
  },
  selectedTitle: 'Selected call',
  selectHint:
    'Pick a node (click, or Tab to the tree and use the arrow keys, then Enter) to see what its whole subtree costs.',
  /** @param {Recurrence} r @param {number} size @param {number} level @param {number} cost */
  selectedLine: (r, size, level, cost) =>
    size === 1
      ? `A leaf at level ${level}: T(1) = 1.`
      : `T(${size}) at level ${level} = ${r.a === 1 ? '' : `${r.a} × `}T(${size / r.b}) + ${size ** r.d} = ${cost.toLocaleString('en-US')}: its own ${size ** r.d} work plus everything below it.`,
  levelsTitle: 'Cost per level',
  levelHead: ['Level', 'Calls × cost', 'Level cost'],
  /** @param {number} nodes @param {number} nodeCost */
  levelCell: (nodes, nodeCost) =>
    `${nodes.toLocaleString('en-US')} × ${nodeCost.toLocaleString('en-US')}`,
  totalRow: 'Total',
  stats: { n: 'n', levels: 'Levels summed', total: 'Running total', calls: 'Calls drawn' },
  practiceTitle: 'Check yourself',
  /** @param {RecursionFrame} f */
  describe(f) {
    const r = f.rec;
    const row = f.levels[f.levels.length - 1];
    switch (f.kind) {
      case 'start':
        return `T(n) = ${recText(r)} with n = ${f.n}. Level 0 is the single call of size ${f.n}.`;
      case 'level':
        return `Level ${row.depth}: ${row.nodes} call${row.nodes === 1 ? '' : 's'} of size ${row.size}, each doing ${row.nodeCost} work, so the level costs ${row.cost}. Running total ${f.total}.`;
      case 'expand': {
        const size = f.n / r.b ** f.current;
        return `Split every call into ${r.a} call${r.a === 1 ? '' : 's'} of size ${size}: level ${f.current} has ${r.a ** f.current}.`;
      }
      case 'leaves':
        return `Level ${row.depth}: ${row.nodes} leaves of size 1 cost 1 each, so ${row.cost}. Running total ${f.total}.`;
      case 'done': {
        const bd = r.b ** r.d;
        const lead = `T(${f.n}) = ${f.total}, so T(n) = ${thetaText(r)}.`;
        if (f.treeCase === 'root')
          return `${lead} a = ${r.a} < b^d = ${bd}: level costs shrink geometrically, so the root’s ${work(r.d)} dominates.`;
        if (f.treeCase === 'equal')
          return `${lead} a = b^d = ${bd}: every level costs the same, times log${SUB[r.b]} n + 1 levels.`;
        return `${lead} a = ${r.a} > b^d = ${bd}: level costs grow, so the aᵏ = ${r.a ** r.k} leaves dominate.`;
      }
    }
  },
  takeaways: [
    'Count a loop by summing its passes. Two nested loops over 0..n−1 run n·n times; when the inner loop starts at i + 1 the body runs (n−1) + (n−2) + … + 0 = n(n−1)/2 times, still Θ(n²).',
    'A loop that halves i each pass runs about log₂ n times, so a loop inside it that runs n times gives Θ(n log n).',
    'A divide-and-conquer algorithm has a recurrence T(n) = a·T(n/b) + n^d: a calls on pieces of size n/b, plus n^d work to split and combine.',
    'In the recursion tree, level i has aⁱ calls of size n/bⁱ. If a < b^d the root dominates, Θ(n^d); if a = b^d every level is equal, Θ(n^d log n); if a > b^d the leaves dominate, Θ(n^(log_b a)).',
    'Try Merge sort, then Four halves: the level costs go from flat (16, 16, 16…) to doubling each level, and the total jumps from n log n to n².',
  ],
  complexityHead: ['Pattern', 'Cost', 'Why'],
  complexity: [
    ['Two nested loops to n', 'Θ(n²)', 'n passes of an n-step inner loop.'],
    ['Inner loop j > i', 'Θ(n²)', 'n(n−1)/2 passes: half of n², still quadratic.'],
    ['Halving loop', 'Θ(log n)', 'i halves each pass, so about log₂ n passes.'],
    ['T(n) = 2T(n/2) + n', 'Θ(n log n)', 'log₂ n + 1 levels, each costing n.'],
    ['T(n) = T(n/2) + 1', 'Θ(log n)', 'One call per level, log₂ n + 1 levels.'],
    [
      'Recursion depth',
      'O(log_b n) stack',
      'Each level of the tree is one more frame on the call stack.',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'For n = 10, how many times does count++ run in “for i = 0 to n − 1: for j = i + 1 to n − 1: count++” (the j loop sits inside the i loop)?',
      answer: 45,
      unit: 'times',
      hints: [
        'For i = 0 the inner loop runs 9 times, for i = 1 it runs 8 times, and so on.',
        '9 + 8 + … + 1 + 0 = n(n − 1)/2.',
      ],
      solution:
        'The inner loop runs n − 1 − i times, so the total is 9 + 8 + … + 0 = 10 × 9 / 2 = 45.',
    },
    {
      type: 'number',
      prompt: 'For n = 64, how many times does the body of “i = n; while i > 1: i = i / 2” run?',
      answer: 6,
      unit: 'times',
      hints: ['Follow i: 64, 32, 16, …', 'Count how many halvings it takes to reach 1.'],
      solution: 'i goes 64 → 32 → 16 → 8 → 4 → 2 → 1: six halvings, which is log₂ 64 = 6.',
    },
    {
      type: 'number',
      prompt:
        'Load Merge sort (T(n) = 2T(n/2) + n, T(1) = 1) with depth 4, so n = 16. What is T(16)?',
      answer: 80,
      hints: [
        'Every level of the tree costs the same. How much, and how many levels are there?',
        'Levels 0 to 3 each cost 16, and the 16 leaves cost 1 each.',
      ],
      solution:
        'Five levels each cost 16 (four internal levels plus 16 leaves), so T(16) = 5 × 16 = 80 = n log₂ n + n.',
    },
    {
      type: 'choice',
      prompt: 'For T(n) = 3T(n/2) + n, which part of the recursion tree dominates the total?',
      options: [
        'The root, so T(n) = Θ(n)',
        'All levels equally, so T(n) = Θ(n log n)',
        'The leaves, so T(n) = Θ(n^(log₂ 3)) ≈ Θ(n^1.58)',
      ],
      answer: 2,
      hints: [
        'Compare a = 3 with b^d = 2¹ = 2.',
        'Level i costs 3ⁱ × n/2ⁱ = n × 1.5ⁱ: does that grow or shrink with i?',
      ],
      solution:
        'Level costs grow by a factor 1.5 per level, so the 3ᵏ = n^(log₂ 3) leaves dominate: Θ(n^1.58). This is Karatsuba multiplication.',
    },
    {
      type: 'text',
      prompt: 'Give the Θ class of T(n) = 4T(n/2) + n.',
      accept: ['Θ(n²)', 'Theta(n²)', 'n²'],
      hints: ['Compare a = 4 with b^d = 2. The leaves are 4ᵏ = (2ᵏ)² = n².'],
      solution:
        'a = 4 > b^d = 2, so the leaves dominate: there are 4^(log₂ n) = n² of them, so T(n) = Θ(n²).',
    },
  ],
  nextTeaser:
    'Next up: best, worst and average case, where the same algorithm costs different amounts on different inputs.',
};
