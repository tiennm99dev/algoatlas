/** @typedef {import('$lib/algo-engine/disjoint-set-union.js').DsuFrame} DsuFrame */
/** @typedef {import('$lib/algo-engine/disjoint-set-union.js').DsuOp} DsuOp */

/** @param {number[]} g */
const groupText = (g) => `{${g.join(', ')}}`;

export const en = {
  slug: 'disjoint-set-union',
  topic: 'union-find',
  level: 'Beginner',
  title: 'Disjoint set union',
  intro:
    'A disjoint set union (union-find) keeps items in groups that never overlap. Each group is a tree stored in one parent array, and the root of the tree names the group. Two operations do all the work: find climbs to the root, and union hangs one root under the other.',
  summary:
    'Merge sets with union, climb to the representative root with find, and ask whether two elements are connected.',
  instruction:
    'Type two elements and press Union, Same set? or Find a, then step through the climb to each root. Click any node, or focus it and press Enter, to run find on it. Load Chain to see how unlucky unions build a tall tree.',
  aLabel: 'a',
  bLabel: 'b',
  union: 'Union',
  same: 'Same set?',
  find: 'Find a',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { friends: 'Friend groups', chain: 'Chain', random: 'Random' },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  groupsTitle: 'Sets now',
  groupsEmpty: 'no elements',
  /** @param {DsuOp} op */
  opChip: (op) =>
    op.type === 'find'
      ? `find(${op.a})`
      : `${op.type === 'union' ? 'union' : 'same'}(${op.a}, ${op.b})`,
  groupText,
  /** @param {number[][]} groups */
  forestLabel: (groups) =>
    `${groups.reduce((s, g) => s + g.length, 0)} elements in ${groups.length} ${groups.length === 1 ? 'set' : 'sets'}: ${groups.map(groupText).join(', ')}.`,
  stats: {
    sets: 'Sets',
    height: 'Tallest tree (links)',
    opSteps: 'Links followed (this operation)',
    steps: 'Links followed (total)',
  },
  logFull: 'The log is full (16 operations). Undo or reset to continue.',
  elementError: 'Elements must be whole numbers from 0 to 9.',
  legend: {
    current: 'Find is here',
    climbed: 'Climbed through',
    root: 'Root found',
    linked: 'Just hung under the other root',
    operand: 'Operand a or b, not visited yet',
  },
  markers: { current: '?', climbed: '↑', root: '✓', linked: '↓' },
  /** @param {DsuFrame} f */
  describe(f) {
    const op = f.op;
    const start = f.side === 'b' ? (op?.b ?? 0) : (op?.a ?? 0);
    const prev = f.path.length > 1 ? f.path[f.path.length - 2] : f.current;
    const root = f.side === 'b' ? f.rb : f.ra;
    switch (f.kind) {
      case 'start':
        return `Every element starts alone: parent[x] = x, so each one is the root of its own set. ${f.sets} sets.`;
      case 'visit':
        return op?.type === 'find'
          ? `find(${start}): start at ${start} and climb parent links until an element is its own parent.`
          : `Find the root of ${f.side} = ${start}: start at ${start}.`;
      case 'climb':
        return `parent[${prev}] = ${f.current}, so climb to ${f.current}.`;
      case 'root':
        return `parent[${root}] = ${root}: ${root} is the root, the name of the set holding ${start}. That took ${f.path.length - 1} ${f.path.length === 2 ? 'link' : 'links'}.`;
      case 'same-set':
        return `Both roots are ${f.ra}: ${op?.a} and ${op?.b} are already in the same set, so nothing changes.`;
      case 'link':
        return `The roots differ, so set parent[${f.rb}] = ${f.ra}. Two sets became one: ${f.sets} sets remain.`;
      case 'answer':
        return f.answer
          ? `Both roots are ${f.ra}: yes, ${op?.a} and ${op?.b} are in the same set.`
          : `Roots ${f.ra} and ${f.rb} differ: no, ${op?.a} and ${op?.b} are in different sets.`;
      case 'done':
        return `Done: ${f.sets} sets, tallest tree ${f.height} ${f.height === 1 ? 'link' : 'links'}, ${f.steps} parent ${f.steps === 1 ? 'link' : 'links'} followed in total.`;
    }
  },
  takeaways: [
    'Each set is a tree in one parent array. A root is its own parent, and it is the set’s representative: two elements are in the same set exactly when find gives the same root.',
    'find(x) climbs parent links to the root. union(a, b) finds both roots and, if they differ, makes one the parent of the other; the number of sets drops by one.',
    'This answers dynamic connectivity questions online: after each new connection you can ask whether two items are linked, without searching a graph again. It only adds links; it cannot split a set.',
    'Both operations cost one step per link climbed, so their cost is the height of the tree. Without any care the trees can grow into a chain of height n − 1.',
    'Try “Chain”: six unions build one long path, and the final find(0) climbs every link. The next lesson fixes this.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['find(x)', 'O(height), O(n) worst', 'One step per parent link; a chain has n − 1 links.'],
    ['union(a, b)', 'O(height)', 'Two finds, then one parent write.'],
    ['same(a, b)', 'O(height)', 'Two finds and a comparison of the roots.'],
    ['Memory', 'O(n)', 'One parent entry per element.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load Friend groups and step to the end. How many sets are there?',
      answer: 5,
      unit: 'sets',
      hints: ['Read the Sets card, or count the trees in the forest. Lonely elements count too.'],
      solution:
        'The groups are {0, 1, 2, 3}, {4, 5, 6}, and the singletons {7}, {8}, {9}: 5 sets. Five unions merged two sets each (10 − 5 = 5), and union(0, 2) found its elements already together.',
    },
    {
      type: 'number',
      prompt: 'Load Chain. How many parent links does the final find(0) climb?',
      answer: 6,
      unit: 'links',
      hints: [
        'Each union(k, k − 1) hangs the old chain under the new element k.',
        'Step through the last operation and watch the Links followed (this operation) card.',
      ],
      solution:
        'The unions build the path 0 → 1 → 2 → 3 → 4 → 5 → 6, so find(0) climbs 6 links before it reaches the root 6.',
    },
    {
      type: 'choice',
      prompt:
        'Start fresh and run union(0, 1), union(2, 3), union(1, 3), where union sets parent[rb] = ra. What is parent[2] afterwards?',
      options: ['0', '1', '2', '3'],
      answer: 0,
      hints: ['union(1, 3) first finds the roots of 1 and 3. What are they?'],
      solution:
        'After the first two unions, 1 hangs under 0 and 3 under 2. union(1, 3) finds roots 0 and 2, then sets parent[2] = 0. Note that 1 and 3 are never linked directly: only roots are.',
    },
    {
      type: 'choice',
      prompt: 'Which question can a disjoint set union answer quickly as connections arrive?',
      options: [
        'Are a and b connected, after adding the link c–d?',
        'Are a and b still connected, after removing the link c–d?',
        'What is the shortest path from a to b?',
        'In what order were the links added?',
      ],
      answer: 0,
      hints: ['Union only merges sets. Can it ever split one?'],
      solution:
        'Union-find supports adding links and asking whether two items share a set. Removing a link may split a set, which it cannot undo, and it stores no paths or history.',
    },
  ],
  nextTeaser:
    'Next up: Union by rank and path compression, two small tricks that keep the trees so flat that find runs in almost constant time.',
};
