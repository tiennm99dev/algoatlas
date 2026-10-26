/**
 * Step traces for two classic recursions: the towers of Hanoi and generating every subset by
 * a take-or-leave choice per item. Both call trees are known before the run, so each trace
 * comes with a static list of calls (`hanoiCalls`, `subsetCalls`) in call order, and every
 * frame carries a status per call: not called yet, running, waiting on the stack, or done.
 */

/** @typedef {'hanoi'|'subsets'} RecursionProblem */

/** @typedef {''|'active'|'waiting'|'done'} CallStatus */

/**
 * @typedef {object} HanoiCall
 * @property {number} id  Position in call order (pre-order of the call tree).
 * @property {number} n
 * @property {number} from  Peg index 0, 1 or 2.
 * @property {number} to
 * @property {number} via
 * @property {number|null} parent
 */

/**
 * @typedef {object} HanoiMove
 * @property {number} disk  1 is the smallest disk.
 * @property {number} from
 * @property {number} to
 */

/**
 * @typedef {object} HanoiFrame
 * @property {'start'|'call'|'move'|'return'|'done'} kind
 * @property {number[][]} pegs  Disks on each peg, bottom first.
 * @property {number} call  Id of the running call, -1 when none.
 * @property {CallStatus[]} status  One entry per call in `hanoiCalls(n)`.
 * @property {HanoiMove|null} move  The move made on this frame.
 * @property {number} moves  Moves made so far.
 * @property {number} calls  Calls made so far.
 * @property {number} depth
 * @property {number} maxDepth
 * @property {number[]} lines
 */

/**
 * @typedef {object} SubsetCall
 * @property {number} id
 * @property {number} i  Index of the item this call decides; equals n at a leaf.
 * @property {number[]} chosen  Indices of the items taken so far.
 * @property {number|null} parent
 * @property {'out'|'in'|null} branch  How the parent got here: left x[i − 1] out, or took it.
 */

/**
 * @typedef {object} SubsetFrame
 * @property {'start'|'call'|'output'|'take'|'done'} kind
 * @property {number} call
 * @property {CallStatus[]} status
 * @property {number} i  Index the running call decides; -1 when none.
 * @property {number[]} chosen  Indices taken by the running call.
 * @property {number[][]} outputs  Every subset output so far, as item indices.
 * @property {number} calls
 * @property {number} depth
 * @property {number} maxDepth
 * @property {number[]} lines
 */

export const MAX_DISKS = 6;
export const MAX_ITEMS = 5;

export const practiceRecursionPseudocode = {
  hanoi: [
    'hanoi(n, from, to, via):',
    '  if n == 1:',
    '    move disk 1 from → to; return',
    '  hanoi(n − 1, from, via, to)   // park the n − 1 smaller disks on via',
    '  move disk n from → to',
    '  hanoi(n − 1, via, to, from)   // stack them back on top of disk n',
  ],
  subsets: [
    'subsets(i, chosen):',
    '  if i == n:',
    '    output chosen; return',
    '  subsets(i + 1, chosen)            // leave x[i] out',
    '  subsets(i + 1, chosen + [x[i]])   // take x[i]',
  ],
};

/**
 * Every call hanoi(n, from, to, via) makes, in call order.
 * @param {number} n
 * @returns {HanoiCall[]}
 */
export function hanoiCalls(n) {
  /** @type {HanoiCall[]} */
  const calls = [];
  /** @param {number} k @param {number} from @param {number} to @param {number} via @param {number|null} parent */
  const visit = (k, from, to, via, parent) => {
    const id = calls.length;
    calls.push({ id, n: k, from, to, via, parent });
    if (k === 1) return;
    visit(k - 1, from, via, to, id);
    visit(k - 1, via, to, from, id);
  };
  visit(n, 0, 2, 1, null);
  return calls;
}

/**
 * Moves n disks from peg 0 to peg 2 with peg 1 as the spare.
 * @param {number} n  1 to MAX_DISKS.
 * @returns {HanoiFrame[]}
 */
export function hanoiTrace(n) {
  const total = 2 ** n - 1;
  /** @type {number[][]} */
  const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
  /** @type {boolean[]} */
  const done = Array(total).fill(false);
  /** @type {number[]} */
  const stack = [];
  /** @type {HanoiFrame[]} */
  const frames = [];
  let moves = 0;
  let calls = 0;
  let maxDepth = 0;

  /** @returns {CallStatus[]} */
  const status = () => {
    /** @type {CallStatus[]} */
    const s = done.map((d) => (d ? 'done' : ''));
    stack.forEach((id, i) => (s[id] = i === stack.length - 1 ? 'active' : 'waiting'));
    return s;
  };

  /** @param {Pick<HanoiFrame, 'kind'|'lines'> & Partial<HanoiFrame>} f */
  const push = (f) =>
    frames.push({
      move: null,
      ...f,
      pegs: pegs.map((p) => p.slice()),
      call: stack.at(-1) ?? -1,
      status: status(),
      moves,
      calls,
      depth: stack.length,
      maxDepth,
    });

  /** @param {number} from @param {number} to @param {number[]} lines */
  const move = (from, to, lines) => {
    const disk = /** @type {number} */ (pegs[from].pop());
    pegs[to].push(disk);
    moves++;
    push({ kind: 'move', lines, move: { disk, from, to } });
  };

  /** @param {number} k @param {number} from @param {number} to @param {number} via */
  const solve = (k, from, to, via) => {
    stack.push(calls++);
    maxDepth = Math.max(maxDepth, stack.length);
    if (k === 1) {
      push({ kind: 'call', lines: [0, 1] });
      move(from, to, [1, 2]);
    } else {
      push({ kind: 'call', lines: [0, 1, 3] });
      solve(k - 1, from, via, to);
      move(from, to, [4, 5]);
      solve(k - 1, via, to, from);
      push({ kind: 'return', lines: [5] });
    }
    done[/** @type {number} */ (stack.pop())] = true;
  };

  push({ kind: 'start', lines: [] });
  solve(n, 0, 2, 1);
  push({ kind: 'done', lines: [] });
  return frames;
}

/**
 * Every call subsets(i, chosen) makes for n items, in call order.
 * @param {number} n
 * @returns {SubsetCall[]}
 */
export function subsetCalls(n) {
  /** @type {SubsetCall[]} */
  const calls = [];
  /**
   * @param {number} i
   * @param {number[]} chosen
   * @param {number|null} parent
   * @param {'out'|'in'|null} branch
   */
  const visit = (i, chosen, parent, branch) => {
    const id = calls.length;
    calls.push({ id, i, chosen, parent, branch });
    if (i === n) return;
    visit(i + 1, chosen, id, 'out');
    visit(i + 1, [...chosen, i], id, 'in');
  };
  visit(0, [], null, null);
  return calls;
}

/**
 * Lists every subset of n items by leaving each item out, then taking it.
 * @param {number} n  1 to MAX_ITEMS.
 * @returns {SubsetFrame[]}
 */
export function subsetsTrace(n) {
  const total = 2 ** (n + 1) - 1;
  /** @type {boolean[]} */
  const done = Array(total).fill(false);
  /** @type {{id: number, i: number, chosen: number[]}[]} */
  const stack = [];
  /** @type {number[][]} */
  const outputs = [];
  /** @type {SubsetFrame[]} */
  const frames = [];
  let calls = 0;
  let maxDepth = 0;

  /** @returns {CallStatus[]} */
  const status = () => {
    /** @type {CallStatus[]} */
    const s = done.map((d) => (d ? 'done' : ''));
    stack.forEach((c, i) => (s[c.id] = i === stack.length - 1 ? 'active' : 'waiting'));
    return s;
  };

  /** @param {Pick<SubsetFrame, 'kind'|'lines'>} f */
  const push = (f) => {
    const top = stack.at(-1);
    frames.push({
      ...f,
      call: top?.id ?? -1,
      i: top?.i ?? -1,
      chosen: top ? top.chosen.slice() : [],
      status: status(),
      outputs: outputs.map((o) => o.slice()),
      calls,
      depth: stack.length,
      maxDepth,
    });
  };

  /** @param {number} i @param {number[]} chosen */
  const visit = (i, chosen) => {
    const id = calls++;
    stack.push({ id, i, chosen });
    maxDepth = Math.max(maxDepth, stack.length);
    if (i === n) {
      outputs.push(chosen.slice());
      push({ kind: 'output', lines: [0, 1, 2] });
    } else {
      push({ kind: 'call', lines: [0, 1, 3] });
      visit(i + 1, chosen);
      push({ kind: 'take', lines: [4] });
      visit(i + 1, [...chosen, i]);
    }
    stack.pop();
    done[id] = true;
  };

  push({ kind: 'start', lines: [] });
  visit(0, []);
  push({ kind: 'done', lines: [] });
  return frames;
}

/**
 * Reads up to MAX_ITEMS distinct one-character items (letters or digits), separated by
 * commas or spaces, or written together like `abc`.
 * @param {string} text
 * @returns {{items: string[]} | {error: 'format'|'count'|'duplicate'}}
 */
export function parseItems(text) {
  const compact = text.replace(/[\s,;]+/g, '');
  if (!/^[\p{L}\p{N}]*$/u.test(compact)) return { error: 'format' };
  const items = [...compact];
  if (items.length < 1 || items.length > MAX_ITEMS) return { error: 'count' };
  if (new Set(items).size !== items.length) return { error: 'duplicate' };
  return { items };
}
