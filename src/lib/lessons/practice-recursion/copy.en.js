/** @typedef {import('$lib/algo-engine/practice-recursion.js').HanoiFrame} HanoiFrame */
/** @typedef {import('$lib/algo-engine/practice-recursion.js').HanoiCall} HanoiCall */
/** @typedef {import('$lib/algo-engine/practice-recursion.js').SubsetFrame} SubsetFrame */
/** @typedef {import('$lib/algo-engine/practice-recursion.js').CallStatus} CallStatus */

const PEGS = ['A', 'B', 'C'];

/** @param {HanoiCall} c */
const hanoiName = (c) => `hanoi(${c.n}, ${PEGS[c.from]}, ${PEGS[c.to]}, ${PEGS[c.via]})`;

/** @param {number[]} chosen @param {string[]} items */
const setText = (chosen, items) => `{${chosen.map((i) => items[i]).join(', ')}}`;

/** @param {number} i @param {number[]} chosen @param {string[]} items */
const subsetName = (i, chosen, items) => `subsets(${i}, ${setText(chosen, items)})`;

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'practice-recursion',
  topic: 'recursion',
  level: 'Intermediate',
  title: 'Practice: recursive thinking',
  intro:
    'Recursive thinking means trusting the smaller call. To move a tower of n disks, assume you can already move n − 1 of them, and the whole plan fits in three lines. To list every subset, decide one item, leave it out or take it, and let the smaller call list the rest.',
  summary:
    'Solve the towers of Hanoi and generate every subset recursively, with the call tree and the call stack alongside.',
  instruction:
    'Pick a problem, set the number of disks or the items, then step. The call tree shows every call: the running one, the ones waiting on the stack, and the finished ones. Use the board and the tree to answer the questions below.',
  problemLabel: 'Problem',
  problems: { hanoi: 'Towers of Hanoi', subsets: 'Subsets' },
  disksLabel: 'Disks',
  itemsLabel: 'Items',
  /** @param {number} max */
  disksError: (max) => `Use a whole number of disks from 1 to ${max}.`,
  itemErrors: {
    format: 'Use single letters or digits, for example a, b, c.',
    count: 'Use between 1 and 5 items.',
    duplicate: 'Each item may appear only once.',
  },
  pegs: PEGS,
  roles: { from: 'from', to: 'to', via: 'via' },
  /** @param {number[][]} pegs */
  boardAria: (pegs) =>
    pegs
      .map(
        (disks, p) =>
          `Peg ${PEGS[p]}: ${disks.length === 0 ? 'empty' : `disks ${disks.join(', ')}, bottom first`}.`,
      )
      .join(' '),
  boardTitle: 'Board',
  chosenTitle: 'Items, decided so far',
  /** @param {string[]} items @param {number[]} chosen @param {number} i */
  chosenAria: (items, chosen, i) =>
    `Items ${items.join(', ')}. Taken: ${setText(chosen, items)}.${i >= 0 && i < items.length ? ` Deciding ${items[i]}.` : ''}`,
  treeTitle: 'Call tree',
  /** @param {number} done @param {number} total */
  treeAria: (done, total) => `Call tree: ${done} of ${total} calls finished.`,
  /** @param {CallStatus} s */
  statusText: (s) =>
    ({
      '': 'not called yet',
      active: 'running',
      waiting: 'waiting on the stack',
      done: 'finished',
    })[s],
  hanoiName,
  subsetName,
  setText,
  stats: {
    moves: 'Moves',
    calls: 'Calls made',
    depth: 'Stack depth',
    outputs: 'Subsets output',
  },
  /** @param {number} done @param {number} total */
  ofTotal: (done, total) => `${done} of ${total}`,
  stackTitle: 'Call stack (outermost first)',
  stackEmpty: 'empty',
  outputsTitle: 'Output, in order',
  outputsEmpty: 'nothing yet',
  legend: {
    active: 'Running now',
    waiting: 'Waiting on the stack',
    done: 'Finished',
    output: 'Output a subset',
    idle: 'Not called yet',
    moved: 'Disk just moved',
    taken: 'Taken',
    left: 'Left out',
    deciding: 'Being decided',
  },
  markers: {
    active: '▶',
    waiting: '…',
    done: '✓',
    output: '★',
    moved: '▶',
    taken: '+',
    left: '−',
    deciding: '?',
  },
  /**
   * @param {HanoiFrame} f
   * @param {HanoiCall[]} calls
   */
  describeHanoi(f, calls) {
    const c = calls[f.call];
    const total = calls[0]?.n ?? 0;
    switch (f.kind) {
      case 'start':
        return `Move all ${plural(total, 'disk')} from peg A to peg C, one disk at a time, never putting a bigger disk on a smaller one.`;
      case 'call':
        return c.n === 1
          ? `Call ${hanoiName(c)}: a single disk, the base case.`
          : `Call ${hanoiName(c)}. Trust the smaller call: first park the top ${plural(c.n - 1, 'disk')} on ${PEGS[c.via]}.`;
      case 'move': {
        const mv = /** @type {NonNullable<HanoiFrame['move']>} */ (f.move);
        const where = `disk ${mv.disk} from ${PEGS[mv.from]} to ${PEGS[mv.to]}`;
        return c.n === 1
          ? `Move ${where} (move ${f.moves}). ${hanoiName(c)} is done.`
          : `${c.n === 2 ? 'The smaller disk is' : `The ${c.n - 1} smaller disks are`} parked on ${PEGS[c.via]}, so move ${where} (move ${f.moves}). Now bring ${c.n === 2 ? 'it' : 'them'} back on top.`;
      }
      case 'return':
        return `${hanoiName(c)} is done: ${c.n} disks moved from ${PEGS[c.from]} to ${PEGS[c.to]}.`;
      case 'done':
        return `Solved: ${plural(total, 'disk')} in ${plural(f.moves, 'move')}, which is 2${sup(total)} − 1, the fewest possible.`;
    }
  },
  /**
   * @param {SubsetFrame} f
   * @param {string[]} items
   */
  describeSubsets(f, items) {
    const all = 2 ** items.length;
    switch (f.kind) {
      case 'start':
        return `List every subset of {${items.join(', ')}}: for each item, first leave it out, then take it.`;
      case 'call':
        return `Call ${subsetName(f.i, f.chosen, items)}: decide ${items[f.i]}. First leave it out.`;
      case 'take':
        return `Back in ${subsetName(f.i, f.chosen, items)}: every subset without ${items[f.i]} is listed. Now take ${items[f.i]}.`;
      case 'output':
        return `i = n, every item is decided: output ${setText(f.chosen, items)}, subset ${f.outputs.length} of ${all}.`;
      case 'done':
        return `Done: all ${all} subsets from ${f.calls} calls.`;
    }
  },
  takeaways: [
    'Trust the smaller call: write the step for n assuming the call for n − 1 already works, then make sure the base case is right.',
    'Hanoi makes T(n) = 2·T(n − 1) + 1 moves, which is 2ⁿ − 1. Disk k moves 2ⁿ⁻ᵏ times, so the smallest disk moves every other move.',
    'Each subset is a path of n take-or-leave choices, so there are 2ⁿ subsets and the call tree has 2ⁿ⁺¹ − 1 calls.',
    'Both recursions are only n levels deep (n + 1 for subsets), so the stack stays small even though the work is exponential.',
    'Try Hanoi with 4 and then 5 disks and watch where disk 1 goes first: the answer depends on whether n is even or odd.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['Hanoi, moves', 'Θ(2ⁿ)', 'T(n) = 2·T(n − 1) + 1 gives 2ⁿ − 1 moves; no solution uses fewer.'],
    ['Hanoi, memory', 'O(n)', 'At most n calls are on the stack at once.'],
    ['Subsets, time', 'O(n·2ⁿ)', '2ⁿ⁺¹ − 1 calls, and each of the 2ⁿ outputs lists up to n items.'],
    [
      'Subsets, memory',
      'O(n²)',
      'n + 1 calls deep, each keeping its own copy of chosen. One shared list, undone after each call, cuts it to O(n).',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many moves does the recursive solution need for 5 disks?',
      answer: 31,
      unit: 'moves',
      hints: [
        'Set Disks to 5 and step to the end.',
        'Moves(n) = 2·Moves(n − 1) + 1, with Moves(1) = 1.',
      ],
      solution:
        'Moves(n) = 2ⁿ − 1, so 2⁵ − 1 = 31: 15 to park four disks, 1 for disk 5, 15 to bring them back.',
    },
    {
      type: 'number',
      prompt: 'With 4 disks, how many times does disk 1, the smallest, move?',
      answer: 8,
      unit: 'times',
      hints: ['Count the moves of disk 1 on the board, or look at the move numbers it makes.'],
      solution:
        'Disk k moves 2ⁿ⁻ᵏ times, so disk 1 moves 2³ = 8 times: every odd-numbered move of the 15.',
    },
    {
      type: 'choice',
      prompt: 'With 4 disks going from A to C, where does disk 1 go on the very first move?',
      options: ['Peg B', 'Peg C', 'It does not move first'],
      answer: 0,
      hints: [
        'Set Disks to 4 and take a few steps.',
        'hanoi(4, A, C, B) first calls hanoi(3, A, B, C), which calls hanoi(2, A, C, B)…',
      ],
      solution:
        'The calls alternate the target peg: hanoi(3, A, B, C), hanoi(2, A, C, B), hanoi(1, A, B, C). So disk 1 goes to B first. With an odd number of disks it goes to C first.',
    },
    {
      type: 'number',
      prompt: 'With 3 disks, which disk makes move number 4?',
      answer: 3,
      hints: ['Set Disks to 3 and step until Moves shows 4.'],
      solution:
        'The first 3 moves park disks 1 and 2 on B, so move 4 is the biggest disk, 3, going from A to C. It is the middle move of the 7.',
    },
    {
      type: 'number',
      prompt: 'How many calls to hanoi does solving 4 disks make, counting the first call?',
      answer: 15,
      unit: 'calls',
      hints: ['Read “Calls made” at the last step, or count the nodes of the call tree.'],
      solution:
        'Calls(n) = 1 + 2·Calls(n − 1) with Calls(1) = 1, so Calls(4) = 15. With the base case at n = 1, every call makes exactly one move.',
    },
    {
      type: 'number',
      prompt: 'How many subsets does {a, b, c, d} have, counting the empty set?',
      answer: 16,
      unit: 'subsets',
      hints: ['Switch to Subsets, type a, b, c, d and step to the end.'],
      solution: 'Each of the 4 items is either left out or taken: 2 × 2 × 2 × 2 = 2⁴ = 16 subsets.',
    },
    {
      type: 'choice',
      prompt: 'For the items a, b, c, which subset is output 4th?',
      options: ['{a}', '{b, c}', '{c}', '{a, b}'],
      answer: 1,
      hints: ['Every call leaves its item out before taking it. Watch the output list.'],
      solution:
        'The order is {}, {c}, {b}, {b, c}, {a}, {a, c}, {a, b}, {a, b, c}: binary counting with a as the highest bit. The 4th is {b, c}.',
    },
    {
      type: 'number',
      prompt: 'How many calls does listing the subsets of 3 items make?',
      answer: 15,
      unit: 'calls',
      hints: ['Count the nodes of the call tree for a, b, c.'],
      solution:
        'The call tree is a full binary tree with 2³ = 8 leaves (one per subset) and 7 inner calls: 2⁴ − 1 = 15 calls.',
    },
  ],
  nextTeaser:
    'Next up: binary trees and terminology. A tree is a recursive structure: a root with smaller trees below it.',
};

/** @param {number} n */
function sup(n) {
  return String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
}
