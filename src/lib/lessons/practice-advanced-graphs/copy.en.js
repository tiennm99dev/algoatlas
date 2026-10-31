/** @typedef {import('$lib/algo-engine/practice-advanced-graphs.js').FailureFrame} FailureFrame */
/** @typedef {import('$lib/algo-engine/practice-advanced-graphs.js').CycleFrame} CycleFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');
/** @param {number} k @param {string} one @param {string} many */
const count = (k, one, many) => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'practice-advanced-graphs',
  topic: 'advanced-graphs',
  level: 'Advanced',
  title: 'Practice: advanced graph problems',
  intro:
    'Two everyday questions are graph problems in disguise. Which router, if it fails, cuts a network apart? That is an articulation point. Which modules can never be built because they need each other? That is a strongly connected component of more than one module. Knock out nodes and break cycles on graphs you edit, then answer the questions below.',
  summary:
    'Fail one node of a network to see which parts disconnect, and find the dependency cycles that block a build order.',
  instruction:
    'In Network, pick a node to fail from the menu or press it on the map, then step through: the flood labels each part that still works together. In Dependencies, step through Tarjan’s search to find the cycles; use Delete on an edge to break one and get a build order.',
  modeLabel: 'Problem',
  modes: { network: 'Network: fail a node', deps: 'Dependencies: find cycles' },
  failLabel: 'Failed node',
  noFailure: 'none',
  resetGraph: 'Reset graph',
  networkAria: 'Undirected network of routers; press a router to make it the failed node.',
  depsAria: 'Module dependency graph; an edge A to B means A needs B.',
  modulesTitle: 'Modules',
  /** Module names for the starting dependency graph, by vertex id. */
  modules: ['app', 'ui', 'api', 'auth', 'db', 'log', 'config'],
  partsLabel: 'Parts that still work together',
  queueLabel: 'Flood queue (front first)',
  cyclesLabel: 'Dependency cycles',
  orderLabel: 'Build order (first to last)',
  stackLabel: 'Tarjan stack (top first)',
  emptyText: 'none',
  noOrder: 'none while a cycle remains',
  hotLabel: 'newest',
  /** @param {number} k @param {string} members */
  partChip: (k, members) => `P${k}: ${members}`,
  stats: {
    before: 'Pieces before',
    after: 'Parts after',
    largest: 'Largest part',
    critical: 'Critical node?',
    comps: 'Components',
    onCycle: 'Modules on a cycle',
    cycles: 'Cycles',
    buildable: 'Build order exists?',
  },
  yes: 'yes',
  no: 'no',
  pending: '—',
  legend: {
    failed: 'Failed node',
    current: 'Acted on now',
    queued: 'Reached, in the queue',
    part: 'In a part (number at the corner)',
    cycle: 'On a dependency cycle',
    stack: 'On Tarjan’s stack',
    single: 'Component of one module',
    link: 'Link examined now',
    inside: 'Edge inside a cycle',
  },
  states: {
    failed: 'failed',
    current: 'current',
    queued: 'in the queue',
    cycle: 'on a cycle',
    stack: 'on the stack',
    done: 'no cycle',
  },
  /** @param {number} k */
  partNote: (k) => `P${k}`,
  /** @param {number} tin @param {number} low */
  tinLow: (tin, low) => `${tin}/${low}`,
  /** @param {string} name @param {string} state @param {number} part */
  routerLabel: (name, state, part) =>
    [`Router ${name}`, state, part > 0 ? `part ${part}` : ''].filter(Boolean).join(', '),
  /** @param {string} name @param {string} module @param {string} state */
  moduleLabel: (name, module, state) =>
    [`Module ${name}${module ? ` (${module})` : ''}`, state].filter(Boolean).join(', '),
  /**
   * @param {FailureFrame} f
   * @param {string[]} names
   */
  describeFailure(f, names) {
    const u = nm(names, f.current);
    switch (f.kind) {
      case 'start':
        return `The whole network is ${count(f.before, 'connected piece', 'separate pieces')}. ${f.failed >= 0 ? `Now fail ${nm(names, f.failed)}.` : 'Pick a node to fail.'}`;
      case 'fail':
        return `${u} fails: remove it and every link it has.`;
      case 'seed':
        return `${u} works and has no part yet: start part P${f.parts} from it.`;
      case 'expand':
        return `Dequeue ${u} and look at its working neighbours.`;
      case 'reach':
        return `${nm(names, f.other)} is linked to ${u}: it joins part P${f.parts}.`;
      case 'done': {
        const head = `${count(f.parts, 'part', 'parts')} still work${f.parts === 1 ? 's' : ''} together.`;
        if (f.failed < 0) return `${head} Pick a node to fail and compare.`;
        return f.parts > f.before
          ? `${head} That is more than the ${f.before} before, so ${nm(names, f.failed)} is critical: an articulation point.`
          : `${head} No more than before, so ${nm(names, f.failed)} is not critical: every other node still reaches the same nodes.`;
      }
    }
  },
  /**
   * @param {CycleFrame} f
   * @param {string[]} names
   */
  describeCycles(f, names) {
    const u = nm(names, f.current);
    switch (f.kind) {
      case 'start':
        return 'Run Tarjan’s SCC search: modules that need each other end up in one component.';
      case 'enter':
        return `Visit ${u}: tin = low = ${f.tin[f.current]}. Push it and follow what it needs.`;
      case 'scc':
        return f.popped.length > 1
          ? `Component ${join(names, f.popped)}: these ${f.popped.length} modules need each other, a dependency cycle. None of them can be built first.`
          : `Component ${u} on its own: everything it needs is already placed, so it can be built now.`;
      case 'done':
        return f.cycles.length
          ? `Done: ${count(f.cycles.length, 'dependency cycle', 'dependency cycles')} on ${f.cycles.flat().length} modules. Remove one edge of each cycle to get a build order.`
          : `Done: no cycle. Build in the order the components finished: ${join(names, f.order)}.`;
    }
  },
  takeaways: [
    'A node is critical, an articulation point, exactly when removing it splits the network into more pieces. Counting the pieces with a flood before and after is the brute-force check.',
    'The brute force costs one search per node, O(V · (V + E)). The low-link DFS from the bridges lesson finds every critical node in one O(V + E) pass.',
    'In a dependency graph, a strongly connected component of two or more modules is a cycle: each needs another inside it, so none can be built first.',
    'With no cycle, Tarjan completes components sinks first, which is exactly a build order: every module comes after everything it needs.',
    'Try it: fail D, then add the link E — F and fail D again. One link turns the leaf E into part of a loop, and D cuts the network into two parts instead of three.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['One failure', 'O(V + E)', 'One flood over the working nodes and links.'],
    [
      'Every failure, brute force',
      'O(V · (V + E))',
      'One flood per node; the low-link DFS does it all in O(V + E).',
    ],
    ['Dependency cycles', 'O(V + E)', 'One run of Tarjan’s SCC search over the modules.'],
    [
      'Memory',
      'O(V + E)',
      'Adjacency lists, a part or component per node, and the queue or stack.',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In the starting network, fail router D. Into how many parts does the rest fall?',
      answer: 3,
      unit: 'parts',
      hints: ['Pick D in the Failed node menu and press Last step.'],
      solution:
        'D joins three groups: the triangle A, B, C, the leaf E and the triangle F, G, H. Without D they cannot reach each other: 3 parts.',
    },
    {
      type: 'multi',
      prompt: 'Which routers of the starting network are critical?',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      answers: [2, 3, 5],
      hints: ['Fail each router in turn and read Critical node?'],
      solution:
        'C cuts off A and B, D cuts the network in three, and F cuts off G and H. Every other router lies on a triangle or is the leaf E, so the rest stays connected.',
    },
    {
      type: 'number',
      prompt: 'Fail router F. How many routers are in the largest part left?',
      answer: 5,
      unit: 'routers',
      hints: ['Read Largest part at the last step.'],
      solution: 'A, B, C, D and E stay together (5 routers); G and H form a part of 2.',
    },
    {
      type: 'number',
      prompt: 'Use Connect to add the link E — F, then fail D again. How many parts now?',
      answer: 2,
      unit: 'parts',
      hints: ['Can E still reach F, G and H without D?'],
      solution:
        'E — F gives E a second way out, so E, F, G and H stay together. Only A, B, C are cut off: 2 parts.',
    },
    {
      type: 'number',
      prompt:
        'Switch to Dependencies. How many modules of the starting graph lie on a dependency cycle?',
      answer: 5,
      unit: 'modules',
      hints: ['Step to the end and read Modules on a cycle.'],
      solution:
        'api, auth and db need each other (C → D → E → C), and log and config need each other (F ⇄ G): 3 + 2 = 5 modules.',
    },
    {
      type: 'text',
      prompt:
        'Delete the edges E → C and G → F. Which build order does Tarjan give? Type the letters separated by commas.',
      accept: ['E, G, D, C, B, F, A', 'EGDCBFA', 'E G D C B F A'],
      hints: [
        'Switch the graph tool to Delete and press the two edges, then press Last step.',
        'Components complete sinks first: db (E) has no dependency left.',
      ],
      solution:
        'The DFS from A goes A → B → C → D → E. E needs nothing and completes first, then G (reached from D), then D, C and B. Back at A it visits F, which needs only G, and A completes last: E, G, D, C, B, F, A.',
    },
  ],
  nextTeaser:
    'Next up: divide and conquer and the master theorem, splitting a problem into smaller copies and reading off its running time.',
};
