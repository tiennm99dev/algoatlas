// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/min-cost-flow/copy.en.js';

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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {Element} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
/** @param {string} row @param {string} col */
const costField = (row, col) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.costAria(row, col)}"]`)
  );
/** Title of a table cell, by the start of its label. @param {string} start */
const cellTitle = (start) =>
  [...document.querySelectorAll('svg title')]
    .map((el) => el.textContent ?? '')
    .find((l) => l.startsWith(start));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('Min-cost flow and the assignment problem lesson', () => {
  it('shifts potentials and flips paths to the cheapest assignment', () => {
    render();
    expect(text()).toContain('All potentials start at 0');
    click(button('Next step'));
    expect(text()).toContain('Add worker A.');
    click(button('Next step'));
    expect(text()).toContain('The smallest slack is δ = 2, at column 2 (from row A).');
    expect(cellTitle('worker A, job 2:')).toBe('worker A, job 2: 2, smallest slack');
    click(button('Next step'));
    expect(text()).toContain('Add δ = 2 to u of row A. Tree edges stay at 0');
    expect(cellTitle('worker A, u:')).toBe('worker A, u: 2, potential shifted now');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Flip the path: A → 2. 1 of 4 rows assigned, cost 2; Σ u + Σ v = 2.');
    expect(cellTitle('worker A, job 2:')).toBe(
      'worker A, job 2: 0, flipped into the assignment now',
    );
    click(button('Last step'));
    expect(text()).toContain(
      'Done: A → 2, B → 1, C → 3 and D → 4 costs 13, and Σ u + Σ v = 13 as well, which proves no assignment is cheaper. Brute force would compare 24 assignments.',
    );
    expect(statValue(m.stats.cost)).toBe('13');
    expect(statValue(m.stats.bound)).toBe('13');
    expect(statValue(m.stats.rows)).toBe('4 / 4');
    expect(cellTitle('v, job 3:')).toBe('v, job 3: −3');
    expect(cellTitle('worker C, job 3:')).toBe('worker C, job 3: 0, assigned');
  });

  it('solves the greedy trap and the five by five matrix', () => {
    render();
    commit(select('preset'), 'trap');
    click(button('Last step'));
    expect(statValue(m.stats.cost)).toBe('8');
    commit(select('preset'), 'five');
    click(button('Last step'));
    expect(text()).toContain('Brute force would compare 120 assignments.');
  });

  it('reruns on a new cost, refuses a bad one, resizes and resets', () => {
    render();
    commit(costField('A', '2'), '20');
    click(button('Last step'));
    expect(statValue(m.stats.cost)).toBe('18');
    commit(costField('A', '2'), '100');
    expect(text()).toContain(m.badCost(99));
    expect(costField('A', '2').value).toBe('20');
    commit(select('size'), '2');
    click(button('Last step'));
    expect(statValue(m.stats.cost)).toBe('13');
    commit(select('size'), '3');
    expect(costField('C', '3').value).toBe('10');
    click(buttonByText(m.resetCosts));
    click(button('Last step'));
    expect(statValue(m.stats.cost)).toBe('13');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Add worker A.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '14');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '13');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
