/** @typedef {import('$lib/algo-engine/approximation-algorithms.js').CoverFrame} CoverFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => String(Math.round(v * 100) / 100);

/** @param {string[]} names @param {number[]} set */
const setText = (names, set) => (set.length ? `{${set.map((i) => names[i]).join(', ')}}` : '{ }');

export const en = {
  slug: 'approximation-algorithms',
  topic: 'intractability',
  level: 'Advanced',
  title: 'Approximation algorithms',
  intro:
    'When a problem is NP-hard, an exact answer may take exponential time. An approximation algorithm runs in polynomial time and proves its answer is within a fixed factor of the optimum, called the approximation ratio. Vertex cover has a simple 2-approximation, and greedy set cover stays within a factor of about ln n.',
  summary:
    'Compare the matching 2-approximation and the greedy rule for vertex cover with the true optimum, on a graph you draw.',
  instruction:
    'Pick an algorithm and step through it. ◆ marks one smallest cover, found by brute force, so compare Cover size with Optimum as you go. Draw your own graph with the tools, or load the examples where each algorithm does worst.',
  algorithmLabel: 'Algorithm',
  algorithms: { matching: 'Matching, 2-approx', greedy: 'Greedy, most edges' },
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    spider: 'Spider',
    star: 'Star',
    path: 'Path',
  },
  graphAria: 'Graph to cover. Draw it with the tools.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => (state ? `Vertex ${name}, ${state}` : `Vertex ${name}`),
  states: {
    current: 'acted on now',
    cover: 'in the cover',
    optimum: 'in a smallest cover',
  },
  markers: { optimum: '◆' },
  /** @param {number} d */
  degreeNote: (d) => `${d}`,
  legend: {
    current: 'Acted on now',
    cover: 'In the cover',
    optimum: '◆ In one smallest cover',
    matched: 'A matching edge',
    covered: 'A covered edge',
    edge: 'The edge read now',
  },
  degreeHint: 'In Greedy, the number under each vertex counts the uncovered edges it touches.',
  stats: {
    cover: 'Cover size',
    optimum: 'Optimum',
    ratio: 'Ratio, cover / optimum',
    matched: 'Matching edges |M|',
    picks: 'Greedy picks',
  },
  /** @param {number} m */
  matchedNote: (m) => `So the optimum is at least ${m}.`,
  /** @param {number} delta @param {number} h */
  greedyNote: (delta, h) => `Guarantee H(${delta}) ≈ ${num(h)}.`,
  ratioNote: { matching: 'Guaranteed at most 2.', greedy: 'Guaranteed at most H(Δ).' },
  /** @param {number} c @param {number} opt */
  ratio: (c, opt) => (opt === 0 ? '—' : num(c / opt)),
  coverTitle: 'Cover so far',
  coverEmpty: 'Empty.',
  /** @param {CoverFrame} f @param {string[]} names */
  describe(f, names) {
    const e = f.edge >= 0 ? f.edges[f.edge] : null;
    const pair = e ? `${names[e[0]]} – ${names[e[1]]}` : '';
    const opt = f.optimum.length;
    switch (f.kind) {
      case 'start':
        return f.edges.length === 0
          ? 'The graph has no edges, so the empty set already covers it.'
          : f.algorithm === 'matching'
            ? `Read the ${plural(f.edges.length, 'edge', 'edges')} in order, starting with an empty cover.`
            : `Start with an empty cover. Each round takes the vertex that covers the most new edges.`;
      case 'take':
        return `Neither end of ${pair} is in the cover. Take both, ${names[e?.[0] ?? 0]} and ${names[e?.[1] ?? 0]}. The optimum must take at least one of them too, and no other matching edge shares them.`;
      case 'skip':
        return `${pair} already has an end in the cover. Skip it.`;
      case 'pick':
        return `${names[f.vertex]} touches ${plural(f.gain, 'uncovered edge', 'uncovered edges')}, the most of any vertex. Take it.`;
      case 'done':
        if (f.edges.length === 0) return 'Done: the empty cover is optimal.';
        return f.algorithm === 'matching'
          ? `Every edge is covered. The cover has ${f.cover.length} = 2 · ${f.matching.length} vertices, and the ${plural(f.matching.length, 'matching edge', 'matching edges')} force the optimum to at least ${f.matching.length}. The optimum is ${opt}, so the ratio is ${num(f.cover.length / opt)}.`
          : `Every edge is covered, with ${plural(f.cover.length, 'vertex', 'vertices')} ${setText(names, f.cover)}. The optimum ${setText(names, f.optimum)} has ${opt}, so the ratio is ${num(f.cover.length / opt)}.`;
    }
  },
  takeaways: [
    'The approximation ratio compares the answer with the optimum in the worst case: a ratio of 2 for a minimum means the answer is never more than twice the optimum.',
    'The proof of a ratio needs a lower bound on the optimum that is easy to see. For vertex cover it is a matching: no two of its edges share a vertex, so any cover needs at least |M| vertices.',
    'Greedy set cover takes the set covering the most uncovered elements each time. It is within H(n) ≈ ln n of the optimum, and no polynomial algorithm does much better unless P = NP.',
    'A natural greedy rule is not always better. On vertex cover, greedy by degree has no constant ratio in the worst case, while the simple matching rule never exceeds 2.',
    'Load Spider and switch between the algorithms: Matching takes 6 and Greedy 4, against an optimum of 3. Then load Path, where Greedy finds the optimum and Matching doubles it.',
  ],
  complexityHead: ['Algorithm', 'Cost', 'Why'],
  complexity: [
    ['Matching 2-approximation', 'O(V + E)', 'One pass over the edges with a flag per vertex.'],
    [
      'Greedy by degree',
      'O(V · E)',
      'Up to V rounds, each recounting uncovered edges; a bucket queue makes it O(V + E).',
    ],
    [
      'Greedy set cover',
      'O(k · Σ|S|)',
      'Each of the k picks rescans every set; the answer stays within H(n) ≈ ln n of the optimum.',
    ],
    [
      'Exact optimum here',
      'O(2ⱽ · E)',
      'Brute force over every subset, only for a graph this small.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load Spider and run Matching. How many vertices does its cover have?',
      answer: 6,
      unit: 'vertices',
      hints: ['Step to the end and read Cover size.'],
      solution: 'It takes A – B, C – F and D – G, so 6 vertices, exactly twice the optimum of 3.',
    },
    {
      type: 'number',
      prompt: 'The same graph with Greedy. How many vertices does its cover have?',
      answer: 4,
      unit: 'vertices',
      hints: ['A has the most edges, so greedy takes it first.'],
      solution:
        'Greedy takes A (3 edges), then B, C and D for the three legs, so 4. The optimum {B, C, D} skips A.',
    },
    {
      type: 'number',
      prompt: 'Load Star, five leaves around one centre, and run Matching. What is the ratio?',
      answer: 2,
      hints: ['The first edge takes the centre and a leaf; the optimum is the centre alone.'],
      solution:
        'Cover {A, B} of size 2 against the optimum {A} of size 1: ratio 2, the worst the guarantee allows.',
    },
    {
      type: 'choice',
      prompt: 'Why is every vertex cover at least as large as any matching M?',
      options: [
        'A cover must contain every vertex of M.',
        'Edges of M share no vertex, so one cover vertex covers at most one edge of M.',
        'A matching is always a maximum matching.',
        'Because |C| = 2|M|.',
      ],
      answer: 1,
      hints: ['How many matching edges can a single vertex touch?'],
      solution:
        'Each vertex touches at most one edge of M, so covering the |M| matching edges needs |M| different vertices.',
    },
    {
      type: 'number',
      prompt:
        'Set cover on {1, 2, 3, 4, 5, 6} with S₁ = {1, 2, 3, 4}, S₂ = {1, 3, 5}, S₃ = {2, 4, 6}. How many sets does greedy choose?',
      answer: 3,
      unit: 'sets',
      hints: ['Greedy first takes the largest set; then only 5 and 6 are left.'],
      solution:
        'Greedy takes S₁ (4 new), then S₂ (just 5) and S₃ (just 6): 3 sets. The optimum S₂, S₃ uses 2.',
    },
  ],
  nextTeaser:
    'Next up: Fixed-parameter algorithms, which solve vertex cover exactly in O(2ᵏ · m) time, fast whenever the cover size k is small.',
};
