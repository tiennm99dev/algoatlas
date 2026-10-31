// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/kruskal/copy.en.js';

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

/** @param {HTMLInputElement} el @param {string} value */
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
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
const sortedRows = () =>
  [...document.querySelectorAll(`ol[aria-label="${m.sortedAria}"] > li`)].map((li) =>
    li.getAttribute('aria-label'),
  );

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

describe('Kruskal’s algorithm lesson', () => {
  it('sorts the edges, accepts and rejects them, and stops at V − 1 edges', () => {
    render();
    expect(text()).toContain('Sort the 9 edges by weight: E — F 1, B — C 2, A — B 3, A — C 4');
    expect(sortedRows()[0]).toBe('E — F, weight 1, waiting');
    click(button('Next step'));
    expect(text()).toContain(
      'Edge E — F (weight 1): find(E) = E and find(F) = F are different roots',
    );
    expect(sortedRows()[0]).toBe('E — F, weight 1, now');
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain(
      'Edge A — C (weight 4): find(A) = find(C) = B, so both ends are already in one tree.',
    );
    click(button('Last step'));
    expect(text()).toContain('Done: the minimum spanning tree has 5 edges and weight 18');
    expect(statValue(m.stats.considered)).toBe('7');
    expect(statValue(m.stats.rejected)).toBe('2');
    expect(statValue(m.stats.components)).toBe('1');
    expect(sortedRows()[3]).toBe('A — C, weight 4, rejected');
    expect(sortedRows()[8]).toBe('D — F, weight 9, waiting');
  });

  it('shows the stop before the last edges are read', () => {
    render();
    click(button('Last step'));
    click(button('Previous step'));
    expect(text()).toContain('Stop: the 2 remaining edges are never looked at.');
  });

  it('reruns when a weight changes, and rejects a bad weight', () => {
    render();
    commit(weightField('D — E'), '10');
    click(button('Last step'));
    expect(statValue(m.stats.weight)).toBe('19');
    commit(weightField('D — E'), '0');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('D — E').value).toBe('10');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.weight)).toBe('18');
  });

  it('builds a forest when a vertex is cut off, and new random weights still give a tree', () => {
    render();
    radio('connect');
    click(vertex(3));
    click(vertex(5));
    click(vertex(4));
    click(vertex(5));
    click(button('Last step'));
    expect(text()).toContain('The edges ran out with 2 trees left');
    click(buttonByText(m.resetGraph));
    click(buttonByText(m.randomWeights));
    click(button('Last step'));
    expect(statValue(m.stats.accepted)).toBe('5');
  });

  it('marks each vertex with its root and steps with the keyboard', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(vertex(4).getAttribute('aria-label')).toBe(
      'Vertex E, in the tree of E, end of the edge considered',
    );
    press(document.body, 'ArrowRight');
    expect(vertex(5).getAttribute('aria-label')).toBe('Vertex F, in the tree of E');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll(':scope > ol > li')[1]);
    answer(q, '9');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer(q, '7');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
