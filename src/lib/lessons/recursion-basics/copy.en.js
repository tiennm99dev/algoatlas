/** @typedef {import('$lib/algo-engine/recursion-basics.js').BasicsFrame} BasicsFrame */
/** @typedef {import('$lib/algo-engine/recursion-basics.js').RecursionFn} RecursionFn */
/** @typedef {import('$lib/algo-engine/recursion-basics.js').StackRecord} StackRecord */

/** @param {RecursionFn} fn @param {number|string} n */
const callName = (fn, n) => `${fn}(${n})`;

/** @param {number} n */
const signed = (n) => String(n).replace('-', '−');

export const en = {
  slug: 'recursion-basics',
  topic: 'recursion',
  level: 'Beginner',
  title: 'Recursion basics',
  intro:
    'A recursive function solves a problem by calling itself on a smaller copy of it. It needs a base case, an input small enough to answer directly, and a recursive case that moves every call closer to it. Each call gets its own frame on the call stack, and the frames pop off in the reverse order they were pushed.',
  summary:
    'Step through factorial and Fibonacci and watch the call stack push a frame on every call and pop it on every return.',
  instruction:
    'Pick a function and a value of n, then step. Watch the call stack grow until a base case answers, then shrink as each caller resumes with the value. Untick “Base case” to see what happens without one.',
  fnLabel: 'Function',
  fns: { fact: 'Factorial', fib: 'Fibonacci' },
  nLabel: 'n',
  baseLabel: 'Base case',
  /** @param {RecursionFn} fn @param {number} max */
  nError: (fn, max) => `For ${fn}(n), n must be a whole number from 0 to ${max}.`,
  /** @param {boolean} on */
  baseNotice: (on) =>
    on
      ? 'Base case restored: the recursion stops at n ≤ 1.'
      : 'Base case removed: nothing stops the recursion now. Step on and watch the stack.',
  stats: {
    calls: 'Calls made',
    depth: 'Stack depth',
    result: 'Result',
  },
  /** @param {number} d @param {number} max */
  depthValue: (d, max) => `${d} (max ${max})`,
  resultPending: '…',
  resultOverflow: 'crash',
  stackTitle: 'Call stack (top first)',
  stackEmpty: 'The stack is empty.',
  /** @param {number} limit */
  stackLimit: (limit) => `Room for ${limit} frames`,
  treeTitle: 'Call tree',
  treeEmpty: 'No calls yet.',
  /** @param {RecursionFn} fn @param {number} n @param {number} calls */
  treeAria: (fn, n, calls) => `Call tree of ${callName(fn, n)}: ${calls} calls so far.`,
  /**
   * @param {RecursionFn} fn
   * @param {number} n
   * @param {number|null} result
   * @param {'active'|'waiting'|'returned'|'lost'} status
   */
  nodeAria: (fn, n, result, status) =>
    `${callName(fn, signed(n))}, ${
      {
        active: 'running',
        waiting: 'waiting on the stack',
        returned: `returned ${result}`,
        lost: 'lost in the crash',
      }[status]
    }`,
  status: {
    active: 'running',
    waiting: 'waiting',
  },
  /**
   * Locals of one stack frame, `?` for a value not known yet.
   * @param {RecursionFn} fn
   * @param {StackRecord} r
   */
  locals(fn, r) {
    const q = (/** @type {number|null} */ v) => (v === null ? '?' : String(v));
    const n = `n = ${signed(r.n)}`;
    return fn === 'fact' ? `${n}, r = ${q(r.a)}` : `${n}, a = ${q(r.a)}, b = ${q(r.b)}`;
  },
  /** @param {number} line */
  atLine: (line) => `line ${line + 1}`,
  callName,
  legend: {
    active: 'Running now (top of the stack)',
    waiting: 'Waiting for a call it made',
    returned: 'Returned; the note shows its value',
    lost: 'Never returned: lost in the crash',
  },
  markers: { active: '▶', waiting: '…', returned: '✓', lost: '✕' },
  /** @param {BasicsFrame} f */
  describe(f) {
    const name = (/** @type {number} */ k) => callName(f.fn, signed(k));
    const top = f.stack.at(-1);
    switch (f.kind) {
      case 'start':
        return f.withBase
          ? `Ready to call ${name(f.n)}. Each call will push its own frame onto the stack.`
          : `Ready to call ${name(f.n)} with the base case removed.`;
      case 'call': {
        const check = f.withBase
          ? ` Is ${signed(f.value ?? 0)} ≤ 1?`
          : ' There is no base case to check.';
        return `Call ${name(f.value ?? 0)}: push a frame with n = ${signed(f.value ?? 0)}. The stack is ${f.depth} deep.${check}`;
      }
      case 'base':
        return `${top?.n} ≤ 1, the base case: ${name(top?.n ?? 0)} returns ${f.value} without calling itself, and its frame pops off the stack.`;
      case 'resume': {
        const local = f.fn === 'fib' && top?.line === 4 ? 'b' : f.fn === 'fib' ? 'a' : 'r';
        return `${name(f.from ?? 0)} returned ${f.value}. Back in ${name(top?.n ?? 0)}, which resumes with ${local} = ${f.value}.`;
      }
      case 'return': {
        const sum =
          f.fn === 'fact'
            ? `${top?.n} × ${top?.a} = ${f.value}`
            : `a + b = ${top?.a} + ${top?.b} = ${f.value}`;
        return `${name(top?.n ?? 0)} = ${sum}. Return ${f.value} and pop the frame.`;
      }
      case 'overflow':
        return `Calling ${name(f.value ?? 0)} would need frame ${f.depth + 1}, but the stack holds only ${f.depth}: stack overflow. Without a base case the calls never stop.`;
      case 'done':
        return f.overflow
          ? `The program crashed with a stack overflow after ${f.callCount} calls. A recursion needs a base case it is sure to reach.`
          : `${name(f.n)} = ${f.result} after ${f.callCount} ${f.callCount === 1 ? 'call' : 'calls'}. The stack was at most ${f.maxDepth} ${f.maxDepth === 1 ? 'frame' : 'frames'} deep and is empty again.`;
    }
  },
  takeaways: [
    'Every recursion has a base case that answers directly and a recursive case that calls itself on a smaller input.',
    'Each call pushes a frame holding its own n and locals. A caller waits until the call it made returns, so frames pop in reverse order.',
    'fact(n) makes n calls and stacks n frames: O(n) time and O(n) memory, even though the code has no array.',
    'fib(n) calls itself twice, so it makes 2·fib(n + 1) − 1 calls and solves the same subproblem again and again: fib(2) runs 3 times inside fib(5).',
    'Untick “Base case” and step to the end: the stack fills up and the program crashes. Then compare the call tree of fib(6) with fact(6).',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['fact(n), time', 'O(n)', 'n calls, each doing one multiplication.'],
    ['fact(n), memory', 'O(n)', 'All n frames are on the stack at the deepest point.'],
    ['fib(n), time', 'O(φⁿ) ≈ O(1.618ⁿ)', 'Two calls per level: 2·fib(n + 1) − 1 calls in total.'],
    [
      'fib(n), memory',
      'O(n)',
      'Only one path of the call tree, fib(n) → fib(n − 1) → … → fib(1), is on the stack at once.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many calls does fib(5) make in total, counting the first one?',
      answer: 15,
      unit: 'calls',
      hints: [
        'Run Fibonacci with n = 5 and read “Calls made” at the last step.',
        'Or count: calls(n) = 1 + calls(n − 1) + calls(n − 2), with calls(0) = calls(1) = 1.',
      ],
      solution:
        'calls(2) = 3, calls(3) = 5, calls(4) = 9, calls(5) = 1 + 9 + 5 = 15, which is 2·fib(6) − 1 = 2·8 − 1.',
    },
    {
      type: 'number',
      prompt: 'How many frames are on the stack at the deepest point of fact(6)?',
      answer: 6,
      unit: 'frames',
      hints: ['fact(6) calls fact(5), which calls fact(4), … down to the base case fact(1).'],
      solution:
        'fact(6), fact(5), fact(4), fact(3), fact(2) and fact(1) are all waiting at once: 6 frames. None returns before the base case does.',
    },
    {
      type: 'number',
      prompt: 'How many times is fib(2) called while computing fib(5)?',
      answer: 3,
      unit: 'times',
      hints: ['Look for the nodes labelled 2 in the call tree of fib(5).'],
      solution:
        'fib(5) calls fib(4) and fib(3); fib(4) calls fib(3) and fib(2); each fib(3) calls fib(2) once. That is 1 + 2 = 3 calls of fib(2).',
    },
    {
      type: 'order',
      prompt: 'Put the frames of fact(3) in the order they are popped off the stack.',
      items: ['fact(3)', 'fact(1)', 'fact(2)'],
      answer: [1, 2, 0],
      hints: ['A frame pops when its call returns. Which call can return first?'],
      solution:
        'fact(1) is the base case and returns first, then fact(2) returns 2 × 1 = 2, then fact(3) returns 3 × 2 = 6: the reverse of the push order.',
    },
    {
      type: 'choice',
      prompt: 'What happens if you remove the base case from fact(n)?',
      options: [
        'It returns 0, because the calls reach fact(0).',
        'It calls fact(n − 1), fact(n − 2), … forever, until the stack overflows.',
        'It returns n, because only the first call runs.',
        'Nothing changes: the multiplication stops it.',
      ],
      answer: 1,
      hints: ['Untick “Base case” and step to the end.'],
      solution:
        'Nothing stops the calls: fact(0) calls fact(−1), which calls fact(−2), and so on. Every call pushes a frame, so the program crashes once the stack is full.',
    },
  ],
  nextTeaser:
    'Next up: recursion and induction. A base case and a step that shrinks the problem are exactly what a proof by induction needs.',
};
