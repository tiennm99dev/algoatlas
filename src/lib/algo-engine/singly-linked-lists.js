/**
 * Singly linked list operation log: insert at the head, delete the head, read the value at an
 * index, and delete the first node holding a value. Nodes live in slots that are never reused,
 * so a slot index names a node across frames. The whole log is replayed into one trace.
 */

export const MAX_NODES = 10;
export const MAX_OPS = 18;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;
/** Slot value for a null pointer. */
export const NIL = -1;

export const singlyPseudocode = [
  'insertHead(v):',
  '  node = new Node(v); node.next = head',
  '  head = node',
  'deleteHead(): if head: head = head.next',
  'get(i): cur = head',
  '  repeat i times: cur = cur.next',
  'delete(v): prev = null; cur = head',
  '  while cur and cur.value ≠ v:',
  '    prev = cur; cur = cur.next',
  '  if cur: (prev ? prev.next : head) = cur.next',
];

/**
 * @typedef {object} SinglyOp
 * @property {'insert-head'|'delete-head'|'get'|'delete'} type
 * @property {number} [value]  For insert-head and delete.
 * @property {number} [index]  For get.
 */

/**
 * @typedef {object} SinglyNode
 * @property {number | null} value  null once the slot is freed.
 * @property {number} next  Slot of the next node, NIL for null.
 */

/**
 * @typedef {object} SinglyFrame
 * @property {'start'|'create'|'link-head'|'unlink-head'|'free'|'empty'|'walk-start'|'walk'|'found'|'out-of-range'|'scan-start'|'compare'|'advance'|'miss'|'unlink'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {SinglyOp | null} op
 * @property {SinglyNode[]} nodes  Slot-stable; freed slots have value null.
 * @property {number} head  NIL when the list is empty.
 * @property {number} cur   Slot of cur (get, delete) or NIL.
 * @property {number} prev  Slot of prev (delete) or NIL.
 * @property {number} fresh  Slot of a new node not yet reachable from head, or NIL.
 * @property {number} removed  Slot of a node cut out of the list but not yet freed, or NIL.
 * @property {number} steps  Hops along next pointers in this operation.
 * @property {number} writes  Pointer fields written in this operation (head or next).
 * @property {number} length
 * @property {number[]} lines
 */

/**
 * Slots reachable from `head`, in list order.
 * @param {Pick<SinglyFrame, 'nodes'|'head'>} f
 * @returns {number[]}
 */
export function listOrder(f) {
  /** @type {number[]} */
  const out = [];
  let s = f.head;
  while (s !== NIL && out.length <= f.nodes.length) {
    out.push(s);
    s = f.nodes[s].next;
  }
  return out;
}

/**
 * Values in list order.
 * @param {Pick<SinglyFrame, 'nodes'|'head'>} f
 */
export function listValues(f) {
  return listOrder(f).map((s) => /** @type {number} */ (f.nodes[s].value));
}

/**
 * Grid positions: the list runs along row 0 in order; a node outside the list (one being
 * inserted or one just cut out) waits in row 1, half a step before the node it points at.
 * @param {SinglyFrame} f
 * @returns {{slot: number, col: number, row: number}[]}
 */
export function layoutList(f) {
  const order = listOrder(f);
  const cells = order.map((slot, col) => ({ slot, col, row: 0 }));
  for (const slot of [f.fresh, f.removed]) {
    if (slot === NIL || order.includes(slot)) continue;
    const at = order.indexOf(f.nodes[slot].next);
    cells.push({ slot, col: (at === -1 ? order.length : at) - 0.5, row: 1 });
  }
  return cells;
}

/**
 * @param {SinglyOp[]} ops
 * @returns {SinglyFrame[]}
 */
export function singlyTrace(ops) {
  /** @type {SinglyNode[]} */
  const nodes = [];
  let head = NIL;
  let cur = NIL;
  let prev = NIL;
  let fresh = NIL;
  let removed = NIL;
  let steps = 0;
  let writes = 0;
  /** @type {SinglyFrame[]} */
  const frames = [];

  /** @param {SinglyFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    const snapshot = nodes.map((n) => ({ ...n }));
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: snapshot,
      head,
      cur,
      prev,
      fresh,
      removed,
      steps,
      writes,
      length: listOrder({ nodes: snapshot, head }).length,
      lines: lines.slice(),
    });
  }

  /** @param {number} slot */
  function free(slot) {
    nodes[slot] = { value: null, next: NIL };
  }

  push('start', -1, []);

  ops.forEach((op, i) => {
    cur = NIL;
    prev = NIL;
    fresh = NIL;
    removed = NIL;
    steps = 0;
    writes = 0;

    if (op.type === 'insert-head') {
      nodes.push({ value: /** @type {number} */ (op.value), next: head });
      fresh = nodes.length - 1;
      writes++;
      push('create', i, [0, 1]);
      head = fresh;
      writes++;
      push('link-head', i, [2]);
      return;
    }

    if (op.type === 'delete-head') {
      if (head === NIL) {
        push('empty', i, [3]);
        return;
      }
      removed = head;
      head = nodes[head].next;
      writes++;
      push('unlink-head', i, [3]);
      free(removed);
      removed = NIL;
      push('free', i, [3]);
      return;
    }

    if (op.type === 'get') {
      const index = /** @type {number} */ (op.index);
      cur = head;
      push('walk-start', i, [4]);
      for (let k = 0; k < index && cur !== NIL; k++) {
        cur = nodes[cur].next;
        steps++;
        push('walk', i, [5]);
      }
      push(cur === NIL ? 'out-of-range' : 'found', i, [5]);
      return;
    }

    // delete(v): find the first node holding v, remembering the node before it.
    const value = /** @type {number} */ (op.value);
    cur = head;
    push('scan-start', i, [6]);
    while (cur !== NIL) {
      push('compare', i, [7]);
      if (nodes[cur].value === value) break;
      prev = cur;
      cur = nodes[cur].next;
      steps++;
      push('advance', i, [8]);
    }
    if (cur === NIL) {
      push('miss', i, [7, 9]);
      return;
    }
    if (prev === NIL) head = nodes[cur].next;
    else nodes[prev].next = nodes[cur].next;
    writes++;
    removed = cur;
    push('unlink', i, [9]);
    free(cur);
    removed = NIL;
    cur = NIL;
    push('free', i, [9]);
  });

  cur = NIL;
  prev = NIL;
  fresh = NIL;
  removed = NIL;
  push('done', -1, []);
  return frames;
}

/**
 * Insert-at-head ops that build `values` in the given order, front first.
 * @param {number[]} values
 * @returns {SinglyOp[]}
 */
export function buildOps(values) {
  return values
    .slice()
    .reverse()
    .map((value) => ({ type: /** @type {const} */ ('insert-head'), value }));
}

/**
 * @param {'short'|'long'|'random'} preset
 * @param {() => number} [rand]
 * @returns {SinglyOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  if (preset === 'short') return buildOps([12, 7, 30, 4]);
  if (preset === 'long') return buildOps([5, 18, 23, 41, 9, 64, 37, 50]);
  /** @type {number[]} */
  const values = [];
  const n = 3 + Math.floor(rand() * 4);
  for (let k = 0; k < n; k++) values.push(MIN_VALUE + Math.floor(rand() * (MAX_VALUE + 1)));
  return buildOps(values);
}
