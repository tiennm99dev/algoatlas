/**
 * Doubly linked list operation log in two designs: a circular list around a sentinel node S
 * (S.next is the first node, S.prev the last), or a plain list with head and tail pointers and
 * null at both ends. The same log replays in either design, so the special cases that the
 * sentinel removes are counted side by side. Nodes live in slots that are never reused.
 */

export const MAX_NODES = 8;
export const MAX_OPS = 20;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;
/** Slot value for a null pointer. */
export const NIL = -1;
/** Id of the sentinel node. */
export const SENTINEL = -2;

/** @typedef {'sentinel'|'plain'} ListMode */

export const sentinelPseudocode = [
  'insertAfter(x, v):  // front: x = S; back: x = S.prev',
  '  n = new Node(v); n.prev = x; n.next = x.next',
  '  x.next.prev = n',
  '  x.next = n',
  'remove(n):  // n is any node but S',
  '  n.prev.next = n.next',
  '  n.next.prev = n.prev',
  '  free n',
];

export const plainPseudocode = [
  'pushFront(v): n = new Node(v); n.next = head',
  '  if head is null: tail = n else: head.prev = n',
  '  head = n',
  'pushBack(v): n = new Node(v); n.prev = tail',
  '  if tail is null: head = n else: tail.next = n',
  '  tail = n',
  'remove(n):',
  '  if n.prev is null: head = n.next else: n.prev.next = n.next',
  '  if n.next is null: tail = n.prev else: n.next.prev = n.prev',
  '  free n',
];

/** @type {Record<ListMode, string[]>} */
export const doublyPseudocode = { sentinel: sentinelPseudocode, plain: plainPseudocode };

/**
 * @typedef {object} DoublyOp
 * @property {'push-front'|'push-back'|'remove'} type
 * @property {number} [value]  For the pushes.
 * @property {number} [slot]   For remove: the node to remove.
 */

/**
 * @typedef {object} DoublyNode
 * @property {number | null} value  null once freed.
 * @property {number} next  Slot, SENTINEL or NIL.
 * @property {number} prev  Slot, SENTINEL or NIL.
 */

/**
 * @typedef {object} HotField
 * @property {number} id  Slot or SENTINEL.
 * @property {'next'|'prev'} field
 */

/**
 * @typedef {object} DoublyFrame
 * @property {'start'|'create'|'link-prev'|'link-next'|'set-head'|'set-tail'|'select'|'unlink-next'|'unlink-prev'|'free'|'missing'|'done'} kind
 * @property {ListMode} mode
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {DoublyOp | null} op
 * @property {DoublyNode[]} nodes  Slot-stable; freed slots have value null.
 * @property {{next: number, prev: number}} sentinel  Sentinel mode only; points at itself when empty.
 * @property {number} head  Plain mode: first slot or NIL.
 * @property {number} tail  Plain mode: last slot or NIL.
 * @property {number} node  Slot being inserted or removed, or NIL.
 * @property {number | null} value  Value of the node this operation inserts or removes.
 * @property {number} after  Sentinel-mode insert: the node x that n goes after, or NIL.
 * @property {HotField[]} hot  Pointer fields written on this step.
 * @property {('head'|'tail')[]} hotVars  head or tail written on this step.
 * @property {number} writes  Pointer writes in this operation.
 * @property {number} special  Branches taken for a null end, over the whole log so far.
 * @property {number} length
 * @property {number[]} lines
 */

/**
 * Ids in list order: sentinel mode starts with SENTINEL and follows next back round to it;
 * plain mode follows next from head to null.
 * @param {Pick<DoublyFrame, 'mode'|'nodes'|'sentinel'|'head'>} f
 * @returns {number[]}
 */
export function doublyOrder(f) {
  /** @type {number[]} */
  const out = [];
  let s = f.mode === 'sentinel' ? f.sentinel.next : f.head;
  if (f.mode === 'sentinel') out.push(SENTINEL);
  while (s !== NIL && s !== SENTINEL && out.length <= f.nodes.length + 1) {
    out.push(s);
    s = f.nodes[s].next;
  }
  return out;
}

/**
 * Values in list order, sentinel left out.
 * @param {Pick<DoublyFrame, 'mode'|'nodes'|'sentinel'|'head'>} f
 */
export function doublyValues(f) {
  return doublyOrder(f)
    .filter((id) => id !== SENTINEL)
    .map((id) => /** @type {number} */ (f.nodes[id].value));
}

/**
 * Values read backwards along prev pointers, from the last node to the first.
 * @param {Pick<DoublyFrame, 'mode'|'nodes'|'sentinel'|'tail'>} f
 */
export function backwardValues(f) {
  /** @type {number[]} */
  const out = [];
  let s = f.mode === 'sentinel' ? f.sentinel.prev : f.tail;
  while (s !== NIL && s !== SENTINEL && out.length <= f.nodes.length) {
    out.push(/** @type {number} */ (f.nodes[s].value));
    s = f.nodes[s].prev;
  }
  return out;
}

/**
 * Grid positions: the list along row 0 (the sentinel first), and the node being inserted or
 * removed, while it is outside the list, in row 1 next to the node its prev points at.
 * @param {DoublyFrame} f
 * @returns {{id: number, col: number, row: number}[]}
 */
export function layoutDoubly(f) {
  const order = doublyOrder(f);
  const cells = order.map((id, col) => ({ id, col, row: 0 }));
  const n = f.node;
  if (n !== NIL && f.nodes[n].value !== null && !order.includes(n)) {
    const p = order.indexOf(f.nodes[n].prev);
    const q = order.indexOf(f.nodes[n].next);
    const col = p >= 0 ? p + (q > p ? 0.5 : 1) : q >= 0 ? q - 0.5 : 0;
    cells.push({ id: n, col, row: 1 });
  }
  return cells;
}

/**
 * @param {DoublyOp[]} ops
 * @param {ListMode} mode
 * @returns {DoublyFrame[]}
 */
export function doublyTrace(ops, mode) {
  /** @type {DoublyNode[]} */
  const nodes = [];
  const sentinel = { next: SENTINEL, prev: SENTINEL };
  let head = NIL;
  let tail = NIL;
  let node = NIL;
  let after = NIL;
  /** @type {number | null} */
  let current = null;
  let writes = 0;
  let special = 0;
  /** @type {DoublyFrame[]} */
  const frames = [];
  const code = doublyPseudocode[mode];

  /**
   * @param {DoublyFrame['kind']} kind @param {number} opIndex @param {number[]} lines
   * @param {HotField[]} [hot] @param {('head'|'tail')[]} [hotVars]
   */
  function push(kind, opIndex, lines, hot = [], hotVars = []) {
    const snapshot = nodes.map((n) => ({ ...n }));
    const s = { ...sentinel };
    frames.push({
      kind,
      mode,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: snapshot,
      sentinel: s,
      head,
      tail,
      node,
      after,
      value: current,
      hot: hot.map((h) => ({ ...h })),
      hotVars: hotVars.slice(),
      writes,
      special,
      length: doublyOrder({ mode, nodes: snapshot, sentinel: s, head }).filter(
        (id) => id !== SENTINEL,
      ).length,
      lines: lines.filter((l) => l < code.length),
    });
  }

  /** Read or write a pointer field of a slot or of the sentinel. */
  /** @param {number} id @param {'next'|'prev'} field */
  const get = (id, field) => (id === SENTINEL ? sentinel[field] : nodes[id][field]);
  /** @param {number} id @param {'next'|'prev'} field @param {number} to */
  function set(id, field, to) {
    if (id === SENTINEL) sentinel[field] = to;
    else nodes[id][field] = to;
    writes++;
  }

  push('start', -1, []);

  ops.forEach((op, i) => {
    writes = 0;
    node = NIL;
    after = NIL;
    current = op.type === 'remove' ? null : /** @type {number} */ (op.value);

    if (op.type === 'remove') {
      const n = /** @type {number} */ (op.slot);
      if (!(n >= 0 && n < nodes.length && nodes[n].value !== null)) {
        push('missing', i, mode === 'sentinel' ? [4] : [6]);
        return;
      }
      node = n;
      current = nodes[n].value;
      const p = nodes[n].prev;
      const q = nodes[n].next;
      if (mode === 'sentinel') {
        push('select', i, [4]);
        set(p, 'next', q);
        push('unlink-next', i, [5], [{ id: p, field: 'next' }]);
        set(q, 'prev', p);
        push('unlink-prev', i, [6], [{ id: q, field: 'prev' }]);
        nodes[n] = { value: null, next: NIL, prev: NIL };
        node = NIL;
        push('free', i, [7]);
        return;
      }
      push('select', i, [6]);
      if (p === NIL) {
        head = q;
        writes++;
        special++;
        push('set-head', i, [7], [], ['head']);
      } else {
        set(p, 'next', q);
        push('unlink-next', i, [7], [{ id: p, field: 'next' }]);
      }
      if (q === NIL) {
        tail = p;
        writes++;
        special++;
        push('set-tail', i, [8], [], ['tail']);
      } else {
        set(q, 'prev', p);
        push('unlink-prev', i, [8], [{ id: q, field: 'prev' }]);
      }
      nodes[n] = { value: null, next: NIL, prev: NIL };
      node = NIL;
      push('free', i, [9]);
      return;
    }

    const value = /** @type {number} */ (op.value);
    const front = op.type === 'push-front';
    nodes.push({ value, next: NIL, prev: NIL });
    const n = nodes.length - 1;
    node = n;

    if (mode === 'sentinel') {
      const x = front ? SENTINEL : sentinel.prev;
      after = x;
      set(n, 'prev', x);
      set(n, 'next', get(x, 'next'));
      push(
        'create',
        i,
        [0, 1],
        [
          { id: n, field: 'prev' },
          { id: n, field: 'next' },
        ],
      );
      const y = get(x, 'next');
      set(y, 'prev', n);
      push('link-prev', i, [2], [{ id: y, field: 'prev' }]);
      set(x, 'next', n);
      push('link-next', i, [3], [{ id: x, field: 'next' }]);
      return;
    }

    if (front) {
      set(n, 'prev', NIL);
      set(n, 'next', head);
      push(
        'create',
        i,
        [0],
        [
          { id: n, field: 'prev' },
          { id: n, field: 'next' },
        ],
      );
      if (head === NIL) {
        tail = n;
        writes++;
        special++;
        push('set-tail', i, [1], [], ['tail']);
      } else {
        set(head, 'prev', n);
        push('link-prev', i, [1], [{ id: head, field: 'prev' }]);
      }
      head = n;
      writes++;
      push('set-head', i, [2], [], ['head']);
      return;
    }

    set(n, 'prev', tail);
    set(n, 'next', NIL);
    push(
      'create',
      i,
      [3],
      [
        { id: n, field: 'prev' },
        { id: n, field: 'next' },
      ],
    );
    if (tail === NIL) {
      head = n;
      writes++;
      special++;
      push('set-head', i, [4], [], ['head']);
    } else {
      set(tail, 'next', n);
      push('link-next', i, [4], [{ id: tail, field: 'next' }]);
    }
    tail = n;
    writes++;
    push('set-tail', i, [5], [], ['tail']);
  });

  node = NIL;
  after = NIL;
  current = null;
  push('done', -1, []);
  return frames;
}

/**
 * Slots alive and in the list at the end of the log, in list order.
 * @param {DoublyOp[]} ops
 */
export function liveSlots(ops) {
  const last = doublyTrace(ops, 'plain').at(-1);
  return last ? doublyOrder(last) : [];
}

/**
 * @param {'back'|'front'|'random'} preset
 * @param {() => number} [rand]
 * @returns {DoublyOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  if (preset === 'back') return [10, 20, 30, 40].map((value) => ({ type: 'push-back', value }));
  if (preset === 'front') return [10, 20, 30, 40].map((value) => ({ type: 'push-front', value }));
  const n = 3 + Math.floor(rand() * 4);
  /** @type {DoublyOp[]} */
  const ops = [];
  for (let k = 0; k < n; k++) {
    ops.push({
      type: rand() < 0.5 ? 'push-front' : 'push-back',
      value: MIN_VALUE + Math.floor(rand() * (MAX_VALUE + 1)),
    });
  }
  return ops;
}
