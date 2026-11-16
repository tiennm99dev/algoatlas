/** @typedef {import('$lib/algo-engine/np-completeness.js').GadgetFrame} GadgetFrame */
/** @typedef {import('$lib/algo-engine/np-completeness.js').Formula} Formula */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {Formula} f @param {boolean[]} a */
const assignmentText = (f, a) => f.vars.map((v, i) => `${v} = ${a[i] ? 'T' : 'F'}`).join(', ');

export const en = {
  slug: 'np-completeness',
  topic: 'intractability',
  level: 'Advanced',
  title: 'NP-completeness',
  intro:
    'A problem is NP-hard when every problem in NP reduces to it, and NP-complete when it is also in NP itself. The Cook–Levin theorem gave the first one, SAT. Since then, each new NP-hardness proof is a single reduction from a problem already known to be hard, so the known NP-complete problems form a map connected by reduction arrows.',
  summary:
    'Follow the map of classic NP-complete problems, and step through the reduction from 3-SAT to vertex cover on a formula you type.',
  instruction:
    'Press a problem on the map to read why it is NP-hard. Then step through the 3-SAT to vertex cover reduction: type a formula, set each variable true or false, and watch whether the cover of k vertices built from your assignment covers every edge.',
  mapTitle: 'Map of NP-complete problems',
  mapNote:
    'An arrow A → B is a reduction A ≤ₚ B, so B is at least as hard as A. The highlighted arrow is the one in the player below.',
  mapAria: 'Map of classic NP-complete problems linked by reductions.',
  /** @type {Record<string, {name: string, question: string, why: string}>} */
  problems: {
    np: {
      name: 'Every problem in NP',
      question:
        'Any decision problem whose yes answers have a certificate checked in polynomial time.',
      why: 'Cook–Levin: a polynomial-time verifier run on its input is a circuit of polynomial size, and that circuit can be written as a Boolean formula that is satisfiable exactly when some certificate makes the verifier accept.',
    },
    sat: {
      name: 'SAT',
      question: 'Can the variables of a Boolean formula be set so that it is true?',
      why: 'The first NP-complete problem (Cook 1971, Levin 1973). It is in NP, since an assignment is a certificate, and every problem in NP reduces to it.',
    },
    threeSat: {
      name: '3-SAT',
      question: 'The same, for a formula in CNF with exactly three literals per clause.',
      why: 'SAT ≤ₚ 3-SAT: rewrite the formula in CNF with new helper variables, then split long clauses with more helpers and pad short ones. With two literals per clause the problem is in P.',
    },
    vertexCover: {
      name: 'Vertex cover',
      question: 'Does G have k vertices that touch every edge?',
      why: '3-SAT ≤ₚ VERTEX COVER, the gadget in the player: an edge per variable, a triangle per clause, k = n + 2m.',
    },
    clique: {
      name: 'Clique',
      question: 'Does G have k vertices all joined to each other?',
      why: '3-SAT ≤ₚ CLIQUE: a vertex for each literal of each clause, joined unless they sit in the same clause or contradict each other; k is the number of clauses.',
    },
    independentSet: {
      name: 'Independent set',
      question: 'Does G have k vertices with no edge between any two?',
      why: 'CLIQUE ≤ₚ INDEPENDENT SET by the complement graph, from the previous lesson. Also, S is independent exactly when the other vertices form a vertex cover.',
    },
    setCover: {
      name: 'Set cover',
      question: 'Can k of the given sets together cover every element?',
      why: 'VERTEX COVER ≤ₚ SET COVER: the elements are the edges, and each vertex is the set of edges it touches.',
    },
    hamCycle: {
      name: 'Hamiltonian cycle',
      question: 'Is there a cycle through every vertex exactly once?',
      why: 'VERTEX COVER ≤ₚ HAMILTONIAN CYCLE with a 12-vertex gadget for each edge, as in CLRS.',
    },
    tsp: {
      name: 'Travelling salesman',
      question: 'Is there a tour of all cities of total length at most L?',
      why: 'HAMILTONIAN CYCLE ≤ₚ TSP: cost 0 on the edges of G and 1 on the other pairs, and L = 0.',
    },
    subsetSum: {
      name: 'Subset sum',
      question: 'Do some of the given numbers add up to exactly t?',
      why: '3-SAT ≤ₚ SUBSET SUM: numbers whose digits mark a variable and the clauses it satisfies, with a target t that needs one value per variable and a true literal per clause.',
    },
    colouring: {
      name: '3-colouring',
      question: 'Can the vertices get three colours so that no edge joins two of the same colour?',
      why: '3-SAT ≤ₚ 3-COLOURING with a triangle that fixes the colours true, false and base, and an OR gadget per clause. With two colours the problem is in P.',
    },
  },
  /** @param {string} name @param {boolean} on */
  mapNodeLabel: (name, on) => `${name}${on ? ', shown below the map' : ''}`,
  formulaLabel: 'Formula φ, 3-CNF',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    satisfied: 'A satisfying assignment',
    missed: 'An assignment that misses',
    unsatisfiable: 'No assignment works',
  },
  /** @param {number} maxClauses */
  formulaError: (maxClauses) =>
    `Type 1 to ${maxClauses} clauses of exactly three literals each, using variables a to d, such as (a ∨ ¬b ∨ c) ∧ (¬a ∨ b ∨ d).`,
  assignmentLabel: 'Assignment',
  /** @param {string} name @param {boolean} value */
  valueButton: (name, value) => `${name} = ${value ? 'T' : 'F'}`,
  /** @param {string} name @param {boolean} value */
  valueAria: (name, value) => `${name} is ${value ? 'true' : 'false'}; press to flip it`,
  graphTitle: 'The vertex cover instance G',
  graphAria:
    'Graph G built from the formula: a pair per variable on top, a triangle per clause below.',
  /** @param {string} label @param {string} state */
  vertexLabel: (label, state) => (state ? `Vertex ${label}, ${state}` : `Vertex ${label}`),
  states: { current: 'acted on now', cover: 'in the cover' },
  markers: { cover: '✓' },
  legend: {
    current: 'Acted on now',
    cover: '✓ In the cover',
    uncovered: 'An edge with neither end in the cover',
    edge: 'The edge added now',
  },
  stats: {
    vertices: 'Vertices, 2n + 3m',
    edges: 'Edges, n + 6m',
    k: 'Target k = n + 2m',
    cover: 'Cover size',
    result: 'Result',
  },
  /** @param {GadgetFrame} f */
  result: (f) => {
    if (f.kind === 'covered' || (f.kind === 'done' && f.uncovered.length === 0))
      return 'covered: φ is satisfied';
    if (f.kind === 'uncovered' || f.kind === 'done')
      return `${plural(f.uncovered.length, 'edge', 'edges')} uncovered`;
    return 'not checked yet';
  },
  /** @param {GadgetFrame} f @param {Formula} formula */
  describe(f, formula) {
    const lit = (/** @type {{v: number, neg: boolean}} */ l) =>
      `${l.neg ? '¬' : ''}${formula.vars[l.v]}`;
    const clause = f.clause >= 0 ? formula.clauses[f.clause] : [];
    const name = f.variable >= 0 ? formula.vars[f.variable] : '';
    const n = formula.vars.length;
    const m = formula.clauses.length;
    switch (f.kind) {
      case 'start':
        return `φ has n = ${n} ${n === 1 ? 'variable' : 'variables'} and m = ${m} ${m === 1 ? 'clause' : 'clauses'}. The reduction builds a graph G and a number k such that G has a vertex cover of k vertices exactly when φ is satisfiable.`;
      case 'variable':
        return `Variable ${name}: add vertices ${name} and ¬${name} with an edge between them. Any cover must take at least one of the two, which will mean choosing ${name} true or false.`;
      case 'clause':
        return `Clause ${f.clause + 1}, (${clause.map(lit).join(' ∨ ')}): add a triangle. Any cover must take at least two of its three vertices.`;
      case 'link':
        return `Join the triangle vertex for ${linkLiteral(f, formula)} to that literal’s vertex on top. This edge is covered from above only if the literal is chosen true.`;
      case 'target':
        return `G has ${plural(2 * n + 3 * m, 'vertex', 'vertices')} and ${plural(n + 6 * m, 'edge', 'edges')}, and k = n + 2m = ${f.k}: one per variable and two per triangle, the fewest any cover can use. The reduction is done, in polynomial time.`;
      case 'pickVar':
        return `${name} is ${f.assignment[f.variable] ? 'true' : 'false'}, so take vertex ${f.assignment[f.variable] ? name : `¬${name}`}. That covers the variable edge.`;
      case 'pickClause':
        return `Clause ${f.clause + 1} has a true literal. Keep its triangle vertex out, since the vertex on top covers that link edge, and take the other two.`;
      case 'unsat':
        return `Clause ${f.clause + 1} has no true literal. Two triangle vertices are all the budget allows, so the vertex left out has a link edge to a literal vertex that is not in the cover.`;
      case 'covered':
        return `All ${plural(f.edges.length, 'edge', 'edges')} are covered by k = ${f.k} vertices, so the assignment ${assignmentText(formula, f.assignment)} satisfies φ.`;
      case 'uncovered':
        return `${plural(f.uncovered.length, 'edge is', 'edges are')} not covered: this assignment fails. ${f.witness ? `φ is still satisfiable, for example with ${assignmentText(formula, f.witness)}.` : 'No assignment satisfies φ, so G has no cover of k vertices either.'}`;
      case 'done':
        return f.uncovered.length === 0
          ? `Done. A satisfying assignment gave a cover of k vertices, and a cover of k vertices would give back a satisfying assignment: the true literals are the variable vertices it takes.`
          : `Done. ${f.witness ? `Try ${assignmentText(formula, f.witness)} instead.` : 'No assignment can work: φ is unsatisfiable, and G has no vertex cover of k vertices.'}`;
    }
  },
  takeaways: [
    'NP-hard means every problem in NP reduces to it. NP-complete means NP-hard and also in NP. If any NP-complete problem had a polynomial algorithm, then P = NP.',
    'The Cook–Levin theorem shows SAT is NP-complete from scratch, by writing any polynomial-time verifier as a formula. Every later proof just reduces from a problem already known to be NP-complete.',
    'To prove a new problem X NP-complete: show X is in NP with a verifier, then reduce a known NP-complete problem to X, and prove both directions: yes maps to yes, and no maps to no.',
    'Gadgets do the work in a reduction. Here an edge forces a true or false choice per variable, and a triangle with a budget of two forces each clause to contain a true literal.',
    'Load No assignment works and flip a and b in every combination: an edge always stays uncovered. Then change the last clause to (¬b ∨ ¬b ∨ a) and find an assignment that covers every edge.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Build G',
      'O(n + m)',
      '2n + 3m vertices and n + 6m edges, a constant amount per variable and clause.',
    ],
    ['Check a cover', 'O(n + m)', 'Look at each edge once.'],
    [
      'Schöning’s 3-SAT walk',
      'O(1.334ⁿ)',
      'A fast randomised algorithm, still exponential: no NP-complete problem has a known polynomial one.',
    ],
    ['Try every assignment', 'O(2ⁿ · m)', 'What this page does to say whether φ is satisfiable.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A 3-CNF formula has 3 variables and 2 clauses. How many vertices does G have?',
      answer: 12,
      unit: 'vertices',
      hints: ['Two per variable, three per clause.'],
      solution: '2 · 3 + 3 · 2 = 12 vertices.',
    },
    {
      type: 'number',
      prompt: 'For 4 variables and 3 clauses, what is the target k?',
      answer: 10,
      hints: ['k = n + 2m.'],
      solution: 'k = 4 + 2 · 3 = 10: one vertex per variable edge and two per triangle.',
    },
    {
      type: 'number',
      prompt: 'Load A satisfying assignment. How many edges does G have?',
      answer: 21,
      unit: 'edges',
      hints: ['One per variable, three per triangle and three links per clause: n + 6m.'],
      solution: 'n = 3 and m = 3, so 3 + 6 · 3 = 21 edges.',
    },
    {
      type: 'choice',
      prompt: 'You want to prove a new problem X is NP-hard. Which reduction do you build?',
      options: [
        'From X to a known NP-complete problem.',
        'From a known NP-complete problem to X.',
        'From X to a problem in P.',
        'From SAT to a problem in P.',
      ],
      answer: 1,
      hints: ['A reduction A ≤ₚ B shows that B is at least as hard as A.'],
      solution:
        'Reduce a known NP-complete problem to X. Then a fast algorithm for X would solve that problem fast too, so X is at least as hard.',
    },
    {
      type: 'multi',
      prompt: 'Which two facts together show that X is NP-complete?',
      options: [
        'X has a polynomial-time verifier.',
        'A known NP-complete problem reduces to X.',
        'X reduces to SAT.',
        'No polynomial algorithm for X is known.',
      ],
      answers: [0, 1],
      hints: ['NP-complete means in NP and NP-hard.'],
      solution:
        'A verifier puts X in NP; a reduction from a known NP-complete problem makes it NP-hard. X ≤ₚ SAT holds for every problem in NP, so it adds nothing.',
    },
    {
      type: 'text',
      prompt: 'Which problem did the Cook–Levin theorem prove NP-complete?',
      accept: ['SAT', 'boolean satisfiability', 'satisfiability', 'CNF-SAT', 'circuit SAT'],
      hints: ['It is about Boolean formulas.'],
      solution: 'SAT, Boolean satisfiability: is there an assignment that makes a formula true?',
    },
  ],
  nextTeaser:
    'Next up: Approximation algorithms, which give up on the exact optimum and promise an answer within a fixed factor of it, such as a vertex cover at most twice the smallest.',
};

/**
 * The literal of the triangle vertex in a link frame.
 * @param {GadgetFrame} f @param {Formula} formula
 */
function linkLiteral(f, formula) {
  const t = (f.current[0] - 2 * formula.vars.length) % 3;
  const l = formula.clauses[f.clause][t];
  return `${l.neg ? '¬' : ''}${formula.vars[l.v]}`;
}
