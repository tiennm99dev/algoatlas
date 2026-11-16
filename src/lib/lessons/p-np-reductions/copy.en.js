/** @typedef {import('$lib/algo-engine/p-np-reductions.js').ReductionFrame} ReductionFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {string[]} names @param {number[]} set */
const setText = (names, set) => (set.length ? `{${set.map((i) => names[i]).join(', ')}}` : '{ }');

export const en = {
  slug: 'p-np-reductions',
  topic: 'intractability',
  level: 'Advanced',
  title: 'P, NP and reductions',
  intro:
    'Complexity theory sorts decision problems, questions with a yes or no answer. P holds the ones a computer can answer in polynomial time. NP holds the ones whose yes answers can be checked in polynomial time, given a certificate. A reduction turns every instance of one problem into an instance of another with the same answer, which is how we compare how hard two problems are.',
  summary:
    'Reduce CLIQUE to INDEPENDENT SET by building the complement graph pair by pair, then check a certificate with a polynomial-time verifier.',
  instruction:
    'Step through the reduction as it fills H, the complement of G, one pair at a time; then watch the verifier check your certificate S. Click vertices of S on or off, change k, pick an example, or edit G with the drawing tools and see H follow.',
  problemsTitle: 'Two decision problems',
  /** @param {number} k */
  cliqueQuestion: (k) => `CLIQUE: does G have ${k} vertices that are all joined to each other?`,
  /** @param {number} k */
  indepQuestion: (k) => `INDEPENDENT SET: does H have ${k} vertices with no edge between any two?`,
  kLabel: 'k',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    clique: 'Four-clique',
    house: 'House',
    cycle: 'Five-cycle',
  },
  /** @param {number} n */
  kError: (n) => `k must be a whole number from 1 to ${n}, the number of vertices.`,
  certLabel: 'Certificate S',
  certNote: 'Press a vertex to put it in S or take it out. S is the proof a yes answer comes with.',
  /** @param {string} name @param {boolean} on */
  certButton: (name, on) => `${name}${on ? ' ✓' : ''}`,
  /** @param {string} name @param {boolean} on */
  certAria: (name, on) => `Vertex ${name}, ${on ? 'in' : 'not in'} the certificate`,
  graphTitle: 'G, the CLIQUE instance',
  graphAria: 'Graph G, the input to CLIQUE.',
  complementTitle: 'H, the INDEPENDENT SET instance',
  complementAria: 'Graph H, the complement of G, built by the reduction.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => (state ? `Vertex ${name}, ${state}` : `Vertex ${name}`),
  states: { cert: 'in the certificate S', pair: 'in the pair looked at now' },
  markers: { cert: 'S' },
  legend: {
    pair: 'The pair looked at now',
    cert: 'S In the certificate',
    checked: 'A pair the verifier confirmed',
    added: 'An edge the reduction added to H',
  },
  stats: {
    mapSteps: 'Pairs reduced',
    checks: 'Verifier checks',
    subsets: 'Subsets a search tries',
    answer: 'Answer, both problems',
  },
  /** @param {number} n */
  mapNote: (n) => `n(n − 1)/2 = ${n}`,
  /** @param {number} n @param {number} k */
  subsetNote: (n, k) => `C(${n}, ${k}), every set of k vertices`,
  verdicts: { accept: 'accepted', reject: 'rejected', '': 'not yet' },
  /** @param {boolean} yes @param {string[]} names @param {number[]} witness */
  answer: (yes, names, witness) => (yes ? `yes, for example ${setText(names, witness)}` : 'no'),
  verifierTitle: 'Verifier',
  /** @param {ReductionFrame} f */
  verdict: (f) => {
    if (f.verdict === 'accept') return 'S is accepted.';
    if (f.verdict === 'reject') return 'S is rejected.';
    return 'Waiting for the reduction to finish.';
  },
  /** @param {ReductionFrame} f @param {string[]} names */
  describe(f, names) {
    const p = f.pair ? `${names[f.pair[0]]} – ${names[f.pair[1]]}` : '';
    const yes = f.largest >= f.k;
    switch (f.kind) {
      case 'start':
        return `The input is G and k = ${f.k}. The reduction makes H with the same ${plural(f.n, 'vertex', 'vertices')} and no edges yet.`;
      case 'keep':
        return `${p} is an edge of G, so H gets no edge there. Two vertices joined in G may sit together in a clique, so in H they must be free to sit together in an independent set.`;
      case 'add':
        return `${p} is not an edge of G, so add it to H. Those two can never be in the same clique of G, and the edge in H stops them being in the same independent set.`;
      case 'mapped':
        return `H is complete after ${plural(f.mapSteps, 'pair', 'pairs')}, and k stays ${f.k}. Any set of vertices is a clique of G exactly when it is independent in H, so the two questions have the same answer.`;
      case 'small':
        return `S ${setText(names, f.cert)} has ${plural(f.cert.length, 'vertex', 'vertices')}, fewer than k = ${f.k}. The verifier rejects it at once.`;
      case 'pairOk':
        return `${p} is an edge of G, and so not an edge of H. This pair is fine.`;
      case 'pairBad':
        return `${p} is not an edge of G, so S is not a clique and is not independent in H. The verifier rejects S. That says nothing about other sets: ${yes ? 'a clique of size k does exist' : 'here no clique of size k exists either'}.`;
      case 'accept':
        return `Every pair of S ${setText(names, f.cert)} is joined in G: a clique of ${plural(f.cert.length, 'vertex', 'vertices')}, checked with ${plural(f.checks, 'test', 'tests')}. The verifier accepts, and S is an independent set of H too.`;
      case 'done':
        return `Done. The reduction took ${plural(f.mapSteps, 'pair', 'pairs')} and the verifier ${plural(f.checks, 'test', 'tests')}, both polynomial. Finding S without a certificate could mean trying all ${f.subsets} sets of ${f.k}. Both answers are ${yes ? 'yes' : 'no'}: the largest clique of G has ${plural(f.largest, 'vertex', 'vertices')}.`;
    }
  },
  takeaways: [
    'A decision problem has a yes or no answer, like “does G have a clique of k vertices?”. Optimisation problems become decision problems by adding a target k, and the two are equally hard up to a polynomial factor.',
    'P is the set of decision problems solvable in polynomial time. NP is the set whose yes answers have a certificate that a verifier checks in polynomial time. Every problem in P is in NP; whether P = NP is the famous open question.',
    'A reduction A ≤ₚ B maps each instance of A, in polynomial time, to an instance of B with the same answer. Then a fast algorithm for B gives one for A, so B is at least as hard as A.',
    'The direction matters. To show B is hard, reduce a known hard problem to B, never B to it.',
    'Load House: the certificate {A, B, D} is rejected, yet the answer is yes. Put C in place of D and step again to watch the verifier accept {A, B, C}.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Reduce G to H', 'O(n²)', 'One look at each of the n(n − 1)/2 pairs.'],
    ['Verify a certificate', 'O(k²)', 'Each pair of the k vertices in S is one edge lookup.'],
    [
      'Search without a certificate',
      'O(C(n, k) · k²)',
      'Try every set of k vertices and verify each one.',
    ],
    ['Memory', 'O(n²)', 'H can have up to n(n − 1)/2 edges.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'G has 6 vertices. How many pairs does the reduction look at?',
      answer: 15,
      unit: 'pairs',
      hints: ['Each unordered pair once: n(n − 1)/2.'],
      solution:
        '6 · 5 / 2 = 15 pairs, whatever the edges are. Load Four-clique and read Pairs reduced.',
    },
    {
      type: 'number',
      prompt: 'In the Four-clique example, G has 9 edges. How many edges does H get?',
      answer: 6,
      unit: 'edges',
      hints: ['H has an edge exactly where G has none, among the 15 pairs.'],
      solution: '15 pairs − 9 edges of G = 6 edges in H.',
    },
    {
      type: 'number',
      prompt:
        'The certificate is a clique of 5 vertices. How many pair tests does the verifier make before it accepts?',
      answer: 10,
      unit: 'tests',
      hints: ['It tests every pair of S once.'],
      solution: '5 · 4 / 2 = 10 tests, which is O(k²): polynomial.',
    },
    {
      type: 'choice',
      prompt: 'A reduction A ≤ₚ B exists and B is in P. What follows?',
      options: [
        'A is in P.',
        'B is NP-complete.',
        'A is harder than B.',
        'Nothing, unless B also reduces to A.',
      ],
      answer: 0,
      hints: ['Turn an instance of A into one of B, then use B’s fast algorithm.'],
      solution:
        'Reduce in polynomial time, then solve B in polynomial time. The total is still polynomial, so A is in P.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are decision problems? Pick all that apply.',
      options: [
        'Does G have a clique of at least 4 vertices?',
        'Find the largest clique of G.',
        'Is there a route through all cities of length at most 100?',
        'How long is the shortest route through all cities?',
      ],
      answers: [0, 2],
      hints: ['A decision problem answers only yes or no.'],
      solution:
        'The first and third ask yes or no. The other two ask for an object or a number; adding a target k turns them into decision problems.',
    },
  ],
  nextTeaser:
    'Next up: NP-completeness, where Cook and Levin show SAT is the hardest problem in NP and reductions spread that hardness to 3-SAT, vertex cover and more.',
};
