/**
 * Impartial games under normal play (whoever cannot move loses), on piles of stones. A move takes
 * some stones from one pile: any number in Nim, or a number from a fixed set S in a subtraction
 * game. The Grundy number of a pile of x stones is g(x) = mex{ g(x − s) : s a legal move }, the
 * smallest whole number not reached. By the Sprague–Grundy theorem a position of several piles
 * is worth the XOR of its piles’ Grundy numbers, and the player to move wins exactly when that
 * XOR is not 0. In Nim g(x) = x, so the test is the XOR of the pile sizes (Bouton’s theorem).
 */

export const MIN_PILES = 1;
export const MAX_PILES = 5;
export const MAX_PILE = 15;
export const MAX_MOVES = 4;
export const MAX_MOVE = 9;

/** @typedef {'nim'|'subtraction'} GameRule */

export const grundyPseudocode = [
  'for x = 0 to N:',
  '  seen = { }',
  '  for s in moves if s ≤ x:',
  '    seen.add(g(x − s))',
  '  g(x) = mex(seen)   // giá trị nhỏ nhất không thuộc seen',
  'X = 0',
  'for h in piles:   // đống h viên sỏi',
  '  X = X xor g(h)',
  'if X ≠ 0: đưa một đống h về đống có g = g(h) xor X',
  'else: mọi nước đi để lại X ≠ 0, nên người sắp đi thua',
];

/**
 * The legal takes from a pile of x stones, smallest first.
 * @param {GameRule} rule
 * @param {number[]} moves  S, for a subtraction game.
 * @param {number} x
 */
export function takesFrom(rule, moves, x) {
  if (rule === 'nim') return Array.from({ length: x }, (_, i) => i + 1);
  return moves.filter((s) => s <= x).sort((a, b) => a - b);
}

/** The smallest whole number not in the list. @param {number[]} values */
export function mex(values) {
  const set = new Set(values);
  let v = 0;
  while (set.has(v)) v++;
  return v;
}

/**
 * g(0) … g(N), without frames.
 * @param {GameRule} rule
 * @param {number[]} moves
 * @param {number} N
 */
export function grundyValues(rule, moves, N) {
  /** @type {number[]} */
  const g = [];
  for (let x = 0; x <= N; x++) g.push(mex(takesFrom(rule, moves, x).map((s) => g[x - s])));
  return g;
}

/**
 * The XOR of the piles’ Grundy numbers.
 * @param {number[]} piles
 * @param {number[]} g  Grundy numbers up to the largest pile.
 */
export const nimSum = (piles, g) => piles.reduce((x, h) => x ^ g[h], 0);

/**
 * Every move that leaves a nim-sum of 0, as (pile index, stones taken).
 * @param {number[]} piles
 * @param {GameRule} rule
 * @param {number[]} moves
 * @param {number[]} g
 * @returns {{ pile: number, take: number }[]}
 */
export function winningMoves(piles, rule, moves, g) {
  const X = nimSum(piles, g);
  if (X === 0) return [];
  /** @type {{ pile: number, take: number }[]} */
  const out = [];
  piles.forEach((h, pile) => {
    for (const take of takesFrom(rule, moves, h)) {
      if (g[h - take] === (g[h] ^ X)) out.push({ pile, take });
    }
  });
  return out;
}

/**
 * The computer’s reply: the first winning move, or else one stone (the smallest legal take)
 * from the largest pile it can move, to make the game last and hope for a mistake.
 * @param {number[]} piles
 * @param {GameRule} rule
 * @param {number[]} moves
 * @param {number[]} g
 * @returns {{ pile: number, take: number } | null}  null when no move is left.
 */
export function bestMove(piles, rule, moves, g) {
  const wins = winningMoves(piles, rule, moves, g);
  if (wins.length > 0) return wins[0];
  /** @type {{ pile: number, take: number } | null} */
  let best = null;
  for (let pile = 0; pile < piles.length; pile++) {
    const takes = takesFrom(rule, moves, piles[pile]);
    if (takes.length > 0 && (best === null || piles[pile] > piles[best.pile])) {
      best = { pile, take: takes[0] };
    }
  }
  return best;
}

/**
 * Whether any move is left.
 * @param {number[]} piles
 * @param {GameRule} rule
 * @param {number[]} moves
 */
export const canMove = (piles, rule, moves) =>
  piles.some((h) => takesFrom(rule, moves, h).length > 0);

/**
 * @typedef {object} GrundyFrame
 * @property {'start'|'position'|'look'|'mex'|'pile'|'done'} kind
 * @property {GameRule} rule
 * @property {number[]} moves  S; empty for Nim.
 * @property {number[]} piles
 * @property {(number | null)[]} g  g(0) … g(N); null before it is worked out.
 * @property {number} x  The pile size being worked out; -1 when none.
 * @property {number} take  look: the move s; -1 otherwise.
 * @property {number[]} seen  The Grundy numbers reached from x so far.
 * @property {number} pile  pile: its index; -1 otherwise.
 * @property {number} xor  X so far.
 * @property {{ pile: number, take: number }[]} wins  done: the winning moves.
 * @property {number} lookups  Values g(x − s) read so far.
 * @property {number[]} lines
 */

/**
 * Works out g(0) … g(N) for N the largest pile, then XORs the piles.
 * @param {number[]} piles
 * @param {GameRule} rule
 * @param {number[]} moves
 * @returns {GrundyFrame[]}
 */
export function grundyTrace(piles, rule, moves) {
  const N = Math.max(...piles);
  /** @type {(number | null)[]} */
  const g = Array(N + 1).fill(null);
  let x = -1;
  let take = -1;
  /** @type {number[]} */
  let seen = [];
  let pile = -1;
  let xor = 0;
  /** @type {{ pile: number, take: number }[]} */
  let wins = [];
  let lookups = 0;
  const S = rule === 'nim' ? [] : moves.slice().sort((a, b) => a - b);
  /** @type {GrundyFrame[]} */
  const frames = [];

  /** @param {GrundyFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      rule,
      moves: S.slice(),
      piles: piles.slice(),
      g: g.slice(),
      x,
      take,
      seen: seen.slice(),
      pile,
      xor,
      wins: wins.map((w) => ({ ...w })),
      lookups,
      lines,
    });

  push('start', [0]);
  for (x = 0; x <= N; x++) {
    seen = [];
    take = -1;
    push('position', [0, 1]);
    for (take of takesFrom(rule, S, x)) {
      const v = /** @type {number} */ (g[x - take]);
      lookups++;
      if (!seen.includes(v)) seen.push(v);
      push('look', [2, 3]);
    }
    take = -1;
    g[x] = mex(seen);
    push('mex', [4]);
  }
  x = -1;
  seen = [];
  const values = /** @type {number[]} */ (g);
  for (pile = 0; pile < piles.length; pile++) {
    xor ^= values[piles[pile]];
    push('pile', pile === 0 ? [5, 6, 7] : [6, 7]);
  }
  pile = -1;
  wins = winningMoves(piles, rule, S, values);
  push('done', xor !== 0 ? [8] : [9]);
  return frames;
}

/** @type {Record<'classic'|'balanced'|'subtraction'|'big', { piles: number[], rule: GameRule, moves: number[] }>} */
export const GAME_PRESETS = {
  classic: { piles: [3, 4, 5], rule: 'nim', moves: [1, 2, 3] },
  balanced: { piles: [1, 2, 3], rule: 'nim', moves: [1, 2, 3] },
  subtraction: { piles: [7, 9, 12], rule: 'subtraction', moves: [1, 3, 4] },
  big: { piles: [15, 11, 6, 9, 13], rule: 'nim', moves: [1, 2, 3] },
};
