// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/floyd-warshall/copy.en.js';

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
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));

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

/** @param {string} from @param {string} to */
const cell = (from, to) =>
  /** @type {Element} */ (
    [...document.querySelectorAll('[role="button"]')].find((el) =>
      (el.getAttribute('aria-label') ?? '').startsWith(`From ${from} to ${to}:`),
    )
  );

describe('Floyd-Warshall lesson', () => {
  it('starts from direct edges and ends with all shortest distances', () => {
    render();
    expect(text()).toContain('Start with direct edges only');
    expect(cell('D', 'A').getAttribute('aria-label')).toBe('From D to A: ∞, picked');
    click(button('Next step'));
    expect(text()).toContain('Phase k = A: paths may now pass through A.');
    click(button('Last step'));
    expect(text()).toContain('Done: 64 comparisons');
    expect(cell('D', 'A').getAttribute('aria-label')).toBe('From D to A: 3, picked');
    expect(cell('A', 'B').getAttribute('aria-label')).toBe('From A to B: −1');
    expect(text()).toContain('D → A: D → B → A, weight 3.');
  });

  it('jumps phase by phase with Next k and shows an improvement', () => {
    render();
    click(buttonByText(m.nextK));
    click(buttonByText(m.nextK));
    expect(text()).toContain('Phase k = B: paths may now pass through A, B.');
    expect(cell('B', 'C').getAttribute('aria-label')).toBe('From B to C: 2, row or column k');
    let guard = 0;
    while (!text().includes('Going through B is shorter') && guard++ < 20)
      click(button('Next step'));
    expect(text()).toContain('D → B → A: −1 + 4 = 3 < ∞. Going through B is shorter');
  });

  it('picks a cell with the pointer and the keyboard', () => {
    render();
    click(button('Last step'));
    click(cell('A', 'B'));
    expect(text()).toContain('A → B: A → C → D → B, weight −1.');
    press(cell('A', 'B'), 'ArrowRight');
    press(cell('A', 'C'), 'Enter');
    expect(text()).toContain('A → C: A → C, weight −2.');
  });

  it('flags a negative cycle on the diagonal', () => {
    render();
    commit(presetSelect(), 'cycle');
    click(button('Last step'));
    expect(text()).toContain('The diagonal is negative for A, B, C, D');
    expect(text()).toContain('the path runs into a negative cycle');
  });

  it('reruns on a typed weight, rejects a bad one, and steps with the keyboard', () => {
    render();
    commit(weightField('B → A'), '1');
    click(button('Last step'));
    expect(cell('D', 'A').getAttribute('aria-label')).toBe('From D to A: 0, picked');
    commit(weightField('B → A'), 'abc');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('B → A').value).toBe('1');
    click(buttonByText(m.resetGraph));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Phase k = A');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
