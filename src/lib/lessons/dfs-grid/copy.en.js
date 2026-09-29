/** @typedef {import('$lib/algo-engine/dfs-grid.js').DfsFrame} DfsFrame */

export const en = {
  slug: 'dfs-grid',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Depth-first search on a grid',
  intro:
    'DFS dives down one corridor as far as it can and backs up only when it is stuck. It reaches every cell BFS reaches, but the first path it finds to the goal is usually not the shortest.',
  instruction:
    'Draw walls by clicking or dragging over the grid, or press Enter on a focused cell. Move the start and goal, then play. Numbers show the order in which cells were visited. Compare the DFS path with the BFS shortest path.',
  toolLabel: 'Edit',
  tools: { wall: 'Walls', start: 'Move start', goal: 'Move goal' },
  randomMaze: 'Random walls',
  clearWalls: 'Clear walls',
  gridLabel: 'Grid. Use arrow keys to move, Enter to edit the focused cell.',
  blockedCell: 'Pick an open cell — start and goal cannot sit on a wall or on each other.',
  stackLabel: 'Stack (top first)',
  stackEmpty: 'empty',
  visitedLabel: 'Visited',
  pathLabel: 'DFS path length',
  bfsLabel: 'BFS shortest path',
  legend: {
    start: 'Start',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'On the stack',
    visited: 'Visited',
    current: 'Visiting',
    path: 'DFS path',
  },
  /** @param {number} cell @param {number} cols */
  coord(cell, cols) {
    return `(${Math.floor(cell / cols)},${cell % cols})`;
  },
  /** @param {number} cell @param {number} cols @param {string} kind @param {number} order */
  cellLabel(cell, cols, kind, order) {
    const where = `Row ${Math.floor(cell / cols)}, column ${cell % cols}`;
    return `${where}${kind ? `, ${kind}` : ''}${order >= 1 ? `, visit ${order}` : ''}`;
  },
  /** Confirmations for keyboard edits, which recolor a cell without changing the narration. */
  edits: {
    wallAdded: /** @param {string} at */ (at) => `Wall added at ${at}.`,
    wallRemoved: /** @param {string} at */ (at) => `Wall removed at ${at}.`,
    startMoved: /** @param {string} at */ (at) => `Start moved to ${at}.`,
    goalMoved: /** @param {string} at */ (at) => `Goal moved to ${at}.`,
  },
  /** @param {DfsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => en.coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Push the start onto the stack.';
      case 'pop':
        return `Pop ${at(f.current)} and visit it (visit ${f.order[f.current]}).`;
      case 'skip':
        return `${at(f.current)} was already visited: a stale copy, so skip it.`;
      case 'push':
        return `Push ${at(f.touched)}: open and not visited yet.`;
      case 'found':
        return `Reached the goal. Following parents back gives a path of ${f.path.length - 1} steps.`;
      case 'no-path':
        return 'The stack is empty and the goal was never reached — walls cut it off.';
    }
  },
  takeaways: [
    'DFS is BFS with a stack instead of a queue: the most recently discovered cell is explored next.',
    'A cell can be pushed several times before it is visited. Marking it visited when it is popped, and skipping the stale copies, keeps each parent link right.',
    'The first path DFS finds depends on the neighbor order, not on distance. On this grid it can be far longer than the BFS path.',
    'DFS keeps only the current branch and its pending neighbors, which is why it underlies maze generation, cycle detection, and topological sort.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O(V + E)',
      'Each cell is visited once, and each edge causes at most one push from each end.',
    ],
    [
      'Memory',
      'O(V + E)',
      'The stack can hold a duplicate entry per edge until the stale ones are skipped.',
    ],
  ],
  nextTeaser: 'Next up: Dijkstra’s algorithm, for when some cells cost more to cross than others.',
};
