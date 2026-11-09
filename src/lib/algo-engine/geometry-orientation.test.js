import { describe, expect, it } from 'vitest';
import {
  EPSILON,
  GRID,
  ORIENTATION_PRESETS,
  cross,
  dot,
  floatOrient,
  inBox,
  orient,
  orientationPseudocode,
  orientationTrace,
  sub,
  turnOf,
} from './geometry-orientation.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {() => number} rand */
const randomPoint = (rand) => ({
  x: Math.floor(rand() * (GRID.xMax + 1)),
  y: Math.floor(rand() * (GRID.yMax + 1)),
});

/** Which way the direction turns, read from angles instead of a cross product. */
/** @param {{x: number, y: number}} a @param {{x: number, y: number}} b @param {{x: number, y: number}} c */
function turnByAngles(a, b, c) {
  const first = Math.atan2(b.y - a.y, b.x - a.x);
  const second = Math.atan2(c.y - a.y, c.x - a.x);
  const sine = Math.sin(second - first);
  if (Math.abs(sine) < 1e-9) return 'collinear';
  return sine > 0 ? 'left' : 'right';
}

describe('vector products', () => {
  it('computes dot and cross on known vectors', () => {
    expect(dot({ x: 3, y: 4 }, { x: 4, y: -3 })).toBe(0);
    expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
    expect(cross({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
    expect(sub({ x: 5, y: 2 }, { x: 1, y: 1 })).toEqual({ x: 4, y: 1 });
  });

  it('flips the sign of orient when two points swap', () => {
    const rand = seeded(5);
    for (let t = 0; t < 200; t++) {
      const [a, b, c] = [randomPoint(rand), randomPoint(rand), randomPoint(rand)];
      expect(orient(a, b, c) + orient(a, c, b)).toBe(0);
      expect(orient(a, b, c)).toBe(orient(b, c, a));
    }
  });

  it('agrees with the angle between the two vectors on random points', () => {
    const rand = seeded(11);
    for (let t = 0; t < 500; t++) {
      const [a, b, c] = [randomPoint(rand), randomPoint(rand), randomPoint(rand)];
      const same = (a.x === b.x && a.y === b.y) || (a.x === c.x && a.y === c.y);
      expect(turnOf(orient(a, b, c))).toBe(same ? 'collinear' : turnByAngles(a, b, c));
    }
  });

  it('reads the bounding box inclusively', () => {
    expect(inBox({ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 4, y: 2 })).toBe(true);
    expect(inBox({ x: 4, y: 2 }, { x: 0, y: 0 }, { x: 2, y: 1 })).toBe(true);
    expect(inBox({ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 5, y: 2 })).toBe(false);
  });
});

describe('orientation trace', () => {
  it('runs start, u, v, dot, cross, precision, done', () => {
    const { a, b, c } = ORIENTATION_PRESETS.left;
    const frames = orientationTrace(a, b, c);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'u',
      'v',
      'dot',
      'cross',
      'precision',
      'done',
    ]);
    const last = /** @type {import('./geometry-orientation.js').OrientationFrame} */ (
      frames.at(-1)
    );
    expect(last.u).toEqual({ x: 4, y: 1 });
    expect(last.v).toEqual({ x: 2, y: 5 });
    expect(last.dot).toBe(13);
    expect(last.cross).toBe(18);
    expect(last.turn).toBe('left');
    expect(last.angle).toBe('acute');
    expect(last.multiplications).toBe(4);
  });

  it.each(
    /** @type {[keyof typeof ORIENTATION_PRESETS, string, string][]} */ ([
      ['left', 'left', 'acute'],
      ['right', 'right', 'acute'],
      ['collinear', 'collinear', 'acute'],
      ['rightAngle', 'left', 'right'],
      ['obtuse', 'left', 'obtuse'],
    ]),
  )('reads preset %s as turn %s and angle %s', (name, turn, angle) => {
    const { a, b, c } = ORIENTATION_PRESETS[name];
    const last = orientationTrace(a, b, c).at(-1);
    expect(last?.turn).toBe(turn);
    expect(last?.angle).toBe(angle);
  });

  it('has no angle when a vector is zero', () => {
    const p = { x: 2, y: 2 };
    const last = orientationTrace(p, p, { x: 5, y: 3 }).at(-1);
    expect(last?.angle).toBe('none');
    expect(last?.turn).toBe('collinear');
  });

  it('shows floats calling exactly collinear points a right turn, and epsilon fixing it', () => {
    const { a, b, c } = ORIENTATION_PRESETS.floatTrap;
    const last = orientationTrace(a, b, c).at(-1);
    expect(last?.cross).toBe(0);
    expect(last?.turn).toBe('collinear');
    expect(last?.floatCross).toBe(floatOrient(a, b, c));
    expect(last?.floatCross).not.toBe(0);
    expect(Math.abs(/** @type {number} */ (last?.floatCross))).toBeLessThan(EPSILON);
    expect(last?.floatTurn).toBe('right');
    expect(last?.epsilonTurn).toBe('collinear');
  });

  it('does not alias frames or the input', () => {
    const { a, b, c } = ORIENTATION_PRESETS.left;
    const input = { ...a };
    const frames = orientationTrace(input, b, c);
    frames[0].a.x = 99;
    expect(frames[1].a.x).toBe(a.x);
    expect(input.x).toBe(a.x);
    const [, , one, two] = frames;
    if (one.u) one.u.x = 99;
    expect(two.u?.x).toBe(4);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across the three outcomes', () => {
    const frames = ['left', 'right', 'collinear']./** @type {const} */
    flatMap((name) => {
      const { a, b, c } = ORIENTATION_PRESETS[/** @type {'left'} */ (name)];
      return orientationTrace(a, b, c);
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(orientationPseudocode.map((_, i) => i));
  });
});
