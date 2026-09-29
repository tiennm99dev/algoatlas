/** @typedef {import('$lib/algo-engine/graph.js').BfsFrame} BfsFrame */

export const en = {
  slug: 'bfs-grid',
  topic: 'graphs',
  level: 'Beginner',
  title: 'Breadth-first search on a grid',
  intro:
    'BFS explores a graph in rings: first every cell one step from the start, then every cell two steps away, and so on. Because of that order, the first time it reaches the goal it has found a shortest path.',
  instruction:
    'Draw walls by clicking or dragging over the grid, move the start and goal, then play the search. Numbers show each cell’s distance from the start.',
  toolLabel: 'Edit',
  tools: { wall: 'Walls', start: 'Move start', goal: 'Move goal' },
  randomMaze: 'Random walls',
  clearWalls: 'Clear walls',
  gridLabel: 'Grid. Use arrow keys to move, Enter to edit the focused cell.',
  queueLabel: 'Queue (front first)',
  queueEmpty: 'empty',
  visitedLabel: 'Visited',
  pathLabel: 'Path length',
  legend: {
    start: 'Start',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'In queue',
    visited: 'Visited',
    current: 'Expanding',
    path: 'Shortest path',
  },
  /** @param {number} cell @param {number} cols */
  coord(cell, cols) {
    return `(${Math.floor(cell / cols)},${cell % cols})`;
  },
  /** @param {number} cell @param {number} cols @param {string} kind */
  cellLabel(cell, cols, kind) {
    return `Row ${Math.floor(cell / cols)}, column ${cell % cols}${kind ? `, ${kind}` : ''}`;
  },
  /** @param {BfsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => this.coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Put the start in the queue at distance 0.';
      case 'dequeue':
        return `Dequeue ${at(f.current)} at distance ${f.dist[f.current]}.`;
      case 'enqueue':
        return `${at(f.touched)} is open and unseen — record distance ${f.dist[f.touched]} and enqueue it.`;
      case 'found':
        return `Reached the goal. Following parents back gives a shortest path of ${f.path.length - 1} steps.`;
      case 'no-path':
        return 'The queue is empty and the goal was never reached — walls cut it off.';
    }
  },
  takeaways: [
    'The queue is the whole trick: first in, first out means cells are expanded in order of distance.',
    'Marking a cell visited when it is enqueued — not when it is dequeued — stops it from entering the queue twice.',
    'BFS finds shortest paths only when every step costs the same. With weighted edges you need Dijkstra’s algorithm.',
    'Swap the queue for a stack and you get depth-first search: it still reaches everything, but its first path is rarely the shortest.',
  ],
  complexity: [
    ['Time', 'O(V + E)', 'Each cell is enqueued once and each edge is checked once.'],
    ['Memory', 'O(V)', 'The visited set and the queue can each hold every cell.'],
  ],
  nextTeaser: 'Next up: depth-first search and Dijkstra’s algorithm on the same grid.',
};
