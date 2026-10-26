/** @typedef {import('$lib/algo-engine/singly-linked-lists.js').SinglyFrame} SinglyFrame */
/** @typedef {import('$lib/algo-engine/singly-linked-lists.js').SinglyOp} SinglyOp */

/** @param {SinglyFrame} f @param {number} slot */
const valueAt = (f, slot) => f.nodes[slot]?.value;

/** A count with its noun, singular for 1. */
/** @param {number | undefined} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'singly-linked-lists',
  topic: 'linked-lists',
  level: 'Beginner',
  title: 'Singly linked lists',
  intro:
    'A singly linked list stores each value in its own node, and each node holds a pointer to the next one. The list only remembers its head, so adding or removing at the front rewires one or two pointers, while reaching the i-th value means walking i links.',
  summary:
    'Insert and delete at the head of a singly linked list, read by index, and watch the next pointers rewire step by step.',
  instruction:
    'Type a value and insert it at the head, delete the head, read an index, or delete a value, then step through the run. Watch which arrow changes on each step: the teal arrow is the pointer just written.',
  valueLabel: 'Value',
  indexLabel: 'Index',
  insertHead: 'Insert at head',
  deleteHead: 'Delete head',
  get: 'Get index',
  remove: 'Delete value',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { short: 'Four nodes', long: 'Eight nodes', random: 'Random' },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  scroller: 'List drawing, scrolls sideways',
  nullLabel: 'null',
  /** @param {SinglyOp} op */
  opChip: (op) =>
    op.type === 'insert-head'
      ? `insertHead(${op.value})`
      : op.type === 'delete-head'
        ? 'deleteHead()'
        : op.type === 'get'
          ? `get(${op.index})`
          : `delete(${op.value})`,
  stats: {
    steps: 'Hops (this operation)',
    writes: 'Pointer writes (this operation)',
    length: 'Length',
  },
  valueError: 'Values must be whole numbers from 0 to 99.',
  indexError: 'The index must be a whole number from 0 to 9.',
  full: 'The list is full (10 nodes). Delete a node first.',
  logFull: 'The log is full (18 operations). Undo or reset to continue.',
  /** @param {number[]} values */
  listLabel: (values) =>
    values.length === 0
      ? 'Empty list: head is null.'
      : `Singly linked list, head first: ${values.join(' → ')} → null.`,
  /** @param {number | null} value @param {string} state @param {boolean} inList */
  nodeTitle: (value, state, inList) =>
    [`Node ${value}`, inList ? '' : 'outside the list', state].filter(Boolean).join(', '),
  states: {
    active: 'new node',
    compare: 'being compared',
    frontier: 'cur',
    visited: 'passed',
    sorted: 'found',
    swap: 'being removed',
  },
  markers: { active: '+', compare: '?', sorted: '✓', swap: '×' },
  legend: {
    active: 'New node',
    frontier: 'cur points here',
    compare: 'Compared',
    visited: 'Walked past',
    sorted: 'Found',
    swap: 'Being removed',
    hot: 'Pointer just written',
  },
  /** @param {SinglyFrame} f */
  describe(f) {
    const v = f.op?.value;
    switch (f.kind) {
      case 'start':
        return f.length === 0
          ? 'The list is empty: head is null.'
          : `The list holds ${count(f.length, 'node', 'nodes')}.`;
      case 'create':
        return f.nodes[f.fresh].next === -1
          ? `Make a node for ${v}. The list is empty, so its next is null.`
          : `Make a node for ${v} and point its next at the current head, ${valueAt(f, f.nodes[f.fresh].next)}. Nothing in the list has changed yet.`;
      case 'link-head':
        return `Move head to the new node. ${v} is now first: 2 pointer writes, no walking.`;
      case 'empty':
        return 'Head is null: there is nothing to delete.';
      case 'unlink-head':
        return f.head === -1
          ? `Head moves to the old head’s next, which is null. The list is now empty.`
          : `Head moves to the old head’s next, ${valueAt(f, f.head)}. The old first node is no longer reachable.`;
      case 'free':
        return `The cut-out node is freed. The list has ${count(f.length, 'node', 'nodes')}.`;
      case 'walk-start':
        return f.cur === -1
          ? 'cur starts at head, which is null.'
          : `cur starts at head, ${valueAt(f, f.cur)}. To reach index ${f.op?.index} it must follow ${count(f.op?.index, 'next pointer', 'next pointers')}.`;
      case 'walk':
        return f.cur === -1
          ? `Hop ${f.steps}: cur fell off the end of the list.`
          : `Hop ${f.steps}: cur = cur.next, now at ${valueAt(f, f.cur)}.`;
      case 'found':
        return `Index ${f.op?.index} holds ${valueAt(f, f.cur)}, reached after ${count(f.steps, 'hop', 'hops')}. There is no shortcut: access by index is O(n).`;
      case 'out-of-range':
        return `Index ${f.op?.index} is past the end: the list has only ${count(f.length, 'node', 'nodes')}.`;
      case 'scan-start':
        return f.cur === -1
          ? `cur starts at head, which is null, so ${v} cannot be in the list.`
          : `Look for ${v}: prev starts at null and cur at the head.`;
      case 'compare':
        return valueAt(f, f.cur) === v
          ? `cur holds ${v}: this is the node to delete.`
          : `cur holds ${valueAt(f, f.cur)}, not ${v}.`;
      case 'advance':
        return f.cur === -1
          ? 'prev moves to cur, and cur moves to null: the end of the list.'
          : `prev moves to cur, and cur moves on to ${valueAt(f, f.cur)}.`;
      case 'miss':
        return `${v} is not in the list, after ${count(f.steps, 'hop', 'hops')}.`;
      case 'unlink':
        return f.prev === -1
          ? `${v} is the first node, so head skips it: head = cur.next. One pointer write.`
          : `prev.next skips over ${v}: node ${valueAt(f, f.prev)} now points where ${v} pointed. One pointer write.`;
      case 'done':
        return f.length === 0
          ? 'Done. The list is empty.'
          : `Done. The list holds ${count(f.length, 'node', 'nodes')}.`;
    }
  },
  takeaways: [
    'A node is a value plus a next pointer; the list itself is just a head pointer. The last node points at null.',
    'Inserting at the head writes two pointers (node.next, then head) and deleting it writes one, whatever the length: O(1).',
    'Set node.next before moving head. The other order loses the rest of the list, because nothing points at the old first node any more.',
    'There is no index arithmetic: reaching index i means following i next pointers, so access and search are O(n).',
    'Try “Eight nodes”, then get index 7 and delete the head: count the hops each one needs.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Insert or delete at head', 'O(1)', 'One or two pointer writes, no walking.'],
    ['Access index i', 'O(i), worst O(n)', 'Follow i next pointers from the head.'],
    ['Search or delete a value', 'O(n)', 'Walk until the value turns up; then one write.'],
    ['Memory', 'O(n)', 'One node per value, plus one pointer per node.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'The list is 12 → 7 → 30 → 4 → null. How many next pointers does get(3) follow?',
      answer: 3,
      unit: 'hops',
      hints: ['cur starts at the head, index 0, before any hop.', 'Each hop moves one index on.'],
      solution:
        'cur starts at 12 (index 0) and hops to 7, 30, then 4: three hops to reach index 3. Load “Four nodes” and run get(3) to watch it.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of insertHead(v) in a safe order.',
      items: ['head = node', 'node = new Node(v)', 'node.next = head'],
      answer: [1, 2, 0],
      hints: [
        'You need the node before you can set its pointer.',
        'Which step would lose the old list if it ran first?',
      ],
      solution:
        'Create the node, point it at the current head, then move head. Moving head first would leave nothing pointing at the old first node.',
    },
    {
      type: 'choice',
      prompt: 'A singly linked list has a million nodes. What does deleting its head cost?',
      options: ['O(1)', 'O(log n)', 'O(n)'],
      answer: 0,
      hints: ['Count the pointer writes in deleteHead.'],
      solution:
        'deleteHead writes one pointer, head = head.next, whatever the length, so it is O(1).',
    },
    {
      type: 'number',
      prompt:
        'The list is 5 → 18 → 23 → 41 → null. delete(23) walks with prev and cur. How many hops does cur make before the unlink?',
      answer: 2,
      unit: 'hops',
      hints: ['cur starts at 5 without a hop.', 'cur stops on the node that holds 23.'],
      solution:
        'cur goes 5 → 18 → 23: two hops. Then prev (18) gets prev.next = cur.next, so 18 points at 41.',
    },
  ],
  nextTeaser:
    'Next up: doubly and circular linked lists, where a prev pointer and a sentinel make removal O(1).',
};
