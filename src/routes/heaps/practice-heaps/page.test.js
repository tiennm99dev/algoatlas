// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { medianTrace } from '$lib/algo-engine/practice-heaps.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-heaps/copy.en.js';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} prefix */
const svgLabel = (prefix) =>
  document.querySelector(`svg[aria-label^="${prefix}"]`)?.getAttribute('aria-label') ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
const closest = () =>
  click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="closest"]')));

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

describe('practice heaps lesson', () => {
  it('splits the stream into two halves and reports the median', () => {
    render();
    expect(text()).toContain('Low is a max-heap of the smaller half');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Low is empty, so 5 goes into low.');
    click(button('Next step'));
    expect(text()).toContain('Odd count: the median is low’s top, 5.');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('15 > low’s top 5, so it belongs to the larger half');
    click(button('Next step'));
    expect(text()).toContain('Even count: the median is (5 + 15) / 2 = 10.');
  });

  it('ends with the running medians', () => {
    render();
    click(button('Last step'));
    expect(statValue(m.stats.median)).toBe('7');
    const last = medianTrace([5, 15, 1, 3, 8, 7, 9, 10, 2]).at(-1);
    expect(last?.medians).toEqual([5, 10, 5, 4, 5, 6, 7, 7.5, 7]);
    const chips = document.body.textContent?.split(m.mediansTitle)[1] ?? '';
    expect(chips).toContain('7.5');
    expect(svgLabel('Low half')).toBe(`Low half, max-heap: ${last?.low.join(', ')}.`);
    expect(svgLabel('High half')).toBe(`High half, min-heap: ${last?.high.join(', ')}.`);
  });

  it('loads a typed stream and refuses bad ones', () => {
    render();
    commit(input('stream'), '1, 2, 3, 4, 5');
    click(button('Last step'));
    expect(statValue(m.stats.moves)).toBe('2');
    expect(statValue(m.stats.median)).toBe('3');
    commit(input('stream'), '1, 200');
    expect(text()).toContain(m.streamErrors.range);
    expect(input('stream').value).toBe('1, 2, 3, 4, 5');
  });

  it('finds the k closest points', () => {
    render();
    closest();
    expect(text()).toContain('Keep the 3 closest points in a max-heap');
    click(button('Next step'));
    expect(text()).toContain('Read A (1, 2): distance² = 1² + 2² = 5.');
    click(button('Last step'));
    expect(text()).toContain('The 3 closest: D, G, A.');
    expect(svgLabel('Points:')).toContain('A (1, 2)');
  });

  it('changes k, refuses bad points and a bad k', () => {
    render();
    closest();
    commit(input('k'), '1');
    click(button('Last step'));
    expect(text()).toContain('The 1 closest: D.');
    commit(input('k'), '0');
    expect(text()).toContain(m.kError);
    commit(input('points'), '(1, 2) (1, 2)');
    expect(text()).toContain(m.pointErrors.duplicate);
    commit(input('points'), '(3, 4) (0, 2)');
    click(button('Last step'));
    expect(text()).toContain('The 1 closest: B.');
  });

  it('loads new input', () => {
    render();
    click(buttonByText(m.newInputButton));
    expect(text()).toContain(m.newInputNotice);
    expect(input('stream').value.split(', ')).toHaveLength(9);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Read 5.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
