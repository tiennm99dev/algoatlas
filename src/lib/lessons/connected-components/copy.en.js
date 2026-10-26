/** @typedef {import('$lib/algo-engine/connected-components.js').ComponentsFrame} ComponentsFrame */

/** @param {number} cell @param {number} cols */
const coord = (cell, cols) => `(${Math.floor(cell / cols)},${cell % cols})`;

export const en = {
  slug: 'connected-components',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Connected components and flood fill',
  intro:
    'A connected component is a largest group of vertices in which every vertex can reach every other. To find them all, scan the vertices and start a BFS or DFS from each one that has no label yet: that search, a flood fill, labels exactly one component. On a map of land and water, each component is an island.',
  summary:
    'Paint islands on a map and watch flood fill label each connected component, with 4 or 8 directions of connection.',
  instruction:
    'Click or drag over the map to turn water into land and back, or press Enter on a focused cell. Pick 4 or 8 directions, then step through: the scan finds an unlabelled land cell, and the flood gives its whole island one number before the scan moves on.',
  connectivityLabel: 'Neighbours',
  connectivity: { 4: '4 directions', 8: '8 directions' },
  randomMap: 'Random map',
  clearMap: 'All water',
  resetMap: 'Reset map',
  gridLabel:
    'Map. Use arrow keys to move, Enter to switch the focused cell between land and water.',
  queueLabel: 'Flood queue (front first)',
  queueEmpty: 'empty',
  hotLabel: 'just labelled',
  stats: {
    islands: 'Islands found',
    labelled: 'Land cells labelled',
    checks: 'Neighbour checks',
    largest: 'Largest island',
  },
  legend: {
    water: 'Water',
    land: 'Land, no label yet',
    current: 'Expanding now',
    queued: 'Labelled, in the queue',
    island: 'Island (its number is shown)',
  },
  states: {
    water: 'Water',
    land: 'Land, no label',
    current: 'expanding',
    queued: 'in the queue',
  },
  /** @param {number} k */
  islandNote: (k) => `island ${k}`,
  /** @param {number} cell @param {number} cols @param {string} kind @param {string} note */
  cellLabel(cell, cols, kind, note) {
    const where = `Row ${Math.floor(cell / cols)}, column ${cell % cols}`;
    return [where, kind, note].filter(Boolean).join(', ');
  },
  coord,
  edits: {
    /** @param {string} at */
    landAdded: (at) => `Land added at ${at}.`,
    /** @param {string} at */
    landRemoved: (at) => `Water at ${at}.`,
  },
  /** @param {ComponentsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'No cell has a label yet. Scan the map row by row.';
      case 'new-island':
        return `${at(f.current)} is land with no label: a new island. Label it ${f.count} and start a flood from it.`;
      case 'expand':
        return `Dequeue ${at(f.current)} and look at its neighbours.`;
      case 'label':
        return `${at(f.touched)} is unlabelled land next to ${at(f.current)}: label it ${f.count} and enqueue it.`;
      case 'done':
        return `Scan finished: ${f.count} ${f.count === 1 ? 'island' : 'islands'}, after ${f.checks} neighbour checks.`;
    }
  },
  takeaways: [
    'A connected component is a maximal set of vertices that can all reach each other. Every vertex belongs to exactly one component.',
    'Flood fill is a BFS or DFS started from one cell: everything it reaches gets the same label, and it stops at water, walls and the map edge.',
    'Counting islands is an outer scan plus flood fill: each unlabelled land cell starts a new island, and labels stop the scan from counting a cell twice.',
    'The whole job is O(V + E): every cell is labelled once and every neighbour pair is checked from each side. On a grid that is O(rows × cols).',
    'Try it: draw a diagonal chain of land and switch between 4 and 8 directions. The island count changes, because the definition of a neighbour defines the graph.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time, graph',
      'O(V + E)',
      'The scan visits each vertex once and each flood checks each edge from both ends.',
    ],
    [
      'Time, grid',
      'O(rows × cols)',
      'Each cell has at most 4 (or 8) neighbours, so E is a constant times V.',
    ],
    [
      'Memory',
      'O(V)',
      'One label per vertex plus the flood queue, which never holds a vertex twice.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'On the starting map with 4 directions, how many islands does the scan find?',
      answer: 9,
      unit: 'islands',
      hints: ['Press Last step and read the Islands found counter.'],
      solution:
        'Nine islands: three diagonal single cells near the left count separately, because cells that touch only at a corner are not neighbours with 4 directions.',
    },
    {
      type: 'number',
      prompt: 'Switch the starting map to 8 directions. How many islands now?',
      answer: 7,
      unit: 'islands',
      hints: ['Which islands touch each other only at a corner?'],
      solution:
        'The diagonal chain (3,1), (4,2), (5,3) becomes one island of 3 cells, so 9 − 2 = 7 islands remain.',
    },
    {
      type: 'number',
      prompt: 'How many cells does the largest island of the starting map have?',
      answer: 7,
      unit: 'cells',
      hints: ['Watch the Largest island counter, or count the cells that share the biggest label.'],
      solution:
        'The island around (5,7) to (7,7) has 7 cells with either neighbour rule: (5,7), (5,8), (5,9), (6,6), (6,7), (6,9) and (7,7).',
    },
    {
      type: 'choice',
      prompt: 'Why does the scan never count the same island twice?',
      options: [
        'It only starts a flood on land cells that have no label yet.',
        'It scans the map from both ends.',
        'Each island is guaranteed to start in the first row.',
        'It restarts the scan after every flood.',
      ],
      answer: 0,
      hints: ['Look at line 3 of the pseudocode.'],
      solution:
        'The first flood labels every cell of the island. When the scan later reaches another cell of it, the cell already has a label, so no new flood starts.',
    },
  ],
  nextTeaser:
    'Next up: topological sort, which orders the tasks of a dependency graph so each comes after everything it needs.',
};
