// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/grid-path-dp/copy.en.js';
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
const tables = () =>
  [...document.querySelectorAll('svg')].filter((s) => s.querySelector('[data-cell]'));
/** @param {number} which @param {number} r @param {number} c */
const cell = (which, r, c) =>
  /** @type {Element} */ (tables()[which].querySelector(`[data-cell="${r}-${c}"]`));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('grid and path DP lesson', () => {
  it('fills the count table and steps through a cell', () => {
    render();
    expect(narration()).toBe(
      'Count the paths from the top-left cell to the bottom-right cell of this 4 × 5 grid, moving only right or down.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Base case: one path reaches the start, the empty one. P[0][0] = 1.');
    click(button('Next step'));
    expect(narration()).toBe('The first row has only the cell to the left: P[0][1] = 1.');
    expect(arrows()).toBe(1);
    click(button('Last step'));
    expect(byTest('answer')).toBe('7');
    expect(byTest('filled')).toBe('20 / 20');
    expect(byTest('open')).toBe('35');
    expect(narration()).toBe('7 paths reach the goal.');
  });

  it('adds a wall by clicking the grid and shows the new count at once', () => {
    render();
    commit(field('select[name="preset"]'), 'open');
    click(cell(0, 1, 3));
    expect(field('select[name="preset"]').value).toBe('');
    expect(byTest('answer')).toBe('12');
    expect(cell(0, 1, 3).getAttribute('aria-label')).toBe('Cell (1, 3): wall');
    click(buttonByText(m.resetGrid));
    click(button('Last step'));
    expect(byTest('answer')).toBe('28');
  });

  it('edits the grid with the keyboard', () => {
    render();
    commit(field('select[name="preset"]'), 'pillar');
    cell(0, 1, 1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(byTest('answer')).toBe('6');
  });

  it('jumps to a cell of the table and shows its sum', () => {
    render();
    click(button('Last step'));
    click(cell(1, 3, 4));
    expect(byTest('sums')).toBe('above 3 + left 4 = 7');
    expect(narration()).toBe('A path arrives from above or from the left: P[3][4] = 3 + 4 = 7.');
    expect(arrows()).toBe(2);
    click(cell(1, 1, 1));
    expect(narration()).toBe('(1, 1) is a wall, so no path passes through it: P[1][1] = 0.');
  });

  it('finds the cheapest path, the greedy cost and an edited cost', () => {
    render();
    click(field('input[name="mode"][value="min"]'));
    commit(field('select[name="preset"]'), 'costs');
    click(button('Last step'));
    expect(byTest('answer')).toBe('7');
    expect(narration()).toBe('The cheapest path costs 7 and visits 5 cells.');
    commit(field('select[name="preset"]'), 'trap');
    click(button('Last step'));
    expect(byTest('answer')).toBe('9');
    expect(byTest('greedy')).toBe('14');
    click(field('input[name="tool"][value="cost"]'));
    click(cell(0, 2, 0));
    expect(cell(0, 2, 0).getAttribute('aria-label')).toContain('cost 2');
    expect(byTest('answer')).toBe('10');
  });

  it('reports a blocked goal', () => {
    render();
    commit(field('select[name="preset"]'), 'costs');
    click(field('input[name="mode"][value="min"]'));
    click(cell(0, 2, 2));
    expect(byTest('answer')).toBe('∞');
    expect(narration()).toBe(
      'No path reaches the goal: walls block every route, so the cost stays ∞.',
    );
    click(field('input[name="mode"][value="count"]'));
    click(button('Last step'));
    expect(byTest('answer')).toBe('0');
    expect(narration()).toBe('No path reaches the goal: walls block every route.');
  });

  it('resizes the grid and refuses a bad size', () => {
    render();
    commit(field('input[name="rows"]'), '2');
    commit(field('input[name="cols"]'), '2');
    click(button('Last step'));
    expect(byTest('filled')).toBe('4 / 4');
    expect(byTest('open')).toBe('2');
    commit(field('input[name="rows"]'), '9');
    expect(narration()).toBe('Rows and columns must be whole numbers from 1 to 8.');
    expect(field('input[name="rows"]').value).toBe('2');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Base case');
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
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
