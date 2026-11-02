/** The lesson's fixed first inputs, and the query sets the Mo panel can load. */

/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockOp} BlockOp */

export const BLOCK_START = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];

/** @type {BlockOp[]} */
export const BLOCK_START_OPS = [
  { type: 'query', l: 2, r: 13 },
  { type: 'set', i: 5, x: 0 },
  { type: 'query', l: 2, r: 13 },
];

const MO_VALUES = [1, 3, 1, 2, 4, 3, 5, 1, 2, 2, 6, 3, 7, 1, 7, 5];

export const MO_PRESETS = {
  zigzag: {
    values: MO_VALUES,
    queries: [
      { l: 0, r: 3 },
      { l: 12, r: 15 },
      { l: 1, r: 4 },
      { l: 13, r: 14 },
      { l: 2, r: 5 },
      { l: 11, r: 15 },
    ],
  },
  nested: {
    values: MO_VALUES,
    queries: [
      { l: 0, r: 15 },
      { l: 1, r: 14 },
      { l: 5, r: 10 },
      { l: 6, r: 9 },
      { l: 2, r: 13 },
    ],
  },
};
