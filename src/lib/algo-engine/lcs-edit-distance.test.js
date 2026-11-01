import { describe, expect, it } from 'vitest';
import {
  MAX_LEN,
  STRING_PRESETS,
  parseWord,
  stringDpPseudocode,
  stringDpTrace,
} from './lcs-edit-distance.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** @param {string} sub @param {string} s */
function isSubsequence(sub, s) {
  let k = 0;
  for (const ch of s) if (ch === sub[k]) k++;
  return k === sub.length;
}

/** LCS length by trying every subsequence of a. @param {string} a @param {string} b */
function lcsBrute(a, b) {
  let best = 0;
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let sub = '';
    for (let i = 0; i < a.length; i++) if (mask & (1 << i)) sub += a[i];
    if (sub.length > best && isSubsequence(sub, b)) best = sub.length;
  }
  return best;
}

/** Levenshtein distance with two rolling rows. @param {string} a @param {string} b */
function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

/** @param {import('./lcs-edit-distance.js').StringDpOp[]} ops */
const apply = (ops) => ops.map((o) => o.to).join('');
/** @param {import('./lcs-edit-distance.js').StringDpOp[]} ops */
const source = (ops) => ops.map((o) => o.from).join('');

/** @param {() => number} rand */
const word = (rand) =>
  Array.from(
    { length: Math.floor(rand() * (MAX_LEN + 1)) },
    () => 'ABC'[Math.floor(rand() * 3)],
  ).join('');

describe('longest common subsequence', () => {
  it('finds BCBA in the textbook pair', () => {
    const [a, b] = STRING_PRESETS.clrs;
    const last = stringDpTrace('lcs', a, b).at(-1);
    expect(last?.result).toBe(4);
    expect(last?.common).toBe('BCBA');
  });

  it('matches brute force and rebuilds a common subsequence', () => {
    const rand = seeded(6);
    const cases = [
      ['', ''],
      ['A', ''],
      ['', 'B'],
      ['AAA', 'AAA'],
      ['ABC', 'DEF'],
    ];
    for (let t = 0; t < 60; t++) cases.push([word(rand), word(rand)]);
    for (const [a, b] of cases) {
      const last = stringDpTrace('lcs', a, b).at(-1);
      expect(last?.result).toBe(lcsBrute(a, b));
      expect(last?.common).toHaveLength(/** @type {number} */ (last?.result));
      expect(isSubsequence(last?.common ?? '', a) && isSubsequence(last?.common ?? '', b)).toBe(
        true,
      );
    }
  });

  it('fills every cell once and reads one or two neighbours', () => {
    const frames = stringDpTrace('lcs', 'AB', 'BA');
    const fills = frames.filter((f) => f.kind === 'fill');
    expect(fills.map((f) => [f.i, f.j, f.match, f.options.length])).toEqual([
      [1, 1, false, 2],
      [1, 2, true, 1],
      [2, 1, true, 1],
      [2, 2, false, 2],
    ]);
    expect(frames.at(-1)?.filled).toBe(9);
    expect(frames.at(-1)?.table).toEqual([
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
    ]);
  });
});

describe('edit distance', () => {
  it('turns KITTEN into SITTING in 3 edits', () => {
    const [a, b] = STRING_PRESETS.kitten;
    const last = stringDpTrace('edit', a, b).at(-1);
    expect(last?.result).toBe(3);
    expect(last?.ops.filter((o) => o.op !== 'keep').map((o) => o.op)).toEqual([
      'replace',
      'replace',
      'insert',
    ]);
  });

  it('matches Levenshtein and rebuilds a valid edit script', () => {
    const rand = seeded(2);
    const cases = [
      ['', ''],
      ['AB', ''],
      ['', 'ABC'],
      ['SUNDAY', 'SATURDAY'],
      ['ABC', 'ABC'],
    ];
    for (let t = 0; t < 60; t++) cases.push([word(rand), word(rand)]);
    for (const [a, b] of cases) {
      const last = stringDpTrace('edit', a, b).at(-1);
      expect(last?.result).toBe(levenshtein(a, b));
      const ops = last?.ops ?? [];
      expect(source(ops)).toBe(a);
      expect(apply(ops)).toBe(b);
      expect(ops.filter((o) => o.op !== 'keep')).toHaveLength(/** @type {number} */ (last?.result));
      for (const o of ops) if (o.op === 'keep') expect(o.from).toBe(o.to);
    }
  });

  it('starts the edges at i and j and walks back to the corner', () => {
    const frames = stringDpTrace('edit', 'AB', 'B');
    expect(frames[1].table).toEqual([
      [0, 1],
      [1, null],
      [2, null],
    ]);
    expect(frames.at(-1)?.path).toEqual([
      [2, 1],
      [1, 0],
      [0, 0],
    ]);
  });
});

describe('parseWord', () => {
  it('reads letters in capitals', () => {
    expect(parseWord(' kitten ')).toEqual({ word: 'KITTEN' });
    expect(parseWord('')).toEqual({ word: '' });
  });
  it('refuses other characters and long words', () => {
    expect(parseWord('AB1')).toEqual({ error: 'format' });
    expect(parseWord('A B')).toEqual({ error: 'format' });
    expect(parseWord('A'.repeat(MAX_LEN + 1))).toEqual({ error: 'length' });
  });
});

describe('frames', () => {
  it('do not alias each other', () => {
    const frames = stringDpTrace('edit', 'AB', 'BA');
    const before = JSON.stringify(frames[3]);
    frames[2].table[0][0] = 99;
    frames[2].options[0].value = 99;
    frames[2].lines.push(9);
    const end = frames.at(-1);
    end?.path[0].push(9);
    end?.ops.push({ op: 'keep', from: 'Z', to: 'Z' });
    expect(JSON.stringify(frames[3])).toBe(before);
    expect(frames.at(-2)?.path[0]).toHaveLength(2);
  });

  it('stay under 400 frames at the cap', () => {
    const long = 'A'.repeat(MAX_LEN);
    expect(stringDpTrace('edit', long, 'B'.repeat(MAX_LEN)).length).toBeLessThan(400);
    expect(stringDpTrace('lcs', long, long).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['lcs', 'edit']))('%s highlights every line', (mode) => {
    const [a, b] = STRING_PRESETS.clrs;
    const used = new Set(stringDpTrace(mode, a, b).flatMap((f) => f.lines));
    stringDpPseudocode[mode].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
