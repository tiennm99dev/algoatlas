import { describe, expect, it } from 'vitest';
import { vi as m } from '$lib/lessons/practice-intractability/copy.vi.js';
import {
  BINS,
  CARDS,
  HAND_SIZE,
  START_HAND,
  binOf,
  classifyPseudocode,
  dealHand,
  sortTrace,
} from './practice-intractability.js';

/** @typedef {import('./practice-intractability.js').SortFrame} SortFrame */
/** @typedef {import('./practice-intractability.js').Bin} Bin */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {string[]} hand @param {(Bin|'')[]} answers */
const last = (hand, answers) => /** @type {SortFrame} */ (sortTrace(hand, answers).at(-1));

describe('card sort check', () => {
  it('scores a perfect sort, a blank sort and a mixed one', () => {
    const perfect = START_HAND.map(binOf);
    expect(last(START_HAND, perfect)).toMatchObject({ right: 8, wrong: 0, unsorted: 0 });
    expect(last(START_HAND, [])).toMatchObject({ right: 0, wrong: 0, unsorted: 8 });
    /** @type {(Bin|'')[]} */
    const mixed = ['p', 'p', 'p', 'npc', 'npc', 'npc', '', 'p'];
    expect(last(START_HAND, mixed)).toMatchObject({ right: 5, wrong: 2, unsorted: 1 });
  });

  it('counts match an independent tally on random answers', () => {
    const rand = seeded(6);
    for (let t = 0; t < 50; t++) {
      const hand = dealHand(rand);
      /** @type {(Bin|'')[]} */
      const answers = hand.map(
        () => /** @type {(Bin|'')[]} */ (['', ...BINS])[Math.floor(rand() * 4)],
      );
      const f = last(hand, answers);
      const right = hand.filter((k, i) => answers[i] === binOf(k)).length;
      const blank = answers.filter((a) => a === '').length;
      expect(f.right).toBe(right);
      expect(f.unsorted).toBe(blank);
      expect(f.wrong).toBe(hand.length - right - blank);
      expect(f.revealed).toBe(hand.length);
    }
  });

  it('reveals one card per step, in hand order', () => {
    const frames = sortTrace(START_HAND, []);
    expect(frames).toHaveLength(START_HAND.length + 2);
    frames.slice(1, -1).forEach((f, i) => {
      expect(f.card).toBe(i);
      expect(f.revealed).toBe(i + 1);
    });
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('deals distinct cards with every bin present', () => {
    const rand = seeded(12);
    for (let t = 0; t < 40; t++) {
      const hand = dealHand(rand);
      expect(hand).toHaveLength(HAND_SIZE);
      expect(new Set(hand).size).toBe(HAND_SIZE);
      for (const b of BINS) expect(hand.some((k) => binOf(k) === b)).toBe(true);
    }
  });

  it('has copy for every card and a fair spread of bins', () => {
    for (const c of CARDS) expect(m.cards[c.key]).toBeDefined();
    expect(Object.keys(m.cards).sort()).toEqual(CARDS.map((c) => c.key).sort());
    for (const b of BINS) expect(CARDS.filter((c) => c.bin === b).length).toBeGreaterThanOrEqual(5);
  });

  it('keeps frames independent', () => {
    const frames = sortTrace(START_HAND, ['p']);
    frames[1].answers[0] = 'npc';
    frames[1].hand[0] = 'x';
    expect(frames[2].answers[0]).toBe('p');
    expect(frames[2].hand[0]).toBe('eulerCircuit');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(sortTrace(START_HAND, []).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(classifyPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the cards', () => {
    const q0 = /** @type {{answer: number}} */ (m.practice[0]);
    expect(START_HAND.filter((k) => binOf(k) === 'p')).toHaveLength(q0.answer);
    const q1 = /** @type {{options: string[], answers: number[]}} */ (m.practice[1]);
    const approx = START_HAND.filter((k) => binOf(k) === 'approx').map((k) => m.cards[k].name);
    expect(q1.answers.map((i) => q1.options[i])).toEqual(approx);
  });
});
