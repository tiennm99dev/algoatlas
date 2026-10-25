/**
 * n pushes onto an array that lives in one contiguous block of memory.
 *
 * - `static`: the capacity is fixed. A push onto a full array is refused and the run stops.
 * - `double`: a full array allocates a block of twice the capacity, copies every element
 *   across one by one, frees the old block and then writes the new value.
 * - `plus-one`: the same, but the new block holds only one more slot, so almost every push
 *   copies the whole array.
 *
 * Element i of a block that starts at address `base` sits at `base + ELEMENT_BYTES × i`, which
 * is why reading any index is one address computation and one memory read.
 */

export const MAX_PUSHES = 24;
export const MIN_CAPACITY = 1;
export const MAX_CAPACITY = 8;
/** Bytes per element: a 32-bit integer. */
export const ELEMENT_BYTES = 4;
/** Address of the first block. */
export const FIRST_BASE = 1000;
/** Free bytes left between one block and the next one allocated. */
const BLOCK_GAP = 16;

/** @typedef {'static' | 'double' | 'plus-one'} Growth */
export const GROWTHS = /** @type {Growth[]} */ (['static', 'double', 'plus-one']);

/** The value stored by push number k (1-based). @param {number} k */
export const pushedValue = (k) => 10 * k;

/** @param {Growth} growth @param {number} capacity */
export function grownCapacity(growth, capacity) {
  if (growth === 'double') return 2 * capacity;
  if (growth === 'plus-one') return capacity + 1;
  return capacity;
}

/** Address of element i in a block starting at base. @param {number} base @param {number} i */
export const addressOf = (base, i) => base + ELEMENT_BYTES * i;

export const pushPseudocode = {
  static: [
    'push(x):              ▹ fixed capacity',
    '  if size == capacity:',
    '    error "array is full"',
    '  A[size] = x',
    '  size = size + 1',
  ],
  dynamic: [
    'push(x):',
    '  if size == capacity:',
    '    newCap = grow(capacity)   ▹ 2 × cap, or cap + 1',
    '    B = allocate(newCap)      ▹ a new contiguous block',
    '    for i = 0 to size − 1:',
    '      B[i] = A[i]             ▹ copy: 1 step each',
    '    free A; A = B; capacity = newCap',
    '  A[size] = x',
    '  size = size + 1',
  ],
};

/**
 * @typedef {object} ArrayFrame
 * @property {'start'|'write'|'full'|'allocate'|'copy'|'free'|'done'} kind
 * @property {Growth} growth
 * @property {number} n  Pushes requested in the whole run.
 * @property {(number|null)[]} cells  Block A: one slot per unit of capacity, null when spare.
 * @property {(number|null)[] | null} next  Block B while a resize is copying, else null.
 * @property {number} base  Address of block A.
 * @property {number} nextBase  Address of block B, -1 when there is none.
 * @property {number} size  Elements stored.
 * @property {number} capacity  Slots in block A.
 * @property {number} op  The push running now (1-based), 0 before the first.
 * @property {number | null} value  The value being pushed, null outside a push.
 * @property {number} at  The index just written or copied, -1 when none.
 * @property {number} copies  Element copies in the whole run so far.
 * @property {number} opCopies  Copies made by the push running now.
 * @property {number} writes  New values written so far (one per stored push).
 * @property {number} resizes  Blocks reallocated so far.
 * @property {number} refused  Pushes refused because a static array was full.
 * @property {number[]} lines
 */

/**
 * @param {Growth} growth
 * @param {number} capacity  MIN_CAPACITY ≤ capacity ≤ MAX_CAPACITY.
 * @param {number} n  0 ≤ n ≤ MAX_PUSHES.
 * @returns {ArrayFrame[]}
 */
export function arrayTrace(growth, capacity, n) {
  /** @type {ArrayFrame[]} */
  const frames = [];
  /** @type {(number|null)[]} */
  let cells = Array.from({ length: capacity }, () => null);
  /** @type {(number|null)[] | null} */
  let next = null;
  let base = FIRST_BASE;
  let nextBase = -1;
  let freeFrom = base + ELEMENT_BYTES * capacity;
  let size = 0;
  let op = 0;
  /** @type {number | null} */
  let value = null;
  let at = -1;
  let copies = 0;
  let opCopies = 0;
  let writes = 0;
  let resizes = 0;
  let refused = 0;

  /** @param {ArrayFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      growth,
      n,
      cells: cells.slice(),
      next: next ? next.slice() : null,
      base,
      nextBase,
      size,
      capacity: cells.length,
      op,
      value,
      at,
      copies,
      opCopies,
      writes,
      resizes,
      refused,
      lines: lines.slice(),
    });
  }

  const dynamic = growth !== 'static';
  push('start', [0]);
  for (op = 1; op <= n; op++) {
    value = pushedValue(op);
    opCopies = 0;
    at = -1;
    const resizing = size === cells.length;
    if (resizing) {
      if (!dynamic) {
        refused = n - op + 1;
        push('full', [0, 1, 2]);
        break;
      }
      const newCap = grownCapacity(growth, cells.length);
      next = Array.from({ length: newCap }, () => null);
      nextBase = freeFrom + BLOCK_GAP;
      freeFrom = nextBase + ELEMENT_BYTES * newCap;
      push('allocate', [0, 1, 2, 3]);
      for (let i = 0; i < size; i++) {
        next[i] = cells[i];
        copies++;
        opCopies++;
        at = i;
        push('copy', [4, 5]);
      }
      cells = next;
      next = null;
      base = nextBase;
      nextBase = -1;
      resizes++;
      at = -1;
      push('free', [6]);
    }
    cells[size] = value;
    at = size;
    size++;
    writes++;
    push('write', !dynamic ? [0, 1, 3, 4] : resizing ? [7, 8] : [0, 1, 7, 8]);
  }
  op = Math.min(op, n);
  value = null;
  at = -1;
  push('done', frames[frames.length - 1].lines);
  return frames;
}
