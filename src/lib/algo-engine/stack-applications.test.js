import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  PRESETS,
  appPseudocode,
  bracketTrace,
  callTrace,
  formatNumber,
  parsePostfix,
  postfixTrace,
} from './stack-applications.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Oracle: delete adjacent matching pairs until none is left. @param {string} text */
function balancedByErasing(text) {
  let s = [...text].filter((c) => '()[]{}'.includes(c)).join('');
  let before;
  do {
    before = s;
    s = s.replace(/\(\)|\[\]|\{\}/g, '');
  } while (s !== before);
  return s === '';
}

/** @param {import('./stack-applications.js').AppFrame[]} frames */
const verdict = (frames) => frames.at(-1)?.ok;

describe('bracket checker', () => {
  it('agrees with the pair-erasing oracle on random strings', () => {
    const rand = seeded(3);
    const alphabet = '()[]{}()x';
    for (let run = 0; run < 300; run++) {
      const n = Math.floor(rand() * 13);
      const text = Array.from({ length: n }, () => alphabet[Math.floor(rand() * 9)]).join('');
      expect(verdict(bracketTrace(text)), text).toBe(balancedByErasing(text));
    }
  });

  it('accepts nested and empty input', () => {
    expect(verdict(bracketTrace('{[()()]}'))).toBe(true);
    expect(verdict(bracketTrace(''))).toBe(true);
    expect(verdict(bracketTrace('a[f(x)] + {b}'))).toBe(true);
  });

  it('names each way to fail', () => {
    const kinds = (/** @type {string} */ t) => bracketTrace(t).map((f) => f.kind);
    expect(kinds('([)]')).toContain('mismatch');
    expect(kinds('(()')).toContain('leftover');
    expect(kinds('())')).toContain('close-empty');
  });

  it('stops at the first bad closer', () => {
    const frames = bracketTrace('(]))))');
    const bad = frames.find((f) => f.kind === 'mismatch');
    expect(bad?.pos).toBe(1);
    expect(frames.at(-2)?.kind).toBe('mismatch');
  });

  it('counts pushes, pops and the deepest nesting', () => {
    const last = bracketTrace('{[()()]}').at(-1);
    expect(last?.pushes).toBe(4);
    expect(last?.pops).toBe(4);
    expect(last?.maxDepth).toBe(3);
  });
});

/**
 * Random expression tree, returned as postfix tokens with its value computed recursively.
 * @param {() => number} rand @param {number} depth
 * @returns {{ tokens: string[], value: number }}
 */
function randomExpr(rand, depth) {
  if (depth === 0 || rand() < 0.3) {
    const v = Math.floor(rand() * 10);
    return { tokens: [String(v)], value: v };
  }
  const a = randomExpr(rand, depth - 1);
  const b = randomExpr(rand, depth - 1);
  const op = ['+', '-', '*'][Math.floor(rand() * 3)];
  const value = op === '+' ? a.value + b.value : op === '-' ? a.value - b.value : a.value * b.value;
  return { tokens: [...a.tokens, ...b.tokens, op], value };
}

describe('postfix evaluation', () => {
  it('matches a recursive evaluation of random expression trees', () => {
    const rand = seeded(8);
    for (let run = 0; run < 100; run++) {
      const { tokens, value } = randomExpr(rand, 3);
      const last = postfixTrace(tokens).at(-1);
      expect(last?.ok).toBe(true);
      expect(last?.value).toBe(value);
    }
  });

  it('evaluates the presets', () => {
    /** @param {string} text */
    const run = (text) => {
      const parsed = /** @type {{ tokens: string[] }} */ (parsePostfix(text));
      return postfixTrace(parsed.tokens).at(-1);
    };
    expect(run(PRESETS.postfix.simple)?.value).toBe(14);
    expect(run(PRESETS.postfix.longer)?.value).toBe(14);
    expect(run(PRESETS.postfix.divide)?.value).toBe(1);
    expect(run('7 2 /')?.value).toBe(3.5);
    expect(run('9 4 − 2 ×')?.value).toBe(10);
  });

  it('pops b before a, so the order of operands is kept', () => {
    const frames = postfixTrace(['8', '3', '-']);
    expect(frames.find((f) => f.kind === 'pop-operands')?.popped).toEqual(['3', '8']);
    expect(frames.at(-1)?.value).toBe(5);
  });

  it('reports a missing operand, a leftover value and division by zero', () => {
    expect(postfixTrace(['4', '+']).map((f) => f.kind)).toContain('too-few');
    expect(postfixTrace(['1', '2', '3', '+']).map((f) => f.kind)).toContain('leftover');
    expect(postfixTrace(['1', '0', '/']).map((f) => f.kind)).toContain('div-zero');
    expect(postfixTrace(['1', '0', '/']).at(-1)?.ok).toBe(false);
  });

  it('parses and rejects input', () => {
    expect(parsePostfix(' 3  4 + ')).toEqual({ tokens: ['3', '4', '+'] });
    expect(parsePostfix('')).toEqual({ error: 'empty' });
    expect(parsePostfix('3 x +')).toEqual({ error: 'format' });
    expect(parsePostfix('3 400 +')).toEqual({ error: 'range' });
    expect(parsePostfix(Array(16).fill('1').join(' '))).toEqual({ error: 'count' });
  });

  it('formats fractions to two decimals', () => {
    expect(formatNumber(14)).toBe('14');
    expect(formatNumber(10 / 3)).toBe('3.33');
  });
});

describe('call stack', () => {
  it('returns n! and grows n frames deep', () => {
    let want = 1;
    for (let n = 1; n <= MAX_N; n++) {
      want *= n;
      const frames = callTrace(n);
      expect(frames.at(-1)?.value).toBe(want);
      expect(frames.at(-1)?.maxDepth).toBe(n);
      expect(frames.at(-1)?.pushes).toBe(n);
      expect(frames.at(-1)?.pops).toBe(n);
      expect(frames.at(-1)?.stack).toEqual([]);
    }
  });

  it('pops the deepest call first', () => {
    const frames = callTrace(3);
    expect(frames.filter((f) => f.popped.length).map((f) => f.popped[0])).toEqual([
      'fact(1)',
      'fact(2)',
      'fact(3)',
    ]);
  });
});

describe('frames', () => {
  it('never alias the stack between frames', () => {
    const frames = bracketTrace('((()))');
    frames[1].stack.push('x');
    expect(frames[2].stack).toEqual(['(', '(']);
  });

  it('start and end with start and done', () => {
    for (const frames of [bracketTrace('()'), postfixTrace(['1']), callTrace(2)]) {
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every bracket line', () => {
    const seen = new Set([...bracketTrace('(a)'), ...bracketTrace('(]')].flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(appPseudocode.brackets.map((_, i) => i));
  });

  it('highlights every postfix line', () => {
    const seen = new Set(postfixTrace(['3', '4', '+']).flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(appPseudocode.postfix.map((_, i) => i));
  });

  it('highlights every call line', () => {
    const seen = new Set(callTrace(3).flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(appPseudocode.calls.map((_, i) => i));
  });
});
