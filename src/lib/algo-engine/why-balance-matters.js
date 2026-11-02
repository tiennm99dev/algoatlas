/**
 * The same key sequence inserted into a plain binary search tree and an AVL tree, side by
 * side. Height counts the nodes on the longest root-to-leaf path (empty 0, one node 1), the
 * same measure the binary search tree lesson uses. A rotation is one frame, so a double
 * rotation shows as two. Keys are unique; a repeated key in the input is ignored.
 */

import { balanceFactor, refreshHeight, rotateLeft, rotateRight } from './balanced-core.js';

export const MAX_KEYS = 15;
export const MIN_KEY = 0;
export const MAX_KEY = 99;

export const whyBalancePseudocode = [
  'for each key k in the sequence:',
  '  plain BST: walk from the root, attach k as a new leaf',
  '  AVL: walk from the root, attach k as a new leaf',
  '  AVL: walk back up, updating each height',
  '  AVL: heights of two children differ by 2? rotate to fix it',
  'compare the two heights and the comparisons spent',
];

/**
 * @typedef {object} BalanceNode
 * @property {number} key
 * @property {BalanceNode | null} left
 * @property {BalanceNode | null} right
 * @property {number} height  Maintained by the AVL tree only; the plain tree leaves it at 1.
 */

/**
 * @typedef {object} BalanceRotation
 * @property {'left'|'right'} direction
 * @property {number} pivot  The key that moves down.
 * @property {number} up  The key that moves up.
 * @property {boolean} prepares  True for the first rotation of a double rotation.
 */

/**
 * @typedef {object} WhyBalanceFrame
 * @property {'start'|'insert-plain'|'insert-avl'|'rotate'|'done'} kind
 * @property {number | null} key  The key being inserted, null on start and done.
 * @property {number} count  Keys inserted so far (the current key counts once it is attached).
 * @property {BalanceNode | null} plain
 * @property {BalanceNode | null} avl
 * @property {number} plainHeight
 * @property {number} avlHeight
 * @property {number} idealHeight  The least height any binary tree of `count` keys can have.
 * @property {number} plainWalk  Comparisons of the current key in the plain tree.
 * @property {number} avlWalk  Comparisons of the current key in the AVL tree.
 * @property {number} plainComparisons  Running total.
 * @property {number} avlComparisons  Running total.
 * @property {number} rotations  Running total.
 * @property {BalanceRotation | null} rotation
 * @property {number[]} lines
 */

/** @param {BalanceNode | null} node @returns {BalanceNode | null} */
function clone(node) {
  return node && { ...node, left: clone(node.left), right: clone(node.right) };
}

/** @param {BalanceNode | null} node @returns {number} */
export function heightOf(node) {
  return node ? 1 + Math.max(heightOf(node.left), heightOf(node.right)) : 0;
}

/** @param {BalanceNode | null} node @returns {number[]} */
export function inorderKeys(node) {
  return node ? [...inorderKeys(node.left), node.key, ...inorderKeys(node.right)] : [];
}

/**
 * Walks from the root and attaches a new leaf.
 * @param {BalanceNode | null} root
 * @param {number} key
 * @returns {{ root: BalanceNode, path: BalanceNode[], comparisons: number }}
 */
function attach(root, key) {
  const leaf = { key, left: null, right: null, height: 1 };
  if (!root) return { root: leaf, path: [], comparisons: 0 };
  /** @type {BalanceNode[]} */
  const path = [];
  let node = root;
  for (;;) {
    path.push(node);
    const side = key < node.key ? 'left' : 'right';
    const next = node[side];
    if (!next) {
      node[side] = leaf;
      return { root, path, comparisons: path.length };
    }
    node = next;
  }
}

/**
 * @param {number[]} input
 * @returns {WhyBalanceFrame[]}
 */
export function whyBalanceTrace(input) {
  const keys = [...new Set(input)];
  /** @type {BalanceNode | null} */
  let plain = null;
  /** @type {BalanceNode | null} */
  let avl = null;
  let count = 0;
  let plainWalk = 0;
  let avlWalk = 0;
  let plainComparisons = 0;
  let avlComparisons = 0;
  let rotations = 0;
  /** @type {WhyBalanceFrame[]} */
  const frames = [];

  /**
   * @param {WhyBalanceFrame['kind']} kind
   * @param {number | null} key
   * @param {number[]} lines
   * @param {BalanceRotation | null} [rotation]
   */
  function push(kind, key, lines, rotation = null) {
    frames.push({
      kind,
      key,
      count,
      plain: clone(plain),
      avl: clone(avl),
      plainHeight: heightOf(plain),
      avlHeight: heightOf(avl),
      idealHeight: Math.ceil(Math.log2(count + 1)),
      plainWalk,
      avlWalk,
      plainComparisons,
      avlComparisons,
      rotations,
      rotation: rotation && { ...rotation },
      lines: lines.slice(),
    });
  }

  push('start', null, [0]);

  for (const key of keys) {
    count++;
    const inPlain = attach(plain, key);
    plain = inPlain.root;
    plainWalk = inPlain.comparisons;
    plainComparisons += plainWalk;
    avlWalk = 0;
    push('insert-plain', key, [0, 1]);

    const inAvl = attach(avl, key);
    avl = inAvl.root;
    avlWalk = inAvl.comparisons;
    avlComparisons += avlWalk;
    push('insert-avl', key, [2, 3]);

    const path = inAvl.path;
    for (let i = path.length - 1; i >= 0; i--) {
      let node = path[i];
      refreshHeight(node);
      const parent = i > 0 ? path[i - 1] : null;
      /** @param {BalanceNode} top @param {BalanceNode} old */
      const relink = (top, old) => {
        if (!parent) avl = top;
        else if (parent.left === old) parent.left = top;
        else parent.right = top;
      };
      const lean = balanceFactor(node);
      if (Math.abs(lean) < 2) continue;

      if (lean > 0) {
        const child = /** @type {BalanceNode} */ (node.left);
        if (balanceFactor(child) < 0) {
          const up = rotateLeft(child);
          node.left = up;
          rotations++;
          push('rotate', key, [4], {
            direction: 'left',
            pivot: child.key,
            up: up.key,
            prepares: true,
          });
        }
        const old = node;
        node = rotateRight(old);
        relink(node, old);
        rotations++;
        push('rotate', key, [4], {
          direction: 'right',
          pivot: old.key,
          up: node.key,
          prepares: false,
        });
      } else {
        const child = /** @type {BalanceNode} */ (node.right);
        if (balanceFactor(child) > 0) {
          const up = rotateRight(child);
          node.right = up;
          rotations++;
          push('rotate', key, [4], {
            direction: 'right',
            pivot: child.key,
            up: up.key,
            prepares: true,
          });
        }
        const old = node;
        node = rotateLeft(old);
        relink(node, old);
        rotations++;
        push('rotate', key, [4], {
          direction: 'left',
          pivot: old.key,
          up: node.key,
          prepares: false,
        });
      }
    }
  }

  plainWalk = 0;
  avlWalk = 0;
  push('done', null, [5]);
  return frames;
}

/**
 * Reads a typed key list, or says why it cannot be used.
 * @param {string} text
 * @returns {{ keys: number[], error: null } | { keys: null, error: 'empty'|'format'|'range'|'duplicate'|'count' }}
 */
export function parseKeys(text) {
  const parts = text
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { keys: null, error: 'empty' };
  if (parts.some((p) => !/^\d+$/.test(p))) return { keys: null, error: 'format' };
  const keys = parts.map(Number);
  if (keys.some((k) => k < MIN_KEY || k > MAX_KEY)) return { keys: null, error: 'range' };
  if (new Set(keys).size !== keys.length) return { keys: null, error: 'duplicate' };
  if (keys.length > MAX_KEYS) return { keys: null, error: 'count' };
  return { keys, error: null };
}

/**
 * @param {'sorted'|'reversed'|'zigzag'|'balanced'|'random'} preset
 * @param {() => number} [rand]
 * @returns {number[]}
 */
export function makeKeys(preset, rand = Math.random) {
  if (preset === 'sorted') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (preset === 'reversed') return [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  if (preset === 'zigzag') return [1, 10, 2, 9, 3, 8, 4, 7, 5, 6];
  if (preset === 'balanced') return [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15];
  /** @type {Set<number>} */
  const pool = new Set();
  while (pool.size < 10) pool.add(1 + Math.floor(rand() * 99));
  return [...pool];
}
