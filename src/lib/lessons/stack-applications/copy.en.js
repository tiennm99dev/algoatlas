/** @typedef {import('$lib/algo-engine/stack-applications.js').AppFrame} AppFrame */

import { formatNumber } from '$lib/algo-engine/stack-applications.js';

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {AppFrame} f */
const top = (f) => f.stack[f.stack.length - 1];
/** @param {AppFrame} f */
const tok = (f) => f.tokens[f.pos];
/** Character position, counted from 1 for people. @param {AppFrame} f */
const at = (f) => `character ${f.pos + 1}`;

const PAIR = /** @type {Record<string, string>} */ ({ ')': '(', ']': '[', '}': '{' });

export const en = {
  slug: 'stack-applications',
  topic: 'stacks-queues',
  level: 'Intermediate',
  title: 'Stack applications',
  intro:
    'Whenever the most recent unfinished thing must be finished first, a stack fits. A bracket checker pushes every opening bracket and pops it when its partner closes; a postfix calculator pushes numbers and lets each operator pop its two operands; and the computer’s own call stack pushes a frame for every function call and pops it on return.',
  summary:
    'Check brackets, evaluate postfix expressions and watch a recursive call stack, one push and pop at a time.',
  instruction:
    'Pick a job, type your own brackets, postfix expression or n, then step through. Watch the stack beside the input: try “Crossed” to see a closer meet the wrong opener, and “Longer” to see operators pop two values and push one.',
  modeLabel: 'Job',
  modes: { brackets: 'Bracket checker', postfix: 'Postfix calculator', calls: 'Call stack' },
  bracketsLabel: 'Text with brackets',
  postfixLabel: 'Postfix expression',
  nLabel: 'n for fact(n)',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presetNames: {
    nested: 'Nested',
    code: 'Code-like',
    crossed: 'Crossed',
    open: 'Left open',
    extra: 'Extra closer',
    simple: 'Simple',
    longer: 'Longer',
    divide: 'Division',
    missing: 'Missing operand',
    leftover: 'Value left over',
  },
  inputTitle: 'Input, read left to right',
  stackTitle: 'The stack',
  callTitle: 'The call stack (top = running call)',
  /** @param {string[]} tokens @param {number} pos */
  inputLabel: (tokens, pos) =>
    `Input ${tokens.join(' ')}${pos >= 0 ? `, reading token ${pos + 1}: ${tokens[pos]}` : ''}.`,
  stats: {
    pushes: 'Pushes',
    pops: 'Pops',
    depth: 'Deepest stack',
    verdict: 'Result',
  },
  verdicts: {
    running: '…',
    balanced: 'balanced',
    unbalanced: 'unbalanced',
    error: 'error',
  },
  bracketErrors: { count: 'Use at most 24 characters.' },
  postfixErrors: {
    empty: 'Type an expression, such as 3 4 + 2 *.',
    format: 'Use whole numbers and + − × ÷ (or - * /), separated by spaces.',
    range: 'Numbers must be from 0 to 99.',
    count: 'Use at most 15 tokens.',
  },
  nError: 'n must be a whole number from 1 to 8.',
  states: { active: 'reading now', visited: 'already read', swap: 'the error is here' },
  markers: { active: '▸', swap: '×' },
  legend: {
    active: 'Reading now',
    visited: 'Already read',
    swap: 'Error found here',
    pushed: 'Just pushed (+)',
  },
  /** @param {AppFrame} f */
  verdict(f) {
    if (f.ok === null) return en.verdicts.running;
    if (f.mode === 'brackets') return f.ok ? en.verdicts.balanced : en.verdicts.unbalanced;
    if (f.mode === 'calls') return `fact = ${f.value}`;
    return f.ok ? formatNumber(/** @type {number} */ (f.value)) : en.verdicts.error;
  },
  /** @param {AppFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return f.mode === 'brackets'
          ? 'The stack starts empty. Read the text left to right.'
          : f.mode === 'postfix'
            ? 'The stack starts empty. Read the tokens left to right.'
            : 'The program calls fact. Each call gets its own frame on the call stack.';
      case 'skip':
        return `${at(f)} is “${tok(f)}”, not a bracket: skip it.`;
      case 'push':
        return `${at(f)} is ${tok(f)}, an opening bracket: push it. It waits for its partner.`;
      case 'match':
        return `${at(f)} is ${tok(f)}, and the top was ${PAIR[tok(f)]}: they match, so pop it.`;
      case 'mismatch':
        return `${at(f)} is ${tok(f)}, but the top is ${top(f)}: the most recent opener is not closed by it. Unbalanced.`;
      case 'close-empty':
        return `${at(f)} is ${tok(f)}, but the stack is empty: no opener is waiting for it. Unbalanced.`;
      case 'leftover':
        return f.mode === 'brackets'
          ? `The text ended with ${count(f.stack.length, 'opener', 'openers')} never closed: ${f.stack.join(' ')}. Unbalanced.`
          : `The tokens ran out with ${count(f.stack.length, 'value', 'values')} on the stack, not one: an operator is missing.`;
      case 'balanced':
        return 'The text ended and the stack is empty: every bracket was closed by its partner. Balanced.';
      case 'push-number':
        return `${tok(f)} is a number: push it.`;
      case 'pop-operands':
        return `${tok(f)} is an operator: pop b = ${f.popped[0]}, then a = ${f.popped[1]}.`;
      case 'apply':
        return `Push a ${tok(f)} b = ${top(f)}. One value replaced two.`;
      case 'too-few':
        return `${tok(f)} needs two values, but the stack holds ${f.stack.length}. The expression is not valid postfix.`;
      case 'div-zero':
        return `${tok(f)} would divide by zero. The expression has no value.`;
      case 'result':
        return `Every token is read and one value is left: the answer is ${top(f)}.`;
      case 'call': {
        const n = f.stack.length;
        const k = Number(top(f).slice(5, -1));
        if (n > 1)
          return `${f.stack[n - 2]} pauses at “n × fact(n − 1)” and calls ${top(f)}: push a new frame on top.`;
        return k === 1
          ? 'Call fact(1): push its frame.'
          : `Call ${top(f)}: push its frame. It cannot answer until fact(${k - 1}) returns.`;
      }
      case 'base':
        return `fact(1) hits the base case: return 1 and pop its frame. Control goes back to the frame below.`;
      case 'return': {
        const k = Number(f.popped[0].slice(5, -1));
        return `${f.popped[0]} resumes: ${k} × ${formatNumber(/** @type {number} */ (f.value) / k)} = ${f.value}. Return it and pop the frame.`;
      }
      case 'done':
        return f.mode === 'calls'
          ? `Done. The call stack is empty again and fact = ${f.value}. It was ${count(f.maxDepth, 'frame', 'frames')} deep.`
          : `Done. ${count(f.pushes, 'push', 'pushes')}, ${count(f.pops, 'pop', 'pops')}, at most ${count(f.maxDepth, 'item', 'items')} on the stack at once.`;
    }
  },
  takeaways: [
    'Brackets are balanced when each closer matches the most recent unclosed opener and nothing is left open at the end: push openers, pop on a matching closer.',
    'A bracket check fails in three ways: a closer meets the wrong opener, a closer finds the stack empty, or openers are left at the end.',
    'Postfix puts the operator after its operands, so no brackets or precedence rules are needed: push numbers, and each operator pops b then a and pushes a op b.',
    'Every function call pushes a frame with its own n; a return pops it. Recursion that goes too deep runs out of stack space: a stack overflow.',
    'Type “(a[b)]” and find the exact character where it fails, then evaluate “2 3 4 * +” and “2 3 + 4 *” and compare.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    ['Bracket check, n characters', 'O(n)', 'One push or pop per character.'],
    [
      'Postfix evaluation, n tokens',
      'O(n)',
      'One push per number; two pops and a push per operator.',
    ],
    ['fact(n) call stack', 'O(n)', 'n frames pushed, each popped once.'],
    ['Extra memory', 'O(n)', 'The stack can hold every opener, number or frame at once.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Evaluate the postfix expression 6 2 3 + ×.',
      answer: 30,
      hints: ['Push 6, 2, 3. The + pops 3 and 2.', 'Then × pops the 5 and the 6.'],
      solution:
        '6, 2 and 3 are pushed. + pops b = 3, a = 2 and pushes 5. × pops b = 5, a = 6 and pushes 30. One value is left: 30.',
    },
    {
      type: 'multi',
      prompt: 'Which strings are balanced?',
      options: ['{[()]}', '([)]', '(()', '()[]{}'],
      answers: [0, 3],
      hints: ['Each closer must match the most recent opener still open.'],
      solution:
        '{[()]} and ()[]{} close every opener in the right order. In ([)] the ) meets [ on top; in (() one ( is never closed.',
    },
    {
      type: 'number',
      prompt:
        'Check (([]){}) with the bracket checker. What is the most openers on the stack at once?',
      answer: 3,
      unit: 'openers',
      hints: ['Track the stack height after each character.'],
      solution: 'Heights after each character: 1, 2, 3, 2, 1, 2, 1, 0. The most is 3, after ( ( [.',
    },
    {
      type: 'order',
      prompt: 'Order the tokens to write (2 + 3) × 4 in postfix.',
      items: ['×', '2', '+', '4', '3'],
      answer: [1, 4, 2, 3, 0],
      hints: [
        'In postfix the operator comes right after its two operands.',
        'The sum is computed first.',
      ],
      solution:
        '2 3 + 4 ×: the + follows its operands 2 and 3, then 4 is pushed and × multiplies the sum by 4.',
    },
    {
      type: 'number',
      prompt: 'How many frames are on the call stack at its deepest while fact(5) runs?',
      answer: 5,
      unit: 'frames',
      hints: ['fact(5) calls fact(4), which calls fact(3), and so on.'],
      solution:
        'fact(5), fact(4), fact(3), fact(2) and fact(1) are all waiting at once before fact(1) returns: 5 frames.',
    },
  ],
  nextTeaser:
    'Next up: the monotonic stack and queue, which keep values in order to find next greater elements and window maxima in O(n).',
};
