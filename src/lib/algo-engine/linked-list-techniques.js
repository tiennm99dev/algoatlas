/**
 * Two pointer techniques on a singly linked list whose nodes sit at fixed positions (slot i is
 * the i-th node of the input): in-place reversal with prev, curr and next, and Floyd's
 * tortoise and hare, which detects a cycle and then finds the node where it starts.
 */

export const MAX_N = 10;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;
/** Slot value for a null pointer. */
export const NIL = -1;

/** @typedef {'reverse'|'floyd'} Technique */

export const reversePseudocode = [
  'prev = null; curr = head',
  'while curr is not null:',
  '  next = curr.next        // save the rest',
  '  curr.next = prev        // flip one arrow',
  '  prev = curr; curr = next',
  'head = prev',
];

export const floydPseudocode = [
  'slow = head; fast = head',
  'while fast and fast.next:',
  '  slow = slow.next; fast = fast.next.next',
  '  if slow == fast: go to phase 2',
  'return no cycle',
  'phase 2: slow = head',
  'while slow ≠ fast: slow, fast = one step each',
  'return slow  // where the cycle starts',
];

/** @type {Record<Technique, string[]>} */
export const techniquePseudocode = { reverse: reversePseudocode, floyd: floydPseudocode };

/**
 * @typedef {object} TechFrame
 * @property {'start'|'save'|'flip'|'advance'|'move'|'meet'|'no-cycle'|'reset'|'move2'|'entry'|'done'} kind
 * @property {Technique} algo
 * @property {number[]} values  Node values by slot.
 * @property {number[]} next    Next slot of each node, NIL for null.
 * @property {number} head
 * @property {number} prev   Reversal: prev, or NIL.
 * @property {number} curr   Reversal: curr, or NIL.
 * @property {number} nxt    Reversal: the saved next, or NIL; -2 before it is first set.
 * @property {number} slow   Floyd: slow, or NIL.
 * @property {number} fast   Floyd: fast, or NIL.
 * @property {1|2} phase     Floyd: 1 while racing, 2 while walking to the cycle start.
 * @property {number} met    Floyd: the meeting node, or NIL.
 * @property {number} entry  Floyd: the cycle start once found, or NIL.
 * @property {number} flipped  Reversal: the node whose arrow was just flipped, or NIL.
 * @property {number} steps  Loop iterations so far.
 * @property {number} moves  Pointer hops so far (reversal: arrows flipped).
 * @property {number[]} lines
 */

/**
 * Next pointers of the input list: i → i + 1, and the last node to `cycleTo` (NIL for none).
 * @param {number} n @param {number} cycleTo
 */
export function inputNext(n, cycleTo) {
  return Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : cycleTo));
}

/**
 * Values in list order from `head`, stopping at null or after one lap of a cycle.
 * @param {Pick<TechFrame, 'values'|'next'|'head'>} f
 */
export function walkValues(f) {
  /** @type {number[]} */
  const out = [];
  const seen = new Set();
  let s = f.head;
  while (s !== NIL && !seen.has(s)) {
    seen.add(s);
    out.push(f.values[s]);
    s = f.next[s];
  }
  return out;
}

/**
 * @param {number[]} values
 * @returns {TechFrame[]}
 */
export function reverseTrace(values) {
  const next = inputNext(values.length, NIL);
  let head = values.length ? 0 : NIL;
  let prev = NIL;
  let curr = head;
  let nxt = -2;
  let flipped = NIL;
  let steps = 0;
  let moves = 0;
  /** @type {TechFrame[]} */
  const frames = [];

  /** @param {TechFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      algo: 'reverse',
      values: values.slice(),
      next: next.slice(),
      head,
      prev,
      curr,
      nxt,
      slow: NIL,
      fast: NIL,
      phase: 1,
      met: NIL,
      entry: NIL,
      flipped,
      steps,
      moves,
      lines,
    });
  }

  push('start', [0]);
  while (curr !== NIL) {
    flipped = NIL;
    steps++;
    nxt = next[curr];
    push('save', [1, 2]);
    next[curr] = prev;
    moves++;
    flipped = curr;
    push('flip', [3]);
    flipped = NIL;
    prev = curr;
    curr = nxt;
    push('advance', [4]);
  }
  head = prev;
  push('done', [1, 5]);
  return frames;
}

/**
 * @param {number[]} values
 * @param {number} cycleTo  Slot the last node points back to, or NIL for a list ending in null.
 * @returns {TechFrame[]}
 */
export function floydTrace(values, cycleTo) {
  const next = inputNext(values.length, cycleTo);
  const head = values.length ? 0 : NIL;
  let slow = head;
  let fast = head;
  /** @type {1|2} */
  let phase = 1;
  let met = NIL;
  let entry = NIL;
  let steps = 0;
  let moves = 0;
  /** @type {TechFrame[]} */
  const frames = [];

  /** @param {TechFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      algo: 'floyd',
      values: values.slice(),
      next: next.slice(),
      head,
      prev: NIL,
      curr: NIL,
      nxt: NIL,
      slow,
      fast,
      phase,
      met,
      entry,
      flipped: NIL,
      steps,
      moves,
      lines,
    });
  }

  push('start', [0]);
  while (fast !== NIL && next[fast] !== NIL) {
    slow = next[slow];
    fast = next[next[fast]];
    steps++;
    moves += 3;
    push('move', [1, 2, 3]);
    if (slow === fast) {
      met = slow;
      break;
    }
  }
  if (met === NIL) {
    push('no-cycle', [1, 4]);
    push('done', [4]);
    return frames;
  }
  push('meet', [3]);
  phase = 2;
  slow = head;
  push('reset', [5]);
  while (slow !== fast) {
    slow = next[slow];
    fast = next[fast];
    steps++;
    moves += 2;
    push('move2', [6]);
  }
  entry = slow;
  push('entry', [6, 7]);
  push('done', [7]);
  return frames;
}

/**
 * @param {Technique} algo @param {number[]} values @param {number} cycleTo
 */
export function techniqueTrace(algo, values, cycleTo) {
  return algo === 'reverse' ? reverseTrace(values) : floydTrace(values, cycleTo);
}

/**
 * Parses a comma- or space-separated list of 1 to MAX_N whole numbers from 0 to 99.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'empty'|'count'|'format'|'range'}}
 */
export function parseValues(text) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { error: 'empty' };
  if (parts.length > MAX_N) return { error: 'count' };
  if (!parts.every((p) => /^\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  return { values };
}

/**
 * @param {number} n
 * @param {() => number} [rand]
 */
export function randomValues(n, rand = Math.random) {
  return Array.from({ length: n }, () => MIN_VALUE + Math.floor(rand() * (MAX_VALUE + 1)));
}
