// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/prefix-sums/copy.en.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const queryLine = () =>
  document.querySelector('[data-testid="query-line"]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickMode(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let i = 0; i < 400 && !narration().includes(part); i++) click(button('Next step'));
}

/** @param {number} i */
const cellA = (i) =>
  /** @type {SVGElement} */ (
    document.querySelector(`svg[aria-label^="${m.arrayAria}"] [data-index="${i}"]`)
  );

/** @param {SVGElement} el @param {string} key */
function press(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('prefix sums lesson', () => {
  it('builds P and answers a[2..5] with two lookups', () => {
    render();
    expect(narration()).toBe(
      'Build P for 8 values: P[0] = 0, the sum of no elements. Then answer the sum of a[2..5].',
    );
    click(button('Next step'));
    expect(narration()).toBe('P[1] = P[0] + a[0] = 0 + 3 = 3.');
    expect(text()).toContain('P[1]: 3, just written');
    click(button('Last step'));
    expect(queryLine()).toBe('a[2] + … + a[5] = P[6] − P[2] = 23 − 4 = 19');
    expect(stat(m.stats.result)).toBe('19');
    expect(stat(m.stats.lookups)).toBe('2');
    expect(stat(m.stats.naive)).toBe('4');
    expect(stat(m.stats.build)).toBe('9');
  });

  it('picks a range by clicking two cells and jumps to its query', () => {
    render();
    cellA(3).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(narration()).toBe(m.pickFirst(3));
    cellA(0).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(narration()).toBe('Sum of a[0..3] = P[4] − P[0] = 9: two lookups instead of 4 reads.');
    expect(input('l').value).toBe('0');
    expect(input('r').value).toBe('3');
  });

  it('picks a range with the keyboard', () => {
    render();
    cellA(0).focus();
    press(cellA(0), 'ArrowRight');
    press(cellA(1), 'Enter');
    press(cellA(1), 'ArrowRight');
    press(cellA(2), 'Enter');
    expect(queryLine()).toBe('a[1] + … + a[2] = P[3] − P[1] = 8 − 3 = 5');
  });

  it('rejects a bad range and keeps the last valid one', () => {
    render();
    commit(input('l'), '6');
    expect(narration()).toBe(m.rangeError(8));
    expect(input('l').value).toBe('2');
    commit(input('values'), '1, x');
    expect(narration()).toBe(m.valueErrors.format);
    commit(input('values'), '4 −1 2');
    expect(input('r').value).toBe('2');
    click(button('Last step'));
    expect(stat(m.stats.result)).toBe('2');
  });

  it('applies range updates through the difference array', () => {
    render();
    pickMode('difference');
    expect(text()).toContain('addRange(l, r, v):');
    click(button('Next step'));
    expect(narration()).toBe('D[0] = a[0] = 3.');
    click(button('Next step'));
    expect(narration()).toBe('D[1] = a[1] − a[0] = 1 − 3 = −2.');
    stepUntil('Update 2');
    click(button('Next step'));
    expect(narration()).toBe(
      'r + 1 = 8 = n: the range runs to the end, so nothing needs cancelling. 1 cell changed instead of 6.',
    );
    click(button('Last step'));
    expect(text()).toContain('Updated array: 3, 6, 7, 4, 3, 7, 0, 4');
    expect(stat(m.stats.writes)).toBe('3');
    expect(stat(m.stats.naiveWrites)).toBe('9');
    expect(stat(m.stats.updates)).toBe('2 / 2');
    expect(narration()).toBe(
      'Done: 3 cells of D changed instead of 9 element writes, plus one rebuild pass of 8 steps.',
    );
  });

  it('rejects bad updates and reads new ones', () => {
    render();
    pickMode('difference');
    commit(input('updates'), '1 9 5');
    expect(narration()).toBe(m.updateErrors.range);
    expect(input('updates').value).toBe('1 3 5, 2 7 -2');
    commit(input('updates'), '1 3');
    expect(narration()).toBe(m.updateErrors.format);
    commit(input('values'), '0 0 0 0 0 0');
    commit(input('updates'), '1 3 5; 2 5 2');
    click(button('Last step'));
    expect(text()).toContain('Updated array: 0, 5, 7, 7, 2, 2');
    expect(text()).toContain('D[4]: −5');
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '23';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '14';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
