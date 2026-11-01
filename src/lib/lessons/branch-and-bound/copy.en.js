/** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbFrame} BnbFrame */
/** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbNode} BnbNode */
/** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbItem} BnbItem */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => String(Math.round(v * 100) / 100);

export const en = {
  slug: 'branch-and-bound',
  topic: 'backtracking',
  level: 'Advanced',
  title: 'Branch and bound',
  intro:
    'Plain backtracking prunes a branch that breaks a rule. In an optimisation problem, a branch can break no rule and still be useless, because it can never beat the best answer found so far. Branch and bound gives each node a bound, an optimistic limit on anything reachable from it, and drops a node as soon as that limit cannot beat the best so far.',
  summary:
    'Solve a 0/1 knapsack with branch and bound, and watch nodes get pruned when their bound cannot beat the best value found so far.',
  instruction:
    'Step through the search and compare each new node’s bound with Best so far. Switch Search order and compare Nodes made. Type your own items as weight:value pairs, or click or press Enter on a node to jump to the moment it was made.',
  /** @param {number} capacity */
  problem: (capacity) =>
    `Pack the items into a bag of capacity ${capacity} for the highest total value. Each item is taken whole or not at all.`,
  orderLabel: 'Search order',
  orders: { best: 'Best-first', depth: 'Depth-first' },
  itemsLabel: 'Items, weight:value',
  capacityLabel: 'Capacity',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    classic: 'Four items',
    greedy: 'Greedy falls short',
    order: 'Order matters',
  },
  /** @param {number} maxItems @param {number} maxNumber */
  itemsError: (maxItems, maxNumber) =>
    `Enter 1 to ${maxItems} items as weight:value, each a whole number from 1 to ${maxNumber}.`,
  /** @param {number} max */
  capacityError: (max) => `The capacity must be a whole number from 1 to ${max}.`,
  itemsTitle: 'Items, best value per weight first',
  itemHead: { name: 'Item', weight: 'Weight', value: 'Value', ratio: 'Value / weight' },
  /** @param {number} v */
  ratio: (v) => num(v),
  treeTitle: 'Search tree',
  treeNote:
    'A circle shows the value packed so far, and “≤” below it is the bound: the most any completion can reach. An edge takes an item (+) or leaves it out (−).',
  treeAria: 'Search tree of the knapsack, built as it runs.',
  /** @param {BnbItem} item @param {boolean} took */
  edge: (item, took) => `${took ? '+' : '−'}${item.name}`,
  /** @param {number} bound */
  boundNote: (bound) => `≤${Math.round(bound * 10) / 10}`,
  overNote: 'over',
  /** @param {BnbNode} n */
  nodeLabel: (n) => {
    const state = {
      frontier: 'waiting in the frontier',
      active: 'acted on now',
      expanded: 'expanded',
      pruned: 'pruned',
      over: 'over capacity',
    }[n.status];
    return `Node with value ${n.value}, weight ${n.weight}, bound ${num(n.bound)}, ${state}.`;
  },
  markers: { best: '★', pruned: '✂', over: '×' },
  legend: {
    active: 'Acted on now',
    frontier: 'Waiting in the frontier',
    expanded: 'Expanded',
    best: 'Best so far',
    path: 'The best packing',
    pruned: 'Pruned, or × over capacity',
  },
  stats: {
    best: 'Best so far',
    made: 'Nodes made',
    expanded: 'Expanded',
    pruned: 'Pruned',
  },
  /** @param {number} plain */
  plainNote: (plain) => `With no bound: ${plain}.`,
  frontierTitle: 'Frontier, next first',
  frontierEmpty: 'Empty.',
  /** @param {BnbNode} n */
  frontierChip: (n) => `${n.value} ≤${num(n.bound)}`,
  packingTitle: 'Best packing so far',
  packingEmpty: 'Nothing packed yet.',
  /** @param {BnbFrame} f */
  describe(f) {
    const n = f.current >= 0 ? f.nodes[f.current] : null;
    const decided = n && n.level > 0 ? f.items[n.level - 1].name : '';
    const branch = n && n.took ? `Take ${decided}` : `Leave ${decided} out`;
    switch (f.kind) {
      case 'start':
        return `Start at the root. With nothing decided, the bound is ${num(n?.bound ?? 0)}: pack items in order, then a fraction of the first that does not fit. No packing can beat it.`;
      case 'pop':
        return f.order === 'best'
          ? `The frontier’s highest bound is ${num(n?.bound ?? 0)}, above the best of ${f.best}. Expand this node.`
          : `Take the latest node, with bound ${num(n?.bound ?? 0)}, above the best of ${f.best}. Expand it.`;
      case 'prunePop':
        return `This node’s bound ${num(n?.bound ?? 0)} no longer beats the best of ${f.best}. The best improved while it waited. Prune it.`;
      case 'over':
        return `${branch}: the weight ${n?.weight} is over the capacity ${f.capacity}. Discard this branch.`;
      case 'better':
        return `${branch}: value ${n?.value} is a new best, because this packing fits with everything else left out.`;
      case 'push':
        return `${n?.took ? `Take ${decided}` : `Leave ${decided} out`}: value ${n?.value}, bound ${num(n?.bound ?? 0)}. The bound beats the best of ${f.best}, so add it to the frontier.`;
      case 'pruneChild':
        return `${n?.took ? `Take ${decided}` : `Leave ${decided} out`}: bound ${num(n?.bound ?? 0)} cannot beat the best of ${f.best}. Prune it, with everything below it.`;
      case 'done':
        return `The frontier is empty, so ${f.best} is the optimum. ${plural(f.nodes.length, 'node', 'nodes')} made, ${f.expanded} expanded, ${f.pruned} pruned.`;
    }
  },
  takeaways: [
    'A bound is an optimistic limit on a whole subtree. When maximising, it is an upper bound, and a node is pruned when that is not above the best so far. When minimising, flip it: use a lower bound, and prune when it is not below the best.',
    'A good bound is cheap and tight. The knapsack bound relaxes “whole items only” to allow a fraction of one, and the relaxed problem is solved by a greedy rule in O(n). Relaxing a rule is the usual way to get a bound.',
    'A prune is safe only if the bound is never too low. A bound that underestimates could throw away the real answer without any sign that it happened.',
    'Search order changes the work, not the answer. Best-first never expands a node whose bound is below the optimum, but its frontier can grow large. Depth-first holds only about one path, and it reaches a first full answer quickly.',
    'Load Order matters and switch Search order: Nodes made goes from 27 to 71, and 121 with no bound. Then raise an item’s value until the optimum changes, and watch which branches open up.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Sort items', 'O(n log n)', 'Done once, so the bound can read items in order.'],
    ['A bound', 'O(n)', 'A greedy pass over the undecided items.'],
    ['Nodes, worst case', 'O(2ⁿ)', 'A weak bound prunes little, so this is still exponential.'],
    ['Memory, best-first', 'O(2ⁿ) worst case', 'The frontier may hold many waiting nodes.'],
    ['Memory, depth-first', 'O(n)', 'At most a path, with one waiting sibling per level.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Items weight:value 2:40, 3:50, 5:100, 4:95 and capacity 8. What is the bound at the root?',
      answer: 175,
      hints: [
        'Sort by value per weight: 4:95, then 2:40 and 5:100 (both 20), then 3:50.',
        'Whole items while they fit, then a fraction of the next.',
      ],
      solution:
        'Take 4:95 and 2:40, for weight 6 and value 135. Room 2 remains, so add 2/5 of 5:100, which is 40. The bound is 135 + 40 = 175.',
    },
    {
      type: 'number',
      prompt: 'For the same items, what is the highest value that really fits?',
      answer: 150,
      hints: ['Load Four items and step to the end.'],
      solution:
        'The items 5:100 and 3:50 weigh exactly 8, for value 150. The bound of 175 was an overestimate, as a bound is allowed to be.',
    },
    {
      type: 'number',
      prompt: 'Items 6:60, 5:45, 5:45 and capacity 10. What is the bound at the root?',
      answer: 96,
      hints: ['Take 6:60 whole, then see what fraction of 5:45 fits.'],
      solution:
        'After 6:60 the room is 4, so add 4/5 of 45, which is 36. The bound is 60 + 36 = 96. The optimum is 90, from the two 5:45 items, while greedy whole items stop at 60.',
    },
    {
      type: 'number',
      prompt: 'Load Order matters with Best-first. How many nodes are made?',
      answer: 27,
      unit: 'nodes',
      hints: ['Step to the end and read Nodes made.'],
      solution: 'Best-first makes 27 nodes and expands 13, then stops with the optimum of 87.',
    },
    {
      type: 'number',
      prompt: 'The same example with Depth-first. How many nodes are made?',
      answer: 71,
      unit: 'nodes',
      hints: ['Switch Search order and read Nodes made.'],
      solution:
        'Depth-first makes 71 nodes and expands 35. It finds the same optimum, 87, but it digs into branches that a better best value would have pruned.',
    },
    {
      type: 'choice',
      prompt: 'A node has bound 120 and the best so far is 120. What should the search do?',
      options: [
        'Expand it, because its value might still rise.',
        'Prune it, because nothing below it can beat 120.',
        'Put it back and try it later.',
        'Replace the best with 120.',
      ],
      answer: 1,
      hints: ['The goal is to beat the best, not to match it.'],
      solution:
        'Everything below is at most 120, so at best it ties. One optimum is enough, so prune it.',
    },
    {
      type: 'multi',
      prompt: 'Which make a good bound for a maximisation problem? Pick all that apply.',
      options: [
        'It is never below the true best value of the subtree.',
        'It is cheap to compute.',
        'It is close to the true best value.',
        'It must be a value some real packing can reach.',
      ],
      answers: [0, 1, 2],
      hints: ['The fractional bound of 175 was not reachable, and it still worked.'],
      solution:
        'Valid, cheap and tight are what matter. A bound need not be achievable: the fractional bound usually is not.',
    },
    {
      type: 'text',
      prompt: 'Which data structure holds the frontier in best-first search?',
      accept: [
        'priority queue',
        'a priority queue',
        'heap',
        'a heap',
        'max-heap',
        'max heap',
        'binary heap',
      ],
      hints: ['It must hand back the largest bound quickly.'],
      solution: 'A priority queue, usually a binary heap keyed by the bound.',
    },
  ],
  nextTeaser:
    'Next up: Practice: backtracking problems, with a word search that explores and retreats letter by letter, and combination sum.',
};
