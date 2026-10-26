/**
 * Binary tree terminology on the array representation: slot i holds a node, its children sit
 * in slots 2i + 1 and 2i + 2 and its parent in slot ⌊(i − 1) / 2⌋ (0-based). The trace runs
 * one recursive measure walk that sets each node's depth on the way down (root depth 0) and
 * its height on the way up (edges on the longest downward path, so a leaf has height 0), then
 * checks whether the tree is full and complete.
 */

/** Deepest level a node may sit on; four levels fill at most 15 slots. */
export const MAX_DEPTH = 3;
export const SLOTS = 2 ** (MAX_DEPTH + 1) - 1;

export const binaryTreePseudocode = [
  'measure(node, d):',
  '  node.depth = d',
  '  if node is a leaf: node.height = 0',
  '  else:',
  '    measure each child with depth d + 1',
  '    node.height = 1 + max(child heights)',
  'full: no node has exactly one child',
  'complete: slots 0 … n − 1 are all filled',
];

/** @typedef {(string | null)[]} Slots  Length SLOTS; null is an empty slot. */

/**
 * @typedef {object} BinaryTreeFrame
 * @property {'start'|'enter'|'leaf'|'descend'|'up'|'full'|'complete'|'done'} kind
 * @property {Slots} slots
 * @property {number} current  Slot acted on, -1 when none.
 * @property {(number | null)[]} depth  Per slot, null until the walk reaches it.
 * @property {(number | null)[]} height  Per slot, null until the walk finishes it.
 * @property {number[]} stack  Slots of the measure calls still running, outermost first.
 * @property {number} calls  measure calls made so far.
 * @property {boolean | null} full  null until checked.
 * @property {boolean | null} complete  null until checked.
 * @property {boolean | null} perfect  null until the end.
 * @property {number} offender  The node with one child (full check) or the first gap
 *   (complete check), -1 when none.
 * @property {number} size
 * @property {number} leaves
 * @property {number} arrayLength  Slots up to and including the last filled one.
 * @property {number[]} lines
 */

/** @param {number} i */
export const leftOf = (i) => 2 * i + 1;
/** @param {number} i */
export const rightOf = (i) => 2 * i + 2;
/** @param {number} i */
export const parentOf = (i) => (i === 0 ? -1 : Math.floor((i - 1) / 2));
/** @param {number} i */
export const depthOf = (i) => Math.floor(Math.log2(i + 1));

/** @param {Slots} slots @param {number} i */
export const filled = (slots, i) => i >= 0 && i < slots.length && slots[i] !== null;

/** @param {Slots} slots @param {number} i @returns {number[]} present children, left first */
export function childrenOf(slots, i) {
  return [leftOf(i), rightOf(i)].filter((c) => filled(slots, c));
}

/** @param {Slots} slots */
export function lastFilled(slots) {
  for (let i = slots.length - 1; i >= 0; i--) if (slots[i] !== null) return i;
  return -1;
}

/** An empty slot array. @returns {Slots} */
export const emptySlots = () => Array.from({ length: SLOTS }, () => null);

/** True when every filled slot below the root has a filled parent. @param {Slots} slots */
export function isTree(slots) {
  return (
    slots.length === SLOTS &&
    slots.every((s, i) => s === null || i === 0 || filled(slots, parentOf(i)))
  );
}

/**
 * @param {Slots} slots
 * @returns {BinaryTreeFrame[]}
 */
export function binaryTreeTrace(slots) {
  if (!isTree(slots)) throw new Error('Every node needs a parent');
  const own = slots.slice();
  /** @type {(number | null)[]} */
  const depth = own.map(() => null);
  /** @type {(number | null)[]} */
  const height = own.map(() => null);
  /** @type {number[]} */
  const stack = [];
  let calls = 0;
  /** @type {boolean | null} */
  let full = null;
  /** @type {boolean | null} */
  let complete = null;
  /** @type {boolean | null} */
  let perfect = null;
  let offender = -1;
  const size = own.filter((s) => s !== null).length;
  const leaves = own.filter((s, i) => s !== null && childrenOf(own, i).length === 0).length;
  const arrayLength = lastFilled(own) + 1;
  /** @type {BinaryTreeFrame[]} */
  const frames = [];

  /** @param {BinaryTreeFrame['kind']} kind @param {number} current @param {number[]} lines */
  function push(kind, current, lines) {
    frames.push({
      kind,
      slots: own.slice(),
      current,
      depth: depth.slice(),
      height: height.slice(),
      stack: stack.slice(),
      calls,
      full,
      complete,
      perfect,
      offender,
      size,
      leaves,
      arrayLength,
      lines: lines.slice(),
    });
  }

  /** @param {number} i @param {number} d */
  function measure(i, d) {
    calls++;
    stack.push(i);
    depth[i] = d;
    push('enter', i, [0, 1]);
    const kids = childrenOf(own, i);
    if (kids.length === 0) {
      height[i] = 0;
      push('leaf', i, [2]);
    } else {
      push('descend', i, [3, 4]);
      for (const c of kids) measure(c, d + 1);
      height[i] = 1 + Math.max(...kids.map((c) => /** @type {number} */ (height[c])));
      push('up', i, [5]);
    }
    stack.pop();
  }

  push('start', -1, [0]);
  if (size > 0) measure(0, 0);

  offender = own.findIndex((s, i) => s !== null && childrenOf(own, i).length === 1);
  full = offender === -1;
  push('full', offender, [6]);

  // Complete means the filled slots form a prefix: the first gap comes after the last node.
  const gap = own.findIndex((s) => s === null);
  offender = gap !== -1 && gap < arrayLength ? gap : -1;
  complete = offender === -1;
  push('complete', offender, [7]);

  offender = -1;
  const h = size === 0 ? -1 : /** @type {number} */ (height[0]);
  perfect = size === 2 ** (h + 1) - 1;
  push('done', -1, []);
  return frames;
}

/** First letter A–Z not used by a node. @param {Slots} slots */
export function nextLabel(slots) {
  for (let c = 65; c <= 90; c++) {
    const l = String.fromCharCode(c);
    if (!slots.includes(l)) return l;
  }
  return '?';
}

/**
 * @typedef {{ ok: true, slots: Slots } | { ok: false, error: 'depth' | 'taken' | 'missing' }} EditResult
 */

/**
 * Adds a child under slot i, or the root when the tree is empty and i is -1.
 * @param {Slots} slots @param {number} i @param {'left'|'right'} side
 * @returns {EditResult}
 */
export function addChild(slots, i, side) {
  const at = i === -1 ? 0 : side === 'left' ? leftOf(i) : rightOf(i);
  if (i === -1 ? filled(slots, 0) : !filled(slots, i)) return { ok: false, error: 'missing' };
  if (at >= SLOTS) return { ok: false, error: 'depth' };
  if (filled(slots, at)) return { ok: false, error: 'taken' };
  const next = slots.slice();
  next[at] = nextLabel(slots);
  return { ok: true, slots: next };
}

/** Empties slot i and every slot below it. @param {Slots} slots @param {number} i @returns {Slots} */
export function removeSubtree(slots, i) {
  const next = slots.slice();
  /** @param {number} j */
  const clear = (j) => {
    if (j >= SLOTS) return;
    next[j] = null;
    clear(leftOf(j));
    clear(rightOf(j));
  };
  clear(i);
  return next;
}

/** Labels the given slots A, B, C… in slot order. @param {number[]} used @returns {Slots} */
function lettered(used) {
  const out = emptySlots();
  [...used].sort((a, b) => a - b).forEach((i, k) => (out[i] = String.fromCharCode(65 + k)));
  return out;
}

export const PRESETS = /** @type {const} */ (['complete', 'perfect', 'full', 'chain', 'random']);
/** @typedef {typeof PRESETS[number]} BinaryTreePreset */

/**
 * @param {BinaryTreePreset} preset
 * @param {() => number} [rand]
 * @returns {Slots}
 */
export function makeTree(preset, rand = Math.random) {
  if (preset === 'complete') return lettered([0, 1, 2, 3, 4, 5]);
  if (preset === 'perfect') return lettered([0, 1, 2, 3, 4, 5, 6]);
  if (preset === 'full') return lettered([0, 1, 2, 5, 6]);
  if (preset === 'chain') return lettered([0, 2, 6, 14]);
  /** @type {number[]} */
  const used = [0];
  for (let i = 1; i < SLOTS; i++) if (used.includes(parentOf(i)) && rand() < 0.6) used.push(i);
  return lettered(used);
}
