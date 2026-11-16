import { describe, expect, it } from 'vitest';
import {
  GAME_PRESETS,
  MAX_MOVE,
  MAX_PILE,
  MAX_PILES,
  bestMove,
  canMove,
  grundyPseudocode,
  grundyTrace,
  grundyValues,
  mex,
  nimSum,
  takesFrom,
  winningMoves,
} from './sprague-grundy.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./sprague-grundy.js').GameRule} GameRule */

/**
 * Whether the player to move wins, by searching the whole game tree: a position wins when some
 * move reaches a losing one. Independent of Grundy numbers.
 * @param {number[]} piles @param {GameRule} rule @param {number[]} moves
 * @param {Map<string, boolean>} memo
 * @returns {boolean}
 */
function wins(piles, rule, moves, memo = new Map()) {
  const key = piles
    .slice()
    .sort((a, b) => a - b)
    .join(',');
  const known = memo.get(key);
  if (known !== undefined) return known;
  let result = false;
  for (let p = 0; p < piles.length && !result; p++) {
    const takes = rule === 'nim' ? piles[p] : 0;
    const list = rule === 'nim' ? Array.from({ length: takes }, (_, i) => i + 1) : moves;
    for (const s of list) {
      if (s > piles[p]) continue;
      const next = piles.slice();
      next[p] -= s;
      if (!wins(next, rule, moves, memo)) {
        result = true;
        break;
      }
    }
  }
  memo.set(key, result);
  return result;
}

/** @param {import('./sprague-grundy.js').GrundyFrame[]} frames */
const last = (frames) => /** @type {import('./sprague-grundy.js').GrundyFrame} */ (frames.at(-1));

describe('Grundy numbers', () => {
  it('finds the minimum excluded value', () => {
    expect(mex([])).toBe(0);
    expect(mex([1, 2])).toBe(0);
    expect(mex([0, 2, 1, 4])).toBe(3);
    expect(mex([0, 0, 1])).toBe(2);
  });

  it('gives g(x) = x in Nim and a periodic pattern in subtraction games', () => {
    expect(grundyValues('nim', [], 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // Take 1, 2 or 3: g(x) = x mod 4.
    expect(grundyValues('subtraction', [1, 2, 3], 9)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0, 1]);
    // Take 1, 3 or 4: period 7, 0 1 0 1 2 3 2.
    expect(grundyValues('subtraction', [1, 3, 4], 13)).toEqual([
      0, 1, 0, 1, 2, 3, 2, 0, 1, 0, 1, 2, 3, 2,
    ]);
    expect(grundyValues('subtraction', [2], 5)).toEqual([0, 0, 1, 1, 0, 0]);
  });

  it('decides who wins exactly as a full game-tree search does', () => {
    const rand = seeded(5);
    for (let round = 0; round < 150; round++) {
      const rule = /** @type {GameRule} */ (round % 2 ? 'nim' : 'subtraction');
      const moves = [
        ...new Set(
          Array.from({ length: 1 + Math.floor(rand() * 3) }, () => 1 + Math.floor(rand() * 5)),
        ),
      ];
      const piles = Array.from({ length: 1 + Math.floor(rand() * 3) }, () =>
        Math.floor(rand() * 8),
      );
      const g = grundyValues(rule, moves, Math.max(...piles));
      expect(nimSum(piles, g) !== 0).toBe(wins(piles, rule, moves));
      for (const w of winningMoves(piles, rule, moves, g)) {
        const next = piles.slice();
        next[w.pile] -= w.take;
        expect(takesFrom(rule, moves, piles[w.pile])).toContain(w.take);
        expect(nimSum(next, g)).toBe(0);
        expect(wins(next, rule, moves)).toBe(false);
      }
    }
  });

  it('replies with a winning move when there is one, and any legal move otherwise', () => {
    const g = grundyValues('nim', [], 5);
    expect(bestMove([3, 4, 5], 'nim', [], g)).toEqual({ pile: 0, take: 2 });
    expect(bestMove([1, 2, 3], 'nim', [], g)).toEqual({ pile: 2, take: 1 });
    expect(bestMove([0, 0], 'nim', [], g)).toBeNull();
    expect(canMove([1, 1], 'subtraction', [2])).toBe(false);
    expect(canMove([2], 'subtraction', [2])).toBe(true);
  });
});

describe('Grundy trace', () => {
  it('ends with the same values, nim-sum and winning moves as the direct functions', () => {
    const rand = seeded(9);
    for (let round = 0; round < 80; round++) {
      const rule = /** @type {GameRule} */ (round % 3 ? 'subtraction' : 'nim');
      const moves = [1 + Math.floor(rand() * MAX_MOVE), 1 + Math.floor(rand() * MAX_MOVE)];
      const piles = Array.from({ length: 1 + Math.floor(rand() * MAX_PILES) }, () =>
        Math.floor(rand() * (MAX_PILE + 1)),
      );
      const f = last(grundyTrace(piles, rule, moves));
      const g = grundyValues(rule, moves, Math.max(...piles));
      expect(f.g).toEqual(g);
      expect(f.xor).toBe(nimSum(piles, g));
      expect(f.wins).toEqual(winningMoves(piles, rule, moves, g));
    }
  });

  it('reads g(x − s) once per legal move', () => {
    // Nim up to 15 reads 0 + 1 + … + 15 = 120 values.
    expect(last(grundyTrace([15], 'nim', [])).lookups).toBe(120);
    // Take 1, 3 or 4 up to 5: 0 + 1 + 1 + 2 + 3 + 3 = 10.
    expect(last(grundyTrace([5], 'subtraction', [1, 3, 4])).lookups).toBe(10);
  });

  it('stays under 400 frames at the caps', () => {
    expect(grundyTrace(GAME_PRESETS.big.piles, 'nim', []).length).toBeLessThan(400);
    expect(grundyTrace(Array(MAX_PILES).fill(MAX_PILE), 'nim', []).length).toBeLessThan(400);
  });

  it('handles a single empty pile', () => {
    const f = last(grundyTrace([0], 'nim', []));
    expect(f.g).toEqual([0]);
    expect(f.xor).toBe(0);
    expect(f.lines).toEqual([9]);
  });

  it('does not alias frames', () => {
    const frames = grundyTrace([3, 4, 5], 'nim', []);
    const a = frames[2];
    const b = frames[3];
    a.g.push(99);
    a.seen.push(99);
    a.piles.push(99);
    expect(b.g).not.toContain(99);
    expect(b.seen).not.toContain(99);
    expect(b.piles).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const used = new Set();
    for (const p of [GAME_PRESETS.classic, GAME_PRESETS.balanced])
      for (const f of grundyTrace(p.piles, p.rule, p.moves)) f.lines.forEach((l) => used.add(l));
    for (let i = 0; i < grundyPseudocode.length; i++) expect(used.has(i)).toBe(true);
  });
});
