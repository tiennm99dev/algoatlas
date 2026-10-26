// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-arrays-strings/copy.en.js';

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

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const verdict = () =>
  document.querySelector('[data-testid="verdict"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

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
function pickTechnique(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="technique"][value="${value}"]`)
    ),
  );
}

/** @param {string} value */
function pickProblem(value) {
  const select = /** @type {HTMLSelectElement} */ (
    document.querySelector('select[name="problem"]')
  );
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Steps column of the comparison table, by technique name. */
function compareSteps() {
  return Object.fromEntries(
    [...document.querySelectorAll('[data-testid="compare"] tbody tr')].map((tr) => [
      tr.querySelector('th')?.textContent?.trim(),
      tr.querySelectorAll('td')[1]?.textContent?.trim(),
    ]),
  );
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('array and string practice lesson', () => {
  it('runs two pointers on the sorted pair-sum sample', () => {
    render();
    expect(verdict()).toContain('Two pointers: Best fit');
    expect(narration()).toBe(
      'Find a pair with sum 14. Put lo on the first value and hi on the last.',
    );
    click(button('Next step'));
    expect(narration()).toBe(
      'a[0] + a[6] = 1 + 15 = 16 > 14: too big. a[lo] is the smallest partner left for a[hi], so move hi left.',
    );
    expect(text()).toContain('Index 6: 15, read now');
    click(button('Last step'));
    expect(narration()).toBe('Done: a[1] + a[5] = 14, after 3 steps.');
    expect(stat(m.stats.answer)).toBe('(1, 5)');
    expect(text()).toContain('Index 1: 3, part of the answer');
    expect(compareSteps()).toEqual({
      'Two pointers': '3',
      'Sliding window': m.notApplicable,
      'Prefix sums': m.notApplicable,
      'Brute force': '10',
    });
  });

  it('explains a technique that does not fit', () => {
    render();
    pickTechnique('window');
    expect(verdict()).toContain('Sliding window: Does not fit');
    expect(narration()).toContain('Sliding window does not fit this problem.');
    expect(text()).toContain(m.noCode);
    pickTechnique('brute');
    expect(verdict()).toContain('Brute force: Works, but not the best');
    click(button('Last step'));
    expect(stat(m.stats.steps)).toBe('10');
  });

  it('compares the techniques on the shortest-run sample', () => {
    render();
    pickProblem('shortest-window');
    expect(text()).toContain(m.statements['shortest-window']);
    pickTechnique('window');
    click(button('Last step'));
    expect(stat(m.stats.answer)).toBe('2');
    expect(narration()).toBe('Done: the shortest run is a[4..5], length 2, after 11 steps.');
    pickTechnique('prefix');
    expect(text()).toContain(m.auxTitles.prefix);
    click(button('Next step'));
    expect(narration()).toBe('P[1] = P[0] + a[0] = 0 + 2 = 2.');
    click(button('Last step'));
    expect(stat(m.stats.steps)).toBe('23');
    expect(compareSteps()['Brute force']).toBe('17');
  });

  it('answers range queries with prefix sums and edits the queries', () => {
    render();
    pickProblem('range-sums');
    pickTechnique('prefix');
    expect(input('queries').value).toBe('0 3, 2 6, 5 5, 1 7');
    click(button('Last step'));
    expect(stat(m.stats.answer)).toBe('7, 11, −1, 15');
    commit(input('queries'), '0 7');
    click(button('Last step'));
    expect(stat(m.stats.answer)).toBe('18');
    expect(stat(m.stats.steps)).toBe('9');
    commit(input('queries'), '3 9');
    expect(narration()).toBe(m.queryErrors.range);
    expect(input('queries').value).toBe('0 7');
  });

  it('checks a palindrome by copying it backwards', () => {
    render();
    pickProblem('palindrome');
    pickTechnique('brute');
    expect(text()).toContain(m.auxTitles.reversed);
    commit(input('values'), 'lever');
    click(button('Last step'));
    expect(stat(m.stats.answer)).toBe(m.no);
    expect(text()).toContain('Index 0: l, does not match');
    click(buttonByText(m.sampleButton));
    expect(input('values').value).toBe('racecar');
    click(button('Last step'));
    expect(stat(m.stats.answer)).toBe(m.yes);
  });

  it('rejects input the problem does not allow and keeps the last valid values', () => {
    render();
    commit(input('values'), '5, 1, 3');
    expect(narration()).toBe(m.valueErrors.unsorted);
    expect(input('values').value).toBe('1, 3, 4, 6, 8, 11, 15');
    commit(input('target'), '500');
    expect(narration()).toBe(m.targetError('pair-sum', 7));
    expect(input('target').value).toBe('14');
    pickProblem('shortest-window');
    commit(input('values'), '2, -1');
    expect(narration()).toBe(m.valueErrors.negative);
    pickProblem('max-window');
    commit(input('values'), '1, 2');
    expect(input('target').value).toBe('2');
  });

  it('steps with the keyboard', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('a[0] + a[6]');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
