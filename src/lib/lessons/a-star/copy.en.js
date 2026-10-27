/** @typedef {import('$lib/algo-engine/a-star.js').AStarFrame} AStarFrame */
/** @typedef {import('$lib/algo-engine/a-star.js').Heuristic} Heuristic */
import { gridCopy } from '../grid-copy.en.js';

export const en = {
  ...gridCopy,
  slug: 'a-star',
  topic: 'shortest-paths',
  level: 'Advanced',
  title: 'A* search',
  intro:
    'Dijkstra’s algorithm spreads out evenly in every direction, even away from the goal. A* search adds a heuristic h(n), an estimate of the cost still to go from n to the goal, and always expands the cell with the smallest f(n) = g(n) + h(n), where g(n) is the cost already paid. With a heuristic that never overestimates, A* still finds a shortest path, while expanding far fewer cells.',
  summary:
    'Compare how many cells Dijkstra and A* expand on a grid, and see how the heuristic h decides both the speed and the quality of the path.',
  instruction:
    'Pick a heuristic and play. Switch the cell numbers between g, h and f to see what A* compares. The comparison panel runs all three heuristics on the same grid: draw walls, or move the start and goal, and watch the counts change.',
  heuristicLabel: 'Heuristic',
  heuristics: {
    zero: 'h = 0 (Dijkstra)',
    manhattan: 'Manhattan',
    triple: '3 × Manhattan',
  },
  numbersLabel: 'Cell numbers',
  numbers: { g: 'g', h: 'h', f: 'f' },
  clearWalls: 'Clear walls',
  resetGrid: 'Reset grid',
  hotLabel: 'just pushed',
  openLabel: 'Open set (next to pop first)',
  openEmpty: 'empty',
  /** @param {string} at @param {number} g @param {number} h @param {boolean} stale */
  openChip: (at, g, h, stale) => `${at} f ${g + h} = ${g} + ${h}${stale ? ' (stale)' : ''}`,
  stats: {
    expanded: 'Cells expanded',
    pushes: 'Pushes',
    path: 'Path length',
  },
  compareTitle: 'All three heuristics on this grid',
  compareHead: ['Heuristic', 'Expanded', 'Path'],
  noPath: 'none',
  legend: {
    start: 'Start',
    goal: 'Goal',
    wall: 'Wall',
    frontier: 'In the open set',
    closed: 'Expanded (closed)',
    current: 'Expanding now',
    path: 'Path found',
  },
  /** @param {string} which @param {number | null} value */
  numberNote: (which, value) => (value === null ? '' : `${which} ${value}`),
  /**
   * @param {AStarFrame} f
   * @param {number} cols
   * @param {Heuristic} kind
   * @param {(cell: number) => number} h
   */
  describe(f, cols, kind, h) {
    const at = (/** @type {number} */ c) => en.coord(c, cols);
    const g = (/** @type {number} */ c) => f.g[c];
    const fOf = (/** @type {number} */ c) => `f = g + h = ${g(c)} + ${h(c)} = ${g(c) + h(c)}`;
    switch (f.kind) {
      case 'start': {
        const s = f.open[0]?.[0] ?? -1;
        return kind === 'zero'
          ? 'Put the start in the open set with g = 0. With h = 0 everywhere, f = g and A* is exactly Dijkstra.'
          : `Put the start in the open set with g = 0 and f = h(start) = ${h(s)}.`;
      }
      case 'pop':
        return `Pop ${at(f.current)} with ${fOf(f.current)}, the smallest f in the open set, and close it.`;
      case 'stale':
        return `Pop ${at(f.current)}, but it is already closed or was reached more cheaply since: a stale entry, skip it.`;
      case 'push':
        return f.improved
          ? `${at(f.touched)} is reached more cheaply through ${at(f.current)}: ${fOf(f.touched)}. Push a new entry.`
          : `${at(f.touched)}: g = ${g(f.current)} + 1 = ${g(f.touched)} and h = ${h(f.touched)}, so f = ${g(f.touched) + h(f.touched)}. Push it.`;
      case 'found':
        return kind === 'triple'
          ? `Reached the goal after expanding ${f.closed.length} cells. The path has ${f.path.length - 1} steps, but 3 × Manhattan can overestimate, so it may not be the shortest.`
          : `Reached the goal after expanding ${f.closed.length} cells. The path has ${f.path.length - 1} steps, and it is a shortest path because h never overestimates.`;
      case 'no-path':
        return 'The open set is empty and the goal was never reached: walls cut it off.';
    }
  },
  takeaways: [
    'A* expands the cell with the smallest f = g + h: g is the cost paid from the start, h an estimate of the cost still to go. With h = 0 it is exactly Dijkstra.',
    'A heuristic is admissible when it never overestimates the true remaining cost; then A* returns a shortest path. On a 4-connected grid with steps of cost 1, the Manhattan distance |Δrow| + |Δcol| is admissible.',
    'A heuristic is consistent when h(n) ≤ cost(n, n′) + h(n′) for every step. Then f never decreases along a path, so a closed cell never needs reopening. Consistent implies admissible; the Manhattan distance is both here.',
    'A better-informed admissible heuristic expands fewer cells. An overestimating one, such as 3 × Manhattan, rushes toward the goal and can return a longer path, sometimes without even saving work.',
    'Try it: on the starting grid, compare the Expanded column of the three heuristics, then step through 3 × Manhattan and watch it dive into the pocket under the bar.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    [
      'Worst case',
      'O((V + E) log V)',
      'Like Dijkstra with a binary heap: with h = 0, or a heuristic that gives no guidance, every cell may be expanded.',
    ],
    [
      'Good heuristic',
      'Far fewer expansions',
      'Only cells with f below the shortest path’s cost must be expanded; the closer h is to the true distance, the fewer those are.',
    ],
    ['Memory', 'O(V)', 'g, parent and closed flags per cell, plus the open set.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'On the starting grid, how many cells does h = 0 (Dijkstra) expand before it reaches the goal?',
      answer: 118,
      unit: 'cells',
      tolerance: 0,
      hints: ['Read the Expanded column of the comparison panel, or play h = 0 to the end.'],
      solution:
        'Dijkstra expands 118 cells. It spreads in every direction, away from the goal too, until the goal’s turn comes at distance 15.',
    },
    {
      type: 'number',
      prompt: 'On the same grid, how many cells does A* with the Manhattan heuristic expand?',
      answer: 36,
      unit: 'cells',
      tolerance: 0,
      hints: ['Same panel, the Manhattan row.'],
      solution:
        'Only 36 cells, less than a third of Dijkstra’s 118, and the path is still the shortest one, 15 steps.',
    },
    {
      type: 'number',
      prompt: 'How many steps long is the path that 3 × Manhattan returns on the starting grid?',
      answer: 21,
      unit: 'steps',
      tolerance: 0,
      hints: ['It dives into the pocket under the bar and has to go round the bottom of the wall.'],
      solution:
        'It returns a 21-step path, 6 steps longer than the shortest one. The heuristic overestimates, so A* trusts it too much and commits to the pocket.',
    },
    {
      type: 'multi',
      prompt:
        'Which heuristics are admissible on a 4-connected grid where each step costs 1? Select all that apply.',
      options: [
        'h = 0',
        'The Manhattan distance',
        '3 × the Manhattan distance',
        'The straight-line (Euclidean) distance',
      ],
      answers: [0, 1, 3],
      hints: [
        'Admissible means h(n) is never more than the true cost of the cheapest path from n to the goal.',
        'Any path on the grid needs at least |Δrow| + |Δcol| steps, and the straight line is never longer than that.',
      ],
      solution:
        'h = 0, Manhattan and Euclidean never exceed the true remaining cost, so all three are admissible; Manhattan is the best informed of them. 3 × Manhattan overestimates: one step from the goal it says 3.',
    },
  ],
  nextTeaser:
    'Next up: Practice: shortest-path problems, where you pick the right algorithm for each scenario and watch it run.',
};
