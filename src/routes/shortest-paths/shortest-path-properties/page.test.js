// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/shortest-path-properties/copy.en.js';

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
const presetSelect = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));

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

describe('shortest-path properties lesson', () => {
  it('relaxes the edge list once and ends with exact labels', () => {
    render();
    expect(text()).toContain('Start: d[S] = 0 and every other label is ∞');
    click(button('Next step'));
    expect(text()).toContain(
      'Relax S → A (weight 6): d[S] + 6 = 0 + 6 = 6 < ∞, so lower d[A] to 6 and set parent[A] = S.',
    );
    click(button('Last step'));
    expect(text()).toContain('Done after 7 relaxations: every label is the true shortest distance');
    expect(statValue(m.stats.exact)).toBe('5 / 5');
    expect(statValue(m.stats.updates)).toBe('5');
    expect(text()).toContain('S → B → A → C → D: weight 2 + 3 + 2 + 1 = 8.');
    expect(vertex(4).getAttribute('aria-label')).toBe('Vertex D, d = 8, exact');
  });

  it('shows how a bad order leaves labels wrong, and fixes them with more relaxations', () => {
    render();
    commit(presetSelect(), 'reverse');
    click(button('Next step'));
    expect(text()).toContain(
      'Relax B → D (weight 9): d[B] is ∞, so going through B gives nothing yet.',
    );
    click(button('Last step'));
    expect(text()).toContain('only 2 of 5 labels are exact');
    click(button(m.relaxAria('B → A')));
    expect(text()).toContain('d[B] + 3 = 2 + 3 = 5 < 6, so lower d[A] to 5');
    expect(statValue(m.stats.relaxations)).toBe('8');
    click(buttonByText(m.undo));
    expect(statValue(m.stats.relaxations)).toBe('7');
    click(buttonByText(m.clear));
    expect(statValue(m.stats.relaxations)).toBe('0');
    expect(text()).toContain(m.noPath('D'));
  });

  it('reruns the sequence when a weight changes and rejects a bad weight', () => {
    render();
    commit(weightField('S → B'), '9');
    click(button('Last step'));
    expect(text()).toContain('S → A → C → D: weight 6 + 2 + 1 = 9.');
    commit(weightField('S → B'), '-3');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('S → B').value).toBe('9');
    click(buttonByText(m.resetWeights));
    expect(text()).toContain('weight 2 + 3 + 2 + 1 = 8');
  });

  it('flags a label that lags behind its tree path', () => {
    render();
    click(buttonByText(m.clear));
    for (const e of ['S → A', 'A → C', 'S → B', 'B → A']) click(button(m.relaxAria(e)));
    click(vertex(3));
    expect(text()).toContain('S → B → A → C: weight 2 + 3 + 2 = 7.');
    expect(text()).toContain('The label d[C] = 8 is still higher');
  });

  it('picks a vertex with the keyboard and steps with the arrow key', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Relax S → A');
    press(vertex(1), 'Enter');
    expect(text()).toContain(`${m.pathTitle}: A`);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '8');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '9');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
