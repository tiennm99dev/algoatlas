/** @typedef {import('$lib/algo-engine/stacks.js').StackFrame} StackFrame */
/** @typedef {import('$lib/algo-engine/stacks.js').StackOp} StackOp */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {StackFrame} f */
const topValue = (f) => f.items[f.items.length - 1];

export const en = {
  slug: 'stacks',
  topic: 'stacks-queues',
  level: 'Beginner',
  title: 'Stacks',
  intro:
    'A stack is a pile of plates: you add a plate on top and take a plate from the top, so the last one in is the first one out (LIFO). It offers just push, pop and peek, and each touches only the top, so every operation costs O(1) whether the stack holds three items or three million.',
  summary:
    'Push, pop and peek on a stack built from an array or a linked list, and watch the top pointer move one step at a time.',
  instruction:
    'Type a value and push it, pop or peek, then step through the run. Switch between the array and the linked list to see the same stack stored two ways, and push past the array’s six slots to see an overflow.',
  implLabel: 'Implementation',
  impls: { array: 'Array (6 slots)', linked: 'Linked list' },
  valueLabel: 'Value',
  push: 'Push',
  pop: 'Pop',
  peek: 'Peek',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    plates: 'Three plates',
    overflow: 'Push past full',
    underflow: 'Pop past empty',
    random: 'Random',
  },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  platesTitle: 'The stack (plates)',
  arrayTitle: 'The array a[0..5]',
  listTitle: 'The linked list, top first',
  /** @param {StackOp} op */
  opChip: (op) => (op.type === 'push' ? `push(${op.value})` : `${op.type}()`),
  stats: {
    size: 'Size',
    top: 'top index',
    topValue: 'Top value',
    pushes: 'Pushes',
    pops: 'Pops',
    result: 'Returned',
  },
  none: '–',
  nullLabel: 'null',
  valueError: 'Values must be whole numbers from 0 to 99.',
  logFull: 'The log is full (16 operations). Undo or reset to continue.',
  drawingFull:
    'The drawing holds 8 nodes. Pop first: a real linked stack only stops when memory runs out.',
  /** @param {number[]} items */
  stackLabel: (items) =>
    items.length === 0
      ? 'The stack is empty.'
      : `Stack, bottom to top: ${items.join(', ')}. Top is ${items[items.length - 1]}.`,
  /** @param {(number | null)[]} slots @param {number} top */
  arrayLabel: (slots, top) =>
    `Array of ${slots.length} slots, top = ${top}: ${slots
      .map((v, i) => `a[${i}] ${v === null ? 'unused' : i <= top ? v : `${v} (stale)`}`)
      .join(', ')}.`,
  /** @param {number[]} topFirst @param {number | null} fresh */
  listLabel: (topFirst, fresh) =>
    `${fresh === null ? '' : `New node ${fresh}, not linked yet. `}${
      topFirst.length === 0 ? 'top is null' : `Linked list from top: ${topFirst.join(' → ')} → null`
    }`,
  states: { active: 'just pushed', compare: 'being read', sorted: 'returned' },
  markers: { active: '+', compare: '?', sorted: '✓' },
  legend: {
    active: 'Just pushed',
    compare: 'Top being read',
    sorted: 'Value returned',
    stale: 'Stale slot past top (dimmed)',
  },
  /** @param {StackFrame} f */
  describe(f) {
    const v = f.op?.value;
    switch (f.kind) {
      case 'start':
        return f.impl === 'array'
          ? 'An empty stack in an array of 6 slots: top = −1, so no slot is in use.'
          : 'An empty linked stack: top is null.';
      case 'check-full':
        return f.top === 5
          ? `push(${v}): top = 5 = capacity − 1. Every slot is taken.`
          : `push(${v}): top = ${f.top}, below 5, so there is room.`;
      case 'overflow':
        return `Stack overflow: ${v} has nowhere to go. The stack is unchanged.`;
      case 'push':
        return `top moves up to ${f.top} and a[${f.top}] = ${v}. One slot written, nothing else moves.`;
      case 'create':
        return f.items.length === 0
          ? `Make a node for ${v}. top is null, so its next is null.`
          : `Make a node for ${v} and point its next at the current top, ${topValue(f)}.`;
      case 'link':
        return `top = node: ${v} is now on top. No other node moved.`;
      case 'check-empty':
        return f.items.length === 0
          ? `pop(): top is ${f.impl === 'array' ? '−1' : 'null'}, so the stack is empty.`
          : `pop(): the top is ${topValue(f)}, so there is something to take.`;
      case 'underflow':
        return `Stack underflow: there is nothing to ${f.op?.type}. The stack is unchanged.`;
      case 'pop':
        return f.impl === 'array'
          ? `Read ${f.result} from a[${f.top + 1}] and move top down to ${f.top}. The value stays in the slot, but past top it no longer counts.`
          : `Read ${f.result} and move top to the next node${f.items.length ? `, ${topValue(f)}` : ', null'}. Return ${f.result}.`;
      case 'peek':
        return `peek() returns ${f.result}, the top, without removing it.`;
      case 'done':
        return f.items.length === 0
          ? `Done. The stack is empty after ${count(f.pushes, 'push', 'pushes')} and ${count(f.pops, 'pop', 'pops')}.`
          : `Done. ${count(f.items.length, 'item', 'items')} on the stack, ${topValue(f)} on top.`;
    }
  },
  takeaways: [
    'A stack is last in, first out (LIFO): push puts a value on top, pop takes the top one off, peek reads it without removing it.',
    'Every operation touches only the top, so push, pop and peek are O(1) for any size.',
    'In an array, a top index does the work: push is top = top + 1 then a[top] = v; pop reads a[top] then top = top − 1. A full array overflows.',
    'In a linked list, the head is the top: push links a new node in front, pop moves top to top.next. It grows until memory runs out.',
    'Push 3, 8 and 5, then pop three times: the values come back as 5, 8, 3. Then switch to “Push past full” and compare both implementations.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['push, pop, peek', 'O(1)', 'Only the top slot or node is read or written.'],
    ['Search for a value', 'O(n)', 'A stack offers no access below the top; you pop to look.'],
    ['Memory, array', 'O(capacity)', 'Fixed slots, used or not; full means overflow.'],
    ['Memory, linked list', 'O(n)', 'One node per item, plus a next pointer each.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Start with an empty stack. Run push(3), push(8), pop(), push(5), push(1), pop(), pop(). Which value is now on top?',
      answer: 3,
      hints: [
        'Write the stack bottom to top after each operation.',
        'pop always removes the most recent push that is still there.',
      ],
      solution:
        'After push(3), push(8): [3, 8]. pop() removes 8: [3]. push(5), push(1): [3, 5, 1]. pop() removes 1, pop() removes 5: [3]. Top is 3.',
    },
    {
      type: 'choice',
      prompt: 'The array stack has 6 slots and top = 5. What happens on push(7)?',
      options: [
        'Overflow: there is no free slot',
        'top becomes 6 and a[6] = 7',
        'The bottom item is dropped to make room',
      ],
      answer: 0,
      hints: ['Slots are a[0] to a[5]. Which ones are in use when top = 5?'],
      solution:
        'top = 5 means a[0] to a[5] are all in use, and a[6] does not exist. push reports overflow and leaves the stack as it was.',
    },
    {
      type: 'number',
      prompt: 'An array stack has top = 3. After pop(), pop(), push(4), what is top?',
      answer: 2,
      hints: ['Each pop lowers top by 1; each push raises it by 1.'],
      solution: '3 − 1 − 1 + 1 = 2. The 4 is written into a[2].',
    },
    {
      type: 'multi',
      prompt: 'Which operations are O(1) on a stack of n items?',
      options: ['push', 'pop', 'peek', 'finding whether 42 is anywhere in it'],
      answers: [0, 1, 2],
      hints: ['Which of these only look at the top?'],
      solution:
        'push, pop and peek touch only the top. Finding a value can mean looking at every item: O(n).',
    },
  ],
  nextTeaser:
    'Next up: queues and deques, which add at one end and remove at the other, using a circular buffer.',
};
