// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/dijkstra-general/copy.en.js';

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
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
const sourceSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="source"]'));
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

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

describe('Dijkstra on general graphs lesson', () => {
  it('runs from A, skips stale entries and ends with the final distances', () => {
    render();
    expect(text()).toContain(
      'Set dist[A] = 0 and every other label to ∞. Push (0, A) into the heap.',
    );
    click(button('Next step'));
    expect(text()).toContain('Pop (0, A), the smallest entry, and it matches dist[A]. Settle A');
    click(button('Next step'));
    expect(text()).toContain(
      'Edge A — B (weight 4): 0 + 4 = 4 < ∞. Lower dist[B] and push (4, B).',
    );
    for (let i = 0; i < 4; i++) click(button('Next step'));
    expect(text()).toContain(
      'Edge C — B (weight 2): 1 + 2 = 3 < 4. Lower dist[B] and push (3, B); the old (4, B) stays in the heap, now stale.',
    );
    click(button('Last step'));
    expect(text()).toContain(
      'The heap is empty. 6 vertices settled with 10 pushes and 10 pops, 4 of them stale.',
    );
    expect(statValue(m.stats.stale)).toBe('4');
    expect(statValue(m.stats.relaxations)).toBe('18');
    expect(vertex(5).getAttribute('aria-label')).toBe('Vertex F, d = 13, settled');
  });

  it('shows a stale pop in the narration and the heap', () => {
    render();
    let guard = 0;
    while (!text().includes('this entry is stale') && guard++ < 40) click(button('Next step'));
    expect(text()).toContain('Pop (4, B), but dist[B] is already 3');
  });

  it('reruns when the source or a weight changes, and rejects a bad weight', () => {
    render();
    commit(sourceSelect(), '5');
    click(button('Last step'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex A, d = 13, settled');
    commit(weightField('A — C'), '5');
    click(button('Last step'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex A, d = 14, settled');
    commit(weightField('A — C'), 'x');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('A — C').value).toBe('5');
    click(buttonByText(m.resetGraph));
    click(button('Last step'));
    expect(statValue(m.stats.stale)).toBe('4');
  });

  it('rebuilds when an edge is drawn on the canvas', () => {
    render();
    radio('connect');
    click(vertex(0));
    click(vertex(5));
    click(button('Last step'));
    expect(vertex(5).getAttribute('aria-label')).toBe('Vertex F, d = 1, settled');
    expect(weightField('A — F').value).toBe('1');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Settle A');
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
