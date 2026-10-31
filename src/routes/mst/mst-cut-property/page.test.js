// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/mst-cut-property/copy.en.js';

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
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
const testSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="test-edge"]'));

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

describe('Cut property and MST basics lesson', () => {
  it('scans the starting cut and names the lightest crossing edge', () => {
    render();
    expect(text()).toContain('S = {A, B, C}. Scan every edge');
    click(button('Next step'));
    expect(text()).toContain('Edge A — B (weight 3): both ends are in S');
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain(
      'Edge B — D (weight 5) crosses the cut. It is the first crossing edge',
    );
    click(button('Last step'));
    expect(text()).toContain('The lightest crossing edge is B — D (weight 5).');
    expect(statValue(m.stats.crossing)).toBe('3');
    expect(statValue(m.stats.mst)).toBe('18');
    expect(vertex(0).getAttribute('aria-label')).toBe('Vertex A, side S');
  });

  it('moves a vertex across the cut by click and by keyboard', () => {
    render();
    click(vertex(3));
    expect(vertex(3).getAttribute('aria-label')).toBe('Vertex D, side S');
    click(button('Last step'));
    expect(text()).toContain('The lightest crossing edge is D — E (weight 7).');
    press(vertex(1), 'Enter');
    expect(vertex(1).getAttribute('aria-label')).toBe('Vertex B, other side');
    expect(text()).toContain('S = {A, C, D}.');
  });

  it('tests an edge against the cycle property', () => {
    render();
    radio('cycle');
    expect(text()).toContain('Test edge C — D (weight 6). Search from C');
    click(button('Last step'));
    expect(text()).toContain('is strictly the heaviest edge on the cycle C → B → D → C');
    commit(testSelect(), '6');
    click(button('Last step'));
    expect(text()).toContain(
      'The search ran out without reaching E. The reached vertices {A, B, C, D} form a cut',
    );
    commit(weightField('C — E'), '6');
    click(button('Last step'));
    expect(text()).toContain('no MST contains D — E');
  });

  it('rejects a bad weight and resets the graph', () => {
    render();
    commit(weightField('A — B'), '0');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('A — B').value).toBe('3');
    commit(weightField('A — B'), '10');
    expect(statValue(m.stats.mst)).toBe('19');
    click(buttonByText(m.resetGraph));
    expect(statValue(m.stats.mst)).toBe('18');
  });

  it('overlays a minimum spanning tree in place of the step colours', () => {
    render();
    expect(text()).toContain(m.legend.best);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[name="show-mst"]')));
    expect(text()).toContain(m.legend.mst);
    expect(text()).not.toContain(m.legend.best);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Edge A — B (weight 3)');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '6');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
