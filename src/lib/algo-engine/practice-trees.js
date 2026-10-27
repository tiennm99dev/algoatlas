/**
 * Two binary search tree problems on a tree in the array layout (slot i has children 2i + 1
 * and 2i + 2). Validation passes each node an open range (lo, hi) that its key must lie in
 * strictly, narrowing it on the way down; the tempting parent-only check compares a node with
 * its two children and misses keys that sit on the wrong side of a higher ancestor. The lowest
 * common ancestor walk in a BST goes left while both keys are smaller, right while both are
 * larger, and stops where they split (or where it meets one of them).
 */

import { filled, formatSlots, parseSlots } from '$lib/components/slot-tree.js';

export const MAX_SLOTS = 15;
export const MAX_KEY = 99;

export const VALIDATE_METHODS = /** @type {const} */ (['range', 'local']);
/** @typedef {typeof VALIDATE_METHODS[number]} ValidateMethod */

/** @type {Record<ValidateMethod, string[]>} */
export const validatePseudocode = {
  range: [
    'check(node, lo, hi):',
    '  if node is empty: return true',
    '  if not (lo < node.key < hi): return false',
    '  return check(node.left, lo, node.key)',
    '     and check(node.right, node.key, hi)',
  ],
  local: [
    'check(node):',
    '  if node is empty: return true',
    '  if left.key ≥ node.key or right.key ≤ node.key: return false',
    '  return check(node.left) and check(node.right)',
  ],
};

export const lcaPseudocode = [
  'node = root',
  'while node is not empty:',
  '  if p < node.key and q < node.key: node = node.left',
  '  else if p > node.key and q > node.key: node = node.right',
  '  else: return node   (p and q split here, or node is one of them)',
];

/** @typedef {(number | null)[]} KeySlots  null is an empty slot. */

/**
 * @typedef {object} ValidateFrame
 * @property {'start'|'enter'|'empty'|'go-left'|'go-right'|'fail'|'done'} kind
 * @property {ValidateMethod} method
 * @property {number} current  Slot being checked, -1 when none.
 * @property {({lo: number, hi: number} | null)[]} bounds  Range check: the open range given to each slot.
 * @property {('ok' | 'bad' | null)[]} status  Per slot: passed its own test, failed it, or not checked.
 * @property {number[]} stack  Open check calls, outermost first.
 * @property {number} comparisons  Key comparisons made so far.
 * @property {boolean | null} result  null until the check finishes.
 * @property {number} bad  The slot that failed, -1 when none.
 * @property {number[]} lines
 */

/**
 * @typedef {object} LcaFrame
 * @property {'start'|'visit'|'go-left'|'go-right'|'found'|'fell-off'|'done'} kind
 * @property {number} current  Slot compared now, -1 when none.
 * @property {number[]} path  Slots visited so far.
 * @property {number} p
 * @property {number} q
 * @property {number} answer  Slot returned, -1 until found.
 * @property {number} comparisons
 * @property {number[]} lines
 */

/** @param {KeySlots} s @param {number} i */
const key = (s, i) => /** @type {number} */ (s[i]);

/**
 * Reads keys in array order: comma- or space-separated whole numbers 0–99, `-` for an empty
 * slot. Trailing empty slots are dropped.
 * @param {string} text
 * @returns {{ slots: KeySlots } | { error: import('$lib/components/slot-tree.js').SlotError }}
 */
export function parseKeys(text) {
  return parseSlots(text, {
    max: MAX_SLOTS,
    isEntry: (p) => /^\d{1,2}$/.test(p) && Number(p) <= MAX_KEY,
    toValue: Number,
  });
}

/** @param {KeySlots} slots */
export const formatKeys = formatSlots;

/** Slots in inorder. @param {KeySlots} s @returns {number[]} */
export function inorder(s) {
  /** @type {number[]} */
  const out = [];
  /** @param {number} i */
  const go = (i) => {
    if (!filled(s, i)) return;
    go(2 * i + 1);
    out.push(i);
    go(2 * i + 2);
  };
  go(0);
  return out;
}

/** A tree is a BST exactly when its inorder keys strictly increase. @param {KeySlots} s */
export function isBst(s) {
  const keys = inorder(s).map((i) => key(s, i));
  return keys.every((k, j) => j === 0 || keys[j - 1] < k);
}

/**
 * @param {KeySlots} s
 * @param {ValidateMethod} method
 * @returns {ValidateFrame[]}
 */
export function validateTrace(s, method) {
  /** @type {ValidateFrame['bounds']} */
  const bounds = s.map(() => null);
  /** @type {ValidateFrame['status']} */
  const status = s.map(() => null);
  /** @type {number[]} */
  const stack = [];
  let comparisons = 0;
  /** @type {boolean | null} */
  let result = null;
  let bad = -1;
  /** @type {ValidateFrame[]} */
  const frames = [];
  const lines =
    method === 'range'
      ? { enter: [0, 2], empty: [1], left: [3], right: [4], fail: [2] }
      : { enter: [0, 2], empty: [1], left: [3], right: [3], fail: [2] };

  /** @param {ValidateFrame['kind']} kind @param {number} current @param {number[]} ln */
  function push(kind, current, ln) {
    frames.push({
      kind,
      method,
      current,
      bounds: bounds.map((b) => (b ? { ...b } : null)),
      status: status.slice(),
      stack: stack.slice(),
      comparisons,
      result,
      bad,
      lines: ln.slice(),
    });
  }

  /**
   * @param {number} i @param {number} lo @param {number} hi @param {number} parent
   * @returns {boolean}
   */
  function check(i, lo, hi, parent) {
    if (!filled(s, i)) {
      push('empty', parent, lines.empty);
      return true;
    }
    stack.push(i);
    if (method === 'range') bounds[i] = { lo, hi };
    let ok;
    if (method === 'range') {
      comparisons += 2;
      ok = lo < key(s, i) && key(s, i) < hi;
    } else {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      ok = true;
      if (filled(s, l)) {
        comparisons++;
        ok = key(s, l) < key(s, i);
      }
      if (ok && filled(s, r)) {
        comparisons++;
        ok = key(s, r) > key(s, i);
      }
    }
    status[i] = ok ? 'ok' : 'bad';
    push('enter', i, lines.enter);
    if (!ok) {
      bad = i;
      push('fail', i, lines.fail);
      stack.pop();
      return false;
    }
    push('go-left', i, lines.left);
    if (!check(2 * i + 1, lo, key(s, i), i)) {
      stack.pop();
      return false;
    }
    push('go-right', i, lines.right);
    const right = check(2 * i + 2, key(s, i), hi, i);
    stack.pop();
    return right;
  }

  push('start', -1, [0]);
  result = check(0, -Infinity, Infinity, -1);
  push('done', -1, []);
  return frames;
}

/**
 * @param {KeySlots} s
 * @param {number} p
 * @param {number} q
 * @returns {LcaFrame[]}
 */
export function lcaTrace(s, p, q) {
  /** @type {number[]} */
  const path = [];
  let answer = -1;
  let comparisons = 0;
  let current = -1;
  /** @type {LcaFrame[]} */
  const frames = [];

  /** @param {LcaFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      current,
      path: path.slice(),
      p,
      q,
      answer,
      comparisons,
      lines: lines.slice(),
    });
  }

  push('start', [0]);
  let i = 0;
  while (filled(s, i)) {
    current = i;
    path.push(i);
    push('visit', [1]);
    const k = key(s, i);
    comparisons++;
    if (p < k && q < k) {
      push('go-left', [2]);
      i = 2 * i + 1;
      continue;
    }
    comparisons++;
    if (p > k && q > k) {
      push('go-right', [3]);
      i = 2 * i + 2;
      continue;
    }
    answer = i;
    push('found', [4]);
    break;
  }
  if (answer === -1) {
    current = -1;
    push('fell-off', [1]);
  }
  current = -1;
  push('done', []);
  return frames;
}

/**
 * Lowest common ancestor by parent links, which needs no ordering: used as the oracle and to
 * show the true answer on a tree that is not a BST. Returns -1 when a key is missing.
 * @param {KeySlots} s @param {number} p @param {number} q
 */
export function lcaByParents(s, p, q) {
  const a = s.indexOf(p);
  const b = s.indexOf(q);
  if (a < 0 || b < 0) return -1;
  /** @param {number} i */
  const up = (i) => {
    const out = [];
    for (let j = i; j >= 0; j = j === 0 ? -1 : Math.floor((j - 1) / 2)) out.push(j);
    return out;
  };
  const ancestors = new Set(up(a));
  return up(b).find((j) => ancestors.has(j)) ?? -1;
}

/** Two keys to start the LCA walk with: the first two leaves in slot order. @param {KeySlots} s @returns {[number, number]} */
export function defaultPicks(s) {
  const nodes = s.flatMap((k, i) => (k === null ? [] : [i]));
  const leaves = nodes.filter((i) => !filled(s, 2 * i + 1) && !filled(s, 2 * i + 2));
  const pool = leaves.length >= 2 ? leaves : nodes;
  const a = pool[0];
  const b = pool[1] ?? pool[0];
  return [key(s, a), key(s, b)];
}

export const PRESETS = /** @type {const} */ (['valid', 'trap', 'deep-trap', 'swapped', 'big']);
/** @typedef {typeof PRESETS[number]} PracticeTreePreset */

/** @type {Record<PracticeTreePreset, string>} */
export const PRESET_TEXT = {
  valid: '50, 30, 70, 20, 40, 60, 80',
  trap: '50, 30, 70, 20, 60',
  'deep-trap': '20, 10, 30, -, -, 15, 40',
  swapped: '50, 30, 70, 20, 40, 80, 60',
  big: '48, 24, 72, 12, 36, 60, 84, 6, 18, 30, 42, 54, 66, 78, 90',
};
