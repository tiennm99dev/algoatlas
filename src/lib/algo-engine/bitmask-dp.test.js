import { describe, expect, it } from 'vitest';
import {
  CITY_PRESETS,
  GRID,
  MAX_CITIES,
  citiesOf,
  distances,
  heldKarpTrace,
  tourCount,
  transitionCount,
  tspPseudocode,
} from './bitmask-dp.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Shortest tour from city 0 by trying every order of the other cities. */
/** @param {number[][]} d */
function bruteTour(d) {
  const n = d.length;
  let best = Infinity;
  /** @param {number[]} rest @param {number} at @param {number} cost */
  const go = (rest, at, cost) => {
    if (!rest.length) {
      best = Math.min(best, cost + d[at][0]);
      return;
    }
    rest.forEach((c, i) => go([...rest.slice(0, i), ...rest.slice(i + 1)], c, cost + d[at][c]));
  };
  go(
    Array.from({ length: n - 1 }, (_, i) => i + 1),
    0,
    0,
  );
  return best;
}

/** @param {() => number} rand @param {number} n */
function randomMatrix(rand, n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : 1 + Math.floor(rand() * 20))),
  );
}

describe('Held-Karp', () => {
  it('finds the preset tours', () => {
    const [four, five, six] = CITY_PRESETS.map((p) => heldKarpTrace(distances(p.cities)).at(-1));
    expect(four?.result).toBe(20);
    expect(four?.tour).toEqual([0, 2, 3, 1, 0]);
    expect(five?.result).toBe(28);
    expect(five?.tour).toEqual([0, 4, 3, 2, 1, 0]);
    expect(six?.result).toBe(26);
  });

  it('matches brute force on grids and on one-way distances', () => {
    const rand = seeded(31);
    for (let t = 0; t < 40; t++) {
      const n = 3 + Math.floor(rand() * (MAX_CITIES - 2));
      const cities = Array.from({ length: n }, () => ({
        x: Math.floor(rand() * (GRID.xMax + 1)),
        y: Math.floor(rand() * (GRID.yMax + 1)),
      }));
      const d = distances(cities);
      expect(heldKarpTrace(d).at(-1)?.result).toBe(bruteTour(d));
      const one = randomMatrix(rand, n);
      expect(heldKarpTrace(one).at(-1)?.result).toBe(bruteTour(one));
    }
  });

  it('rebuilds a tour that visits every city once and costs the answer', () => {
    const rand = seeded(32);
    for (let t = 0; t < 30; t++) {
      const n = 3 + Math.floor(rand() * (MAX_CITIES - 2));
      const d = randomMatrix(rand, n);
      const last = heldKarpTrace(d).at(-1);
      const tour = last?.tour ?? [];
      expect(tour[0]).toBe(0);
      expect(tour.at(-1)).toBe(0);
      expect(tour.slice(0, -1).slice().sort()).toEqual(Array.from({ length: n }, (_, i) => i));
      const cost = tour.slice(1).reduce((s, c, i) => s + d[tour[i]][c], 0);
      expect(cost).toBe(last?.result);
    }
  });

  it('stores in dp[mask][j] the shortest walk over exactly mask', () => {
    const d = randomMatrix(seeded(33), 5);
    const last = heldKarpTrace(d).at(-1);
    /** @param {number} mask @param {number} j @returns {number} */
    const walk = (mask, j) => {
      if (mask === 1) return j === 0 ? 0 : Infinity;
      const prev = mask ^ (1 << j);
      return Math.min(...citiesOf(prev, 5).map((i) => walk(prev, i) + d[i][j]));
    };
    for (let mask = 1; mask < 32; mask += 2)
      for (const j of citiesOf(mask, 5)) {
        const want = walk(mask, j);
        expect(last?.dp[mask][j]).toBe(want === Infinity ? null : want);
      }
  });

  it('counts transitions and reached states', () => {
    for (let n = 3; n <= MAX_CITIES; n++) {
      const last = heldKarpTrace(randomMatrix(seeded(n), n)).at(-1);
      expect(last?.tries).toBe(transitionCount(n));
      // Every mask with A has one state per city in it other than A, plus the start state.
      expect(last?.reached).toBe(1 + (n - 1) * 2 ** (n - 2));
    }
    expect([3, 4, 5, 6].map(transitionCount)).toEqual([4, 15, 52, 165]);
    expect([3, 4, 5, 6].map(tourCount)).toEqual([2, 6, 24, 120]);
  });

  it('keeps the first predecessor on a tie', () => {
    const d = [
      [0, 1, 1, 1],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
      [1, 1, 1, 0],
    ];
    const last = heldKarpTrace(d).at(-1);
    expect(last?.result).toBe(4);
    // (mask {A, C, D}, C) reaches B first, so B's predecessor is C; D came before C.
    expect(last?.tour).toEqual([0, 3, 2, 1, 0]);
  });

  it('only reads states that are final', () => {
    const frames = heldKarpTrace(distances(CITY_PRESETS[2].cities));
    const final = /** @type {(number|null)[][]} */ (frames.at(-1)?.dp);
    for (const f of frames.filter((x) => x.kind === 'try')) {
      expect(f.dp[f.mask][f.j]).toBe(final[f.mask][f.j]);
      expect(f.cand).toBe(/** @type {number} */ (final[f.mask][f.j]) + f.dist[f.j][f.k]);
    }
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const d = distances(CITY_PRESETS[0].cities);
    const frames = heldKarpTrace(d);
    const before = JSON.stringify(frames[4]);
    frames[3].dp[1][0] = 99;
    frames[3].dist[0][1] = 99;
    frames[3].route.push(9);
    frames[3].lines.push(9);
    expect(JSON.stringify(frames[4])).toBe(before);
    expect(d[0][1]).toBe(5);
    const last = /** @type {import('./bitmask-dp.js').TspFrame} */ (frames.at(-1));
    last.tour.push(9);
    expect(frames.at(-2)?.tour).not.toContain(9);
  });

  it('start and end with the named kinds and stay under 400 at the cap', () => {
    const frames = heldKarpTrace(randomMatrix(seeded(5), MAX_CITIES));
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const used = new Set(heldKarpTrace(distances(CITY_PRESETS[1].cities)).flatMap((f) => f.lines));
    tspPseudocode.forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
