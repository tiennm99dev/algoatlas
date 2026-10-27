// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/graph-representations/copy.en.js';

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
/** @param {number} r @param {number} c */
const matrixCell = (r, c) =>
  /** @type {Element} */ (document.querySelector(`[data-cell="${r}-${c}"]`));
const listRows = () =>
  [...document.querySelectorAll('ol.font-mono > li')].map((li) =>
    li.textContent?.replace(/\s+/g, ' ').trim(),
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

describe('graph representations lesson', () => {
  it('starts empty and fills both panels by the last step', () => {
    render();
    expect(text()).toContain('Start with a 5 × 5 matrix of zeros and 5 empty lists.');
    expect(statValue(m.stats.matrixCells)).toBe('25');
    click(button('Next step'));
    expect(text()).toContain('Edge A – B: set matrix[A][B] = 1 and append B to A’s list.');
    click(button('Next step'));
    expect(text()).toContain('store it the other way too: matrix[B][A] = 1');
    click(button('Last step'));
    expect(text()).toContain('each of the 6 edges appears twice');
    expect(statValue(m.stats.listEntries)).toBe('12');
    expect(listRows()[0]).toBe('A → B, C');
    expect(matrixCell(1, 0).getAttribute('aria-label')).toBe('Row B, column A: 1');
  });

  it('switching to directed stores each edge once and breaks the symmetry', () => {
    render();
    radio('directed');
    click(button('Last step'));
    expect(statValue(m.stats.listEntries)).toBe('6');
    expect(matrixCell(0, 1).getAttribute('aria-label')).toBe('Row A, column B: 1');
    expect(matrixCell(1, 0).getAttribute('aria-label')).toBe('Row B, column A: 0');
  });

  it('weighted mode writes the edge weights', () => {
    render();
    radio('weighted');
    click(button('Last step'));
    expect(matrixCell(1, 3).getAttribute('aria-label')).toBe('Row B, column D: 10');
    expect(listRows()[1]).toBe('B → A·4, C·5, D·10');
  });

  it('a vertex click compares what each representation reads', () => {
    render();
    click(vertex(3));
    expect(text()).toContain(
      'Neighbours of D: B, E. The matrix scans all 5 cells of row D; the list reads just its 2 entries.',
    );
    expect(matrixCell(3, 0).getAttribute('aria-label')).toContain('selected row');
    // The answer describes the finished panels, so the player shows them too.
    expect(statValue(m.stats.listEntries)).toBe('12');
    expect(listRows()[3]).toBe('D → B, E (selected)');
  });

  it('a vertex press whose click lands on the canvas still selects the vertex', () => {
    render();
    const at = { bubbles: true, clientX: 40, clientY: 40 };
    const canvas = /** @type {Element} */ (vertex(1).closest('svg'));
    vertex(1).dispatchEvent(new MouseEvent('pointerdown', at));
    // With pointer capture on the canvas, the browser sends the release and click to the svg.
    canvas.dispatchEvent(new MouseEvent('pointerup', at));
    canvas.dispatchEvent(new MouseEvent('click', at));
    flushSync();
    expect(text()).toContain('Neighbours of B: A, C, D.');
  });

  it('a matrix cell answers an edge test, also from the keyboard', () => {
    render();
    click(matrixCell(0, 3));
    expect(text()).toContain('Is there an edge A → D? The matrix answers with one read: 0, no.');
    press(matrixCell(0, 3), 'ArrowLeft');
    press(/** @type {Element} */ (document.activeElement), 'Enter');
    expect(text()).toContain('Is there an edge A → C?');
    expect(text()).toContain('1, yes');
  });

  it('adding a vertex and an edge rebuilds the trace', () => {
    render();
    click(buttonByText('Add node'));
    expect(statValue(m.stats.vertices)).toBe('6');
    expect(statValue(m.stats.matrixCells)).toBe('36');
    radio('connect');
    click(vertex(5));
    click(vertex(0));
    expect(statValue(m.stats.edges)).toBe('7');
    click(button('Last step'));
    expect(listRows()[5]).toBe('F → A');
    click(buttonByText(m.resetGraph));
    expect(statValue(m.stats.vertices)).toBe('5');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '6');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '12');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
