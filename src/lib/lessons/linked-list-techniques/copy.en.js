/** @typedef {import('$lib/algo-engine/linked-list-techniques.js').TechFrame} TechFrame */

/** A node's value for narration, or null. */
/** @param {TechFrame} f @param {number} slot */
const v = (f, slot) => (slot < 0 ? 'null' : String(f.values[slot]));

export const en = {
  slug: 'linked-list-techniques',
  topic: 'linked-lists',
  level: 'Intermediate',
  title: 'Linked list techniques',
  intro:
    'Most linked list problems are solved by moving a few pointers carefully rather than by copying nodes. Reversal walks prev, curr and next down the list and flips one arrow at a time; the tortoise and hare move one and two steps at a time to find the middle or to catch a cycle, all in O(1) extra memory.',
  summary:
    'Reverse a linked list in place and detect a cycle with Floyd’s tortoise and hare, step by step.',
  instruction:
    'Pick a technique, type the list values, and for cycle detection choose which node the tail points back to (or click a node). Step through and watch the pointer labels: slow and fast race until they land on the same node.',
  algoLabel: 'Technique',
  algos: { floyd: 'Cycle detection (Floyd)', reverse: 'Reverse in place' },
  valuesLabel: 'Values',
  cycleLabel: 'Tail points to',
  noCycle: 'null (no cycle)',
  /** @param {number} i @param {number} value */
  cycleOption: (i, value) => `#${i} (${value})`,
  newList: 'New random list',
  scroller: 'List drawing, scrolls sideways',
  nullLabel: 'null',
  valueErrors: {
    empty: 'Type at least one value.',
    count: 'Use at most 10 values.',
    format: 'Separate whole numbers with commas or spaces.',
    range: 'Values must be from 0 to 99.',
  },
  /** @param {number[]} values @param {boolean} cyclic @param {number} cycleTo */
  listLabel: (values, cyclic, cycleTo) =>
    values.length === 0
      ? 'Empty list.'
      : cyclic
        ? `Linked list ${values.join(' → ')}, and the tail points back to #${cycleTo} (${values[cycleTo]}), making a cycle.`
        : `Linked list ${values.join(' → ')} → null.`,
  /** @param {number[]} done @param {number[]} rest */
  reverseLabel: (done, rest) =>
    `Reversed part from prev: ${done.length ? done.join(' → ') + ' → null' : 'null'}. Rest from curr: ${rest.length ? rest.join(' → ') + ' → null' : 'null'}.`,
  /** @param {number} i @param {number} value @param {string} state */
  nodeTitle: (i, value, state) => [`#${i}: ${value}`, state].filter(Boolean).join(', '),
  stats: {
    reverse: { steps: 'Loop rounds', moves: 'Arrows flipped' },
    floyd: { steps: 'Rounds', moves: 'Pointer moves' },
    mu: 'Tail length μ',
    lambda: 'Cycle length λ',
  },
  states: {
    active: 'curr',
    visited: 'already reversed',
    frontier: 'on the cycle',
    sorted: 'meeting point',
    path: 'cycle start',
  },
  markers: { sorted: '✓', path: '★' },
  legend: {
    active: 'curr (being flipped)',
    visited: 'Already reversed',
    frontier: 'On the cycle',
    sorted: 'Meeting point',
    path: 'Cycle start',
    hot: 'Pointer just written',
    target: 'Thick outline: the node the tail points back to (click a node to change it)',
  },
  /** @param {TechFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        if (f.head === -1) return 'The list is empty.';
        return f.algo === 'reverse'
          ? `prev starts at null and curr at the head, ${v(f, f.curr)}.`
          : `slow and fast both start at the head, ${v(f, f.head)}. Each round slow takes one step and fast takes two.`;
      case 'save':
        return `Save next = curr.next (${v(f, f.nxt)}) before the arrow out of ${v(f, f.curr)} is overwritten.`;
      case 'flip':
        return `Flip the arrow: ${v(f, f.curr)}.next = prev (${v(f, f.prev)}). One write, no new nodes.`;
      case 'advance':
        return f.curr === -1
          ? `prev moves to ${v(f, f.prev)} and curr to null: every arrow is flipped.`
          : `prev moves to ${v(f, f.prev)} and curr to ${v(f, f.curr)}.`;
      case 'move':
        return `Round ${f.steps}: slow steps to ${v(f, f.slow)}, fast jumps two to ${v(f, f.fast)}.`;
      case 'meet':
        return `slow and fast meet at ${v(f, f.met)} after ${f.steps} rounds, so there is a cycle. Inside it fast gains exactly one node per round, so it can never jump over slow.`;
      case 'no-cycle':
        return `fast reached the end of the list after ${f.steps} rounds: a list that ends in null has no cycle.`;
      case 'reset':
        return 'Phase 2: move slow back to the head and keep fast at the meeting point. Both are now the same number of steps from the cycle start.';
      case 'move2':
        return `Both take one step: slow is at ${v(f, f.slow)}, fast at ${v(f, f.fast)}.`;
      case 'entry':
        return `They meet again at #${f.entry} (${v(f, f.entry)}): this is where the cycle starts.`;
      case 'done':
        if (f.algo === 'reverse')
          return f.head === -1
            ? 'Nothing to reverse.'
            : `head = prev = ${v(f, f.head)}. The list is reversed with ${f.moves} arrow flips and three extra pointers.`;
        return f.entry >= 0
          ? `The cycle starts at #${f.entry} (${v(f, f.entry)}), found with ${f.moves} pointer moves and two extra pointers.`
          : `No cycle, found with ${f.moves} pointer moves and two extra pointers.`;
    }
  },
  takeaways: [
    'Reversal keeps three pointers: prev (the reversed part), curr (the node being flipped) and next (the rest, saved before the flip). Each node is flipped once: O(n) time, O(1) memory.',
    'Fast and slow pointers: when fast has moved 2k nodes, slow has moved k. Stop when fast runs off the end and slow is at the middle.',
    'Floyd’s cycle detection: in a cycle, fast closes the gap on slow by one node per round, so they meet within one lap. If fast reaches null, there is no cycle.',
    'To find where the cycle starts, put one pointer back at the head and step both by one: they meet exactly at the start, after μ steps, the length of the tail.',
    'Try pointing the tail at #0 and then at the last node: watch how many rounds slow and fast need in each case.',
  ],
  complexityHead: ['Technique', 'Cost', 'Why'],
  complexity: [
    ['Reverse in place', 'O(n)', 'One pass; each arrow flips once.'],
    ['Floyd: detect a cycle', 'O(n)', 'They meet within μ + λ rounds, at most n.'],
    ['Floyd: find the cycle start', 'O(n)', 'μ more steps of both pointers.'],
    ['Extra memory', 'O(1)', 'Reversal keeps three pointers, Floyd two.'],
    ['Hash set of visited nodes', 'O(n) memory', 'The simple alternative to Floyd.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Reverse a list of 6 nodes in place. How many next pointers does the algorithm overwrite?',
      answer: 6,
      unit: 'arrows',
      hints: [
        'Each round of the loop flips one arrow.',
        'Even the old head is flipped: it now points at null.',
      ],
      solution:
        'The loop runs once per node and writes curr.next = prev each time: 6 writes. The old head’s arrow becomes null.',
    },
    {
      type: 'number',
      prompt:
        'The list is 3 → 8 → 5 → 1 → 9 → 6 → 2 and the tail points back to #2 (5). After slow and fast meet, how many phase-2 steps does it take to find the cycle start?',
      answer: 2,
      unit: 'steps',
      hints: [
        'Phase 2 takes μ steps: the number of nodes before the cycle starts.',
        'Count the nodes before #2.',
      ],
      solution:
        'Two nodes, 3 and 8, come before the cycle start 5, so μ = 2. slow walks 3 → 8 → 5 while fast walks round the cycle to the same node.',
    },
    {
      type: 'number',
      prompt:
        'A list of 9 nodes ends in null. How many rounds does Floyd’s loop run before fast stops?',
      answer: 4,
      unit: 'rounds',
      hints: [
        'fast moves two nodes per round from #0.',
        'The loop needs both fast and fast.next to exist.',
      ],
      solution:
        'fast visits #0, #2, #4, #6, #8. At #8 fast.next is null, so the loop stops after 4 rounds, with slow on #4, the middle.',
    },
    {
      type: 'choice',
      prompt:
        'Why does Floyd’s algorithm beat the obvious “remember every node in a hash set” check?',
      options: [
        'It is asymptotically faster',
        'It needs only two pointers instead of O(n) extra memory',
        'It works on lists without a cycle, which the hash set cannot',
      ],
      answer: 1,
      hints: ['Both are O(n) time. Compare what else they store.'],
      solution:
        'Both run in O(n) time, but the hash set stores up to n nodes while Floyd keeps only slow and fast.',
    },
  ],
  nextTeaser:
    'Next up: practice linked list problems, where you merge lists, find the middle and remove the nth node from the end.',
};
