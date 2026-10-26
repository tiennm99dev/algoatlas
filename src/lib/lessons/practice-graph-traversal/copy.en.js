/** @typedef {import('$lib/algo-engine/practice-graph-traversal.js').TraversalFrame} TraversalFrame */

/** @param {number} cell @param {number} cols */
const coord = (cell, cols) => `(${Math.floor(cell / cols)},${cell % cols})`;

export const en = {
  slug: 'practice-graph-traversal',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Practice: traversal problems',
  intro:
    'Most grid and graph puzzles are a BFS or a DFS in disguise; the skill is choosing the right one. BFS finds shortest paths and distances when every step costs the same, and it can start from many sources at once. DFS reaches every cell just as surely, but the first path it finds can be far from the shortest.',
  summary:
    'Solve grid puzzles with BFS or DFS, compare how many cells each visits and how long its path is, and spread a multi-source BFS from several fires at once.',
  instruction:
    'Load a puzzle, pick BFS or DFS and step through. The comparison panel runs both searches on the same grid, so you can see which visits fewer cells and which finds the shorter path. Edit the grid with the tools: walls, sources (up to 4) and the goal; click the goal again to remove it and let the search flood the whole map.',
  puzzleLabel: 'Puzzle',
  puzzles: { maze: 'Maze', field: 'Open field', fire: 'Three fires' },
  algoLabel: 'Search',
  algos: { bfs: 'BFS (queue)', dfs: 'DFS (stack)' },
  toolLabel: 'Edit',
  tools: { wall: 'Walls', source: 'Sources', goal: 'Goal' },
  gridLabel: 'Puzzle grid. Use arrow keys to move, Enter to edit the focused cell.',
  frontierLabel: { bfs: 'Queue (front first)', dfs: 'Stack (top first)' },
  frontierEmpty: 'empty',
  hotLabel: 'just added',
  compareTitle: 'Both searches on this grid',
  compareHead: ['', 'BFS', 'DFS'],
  compareRows: {
    visits: 'Cells visited',
    steps: 'Path length',
  },
  floodRows: {
    farthest: 'Farthest cell (BFS distance)',
    wrong: 'DFS labels above the true distance',
  },
  stats: {
    visits: 'Cells visited',
    adds: 'Added to the frontier',
    result: 'Path length',
    reach: 'Largest label',
  },
  legend: {
    source: 'Source',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'In the frontier',
    visited: 'Visited (number = distance or depth)',
    current: 'Taken now',
    stale: 'Stale copy, skipped',
    path: 'Path found',
  },
  states: {
    source: 'Source',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'In the frontier',
    visited: 'Visited',
    current: 'Taken now',
    stale: 'Stale copy, skipped',
    path: 'On the path',
  },
  /** @param {number} d */
  labelNote: (d) => (d >= 0 ? `label ${d}` : ''),
  /** @param {number} cell @param {number} cols @param {string} kind @param {string} note */
  cellLabel(cell, cols, kind, note) {
    const where = `Row ${Math.floor(cell / cols)}, column ${cell % cols}`;
    return [where, kind, note].filter(Boolean).join(', ');
  },
  coord,
  edits: {
    /** @param {string} at */
    wallAdded: (at) => `Wall added at ${at}.`,
    /** @param {string} at */
    wallRemoved: (at) => `Wall removed at ${at}.`,
    /** @param {string} at */
    sourceAdded: (at) => `Source added at ${at}.`,
    /** @param {string} at */
    sourceRemoved: (at) => `Source removed at ${at}.`,
    /** @param {string} at */
    goalMoved: (at) => `Goal moved to ${at}.`,
    goalRemoved: 'Goal removed: the search now floods every reachable cell.',
    blocked: 'That cell is taken. Sources, the goal and walls cannot share a cell.',
    tooManySources: 'Use at most 4 sources.',
    lastSource: 'Keep at least one source.',
  },
  /**
   * @param {TraversalFrame} f @param {number} cols @param {'bfs' | 'dfs'} algo
   * @param {number} sources @param {boolean} hasGoal
   */
  describe(f, cols, algo, sources, hasGoal) {
    const at = (/** @type {number} */ c) => coord(c, cols);
    const many = sources > 1;
    switch (f.kind) {
      case 'start':
        return algo === 'bfs'
          ? many
            ? `Put all ${sources} sources in the queue at distance 0: one BFS spreads from all of them at once.`
            : 'Put the source in the queue at distance 0.'
          : many
            ? `Push all ${sources} sources onto the stack at depth 0.`
            : 'Push the source onto the stack at depth 0.';
      case 'take':
        return algo === 'bfs'
          ? `Dequeue ${at(f.current)}, at distance ${f.label[f.current]}.`
          : `Pop ${at(f.current)} and visit it at depth ${f.label[f.current]}.`;
      case 'skip':
        return `${at(f.current)} was already visited: a stale copy, so skip it.`;
      case 'add':
        return algo === 'bfs'
          ? `Enqueue ${at(f.touched)} at distance ${f.label[f.touched]}.`
          : `Push ${at(f.touched)}: open and not visited yet.`;
      case 'found':
        return `Reached the goal after ${f.visits} visits. The path back has ${f.path.length - 1} steps.`;
      case 'done':
        if (hasGoal)
          return 'The frontier is empty and the goal was never reached: walls cut it off.';
        return algo === 'bfs'
          ? 'The queue is empty: every reachable cell has its distance to the nearest source.'
          : 'The stack is empty: every reachable cell is visited, but its label is only the length of the path DFS took.';
    }
  },
  takeaways: [
    'Shortest path in an unweighted grid or graph: BFS. It expands cells in order of distance, so the first time it reaches the goal, the path is shortest.',
    'Reachability, counting regions, or exploring every path: either works, and DFS is often the simpler code. Its first path to the goal can be much longer than the shortest one.',
    'Multi-source BFS puts every source in the queue at distance 0. One O(rows × cols) run then gives every cell its distance to the nearest source, instead of one BFS per source.',
    'Visit counts depend on the grid: DFS may hit the goal early by luck, or wander across the whole map first, while BFS visits every cell closer than the goal.',
    'Try it: load the Open field and compare the two path lengths, then load Three fires and switch to DFS to see how many labels go wrong.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    [
      'BFS or DFS on a grid',
      'O(rows × cols)',
      'Each cell is visited once and has at most 4 neighbours to check.',
    ],
    [
      'Multi-source BFS, k sources',
      'O(rows × cols)',
      'All sources share one queue, so the cost does not grow with k.',
    ],
    ['One BFS per source', 'O(k × rows × cols)', 'Each run may sweep the whole grid again.'],
    [
      'Memory',
      'O(rows × cols)',
      'Labels and parents per cell, plus the queue or stack (DFS may hold stale copies).',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load the Maze and run BFS. How many steps long is the path it finds?',
      answer: 24,
      unit: 'steps',
      hints: ['Step to the end; the narration and the comparison panel give the length.'],
      solution:
        'BFS reaches the goal along a 24-step path, and because BFS explores by distance, no shorter path exists.',
    },
    {
      type: 'number',
      prompt: 'On the Maze, how many more cells does BFS visit than DFS before reaching the goal?',
      answer: 27,
      unit: 'cells',
      hints: ['Read the Cells visited row of the comparison panel for both searches.'],
      solution:
        'BFS visits 52 cells and DFS 25, a difference of 27. The corridors left DFS few wrong turns, and its path is also 24 steps here, but that is luck, not a guarantee.',
    },
    {
      type: 'number',
      prompt: 'Load the Open field. How many steps long is the path DFS finds?',
      answer: 89,
      unit: 'steps',
      hints: [
        'Switch to DFS and step to the end, or read the Path length row.',
        'DFS runs along the top row, down the right edge, then snakes back and forth.',
      ],
      solution:
        'DFS snakes through 90 cells and returns an 89-step path. BFS finds the 7-step path straight down the left edge.',
    },
    {
      type: 'number',
      prompt:
        'Load Three fires. Each minute the fire spreads to the open neighbours of every burning cell. After how many minutes is every reachable cell burning?',
      answer: 6,
      unit: 'minutes',
      hints: [
        'Each minute is one BFS layer, and all three fires start in the queue at distance 0.',
        'Run BFS to the end and find the largest distance label.',
      ],
      solution:
        'Multi-source BFS labels each cell with the minute it catches fire. The largest label is 6, so the whole map burns after 6 minutes.',
    },
    {
      type: 'number',
      prompt:
        'On Three fires, switch to DFS. How many cells end with a label larger than their true distance to the nearest fire?',
      answer: 76,
      unit: 'cells',
      hints: ['Read the last row of the comparison panel.'],
      solution:
        'DFS labels 76 of the 84 open cells with a depth larger than the BFS distance. DFS depths measure the path DFS happened to take, not the shortest one.',
    },
    {
      type: 'choice',
      prompt:
        'A puzzle asks for the fewest moves for a knight to reach a square on an empty board. Which search fits?',
      options: [
        'DFS, because it uses less memory.',
        'BFS, because every move costs the same and it finds the fewest moves.',
        'Either; they always return the same path.',
        'Neither; only Dijkstra can count moves.',
      ],
      answer: 1,
      hints: ['Is the question about a shortest path with equal step costs?'],
      solution:
        'Knight moves form an unweighted graph and the question asks for a shortest path, which is exactly what BFS gives. Dijkstra also works but is unnecessary when every step costs 1.',
    },
  ],
  nextTeaser: 'Next up: Review: foundations, a quiz across every topic of the first level.',
};
