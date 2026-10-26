/** @typedef {import('$lib/algo-engine/practice-linked-lists.js').PracticeFrame} PracticeFrame */

/** A node id in narration: dummy, null, or the node's value. */
/** @param {PracticeFrame} f @param {number} id */
const v = (f, id) => (id === -2 ? 'dummy' : id === -1 ? 'null' : String(f.values[id]));

/** @param {PracticeFrame} f @param {number} id */
const after = (f, id) => (id === -2 ? f.dummyNext : id === -1 ? -1 : f.next[id]);

/** @param {number} n */
const ordinal = (n) =>
  n % 10 === 1 && n % 100 !== 11
    ? `${n}st`
    : n % 10 === 2 && n % 100 !== 12
      ? `${n}nd`
      : n % 10 === 3 && n % 100 !== 13
        ? `${n}rd`
        : `${n}th`;

/** @param {PracticeFrame} f */
const listOf = (f) => {
  /** @type {number[]} */
  const out = [];
  let s = f.problem === 'middle' ? f.head : f.dummyNext;
  while (s !== -1 && out.length <= f.values.length) {
    out.push(f.values[s]);
    s = f.next[s];
  }
  return out;
};

export const en = {
  slug: 'practice-linked-lists',
  topic: 'linked-lists',
  level: 'Intermediate',
  title: 'Practice: linked list problems',
  intro:
    'Three classic problems, each solved by moving a few pointers through the list instead of copying it. Merge two sorted lists by relinking their nodes behind a dummy node, find the middle with slow and fast pointers, and remove the nth node from the end in one pass by keeping fast n nodes ahead of slow.',
  summary:
    'Step through merging two sorted lists, finding the middle, and removing the nth node from the end on lists you type.',
  instruction:
    'Pick a problem, type your own lists (and n), then step through the solution. Watch the pointer labels and the teal arrow, the next pointer written on that step. Use the sandbox to answer the questions below.',
  problemLabel: 'Problem',
  problems: {
    merge: 'Merge two sorted lists',
    middle: 'Find the middle',
    nth: 'Remove nth from end',
  },
  listALabel: 'List A',
  listBLabel: 'List B (sorted)',
  listLabelSingle: 'List',
  listASortedLabel: 'List A (sorted)',
  nLabel: 'n (from the end)',
  newLists: 'New random lists',
  scroller: 'List drawing, scrolls sideways',
  nullLabel: 'null',
  listErrors: {
    empty: 'Type at least one value.',
    count: 'Use at most 8 values.',
    format: 'Separate whole numbers with commas or spaces.',
    range: 'Values must be from 0 to 99.',
    unsorted: 'Merging needs each list sorted from small to large.',
  },
  sortedForMerge: 'List A was sorted, because merging needs sorted lists.',
  /** @param {number} len */
  nError: (len) => `n must be a whole number from 1 to ${len}, the length of the list.`,
  stats: {
    comparisons: 'Comparisons',
    moves: 'Pointer moves',
    writes: 'next pointers written',
    result: 'Answer',
  },
  pending: '…',
  /** @param {PracticeFrame} f */
  answer(f) {
    if (f.kind !== 'done') return en.pending;
    if (f.problem === 'middle') return f.slow === -1 ? 'null' : v(f, f.slow);
    if (f.problem === 'nth') return f.removed === -1 ? 'none' : `removed ${v(f, f.removed)}`;
    return listOf(f).join(' → ');
  },
  /** @param {PracticeFrame} f */
  diagramLabel(f) {
    const result = listOf(f);
    if (f.problem === 'merge')
      return `Merging. Result so far from the dummy: ${result.length ? result.join(' → ') : 'empty'}.`;
    return `Linked list ${result.join(' → ')} → null.`;
  },
  /** @param {string} label @param {string} state */
  nodeTitle: (label, state) =>
    [label === 'dummy' ? 'Dummy node' : `Node ${label}`, state].filter(Boolean).join(', '),
  states: {
    visited: 'dummy',
    sorted: 'in the result',
    active: 'just linked',
    frontier: 'slow is here',
    swap: 'unlinked',
    path: 'answer',
  },
  markers: { active: '+', swap: '×', path: '✓' },
  legend: {
    visited: 'Dummy node',
    sorted: 'Already merged',
    active: 'Just linked',
    frontier: 'slow',
    swap: 'Unlinked',
    path: 'Answer',
    hot: 'next pointer just written',
  },
  /** @param {PracticeFrame} f @param {number} n */
  describe(f, n) {
    switch (f.kind) {
      case 'start':
        if (f.problem === 'merge')
          return `The dummy node gives the merged list a fixed start, so the first link needs no special case. a starts at ${v(f, f.a)}, b at ${v(f, f.b)}.`;
        if (f.problem === 'middle')
          return `slow and fast start at the head, ${v(f, f.head)}. slow takes one step per round, fast two.`;
        return `Put a dummy node before the head, so removing the first node works like any other. fast and slow start at the dummy.`;
      case 'take-a': {
        const taken = after(f, f.wrote);
        return `${v(f, taken)} ≤ ${v(f, f.b)}: link tail → ${v(f, taken)} and move a on to ${v(f, f.a)}.`;
      }
      case 'take-b': {
        const taken = after(f, f.wrote);
        return `${v(f, taken)} < ${v(f, f.a)}: link tail → ${v(f, taken)} and move b on to ${v(f, f.b)}.`;
      }
      case 'advance':
        return `tail moves to ${v(f, f.tail)}, the last node of the merged part.`;
      case 'attach':
        return `One list is used up, so link tail to the rest of the other, ${v(f, after(f, f.tail))}. One write attaches all of it.`;
      case 'move':
        return `slow steps to ${v(f, f.slow)}, fast jumps two to ${v(f, f.fast)}.`;
      case 'gap':
        return `fast moves to ${v(f, f.fast)}: now ${f.moves} of ${n} steps ahead of slow.`;
      case 'slide':
        return `Both move one: slow at ${v(f, f.slow)}, fast at ${v(f, f.fast)}. The gap stays ${n}.`;
      case 'unlink':
        return `fast is on the last node, so slow.next (${v(f, f.removed)}) is the ${ordinal(n)} from the end. slow.next = slow.next.next skips it.`;
      case 'done':
        if (f.problem === 'merge')
          return `Merged: ${listOf(f).join(' → ')}. ${f.comparisons} comparisons and no new nodes.`;
        if (f.problem === 'middle') {
          const len = f.values.length;
          return len % 2 === 0
            ? `fast cannot jump two more, so slow is on the middle: ${v(f, f.slow)}, the second of the two middle nodes of ${len}.`
            : `fast is on the last node, so slow is on the middle: ${v(f, f.slow)}, node ${f.slow + 1} of ${len}.`;
        }
        return `Return dummy.next: ${listOf(f).join(' → ') || 'empty'}. One pass, ${f.moves} pointer moves.`;
    }
  },
  takeaways: [
    'Merge: compare the two fronts, link the smaller one after tail, advance. When one list runs out, a single write attaches the rest of the other. O(n + m) time, O(1) extra memory.',
    'A dummy node in front of the result means the head is never a special case: the answer is just dummy.next.',
    'Middle: when fast has gone 2k nodes, slow has gone k. With an even length this version stops on the second middle node.',
    'nth from the end: move fast n steps ahead, then move both until fast is on the last node. slow then sits just before the node to remove, in one pass.',
    'Try “Remove nth from end” with n equal to the length: the dummy node lets the head go like any other node.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['Merge two sorted lists', 'O(n + m)', 'Each step links one node.'],
    ['Find the middle', 'O(n)', 'fast crosses the list once.'],
    ['Remove nth from end', 'O(n)', 'One pass with a fixed gap of n.'],
    ['Extra memory', 'O(1)', 'A few pointers; nodes are relinked, never copied.'],
  ],
  practiceTitle: 'Practice problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Merge A = 1, 4, 6 with B = 2, 3, 7. How many value comparisons does the merge make?',
      answer: 5,
      unit: 'comparisons',
      hints: [
        'One comparison per node linked while both lists still have nodes.',
        'Type the lists into the sandbox and read the Comparisons card at the last step.',
      ],
      solution:
        'It compares 1–2, 4–2, 4–3, 4–7 and 6–7, linking 1, 2, 3, 4, 6. Then A is empty and 7 is attached without a comparison: 5 comparisons.',
    },
    {
      type: 'number',
      prompt: 'Merge A = 1, 2, 3 with B = 4, 5, 6. How many comparisons now?',
      answer: 3,
      unit: 'comparisons',
      hints: ['Every node of A is smaller than every node of B.'],
      solution:
        'Each of 1, 2, 3 is compared with 4 and linked. Then A is empty, so all of B is attached in one write: 3 comparisons.',
    },
    {
      type: 'number',
      prompt: 'Find the middle of 10, 20, 30, 40, 50, 60. Which value does slow stop on?',
      answer: 40,
      hints: [
        'The loop runs while fast and fast.next exist.',
        'An even length has two middle nodes.',
      ],
      solution:
        'fast visits 10, 30, 50, then null after three rounds, while slow visits 20, 30, 40. It stops on 40, the second of the two middle nodes.',
    },
    {
      type: 'number',
      prompt: 'A list has 7 nodes. How many rounds does the middle-finding loop run?',
      answer: 3,
      unit: 'rounds',
      hints: ['fast moves two nodes per round and stops on the last node.'],
      solution:
        'fast goes from node 1 to 3, 5 and 7. On node 7 fast.next is null, so the loop stops after 3 rounds with slow on node 4.',
    },
    {
      type: 'number',
      prompt:
        'Remove the 2nd node from the end of 5, 8, 13, 21, 34. After the gap is set, how many rounds do slow and fast move together?',
      answer: 3,
      unit: 'rounds',
      hints: [
        'fast starts at the dummy and first moves 2 steps.',
        'The loop stops when fast is on the last node.',
      ],
      solution:
        'After the gap fast is on 8. Together they move 3 times, until fast is on 34 and slow on 13. Then 13.next skips 21.',
    },
    {
      type: 'choice',
      prompt:
        'Why does the remove-nth solution start both pointers at a dummy node instead of the head?',
      options: [
        'It makes the loop run fewer times',
        'So that removing the head is no special case: slow can stop before the head',
        'Because the head cannot be read twice',
      ],
      answer: 1,
      hints: ['Try n equal to the length of the list in the sandbox.'],
      solution:
        'To remove a node you need the node before it. The head has none, unless a dummy sits in front. With the dummy, slow stops on it and dummy.next = head.next removes the head.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of “remove the nth node from the end” in order.',
      items: [
        'slow.next = slow.next.next',
        'move fast n steps ahead',
        'move both until fast.next is null',
        'start fast and slow at a dummy before the head',
      ],
      answer: [3, 1, 2, 0],
      hints: ['The gap has to exist before both pointers move together.'],
      solution:
        'Start both at the dummy, open a gap of n, slide both until fast is on the last node, then unlink slow.next.',
    },
  ],
  nextTeaser: 'Next up: stacks, where everything happens at one end: last in, first out.',
};
