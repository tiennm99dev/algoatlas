/**
 * Pointer sandbox for three classic linked list problems on the learner's own lists:
 * merging two sorted lists behind a dummy node, finding the middle with slow and fast
 * pointers, and removing the nth node from the end with a gap of n between two pointers.
 * Slots: list A is 0..a-1, list B follows it; DUMMY names the dummy node.
 */

export const MAX_LEN = 8;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;
/** Slot value for a null pointer. */
export const NIL = -1;
/** Id of the dummy node. */
export const DUMMY = -2;

/** @typedef {'merge'|'middle'|'nth'} Problem */

export const mergePseudocode = [
  'dummy = new Node(); tail = dummy',
  'while a and b:',
  '  if a.value ≤ b.value: tail.next = a; a = a.next',
  '  else: tail.next = b; b = b.next',
  '  tail = tail.next',
  'tail.next = a if a else b',
  'return dummy.next',
];

export const middlePseudocode = [
  'slow = head; fast = head',
  'while fast and fast.next:',
  '  slow = slow.next; fast = fast.next.next',
  'return slow  // the second middle when n is even',
];

export const nthPseudocode = [
  'dummy.next = head; fast = dummy; slow = dummy',
  'repeat n times: fast = fast.next',
  'while fast.next is not null:',
  '  fast = fast.next; slow = slow.next',
  'slow.next = slow.next.next  // unlink it',
  'return dummy.next',
];

/** @type {Record<Problem, string[]>} */
export const practicePseudocode = {
  merge: mergePseudocode,
  middle: middlePseudocode,
  nth: nthPseudocode,
};

/**
 * @typedef {object} PracticeFrame
 * @property {'start'|'take-a'|'take-b'|'advance'|'attach'|'move'|'gap'|'slide'|'unlink'|'done'} kind
 * @property {Problem} problem
 * @property {number[]} values  Node values by slot.
 * @property {number[]} next    Next slot of each node (NIL for null).
 * @property {number} dummyNext  Next of the dummy node (merge, nth); NIL otherwise.
 * @property {number} head  First node of the input list (A for merge).
 * @property {number} a     Merge: front of what is left of A.
 * @property {number} b     Merge: front of what is left of B.
 * @property {number} tail  Merge: last node of the merged part (DUMMY at first).
 * @property {number} slow  Middle and nth: slow pointer (DUMMY allowed for nth).
 * @property {number} fast  Middle and nth: fast pointer.
 * @property {number} removed  Nth: the node just unlinked, or NIL.
 * @property {number} wrote  Id whose next was written on this step, or NIL.
 * @property {number} comparisons  Merge: value comparisons so far.
 * @property {number} moves  Pointer hops so far.
 * @property {number} writes  next fields written so far.
 * @property {number[]} lines
 */

/** @param {number} from @param {number} count */
function chain(from, count) {
  return Array.from({ length: count }, (_, i) => (i + 1 < count ? from + i + 1 : NIL));
}

/**
 * @param {Problem} problem
 * @param {number[]} values
 * @param {number[]} next
 * @param {number} head
 */
function recorder(problem, values, next, head) {
  /** @type {PracticeFrame[]} */
  const frames = [];
  const state = {
    dummyNext: NIL,
    a: NIL,
    b: NIL,
    tail: NIL,
    slow: NIL,
    fast: NIL,
    removed: NIL,
    wrote: NIL,
    comparisons: 0,
    moves: 0,
    writes: 0,
  };
  /** @param {PracticeFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      problem,
      values: values.slice(),
      next: next.slice(),
      head,
      ...state,
      lines,
    });
    state.wrote = NIL;
  }
  return { frames, state, push };
}

/**
 * Merge two sorted lists by relinking their nodes; ties take from A first, so it is stable.
 * @param {number[]} listA @param {number[]} listB
 * @returns {PracticeFrame[]}
 */
export function mergeTrace(listA, listB) {
  const values = [...listA, ...listB];
  const next = [...chain(0, listA.length), ...chain(listA.length, listB.length)];
  const { frames, state, push } = recorder('merge', values, next, listA.length ? 0 : NIL);
  state.a = listA.length ? 0 : NIL;
  state.b = listB.length ? listA.length : NIL;
  state.tail = DUMMY;

  /** @param {number} id @param {number} to */
  function link(id, to) {
    if (id === DUMMY) state.dummyNext = to;
    else next[id] = to;
    state.wrote = id;
    state.writes++;
  }

  push('start', [0]);
  while (state.a !== NIL && state.b !== NIL) {
    state.comparisons++;
    if (values[state.a] <= values[state.b]) {
      link(state.tail, state.a);
      state.a = next[state.a];
      state.moves++;
      push('take-a', [1, 2]);
    } else {
      link(state.tail, state.b);
      state.b = next[state.b];
      state.moves++;
      push('take-b', [1, 3]);
    }
    state.tail = state.tail === DUMMY ? state.dummyNext : next[state.tail];
    state.moves++;
    push('advance', [4]);
  }
  link(state.tail, state.a !== NIL ? state.a : state.b);
  push('attach', [1, 5]);
  state.a = NIL;
  state.b = NIL;
  push('done', [6]);
  return frames;
}

/**
 * Slow and fast pointers; on an even length slow stops on the second middle node.
 * @param {number[]} list
 * @returns {PracticeFrame[]}
 */
export function middleTrace(list) {
  const next = chain(0, list.length);
  const head = list.length ? 0 : NIL;
  const { frames, state, push } = recorder('middle', list.slice(), next, head);
  state.slow = head;
  state.fast = head;
  push('start', [0]);
  while (state.fast !== NIL && next[state.fast] !== NIL) {
    state.slow = next[state.slow];
    state.fast = next[next[state.fast]];
    state.moves += 3;
    push('move', [1, 2]);
  }
  push('done', [1, 3]);
  return frames;
}

/**
 * Remove the nth node from the end (1-based, 1 ≤ n ≤ length) in one pass.
 * @param {number[]} list
 * @param {number} n
 * @returns {PracticeFrame[]}
 */
export function nthTrace(list, n) {
  const next = chain(0, list.length);
  const head = list.length ? 0 : NIL;
  const { frames, state, push } = recorder('nth', list.slice(), next, head);
  /** @param {number} id */
  const after = (id) => (id === DUMMY ? state.dummyNext : next[id]);
  state.dummyNext = head;
  state.slow = DUMMY;
  state.fast = DUMMY;
  push('start', [0]);
  for (let k = 0; k < n && state.fast !== NIL; k++) {
    state.fast = after(state.fast);
    state.moves++;
    push('gap', [1]);
  }
  if (state.fast === NIL) {
    push('done', [5]);
    return frames;
  }
  while (after(state.fast) !== NIL) {
    state.fast = after(state.fast);
    state.slow = after(state.slow);
    state.moves += 2;
    push('slide', [2, 3]);
  }
  state.removed = after(state.slow);
  if (state.slow === DUMMY) state.dummyNext = next[state.removed];
  else next[state.slow] = next[state.removed];
  state.wrote = state.slow;
  state.writes++;
  push('unlink', [2, 4]);
  push('done', [5]);
  return frames;
}

/**
 * @param {Problem} problem
 * @param {{a: number[], b: number[], n: number}} input
 */
export function practiceTrace(problem, input) {
  if (problem === 'merge') return mergeTrace(input.a, input.b);
  if (problem === 'middle') return middleTrace(input.a);
  return nthTrace(input.a, input.n);
}

/**
 * Ids in list order from a start id, following next (the dummy's next for DUMMY).
 * @param {PracticeFrame} f @param {number} from @param {Set<number>} [stop]
 */
export function walk(f, from, stop = new Set()) {
  /** @type {number[]} */
  const out = [];
  let s = from;
  while (s !== NIL && !stop.has(s) && out.length <= f.values.length + 1) {
    out.push(s);
    s = s === DUMMY ? f.dummyNext : f.next[s];
  }
  return out;
}

/**
 * Values of the result list: dummy.next for merge and nth, the list itself for middle.
 * @param {PracticeFrame} f
 */
export function resultValues(f) {
  const start = f.problem === 'middle' ? f.head : f.dummyNext;
  return walk(f, start).map((s) => f.values[s]);
}

/**
 * Grid positions. Merge: the merged chain from the dummy runs along row 1, with what is left
 * of A above it (row 0) and of B below it (row 2). Middle: one row. Nth: the dummy then the
 * list on row 0; a node just unlinked waits in row 1 before the node it still points at.
 * @param {PracticeFrame} f
 * @returns {{id: number, col: number, row: number}[]}
 */
export function layoutPractice(f) {
  if (f.problem === 'middle') return f.values.map((_, id) => ({ id, col: id, row: 0 }));
  if (f.problem === 'merge') {
    const merged = walk(f, DUMMY, new Set([f.a, f.b].filter((s) => s !== NIL)));
    const k = merged.length;
    return [
      ...merged.map((id, col) => ({ id, col, row: 1 })),
      ...walk(f, f.a).map((id, i) => ({ id, col: k + i, row: 0 })),
      ...walk(f, f.b).map((id, i) => ({ id, col: k + i, row: 2 })),
    ];
  }
  const order = walk(f, DUMMY);
  const cells = order.map((id, col) => ({ id, col, row: 0 }));
  if (f.removed !== NIL && !order.includes(f.removed)) {
    const at = order.indexOf(f.next[f.removed]);
    cells.push({ id: f.removed, col: (at === -1 ? order.length : at) - 0.5, row: 1 });
  }
  return cells;
}

/**
 * Parses up to MAX_LEN whole numbers from 0 to 99, separated by commas or spaces.
 * @param {string} text
 * @param {boolean} sorted  Require non-decreasing order.
 * @returns {{values: number[]} | {error: 'empty'|'count'|'format'|'range'|'unsorted'}}
 */
export function parseList(text, sorted) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { error: 'empty' };
  if (parts.length > MAX_LEN) return { error: 'count' };
  if (!parts.every((p) => /^\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (sorted && values.some((v, i) => i > 0 && v < values[i - 1])) return { error: 'unsorted' };
  return { values };
}

/**
 * A sorted random list of `count` values.
 * @param {number} count @param {() => number} [rand]
 */
export function randomSorted(count, rand = Math.random) {
  return Array.from({ length: count }, () => Math.floor(rand() * 60)).sort((x, y) => x - y);
}
