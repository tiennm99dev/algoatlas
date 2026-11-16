// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  GAME_PRESETS,
  MAX_MOVE,
  MAX_MOVES,
  MAX_PILE,
  MAX_PILES,
  MIN_PILES,
  grundyTrace,
  grundyValues,
  nimSum,
  winningMoves,
} from '$lib/algo-engine/sprague-grundy.js';
import { en as m } from '$lib/lessons/sprague-grundy/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const toLast = () => click(button('Last step'));
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Next step'));
};
/** @param {string} value */
function pickRule(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="rule"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}
const stones = () => document.querySelectorAll('[data-testid="board"] button').length;

describe('Nim and Sprague-Grundy lesson', () => {
  it('steps through mex and the XOR of the piles', () => {
    render();
    expect(narration()).toContain('3 piles: 3, 4, 5');
    next(1);
    expect(narration()).toContain('A pile of 0 stones has no moves');
    next(1);
    expect(narration()).toContain('The smallest whole number not in { } is 0, so g(0) = 0.');
    next(2);
    expect(narration()).toContain('Taking 1 leaves 0 stones, with g(0) = 0');
    expect(stat('seen')).toBe('seen = { 0 }');
    toLast();
    expect(narration()).toContain('X = 2 ≠ 0, so the player to move wins');
    expect(narration()).toContain('take 2 stones from pile 1');
    expect(stat('lookups')).toBe('15');
    expect(stat('positions')).toBe('6');
    expect(stat('verdict')).toBe(m.verdicts.win);
  });

  it('plays against the computer, which answers with a winning move', () => {
    render();
    expect(stat('xor')).toBe('2');
    expect(stones()).toBe(12);
    click(buttonByText(m.hintButton));
    expect(stat('hint')).toBe(m.hint([{ pile: 0, take: 2 }]));
    // Take 2 from the pile of 3 by clicking its second stone: X becomes 0, the computer must
    // break it and we can restore it.
    click(button('Take 2 stones from pile 1'));
    expect(stat('status')).toMatch(/^You take 2 stones from pile 1\. The computer takes/);
    expect(document.querySelector('[data-testid="hint"]')).toBeNull();
    expect(Number(stat('xor'))).not.toBe(0);
    click(buttonByText(m.restart));
    expect(stones()).toBe(12);
    expect(stat('status')).toBe(m.yourTurn(2));
  });

  it('wins a whole game by always following the hint', () => {
    render();
    for (let turn = 0; turn < 20; turn++) {
      if (stat('status')?.includes('You win')) break;
      const board = [...document.querySelectorAll('[data-testid="board"] li')].map(
        (li) => li.querySelectorAll('button').length,
      );
      const g = grundyValues('nim', [], 5);
      const [w] = winningMoves(board, 'nim', [], g);
      click(button(`Take ${w.take} ${w.take === 1 ? 'stone' : 'stones'} from pile ${w.pile + 1}`));
    }
    expect(stat('status')).toContain('You win!');
    click(buttonByText(m.takeButton));
    expect(stat('status')).toBe(m.over);
  });

  it('loses from a balanced position, and refuses illegal moves', () => {
    render();
    commit(field('preset'), 'subtraction');
    expect(stat('xor')).toBe(
      String(nimSum([7, 9, 12], grundyValues('subtraction', [1, 3, 4], 12))),
    );
    click(button('Take 2 stones from pile 1'));
    expect(stat('status')).toBe(m.illegal(0, [1, 3, 4]));
    commit(field('preset'), 'balanced');
    commit(field('take'), '1');
    commit(field('pile'), '2');
    click(buttonByText(m.takeButton));
    expect(stat('status')).toMatch(/^You take 1 stone from pile 3\. The computer takes/);
    expect(stat('xor')).toBe('0');
    commit(field('take'), '0');
    expect(stat('status')).toBe(m.takeError(MAX_PILE));
    expect(field('take').value).toBe('1');
  });

  it('pressing Enter in the take field makes the move', () => {
    render();
    const input = field('take');
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(stat('status')).toMatch(/^You take 2 stones from pile 1\./);
  });

  it('rebuilds for typed piles, a new rule and new takes, and refuses bad input', () => {
    render();
    commit(field('piles'), '1 2 3');
    toLast();
    expect(narration()).toContain('X = 0, so the player to move loses');
    expect(stat('verdict')).toBe(m.verdicts.lose);
    pickRule('subtraction');
    commit(field('moves'), '2');
    toLast();
    // Take 2: g = 0 0 1 1, so X = g(1) xor g(2) xor g(3) = 0 xor 1 xor 1 = 0.
    expect(stat('trace-xor')).toBe('0');
    commit(field('moves'), '2 2');
    expect(narration()).toBe(m.movesError(MAX_MOVES, MAX_MOVE));
    expect(field('moves').value).toBe('2');
    commit(field('piles'), '1 2 3 4 5 6');
    expect(narration()).toBe(m.pilesError(MIN_PILES, MAX_PILES, MAX_PILE));
    expect(field('piles').value).toBe('1, 2, 3');
    pickRule('nim');
    expect(document.querySelector('[name="moves"]')).toBeNull();
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const classic = grundyTrace(GAME_PRESETS.classic.piles, 'nim', []).at(-1);
    expect(/** @type {any} */ (m.practice[0]).answer).toBe(classic?.xor);
    expect(classic?.wins).toEqual([{ pile: 0, take: /** @type {any} */ (m.practice[1]).answer }]);
    expect(nimSum([1, 2, 3], grundyValues('nim', [], 3))).toBe(0);
    const g = grundyValues('subtraction', [1, 3, 4], 9);
    expect(/** @type {any} */ (m.practice[3]).answer).toBe(g[5]);
    const sizes = [2, 3, 6, 7, 9];
    const losing = sizes.map((h, i) => (g[h] === 0 ? i : -1)).filter((i) => i >= 0);
    expect(/** @type {any} */ (m.practice[4]).answers).toEqual(losing);
  });
});
