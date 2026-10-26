/**
 * A stack under a log of push, pop and peek operations, in one of two implementations:
 *
 * - `array`: a fixed array of CAPACITY slots and a `top` index, −1 when empty. Push fails
 *   with overflow when the array is full; pop leaves the old value in its slot (it is simply
 *   past `top`, so it no longer counts).
 * - `linked`: a singly linked list whose head is the top. Push makes a node and links it in
 *   front; there is no capacity, only memory.
 *
 * Both implementations touch one element per operation, so every operation is O(1).
 */

export const CAPACITY = 6;
/** Most items the linked drawing holds; the page refuses pushes beyond it. */
export const MAX_ITEMS = 8;
export const MAX_OPS = 16;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

/** @typedef {'array' | 'linked'} StackImpl */

/** Line indices match between the two listings: push 0–2, pop 3–6, peek 7. */
export const stackPseudocode = {
  array: [
    'push(v):',
    '  if top = capacity − 1: overflow, stop',
    '  top = top + 1; a[top] = v',
    'pop():',
    '  if top = −1: underflow, stop',
    '  v = a[top]; top = top − 1',
    '  return v',
    'peek(): return a[top]     ▹ needs top ≠ −1',
  ],
  linked: [
    'push(v):',
    '  node = new Node(v); node.next = top',
    '  top = node',
    'pop():',
    '  if top = null: underflow, stop',
    '  v = top.value; top = top.next',
    '  return v',
    'peek(): return top.value  ▹ needs top ≠ null',
  ],
};

/**
 * @typedef {object} StackOp
 * @property {'push'|'pop'|'peek'} type
 * @property {number} [value]  For push.
 */

/**
 * @typedef {object} StackFrame
 * @property {'start'|'check-full'|'overflow'|'push'|'create'|'link'|'check-empty'|'underflow'|'pop'|'peek'|'done'} kind
 * @property {StackImpl} impl
 * @property {number} opIndex  Index into ops, −1 for start and done.
 * @property {StackOp | null} op
 * @property {number[]} items  Values on the stack, bottom to top.
 * @property {(number | null)[]} slots  Array implementation: every slot, stale values kept;
 *   null for a slot never written. Empty for the linked implementation.
 * @property {number} top  Index of the top item, −1 when empty.
 * @property {number | null} fresh  Linked: value of a node made but not linked yet.
 * @property {number | null} result  Value popped or peeked by this operation.
 * @property {number} pushes  Successful pushes so far.
 * @property {number} pops  Successful pops so far.
 * @property {number} touched  Elements read or written by this operation (never more than 1).
 * @property {number[]} lines
 */

/**
 * @param {StackOp[]} ops
 * @param {StackImpl} impl
 * @returns {StackFrame[]}
 */
export function stackTrace(ops, impl) {
  /** @type {number[]} */
  const items = [];
  /** @type {(number | null)[]} */
  const slots = impl === 'array' ? Array(CAPACITY).fill(null) : [];
  /** @type {number | null} */
  let fresh = null;
  /** @type {number | null} */
  let result = null;
  let pushes = 0;
  let pops = 0;
  let touched = 0;
  /** @type {StackFrame[]} */
  const frames = [];

  /** @param {StackFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    frames.push({
      kind,
      impl,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      items: items.slice(),
      slots: slots.slice(),
      top: items.length - 1,
      fresh,
      result,
      pushes,
      pops,
      touched,
      lines: lines.slice(),
    });
  }

  push('start', -1, []);

  ops.forEach((op, i) => {
    fresh = null;
    result = null;
    touched = 0;

    if (op.type === 'push') {
      const v = /** @type {number} */ (op.value);
      if (impl === 'array') {
        push('check-full', i, [0, 1]);
        if (items.length === CAPACITY) {
          push('overflow', i, [1]);
          return;
        }
        items.push(v);
        slots[items.length - 1] = v;
        touched = 1;
        pushes++;
        push('push', i, [2]);
        return;
      }
      fresh = v;
      touched = 1;
      push('create', i, [0, 1]);
      fresh = null;
      items.push(v);
      pushes++;
      push('link', i, [2]);
      return;
    }

    if (op.type === 'pop') {
      push('check-empty', i, [3, 4]);
      if (items.length === 0) {
        push('underflow', i, [4]);
        return;
      }
      result = /** @type {number} */ (items.pop());
      touched = 1;
      pops++;
      push('pop', i, [5, 6]);
      return;
    }

    // peek
    if (items.length === 0) {
      push('underflow', i, [7]);
      return;
    }
    result = items[items.length - 1];
    touched = 1;
    push('peek', i, [7]);
  });

  fresh = null;
  result = null;
  touched = 0;
  push('done', -1, []);
  return frames;
}

/**
 * Push ops for `values`, bottom first.
 * @param {number[]} values
 * @returns {StackOp[]}
 */
export function pushOps(values) {
  return values.map((value) => ({ type: /** @type {const} */ ('push'), value }));
}

/**
 * @param {'plates'|'overflow'|'underflow'|'random'} preset
 * @param {() => number} [rand]
 * @returns {StackOp[]}
 */
export function makeStackOps(preset, rand = Math.random) {
  if (preset === 'plates') return pushOps([3, 8, 5]);
  if (preset === 'overflow') return pushOps([4, 9, 2, 7, 1, 6, 5]);
  if (preset === 'underflow')
    return [...pushOps([6, 2]), { type: 'pop' }, { type: 'pop' }, { type: 'pop' }];
  /** @type {StackOp[]} */
  const ops = [];
  let size = 0;
  const n = 5 + Math.floor(rand() * 4);
  for (let k = 0; k < n; k++) {
    const r = rand();
    if (size === 0 || (r < 0.6 && size < CAPACITY)) {
      ops.push({ type: 'push', value: MIN_VALUE + Math.floor(rand() * (MAX_VALUE + 1)) });
      size++;
    } else if (r < 0.85) {
      ops.push({ type: 'pop' });
      size--;
    } else {
      ops.push({ type: 'peek' });
    }
  }
  return ops;
}
