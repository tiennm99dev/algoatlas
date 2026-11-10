// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/bipartite-matching/copy.en.js';

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
/** @param {number} r @param {number} c */
const cell = (r, c) => /** @type {Element} */ (document.querySelector(`[data-cell="${r}-${c}"]`));
/** @param {number} id */
const vertex = (id) =>
  [...document.querySelectorAll('svg title')]
    .map((el) => el.textContent ?? '')
    .find((l) => l.startsWith(`Vertex ${id < 10 ? m.leftName(id) : m.rightName(id - 10)},`));

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

describe('Bipartite matching lesson', () => {
  it('flips an augmenting path with Kuhn', () => {
    render();
    expect(text()).toContain('Kuhn’s algorithm takes the left vertices A, B, … in turn');
    click(button('Next step'));
    expect(text()).toContain('Start from A: clear the visited marks and run try(A).');
    click(button('Next step'));
    expect(text()).toContain('A looks at 1: 1 is free.');
    click(button('Next step'));
    expect(statValue(m.stats.size)).toBe('1');
    click(button('Next step'));
    expect(vertex(0)).toBe('Vertex A, matched');
    expect(vertex(1)).toBe('Vertex B, free, searching now');
    click(button('Next step'));
    expect(text()).toContain(
      'B looks at 1: 1 is taken by A. Can A move to another partner? Run try(A).',
    );
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Flip the path B – 1 – A – 2');
    expect(statValue(m.stats.size)).toBe('2');
    click(button('Last step'));
    expect(text()).toContain('Done: 4 pairs after 16 edge checks.');
    expect(statValue(m.stats.searches.kuhn)).toBe('4');
  });

  it('runs Hopcroft-Karp in two phases', () => {
    render();
    radio('hk');
    click(button('Next step'));
    expect(text()).toContain(
      'Phase 1: BFS from the free left vertices A, B, C and D finds that the shortest augmenting paths have 1 edge.',
    );
    click(button('Last step'));
    expect(text()).toContain('Done: 4 pairs in 2 phases');
    for (let i = 0; i < 3; i++) click(button('Previous step'));
    expect(text()).toContain('DFS from B found B – 1 – A – 2 – C – 3 – D – 4');
  });

  it('edits edges in the table, resizes the sides and resets', () => {
    render();
    commit(select('preset'), 'hall');
    click(button('Last step'));
    expect(statValue(m.stats.size)).toBe('3');
    expect(vertex(1)).toBe('Vertex B, free');
    commit(select('right'), '4');
    click(cell(1, 3));
    expect(cell(1, 3).getAttribute('aria-label')).toBe('B – 4: edge');
    click(button('Last step'));
    expect(statValue(m.stats.size)).toBe('4');
    expect(cell(1, 3).getAttribute('aria-label')).toBe('B – 4: edge, matched');
    press(cell(1, 3), 'Enter');
    click(button('Last step'));
    expect(statValue(m.stats.size)).toBe('3');
    commit(select('left'), '2');
    click(button('Last step'));
    expect(statValue(m.stats.size)).toBe('1');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.size)).toBe('3');
    click(button('First step'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Start from A');
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
