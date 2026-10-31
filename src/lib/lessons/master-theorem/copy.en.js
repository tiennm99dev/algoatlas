/** @typedef {import('$lib/algo-engine/master-theorem.js').MasterFrame} MasterFrame */
/** @typedef {import('$lib/algo-engine/master-theorem.js').Recurrence} Recurrence */
/** @typedef {import('$lib/algo-engine/master-theorem.js').MasterCase} MasterCase */

const SUB = /** @type {Record<number, string>} */ ({ 2: '₂', 3: '₃', 4: '₄' });

/** n raised to a whole or half exponent. @param {number} e */
function powText(e) {
  if (e === 0) return '1';
  if (e === 0.5) return '√n';
  if (e === 1) return 'n';
  if (e === 2) return 'n²';
  if (e === 3) return 'n³';
  return `n^${e}`;
}

/** (log n)^p for p ≥ 1. @param {number} p */
const logText = (p) => (p === 1 ? 'log n' : `log${p === 2 ? '²' : p === 3 ? '³' : `^${p}`} n`);

/** n^e · (log n)^p as one term, p ≥ 0. @param {number} e @param {number} p */
function termText(e, p) {
  if (p === 0) return powText(e);
  return e === 0 ? logText(p) : `${powText(e)} ${logText(p)}`;
}

/** The work term f(n). @param {Recurrence} r */
function fText(r) {
  if (r.p < 0) return `${powText(r.d)} / log n`;
  return termText(r.d, r.p);
}

/** @param {Recurrence} r */
const recText = (r) => `${r.a === 1 ? '' : r.a}T(n/${r.b}) + ${fText(r)}`;

/** A number as a short readable string. @param {number} x */
function fmt(x) {
  if (Math.abs(x) >= 1e6) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumSignificantDigits: 3,
    }).format(x);
  }
  return x.toLocaleString('en-US', { maximumFractionDigits: Math.abs(x) < 10 ? 2 : 1 });
}

/** The exponent c = log_b a, exact when it is a whole or half number. @param {Recurrence} r */
function cExact(r) {
  const c = Math.log(r.a) / Math.log(r.b);
  const half = Math.round(2 * c) / 2;
  return Math.abs(c - half) < 1e-9 ? half : null;
}

/** c as text: "1", "0.5", or "log₂ 3 ≈ 1.58". @param {Recurrence} r */
function cText(r) {
  const exact = cExact(r);
  if (exact !== null) return String(exact);
  return `log${SUB[r.b]} ${r.a} ≈ ${(Math.log(r.a) / Math.log(r.b)).toFixed(2)}`;
}

/** n^c as text. @param {Recurrence} r */
function leavesText(r) {
  const exact = cExact(r);
  if (exact !== null) return powText(exact);
  return `n^(log${SUB[r.b]} ${r.a})`;
}

/** The Θ answer for a verdict, or null when no case applies. @param {Recurrence} r @param {MasterCase} v */
function thetaText(r, v) {
  if (v === 1) {
    const exact = cExact(r);
    const approx = (Math.log(r.a) / Math.log(r.b)).toFixed(2);
    return exact !== null ? `Θ(${powText(exact)})` : `Θ(${leavesText(r)}) ≈ Θ(n^${approx})`;
  }
  if (v === 2) return `Θ(${termText(r.d, r.p + 1)})`;
  if (v === 3) return `Θ(${fText(r)})`;
  return null;
}

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x.toLocaleString('en-US')} ${word}${x === 1 ? '' : 's'}`;

export const en = {
  slug: 'master-theorem',
  topic: 'divide-and-conquer',
  level: 'Intermediate',
  title: 'Divide and conquer and the master theorem',
  intro:
    'A divide-and-conquer algorithm splits a problem into a smaller copies, solves each recursively, and combines the answers. Its running time is a recurrence T(n) = a·T(n/b) + f(n), and the master theorem reads the answer off by comparing f(n) with n^(log_b a), the number of leaves in the recursion tree.',
  summary:
    'Type a recurrence T(n) = a·T(n/b) + f(n), sum its recursion tree level by level, and see which of the master theorem’s three cases applies and which levels dominate.',
  instruction:
    'Load an algorithm’s recurrence or set a, b and the work f(n) = n^d · (log n)^p, then step: each level of the tree is summed, then d is compared with c = log_b a. At the verdict the tree and the level bars recolour to show the dominant levels.',
  fields: {
    a: 'a (subproblems)',
    b: 'b (divisor)',
    d: 'd (power of n)',
    p: 'p (power of log n)',
    k: 'Depth k',
  },
  /** @param {number} d */
  dOption: (d) => `${d} → ${powText(d)}`,
  /** @param {number} p */
  pOption: (p) => (p === 0 ? '0 → none' : p < 0 ? '−1 → ÷ log n' : `${p} → ${logText(p)}`),
  presetLabel: 'Algorithm',
  presetPlaceholder: 'Load a recurrence…',
  presets: {
    binary: 'Binary search: T(n/2) + 1',
    merge: 'Merge sort: 2T(n/2) + n',
    karatsuba: 'Karatsuba: 3T(n/2) + n',
    strassen: 'Strassen: 7T(n/2) + n²',
    matrix: 'Block matrix product: 8T(n/2) + n²',
    closest: 'Closest pair, re-sorting: 2T(n/2) + n log n',
    root: 'Root-heavy: 2T(n/2) + n²',
    sqrt: 'Quarters: 2T(n/4) + √n',
    gap: 'Outside the cases: 2T(n/2) + n / log n',
  },
  /** @param {number} max */
  fieldError: (max) =>
    `Use whole numbers with 1 ≤ a ≤ 8, 2 ≤ b ≤ 4 and 1 ≤ k ≤ 6, and keep the drawn tree at ${max} calls or fewer. The last valid value is back.`,
  recText,
  fText,
  /** @param {Recurrence} r @param {number} n */
  recLine: (r, n) => `T(n) = ${recText(r)}, T(1) = 1; drawn for n = ${r.b}^${r.k} = ${n}`,
  treeLabel: 'Recursion tree: each call shows its size, with f(size) underneath',
  emptyTree: 'No tree yet.',
  /** @param {import('$lib/components/tree-layout.js').TreeNode} node @param {number} depth */
  nodeLabel: (node, depth) =>
    `Call of size ${node.label} at level ${depth}, cost ${node.note}${node.state ? `, ${en.states[node.state] ?? node.state}` : ''}`,
  states: /** @type {Record<string, string>} */ ({
    active: 'being summed',
    visited: 'summed',
    sorted: 'dominant',
  }),
  markers: /** @type {Record<string, string>} */ ({ active: '∑', visited: '✓', sorted: '★' }),
  legend: {
    active: 'Level being summed',
    visited: 'Summed',
    sorted: 'Dominant level (after the verdict)',
  },
  barsTitle: 'Cost per level',
  /** @param {number} depth @param {boolean} leaf */
  barLevel: (depth, leaf) => (leaf ? `Leaves (${depth})` : `Level ${depth}`),
  barsEmpty: 'Step to sum the first level.',
  totalRow: 'T(n), sum of all levels',
  fmt,
  stats: { n: 'n', c: 'c = log_b a', calls: 'Calls in the tree', total: 'Running total' },
  /** @param {MasterFrame} f */
  cStat: (f) => (f.c === null ? '?' : cText(f.rec)),
  verdictTitle: 'Verdict',
  verdictPending: 'Step to the end to compare f(n) with n^c.',
  /** @param {Recurrence} r @param {MasterCase} v */
  verdictLine(r, v) {
    const theta = thetaText(r, v);
    if (v === 'gap') return `No case applies: f(n) = ${fText(r)} misses n^c by only a log factor.`;
    return `Case ${v}: T(n) = ${theta}`;
  },
  thetaText,
  practiceTitle: 'Check yourself',
  /** @param {MasterFrame} f */
  describe(f) {
    const r = f.rec;
    const row = f.levels[f.levels.length - 1];
    switch (f.kind) {
      case 'start':
        return `T(n) = ${recText(r)}. Divide: ${plural(r.a, 'subproblem')} of size n/${r.b}. Conquer: solve each one recursively. Combine: f(n) = ${fText(r)} work outside the recursive calls. The tree is drawn for n = ${f.n}.`;
      case 'level':
        return `Level ${row.depth}: ${plural(row.calls, 'call')} of size ${row.size}, each doing f(${row.size}) = ${fmt(row.nodeCost)}, so the level costs ${fmt(row.cost)}. Running total ${fmt(f.total)}.`;
      case 'leaves':
        return `Level ${row.depth}: ${plural(row.calls, 'leaf')} of size 1 at cost 1 each. There are aᵏ = ${r.a}^${r.k} = ${row.calls} leaves, and aᵏ = n^(log_b a). T(${f.n}) = ${fmt(f.total)}.`;
      case 'exponent': {
        const exact = cExact(r);
        const value = exact !== null ? `= ${exact}` : `≈ ${/** @type {number} */ (f.c).toFixed(2)}`;
        return `The critical exponent is c = log${SUB[r.b]} ${r.a} ${value}: the aᵏ leaves alone cost n^c = ${leavesText(r)}.`;
      }
      case 'compare': {
        const sign = f.cmp === -1 ? '<' : f.cmp === 0 ? '=' : '>';
        const ratio = `Each level costs about a / b^d = ${fmt(f.ratio)} times the level above it.`;
        return `f(n) = ${fText(r)} grows like n^${r.d}${r.p === 0 ? '' : ' times a power of log n'}. Compare d = ${r.d} with c = ${cText(r)}: d ${sign} c. ${ratio}`;
      }
      case 'verdict': {
        const theta = thetaText(r, /** @type {MasterCase} */ (f.verdict));
        if (f.verdict === 1)
          return `Case 1: f(n) is polynomially smaller than n^c, so level costs grow toward the leaves and the leaves dominate. T(n) = ${theta}.`;
        if (f.verdict === 2)
          return r.p === 0
            ? `Case 2: f(n) matches n^c, so each of the log${SUB[r.b]} n + 1 levels costs the same. T(n) = ${theta}.`
            : `Case 2: f(n) matches n^c up to the factor ${logText(r.p)}, so the level costs shrink only by log factors and all log${SUB[r.b]} n levels count. T(n) = ${theta}, one more log than f(n).`;
        if (f.verdict === 3)
          return `Case 3: f(n) is polynomially larger than n^c, and the regularity condition holds: a·f(n/b) ≤ ${fmt(f.ratio)}·f(n)${r.p < 0 ? ' for large n' : ''}, with ${fmt(f.ratio)} < 1. Level costs shrink, so the root dominates. T(n) = ${theta}.`;
        return `d = c, but f(n) = ${fText(r)} is smaller than n^c by only a factor of log n, not by a power n^ε. None of the three cases applies. Summing the tree directly gives Θ(${r.d === 0 ? 'log log n' : `${powText(r.d)} log log n`}).`;
      }
      case 'done': {
        const theta = thetaText(r, /** @type {MasterCase} */ (f.verdict));
        if (f.verdict === 1) return `T(n) = ${theta}. The starred level is the leaves.`;
        if (f.verdict === 2) return `T(n) = ${theta}. Every level is starred: they all count.`;
        if (f.verdict === 3) return `T(n) = ${theta}. The starred level is the root.`;
        return 'No level is starred: no single level dominates, and the master theorem is silent.';
      }
    }
  },
  takeaways: [
    'Divide and conquer has three steps: divide the input into a parts of size n/b, conquer each part recursively, and combine the answers. f(n) is the divide and combine work of one call.',
    'Level i of the recursion tree has aⁱ calls of size n/bⁱ, so each level costs about a / b^d times the one above. The tree has log_b n levels and aᵏ = n^(log_b a) leaves.',
    'Let c = log_b a. Case 1: f(n) grows polynomially slower than n^c, so the leaves win, Θ(n^c). Case 2: f(n) = Θ(n^c (log n)^p) with p ≥ 0, so every level counts, Θ(n^c (log n)^(p+1)). Case 3: f(n) grows polynomially faster and a·f(n/b) ≤ r·f(n) for some r < 1, so the root wins, Θ(f(n)).',
    'The cases have gaps: 2T(n/2) + n / log n has d = c but f(n) is smaller only by a log factor, so no case applies (the tree sum gives Θ(n log log n)).',
    'Try Karatsuba, then set a = 4: the verdict moves from Θ(n^1.58) to Θ(n²), because one extra subproblem changes the leaf exponent.',
  ],
  complexityHead: ['Case', 'T(n)', 'Why'],
  complexity: [
    [
      '1: f(n) = O(n^(c − ε))',
      'Θ(n^c)',
      'Level costs grow by a / b^d > 1 per level, so the n^c leaves dominate.',
    ],
    [
      '2: f(n) = Θ(n^c (log n)^p), p ≥ 0',
      'Θ(n^c (log n)^(p+1))',
      'log_b n + 1 levels, each costing about f(n).',
    ],
    [
      '3: f(n) = Ω(n^(c + ε)), regular',
      'Θ(f(n))',
      'Level costs shrink by a / b^d < 1 per level, a geometric series led by the root.',
    ],
    ['Depth of the recursion', 'log_b n levels', 'The size shrinks by a factor b per level.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'Solve T(n) = 4T(n/2) + n with the master theorem. Give T(n) as Θ(…).',
      accept: ['Θ(n^2)', 'Theta(n^2)', 'n^2', 'Θ(n*n)'],
      hints: [
        'c = log₂ 4. Compare it with the exponent of f(n) = n.',
        'c = 2 > 1, so case 1: the leaves dominate.',
      ],
      solution:
        'a = 4, b = 2, so c = log₂ 4 = 2. f(n) = n = O(n^(2 − ε)), which is case 1: T(n) = Θ(n^c) = Θ(n²).',
    },
    {
      type: 'choice',
      prompt: 'Which answer does the master theorem give for T(n) = 2T(n/2) + n log n?',
      options: ['Case 1: Θ(n)', 'Case 2: Θ(n log² n)', 'Case 3: Θ(n log n)', 'No case applies'],
      answer: 1,
      hints: [
        'c = log₂ 2 = 1, and f(n) = n · (log n)¹.',
        'd = c with p = 1 ≥ 0 is case 2, which adds one more log.',
      ],
      solution:
        'c = 1 and f(n) = Θ(n^1 · (log n)^1), so case 2 with p = 1 gives Θ(n (log n)²). Level i costs n · log(n/2ⁱ), and the log n levels add up to about n log² n / 2. It is not case 3: n log n is larger than n only by a log, not by a power n^ε.',
    },
    {
      type: 'number',
      prompt:
        'For T(n) = 3T(n/4) + n², find the constant r with a·f(n/b) = r·f(n), the regularity check of case 3.',
      answer: 0.1875,
      tolerance: 0.0001,
      hints: ['a·f(n/b) = 3·(n/4)².', '3·n²/16 = (3/16)·n².'],
      solution:
        'a·f(n/b) = 3(n/4)² = (3/16)n², so r = 3/16 = 0.1875 < 1. The regularity condition holds and T(n) = Θ(n²).',
    },
    {
      type: 'choice',
      prompt: 'Which recurrence falls outside all three cases of the master theorem?',
      options: [
        'T(n) = 9T(n/3) + n',
        'T(n) = T(n/2) + 1',
        'T(n) = 2T(n/2) + n / log n',
        'T(n) = 2T(n/2) + n²',
      ],
      answer: 2,
      hints: [
        'Work out c = log_b a for each one and compare it with f(n).',
        'For 2T(n/2) + n / log n, c = 1 and f(n) is below n by only a log factor.',
      ],
      solution:
        '9T(n/3) + n is case 1 (Θ(n²)), T(n/2) + 1 is case 2 (Θ(log n)), and 2T(n/2) + n² is case 3 (Θ(n²)). For 2T(n/2) + n / log n, f(n) is not O(n^(1 − ε)) for any ε > 0 and not Θ(n (log n)^p) with p ≥ 0, so no case applies. Summing the tree gives Θ(n log log n).',
    },
    {
      type: 'number',
      prompt:
        'Strassen’s recurrence is T(n) = 7T(n/2) + n². How many leaves does its tree have for n = 8?',
      answer: 343,
      unit: 'leaves',
      hints: [
        'n = 8 = 2³, so the tree has 3 levels of splitting.',
        'Each split multiplies the calls by 7.',
      ],
      solution:
        'The leaves are aᵏ = 7³ = 343 calls, which equals n^(log₂ 7) = 8^2.807… = 343. Since log₂ 7 ≈ 2.81 > 2, the leaves dominate: Θ(n^2.81).',
    },
  ],
  nextTeaser:
    'Next up: Counting inversions, where merge sort counts the out-of-order pairs in O(n log n) instead of checking all n² pairs.',
};
