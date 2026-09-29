/** @typedef {import('$lib/algo-engine/dfs-grid.js').DfsFrame} DfsFrame */
import { gridCopy } from '../grid-copy.en.js';

export const en = {
  ...gridCopy,
  slug: 'dfs-grid',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Depth-first search on a grid',
  intro:
    'DFS dives down one corridor as far as it can and backs up only when it is stuck. It reaches every cell BFS reaches, but the first path it finds to the goal is usually not the shortest.',
  summary:
    'Watch depth-first search dive down corridors on a grid you draw, and compare its path with the BFS shortest path.',
  instruction:
    'Draw walls by clicking or dragging over the grid, or press Enter on a focused cell. Move the start and goal, then play. Numbers show the order in which cells were visited. Compare the DFS path with the BFS shortest path.',
  randomMaze: 'Random walls',
  clearWalls: 'Clear walls',
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
    current: 'Expanding',
    stale: 'Stale copy, skipped',
    path: 'DFS path',
  },
  /** @param {number} order */
  visitNote(order) {
    return order >= 1 ? `visit ${order}` : '';
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
    'Try “Random walls”, then compare the DFS path length with the BFS shortest path in the two counters.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O(V + E)',
      'With V cells and E edges between open neighbors, each cell is visited once, and each edge causes at most one push from each end.',
    ],
    [
      'Memory',
      'O(V + E)',
      'The stack can hold a duplicate entry per edge until the stale ones are skipped.',
    ],
  ],
  nextTeaser: 'Next up: Dijkstra’s algorithm, for when some cells cost more to cross than others.',
};
