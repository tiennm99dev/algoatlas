/** @typedef {import('$lib/algo-engine/dijkstra-grid.js').DijkstraFrame} DijkstraFrame */
import { gridCopy } from '../grid-copy.en.js';

export const en = {
  ...gridCopy,
  slug: 'dijkstra-grid',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Dijkstra’s algorithm on a grid',
  intro:
    'When some steps cost more than others, the path with the fewest steps is no longer the cheapest. Dijkstra’s algorithm always expands the cheapest known cell next, so when it reaches the goal it has found the cheapest route. A step costs the average of the two cells it joins: 1 on open ground, 5 inside mud, 3 onto or off it.',
  summary:
    'Watch Dijkstra’s algorithm find the cheapest route across a grid with mud, and see why a cell is final only when it is popped.',
  instruction:
    'Paint walls and mud, move the start and goal, then play. Numbers show the cheapest known cost to reach each cell.',
  tools: {
    wall: gridCopy.tools.wall,
    mud: 'Mud',
    start: gridCopy.tools.start,
    goal: gridCopy.tools.goal,
  },
  randomTerrain: 'Random terrain',
  clearTerrain: 'Clear',
  pqLabel: 'Priority queue (cheapest first)',
  pqEmpty: 'empty',
  /** @param {number} cell @param {number} cols @param {number} d */
  pqChip(cell, cols, d) {
    return `${en.coord(cell, cols)} ${d}`;
  },
  settledLabel: 'Settled',
  relaxLabel: 'Relaxations',
  costLabel: 'Dijkstra path cost',
  compareTitle: 'Same grid, fewest steps',
  /** @param {number} steps @param {number} cost */
  bfsRoute(steps, cost) {
    return `BFS route: ${steps} steps, cost ${cost}`;
  },
  /** @param {number} steps @param {number} cost */
  dijkstraRoute(steps, cost) {
    return `Dijkstra route: ${steps} steps, cost ${cost}`;
  },
  legend: {
    start: 'Start',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'In queue',
    visited: 'Settled',
    current: 'Expanding',
    stale: 'Stale copy, skipped',
    path: 'Dijkstra path',
    mud: 'Mud (cost 5)',
  },
  /** The hatch that marks mud is visual only, so the label states the cost. @param {boolean} mud */
  mudNote(mud) {
    return mud ? 'mud, cost 5' : '';
  },
  /** @param {number} dist */
  costNote(dist) {
    return dist >= 0 ? `best cost ${dist}` : '';
  },
  /** Confirmations for keyboard edits, which recolor a cell without changing the narration. */
  edits: {
    ...gridCopy.edits,
    mudAdded: /** @param {string} at */ (at) => `Mud added at ${at}.`,
    mudRemoved: /** @param {string} at */ (at) => `Mud removed at ${at}.`,
    terrainCleared: 'The mud under it was cleared.',
  },
  /** @param {DijkstraFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => en.coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Put the start in the queue at cost 0.';
      case 'pop':
        return `Pop ${at(f.current)} at cost ${f.popped}. Nothing cheaper is left in the queue, so its cost is final.`;
      case 'stale':
        return `Pop ${at(f.current)} at cost ${f.popped}, but a cheaper route of ${f.dist[f.current]} was found since: a stale entry, skip it.`;
      case 'relax':
        return f.improved
          ? `Going through ${at(f.current)} reaches ${at(f.touched)} for ${f.dist[f.touched]}, cheaper than before. Push a new entry; the old one will go stale.`
          : `${at(f.touched)} is open and unreached — its cost is ${f.dist[f.touched]} via ${at(f.current)}. Push it.`;
      case 'found':
        return `Reached the goal at cost ${f.popped}. The route has ${f.path.length - 1} steps.`;
      case 'no-path':
        return 'The queue is empty and the goal was never reached — walls cut it off.';
    }
  },
  takeaways: [
    'The priority queue replaces BFS’s queue: the cell with the smallest known cost always comes out next.',
    'A cell is final only when it is popped, not when it is first reached. A cheaper route may still turn up in between; watch the goal’s cost drop before it is settled.',
    'Instead of lowering an entry already in the queue, this version pushes a new one and skips the stale entry when it surfaces.',
    'With every cost equal, Dijkstra explores in the same rings as BFS. Negative costs break it; they need Bellman–Ford.',
    'Try painting a strip of mud across the direct route: the path bends around it whenever going around is cheaper than crossing.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O((V + E) log V)',
      'With V cells and E edges between open neighbors and a binary heap, each push and pop costs O(log V), and there is at most one push per relaxation.',
    ],
    ['Memory', 'O(V + E)', 'The queue can hold one entry per relaxation, stale ones included.'],
  ],
  nextTeaser:
    'That is every lesson so far. A* search, which aims Dijkstra at the goal with a distance estimate, is next on the roadmap.',
};
