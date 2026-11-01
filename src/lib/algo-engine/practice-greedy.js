/**
 * Three greedy puzzles, each with a rule that is right and a rule that sounds right but is not.
 * The trace steps one rule through one input; `testRule` runs a rule on many random inputs
 * against a brute-force answer and returns the first counterexample it meets.
 *
 * - Jump game (`reach`): a[i] is the longest jump from cell i; can you reach the last cell?
 *   Right: keep the farthest reachable cell while scanning. Wrong: always take the longest jump.
 * - Fewest jumps (`jumps`): the fewest jumps to the last cell, or none when it is unreachable.
 *   Right: jump only when the current jump's range is used up, to the farthest cell any cell in
 *   it reaches (a breadth-first search by layers). Wrong: always take the longest jump.
 * - Boats (`boats`): people with weights 1..9, boats that carry at most two and at most
 *   BOAT_LIMIT in all; the fewest boats. Right: send the heaviest, with the lightest when they
 *   fit. Wrong: pair the two lightest whenever they fit.
 */

export const MIN_N = 2;
export const MAX_N = 12;
export const BOAT_LIMIT = 10;
export const TRIALS = 200;

/** @typedef {'reach' | 'jumps' | 'boats'} Puzzle */
/** @typedef {'right' | 'wrong'} RuleKind */

export const PUZZLES = /** @type {Puzzle[]} */ (['reach', 'jumps', 'boats']);
export const RULE_KINDS = /** @type {RuleKind[]} */ (['right', 'wrong']);

/**
 * @typedef {object} PuzzleFrame
 * @property {'start'|'sort'|'scan'|'jump'|'stuck'|'boat'|'done'} kind
 * @property {Puzzle} puzzle
 * @property {RuleKind} rule
 * @property {number[]} values  The input; sorted ascending from the 'sort' frame on (boats).
 * @property {number} i  Current cell, -1 when none.
 * @property {number} reach  Farthest reachable cell (jump game) or farthest next cell (fewest jumps); -1 when unused.
 * @property {number} end  Fewest jumps, right rule: last cell of the current jump's range; -1 when unused.
 * @property {number[]} path  Longest-jump rules: cells landed on so far, from 0.
 * @property {number} count  Jumps or boats so far.
 * @property {number[][]} boats  Boats so far, each a list of indices into `values`.
 * @property {number} result  On 'done': the rule's answer (jump game 1 or 0, fewest jumps -1 when unreachable, boats a count).
 * @property {number[]} lines
 */

/** @type {Record<Puzzle, Record<RuleKind, string[]>>} */
export const PSEUDOCODE = {
  reach: {
    right: [
      'canReach(a):',
      '  reach = 0  // the farthest cell known to be reachable',
      '  for i = 0 to n − 1:',
      '    if i > reach: return false  // no earlier cell reaches i',
      '    reach = max(reach, i + a[i])',
      '  return true',
    ],
    wrong: [
      'canReachByLongestJump(a):',
      '  i = 0',
      '  while i < n − 1:',
      '    if a[i] = 0: return false  // stuck on a zero',
      '    i = min(i + a[i], n − 1)  // always the longest jump',
      '  return true',
    ],
  },
  jumps: {
    right: [
      'fewestJumps(a):',
      '  jumps = 0; end = 0; farthest = 0',
      '  for i = 0 to n − 2:',
      '    farthest = max(farthest, i + a[i])',
      '    if i = end:  // this jump’s range is used up',
      '      if farthest ≤ i: return unreachable',
      '      jumps = jumps + 1; end = farthest',
      '  return jumps',
    ],
    wrong: [
      'fewestJumpsByLongestJump(a):',
      '  i = 0; jumps = 0',
      '  while i < n − 1:',
      '    if a[i] = 0: return unreachable',
      '    i = min(i + a[i], n − 1); jumps = jumps + 1',
      '  return jumps',
    ],
  },
  boats: {
    right: [
      'boats(w):  // at most two per boat, total ≤ limit',
      '  sort w ascending; lo = 0; hi = n − 1; boats = 0',
      '  while lo ≤ hi:',
      '    if lo < hi and w[lo] + w[hi] ≤ limit:',
      '      lo = lo + 1  // the lightest rides with the heaviest',
      '    hi = hi − 1; boats = boats + 1  // the heaviest leaves',
      '  return boats',
    ],
    wrong: [
      'boatsByTwoLightest(w):',
      '  sort w ascending; lo = 0; boats = 0',
      '  while lo < n:',
      '    if lo + 1 < n and w[lo] + w[lo + 1] ≤ limit:',
      '      lo = lo + 2  // the two lightest share a boat',
      '    else: lo = lo + 1  // the lightest goes alone',
      '    boats = boats + 1',
      '  return boats',
    ],
  },
};

/**
 * Reads whole numbers separated by commas or spaces: jump lengths 0..9, or weights 1..9.
 * @param {string} text
 * @param {Puzzle} puzzle
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseValues(text, puzzle) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  const min = puzzle === 'boats' ? 1 : 0;
  if (values.some((v) => v < min || v > 9)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * The right answer by brute force: depth-first search over every jump, a breadth-first search
 * for the fewest jumps, or every way to pair people for the boats.
 * @param {Puzzle} puzzle
 * @param {number[]} a
 * @returns {number}
 */
export function bruteAnswer(puzzle, a) {
  const n = a.length;
  if (puzzle === 'boats') {
    /** @param {number[]} rest @returns {number} */
    const best = (rest) => {
      if (rest.length === 0) return 0;
      const [first, ...others] = rest;
      let fewest = 1 + best(others);
      others.forEach((w, k) => {
        if (first + w <= BOAT_LIMIT) {
          fewest = Math.min(fewest, 1 + best(others.filter((_, j) => j !== k)));
        }
      });
      return fewest;
    };
    return best(a);
  }
  // Fewest jumps from cell 0 to every cell, trying every jump length.
  const dist = Array(n).fill(Infinity);
  dist[0] = 0;
  const queue = [0];
  while (queue.length) {
    const i = /** @type {number} */ (queue.shift());
    for (let len = 1; len <= a[i] && i + len < n; len++) {
      if (dist[i + len] === Infinity) {
        dist[i + len] = dist[i] + 1;
        queue.push(i + len);
      }
    }
  }
  const last = dist[n - 1];
  if (puzzle === 'reach') return last === Infinity ? 0 : 1;
  return last === Infinity ? -1 : last;
}

/**
 * @param {Puzzle} puzzle
 * @param {RuleKind} rule
 * @param {number[]} input
 * @returns {PuzzleFrame[]}
 */
export function puzzleTrace(puzzle, rule, input) {
  let values = input.slice();
  const n = values.length;
  /** @type {PuzzleFrame[]} */
  const frames = [];
  let reach = -1;
  let end = -1;
  let count = 0;
  /** @type {number[]} */
  const path = [];
  /** @type {number[][]} */
  const boats = [];

  /** @param {Pick<PuzzleFrame, 'kind'|'lines'> & Partial<PuzzleFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      result: 0,
      ...f,
      puzzle,
      rule,
      values: values.slice(),
      reach,
      end,
      path: path.slice(),
      count,
      boats: boats.map((b) => b.slice()),
    });

  /** @param {number} result @param {number[]} lines @param {number} [i] */
  const finish = (result, lines, i = -1) => {
    push({ kind: 'done', lines, result, i });
    return frames;
  };

  if (puzzle === 'boats') {
    push({ kind: 'start', lines: [0] });
    values = values.slice().sort((x, y) => x - y);
    push({ kind: 'sort', lines: [1] });
    if (rule === 'right') {
      let lo = 0;
      let hi = n - 1;
      while (lo <= hi) {
        const pair = lo < hi && values[lo] + values[hi] <= BOAT_LIMIT;
        boats.push(pair ? [hi, lo] : [hi]);
        if (pair) lo++;
        hi--;
        count++;
        push({ kind: 'boat', lines: pair ? [2, 3, 4, 5] : [2, 3, 5] });
      }
      return finish(count, [6]);
    }
    let lo = 0;
    while (lo < n) {
      const pair = lo + 1 < n && values[lo] + values[lo + 1] <= BOAT_LIMIT;
      boats.push(pair ? [lo, lo + 1] : [lo]);
      lo += pair ? 2 : 1;
      count++;
      push({ kind: 'boat', lines: pair ? [2, 3, 4, 6] : [2, 3, 5, 6] });
    }
    return finish(count, [7]);
  }

  const none = puzzle === 'reach' ? 0 : -1;
  if (rule === 'wrong') {
    let i = 0;
    path.push(0);
    push({ kind: 'start', lines: [0, 1], i });
    while (i < n - 1) {
      if (values[i] === 0) {
        push({ kind: 'stuck', lines: [2, 3], i });
        return finish(none, [3], i);
      }
      i = Math.min(i + values[i], n - 1);
      path.push(i);
      count++;
      push({ kind: 'jump', lines: [2, 4], i });
    }
    return finish(puzzle === 'reach' ? 1 : count, [5], i);
  }

  if (puzzle === 'reach') {
    reach = 0;
    push({ kind: 'start', lines: [0, 1] });
    for (let i = 0; i < n; i++) {
      if (i > reach) {
        push({ kind: 'stuck', lines: [2, 3], i });
        return finish(0, [3], i);
      }
      reach = Math.max(reach, i + values[i]);
      push({ kind: 'scan', lines: [2, 4], i });
    }
    return finish(1, [5]);
  }

  reach = 0;
  end = 0;
  push({ kind: 'start', lines: [0, 1] });
  for (let i = 0; i < n - 1; i++) {
    reach = Math.max(reach, i + values[i]);
    push({ kind: 'scan', lines: [2, 3], i });
    if (i === end) {
      if (reach <= i) {
        push({ kind: 'stuck', lines: [4, 5], i });
        return finish(-1, [5], i);
      }
      count++;
      end = reach;
      push({ kind: 'jump', lines: [4, 6], i });
    }
  }
  return finish(count, [7]);
}

/** The rule's answer without keeping the frames. @param {Puzzle} puzzle @param {RuleKind} rule @param {number[]} a */
export const ruleAnswer = (puzzle, rule, a) =>
  /** @type {PuzzleFrame} */ (puzzleTrace(puzzle, rule, a).at(-1)).result;

/**
 * A random input for a puzzle: short arrays of small jumps, which trip a wrong rule often.
 * @param {Puzzle} puzzle @param {() => number} rand
 */
export function randomCase(puzzle, rand) {
  const n = MIN_N + Math.floor(rand() * 7);
  return Array.from({ length: n }, () =>
    puzzle === 'boats' ? 1 + Math.floor(rand() * 9) : Math.floor(rand() * 4),
  );
}

/**
 * @typedef {object} TestReport
 * @property {number} tested
 * @property {number} failed
 * @property {{values: number[], got: number, want: number} | null} first  The shortest failing case.
 */

/**
 * Runs a rule on `trials` random inputs and compares it with the brute-force answer.
 * @param {Puzzle} puzzle @param {RuleKind} rule @param {() => number} rand @param {number} [trials]
 * @returns {TestReport}
 */
export function testRule(puzzle, rule, rand, trials = TRIALS) {
  let failed = 0;
  /** @type {TestReport['first']} */
  let first = null;
  for (let t = 0; t < trials; t++) {
    const values = randomCase(puzzle, rand);
    const got = ruleAnswer(puzzle, rule, values);
    const want = bruteAnswer(puzzle, values);
    if (got === want) continue;
    failed++;
    if (!first || values.length < first.values.length) first = { values, got, want };
  }
  return { tested: trials, failed, first };
}
