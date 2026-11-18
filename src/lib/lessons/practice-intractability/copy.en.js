/** @typedef {import('$lib/algo-engine/practice-intractability.js').SortFrame} SortFrame */
/** @typedef {import('$lib/algo-engine/practice-intractability.js').Bin} Bin */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @type {Record<string, {name: string, statement: string, why: string}>} */
const cards = {
  eulerCircuit: {
    name: 'Euler circuit',
    statement: 'Is there a closed walk that uses every edge exactly once?',
    why: 'Hierholzer’s algorithm in O(V + E): it exists exactly when every degree is even and all the edges lie in one connected piece.',
  },
  hamCycle: {
    name: 'Hamiltonian cycle',
    statement: 'Is there a cycle through every vertex exactly once?',
    why: 'Reduce from vertex cover (or 3-SAT). A yes/no question, so approximation does not apply.',
  },
  twoSat: {
    name: '2-SAT',
    statement: 'Can a CNF formula with two literals per clause be satisfied?',
    why: 'Each clause becomes two implications, and strongly connected components decide it in linear time.',
  },
  threeSat: {
    name: '3-SAT',
    statement: 'Can a CNF formula with three literals per clause be satisfied?',
    why: 'Reduce from SAT, which Cook–Levin made the first NP-complete problem.',
  },
  metricTsp: {
    name: 'Metric TSP',
    statement: 'Shortest tour of all cities when distances obey the triangle inequality.',
    why: 'Reduce from Hamiltonian cycle, with costs 1 and 2. Doubling a minimum spanning tree gives a 2-approximation, and Christofides 1.5.',
  },
  generalTsp: {
    name: 'General TSP',
    statement: 'Shortest tour of all cities, with any distances.',
    why: 'Reduce from Hamiltonian cycle with a huge cost on missing edges: any constant-factor approximation would decide Hamiltonian cycle.',
  },
  vertexCover: {
    name: 'Minimum vertex cover',
    statement: 'Fewest vertices that touch every edge.',
    why: 'Reduce from 3-SAT. Taking both ends of a maximal matching is a 2-approximation.',
  },
  dagLongestPath: {
    name: 'Longest path in a DAG',
    statement: 'Longest path in a directed graph with no cycles.',
    why: 'Dynamic programming in topological order, O(V + E). Without cycles, “longest” is as easy as “shortest”.',
  },
  longestPath: {
    name: 'Longest simple path',
    statement: 'Longest path that repeats no vertex, in any graph.',
    why: 'Reduce from Hamiltonian path: a path of n − 1 edges visits every vertex. No constant-factor approximation unless P = NP.',
  },
  shortestPath: {
    name: 'Shortest path',
    statement: 'Cheapest path between two vertices, with non-negative weights.',
    why: 'Dijkstra’s algorithm, O((V + E) log V).',
  },
  twoColouring: {
    name: '2-colouring',
    statement: 'Can the vertices get two colours with no edge inside one colour?',
    why: 'A BFS two-colouring fails exactly on an odd cycle, O(V + E).',
  },
  threeColouring: {
    name: '3-colouring',
    statement: 'Can the vertices get three colours with no edge inside one colour?',
    why: 'Reduce from 3-SAT with a true/false/base triangle and clause gadgets. A yes/no question.',
  },
  maxClique: {
    name: 'Maximum clique',
    statement: 'Largest set of vertices all joined to each other.',
    why: 'Reduce from 3-SAT. It cannot be approximated within n^(1−ε) for any ε > 0 unless P = NP.',
  },
  knapsack: {
    name: '0/1 knapsack',
    statement: 'Most valuable set of whole items within a weight limit.',
    why: 'Reduce from subset sum. Rounding the values gives a (1 − ε)-approximation for any ε, in polynomial time.',
  },
  fractionalKnapsack: {
    name: 'Fractional knapsack',
    statement: 'The same, but items may be cut into fractions.',
    why: 'Greedy by value per weight is optimal, O(n log n).',
  },
  binPacking: {
    name: 'Bin packing',
    statement: 'Fewest bins of size 1 that hold all the items.',
    why: 'Reduce from partition. First fit decreasing uses at most 11/9 · OPT + 6/9 bins.',
  },
  maxCut: {
    name: 'Maximum cut',
    statement: 'Split the vertices in two to cut as many edges as possible.',
    why: 'Reduce from NAE-3-SAT. A random split cuts half the edges in expectation, and Goemans–Williamson reaches 0.878.',
  },
  matching: {
    name: 'Maximum matching',
    statement: 'Most edges with no shared vertex, in any graph.',
    why: 'Edmonds’ blossom algorithm in polynomial time; in bipartite graphs, a max flow.',
  },
};

/** @type {Record<Bin, string>} */
const bins = { p: 'Polynomial', npc: 'NP-complete', approx: 'Approximable' };

export const en = {
  slug: 'practice-intractability',
  topic: 'intractability',
  level: 'Advanced',
  title: 'Practice: reductions and hardness',
  intro:
    'Before trying to solve a problem, decide how hard it is. Many easy and hard problems look almost the same: shortest and longest paths, Euler and Hamiltonian cycles, 2-SAT and 3-SAT. Recognising which one you have tells you whether to look for an exact algorithm, an approximation, or a reduction that proves neither exists.',
  summary:
    'Sort problem cards into polynomial, NP-complete and approximable, then step through the check to see the algorithm or the reduction behind each one.',
  instruction:
    'Put each card in a bin, then step through the check: each step reveals one card’s answer, with the algorithm that solves it or the problem that reduces to it. Check all jumps to the score. Deal a new hand for other cards, then answer the questions below.',
  binsLabel: 'Bin',
  bins,
  /** @type {Record<Bin, string>} */
  binNotes: {
    p: 'Solvable exactly in polynomial time.',
    npc: 'NP-complete as a yes/no question. An optimisation problem belongs here when it is NP-hard and has no constant-factor approximation unless P = NP.',
    approx: 'NP-hard exactly, but within a constant factor in polynomial time.',
  },
  cards,
  handTitle: 'Your hand',
  checkAll: 'Check all',
  deal: 'Deal a new hand',
  clear: 'Clear my answers',
  /** @param {string} name */
  cardLegend: (name) => `Bin for ${name}`,
  verdicts: {
    right: '✓ Right',
    wrong: '✗ Not quite',
    unsorted: '? Not sorted',
  },
  /** @param {Bin} bin */
  belongs: (bin) => `It belongs in ${bins[bin]}.`,
  legend: {
    active: 'Checked now',
    right: '✓ Right',
    wrong: '✗ Not quite',
  },
  stats: { right: 'Right', wrong: 'Not quite', unsorted: 'Not sorted', checked: 'Checked' },
  /** @param {SortFrame} f @param {Bin} want */
  describe(f, want) {
    const card = f.card >= 0 ? cards[f.hand[f.card]] : null;
    switch (f.kind) {
      case 'start':
        return `Sort the ${plural(f.hand.length, 'card', 'cards')}, then step forward to check them one at a time.`;
      case 'right':
        return `${card?.name}: right, ${bins[want]}. ${card?.why}`;
      case 'wrong':
        return `${card?.name}: not ${bins[/** @type {Bin} */ (f.answers[f.card])]}, it is ${bins[want]}. ${card?.why}`;
      case 'unsorted':
        return `${card?.name}: not sorted. It is ${bins[want]}. ${card?.why}`;
      case 'done':
        return `${f.right} of ${plural(f.hand.length, 'card', 'cards')} right${f.wrong ? `, ${f.wrong} not quite` : ''}${f.unsorted ? `, ${f.unsorted} not sorted` : ''}.${f.right === f.hand.length ? ' A perfect sort.' : ' Step back to any card to read why.'}`;
    }
  },
  takeaways: [
    'Small changes to a problem can flip it from easy to NP-complete: two literals per clause or three, two colours or three, every edge or every vertex, a DAG or any graph.',
    'To prove a new problem hard, pick the known NP-complete problem that looks most like it: Hamiltonian cycle for routes and orderings, 3-SAT for true/false choices, vertex cover or clique for picking vertices, subset sum or partition for numbers.',
    'NP-complete is a statement about exact answers. Many NP-hard optimisation problems still have good approximations, such as vertex cover, metric TSP, knapsack and bin packing, while others, like clique and general TSP, resist any constant factor.',
    'When an exact answer is needed anyway, use a fixed parameter, branch and bound, or dynamic programming on a small numeric range, as pseudo-polynomial knapsack does.',
    'Deal a few new hands until you have seen every card, and try to name each card’s reduction source before you step to it.',
  ],
  complexityHead: ['Problem', 'Best known', 'Why'],
  complexity: [
    [
      'Shortest path, MST, 2-SAT',
      'polynomial',
      'Greedy rules, dynamic programming or graph search solve them exactly.',
    ],
    [
      '3-SAT, Hamiltonian cycle, 3-colouring',
      'exponential',
      'NP-complete: a polynomial algorithm for one would give P = NP.',
    ],
    [
      'Vertex cover, metric TSP, bin packing',
      'constant factor',
      'NP-hard, but a polynomial algorithm stays within a fixed factor.',
    ],
    [
      'Clique, general TSP',
      'no constant factor',
      'Unless P = NP, even approximating them is hard.',
    ],
  ],
  practiceTitle: 'Questions',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In the starting hand, how many cards belong in Polynomial?',
      answer: 3,
      unit: 'cards',
      hints: [
        'Check all and count the Polynomial verdicts, or think: which of each look-alike pair is the easy one?',
      ],
      solution:
        'Euler circuit, 2-SAT and longest path in a DAG: 3 cards. Their look-alikes, Hamiltonian cycle, 3-SAT and longest simple path, are NP-complete.',
    },
    {
      type: 'multi',
      prompt: 'Which cards of the starting hand belong in Approximable?',
      options: ['Metric TSP', 'General TSP', 'Minimum vertex cover', '3-SAT'],
      answers: [0, 2],
      hints: ['Step to the two TSP cards and compare their reasons.'],
      solution:
        'Metric TSP (2 by doubling an MST) and vertex cover (2 by a maximal matching). General TSP has no constant factor unless P = NP, and 3-SAT is a yes/no question.',
    },
    {
      type: 'choice',
      prompt:
        'You want to prove longest simple path NP-hard. Which known problem is the natural one to reduce from?',
      options: ['Shortest path', 'Hamiltonian path', '2-SAT', 'Maximum matching'],
      answer: 1,
      hints: ['A path of n − 1 edges with no repeated vertex visits every vertex.'],
      solution:
        'Hamiltonian path: G has one exactly when its longest simple path has n − 1 edges. The other three are in P, so reducing from them proves nothing.',
    },
    {
      type: 'text',
      prompt:
        'General TSP has no constant-factor approximation unless P = NP. Which NP-complete problem does that proof reduce from?',
      accept: [
        'Hamiltonian cycle',
        'Hamilton cycle',
        'Hamiltonian circuit',
        'ham cycle',
        'HAM-CYCLE',
      ],
      hints: ['Read the General TSP card’s reason.'],
      solution:
        'Hamiltonian cycle: cost 1 on edges of G and a huge cost elsewhere. An approximation within that factor would find a cost-n tour exactly when G has a Hamiltonian cycle.',
    },
    {
      type: 'choice',
      prompt:
        'You must cover a graph of a million vertices within a second, and twice the optimum is acceptable. What do you use?',
      options: [
        'The bounded search tree, since vertex cover is FPT.',
        'Brute force over all subsets.',
        'Both ends of a maximal matching.',
        'Nothing works, vertex cover is NP-complete.',
      ],
      answer: 2,
      hints: ['Exact versus approximate: which one is linear time with a guarantee?'],
      solution:
        'The matching rule runs in O(V + E) and is never worse than twice the optimum. The search tree is fast only when the cover size k is small.',
    },
    {
      type: 'order',
      prompt:
        'Order these by how much the size of the numbers matters to the best known exact algorithm, from not at all to most.',
      items: [
        '0/1 knapsack with any weights',
        'Fractional knapsack',
        '0/1 knapsack with a weight limit W of at most 1,000',
      ],
      answer: [1, 2, 0],
      hints: [
        'Fractional is greedy. A small weight limit allows a table with one column per weight.',
      ],
      solution:
        'Fractional knapsack is greedy in O(n log n), whatever the numbers. With W ≤ 1,000 the dynamic programming table is O(n · W), polynomial only because W is small. With any weights that table can be exponential in the input size, and 0/1 knapsack is NP-hard.',
    },
  ],
  nextTeaser:
    'Next up: Binomial and Fibonacci heaps, where a Fibonacci heap merges in O(1) and makes decrease-key cheap enough to speed up Dijkstra and Prim.',
};
