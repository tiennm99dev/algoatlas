// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/bipartite-cycles/copy.en.js';

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

describe('bipartite and cycles lesson', () => {
  it('two-colours the odd cycle until C and D clash', () => {
    render();
    expect(text()).toContain('No vertex has a colour yet.');
    click(button('Next step'));
    expect(text()).toContain('A has no colour: give it colour 1 and start a BFS from it.');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('B has no colour, so it gets the other colour, 2.');
    expect(vertex(1).getAttribute('aria-label')).toBe('Vertex B, side 2');
    click(button('Last step'));
    expect(text()).toContain(
      'C and D both have colour 1, but an edge joins them. Odd cycle A, B, C, D, E: the graph is not bipartite.',
    );
    expect(statValue(m.stats.result)).toBe('odd cycle of 5');
    expect(vertex(4).getAttribute('aria-label')).toContain('on the cycle');
    expect(vertex(6).getAttribute('aria-label')).toBe('Vertex G');
  });

  it('colours the even cycle into two sides', () => {
    render();
    click(buttonByText(m.presets.even));
    click(button('Last step'));
    expect(text()).toContain('Bipartite. Side 1: A, C, E. Side 2: B, D, F.');
    expect(statValue(m.stats.checks)).toBe('14');
    expect(statValue(m.stats.sides)).toBe('3 | 3');
  });

  it('the diamond has an undirected cycle but no directed one', () => {
    render();
    click(buttonByText(m.presets.diamond));
    radio('undirected');
    click(button('Last step'));
    expect(text()).toContain('Cycle A, B, D, C – A.');
    radio('directed');
    click(button('Last step'));
    expect(text()).toContain('the directed graph has no cycle, so it is a DAG.');
    expect(statValue(m.stats.result)).toBe('no cycle');
    const next = button('Next step');
    click(button('First step'));
    for (let i = 0; i < 40 && !text().includes('is finished, so every path'); i++) click(next);
    expect(text()).toContain('Edge C → D: D is finished');
  });

  it('skips the parent edge in the undirected check of a tree', () => {
    render();
    click(buttonByText(m.presets.tree));
    radio('undirected');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('B – A is the edge we arrived along, not a cycle. Skip it.');
    click(button('Last step'));
    expect(text()).toContain('the graph is a forest');
  });

  it('finds the directed cycle of the odd preset with a back edge', () => {
    render();
    radio('directed');
    click(button('Last step'));
    expect(text()).toContain('Cycle A, B, C, D, E → A.');
    click(button('Previous step'));
    expect(text()).toContain('Edge E → A leads to A, which is still in progress: a back edge.');
  });

  it('deleting an edge of the odd cycle makes the graph bipartite', () => {
    render();
    radio('remove');
    const edge = /** @type {Element} */ (
      document.querySelector('[aria-label="Delete edge C and D"]')
    );
    click(edge);
    click(button('Last step'));
    expect(statValue(m.stats.result)).toBe('bipartite');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('give it colour 1');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
