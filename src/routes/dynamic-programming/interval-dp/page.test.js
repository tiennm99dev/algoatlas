// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { INTERVAL_PRESETS, intervalTrace, orderCount } from '$lib/algo-engine/interval-dp.js';
import { en as m } from '$lib/lessons/interval-dp/copy.en.js';
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

describe('interval DP lesson', () => {
  it('fills by length and rebuilds the matrix order', () => {
    render();
    expect(narration()).toBe(
      'Multiply 3 matrices with the fewest scalar multiplications. The product is the same in any order, but the work is not.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Length 1: one matrix needs no multiplication, so the diagonal is 0.');
    click(button('Next step'));
    expect(narration()).toContain('Length 2');
    click(button('Next step'));
    expect(narration()).toBe('Interval A1..A2: start at ∞ and try 1 split.');
    click(button('Next step'));
    expect(narration()).toBe(
      'Split after A1: 0 + 0 + 10·100·5 = 5000. The first option, so it is the best so far.',
    );
    expect(arrows()).toBe(2);
    click(button('Last step'));
    expect(byTest('answer')).toBe('7500');
    expect(byTest('baseline')).toBe('75000');
    expect(byTest('order')).toBe('((A1 A2) A3)');
    expect(byTest('tried')).toBe('4 / 4');
    expect(byTest('filled')).toBe('6 / 6');
    expect(byTest('orders')).toBe('2');
  });

  it('jumps to a cell by pointer and by keyboard', () => {
    render();
    click(cell(0, 1));
    expect(narration()).toBe('m[1][2] = 5000, with the best split after A1: A1 and A2.');
    const here = cell(1, 1);
    here.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    cell(1, 2).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toBe('m[2][3] = 25000, with the best split after A2: A2 and A3.');
    click(cell(2, 0));
    expect(narration()).toBe('m[2][3] = 25000, with the best split after A2: A2 and A3.');
  });

  it('switches to rod cutting and reads the pieces', () => {
    render();
    click(field('input[name="problem"][value="rod"]'));
    expect(field('input[name="input"]').value).toBe('1, 5, 8, 9');
    commit(field('select[name="preset"]'), 'eight');
    click(button('Next step'));
    expect(narration()).toBe(
      'Length 1: one unit cannot be cut, so each cell on the diagonal is its price, 1.',
    );
    click(button('Last step'));
    expect(byTest('answer')).toBe('22');
    expect(byTest('baseline')).toBe('20');
    expect(byTest('order')).toBe('2 + 6');
    expect(byTest('orders')).toBe('128');
    commit(field('select[name="preset"]'), 'whole');
    click(button('Last step'));
    expect(narration()).toBe('The best price: 9, with pieces 3.');
  });

  it('reads typed input and refuses bad lists', () => {
    render();
    commit(field('input[name="input"]'), '2, 3, 4');
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Last step'));
    expect(byTest('answer')).toBe('24');
    commit(field('input[name="input"]'), '5');
    expect(narration()).toBe('Type 2 to 8 dimensions: n matrices have n + 1.');
    expect(field('input[name="input"]').value).toBe('2, 3, 4');
    commit(field('input[name="input"]'), '2, 101');
    expect(narration()).toBe('Each dimension must be from 1 to 100.');
    commit(field('input[name="input"]'), 'a, b');
    expect(narration()).toBe('Write whole numbers separated by commas.');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Length 1');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    const [three, , six] = INTERVAL_PRESETS.matrix;
    expect(intervalTrace('matrix', three.input).at(-1)?.result).toBe(stored(0));
    const chain = intervalTrace('matrix', six.input).at(-1);
    expect(chain?.table[1][4]).toBe(stored(1));
    expect(chain?.tried).toBe(stored(2));
    expect(intervalTrace('rod', INTERVAL_PRESETS.rod[1].input).at(-1)?.result).toBe(stored(4));
    expect(orderCount('matrix', 6)).toBe(stored(6));
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '5375';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '7125';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
