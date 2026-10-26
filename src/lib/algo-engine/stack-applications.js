/**
 * Three jobs a stack does, each traced one stack operation at a time:
 *
 * - `brackets`: check that every closing bracket in a string matches the most recent unclosed
 *   opening one. Openers are pushed; a closer must match the top, which is popped.
 * - `postfix`: evaluate a postfix (reverse Polish) expression such as `3 4 + 2 *`. Numbers
 *   are pushed; an operator pops the right operand b, then the left operand a, and pushes
 *   a op b. Division is exact (real-number) division.
 * - `calls`: the call stack of the recursive factorial fact(n): each call pushes a frame,
 *   each return pops one and hands its value to the caller below it.
 */

export const MAX_CHARS = 24;
export const MAX_TOKENS = 15;
export const MAX_N = 8;
export const MAX_NUMBER = 99;

/** @typedef {'brackets' | 'postfix' | 'calls'} AppMode */

export const appPseudocode = {
  brackets: [
    'for each character c of s:',
    '  if c is ( [ or {: push(c)',
    '  else if c is ) ] or }:',
    '    if stack is empty or top does not match c: unbalanced, stop',
    '    pop()',
    'balanced exactly when the stack is empty at the end',
  ],
  postfix: [
    'for each token t of the expression:',
    '  if t is a number: push(t)',
    '  else: b = pop(); a = pop()   ▹ needs two values',
    '    push(a t b)',
    'the answer is the single value left on the stack',
  ],
  calls: ['fact(n):', '  if n ≤ 1: return 1', '  return n × fact(n − 1)'],
};

/**
 * @typedef {object} AppFrame
 * @property {'start'|'skip'|'push'|'match'|'mismatch'|'close-empty'|'leftover'|'balanced'|'push-number'|'pop-operands'|'apply'|'too-few'|'div-zero'|'result'|'call'|'base'|'return'|'done'} kind
 * @property {AppMode} mode
 * @property {string[]} tokens  Characters (brackets) or tokens (postfix); empty for calls.
 * @property {number} pos  Token being read, −1 when none.
 * @property {string[]} stack  Bottom to top.
 * @property {string[]} popped  Labels popped on this step, in pop order.
 * @property {string | null} pushed  Label pushed on this step.
 * @property {boolean | null} ok  The verdict once known: balanced or evaluated (true), error (false).
 * @property {number | null} value  Postfix result or a call's return value on this step.
 * @property {number} pushes
 * @property {number} pops
 * @property {number} maxDepth  Tallest the stack has been.
 * @property {number[]} lines
 */

const OPENERS = '([{';
const CLOSERS = ')]}';

/** Display form of a number: whole numbers as is, others to two decimals. @param {number} x */
export function formatNumber(x) {
  return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);
}

/** @param {AppMode} mode @param {string[]} tokens */
function recorder(mode, tokens) {
  /** @type {AppFrame[]} */
  const frames = [];
  const s = {
    pos: -1,
    /** @type {string[]} */
    stack: [],
    /** @type {string[]} */
    popped: [],
    /** @type {string | null} */
    pushed: null,
    /** @type {boolean | null} */
    ok: null,
    /** @type {number | null} */
    value: null,
    pushes: 0,
    pops: 0,
    maxDepth: 0,
  };
  return {
    s,
    /** @param {string} label */
    push(label) {
      s.stack.push(label);
      s.pushed = label;
      s.pushes++;
      s.maxDepth = Math.max(s.maxDepth, s.stack.length);
    },
    pop() {
      const label = /** @type {string} */ (s.stack.pop());
      s.popped.push(label);
      s.pops++;
      return label;
    },
    /** @param {AppFrame['kind']} kind @param {number[]} lines */
    emit(kind, lines) {
      frames.push({
        kind,
        mode,
        tokens: tokens.slice(),
        pos: s.pos,
        stack: s.stack.slice(),
        popped: s.popped.slice(),
        pushed: s.pushed,
        ok: s.ok,
        value: s.value,
        pushes: s.pushes,
        pops: s.pops,
        maxDepth: s.maxDepth,
        lines: lines.slice(),
      });
      s.popped = [];
      s.pushed = null;
    },
    frames,
  };
}

/**
 * @param {string} text  At most MAX_CHARS characters; characters other than brackets are skipped.
 * @returns {AppFrame[]}
 */
export function bracketTrace(text) {
  const tokens = [...text];
  const r = recorder('brackets', tokens);
  const { s } = r;
  r.emit('start', []);
  let failed = false;
  for (let i = 0; i < tokens.length && !failed; i++) {
    const c = tokens[i];
    s.pos = i;
    if (OPENERS.includes(c)) {
      r.push(c);
      r.emit('push', [0, 1]);
    } else if (CLOSERS.includes(c)) {
      const want = OPENERS[CLOSERS.indexOf(c)];
      if (s.stack.length === 0) {
        s.ok = false;
        r.emit('close-empty', [2, 3]);
        failed = true;
      } else if (s.stack[s.stack.length - 1] !== want) {
        s.ok = false;
        r.emit('mismatch', [2, 3]);
        failed = true;
      } else {
        r.pop();
        r.emit('match', [2, 3, 4]);
      }
    } else {
      r.emit('skip', [0]);
    }
  }
  if (!failed) {
    s.pos = -1;
    s.ok = s.stack.length === 0;
    r.emit(s.ok ? 'balanced' : 'leftover', [5]);
  }
  s.pos = -1;
  r.emit('done', []);
  return r.frames;
}

/** @param {string} t */
const isNumber = (t) => /^\d+$/.test(t);

/**
 * @param {string[]} tokens  Whole numbers and the operators + − × ÷ (or - * /).
 * @returns {AppFrame[]}
 */
export function postfixTrace(tokens) {
  const r = recorder('postfix', tokens);
  const { s } = r;
  /** @type {number[]} */
  const values = [];
  r.emit('start', []);
  let failed = false;
  for (let i = 0; i < tokens.length && !failed; i++) {
    const t = tokens[i];
    s.pos = i;
    if (isNumber(t)) {
      values.push(Number(t));
      r.push(t);
      r.emit('push-number', [0, 1]);
      continue;
    }
    if (values.length < 2) {
      s.ok = false;
      r.emit('too-few', [0, 2]);
      failed = true;
      continue;
    }
    const b = /** @type {number} */ (values.pop());
    const a = /** @type {number} */ (values.pop());
    r.pop();
    r.pop();
    r.emit('pop-operands', [0, 2]);
    if ((t === '/' || t === '÷') && b === 0) {
      s.ok = false;
      r.emit('div-zero', [3]);
      failed = true;
      continue;
    }
    const out =
      t === '+' ? a + b : t === '-' || t === '−' ? a - b : t === '*' || t === '×' ? a * b : a / b;
    values.push(out);
    s.value = out;
    r.push(formatNumber(out));
    r.emit('apply', [3]);
    s.value = null;
  }
  if (!failed) {
    s.pos = -1;
    s.ok = values.length === 1;
    s.value = values.length === 1 ? values[0] : null;
    r.emit(s.ok ? 'result' : 'leftover', [4]);
  }
  s.pos = -1;
  r.emit('done', []);
  return r.frames;
}

/**
 * The call stack of fact(n).
 * @param {number} n  1 to MAX_N.
 * @returns {AppFrame[]}
 */
export function callTrace(n) {
  const r = recorder('calls', []);
  const { s } = r;
  r.emit('start', []);
  for (let k = n; k >= 1; k--) {
    r.push(`fact(${k})`);
    r.emit('call', k === n ? [0] : [2, 0]);
  }
  let value = 1;
  r.pop();
  s.value = 1;
  r.emit('base', [1]);
  for (let k = 2; k <= n; k++) {
    value *= k;
    r.pop();
    s.value = value;
    r.emit('return', [2]);
  }
  s.ok = true;
  r.emit('done', []);
  return r.frames;
}

/**
 * Reads a postfix expression: whole numbers 0 to MAX_NUMBER and the operators + - * / (or
 * − × ÷), separated by spaces.
 * @param {string} text
 * @returns {{ tokens: string[] } | { error: 'empty' | 'format' | 'range' | 'count' }}
 */
export function parsePostfix(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { error: 'empty' };
  if (!tokens.every((t) => isNumber(t) || /^[+\-−*×/÷]$/.test(t))) return { error: 'format' };
  if (tokens.some((t) => isNumber(t) && Number(t) > MAX_NUMBER)) return { error: 'range' };
  if (tokens.length > MAX_TOKENS) return { error: 'count' };
  return { tokens };
}

export const PRESETS = {
  brackets: {
    nested: '{[()()]}',
    code: 'a[f(x)] + {b}',
    crossed: '([)]',
    open: '(()',
    extra: '())',
  },
  postfix: {
    simple: '3 4 + 2 *',
    longer: '5 1 2 + 4 * + 3 -',
    divide: '8 2 / 3 -',
    missing: '4 +',
    leftover: '1 2 3 +',
  },
};
