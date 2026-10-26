/**
 * Two classic stack problems, each replayed from an operation log into one trace:
 *
 * - `two-stack-queue`: a FIFO queue built from two LIFO stacks. Enqueue pushes onto `inbox`.
 *   Dequeue pops from `outbox`; only when outbox is empty does it first pour all of inbox
 *   into outbox, which reverses the order so the oldest item ends on top. Each item is pushed
 *   and popped at most twice in its life, so a dequeue is amortized O(1) even though one
 *   dequeue may move n items.
 * - `min-stack`: a stack that also answers getMin() in O(1). Beside the main stack it keeps
 *   `mins`, whose top is always the minimum of the main stack. A pushed value goes onto mins
 *   when it is ≤ the current minimum (≤, not <, so duplicates of the minimum survive a pop).
 *
 * Both stacks of a problem are stored bottom to top: `left` is inbox or main, `right` is
 * outbox or mins.
 */

export const MAX_OPS = 16;
/** Most items the drawing holds in one problem; the page refuses more. */
export const MAX_ITEMS = 8;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

/** @typedef {'two-stack-queue' | 'min-stack'} PracticeProblem */

export const practicePseudocode = {
  'two-stack-queue': [
    'enqueue(v): inbox.push(v)',
    'dequeue():',
    '  if outbox is empty:',
    '    while inbox not empty: outbox.push(inbox.pop())',
    '  if outbox is empty: the queue is empty, stop',
    '  return outbox.pop()',
  ],
  'min-stack': [
    'push(v): main.push(v)',
    '  if mins is empty or v ≤ mins.top: mins.push(v)',
    'pop(): if main is empty: stop',
    '  v = main.pop(); if v = mins.top: mins.pop()',
    'getMin(): return mins.top   ▹ needs main not empty',
  ],
};

/**
 * @typedef {object} PracticeOp
 * @property {'enqueue'|'dequeue'|'push'|'pop'|'get-min'} type
 * @property {number} [value]  For enqueue and push.
 */

/**
 * @typedef {object} PracticeFrame
 * @property {'start'|'enqueue'|'check'|'transfer'|'empty'|'dequeue'|'push-main'|'push-min'|'skip-min'|'pop-main'|'pop-min'|'keep-min'|'get-min'|'done'} kind
 * @property {PracticeProblem} problem
 * @property {number} opIndex  Index into ops, −1 for start and done.
 * @property {PracticeOp | null} op
 * @property {number[]} left  inbox (queue) or main (min-stack), bottom to top.
 * @property {number[]} right  outbox (queue) or mins (min-stack), bottom to top.
 * @property {number | null} moved  Value moved from inbox to outbox on a transfer step.
 * @property {number | null} result  Value returned by dequeue, pop or getMin.
 * @property {number} stackOps  Primitive push and pop calls on the two stacks so far.
 * @property {number} transfers  Items poured from inbox to outbox so far.
 * @property {number} done  Operations of the log finished so far.
 * @property {number[]} lines
 */

/**
 * @param {PracticeProblem} problem
 * @param {PracticeOp[]} ops
 * @returns {PracticeFrame[]}
 */
export function practiceTrace(problem, ops) {
  /** @type {number[]} */
  const left = [];
  /** @type {number[]} */
  const right = [];
  const s = {
    /** @type {number | null} */
    moved: null,
    /** @type {number | null} */
    result: null,
    stackOps: 0,
    transfers: 0,
    done: 0,
  };
  /** @type {PracticeFrame[]} */
  const frames = [];

  /** @param {PracticeFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function emit(kind, opIndex, lines) {
    frames.push({
      kind,
      problem,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      left: left.slice(),
      right: right.slice(),
      moved: s.moved,
      result: s.result,
      stackOps: s.stackOps,
      transfers: s.transfers,
      done: s.done,
      lines: lines.slice(),
    });
    s.moved = null;
  }

  emit('start', -1, []);
  ops.forEach((op, i) => {
    s.result = null;
    const v = /** @type {number} */ (op.value);
    if (problem === 'two-stack-queue') {
      if (op.type === 'enqueue') {
        left.push(v);
        s.stackOps++;
        s.done++;
        emit('enqueue', i, [0]);
        return;
      }
      emit('check', i, [1, 2]);
      if (right.length === 0) {
        while (left.length > 0) {
          const x = /** @type {number} */ (left.pop());
          right.push(x);
          s.stackOps += 2;
          s.transfers++;
          s.moved = x;
          emit('transfer', i, [3]);
        }
      }
      s.done++;
      if (right.length === 0) {
        emit('empty', i, [4]);
        return;
      }
      s.result = /** @type {number} */ (right.pop());
      s.stackOps++;
      emit('dequeue', i, [4, 5]);
      return;
    }

    if (op.type === 'push') {
      left.push(v);
      s.stackOps++;
      emit('push-main', i, [0]);
      s.done++;
      if (right.length === 0 || v <= right[right.length - 1]) {
        right.push(v);
        s.stackOps++;
        emit('push-min', i, [1]);
      } else {
        emit('skip-min', i, [1]);
      }
      return;
    }
    if (op.type === 'pop') {
      if (left.length === 0) {
        s.done++;
        emit('empty', i, [2]);
        return;
      }
      s.result = /** @type {number} */ (left.pop());
      s.stackOps++;
      emit('pop-main', i, [2, 3]);
      s.done++;
      if (s.result === right[right.length - 1]) {
        right.pop();
        s.stackOps++;
        emit('pop-min', i, [3]);
      } else {
        emit('keep-min', i, [3]);
      }
      return;
    }
    // get-min
    s.done++;
    if (left.length === 0) {
      emit('empty', i, [4]);
      return;
    }
    s.result = right[right.length - 1];
    emit('get-min', i, [4]);
  });
  s.result = null;
  emit('done', -1, []);
  return frames;
}

/**
 * Items held after replaying `ops`: the queue length or the main stack's height.
 * @param {PracticeProblem} problem @param {PracticeOp[]} ops
 */
export function heldAfter(problem, ops) {
  const last = practiceTrace(problem, ops).at(-1);
  if (!last) return 0;
  return problem === 'two-stack-queue' ? last.left.length + last.right.length : last.left.length;
}

/** @param {number[]} values @param {'enqueue'|'push'} type @returns {PracticeOp[]} */
const adds = (values, type) => values.map((value) => ({ type, value }));

/** @type {PracticeOp} */
const DEQ = { type: 'dequeue' };

export const PRESETS = {
  'two-stack-queue': {
    /** @returns {PracticeOp[]} */
    mixed: () => [...adds([1, 2, 3], 'enqueue'), DEQ, ...adds([4], 'enqueue'), DEQ, DEQ, DEQ],
    /** @returns {PracticeOp[]} */
    burst: () => [...adds([10, 20, 30, 40, 50], 'enqueue'), DEQ, DEQ, DEQ, DEQ, DEQ],
  },
  'min-stack': {
    /** @returns {PracticeOp[]} */
    mixed: () => [...adds([5, 3, 7, 3], 'push'), { type: 'pop' }, { type: 'get-min' }],
    /** @returns {PracticeOp[]} */
    falling: () => [
      ...adds([9, 7, 4, 2], 'push'),
      { type: 'get-min' },
      { type: 'pop' },
      { type: 'get-min' },
    ],
  },
};
