/** @typedef {import('$lib/algo-engine/graph.js').BfsFrame} BfsFrame */
import { gridCopy } from '../grid-copy.en.js';

export const en = {
  ...gridCopy,
  slug: 'bfs-grid',
  topic: 'graphs',
  level: 'Beginner',
  title: 'Breadth-first search on a grid',
  intro:
    'BFS explores a graph in rings: first every cell one step from the start, then every cell two steps away, and so on. Because of that order, the first time it reaches the goal it has found a shortest path.',
  summary:
    'Watch breadth-first search expand in rings on a grid you draw, and see why its first path to the goal is a shortest one.',
  instruction:
    'Draw walls by clicking or dragging over the grid, or press Enter on a focused cell. Move the start and goal, then play the search. Numbers show each cell’s distance from the start.',
  randomMaze: 'Random walls',
  clearWalls: 'Clear walls',
  queueLabel: 'Queue (front first)',
  queueEmpty: 'empty',
  discoveredLabel: 'Discovered',
  pathLabel: 'BFS path length',
  legend: {
    start: 'Start',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'In queue',
    visited: 'Visited',
    current: 'Expanding',
    path: 'BFS path',
  },
  /** @param {number} dist */
  distanceNote(dist) {
    return dist >= 0 ? `distance ${dist}` : '';
  },
  /** @param {BfsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => en.coord(c, cols);
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
    'Try drawing a wall across the grid with one gap: the rings squeeze through the gap and the shortest path bends around the wall.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O(V + E)',
      'With V cells and E edges between open neighbors, each cell is enqueued at most once, and each edge is examined at most twice — once from each end.',
    ],
    ['Memory', 'O(V)', 'The visited set and the queue can each hold every cell.'],
  ],
  nextTeaser:
    'Next up: depth-first search on the same grid, then Dijkstra’s algorithm when some cells cost more to cross.',
};
