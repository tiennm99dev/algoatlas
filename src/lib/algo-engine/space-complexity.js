/**
 * Memory use of five small programs, counted in words. A call frame holds its parameters,
 * its locals and one return address; arrays allocated with `new` live on the heap. The input
 * array is not counted: auxiliary space is the memory an algorithm needs beyond its input.
 *
 * - sum(n), recursive: n + 1 frames of 2 words, Θ(n) stack.
 * - bits(n), recursive on ⌊n/2⌋: ⌊log₂ n⌋ + 1 frames of 2 words, Θ(log n) stack.
 * - sumLoop(n): one frame of 4 words (n, s, i, return address), Θ(1).
 * - reversedCopy(A): one frame of 4 words (A, B, i, return address) plus n heap words, Θ(n).
 * - reverseInPlace(A): one frame of 5 words (A, i, j, t, return address), Θ(1).
 */

export const MAX_N = 12;

/** @typedef {'sum-rec' | 'bits-rec' | 'sum-loop' | 'reverse-copy' | 'reverse-in-place'} SpaceAlgo */

export const SPACE_ALGOS = /** @type {const} */ ([
  'sum-rec',
  'bits-rec',
  'sum-loop',
  'reverse-copy',
  'reverse-in-place',
]);

/** Words in one call frame of each program. @type {Record<SpaceAlgo, number>} */
export const FRAME_WORDS = {
  'sum-rec': 2,
  'bits-rec': 2,
  'sum-loop': 4,
  'reverse-copy': 4,
  'reverse-in-place': 5,
};

/** @type {Record<SpaceAlgo, string[]>} */
export const spacePseudocode = {
  'sum-rec': ['sum(n):', '  if n == 0: return 0', '  return n + sum(n − 1)'],
  'bits-rec': ['bits(n):', '  if n < 2: return 1', '  return 1 + bits(⌊n / 2⌋)'],
  'sum-loop': ['sumLoop(n):', '  s = 0', '  for i = 1 to n:', '    s = s + i', '  return s'],
  'reverse-copy': [
    'reversedCopy(A):',
    '  B = new array of n words',
    '  for i = 0 to n − 1:',
    '    B[n − 1 − i] = A[i]',
    '  return B',
  ],
  'reverse-in-place': [
    'reverseInPlace(A):',
    '  i = 0, j = n − 1',
    '  while i < j:',
    '    t = A[i], A[i] = A[j], A[j] = t',
    '    i = i + 1, j = j − 1',
    '  return',
  ],
};

/**
 * @typedef {object} CallFrame
 * @property {string} fn
 * @property {number | 'A'} arg
 * @property {number} words
 */

/**
 * @typedef {object} SpaceFrame
 * @property {'start'|'call'|'base'|'return'|'init'|'alloc'|'step'|'swap'|'move'|'exit'|'done'} kind
 * @property {SpaceAlgo} algo
 * @property {number} n
 * @property {CallFrame[]} stack  Bottom to top.
 * @property {number} stackWords
 * @property {number} heapWords
 * @property {number} words  stackWords + heapWords.
 * @property {number} peak  Most words in use so far.
 * @property {number} maxDepth  Most frames on the stack so far.
 * @property {number[] | null} input  The array A for the reverse programs.
 * @property {(number | null)[] | null} copy  The heap array B for reversedCopy.
 * @property {number} i  Loop index, -1 when unused.
 * @property {number} j  Right index for reverseInPlace, -1 when unused.
 * @property {number | null} value  Value returned on a return step, or the loop sum.
 * @property {number[]} lines
 */

/** Closed-form peak memory in words. @param {SpaceAlgo} algo @param {number} n  n ≥ 1. */
export function peakWords(algo, n) {
  switch (algo) {
    case 'sum-rec':
      return 2 * (n + 1);
    case 'bits-rec':
      return 2 * (Math.floor(Math.log2(n)) + 1);
    case 'sum-loop':
      return 4;
    case 'reverse-copy':
      return 4 + n;
    case 'reverse-in-place':
      return 5;
  }
}

/**
 * @param {SpaceAlgo} algo
 * @param {number} n  1 ≤ n ≤ MAX_N. The reverse programs use A = [1, 2, …, n].
 * @returns {SpaceFrame[]}
 */
export function spaceTrace(algo, n) {
  /** @type {SpaceFrame[]} */
  const frames = [];
  /** @type {CallFrame[]} */
  const stack = [];
  let heapWords = 0;
  let peak = 0;
  let maxDepth = 0;
  const reverse = algo === 'reverse-copy' || algo === 'reverse-in-place';
  const input = reverse ? Array.from({ length: n }, (_, k) => k + 1) : null;
  /** @type {(number | null)[] | null} */
  let copy = null;
  let i = -1;
  let j = -1;
  /** @type {number | null} */
  let value = null;
  const code = spacePseudocode[algo];

  /** @param {SpaceFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    const stackWords = stack.reduce((s, f) => s + f.words, 0);
    peak = Math.max(peak, stackWords + heapWords);
    maxDepth = Math.max(maxDepth, stack.length);
    frames.push({
      kind,
      algo,
      n,
      stack: stack.map((f) => ({ ...f })),
      stackWords,
      heapWords,
      words: stackWords + heapWords,
      peak,
      maxDepth,
      input: input ? input.slice() : null,
      copy: copy ? copy.slice() : null,
      i,
      j,
      value,
      lines: lines.slice(),
    });
  }

  /** @param {number | 'A'} arg */
  function call(arg) {
    stack.push({ fn: code[0].slice(0, code[0].indexOf('(')), arg, words: FRAME_WORDS[algo] });
    value = null;
    push('call', [0]);
  }

  push('start', [0]);
  if (algo === 'sum-rec' || algo === 'bits-rec') {
    const sum = algo === 'sum-rec';
    /** @param {number} k @returns {number} */
    const rec = (k) => {
      call(k);
      if (sum ? k === 0 : k < 2) {
        value = sum ? 0 : 1;
        push('base', [1]);
        stack.pop();
        push('return', [1]);
        return value;
      }
      const sub = rec(sum ? k - 1 : Math.floor(k / 2));
      value = sum ? k + sub : 1 + sub;
      stack.pop();
      push('return', [2]);
      return value;
    };
    rec(n);
  } else if (algo === 'sum-loop') {
    call(n);
    value = 0;
    push('init', [1]);
    for (i = 1; i <= n; i++) {
      value += i;
      push('step', [2, 3]);
    }
    i = -1;
    stack.pop();
    push('return', [4]);
  } else if (algo === 'reverse-copy') {
    const a = /** @type {number[]} */ (input);
    call('A');
    copy = Array.from({ length: n }, () => null);
    heapWords = n;
    push('alloc', [1]);
    for (i = 0; i < n; i++) {
      copy[n - 1 - i] = a[i];
      push('step', [2, 3]);
    }
    i = -1;
    stack.pop();
    push('return', [4]);
  } else {
    const a = /** @type {number[]} */ (input);
    call('A');
    i = 0;
    j = n - 1;
    push('init', [1]);
    while (i < j) {
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      push('swap', [2, 3]);
      i++;
      j--;
      push('move', [4]);
    }
    push('exit', [2]);
    i = -1;
    j = -1;
    stack.pop();
    push('return', [5]);
  }
  push('done', frames[frames.length - 1].lines);
  return frames;
}
