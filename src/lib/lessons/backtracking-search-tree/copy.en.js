/** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').SearchFrame} SearchFrame */
/** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').SearchNode} SearchNode */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'backtracking-search-tree',
  topic: 'backtracking',
  level: 'Beginner',
  title: 'Backtracking and the search tree',
  intro:
    'Backtracking solves a problem by making one choice at a time, following it as far as it goes, then undoing it to try the next one. All the possible choices form a tree, the state-space tree, and the search is a depth-first walk over it. Pruning is what makes it practical: as soon as a branch cannot lead to an answer, the whole subtree below it is skipped.',
  summary:
    'Watch a state-space tree grow as a subset-sum search chooses, explores and unchooses, and see how pruning cuts off whole branches.',
  instruction:
    'Step through the example and watch the tree grow, then change Pruning and compare the Nodes visited stat. Type your own numbers and target, or click or press Enter on a node of the tree to jump to the moment it was visited.',
  /** @param {number} target */
  problem: (target) =>
    `Find every subset of these positive numbers that adds up to ${target}. Each level of the tree decides one number: take it (left), or leave it out (right).`,
  pruneLabel: 'Pruning',
  prunes: { off: 'Off', over: 'Too big', both: 'Too big or too small' },
  numbersLabel: 'Numbers',
  targetLabel: 'Target',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    two: 'Two answers',
    big: 'Big numbers first',
    all: 'Needs every number',
    none: 'No answer',
  },
  /** @param {number} maxN @param {number} maxV */
  numbersError: (maxN, maxV) => `Enter 1 to ${maxN} whole numbers from 1 to ${maxV}.`,
  /** @param {number} max */
  targetError: (max) => `The target must be a whole number from 1 to ${max}.`,
  treeTitle: 'State-space tree',
  treeNote:
    'Each circle shows the sum of the numbers chosen so far. The edge says what was added: +3 took the 3, +0 left the number out.',
  treeAria: 'State-space tree of the search, built as it runs.',
  /** @param {SearchNode} n */
  nodeLabel: (n) => {
    const state = {
      active: 'visiting now',
      open: 'on the current path',
      finished: 'fully explored',
      pruned: 'pruned',
      found: 'an answer',
      dead: 'a dead end',
    }[n.status];
    return `Node at depth ${n.depth}, sum ${n.sum}, ${state}.`;
  },
  markers: { found: '★', pruned: '✂', dead: '×' },
  legend: {
    active: 'Visiting now',
    open: 'On the current path',
    finished: 'Fully explored, × is a dead end',
    found: 'An answer',
    pruned: 'Pruned: nothing below it is visited',
  },
  numbersTitle: 'Numbers',
  numbersAria: 'The numbers. Chosen ones are marked.',
  /** @param {number} i @param {number} v @param {boolean} on */
  numberCell: (i, v, on) => `Number ${v} at index ${i}${on ? ', chosen' : ''}`,
  chosenMark: '✓',
  pointer: 'i',
  stats: {
    visited: 'Nodes visited',
    pruned: 'Pruned',
    sum: 'Current sum',
    solutions: 'Answers found',
  },
  chosenTitle: 'Chosen now',
  chosenEmpty: 'Nothing chosen.',
  solutionsTitle: 'Answers',
  solutionsEmpty: 'None yet.',
  /** @param {number[]} s */
  solution: (s) => `{${s.join(', ')}}`,
  /** @param {SearchFrame} f */
  describe(f) {
    const v = f.values[f.depth];
    switch (f.kind) {
      case 'start':
        return `Start at the root with nothing chosen. Goal: subsets of these ${f.values.length} numbers that add up to ${f.target}.`;
      case 'choose':
        return `Choose ${v} and explore that branch. The sum is now ${f.sum}.`;
      case 'undo':
        return `Back from the branch that took ${v}. Unchoose it, so the state is what it was before: sum ${f.sum}.`;
      case 'skip':
        return `Explore the other branch: leave ${v} out. The sum stays ${f.sum}.`;
      case 'over':
        return `Prune: the sum ${f.sum} is already over ${f.target}, and every number is positive, so nothing below this node can work. Go back.`;
      case 'short':
        return `Prune: the sum ${f.sum} plus everything left, ${f.rest}, makes only ${f.sum + f.rest}, below ${f.target}. Nothing below this node can work. Go back.`;
      case 'found':
        return `All the numbers are decided and the sum is ${f.target}. Record {${f.chosen.map((at) => f.values[at]).join(', ')}}, then go back to look for more.`;
      case 'dead':
        return `All the numbers are decided, but the sum is ${f.sum}, not ${f.target}. A dead end: go back.`;
      case 'done': {
        const found = f.solutions.length
          ? `Found ${plural(f.solutions.length, 'answer', 'answers')}`
          : 'No subset adds up to the target';
        return `${found}, after visiting ${plural(f.visited, 'node', 'nodes')} and pruning ${f.pruned}.`;
      }
    }
  },
  takeaways: [
    'Every backtracking search has the same three moves: choose an option, explore everything that follows from it, then unchoose it so the next option starts from a clean state.',
    'The state-space tree has one node for each partial solution. The search is a depth-first walk of it, so it stores only the current path, not the whole tree.',
    'A prune is a test that proves no answer lies below a node. Skipping a node skips everything under it, which is why one early check can save far more than one late check.',
    'A prune must never throw away an answer. “Sum over the target” is only safe here because every number is positive: with negative numbers, a sum that is too big could still come back down.',
    'Load Needs every number and set Pruning to Off, then Too big, then Too big or too small. The visited count stays at 63, stays at 63, then falls to 11. Which check did the work, and why?',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Time, no pruning', 'O(2ⁿ)', 'The full tree has 2ⁿ⁺¹ − 1 nodes, and each costs O(1).'],
    [
      'Time, with pruning',
      'O(2ⁿ) worst case',
      'Pruning cuts many inputs a lot, but some inputs cut little, so the worst-case bound stays.',
    ],
    ['Memory', 'O(n)', 'Only the current path is held: at most n frames and n chosen numbers.'],
    [
      'Recording an answer',
      'O(n) each',
      'Copying the chosen list. It must be a copy, because the list keeps changing.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Numbers 3, 5, 2, 4 and target 7, with Pruning Off. How many nodes are visited?',
      answer: 31,
      unit: 'nodes',
      hints: ['Four numbers, each with two options: how many nodes in a full binary tree?'],
      solution:
        'Levels hold 1, 2, 4, 8 and 16 nodes, so 2⁵ − 1 = 31. With no pruning every node is visited, whatever the target.',
    },
    {
      type: 'number',
      prompt: 'The same input with Pruning set to Too big. How many nodes are visited now?',
      answer: 25,
      unit: 'nodes',
      hints: [
        'Run it in the widget.',
        'Which early choice goes over 7 first? How many nodes sit below it in the full tree?',
      ],
      solution:
        'Four nodes go over 7: 3 + 5 = 8 high up, and three leaves ({3, 2, 4}, {5, 2, 4}, {5, 4}). Only the first saves anything, the 6 nodes below it, so 31 − 6 = 25.',
    },
    {
      type: 'number',
      prompt: 'The same input with Too big or too small. How many nodes are visited?',
      answer: 19,
      unit: 'nodes',
      hints: ['Run it in the widget and read Nodes visited at the last step.'],
      solution:
        'The second test cuts branches whose sum cannot climb to 7 with what is left. For example, leaving out both 3 and 5 leaves only 2 + 4 = 6, so that branch goes at once. That brings 25 down to 19.',
    },
    {
      type: 'number',
      prompt:
        'Load Big numbers first, with numbers 8, 7, 6, 5, 4 and target 9. With Too big or too small on, how many nodes are visited?',
      answer: 29,
      unit: 'nodes',
      hints: ['The full tree has 63 nodes.', 'Read the Nodes visited stat at the last step.'],
      solution:
        'Pairs of big numbers go over 9 straight away, so much of the tree goes. The search visits 29 of 63 nodes and finds one answer, {5, 4}.',
    },
    {
      type: 'order',
      prompt: 'Put one step of a backtracking search in the right order.',
      items: [
        'Remove the choice, restoring the state',
        'Recurse on what remains',
        'Add an option to the current choices',
      ],
      answer: [2, 1, 0],
      hints: ['The three moves are choose, explore, unchoose.'],
      solution:
        'Choose (add it), explore (recurse), unchoose (remove it). The last step lets the next option start from the same state.',
    },
    {
      type: 'choice',
      prompt: 'Why does the search record a copy of the chosen list and not the list itself?',
      options: [
        'Copies are faster to store.',
        'The list changes as the search goes on, and would end up empty.',
        'Each answer must be sorted first.',
        'The recursion cannot return a list.',
      ],
      answer: 1,
      hints: ['What does every unchoose step do to the list?'],
      solution:
        'There is one list, and unchoosing pops from it. A saved reference would change with it, and every answer would read as empty at the end.',
    },
    {
      type: 'multi',
      prompt:
        'Suppose the numbers may be negative. Which checks are still safe? Pick all that apply.',
      options: [
        'Stop if the sum is over the target',
        'At a leaf, record the choices if the sum equals the target',
        'Stop if the sum is over the target and no number left is negative',
      ],
      answers: [1, 2],
      hints: ['Can a sum above the target come back down?'],
      solution:
        'The first check is now unsafe: a sum of 5 with −3 still to come drops to 2. The leaf test is always right. The third is safe, since with no negatives left the sum can only grow.',
    },
    {
      type: 'text',
      prompt: 'What is the extra memory of the search, not counting the answers it records?',
      accept: ['O(n)', 'n', 'Θ(n)', 'linear'],
      hints: ['The search holds only the current path. How long can that be?'],
      solution: 'The path has at most n levels, so O(n): one stack frame and one choice per level.',
    },
  ],
  nextTeaser:
    'Next up: Permutations, combinations and subsets, where the same three moves generate every arrangement without repeats.',
};
