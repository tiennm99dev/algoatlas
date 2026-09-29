/** @typedef {import('$lib/algo-engine/dijkstra-grid.js').DijkstraFrame} DijkstraFrame */

export const en = {
  slug: 'dijkstra-grid',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Dijkstra’s algorithm on a grid',
  intro:
    'When some steps cost more than others, the path with the fewest steps is no longer the cheapest. Dijkstra’s algorithm always expands the cheapest known cell next, so when it reaches the goal it has found the cheapest route.',
  instruction:
    'Paint walls and mud, move the start and goal, then play. A step costs the average of the two cells it joins: 1 on open ground, 5 inside mud, 3 onto or off it. Numbers show the cheapest known cost to reach each cell.',
  toolLabel: 'Edit',
  tools: { wall: 'Walls', mud: 'Mud', start: 'Move start', goal: 'Move goal' },
  randomTerrain: 'Random terrain',
  clearTerrain: 'Clear',
  gridLabel: 'Grid. Use arrow keys to move, Enter to edit the focused cell.',
  blockedCell: 'Pick an open cell — start and goal cannot sit on a wall or on each other.',
  pqLabel: 'Priority queue (cheapest first)',
  pqEmpty: 'empty',
  /** @param {number} cell @param {number} cols @param {number} d */
  pqChip(cell, cols, d) {
    return `${en.coord(cell, cols)} ${d}`;
  },
  settledLabel: 'Settled',
  relaxLabel: 'Relaxations',
  costLabel: 'Path cost',
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
    path: 'Cheapest path',
    mud: 'Mud (cost 5)',
  },
  /** @param {number} cell @param {number} cols */
  coord(cell, cols) {
    return `(${Math.floor(cell / cols)},${cell % cols})`;
  },
  /**
   * The hatch that marks mud is visual only, so the label states the cost.
   * @param {number} cell @param {number} cols @param {string} kind @param {boolean} mud
   * @param {number} dist
   */
  cellLabel(cell, cols, kind, mud, dist) {
    const where = `Row ${Math.floor(cell / cols)}, column ${cell % cols}`;
    return `${where}${kind ? `, ${kind}` : ''}${mud ? ', mud, cost 5' : ''}${dist >= 0 ? `, best cost ${dist}` : ''}`;
  },
  /** Confirmations for keyboard edits, which recolor a cell without changing the narration. */
  edits: {
    wallAdded: /** @param {string} at */ (at) => `Wall added at ${at}.`,
    wallRemoved: /** @param {string} at */ (at) => `Wall removed at ${at}.`,
    mudAdded: /** @param {string} at */ (at) => `Mud added at ${at}.`,
    mudRemoved: /** @param {string} at */ (at) => `Mud removed at ${at}.`,
    startMoved: /** @param {string} at */ (at) => `Start moved to ${at}.`,
    goalMoved: /** @param {string} at */ (at) => `Goal moved to ${at}.`,
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
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O((V + E) log V)',
      'With a binary heap, each push and pop costs O(log V), and there is at most one push per relaxation.',
    ],
    ['Memory', 'O(V + E)', 'The queue can hold one entry per relaxation, stale ones included.'],
  ],
  nextTeaser: 'Next up: A* search, which aims Dijkstra at the goal with a distance estimate.',
};
