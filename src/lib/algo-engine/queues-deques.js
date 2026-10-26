/**
 * A deque stored in a circular buffer of CAPACITY slots. `head` is the slot of the front item
 * and `size` counts the items, so the back item sits at (head + size − 1) mod C and the next
 * free back slot, `tail`, at (head + size) mod C. Keeping `size` (rather than only head and
 * tail) tells a full buffer from an empty one, where head = tail in both.
 *
 * A queue is the deque restricted to pushBack (enqueue) and popFront (dequeue). Every
 * operation writes or reads one slot and moves one index, wrapping past the last slot back
 * to slot 0, so all four are O(1). For contrast, the trace also counts the shifts a plain
 * array with the front fixed at index 0 would need for the same operations.
 */

export const CAPACITY = 8;
export const MAX_OPS = 20;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

export const dequePseudocode = [
  'pushBack(v):            ▹ enqueue',
  '  if size = C: full, stop',
  '  a[(head + size) mod C] = v; size = size + 1',
  'popFront():             ▹ dequeue',
  '  if size = 0: empty, stop',
  '  v = a[head]; head = (head + 1) mod C; size = size − 1',
  'pushFront(v):',
  '  if size = C: full, stop',
  '  head = (head − 1 + C) mod C; a[head] = v; size = size + 1',
  'popBack():',
  '  if size = 0: empty, stop',
  '  v = a[(head + size − 1) mod C]; size = size − 1',
];

/** @typedef {'push-back'|'pop-front'|'push-front'|'pop-back'} DequeOpType */

/**
 * @typedef {object} DequeOp
 * @property {DequeOpType} type
 * @property {number} [value]  For the two pushes.
 */

/**
 * @typedef {object} DequeFrame
 * @property {'start'|'check'|'full'|'empty'|DequeOpType|'done'} kind
 * @property {number} opIndex  Index into ops, −1 for start and done.
 * @property {DequeOp | null} op
 * @property {(number | null)[]} slots  Every slot; stale values stay after a pop, null if never written.
 * @property {number} head  Slot of the front item.
 * @property {number} size
 * @property {number} tail  (head + size) mod C: the slot the next pushBack writes.
 * @property {number[]} items  Values front to back.
 * @property {number} at  Slot read or written by this step, −1 when none.
 * @property {boolean} wrapped  This step's index went past slot C − 1 (or below 0) and wrapped.
 * @property {number | null} result  Value a pop returned.
 * @property {number} wraps  Wrap-arounds so far.
 * @property {number} naiveShifts  Element shifts a plain array, front fixed at a[0], would have
 *   made so far: a pop at the front shifts size − 1, a push at the front shifts size.
 * @property {number[]} lines
 */

const C = CAPACITY;

/** Line index of each operation's header; the guard is +1 and the action +2. */
const BASE = { 'push-back': 0, 'pop-front': 3, 'push-front': 6, 'pop-back': 9 };

/**
 * @param {DequeOp[]} ops
 * @returns {DequeFrame[]}
 */
export function dequeTrace(ops) {
  /** @type {(number | null)[]} */
  const slots = Array(C).fill(null);
  let head = 0;
  let size = 0;
  let at = -1;
  let wrapped = false;
  /** @type {number | null} */
  let result = null;
  let wraps = 0;
  let naiveShifts = 0;
  /** @type {DequeFrame[]} */
  const frames = [];

  /** @param {DequeFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    /** @type {number[]} */
    const items = [];
    for (let k = 0; k < size; k++) items.push(/** @type {number} */ (slots[(head + k) % C]));
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      slots: slots.slice(),
      head,
      size,
      tail: (head + size) % C,
      items,
      at,
      wrapped,
      result,
      wraps,
      naiveShifts,
      lines: lines.slice(),
    });
  }

  push('start', -1, []);

  ops.forEach((op, i) => {
    const base = BASE[op.type];
    at = -1;
    wrapped = false;
    result = null;
    push('check', i, [base, base + 1]);
    const adding = op.type === 'push-back' || op.type === 'push-front';
    if (adding && size === C) {
      push('full', i, [base + 1]);
      return;
    }
    if (!adding && size === 0) {
      push('empty', i, [base + 1]);
      return;
    }
    if (op.type === 'push-back') {
      wrapped = head + size >= C;
      at = (head + size) % C;
      slots[at] = /** @type {number} */ (op.value);
      size++;
    } else if (op.type === 'pop-front') {
      at = head;
      result = slots[head];
      naiveShifts += size - 1;
      wrapped = head + 1 === C;
      head = (head + 1) % C;
      size--;
    } else if (op.type === 'push-front') {
      naiveShifts += size;
      wrapped = head === 0;
      head = (head - 1 + C) % C;
      at = head;
      slots[at] = /** @type {number} */ (op.value);
      size++;
    } else {
      wrapped = head + size - 1 >= C;
      at = (head + size - 1) % C;
      result = slots[at];
      size--;
    }
    if (wrapped) wraps++;
    push(op.type, i, [base + 2]);
  });

  at = -1;
  wrapped = false;
  result = null;
  push('done', -1, []);
  return frames;
}

/**
 * Enqueue ops for `values`, front first.
 * @param {number[]} values
 * @returns {DequeOp[]}
 */
export function enqueueOps(values) {
  return values.map((value) => ({ type: /** @type {const} */ ('push-back'), value }));
}

/** @type {DequeOp} */
const DEQUEUE = { type: 'pop-front' };

/**
 * @param {'queue'|'wrap'|'deque'|'full'|'random'} preset
 * @param {() => number} [rand]
 * @returns {DequeOp[]}
 */
export function makeDequeOps(preset, rand = Math.random) {
  if (preset === 'queue') return enqueueOps([12, 5, 31, 8]);
  if (preset === 'wrap')
    return [
      ...enqueueOps([10, 20, 30, 40, 50, 60]),
      DEQUEUE,
      DEQUEUE,
      DEQUEUE,
      DEQUEUE,
      ...enqueueOps([70, 80, 90]),
    ];
  if (preset === 'deque')
    return [
      ...enqueueOps([5, 6]),
      { type: 'push-front', value: 4 },
      { type: 'push-front', value: 3 },
      { type: 'pop-back' },
      DEQUEUE,
    ];
  if (preset === 'full') return enqueueOps([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  /** @type {DequeOp[]} */
  const ops = [];
  let size = 0;
  const n = 8 + Math.floor(rand() * 7);
  for (let k = 0; k < n; k++) {
    const r = rand();
    const value = MIN_VALUE + Math.floor(rand() * (MAX_VALUE + 1));
    if (size === 0 || (r < 0.45 && size < C)) {
      ops.push({ type: 'push-back', value });
      size++;
    } else if (r < 0.75) {
      ops.push(DEQUEUE);
      size--;
    } else if (r < 0.88 && size < C) {
      ops.push({ type: 'push-front', value });
      size++;
    } else {
      ops.push({ type: 'pop-back' });
      size--;
    }
  }
  return ops;
}
