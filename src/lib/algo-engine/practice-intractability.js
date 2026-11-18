/**
 * Sorting problem cards into three bins, and checking the sort one card at a time.
 *
 * - `p`: solvable exactly in polynomial time.
 * - `npc`: NP-complete, and with no constant-factor approximation unless P = NP (or a yes/no
 *   question, where approximation does not apply).
 * - `approx`: NP-hard to solve exactly, but a polynomial algorithm stays within a constant
 *   factor of the optimum.
 *
 * Each card also names how it is classified: the algorithm that solves it, or the known
 * NP-complete problem that reduces to it.
 */

/** @typedef {'p'|'npc'|'approx'} Bin */

export const BINS = /** @type {Bin[]} */ (['p', 'npc', 'approx']);

/**
 * @typedef {object} Card
 * @property {string} key
 * @property {Bin} bin
 */

/** Every card, in a fixed order. */
/** @type {Card[]} */
export const CARDS = [
  { key: 'eulerCircuit', bin: 'p' },
  { key: 'hamCycle', bin: 'npc' },
  { key: 'twoSat', bin: 'p' },
  { key: 'threeSat', bin: 'npc' },
  { key: 'metricTsp', bin: 'approx' },
  { key: 'generalTsp', bin: 'npc' },
  { key: 'vertexCover', bin: 'approx' },
  { key: 'dagLongestPath', bin: 'p' },
  { key: 'longestPath', bin: 'npc' },
  { key: 'shortestPath', bin: 'p' },
  { key: 'twoColouring', bin: 'p' },
  { key: 'threeColouring', bin: 'npc' },
  { key: 'maxClique', bin: 'npc' },
  { key: 'knapsack', bin: 'approx' },
  { key: 'fractionalKnapsack', bin: 'p' },
  { key: 'binPacking', bin: 'approx' },
  { key: 'maxCut', bin: 'approx' },
  { key: 'matching', bin: 'p' },
];

/** The first hand: easy and hard look-alikes side by side. */
export const START_HAND = [
  'eulerCircuit',
  'hamCycle',
  'twoSat',
  'threeSat',
  'metricTsp',
  'generalTsp',
  'vertexCover',
  'dagLongestPath',
];

export const HAND_SIZE = START_HAND.length;

export const classifyPseudocode = [
  'classify(problem):',
  '  if có thuật toán đa thức đã biết giải chính xác: Đa thức',
  '  quy dẫn một bài NP-đầy đủ đã biết về problem:',
  '    if có thuật toán đa thức đạt trong hệ số hằng: Xấp xỉ được',
  '    else: NP-đầy đủ',
];

/** Pseudocode lines that justify each bin. @type {Record<Bin, number[]>} */
const LINES = { p: [0, 1], approx: [0, 2, 3], npc: [0, 2, 4] };

/** @param {string} key */
export const binOf = (key) => /** @type {Card} */ (CARDS.find((c) => c.key === key)).bin;

/**
 * @typedef {object} SortFrame
 * @property {'start'|'right'|'wrong'|'unsorted'|'done'} kind
 * @property {string[]} hand
 * @property {(Bin|'')[]} answers  The learner’s bin per card, '' when not sorted.
 * @property {number} card  Index into `hand` of the card checked now, -1 when none.
 * @property {number} revealed  Cards checked so far, from the start of the hand.
 * @property {number} right
 * @property {number} wrong
 * @property {number} unsorted
 * @property {number[]} lines
 */

/**
 * Checks the learner’s sort card by card.
 * @param {string[]} hand  Card keys.
 * @param {(Bin|'')[]} answers  One per card.
 * @returns {SortFrame[]}
 */
export function sortTrace(hand, answers) {
  /** @type {SortFrame[]} */
  const frames = [];
  let right = 0;
  let wrong = 0;
  let unsorted = 0;
  let revealed = 0;
  const given = hand.map((_, i) => answers[i] ?? '');

  /** @param {SortFrame['kind']} kind @param {number} card @param {number[]} lines */
  function record(kind, card, lines) {
    frames.push({
      kind,
      hand: hand.slice(),
      answers: given.slice(),
      card,
      revealed,
      right,
      wrong,
      unsorted,
      lines,
    });
  }

  record('start', -1, [0]);
  hand.forEach((key, i) => {
    revealed++;
    const want = binOf(key);
    if (given[i] === '') {
      unsorted++;
      record('unsorted', i, LINES[want]);
    } else if (given[i] === want) {
      right++;
      record('right', i, LINES[want]);
    } else {
      wrong++;
      record('wrong', i, LINES[want]);
    }
  });
  record('done', -1, []);
  return frames;
}

/**
 * A new hand of HAND_SIZE distinct cards, in pool order, with at least one card of each bin.
 * @param {() => number} [rand]
 * @returns {string[]}
 */
export function dealHand(rand = Math.random) {
  for (;;) {
    const keys = CARDS.map((c) => c.key);
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    const picked = new Set(keys.slice(0, HAND_SIZE));
    const hand = CARDS.map((c) => c.key).filter((k) => picked.has(k));
    if (BINS.every((b) => hand.some((k) => binOf(k) === b))) return hand;
  }
}
