/**
 * What the balanced-tree engines share: stored heights and rotations of a linked AVL node, and the
 * coin-flip tower height of a skip list.
 */

/**
 * @typedef {{ left: HeightNode | null, right: HeightNode | null, height: number }} HeightNode
 */

/** The tallest tower a skip list draws. */
export const MAX_TOWER = 5;

/**
 * One coin-flip tower height: 1 plus the heads before the first tails, capped.
 * @param {() => number} [rand]
 */
export function rollHeight(rand = Math.random) {
  let height = 1;
  while (height < MAX_TOWER && rand() < 0.5) height++;
  return height;
}

/** @param {HeightNode | null} node */
export const storedHeight = (node) => (node ? node.height : 0);

/** @param {HeightNode} node */
export function refreshHeight(node) {
  node.height = 1 + Math.max(storedHeight(node.left), storedHeight(node.right));
}

/** Left height minus right height. @param {HeightNode} node */
export const balanceFactor = (node) => storedHeight(node.left) - storedHeight(node.right);

/**
 * @template {HeightNode} N
 * @param {N} x
 * @returns {N} the node now on top
 */
export function rotateLeft(x) {
  const y = /** @type {N} */ (x.right);
  x.right = y.left;
  y.left = x;
  refreshHeight(x);
  refreshHeight(y);
  return y;
}

/**
 * @template {HeightNode} N
 * @param {N} x
 * @returns {N} the node now on top
 */
export function rotateRight(x) {
  const y = /** @type {N} */ (x.left);
  x.left = y.right;
  y.right = x;
  refreshHeight(x);
  refreshHeight(y);
  return y;
}
