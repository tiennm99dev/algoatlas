/** @typedef {import('$lib/algo-engine/graph-representations.js').RepFrame} RepFrame */

/** Vertex name from its row in the matrix. @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);

export const en = {
  slug: 'graph-representations',
  topic: 'graphs',
  level: 'Beginner',
  title: 'Graph representations',
  intro:
    'A graph is a set of vertices joined by edges: cities and roads, people and friendships, tasks and dependencies. Before an algorithm can walk a graph, the program has to store it, and the two classic choices are an adjacency matrix and adjacency lists. They hold the same edges but answer questions at very different costs.',
  summary:
    'Draw a graph and watch each edge land in an adjacency matrix and in adjacency lists, for directed, undirected and weighted graphs.',
  instruction:
    'Edit the graph: drag vertices, use Connect to add or remove an edge, Delete to remove a vertex or edge, and Add node for a new vertex. Switch between undirected and directed, and between unweighted and weighted. Step through to see each edge written into both panels, then click a vertex or a matrix cell to compare what each representation has to read.',
  directionLabel: 'Edges',
  directions: { undirected: 'Undirected', directed: 'Directed' },
  weightLabel: 'Weights',
  weights: { unweighted: 'Unweighted', weighted: 'Weighted' },
  resetGraph: 'Reset graph',
  graphTitle: 'Graph',
  graphAria: 'Input graph.',
  matrixTitle: 'Adjacency matrix',
  matrixHint: 'Row = from, column = to. 0 means no edge.',
  /** @param {string[]} names */
  matrixAria: (names) =>
    `Adjacency matrix, ${names.length} by ${names.length}, rows and columns ${names.join(', ')}.`,
  /** @param {string} from @param {string} to @param {number} value @param {string} state */
  matrixCell: (from, to, value, state) =>
    `Row ${from}, column ${to}: ${value}${state ? `, ${state}` : ''}`,
  listsTitle: 'Adjacency lists',
  listsEmpty: 'no neighbours',
  justAdded: 'just added',
  selectedRow: 'selected',
  stats: {
    vertices: 'Vertices (n)',
    edges: 'Edges (E)',
    matrixCells: 'Matrix cells (n²)',
    listEntries: 'List entries so far',
  },
  legend: {
    writing: 'Written now',
    stored: 'Edge already stored',
    selected: 'Selected vertex’s row',
  },
  states: { writing: 'written now', selected: 'selected row' },
  /** @param {RepFrame} f @param {string[]} names @param {boolean} directed */
  describe(f, names, directed) {
    const a = nm(names, f.from);
    const b = nm(names, f.to);
    switch (f.kind) {
      case 'start':
        return `Start with a ${names.length} × ${names.length} matrix of zeros and ${names.length} empty lists.`;
      case 'edge':
        return `Edge ${a} ${directed ? '→' : '–'} ${b}: set matrix[${a}][${b}] = ${f.weight} and append ${b} to ${a}’s list.`;
      case 'mirror':
        return `Undirected, so store it the other way too: matrix[${a}][${b}] = ${f.weight} and append ${b} to ${a}’s list.`;
      case 'done':
        return directed
          ? `Done: ${f.listEntries} list entries for ${f.listEntries} directed edges, in a matrix of ${names.length * names.length} cells.`
          : `Done: each of the ${f.listEntries / 2} edges appears twice, so the lists hold ${f.listEntries} entries and the matrix is symmetric.`;
    }
  },
  /**
   * What each representation reads to list a vertex's neighbours.
   * @param {string} v @param {number} n @param {string[]} neighbours
   */
  neighboursQuery: (v, n, neighbours) =>
    `Neighbours of ${v}: ${neighbours.length ? neighbours.join(', ') : 'none'}. The matrix scans all ${n} cells of row ${v}; the list reads just its ${neighbours.length} ${neighbours.length === 1 ? 'entry' : 'entries'}.`,
  /**
   * What each representation reads to test one edge.
   * @param {string} a @param {string} b @param {number} value @param {number} scanned
   */
  edgeQuery: (a, b, value, scanned) =>
    `Is there an edge ${a} → ${b}? The matrix answers with one read: ${value === 0 ? '0, no' : `${value}, yes`}. The list has to scan ${a}’s ${scanned} ${scanned === 1 ? 'entry' : 'entries'} to be sure.`,
  takeaways: [
    'A graph G = (V, E) is a set of vertices V and edges E. In a directed graph each edge has a direction u → v; in an undirected graph u – v works both ways; a weighted graph puts a number (cost, distance) on every edge.',
    'An adjacency matrix is an n × n table: cell [u][v] holds 1 (or the weight) when the edge exists, 0 otherwise. An undirected graph gives a symmetric matrix.',
    'Adjacency lists keep, for each vertex, only its neighbours. They hold E entries for a directed graph and 2E for an undirected one, plus n list heads.',
    'Pick by the question: the matrix tests one edge in O(1) but always costs n² memory; lists cost O(n + E) memory and list a vertex’s neighbours in O(degree), which suits sparse graphs and the BFS and DFS ahead.',
    'Try it: switch to Directed and watch the matrix lose its symmetry, then click a vertex with few edges and compare what the matrix and the list each have to read.',
  ],
  complexityHead: ['Operation', 'Matrix | Lists', 'Why'],
  complexity: [
    [
      'Memory',
      'O(n²) | O(n + E)',
      'The matrix stores every pair; the lists store only real edges.',
    ],
    ['Is there an edge u → v?', 'O(1) | O(deg u)', 'One cell read, against a scan of u’s list.'],
    [
      'List the neighbours of u',
      'O(n) | O(deg u)',
      'A full matrix row, against exactly u’s entries.',
    ],
    ['Add an edge', 'O(1) | O(1)', 'Set one cell, or append one entry (two when undirected).'],
    [
      'Visit every edge (BFS, DFS)',
      'O(n²) | O(n + E)',
      'Every row is scanned in full, against every list once.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Reset the graph (undirected, 5 vertices, 6 edges). How many entries do the adjacency lists hold in total at the last step?',
      answer: 12,
      unit: 'entries',
      hints: ['In an undirected graph every edge is stored once from each end.'],
      solution: 'Each of the 6 edges appears in two lists, so the lists hold 2 × 6 = 12 entries.',
    },
    {
      type: 'number',
      prompt:
        'A directed graph has 100 vertices and 300 edges. How many matrix cells hold 0 (no edge)?',
      answer: 9700,
      unit: 'cells',
      hints: ['The matrix has n² cells, and each directed edge fills exactly one of them.'],
      solution:
        'The matrix has 100² = 10,000 cells. 300 hold an edge, so 10,000 − 300 = 9,700 are 0. Lists would store just 300 entries.',
    },
    {
      type: 'choice',
      prompt: 'Which property does the adjacency matrix of every undirected graph have?',
      options: [
        'Every row has the same number of 1s.',
        'It is symmetric: matrix[u][v] = matrix[v][u].',
        'Its diagonal is all 1s.',
        'It has exactly E nonzero cells.',
      ],
      answer: 1,
      hints: ['Switch the widget between Directed and Undirected and compare row B with column B.'],
      solution:
        'An undirected edge u – v is written as both [u][v] and [v][u], so the matrix equals its transpose. It has 2E nonzero cells, and the diagonal is 0 without self loops.',
    },
    {
      type: 'choice',
      prompt:
        'A social network has a million users, each with about 200 friends. Which representation fits?',
      options: [
        'Adjacency matrix, because edge tests are O(1).',
        'Adjacency lists, because the graph is sparse.',
        'Either, they use the same memory.',
      ],
      answer: 1,
      hints: ['Compare n² with n + 2E for n = 10⁶ and E ≈ 10⁸.'],
      solution:
        'A matrix needs 10¹² cells. The lists need about n + 2E ≈ 2 × 10⁸ entries, thousands of times less, and BFS over them costs O(n + E).',
    },
  ],
  nextTeaser:
    'Next up: breadth-first search on a grid, which explores a graph layer by layer with a queue.',
};
