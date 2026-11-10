// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/ford-fulkerson/copy.en.js';

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
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
/** @param {string} name */
const capacityField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.editor.capacityAria(name)}"]`)
  );
/** Titles of the board's arrows. */
const arcTitles = () =>
  [...document.querySelectorAll('[data-arc] > title')].map((el) => el.textContent ?? '');

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

describe('Ford-Fulkerson lesson', () => {
  it('pushes augmenting paths until the flow is maximum', () => {
    render();
    expect(text()).toContain('Every edge starts with flow 0.');
    click(button('Next step'));
    expect(text()).toContain(
      'Depth-first search found S → A → C → B → D → T. Its smallest room is the bottleneck b = 4.',
    );
    expect(statValue(m.stats.bottleneck)).toBe('4');
    click(button('Next step'));
    expect(statValue(m.stats.value)).toBe('4');
    expect(arcTitles()).toContain('Edge C → B: flow 4 of 9, path adds flow here');
    click(button('Last step'));
    expect(text()).toContain(
      'Done after 4 augmenting paths and 67 arc checks: the maximum flow from S to T is 23.',
    );
    expect(statValue(m.stats.value)).toBe('23');
    expect(statValue(m.stats.paths)).toBe('4');
    click(button('Previous step'));
    expect(text()).toContain('the search reached only S, A, B and D.');
  });

  it('shows the backward step and the residual view', () => {
    render();
    commit(select('preset'), 'cancel');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Depth-first search found S → B ⇠ A → T.');
    expect(text()).toContain('uses A → B backwards');
    radio('residual');
    expect(arcTitles()).toContain('Backward arc B → A: can cancel 1, on the augmenting path');
    click(button('Next step'));
    expect(text()).toContain('and take it off A → B');
    radio('flow');
    expect(arcTitles()).toContain('Edge A → B: flow 0 of 1, path cancels flow here');
  });

  it('reruns on a new capacity, refuses a bad one, and resets', () => {
    render();
    commit(select('preset'), 'cancel');
    commit(capacityField('A → T'), '2');
    commit(capacityField('S → A'), '3');
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('3');
    commit(capacityField('S → A'), '25');
    expect(text()).toContain(m.badCapacity(20));
    expect(capacityField('S → A').value).toBe('3');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.value)).toBe('2');
  });

  it('changes the ends and refuses a sink equal to the source', () => {
    render();
    commit(select('sink'), '0');
    expect(text()).toContain(m.sameEnds);
    expect(select('sink').value).toBe('5');
    commit(select('sink'), '3');
    click(button('Last step'));
    expect(text()).toContain('the maximum flow from S to C is 19');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Depth-first search found S → A → C.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '20');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '23');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
