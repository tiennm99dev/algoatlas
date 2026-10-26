/**
 * Step traces for two textbook recursions, factorial and Fibonacci, with the call stack
 * snapshotted on every frame. Each call pushes a stack frame holding its own `n` and locals;
 * a base case returns without calling again, and a return pops the frame so the caller
 * resumes with the value. Dropping the base case makes the recursion run until the stack
 * limit, which the trace reports as a stack overflow.
 */

/** @typedef {'fact'|'fib'} RecursionFn */

/**
 * One frame on the call stack.
 * @typedef {object} StackRecord
 * @property {number} id  Call number, in the order the calls were made (0 is the first call).
 * @property {number} n
 * @property {number|null} a  fact: r, the value of fact(n − 1). fib: a, the value of fib(n − 1).
 * @property {number|null} b  fib: b, the value of fib(n − 2). Always null for fact.
 * @property {number|null} result  Set once the call has computed its return value.
 * @property {number} line  The pseudocode line the call is at (waiting on, for a caller).
 */

/**
 * One node of the call tree: every call made so far.
 * @typedef {object} CallRecord
 * @property {number} id
 * @property {number} n
 * @property {number|null} parent  Id of the caller; null for the first call.
 * @property {number|null} result  Null until the call returns.
 */

/**
 * @typedef {object} BasicsFrame
 * @property {'start'|'call'|'base'|'resume'|'return'|'overflow'|'done'} kind
 * @property {RecursionFn} fn
 * @property {number} n  The argument of the first call.
 * @property {boolean} withBase  False when the base case has been removed.
 * @property {StackRecord[]} stack  Bottom (first call) first; the last record is running.
 * @property {CallRecord[]} calls  Every call made so far, in call order.
 * @property {number} current  Id of the running call, -1 when the stack is empty.
 * @property {number|null} value  call/overflow: the argument; base/return: the value returned;
 *                                resume: the value the caller just received.
 * @property {number|null} from  resume: the argument of the call that just returned.
 * @property {number|null} result  done: the final answer; null on a stack overflow.
 * @property {boolean} overflow  True from the overflow frame on.
 * @property {number} callCount  Calls made so far.
 * @property {number} depth  Frames on the stack now.
 * @property {number} maxDepth  Running maximum of `depth`.
 * @property {number[]} lines
 */

/** Largest n for each function, so the traces stay small (fib(8) is 67 calls). */
export const MAX_N = { fact: 12, fib: 8 };

/** The stack holds at most this many frames; one more call overflows it. */
export const STACK_LIMIT = 14;

export const recursionPseudocode = {
  fact: [
    'fact(n):',
    '  if n <= 1:',
    '    return 1              // base case',
    '  r = fact(n - 1)         // recursive case',
    '  return n * r',
  ],
  fib: [
    'fib(n):',
    '  if n <= 1:',
    '    return n              // base cases: fib(0) = 0, fib(1) = 1',
    '  a = fib(n - 1)          // recursive case',
    '  b = fib(n - 2)',
    '  return a + b',
  ],
};

/**
 * The pseudocode with the base case cut out, keeping the line numbers of the rest.
 * @param {string[]} lines
 */
export function withoutBaseCase(lines) {
  return lines.map((line, i) => (i === 1 ? '  // base case removed' : i === 2 ? '  //' : line));
}

/**
 * @param {RecursionFn} fn
 * @param {number} n  An integer from 0 to MAX_N[fn].
 * @param {boolean} [withBase]
 * @returns {BasicsFrame[]}
 */
export function recursionTrace(fn, n, withBase = true) {
  /** @type {BasicsFrame[]} */
  const frames = [];
  /** @type {StackRecord[]} */
  const stack = [];
  /** @type {CallRecord[]} */
  const calls = [];
  let callCount = 0;
  let maxDepth = 0;
  let overflow = false;
  const returnLine = fn === 'fact' ? 4 : 5;

  /**
   * @param {Pick<BasicsFrame, 'kind'|'lines'> & Partial<BasicsFrame>} f
   */
  const push = (f) =>
    frames.push({
      value: null,
      from: null,
      result: null,
      ...f,
      fn,
      n,
      withBase,
      overflow,
      current: stack.at(-1)?.id ?? -1,
      stack: stack.map((r) => ({ ...r })),
      calls: calls.map((c) => ({ ...c })),
      callCount,
      depth: stack.length,
      maxDepth,
    });

  /**
   * Runs one call and returns its value, or null once the stack has overflowed.
   * @param {number} k
   * @param {number|null} parent
   * @returns {number|null}
   */
  function call(k, parent) {
    if (stack.length >= STACK_LIMIT) {
      overflow = true;
      push({ kind: 'overflow', lines: [stack.at(-1)?.line ?? 0], value: k });
      return null;
    }
    /** @type {StackRecord} */
    const rec = { id: calls.length, n: k, a: null, b: null, result: null, line: 1 };
    calls.push({ id: rec.id, n: k, parent, result: null });
    stack.push(rec);
    callCount++;
    maxDepth = Math.max(maxDepth, stack.length);
    push({ kind: 'call', lines: [0, 1], value: k });

    /** @type {number} */
    let result;
    if (withBase && k <= 1) {
      result = fn === 'fact' ? 1 : k;
      rec.line = 2;
      rec.result = result;
      calls[rec.id].result = result;
      push({ kind: 'base', lines: [1, 2], value: result });
    } else {
      rec.line = 3;
      const a = call(k - 1, rec.id);
      if (a === null) return null;
      rec.a = a;
      push({ kind: 'resume', lines: [3], value: a, from: k - 1 });
      if (fn === 'fib') {
        rec.line = 4;
        const b = call(k - 2, rec.id);
        if (b === null) return null;
        rec.b = b;
        push({ kind: 'resume', lines: [4], value: b, from: k - 2 });
        result = a + b;
      } else {
        result = k * a;
      }
      rec.line = returnLine;
      rec.result = result;
      calls[rec.id].result = result;
      push({ kind: 'return', lines: [returnLine], value: result });
    }
    stack.pop();
    return result;
  }

  push({ kind: 'start', lines: [] });
  const result = call(n, null);
  // A crashed program unwinds its whole stack.
  stack.length = 0;
  push({ kind: 'done', lines: [], result });
  return frames;
}
