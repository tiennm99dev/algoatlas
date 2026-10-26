/** @typedef {import('$lib/algo-engine/doubly-circular-lists.js').DoublyFrame} DoublyFrame */
/** @typedef {import('$lib/algo-engine/doubly-circular-lists.js').DoublyOp} DoublyOp */

/** How a node id reads in narration: S for the sentinel, null, or the node's value. */
/** @param {DoublyFrame} f @param {number} id */
const name = (f, id) => (id === -2 ? 'S' : id === -1 ? 'null' : String(f.nodes[id]?.value));

/** @param {DoublyFrame} f @param {'next'|'prev'} field */
const of = (f, field) => (f.node >= 0 ? f.nodes[f.node][field] : -1);

export const en = {
  slug: 'doubly-circular-lists',
  topic: 'linked-lists',
  level: 'Beginner',
  title: 'Doubly and circular linked lists',
  intro:
    'A doubly linked list gives every node a prev pointer as well as next, so you can walk both ways and unlink a node you already hold without searching for the node before it. Close the list into a circle around one dummy sentinel node and the empty list, the first node and the last node all look the same: no null checks at all.',
  summary:
    'Insert and remove nodes in a doubly linked list, with and without a circular sentinel, and watch both pointer updates of every removal.',
  instruction:
    'Pick a node in the drawing (click it, or use the arrow keys and Enter), then press Remove and step through the two pointer writes. Insert at the front or back, and switch the design to compare the special cases each one needs.',
  modeLabel: 'Design',
  modes: { sentinel: 'Circular, with sentinel', plain: 'Head and tail, null ends' },
  valueLabel: 'Value',
  pushFront: 'Insert at front',
  pushBack: 'Insert at back',
  remove: 'Remove selected',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { back: 'Four at the back', front: 'Four at the front', random: 'Random' },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  scroller: 'List drawing, scrolls sideways',
  nullLabel: 'null',
  /** @param {DoublyOp} op @param {number | null} value */
  opChip: (op, value) =>
    op.type === 'push-front'
      ? `front(${op.value})`
      : op.type === 'push-back'
        ? `back(${op.value})`
        : `remove(${value ?? '?'})`,
  stats: {
    writes: 'Pointer writes (this operation)',
    special: 'Null-end special cases (whole log)',
    length: 'Length',
    selected: 'Selected node',
  },
  noneSelected: 'none',
  valueError: 'Values must be whole numbers from 0 to 99.',
  full: 'The list is full (8 nodes). Remove a node first.',
  logFull: 'The log is full (20 operations). Undo or reset to continue.',
  pickFirst: 'Select a node to remove first: click it in the drawing.',
  sentinelPick: 'The sentinel S is never removed: it is what keeps the list from ever being empty.',
  gonePick: 'That node is not in the list at the end of the log. Pick one from the final list.',
  /** @param {number[]} values @param {number[]} back @param {'sentinel'|'plain'} mode */
  listLabel: (values, back, mode) =>
    mode === 'sentinel'
      ? values.length === 0
        ? 'Circular doubly linked list with only the sentinel S, which points at itself both ways.'
        : `Circular doubly linked list: S ⇄ ${values.join(' ⇄ ')} ⇄ back to S. Backwards: ${back.join(', ')}.`
      : values.length === 0
        ? 'Empty doubly linked list: head and tail are null.'
        : `Doubly linked list: null ← ${values.join(' ⇄ ')} → null. Backwards: ${back.join(', ')}.`,
  /** @param {string} label @param {string} state @param {boolean} inList */
  nodeTitle: (label, state, inList) =>
    [label === 'S' ? 'Sentinel S' : `Node ${label}`, inList ? '' : 'outside the list', state]
      .filter(Boolean)
      .join(', '),
  states: {
    active: 'being inserted',
    swap: 'being removed',
    frontier: 'selected',
    visited: 'sentinel',
  },
  markers: { active: '+', swap: '×', frontier: '●' },
  legend: {
    active: 'Being inserted',
    swap: 'Being removed',
    frontier: 'Selected for removal',
    visited: 'Sentinel S',
    hot: 'Pointer just written',
  },
  /** @param {DoublyFrame} f */
  describe(f) {
    const v = f.value;
    const sentinel = f.mode === 'sentinel';
    const kind = f.op?.type;
    switch (f.kind) {
      case 'start':
        return sentinel
          ? 'Start with only the sentinel S: its next and prev point at itself.'
          : 'Start with an empty list: head and tail are null.';
      case 'create':
        return sentinel
          ? `Make a node for ${v} with prev = ${name(f, f.after)} and next = ${name(f, of(f, 'next'))}. Nothing points at it yet.`
          : kind === 'push-front'
            ? `Make a node for ${v} with prev = null and next = head (${name(f, of(f, 'next'))}).`
            : `Make a node for ${v} with prev = tail (${name(f, of(f, 'prev'))}) and next = null.`;
      case 'link-prev':
        return sentinel
          ? `${name(f, of(f, 'next'))}.prev = n: the node after the gap now points back at ${v}.`
          : `head.prev = n: the old first node, ${name(f, of(f, 'next'))}, now points back at ${v}.`;
      case 'link-next':
        return sentinel
          ? `${name(f, f.after)}.next = n: ${v} is in the list. Four pointer writes and not one if.`
          : `tail.next = n: the old last node, ${name(f, of(f, 'prev'))}, now points at ${v}.`;
      case 'set-head':
        return kind === 'push-front'
          ? `head = n: ${v} is first.`
          : kind === 'push-back'
            ? `The list was empty, so head must point at ${v} too. A special case.`
            : `${v} has no node before it, so head moves to ${name(f, of(f, 'next'))}. A special case.`;
      case 'set-tail':
        return kind === 'push-back'
          ? `tail = n: ${v} is last.`
          : kind === 'push-front'
            ? `The list was empty, so tail must point at ${v} too. A special case.`
            : `${v} has no node after it, so tail moves back to ${name(f, of(f, 'prev'))}. A special case.`;
      case 'select':
        return `Remove ${v}. We already hold the node, so there is no search: its prev (${name(f, of(f, 'prev'))}) and next (${name(f, of(f, 'next'))}) name the two pointers to fix.`;
      case 'unlink-next':
        return `${name(f, of(f, 'prev'))}.next = ${name(f, of(f, 'next'))}: walking forward now skips ${v}.`;
      case 'unlink-prev':
        return `${name(f, of(f, 'next'))}.prev = ${name(f, of(f, 'prev'))}: walking backward skips ${v} too.`;
      case 'free':
        return `${v} is freed after ${f.writes} pointer writes. The list holds ${f.length} nodes.`;
      case 'missing':
        return 'That node is no longer in the list, so there is nothing to remove.';
      case 'done':
        return sentinel
          ? `Done. ${f.length} nodes around the sentinel, and ${f.special} special cases.`
          : `Done. ${f.length} nodes, and ${f.special} special cases for a null end.`;
    }
  },
  takeaways: [
    'Each node has prev and next. Every insert writes four pointers and every removal two, wherever the node sits: O(1).',
    'Removing a node you already hold needs no search, because n.prev names the node whose next must change. A singly linked list has to walk from the head to find it.',
    'With null ends, inserting into an empty list or removing the first or last node takes a different branch that moves head or tail. Those branches are where bugs hide.',
    'A sentinel S closes the list into a circle: S.next is the first node, S.prev the last, and S points at itself when the list is empty. Every node then has a real prev and next, so the code has no ifs.',
    'Try removing the first and the last node in both designs: watch the special-case count climb only without the sentinel.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Insert at front or back',
      'O(1)',
      'S.next and S.prev (or head and tail) reach both ends at once.',
    ],
    ['Remove a node you hold', 'O(1)', 'Two writes: n.prev.next and n.next.prev.'],
    ['Find a value or index', 'O(n)', 'Still a walk from one end.'],
    ['Memory', 'O(n)', 'Two pointers per node, plus one sentinel node.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'With the sentinel design, how many pointer writes does removing a node take, wherever it sits?',
      answer: 2,
      unit: 'writes',
      hints: [
        'Step through a removal and watch the teal arrows.',
        'One write for forward, one for backward.',
      ],
      solution:
        'n.prev.next = n.next and n.next.prev = n.prev: two writes. The sentinel guarantees both neighbours exist, so there is never a branch.',
    },
    {
      type: 'multi',
      prompt:
        'Without a sentinel (head, tail and null ends), which removals hit a special case? Pick all that apply.',
      options: [
        'Removing the first node',
        'Removing a node in the middle',
        'Removing the last node',
        'Removing the only node',
      ],
      answers: [0, 2, 3],
      hints: ['A special case is a branch where n.prev or n.next is null.'],
      solution:
        'The first node has no prev (head moves), the last has no next (tail moves), and the only node has neither, so it hits both. A middle node has real neighbours on both sides.',
    },
    {
      type: 'choice',
      prompt: 'In an empty circular list with a sentinel S, what are S.next and S.prev?',
      options: ['Both null', 'Both S itself', 'S.next is null, S.prev is S'],
      answer: 1,
      hints: ['Reset the list in the sentinel design and look at the arrows on S.'],
      solution:
        'S points at itself both ways. Then insertAfter(S, v) works on an empty list exactly as on a full one.',
    },
    {
      type: 'choice',
      prompt:
        'insertAfter(x, v) runs x.next.prev = n before x.next = n. What goes wrong if you swap those two lines?',
      options: [
        'Nothing: the two writes are independent',
        'n.prev ends up pointing at n itself, and the old neighbour still points back at x',
        'The list loses every node after x',
      ],
      answer: 1,
      hints: ['After x.next = n, what does x.next.prev name?'],
      solution:
        'Once x.next = n, the expression x.next.prev means n.prev, so the write sets n.prev = n. The old neighbour keeps prev = x, and walking backwards skips n.',
    },
  ],
  nextTeaser:
    'Next up: linked list techniques, where you reverse a list in place and catch a cycle with two pointers.',
};
