/**
 * Binary tree traversals run iteratively. The tree uses the array layout (slot i has children
 * 2i + 1 and 2i + 2). Preorder, inorder and postorder share one explicit stack of two kinds of
 * item: "expand node" (still to explore) and "visit node" (output it when popped). Expanding a
 * node pushes its parts in reverse, so they pop in the order the traversal names; only the
 * position of "visit node" changes between the three. Level order uses a FIFO queue instead.
 */

import { filled, formatSlots, parseSlots } from '$lib/components/slot-tree.js';

/** Four levels of the array layout. */
export const MAX_SLOTS = 15;
export const MAX_LABEL = 2;

export const ORDERS = /** @type {const} */ (['pre', 'in', 'post', 'level']);
/** @typedef {typeof ORDERS[number]} TraversalOrder */

/** @type {Record<TraversalOrder, string[]>} */
export const traversalPseudocode = {
  pre: [
    'stack = [expand root]',
    'while stack is not empty:',
    '  item = pop the top',
    '  if item is visit node: output node',
    '  else push expand right, expand left, visit node',
  ],
  in: [
    'stack = [expand root]',
    'while stack is not empty:',
    '  item = pop the top',
    '  if item is visit node: output node',
    '  else push expand right, visit node, expand left',
  ],
  post: [
    'stack = [expand root]',
    'while stack is not empty:',
    '  item = pop the top',
    '  if item is visit node: output node',
    '  else push visit node, expand right, expand left',
  ],
  level: [
    'queue = [root]',
    'while queue is not empty:',
    '  node = dequeue the front',
    '  output node',
    '  enqueue left child, then right child',
  ],
};

/** @typedef {(string | null)[]} Slots  null is an empty slot. */

/**
 * @typedef {object} WorkItem
 * @property {number} slot
 * @property {boolean} visit  true: output the node when popped; false: expand it.
 */

/**
 * @typedef {object} TraversalFrame
 * @property {'start'|'expand'|'visit'|'enqueue'|'done'} kind
 * @property {TraversalOrder} order
 * @property {number} current  Slot acted on, -1 when none.
 * @property {WorkItem[]} work  Stack bottom to top, or queue front to back.
 * @property {number[]} output  Slots in visit order.
 * @property {(number | null)[]} number  Per slot: its 1-based visit number, null until visited.
 * @property {number} pushes
 * @property {number} pops
 * @property {number} peak  Largest stack or queue size so far.
 * @property {number[]} lines
 */

/**
 * Reads a tree written in array order: comma- or space-separated labels, `-` for an empty
 * slot. Trailing empty slots are dropped.
 * @param {string} text
 * @returns {{ slots: Slots } | { error: import('$lib/components/slot-tree.js').SlotError }}
 */
export function parseTree(text) {
  return parseSlots(text, {
    max: MAX_SLOTS,
    isEntry: (p) => /^[A-Za-z0-9+*/×÷−^]{1,2}$/.test(p),
    toValue: (p) => p,
  });
}

/** Writes slots back in the text form parseTree reads. @param {Slots} slots */
export const formatTree = formatSlots;

/**
 * Reference traversal by plain recursion (level order by levels), used as the oracle and to
 * list all four orders side by side.
 * @param {Slots} slots @param {TraversalOrder} order @returns {number[]}
 */
export function traversalOrder(slots, order) {
  /** @type {number[]} */
  const out = [];
  if (order === 'level') {
    for (let i = 0; i < slots.length; i++) if (filled(slots, i)) out.push(i);
    return out;
  }
  /** @param {number} i */
  const go = (i) => {
    if (!filled(slots, i)) return;
    if (order === 'pre') out.push(i);
    go(2 * i + 1);
    if (order === 'in') out.push(i);
    go(2 * i + 2);
    if (order === 'post') out.push(i);
  };
  go(0);
  return out;
}

/**
 * @param {Slots} slots
 * @param {TraversalOrder} order
 * @returns {TraversalFrame[]}
 */
export function traversalTrace(slots, order) {
  /** @type {WorkItem[]} */
  const work = [];
  /** @type {number[]} */
  const output = [];
  /** @type {(number | null)[]} */
  const number = slots.map(() => null);
  let pushes = 0;
  let pops = 0;
  let peak = 0;
  /** @type {TraversalFrame[]} */
  const frames = [];

  /** @param {TraversalFrame['kind']} kind @param {number} current @param {number[]} lines */
  function push(kind, current, lines) {
    frames.push({
      kind,
      order,
      current,
      work: work.map((w) => ({ ...w })),
      output: output.slice(),
      number: number.slice(),
      pushes,
      pops,
      peak,
      lines: lines.slice(),
    });
  }

  /** @param {number} slot @param {boolean} visit */
  function add(slot, visit) {
    if (!visit && !filled(slots, slot)) return;
    work.push({ slot, visit });
    pushes++;
    peak = Math.max(peak, work.length);
  }

  /** @param {number} slot */
  function emit(slot) {
    output.push(slot);
    number[slot] = output.length;
  }

  add(0, false);
  push('start', -1, [0]);

  while (work.length > 0) {
    const item = /** @type {WorkItem} */ (order === 'level' ? work.shift() : work.pop());
    pops++;
    const i = item.slot;
    if (order === 'level') {
      emit(i);
      push('visit', i, [1, 2, 3]);
      if (filled(slots, 2 * i + 1) || filled(slots, 2 * i + 2)) {
        add(2 * i + 1, false);
        add(2 * i + 2, false);
        push('enqueue', i, [4]);
      }
    } else if (item.visit) {
      emit(i);
      push('visit', i, [1, 2, 3]);
    } else {
      const parts = {
        pre: [
          [2 * i + 2, false],
          [2 * i + 1, false],
          [i, true],
        ],
        in: [
          [2 * i + 2, false],
          [i, true],
          [2 * i + 1, false],
        ],
        post: [
          [i, true],
          [2 * i + 2, false],
          [2 * i + 1, false],
        ],
      }[order];
      for (const [slot, visit] of parts) add(Number(slot), Boolean(visit));
      push('expand', i, [1, 2, 4]);
    }
  }

  push('done', -1, [1]);
  return frames;
}

export const PRESETS = /** @type {const} */ (['letters', 'expression', 'chain', 'perfect']);
/** @typedef {typeof PRESETS[number]} TraversalPreset */

/** @type {Record<TraversalPreset, string>} */
export const PRESET_TEXT = {
  letters: 'A, B, C, D, E, -, F',
  expression: '×, +, −, a, b, c, d',
  chain: 'A, B, -, C, -, -, -, D',
  perfect: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15',
};
