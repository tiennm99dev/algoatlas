// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/strongly-connected-components/copy.en.js';

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

/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
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
/** @param {string} title */
const chips = (title) =>
  [
    ...([...document.querySelectorAll('h2')]
      .find((h) => h.textContent?.trim() === title)
      ?.parentElement?.querySelectorAll('li') ?? []),
  ].map((li) => li.textContent?.trim());

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

describe('strongly connected components lesson', () => {
  it('runs Tarjan, labels tin/low and condenses the graph', () => {
    render();
    expect(text()).toContain('Every vertex starts unvisited.');
    expect(text()).toContain(m.condensedWait);
    click(button('Next step'));
    expect(text()).toContain('Visit A: tin = low = 0. Push A on the stack.');
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex A, current, tin 0, low 0');
    for (let i = 0; i < 5; i++) click(button('Next step'));
    expect(text()).toContain('Edge C → A: A is still on the stack');
    click(button('Last step'));
    expect(text()).toContain('Done: 3 components.');
    expect(statValue(m.stats.comps)).toBe('3');
    expect(statValue(m.stats.edges)).toBe('10');
    expect(chips(m.compsLabel)).toEqual(['C1: D E F', 'C2: A B C', 'C3: G H']);
    expect(text()).toContain('3 components and 2 edges between them.');
    expect(document.querySelector('[aria-label^="Condensation"]')).toBeTruthy();
  });

  it('runs Kosaraju in two passes', () => {
    render();
    radio('kosaraju');
    expect(text()).toContain('Pass 1: run a DFS');
    click(button('Last step'));
    expect(statValue(m.stats.edges)).toBe('20');
    expect(statValue(m.stats.pass)).toBe('2 / 2');
    expect(chips(m.compsLabel)).toEqual(['C1: G H', 'C2: A B C', 'C3: D E F']);
    expect(chips(m.finishTitle)).toEqual(['C', 'F', 'E', 'D', 'B', 'A', 'H', 'G']);
    expect(text()).toContain('Kosaraju found them sources first');
  });

  it('adding F → A merges two components, and reset restores them', () => {
    render();
    radio('connect');
    click(vertex(5));
    click(vertex(0));
    click(button('Last step'));
    expect(statValue(m.stats.comps)).toBe('2');
    expect(text()).toContain('2 components and 1 edge between them.');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.comps)).toBe('3');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Visit A');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
