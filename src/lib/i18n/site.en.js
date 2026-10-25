export const site = {
  title: 'AlgoAtlas',
  tagline: 'Learn data structures and algorithms by stepping through them',
  description:
    'AlgoAtlas is an interactive tour of data structures and algorithms. Every lesson runs the real algorithm on input you control — step forward, rewind, and watch the cost add up.',
};

export const hub = {
  topicsTitle: 'Topics',
  howTitle: 'How every lesson works',
  how: [
    { title: 'Run it', body: 'The real algorithm runs on your input and records every step.' },
    {
      title: 'Step it',
      body: 'Play, pause, rewind, or scrub — with the matching line of pseudocode lit up.',
    },
    {
      title: 'Change it',
      body: 'Edit the input and see how the number of steps grows or shrinks.',
    },
  ],
  /** @param {string} topic */
  startCta: (topic) => `Start with ${topic.toLowerCase()}`,
  /** @param {number} level */
  levelLabel: (level) => `Level ${level}`,
  /** @param {number} ready @param {number} planned */
  lessonCount: (ready, planned) =>
    `${ready} of ${planned} ${planned === 1 ? 'lesson' : 'lessons'} ready`,
  comingSoon: 'Coming soon',
};

export const stub = {
  /** @type {Record<import('$lib/curriculum/index.js').LessonKind, string>} */
  kinds: { theory: 'Lesson', practice: 'Practice', review: 'Review' },
  /** @param {string} title */
  metaDescription: (title) => `${title} is a planned AlgoAtlas lesson that is not written yet.`,
  notice: 'This lesson is planned but not written yet. Here is what it will cover.',
  keyIdeasTitle: 'This lesson will cover',
  interactiveTitle: 'Planned interaction',
};

export const moved = {
  title: 'This lesson has moved',
  body: 'The lesson now lives at a new address. Your browser should take you there on its own.',
  link: 'Go to the lesson',
};

export const lessonChrome = {
  backToTopic: /** @param {string} title */ (title) => `All lessons in ${title}`,
  backToHub: 'All topics',
  pseudocodeTitle: 'Pseudocode',
  takeawaysTitle: 'Key takeaways',
  complexityTitle: 'Complexity',
  complexityNote:
    'O(…) says how the number of steps grows with the input size n; constants are dropped.',
  tryIt: 'Try it:',
  lessonNavLabel: 'Lesson navigation',
  previous: 'Previous lesson',
  next: 'Next lesson',
  complexityHead: ['Case', 'Cost', 'Why'],
  navLabel: 'Main navigation',
  skipLink: 'Skip to content',
};

export const controls = {
  groupLabel: 'Playback',
  first: 'First step',
  back: 'Previous step',
  play: 'Play',
  replay: 'Replay',
  pause: 'Pause',
  step: 'Next step',
  last: 'Last step',
  speed: 'Speed',
  scrub: 'Step',
  stepOf: /** @param {number} i @param {number} n */ (i, n) => `Step ${i} of ${n}`,
  stoppedAt: /** @param {number} i @param {number} n */ (i, n) =>
    i === n ? `Finished at step ${n} of ${n}.` : `Paused at step ${i} of ${n}.`,
  shortcuts:
    'Shortcuts: Left and Right arrows step; Space plays or pauses after you click inside the visualization. Speed 1× is one step per second.',
};

export const practice = {
  title: 'Practice',
  /** @param {number} solved @param {number} total */
  progress: (solved, total) => `${solved} of ${total} solved`,
  /** @param {number} i @param {number} n */
  questionOf: (i, n) => `Question ${i} of ${n}`,
  solved: 'Solved',
  check: 'Check',
  answerLabel: 'Your answer',
  /** @param {string} unit */
  unitHint: (unit) => `Unit: ${unit}`,
  /** @param {number} shown @param {number} total */
  showHint: (shown, total) => (shown === 0 ? 'Show a hint' : `Next hint (${shown} of ${total})`),
  /** @param {number} i @param {number} n */
  hintTitle: (i, n) => `Hint ${i} of ${n}`,
  showSolution: 'Show solution',
  solutionTitle: 'Solution',
  resetProgress: 'Reset progress',
  orderListLabel: 'Arrange the items',
  /** @param {string} item */
  moveUp: (item) => `Move “${item}” up`,
  /** @param {string} item */
  moveDown: (item) => `Move “${item}” down`,
  /** @param {string} item @param {number} at @param {number} n */
  moved: (item, at, n) => `“${item}” is now position ${at} of ${n}.`,
  pickAll: 'Pick every option that applies.',
  /** @type {Record<import('$lib/components/answer-check.js').CheckReason, string>} */
  feedback: {
    correct: 'Correct!',
    empty: 'Answer the question first.',
    incomplete: 'Place every item before checking.',
    invalid: 'Type a plain number, such as 42 or 3.5 (use a dot for decimals).',
    unit: 'The value is right, but the unit is not.',
    wrong: 'Not quite. Try again, or open a hint.',
  },
};

export const visuals = {
  /** Default spoken names for the shared state palette; lessons may pass their own labels. */
  states: {
    compare: 'compared',
    swap: 'written',
    sorted: 'done',
    active: 'current',
    frontier: 'pending',
    visited: 'visited',
    path: 'on the path',
  },
  scroller: 'Drawing, scrolls sideways',
  /** @param {number} i @param {string} value @param {string} state */
  cell: (i, value, state) => `Index ${i}: ${value}${state ? `, ${state}` : ''}`,
  /** @param {string} name @param {number} i */
  pointer: (name, i) => `${name} at ${i}`,
  /** @param {string} label @param {number} from @param {number} to */
  window: (label, from, to) => `${label} covers ${from} to ${to - 1}`,
  nullLabel: 'null',
  /** @param {string[]} labels @param {boolean} doubly @param {boolean} circular */
  listSummary: (labels, doubly, circular) =>
    `${doubly ? 'Doubly' : 'Singly'} linked list${circular ? ', circular' : ''}: ${labels.length === 0 ? 'empty' : labels.join(' → ')}`,
  top: 'top',
  bottom: 'bottom',
  front: 'front',
  back: 'back',
  /** @param {'stack' | 'queue' | 'deque'} kind @param {string[]} labels */
  containerSummary: (kind, labels) =>
    labels.length === 0
      ? `The ${kind} is empty.`
      : kind === 'stack'
        ? `Stack, bottom to top: ${labels.join(', ')}.`
        : `${kind === 'queue' ? 'Queue' : 'Deque'}, front to back: ${labels.join(', ')}.`,
  emptyTree: 'The tree is empty.',
  /** @param {string} label @param {string} state @param {number} depth */
  treeNode: (label, state, depth) => `${label}, depth ${depth}${state ? `, ${state}` : ''}`,
  treeKeys:
    'Arrow keys move between nodes: Up to the parent, Down to the first child, Left and Right to siblings.',
  /** @param {number} i @param {string} value */
  heapSlot: (i, value) => `Slot ${i}: ${value}`,
  heapSorted: 'sorted',
  /** @param {number[]} values @param {number} size */
  heapSummary: (values, size) =>
    size === 0
      ? 'The heap is empty.'
      : `Heap of ${size} as an array: ${values.slice(0, size).join(', ')}.`,
  /** @param {number} i @param {number} parent */
  ufParent: (i, parent) => (i === parent ? `${i} is a root` : `parent of ${i} is ${parent}`),
  /** @param {number} sets @param {number} n */
  ufSummary: (sets, n) => `${n} elements in ${sets} ${sets === 1 ? 'set' : 'sets'}.`,
  parentRow: 'parent',
  /** @param {number} r @param {number} c @param {string} value @param {string} state */
  dpCell: (r, c, value, state) =>
    `Row ${r}, column ${c}: ${value === '' ? 'empty' : value}${state ? `, ${state}` : ''}`,
  dpKeys: 'Arrow keys move between cells; Home and End jump to the row ends.',
  graph: {
    tools: 'Edit tool',
    move: 'Select',
    connect: 'Connect',
    remove: 'Delete',
    addNode: 'Add node',
    weight: 'New edge weight',
    /** @param {string} label @param {string} state @param {number} degree */
    node: (label, state, degree) =>
      `Node ${label}, ${degree} ${degree === 1 ? 'edge' : 'edges'}${state ? `, ${state}` : ''}`,
    /** @param {number} nodes @param {number} edges @param {boolean} directed */
    summary: (nodes, edges, directed) =>
      `${directed ? 'Directed' : 'Undirected'} graph with ${nodes} ${nodes === 1 ? 'node' : 'nodes'} and ${edges} ${edges === 1 ? 'edge' : 'edges'}.`,
    keys: 'Tab to the nodes, then use arrow keys to move between them and Enter to act with the chosen tool. Shift with an arrow key nudges the node.',
    /** @param {string} label */
    pickTarget: (label) => `From ${label}: pick the node to connect or disconnect.`,
    /** @param {string[]} ends @param {boolean} directed */
    removeEdge: ([a, b], directed) => `Delete edge ${a} ${directed ? 'to' : 'and'} ${b}`,
    full: 'The graph is full.',
    selfLoop: 'An edge needs two different nodes.',
  },
};
