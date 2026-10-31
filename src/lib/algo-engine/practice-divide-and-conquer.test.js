import { describe, expect, it } from 'vitest';
import {
  CORRECT,
  MAX_N,
  PARTS,
  PROBLEMS,
  SAMPLES,
  callTree,
  combinePseudocode,
  majorityPseudocode,
  maxSubarrayPseudocode,
  normalizeParts,
  parseValues,
  randomValues,
  runCombine,
  solveTrace,
} from './practice-divide-and-conquer.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Kadane's scan, an independent oracle for the non-empty maximum subarray. @param {number[]} a */
function kadane(a) {
  let best = a[0];
  let here = a[0];
  for (let i = 1; i < a.length; i++) {
    here = Math.max(a[i], here + a[i]);
    best = Math.max(best, here);
  }
  return best;
}

/** Counting with a map, an independent oracle for the majority element. @param {number[]} a */
function majorityByMap(a) {
  const counts = new Map();
  for (const v of a) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const [v, c] of counts) if (2 * c > a.length) return v;
  return null;
}

/** @param {number[]} a */
const finalOf = (/** @type {import('./practice-divide-and-conquer.js').Problem} */ p, a) =>
  /** @type {import('./practice-divide-and-conquer.js').DcFrame} */ (
    solveTrace(p, CORRECT[p], a).at(-1)
  );

describe('correct combines', () => {
  const rand = seeded(7);
  const randomCases = Array.from({ length: 40 }, (_, k) =>
    Array.from({ length: 1 + (k % MAX_N) }, () => Math.floor(rand() * 21) - 10),
  );
  const majorityCases = Array.from({ length: 40 }, (_, k) =>
    randomValues('majority', 1 + (k % MAX_N), rand),
  );

  it('maximum subarray matches Kadane on samples, edges and random arrays', () => {
    const edge = [[5], [-5], [0, 0, 0], [-3, -1, -2], [1, 2, 3, 4], [4, 3, 2, 1], [2, 2, 2, 2]];
    for (const a of [...SAMPLES['max-subarray'], ...edge, ...randomCases]) {
      const last = finalOf('max-subarray', a);
      expect(last.result, a.join()).toBe(kadane(a));
      expect(last.ok).toBe(true);
      expect(last.firstWrong).toBe('');
    }
  });

  it('majority matches counting on samples, edges and random arrays', () => {
    const edge = [[5], [1, 2], [1, 1], [1, 1, 2, 2], [2, 1, 1], [3, 3, 3, 3]];
    for (const a of [...SAMPLES.majority, ...edge, ...majorityCases, ...randomCases]) {
      const last = finalOf('majority', a);
      expect(last.result, a.join()).toBe(majorityByMap(a));
      expect(last.firstWrong).toBe('');
    }
  });

  it('every call checks right with a correct combine', () => {
    for (const p of PROBLEMS) {
      const frames = solveTrace(p, CORRECT[p], SAMPLES[p][0]);
      expect(Object.values(frames.at(-1)?.status ?? {}).every((s) => s === 'right')).toBe(true);
    }
  });
});

describe('buggy combines', () => {
  it('dropping C misses the subarray that crosses mid', () => {
    const r = runCombine('max-subarray', ['left', 'right'], [-2, 1, -3, 4, -1, 2, 1, -5, 4]);
    expect(r).toEqual({ got: 4, expected: 6, ok: false, firstWrong: '5-6' });
  });

  it('C alone fails on an all-negative array but right answers can hide wrong calls', () => {
    expect(runCombine('max-subarray', ['cross'], [-8, -3, -6, -2, -5, -4]).ok).toBe(false);
    const hidden = runCombine('max-subarray', ['cross'], [4, -1, 2, 1]);
    expect(hidden.ok).toBe(true);
    expect(hidden.firstWrong).toBe('0-1');
  });

  it('majority without counting returns a value that is not a majority', () => {
    expect(runCombine('majority', ['left', 'right'], [1, 1, 2, 2])).toEqual({
      got: 1,
      expected: null,
      ok: false,
      firstWrong: '0-3',
    });
  });

  it('majority with one candidate misses a majority from the other half', () => {
    expect(runCombine('majority', ['right', 'count'], [4, 4, 4, 1, 2]).got).toBe(null);
    expect(runCombine('majority', ['left', 'count'], [7, 1, 7, 2, 7, 3, 7]).got).toBe(null);
  });

  it('no parts at all returns nothing above the leaves', () => {
    const r = runCombine('max-subarray', [], [1, 2]);
    expect(r.got).toBe(null);
    expect(r.firstWrong).toBe('0-1');
  });
});

describe('cost counters', () => {
  it('a power-of-two input makes 2n − 1 calls and reads n per level plus n leaves', () => {
    const a = [3, -1, 4, -1, 5, -9, 2, 6];
    const last = finalOf('max-subarray', a);
    expect(last.calls).toBe(15);
    // 8 leaf reads plus 8 cells on each of 3 levels.
    expect(last.reads).toBe(32);
    const maj = finalOf('majority', [1, 1, 1, 1, 2, 2, 2, 2]);
    expect(maj.calls).toBe(15);
    expect(maj.reads).toBe(32);
  });

  it('majority skips the count when no candidate is left', () => {
    const last = finalOf('majority', [1, 2, 3, 4]);
    // Leaves read 4; [0, 1] and [2, 3] count 2 each; the root has no candidate.
    expect(last.reads).toBe(8);
  });

  it('a one-cell array is a single base call', () => {
    const frames = solveTrace('max-subarray', CORRECT['max-subarray'], [-7]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'base', 'done']);
    expect(frames.at(-1)?.result).toBe(-7);
  });
});

describe('trace shape', () => {
  it('starts and ends as the contract says', () => {
    for (const p of PROBLEMS) {
      const frames = solveTrace(p, CORRECT[p], SAMPLES[p][1]);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('records the best suffix and prefix of the crossing sum', () => {
    const frames = solveTrace(
      'max-subarray',
      CORRECT['max-subarray'],
      [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    );
    const root = frames.findLast((f) => f.kind === 'measure');
    expect(root?.suffix).toEqual([3, 4]);
    expect(root?.prefix).toEqual([5, 6]);
    expect(root?.C).toBe(6);
    expect(root?.T).toBe(1);
  });

  it('frames do not alias each other', () => {
    const frames = solveTrace('majority', CORRECT.majority, [3, 3, 4, 2, 4]);
    const i = frames.findIndex((f) => f.kind === 'split');
    frames[i].stack.push('x');
    frames[i].status['x'] = 'wrong';
    frames[i].results['x'] = 1;
    expect(frames[i + 1].stack).not.toContain('x');
    expect(frames[i + 1].status['x']).toBeUndefined();
    expect(frames[i + 1].results['x']).toBeUndefined();
  });

  it('call tree covers every call the trace makes', () => {
    const a = [5, -9, 6, -2, 3];
    const ids = new Set();
    /** @param {import('./practice-divide-and-conquer.js').CallRange | null} t */
    const walk = (t) => {
      if (!t) return;
      ids.add(t.id);
      t.children.forEach(walk);
    };
    walk(callTree(a.length));
    const status = solveTrace('max-subarray', CORRECT['max-subarray'], a).at(-1)?.status ?? {};
    expect(new Set(Object.keys(status))).toEqual(ids);
    expect(callTree(0)).toBe(null);
  });
});

describe('inputs and code', () => {
  it('parses whole numbers and refuses bad input', () => {
    expect(parseValues('3, -1  4;−2')).toEqual({ values: [3, -1, 4, -2] });
    expect(parseValues('1, x')).toEqual({ error: 'format' });
    expect(parseValues('1.5')).toEqual({ error: 'format' });
    expect(parseValues('100')).toEqual({ error: 'range' });
    expect(parseValues('')).toEqual({ error: 'count' });
    expect(
      parseValues(
        Array(MAX_N + 1)
          .fill(1)
          .join(' '),
      ),
    ).toEqual({ error: 'count' });
  });

  it('random inputs stay in range', () => {
    const rand = seeded(3);
    for (const p of PROBLEMS) {
      const a = randomValues(p, MAX_N, rand);
      expect(a).toHaveLength(MAX_N);
      expect(parseValues(a.join(' '))).toEqual({ values: a });
    }
  });

  it('writes the combine line from the chosen parts', () => {
    expect(combinePseudocode('max-subarray', ['total', 'left'])[6]).toBe('  return max(L, T)');
    expect(combinePseudocode('max-subarray', [])[6]).toBe('  return nothing');
    expect(combinePseudocode('majority', ['right'])).toContain('  for each x ≠ none in [R]:');
    expect(combinePseudocode('majority', ['right'])[5]).toBe('    return x');
    expect(normalizeParts('majority', ['count', 'left', 'left'])).toEqual(['left', 'count']);
    for (const p of PROBLEMS) expect(combinePseudocode(p, PARTS[p])).toHaveLength(7);
  });
});

describe('pseudocode coverage', () => {
  /** @type {[string, string[], import('./practice-divide-and-conquer.js').Problem][]} */
  const cases = [
    ['maximum subarray', maxSubarrayPseudocode, 'max-subarray'],
    ['majority element', majorityPseudocode, 'majority'],
  ];
  it.each(cases)('every %s line is highlighted by some frame', (_, lines, p) => {
    const seen = new Set();
    for (const a of SAMPLES[p]) {
      for (const f of solveTrace(p, CORRECT[p], a)) f.lines.forEach((l) => seen.add(l));
    }
    for (let i = 0; i < lines.length; i++) expect(seen.has(i), `line ${i}`).toBe(true);
  });
});
