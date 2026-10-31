/** @typedef {import('$lib/algo-engine/two-sat.js').TwoSatFrame} TwoSatFrame */
/** @typedef {import('$lib/algo-engine/two-sat.js').Clause} Clause */

const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** Name of variable x (0-based): x₁, x₂, …. @param {number} x */
const varName = (x) => `x${[...String(x + 1)].map((d) => SUB[Number(d)]).join('')}`;
/** Name of a literal: 2i is xᵢ₊₁, 2i + 1 is ¬xᵢ₊₁. @param {number} l */
const lit = (l) => `${l % 2 ? '¬' : ''}${varName(l >> 1)}`;
/** @param {Clause} c */
const clauseText = ([a, b]) => `(${lit(a)} ∨ ${lit(b)})`;
/** @param {number[]} list */
const lits = (list) => list.map(lit).join(', ');
/** @param {number} v */
const bool = (v) => (v === 1 ? 'true' : 'false');

export const en = {
  slug: 'two-sat',
  topic: 'advanced-graphs',
  level: 'Advanced',
  title: '2-SAT',
  intro:
    '2-SAT asks whether true/false values can satisfy a formula made of clauses with two literals each, such as (x₁ ∨ ¬x₂). With three literals per clause the problem is NP-complete, but with two it is solvable in linear time: each clause becomes two implications, and the strongly connected components of the resulting implication graph decide everything.',
  summary:
    'Build the implication graph of a 2-SAT formula you edit, find its strongly connected components and read a satisfying assignment from their topological order.',
  instruction:
    'Edit the clauses: pick each literal from its menu, add or delete clauses, or load an example. Step through: every clause adds two implication edges, Tarjan finds the components (numbered at each vertex’s corner), and each variable is set from which of its two literals’ components was found first.',
  varsNote: 'Variables x₁ to x₄. A literal is a variable or its negation ¬.',
  clausesTitle: 'Clauses (all must hold)',
  /** @param {number} k */
  clauseAria: (k) => `Clause ${k + 1}`,
  /** @param {number} k @param {'first' | 'second'} side */
  literalAria: (k, side) => `Clause ${k + 1}, ${side} literal`,
  /** @param {number} k */
  removeAria: (k) => `Delete clause ${k + 1}`,
  remove: 'Delete',
  or: '∨',
  addClause: 'Add clause',
  satExample: 'Satisfiable example',
  unsatExample: 'Unsatisfiable example',
  /** @param {number} max */
  full: (max) => `A formula here holds at most ${max} clauses. Delete one first.`,
  noClauses: 'No clauses: every assignment works. Add a clause to see its implications.',
  satisfied: 'satisfied',
  graphAria:
    'Implication graph: one vertex per literal, an edge ¬a → b and ¬b → a for each clause (a ∨ b).',
  compsLabel: 'Components (in the order Tarjan finds them)',
  assignLabel: 'Assignment',
  emptyText: 'none yet',
  hotLabel: 'newest',
  /** @param {number} c @param {number[]} members */
  compChip: (c, members) => `C${c}: ${lits(members)}`,
  /** @param {number} x @param {number} v */
  assignChip: (x, v) => `${varName(x)} = ${bool(v)}`,
  stats: {
    clauses: 'Clauses',
    edges: 'Implication edges',
    comps: 'Components',
    result: 'Result',
  },
  results: { pending: '—', sat: 'SAT', unsat: 'UNSAT' },
  legend: {
    added: 'Ends of the edges just added',
    popped: 'Component just found',
    found: 'In a component (number at the corner)',
    yes: 'Literal set true',
    conflict: 'x and ¬x in one component',
    newEdge: 'Edge just added',
    inside: 'Edge inside a component',
  },
  states: {
    added: 'end of a new edge',
    popped: 'just found',
    yes: 'true',
    no: 'false',
    conflict: 'shares a component with its negation',
  },
  lit,
  clauseText,
  /** @param {string} name @param {string} state @param {number} comp */
  literalLabel: (name, state, comp) =>
    [`Literal ${name}`, state, comp > 0 ? `component C${comp}` : ''].filter(Boolean).join(', '),
  /**
   * @param {TwoSatFrame} f
   * @param {Clause[]} clauses
   */
  describe(f, clauses) {
    switch (f.kind) {
      case 'start':
        return 'One vertex per literal, no edges yet. Each clause (a ∨ b) will add ¬a → b and ¬b → a: if one literal is false, the other must be true.';
      case 'clause': {
        const c = clauses[f.clause];
        const [a, b] = c;
        if (f.added.length === 0)
          return `${clauseText(c)} adds nothing new${a === (b ^ 1) ? ': it is always true' : ': its edges are already there'}.`;
        return `${clauseText(c)}: if ${lit(a ^ 1)} then ${lit(b)}, and if ${lit(b ^ 1)} then ${lit(a)}. ${f.added.length === 1 ? 'Both say the same, so add one edge.' : 'Add both edges.'}`;
      }
      case 'scc':
        return `Tarjan finishes component C${f.count}: ${lits(f.popped)}. All of them are true together or false together.`;
      case 'conflict': {
        const x = f.variable;
        return `${varName(x)} and ¬${varName(x)} are both in C${f.comp[2 * x]}: ${varName(x)} implies ¬${varName(x)} and back, so no value of ${varName(x)} can work.`;
      }
      case 'assign': {
        const x = f.variable;
        const cx = f.comp[2 * x];
        const cn = f.comp[2 * x + 1];
        return f.value[x] === 1
          ? `C${cx} (${varName(x)}) was found before C${cn} (¬${varName(x)}), so it is later in topological order: set ${varName(x)} = true.`
          : `C${cn} (¬${varName(x)}) was found before C${cx} (${varName(x)}), so ¬${varName(x)} is later in topological order: set ${varName(x)} = false.`;
      }
      case 'done':
        return f.sat
          ? `Satisfiable: ${f.value.map((v, x) => `${varName(x)} = ${bool(v)}`).join(', ')}. Every clause has a true literal.`
          : `Unsatisfiable: the implications force ${varName(f.variable)} to equal its own negation.`;
    }
  },
  takeaways: [
    'A clause (a ∨ b) is the same as the two implications ¬a → b and ¬b → a. One vertex per literal and two edges per clause give the implication graph.',
    'Literals in one strongly connected component imply each other, so they must all be true or all false. If x and ¬x share a component, the formula is unsatisfiable; otherwise it is satisfiable.',
    'To build an assignment, set each x true when x’s component comes after ¬x’s in topological order. Then no true literal implies a false one.',
    'Tarjan finds components sinks first, so “later in topological order” means “found earlier”: x is true when comp[x] < comp[¬x]. The whole solve is O(n + m) for n variables and m clauses.',
    'Try it: add the clause (¬x₁ ∨ ¬x₃) and watch x₁ flip to false; then add (¬x₂ ∨ ¬x₃) instead and the formula becomes unsatisfiable.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Implication graph',
      'O(n + m)',
      '2n literal vertices and at most 2m edges, one pass over the clauses.',
    ],
    ['SCCs', 'O(n + m)', 'One run of Tarjan’s (or Kosaraju’s) algorithm over the graph.'],
    ['Assignment', 'O(n)', 'Compare two component numbers per variable.'],
    ['Memory', 'O(n + m)', 'The graph plus Tarjan’s per-literal labels and stack.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Which two edges does the clause (x₁ ∨ ¬x₂) add?',
      options: [
        'x₁ → ¬x₂ and ¬x₂ → x₁',
        '¬x₁ → ¬x₂ and x₂ → x₁',
        'x₁ → x₂ and x₂ → x₁',
        '¬x₁ → x₂ and ¬x₂ → ¬x₁',
      ],
      answer: 1,
      hints: ['If x₁ is false, which literal must be true?'],
      solution:
        'If x₁ is false, ¬x₂ must hold: ¬x₁ → ¬x₂. If ¬x₂ is false, that is x₂ is true, x₁ must hold: x₂ → x₁.',
    },
    {
      type: 'number',
      prompt: 'How many strongly connected components does the satisfiable example have?',
      answer: 4,
      unit: 'components',
      hints: ['Step until the Components counter stops growing.'],
      solution:
        'C1 = {¬x₄, x₃, x₂}, C2 = {x₁}, C3 = {¬x₁} and C4 = {¬x₃, x₄, ¬x₂}. C1 and C4 mirror each other, as negations always do.',
    },
    {
      type: 'text',
      prompt:
        'Which assignment does the algorithm report for the satisfiable example? Type four values for x₁ to x₄, such as T, F, F, T.',
      accept: ['T, T, T, F', 'TTTF', 'true, true, true, false', '1, 1, 1, 0', '1110'],
      hints: ['Compare comp[x] with comp[¬x] for each variable: the smaller number wins.'],
      solution:
        'x₁: C2 < C3, true. x₂: C1 < C4, true. x₃: C1 < C4, true. x₄: comp[x₄] = C4 > comp[¬x₄] = C1, false. So T, T, T, F.',
    },
    {
      type: 'choice',
      prompt: 'Add the clause (¬x₁ ∨ ¬x₃) to the satisfiable example. What happens?',
      options: [
        'The formula becomes unsatisfiable.',
        'x₁ becomes false; the rest stays the same.',
        'x₃ becomes false.',
        'Nothing changes.',
      ],
      answer: 1,
      hints: [
        'x₃ is forced true by the other clauses. What does the new clause then say about x₁?',
      ],
      solution:
        'Every satisfying assignment of the example has x₃ true, so the new edge x₃ → ¬x₁ forces x₁ to be false. The run reports x₁ = false, x₂ = true, x₃ = true, x₄ = false, which satisfies every clause.',
    },
    {
      type: 'choice',
      prompt: 'Instead add (¬x₂ ∨ ¬x₃) to the satisfiable example. What happens?',
      options: [
        'Satisfiable with x₂ = false.',
        'Satisfiable with x₃ = false.',
        'Unsatisfiable.',
        'Satisfiable with every variable true.',
      ],
      answer: 2,
      hints: [
        '(¬x₂ ∨ x₃) and (¬x₂ ∨ ¬x₃) together force x₂ to be false. Follow the chain from there.',
      ],
      solution:
        'x₂ must be false. Then (x₄ ∨ x₂) forces x₄, (¬x₃ ∨ ¬x₄) forces ¬x₃, (x₁ ∨ x₃) forces x₁, and (¬x₁ ∨ x₂) forces x₂: a contradiction. All eight literals end in one component.',
    },
  ],
  nextTeaser:
    'Next up: Practice: advanced graph problems, finding the weak points of a network and the cycles in a dependency graph.',
};
