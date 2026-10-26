import { describe, expect, it } from 'vitest';
import {
  CHANGES,
  VERSIONS,
  candidateTargets,
  debugPseudocode,
  debugTrace,
  makeSorted,
  outcomeOf,
  parseSorted,
  scanTargets,
} from './practice-searching.js';

/** Seeded LCG so random arrays are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const START = [3, 8, 12, 17, 21, 26, 30];

/** @param {import('./practice-searching.js').Version} v @param {number[]} a @param {number} x */
const last = (v, a, x) =>
  /** @type {import('./practice-searching.js').DebugFrame} */ (debugTrace(v, a, x).at(-1));

/** Every non-decreasing array of length 1-5 over {1,2,3}. */
function* allArrays() {
  /** @param {number[]} prefix @returns {Generator<number[]>} */
  function* extend(prefix) {
    if (prefix.length) yield prefix;
    if (prefix.length === 5) return;
    for (let v = prefix.at(-1) ?? 1; v <= 3; v++) yield* extend([...prefix, v]);
  }
  yield* extend([]);
}

describe('debugTrace', () => {
  it('version A answers like indexOf on every small array and target', () => {
    for (const a of allArrays()) {
      for (let x = 0; x <= 4; x++) {
        const f = last('A', a, x);
        expect(f.outcome).toBe('ok');
        if (a.includes(x)) expect(a[f.answer]).toBe(x);
        else expect(f.answer).toBe(-1);
      }
    }
  });

  it('version A reads at most floor(log2 n) + 1 cells', () => {
    const rand = seeded(4);
    for (let n = 1; n <= 12; n++) {
      const a = makeSorted(n, rand);
      for (const x of candidateTargets(a))
        expect(last('A', a, x).probes).toBeLessThanOrEqual(Math.floor(Math.log2(n)) + 1);
    }
  });

  it('finds the known failures on the starting array', () => {
    /** @param {import('./practice-searching.js').Version} v */
    const bad = (v) =>
      scanTargets(v, START)
        .filter((r) => r.outcome !== 'ok')
        .map((r) => `${r.x}:${r.outcome}`);
    expect(bad('A')).toEqual([]);
    expect(bad('B')).toEqual(['3:miss', '12:miss', '21:miss', '30:miss']);
    expect(bad('C')).toHaveLength(24);
    expect(bad('D')).toEqual(['31:out-of-bounds']);
    expect(bad('E')).toHaveLength(22);
  });

  it('a loop is a repeated (lo, hi) state', () => {
    const f = last('C', START, 30);
    expect(f).toMatchObject({ outcome: 'loop', lo: 5, hi: 6, answer: -2, probes: 4 });
    expect(f.states).toEqual([
      [0, 6],
      [3, 6],
      [4, 6],
      [5, 6],
    ]);
    expect(last('E', START, 2)).toMatchObject({ outcome: 'loop', lo: 0, hi: 0 });
  });

  it('version D reads a[n] only above every value', () => {
    expect(last('D', START, 31)).toMatchObject({ outcome: 'out-of-bounds', mid: 7 });
    for (const x of START) expect(outcomeOf('D', START, x)).toBe('ok');
  });

  it('each buggy version fails on exactly one target of a one-value array', () => {
    const fails = Object.fromEntries(
      VERSIONS.map((v) => [
        v,
        scanTargets(v, [5])
          .filter((r) => r.outcome !== 'ok')
          .map((r) => r.x),
      ]),
    );
    expect(fails).toEqual({ A: [], B: [5], C: [6], D: [6], E: [4] });
  });

  it('every run ends, with one done frame', () => {
    const rand = seeded(8);
    for (let t = 0; t < 50; t++) {
      const a = makeSorted(1 + Math.floor(rand() * 12), rand);
      for (const v of VERSIONS) {
        for (const x of candidateTargets(a)) {
          const frames = debugTrace(v, a, x);
          expect(frames.length).toBeLessThan(60);
          expect(frames.filter((f) => f.kind === 'done')).toHaveLength(1);
          expect(frames.at(-1)?.kind).toBe('done');
        }
      }
    }
  });

  it('does not alias frames to each other', () => {
    const frames = debugTrace('A', START, 26);
    frames[1].states.push([9, 9]);
    frames[1].lines.push(99);
    expect(frames[2].states).not.toContainEqual([9, 9]);
    expect(frames[2].lines).not.toContain(99);
  });
});

describe('versions', () => {
  it('each buggy version differs from A in exactly its changed line', () => {
    for (const v of VERSIONS) {
      const diff = debugPseudocode.A.flatMap((l, i) => (l === debugPseudocode[v][i] ? [] : i));
      expect(diff).toEqual(CHANGES[v] ? [CHANGES[v][0]] : []);
    }
  });
});

describe('parseSorted', () => {
  it('reads sorted values and rejects the rest', () => {
    expect(parseSorted('3, 8 8,12')).toEqual({ values: [3, 8, 8, 12] });
    expect(parseSorted('3, b')).toEqual({ error: 'format' });
    expect(parseSorted('3, 61')).toEqual({ error: 'range' });
    expect(parseSorted('')).toEqual({ error: 'count' });
    expect(parseSorted(Array(13).fill('1').join(' '))).toEqual({ error: 'count' });
    expect(parseSorted('8, 3')).toEqual({ error: 'order' });
  });

  it('makeSorted gives strictly increasing values within range', () => {
    const a = makeSorted(12, seeded(2));
    expect(a).toHaveLength(12);
    for (let i = 1; i < a.length; i++) expect(a[i]).toBeGreaterThan(a[i - 1]);
    expect(a.at(-1)).toBeLessThanOrEqual(60);
  });
});

describe('pseudocode coverage', () => {
  it.each(VERSIONS)('version %s highlights every pseudocode line', (v) => {
    const frames = candidateTargets(START).flatMap((x) => debugTrace(v, START, x));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((p, q) => p - q)).toEqual(debugPseudocode[v].map((_, i) => i));
  });
});
