import { describe, expect, it } from 'vitest';
import {
  HULL_PRESETS,
  INTERCEPT_MAX,
  INTERCEPT_MIN,
  MAX_LINES,
  MAX_QUERIES,
  PLOT,
  SLOPE_RANGE,
  clipToPlot,
  envelopePieces,
  hullPseudocode,
  hullTrace,
  parseLines,
  parseQueries,
  useless,
} from './dp-optimisations.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** @param {() => number} rand @param {number} n @returns {[number, number][]} */
function randomLines(rand, n) {
  return Array.from({ length: n }, () => [
    Math.floor(rand() * (2 * SLOPE_RANGE + 1)) - SLOPE_RANGE,
    INTERCEPT_MIN + Math.floor(rand() * (INTERCEPT_MAX - INTERCEPT_MIN + 1)),
  ]);
}

/**
 * Lines that are strictly lowest somewhere: test a point between every two crossings, and far
 * to each side, and keep the line that wins alone.
 * @param {[number, number][]} pairs
 */
function envelopeIds(pairs) {
  /** @type {number[]} */
  const xs = [];
  for (let i = 0; i < pairs.length; i++)
    for (let j = i + 1; j < pairs.length; j++)
      if (pairs[i][0] !== pairs[j][0])
        xs.push((pairs[j][1] - pairs[i][1]) / (pairs[i][0] - pairs[j][0]));
  xs.sort((a, b) => a - b);
  const probes = [-1e6, 1e6, ...xs.slice(1).map((x, k) => (x + xs[k]) / 2)];
  if (xs.length) probes.push(xs[0] - 1, xs[xs.length - 1] + 1);
  const ids = new Set();
  for (const x of probes) {
    const ys = pairs.map(([m, b]) => m * x + b);
    const low = Math.min(...ys);
    const winners = ys.flatMap((y, i) => (Math.abs(y - low) < 1e-9 ? [i] : []));
    const slopes = new Set(winners.map((i) => pairs[i][0]));
    // Equal lines tie everywhere; the trace keeps the one typed first.
    if (slopes.size === 1) ids.add(winners[0]);
  }
  return ids;
}

describe('convex hull trick', () => {
  it('answers every query with the smallest value', () => {
    const rand = seeded(61);
    const cases = HULL_PRESETS.map((p) => /** @type {const} */ ([p.lines, p.queries]));
    for (let t = 0; t < 60; t++) {
      const lines = randomLines(rand, 1 + Math.floor(rand() * MAX_LINES));
      const queries = [...new Set(Array.from({ length: 6 }, () => Math.floor(rand() * 11)))].sort(
        (a, b) => a - b,
      );
      cases.push([lines, queries]);
    }
    for (const [lines, queries] of cases) {
      const last = hullTrace([...lines], [...queries]).at(-1);
      expect(last?.answers).toEqual(
        queries.map((x) => Math.min(...lines.map(([m, b]) => m * x + b))),
      );
    }
  });

  it('keeps exactly the lines that are strictly lowest somewhere', () => {
    const rand = seeded(62);
    const cases = HULL_PRESETS.map((p) => p.lines);
    for (let t = 0; t < 60; t++) cases.push(randomLines(rand, 1 + Math.floor(rand() * MAX_LINES)));
    for (const lines of cases) {
      const last = hullTrace(lines, [0]).at(-1);
      expect(new Set(last?.hull)).toEqual(envelopeIds(lines));
      expect((last?.hull.length ?? 0) + (last?.removed.length ?? 0)).toBe(lines.length);
    }
  });

  it('keeps hull slopes strictly decreasing', () => {
    const last = hullTrace(HULL_PRESETS[0].lines, [0]).at(-1);
    const slopes = (last?.hull ?? []).map((id) => HULL_PRESETS[0].lines[id][0]);
    expect(slopes).toEqual([2, 1, 0, -1, -2]);
  });

  it('skips a parallel line that is higher, pops a useless one and one that only touches', () => {
    const [cap, mid, touch] = HULL_PRESETS.map((p) => hullTrace(p.lines, p.queries));
    expect(cap.find((f) => f.kind === 'skip')?.cur).toBe(3);
    expect(cap.at(-1)?.removed).toEqual([3]);
    expect(mid.at(-1)?.removed).toEqual([2]);
    expect(touch.at(-1)?.hull).toEqual([3, 0]);
    expect(touch.at(-1)?.removed).toEqual([2, 1]);
    expect(useless({ id: 0, m: 1, b: 1 }, { id: 1, m: 0, b: 5 }, { id: 2, m: -1, b: 9 })).toBe(
      true,
    );
  });

  it('moves the pointer at most hull − 1 times over all queries', () => {
    const frames = hullTrace(HULL_PRESETS[0].lines, HULL_PRESETS[0].queries);
    const last = frames.at(-1);
    expect(last?.moves).toBe(4);
    // One failed comparison per query while the pointer has a line to its right.
    expect(last?.compares).toBe(4 + 7);
    expect(last?.checks).toBe(3);
  });

  it('handles one line', () => {
    const last = hullTrace([[3, 2]], [0, 5]).at(-1);
    expect(last?.answers).toEqual([2, 17]);
    expect(last?.moves).toBe(0);
  });
});

describe('parsers', () => {
  it('read lines and queries', () => {
    expect(parseLines('2 1; −1 13, -2 20')).toEqual({
      lines: [
        [2, 1],
        [-1, 13],
        [-2, 20],
      ],
    });
    expect(parseQueries('4 0, 2 2')).toEqual({ queries: [0, 2, 4] });
  });

  it('refuse bad input', () => {
    expect(parseLines('')).toEqual({ error: 'count' });
    expect(
      parseLines(
        Array(MAX_LINES + 1)
          .fill('1 1')
          .join(','),
      ),
    ).toEqual({ error: 'count' });
    expect(parseLines('1')).toEqual({ error: 'format' });
    expect(parseLines('1.5 2')).toEqual({ error: 'format' });
    expect(parseLines(`${SLOPE_RANGE + 1} 0`)).toEqual({ error: 'range' });
    expect(parseLines(`0 ${INTERCEPT_MAX + 1}`)).toEqual({ error: 'range' });
    expect(parseQueries('a')).toEqual({ error: 'format' });
    expect(parseQueries('')).toEqual({ error: 'count' });
    expect(parseQueries(String(PLOT.xMax + 1))).toEqual({ error: 'range' });
    expect(
      parseQueries(
        Array.from({ length: MAX_QUERIES + 1 }, (_, i) => i)
          .map(String)
          .join(' '),
      ),
    ).toEqual({ error: 'count' });
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const lines = HULL_PRESETS[0].lines.map((l) => /** @type {[number, number]} */ ([...l]));
    const frames = hullTrace(lines, [0, 1]);
    const before = JSON.stringify(frames[5]);
    frames[4].hull.push(9);
    frames[4].pool[0].m = 9;
    frames[4].answers[0] = 9;
    frames[4].lines.push(9);
    expect(JSON.stringify(frames[5])).toBe(before);
    expect(lines[0][0]).toBe(2);
  });

  it('start and end with the named kinds and stay under 400 at the cap', () => {
    const frames = hullTrace(
      randomLines(seeded(4), MAX_LINES),
      Array.from({ length: MAX_QUERIES }, (_, i) => i),
    );
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const used = new Set(
      HULL_PRESETS.flatMap((p) => hullTrace(p.lines, p.queries)).flatMap((f) => f.lines),
    );
    hullPseudocode.forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});

describe('plot helpers', () => {
  it('clips a line to the plot box', () => {
    expect(clipToPlot({ id: 0, m: -2, b: 20 })).toEqual({ x1: 4, y1: 12, x2: 10, y2: 0 });
    expect(clipToPlot({ id: 0, m: 0, b: 7 })).toEqual({ x1: 0, y1: 7, x2: 10, y2: 7 });
    expect(clipToPlot({ id: 0, m: 0, b: 13 })).toBeNull();
    expect(clipToPlot({ id: 0, m: 1, b: -20 })).toBeNull();
  });

  it('splits the envelope at the crossings of neighbouring hull lines', () => {
    const p = HULL_PRESETS[0];
    const last = hullTrace(p.lines, p.queries).at(-1);
    const hull = (last?.hull ?? []).map((id) => ({ id, m: p.lines[id][0], b: p.lines[id][1] }));
    expect(envelopePieces(hull)).toEqual([
      { id: 0, from: 0, to: 2 },
      { id: 1, from: 2, to: 4 },
      { id: 2, from: 4, to: 6 },
      { id: 4, from: 6, to: 7 },
      { id: 5, from: 7, to: 10 },
    ]);
  });
});
