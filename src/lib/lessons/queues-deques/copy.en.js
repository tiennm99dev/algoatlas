/** @typedef {import('$lib/algo-engine/queues-deques.js').DequeFrame} DequeFrame */
/** @typedef {import('$lib/algo-engine/queues-deques.js').DequeOp} DequeOp */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {DequeOp} op */
const opName = (op) =>
  op.type === 'push-back'
    ? `enqueue(${op.value})`
    : op.type === 'pop-front'
      ? 'dequeue()'
      : op.type === 'push-front'
        ? `pushFront(${op.value})`
        : 'popBack()';

/** @param {boolean} wrapped */
const wrapNote = (wrapped) => (wrapped ? ' The index ran past slot 7, so it wrapped around.' : '');

export const en = {
  slug: 'queues-deques',
  topic: 'stacks-queues',
  level: 'Beginner',
  title: 'Queues and deques',
  intro:
    'A queue is a line at a ticket counter: people join at the back and leave from the front, so the first in is the first out (FIFO). A circular buffer stores it in a fixed array whose end wraps around to its start, so both ends move in O(1) and nothing ever shifts. A deque (double-ended queue) allows adding and removing at both ends.',
  summary:
    'Enqueue and dequeue on a circular buffer, watch head and tail wrap around the ring, then use the deque’s extra front and back operations.',
  instruction:
    'Type a value and enqueue it, or dequeue, then step through the run. Load “Wrap around” to see the back index run past slot 7 into slot 0, and use push front and pop back to treat the same buffer as a deque.',
  valueLabel: 'Value',
  queueGroup: 'Queue (FIFO)',
  dequeGroup: 'Deque extras',
  ops: {
    'push-back': 'Enqueue',
    'pop-front': 'Dequeue',
    'push-front': 'Push front',
    'pop-back': 'Pop back',
  },
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    queue: 'Short queue',
    wrap: 'Wrap around',
    deque: 'Both ends',
    full: 'Fill past full',
    random: 'Random',
  },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  ringTitle: 'The circular buffer, 8 slots',
  rowTitle: 'The queue in order, front to back',
  headLabel: 'head',
  tailLabel: 'tail',
  opChip: opName,
  stats: {
    size: 'Size',
    head: 'head',
    tail: 'tail = (head + size) mod 8',
    wraps: 'Wrap-arounds',
    ringShifts: 'Shifts, circular buffer',
    naiveShifts: 'Shifts, plain array',
    result: 'Returned',
  },
  none: '–',
  valueError: 'Values must be whole numbers from 0 to 99.',
  logFull: 'The log is full (20 operations). Undo or reset to continue.',
  /** @param {DequeFrame} f */
  ringLabel: (f) =>
    `Circular buffer of 8 slots, head = ${f.head}, tail = ${f.tail}, size = ${f.size}. ${
      f.items.length ? `Front to back: ${f.items.join(', ')}.` : 'It is empty.'
    }`,
  /** @param {number} i @param {number | null} v @param {boolean} inUse @param {string} state */
  slotTitle: (i, v, inUse, state) =>
    [
      `Slot ${i}`,
      v === null ? 'never used' : inUse ? `holds ${v}` : `stale ${v}, not in the queue`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  states: { active: 'just written', sorted: 'just read', compare: 'checked' },
  markers: { active: '+', sorted: '✓', compare: '?' },
  legend: {
    frontier: 'In the queue',
    active: 'Just written',
    sorted: 'Just read and returned',
    stale: 'Stale slot, not in the queue (dimmed)',
  },
  /** @param {DequeFrame} f */
  describe(f) {
    const op = f.op;
    switch (f.kind) {
      case 'start':
        return 'An empty circular buffer: head = 0 and size = 0, so tail = 0 too.';
      case 'check': {
        const o = /** @type {DequeOp} */ (op);
        const adding = o.type === 'push-back' || o.type === 'push-front';
        return adding
          ? `${opName(o)}: size = ${f.size}${f.size === 8 ? ', the buffer is full.' : ', so there is a free slot.'}`
          : `${opName(o)}: size = ${f.size}${f.size === 0 ? ', the buffer is empty.' : ', so there is an item to take.'}`;
      }
      case 'full':
        return `Full: all 8 slots are in use, so ${op?.value} is refused. Note head = tail here, just as when empty; size tells the two apart.`;
      case 'empty':
        return 'Empty: there is nothing to remove. The buffer is unchanged.';
      case 'push-back':
        return `Write ${op?.value} into slot ${f.at}, the old tail, and grow size to ${f.size}. tail is now ${f.tail}.${wrapNote(f.wrapped)}`;
      case 'pop-front':
        return `Read ${f.result} from slot ${f.at} and move head to ${f.head}. Nothing shifts: a plain array would have moved ${count(f.size, 'item', 'items')} left.${wrapNote(f.wrapped)}`;
      case 'push-front':
        return `Step head back to slot ${f.head} and write ${op?.value} there. The new front, with no shifting.${f.wrapped ? ' Going back from slot 0 wrapped to slot 7.' : ''}`;
      case 'pop-back':
        return `Read ${f.result} from slot ${f.at}, the back item, and shrink size to ${f.size}. head does not move.${f.wrapped ? ' The back slot index wrapped past 7.' : ''}`;
      case 'done':
        return f.size === 0
          ? 'Done. The queue is empty.'
          : `Done. ${count(f.size, 'item', 'items')}, front to back: ${f.items.join(', ')}.`;
    }
  },
  takeaways: [
    'A queue is first in, first out (FIFO): enqueue adds at the back, dequeue removes from the front.',
    'Dequeuing from a[0] of a plain array shifts every other item left: O(n). A circular buffer moves the head index instead: O(1).',
    'Indices wrap with mod C: the slot after C − 1 is slot 0. The back item is at (head + size − 1) mod C, and the next free slot at (head + size) mod C.',
    'A deque adds pushFront (head steps back, wrapping from 0 to C − 1) and popBack, all O(1), so it can act as both a stack and a queue.',
    'Load “Wrap around” and step to the end: count how many shifts the plain array made and how many the ring made.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'enqueue, dequeue (circular buffer)',
      'O(1)',
      'One slot written or read, one index moved mod C.',
    ],
    ['pushFront, popBack (deque)', 'O(1)', 'The same, at the other end of the ring.'],
    ['dequeue from a plain array', 'O(n)', 'Every remaining item shifts one place left.'],
    ['Memory', 'O(C)', 'C slots, used or not; a growable buffer doubles C when full.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'A circular buffer has C = 8 slots, head = 6 and size = 3. Which slot does the next enqueue write?',
      answer: 1,
      hints: ['The next free back slot is (head + size) mod C.'],
      solution:
        '(6 + 3) mod 8 = 9 mod 8 = 1. The items sit in slots 6, 7 and 0, so the next one goes into slot 1.',
    },
    {
      type: 'number',
      prompt:
        'Start empty. Enqueue 4, 7, 2, then dequeue twice, then enqueue 9. Which value is at the front?',
      answer: 2,
      hints: ['Dequeue removes the oldest value still in the queue.'],
      solution:
        'After the enqueues the queue is 4, 7, 2. Two dequeues remove 4 and 7, leaving 2. Enqueuing 9 adds it behind: 2, 9. The front is 2.',
    },
    {
      type: 'choice',
      prompt: 'With C = 8, head = 0 and size = 0, what does pushFront(5) do to head?',
      options: ['head becomes 7', 'head becomes 1', 'head stays 0 and the items shift right'],
      answer: 0,
      hints: ['pushFront steps head back by one, mod C.'],
      solution:
        'head = (0 − 1 + 8) mod 8 = 7. The 5 is written into slot 7 and is the front; nothing shifts.',
    },
    {
      type: 'number',
      prompt:
        'A plain array holds 6 items with the front at a[0]. How many items must shift when you dequeue one?',
      answer: 5,
      unit: 'items',
      hints: ['After removing a[0], every item left must move one place towards the front.'],
      solution:
        'The 5 remaining items each shift one place left, so a[0] is again the front. The circular buffer just moves head instead.',
    },
  ],
  nextTeaser:
    'Next up: stack applications, where a stack checks brackets, evaluates expressions and runs function calls.',
};
