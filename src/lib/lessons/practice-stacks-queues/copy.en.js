/** @typedef {import('$lib/algo-engine/practice-stacks-queues.js').PracticeFrame} PracticeFrame */
/** @typedef {import('$lib/algo-engine/practice-stacks-queues.js').PracticeOp} PracticeOp */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {number[]} s */
const topOf = (s) => s[s.length - 1];

/** @param {PracticeOp} op */
const opChip = (op) =>
  op.type === 'enqueue' || op.type === 'push'
    ? `${op.type}(${op.value})`
    : op.type === 'get-min'
      ? 'getMin()'
      : `${op.type}()`;

export const en = {
  slug: 'practice-stacks-queues',
  topic: 'stacks-queues',
  level: 'Intermediate',
  title: 'Practice: stacks and queues',
  intro:
    'Two interview classics that bend one structure into another. A queue built from two stacks pours its inbox into its outbox only when the outbox runs dry, so each item moves once and dequeue costs O(1) amortized. A min-stack keeps a second stack of minimums beside the main one, so getMin is O(1) too.',
  summary:
    'Build a queue from two stacks and a stack that tracks its minimum, step through every push, pop and transfer, and answer questions with the sandbox.',
  instruction:
    'Pick a problem, type a value and add operations (or load a preset), then step through. Watch when items pour from the inbox to the outbox, and compare the stack operations with the queue operations. Use the sandbox to answer the questions below.',
  problemLabel: 'Problem',
  problems: { 'two-stack-queue': 'Queue from two stacks', 'min-stack': 'Min-stack' },
  valueLabel: 'Value',
  buttons: {
    enqueue: 'Enqueue',
    dequeue: 'Dequeue',
    push: 'Push',
    pop: 'Pop',
    'get-min': 'Get min',
  },
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    'two-stack-queue': { mixed: 'Mixed', burst: 'Five in, five out' },
    'min-stack': { mixed: 'Repeated minimum', falling: 'Falling pushes' },
  },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  opChip,
  stackTitles: {
    'two-stack-queue': ['inbox (enqueue pushes here)', 'outbox (dequeue pops here)'],
    'min-stack': ['main stack', 'mins (top = minimum)'],
  },
  /** @param {string} name @param {number[]} items */
  stackLabel: (name, items) =>
    items.length === 0
      ? `${name}: empty.`
      : `${name}, bottom to top: ${items.join(', ')}. Top is ${topOf(items)}.`,
  stats: {
    stackOps: 'Stack pushes and pops',
    transfers: 'Items poured',
    queueOps: 'Queue operations',
    perOp: 'Stack ops per queue op',
    size: 'Items on main',
    min: 'Current minimum',
    result: 'Returned',
  },
  none: '–',
  valueError: 'Values must be whole numbers from 0 to 99.',
  logFull: 'The log is full (16 operations). Undo or reset to continue.',
  full: 'The drawing holds 8 items. Remove one first.',
  states: { active: 'just pushed', swap: 'just moved', sorted: 'returned' },
  markers: { active: '+', swap: '→', sorted: '✓' },
  legend: {
    active: 'Just pushed',
    swap: 'Just poured from inbox',
    sorted: 'Current minimum',
  },
  /** @param {PracticeFrame} f */
  describe(f) {
    const v = f.op?.value;
    switch (f.kind) {
      case 'start':
        return f.problem === 'two-stack-queue'
          ? 'Both stacks are empty. Enqueue pushes onto the inbox; dequeue pops from the outbox.'
          : 'Both stacks are empty. The top of mins will always be the minimum of the main stack.';
      case 'enqueue':
        return `enqueue(${v}): push ${v} onto the inbox. One stack operation.`;
      case 'check':
        return f.right.length > 0
          ? `dequeue(): the outbox holds ${count(f.right.length, 'item', 'items')}, so no pouring is needed.`
          : f.left.length > 0
            ? `dequeue(): the outbox is empty, so pour the whole inbox into it.`
            : 'dequeue(): the outbox is empty, and so is the inbox.';
      case 'transfer':
        return `Pop ${f.moved} from the inbox and push it onto the outbox. Pouring reverses the order, so the oldest item ends on top.`;
      case 'empty':
        return f.problem === 'two-stack-queue'
          ? 'Both stacks are empty: the queue is empty, there is nothing to dequeue.'
          : `The main stack is empty: there is nothing to ${f.op?.type === 'pop' ? 'pop' : 'take the minimum of'}.`;
      case 'dequeue':
        return `Pop ${f.result} from the outbox and return it: the oldest item in the queue.`;
      case 'push-main':
        return `push(${v}): push ${v} onto the main stack.`;
      case 'push-min':
        return f.right.length === 1
          ? `mins was empty, so ${v} is the minimum: push it onto mins.`
          : `${v} ≤ the old minimum ${f.right[f.right.length - 2]}: push it onto mins. It is the new minimum.`;
      case 'skip-min':
        return `${v} > the minimum ${topOf(f.right)}: mins stays as it is.`;
      case 'pop-main':
        return `pop(): pop ${f.result} from the main stack.`;
      case 'pop-min':
        return `${f.result} was the minimum (the top of mins), so pop mins too. The minimum is now ${f.right.length ? topOf(f.right) : 'undefined: the stack is empty'}.`;
      case 'keep-min':
        return `${f.result} is not the top of mins, ${topOf(f.right)}, so mins stays.`;
      case 'get-min':
        return `getMin() reads the top of mins: ${f.result}. No searching.`;
      case 'done':
        return f.problem === 'two-stack-queue'
          ? `Done. ${count(f.done, 'queue operation', 'queue operations')} took ${count(f.stackOps, 'stack operation', 'stack operations')}: each item is pushed and popped at most twice.`
          : `Done. ${count(f.left.length, 'item', 'items')} on the main stack${f.left.length ? `, minimum ${topOf(f.right)}` : ''}.`;
    }
  },
  takeaways: [
    'Two stacks make a queue: push onto the inbox, pop from the outbox, and pour the inbox into the outbox only when the outbox is empty. Pouring reverses the order, which turns LIFO into FIFO.',
    'A single dequeue may move n items, but each item is poured at most once in its life, so a run of operations costs at most 4 stack operations per item: O(1) amortized.',
    'A min-stack keeps a second stack, mins, whose top is the current minimum. Push v onto mins when v ≤ its top; pop mins when the popped value equals its top.',
    'Use ≤, not <: with <, pushing a second copy of the minimum and popping it would lose the minimum.',
    'Load “Five in, five out” and count the transfers on each dequeue; then try the min-stack with pushes 5, 3, 3 and two pops.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['enqueue (two stacks)', 'O(1)', 'One push onto the inbox.'],
    [
      'dequeue (two stacks)',
      'O(1) amortized',
      'Each item is poured once; one pour of n items is O(n).',
    ],
    [
      'push, pop, getMin (min-stack)',
      'O(1)',
      'At most one push or pop on each stack; getMin reads a top.',
    ],
    ['Memory', 'O(n)', 'Each item sits in one stack; mins holds at most n values.'],
  ],
  practiceTitle: 'Practice with the sandbox',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Queue from two stacks: enqueue 1, 2, 3, dequeue, enqueue 4, then dequeue three times. How many items are poured from the inbox to the outbox in total?',
      answer: 4,
      unit: 'items',
      hints: [
        'The first dequeue finds the outbox empty and pours all three.',
        'The 4 waits in the inbox until the outbox is empty again.',
      ],
      solution:
        'The first dequeue pours 3, 2, 1 (3 items). The next two dequeues pop 2 and 3 from the outbox with no pouring. The last finds it empty and pours the 4: 3 + 1 = 4. Load “Mixed” to check.',
    },
    {
      type: 'number',
      prompt:
        'For the same log, how many stack pushes and pops happen in total? Count each pour as one pop and one push.',
      answer: 16,
      unit: 'operations',
      hints: ['4 enqueues, 4 pours and 4 dequeues.'],
      solution:
        '4 enqueue pushes + 4 pours × 2 + 4 dequeue pops = 4 + 8 + 4 = 16, which is 2 per queue operation.',
    },
    {
      type: 'number',
      prompt:
        'Enqueue 10, 20, 30, 40, 50, then dequeue five times. How many items does the first dequeue pour?',
      answer: 5,
      unit: 'items',
      hints: ['The outbox is empty at the first dequeue.'],
      solution:
        'All 5 items are in the inbox, so the first dequeue pours all of them. The other four dequeues pour nothing: 5 pours over 5 dequeues.',
    },
    {
      type: 'text',
      prompt: 'What is the amortized cost of a dequeue in the two-stack queue?',
      accept: [
        'O(1)',
        'constant',
        'constant time',
        'O(1) amortized',
        'amortized O(1)',
        'O(1) amortised',
        'amortised O(1)',
      ],
      hints: ['Count how many times one item can be poured over its whole life.'],
      solution:
        'O(1): each item is pushed and popped at most twice in total, so n operations cost O(n) together, even though one dequeue can pour O(n) items.',
    },
    {
      type: 'number',
      prompt: 'Min-stack: push 5, 3, 7, 3, then pop once. What does getMin() return?',
      answer: 3,
      hints: [
        'Track mins: which pushes are ≤ its top?',
        'The popped 3 equals the top of mins, so one 3 leaves mins.',
      ],
      solution:
        'mins becomes 5, 3, 3 (the 7 is skipped; the second 3 is ≤ 3). Popping 3 pops one 3 from mins, leaving 5, 3. getMin() returns 3. Load “Repeated minimum” to check.',
    },
    {
      type: 'number',
      prompt: 'Min-stack: push 4, 6, 2, 8. How many values are on mins?',
      answer: 2,
      unit: 'values',
      hints: ['Only values ≤ the current minimum go onto mins.'],
      solution: '4 goes on (mins was empty), 6 is skipped, 2 goes on, 8 is skipped: mins is 4, 2.',
    },
    {
      type: 'choice',
      prompt:
        'A min-stack pushes onto mins only when v < mins.top (strictly less). What goes wrong after push 3, push 3, pop?',
      options: [
        'mins becomes empty, so getMin fails although 3 is still on the stack',
        'Nothing goes wrong',
        'getMin returns the popped 3 twice',
      ],
      answer: 0,
      hints: ['With <, the second 3 is not pushed onto mins.', 'Then the pop sees 3 = mins.top.'],
      solution:
        'mins holds a single 3. Popping the second 3 matches mins.top and pops it, leaving mins empty while the main stack still holds 3. Using ≤ keeps one 3 on mins per copy.',
    },
  ],
  nextTeaser:
    'Next up: hash tables, which turn a key into an array index to find it in O(1) on average.',
};
