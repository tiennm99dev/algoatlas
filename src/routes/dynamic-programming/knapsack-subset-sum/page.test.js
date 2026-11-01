// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  KNAP_PRESETS,
  MAX_CAPACITY,
  greedyValue,
  knapTrace,
} from '$lib/algo-engine/knapsack-subset-sum.js';
import { en as m } from '$lib/lessons/knapsack-subset-sum/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
const arrows = () => document.querySelectorAll('line[marker-end]').length;
/** @param {number} r @param {number} c */
const cell = (r, c) => /** @type {Element} */ (document.querySelector(`[data-cell="${r}-${c}"]`));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('knapsack and subset sum lesson', () => {
  it('fills the table and names the items', () => {
    render();
    expect(narration()).toBe(
      'Pack 4 items into capacity 7 for the most value. Each item is taken whole, at most once.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Base case: row 0 has no items, so every capacity holds value 0.');
    click(button('Last step'));
    expect(byTest('answer')).toBe('9');
    expect(byTest('filled')).toBe('40 / 40');
    expect(narration()).toBe('The best value is 9: item 2, item 3.');
    expect(byTest('greedy')).toBe('8');
  });

  it('reads a take or skip choice from a slider and from a cell', () => {
    render();
    commit(field('input[name="slider-capacity"]'), '6');
    commit(field('input[name="slider-item"]'), '3');
    expect(byTest('slider-cell')).toBe('Cell (3, 6)');
    expect(byTest('choice')).toContain('Skip: K[2][6]');
    expect(byTest('choice')).toContain('Take: K[2][2] + 5');
    expect(narration()).toBe('Skip → 5, take → 6. Take item 3: K[3][6] = 6.');
    expect(arrows()).toBe(2);
    click(cell(1, 0));
    expect(narration()).toBe(
      'Item 1 weighs 1, more than c = 0: it does not fit, so skip it. K[1][0] = 0.',
    );
    expect(arrows()).toBe(1);
    expect(byTest('choice')).toContain('does not fit');
  });

  it('resets the sliders when a smaller example loads', () => {
    render();
    commit(field('input[name="slider-capacity"]'), '7');
    commit(field('input[name="slider-item"]'), '4');
    commit(field('select[name="preset"]'), 'trap');
    expect(byTest('slider-cell')).toBe('Cell (0, 0)');
    commit(field('input[name="slider-capacity"]'), '5');
    commit(field('input[name="slider-item"]'), '3');
    expect(narration()).toBe('Skip → 16, take → 22. Take item 3: K[3][5] = 22.');
  });

  it('picks a cell with the keyboard', () => {
    render();
    const first = /** @type {SVGElement} */ (cell(0, 0));
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    const below = cell(1, 0);
    below.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toContain('K[1][0] = 0.');
  });

  it('shows the one-row layouts and the wrong direction', () => {
    render();
    commit(field('select[name="preset"]'), 'single');
    expect(field('input[name="items"]').value).toBe('2:3');
    click(field('input[name="layout"][value="row-down"]'));
    click(button('Last step'));
    expect(byTest('answer')).toBe('3');
    expect(byTest('memory')).toBe('7');
    expect(document.querySelector('input[name="slider-item"]')).toBeNull();
    click(field('input[name="layout"][value="row-up"]'));
    click(button('Last step'));
    expect(byTest('answer')).toBe('9');
    expect(byTest('correct')).toBe('3');
    expect(byTest('reuses')).toBe('3');
    expect(narration()).toContain('but the true 0/1 answer is 3');
  });

  it('switches to subset sum and answers yes and no', () => {
    render();
    click(field('input[name="problem"][value="subset"]'));
    expect(field('input[name="items"]').value).toBe('3, 34, 4, 12, 5, 2');
    click(button('Last step'));
    expect(byTest('answer')).toBe('Yes');
    commit(field('select[name="preset"]'), 'even');
    click(button('Last step'));
    expect(byTest('answer')).toBe('No');
    expect(narration()).toBe('No subset weighs exactly 7.');
  });

  it('reads typed items and refuses bad ones', () => {
    render();
    commit(field('input[name="items"]'), '2:3, 3:4');
    commit(field('input[name="capacity"]'), '5');
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Last step'));
    expect(byTest('answer')).toBe('7');
    commit(field('input[name="items"]'), 'oops');
    expect(narration()).toBe('Write each item as weight:value, for example 2:3, 3:4.');
    expect(field('input[name="items"]').value).toBe('2:3, 3:4');
    commit(field('input[name="capacity"]'), '99');
    expect(narration()).toBe('The capacity must be a whole number from 0 to 15.');
    expect(field('input[name="capacity"]').value).toBe('5');
    expect(byTest('pseudo-note')).toContain('W = 5 takes 3 bits');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Base case: row 0 has no items, so every capacity holds value 0.');
  });

  it('states the pseudo-polynomial note for the target and for an empty capacity', () => {
    render();
    commit(field('input[name="capacity"]'), '0');
    expect(byTest('pseudo-note')).toContain('W = 0 takes 1 bit');
    expect(byTest('pseudo-note')).not.toContain('One more bit');
    click(/** @type {Element} */ (document.querySelector('input[name="problem"][value="subset"]')));
    expect(byTest('pseudo-note')).toContain('T = 9 takes 4 bits');
    expect(byTest('pseudo-note')).toContain('One more bit, T = 19');
  });

  it('moves the slider readout when a cell of row 0 is clicked', () => {
    render();
    click(cell(0, 3));
    expect(byTest('slider-cell')).toBe(m.sliderValue(0, 3));
    expect(field('input[name="slider-capacity"]').value).toBe('3');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    const [small, trap, single] = KNAP_PRESETS.knapsack;
    const table = knapTrace('knapsack', 'table', small.items, small.capacity).at(-1);
    expect(table?.result).toBe(stored(0));
    expect(table?.shown[3][6]).toBe(stored(1));
    expect(7 * (MAX_CAPACITY + 1)).toBe(stored(2));
    const upward = knapTrace('knapsack', 'row-up', single.items, single.capacity).at(-1);
    expect(upward?.result).toBe(stored(4));
    const best = knapTrace('knapsack', 'table', trap.items, trap.capacity).at(-1);
    expect(Number(best?.result) - greedyValue(trap.items, trap.capacity)).toBe(stored(5));
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '8';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
