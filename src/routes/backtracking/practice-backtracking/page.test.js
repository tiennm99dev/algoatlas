// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-backtracking/copy.en.js';
import Page from './+page.svelte';

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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** @param {number} r @param {number} c */
const cell = (r, c) => /** @type {Element} */ (document.querySelector(`[data-cell="${r}-${c}"]`));
const toSum = () => click(field('input[name="problem"][value="sum"]'));

describe('practice: backtracking problems lesson', () => {
  it('walks a word search to the end', () => {
    render();
    expect(narration()).toContain('Look for ABCCED');
    click(button('Next step'));
    expect(narration()).toBe(
      'Cell (0, 0) holds A, letter 1 of 6. Mark it as used and try its neighbours for B.',
    );
    click(button('Last step'));
    expect(byTest('result')).toBe('Found');
    expect(byTest('matched')).toBe('6 / 6');
    expect(byTest('checked')).toBe('9');
    expect(byTest('retreats')).toBe('0');
  });

  it('retreats when a path dead-ends', () => {
    render();
    commit(field('select[name="word-preset"]'), 'absent');
    click(button('Last step'));
    expect(byTest('result')).toBe('Not found');
    expect(byTest('retreats')).toBe('4');
    expect(byTest('matched')).toBe('0 / 4');
    expect(narration()).toContain('ABCB is not in the grid');
    click(button('First step'));
    let guard = 0;
    while (!narration().includes('retreat.') && guard++ < 40) click(button('Next step'));
    expect(narration()).toContain('Clear its mark');
  });

  it('says when a run is too long to show', () => {
    render();
    commit(field('select[name="word-preset"]'), 'trap');
    click(button('Last step'));
    expect(byTest('result')).toBe('Too long');
    expect(narration()).toContain('too many paths');
  });

  it('edits the grid and the word', () => {
    render();
    commit(field('input[name="grid"]'), 'ab cd');
    expect(field('input[name="grid"]').value).toBe('AB CD');
    commit(field('input[name="word"]'), 'acdb');
    expect(field('input[name="word"]').value).toBe('ACDB');
    click(button('Last step'));
    expect(byTest('result')).toBe('Found');
    expect(field('select[name="word-preset"]').value).toBe('');
  });

  it('refuses bad input and keeps the last valid values', () => {
    render();
    commit(field('input[name="grid"]'), 'AB C');
    expect(narration()).toBe(
      'Enter 1 to 5 rows of equal length, up to 5 letters each, separated by spaces.',
    );
    expect(field('input[name="grid"]').value).toBe('ABCE SFCS ADEE');
    commit(field('input[name="word"]'), 'A1');
    expect(narration()).toBe('The word must be 1 to 12 letters from A to Z.');
    expect(field('input[name="word"]').value).toBe('ABCCED');
    toSum();
    commit(field('input[name="candidates"]'), '0');
    expect(narration()).toBe('Enter 1 to 6 different whole numbers from 1 to 20.');
    expect(field('input[name="candidates"]').value).toBe('2 3 6 7');
    commit(field('input[name="total"]'), '31');
    expect(narration()).toBe('The total must be a whole number from 1 to 30.');
    expect(field('input[name="total"]').value).toBe('7');
  });

  it('jumps to the first check of a cell, by pointer and by keyboard', () => {
    render();
    click(cell(0, 2));
    expect(narration()).toContain('Cell (0, 2)');
    cell(1, 2).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(narration()).toContain('Cell (1, 2)');
  });

  it('solves combination sum and shows the results', () => {
    render();
    toSum();
    expect(narration()).toContain('adds up to 7');
    click(button('Next step'));
    expect(narration()).toBe(
      'Pick 2, leaving 5 to reach. The next call may pick 2 again, but nothing before it.',
    );
    click(button('Last step'));
    expect(byTest('solutions')).toBe('2');
    expect(byTest('calls')).toBe('10');
    expect(byTest('stops')).toBe('7');
    expect(document.body.textContent).toContain('2 + 2 + 3');
  });

  it('edits and loads combination sum inputs', () => {
    render();
    toSum();
    commit(field('input[name="candidates"]'), '5 3 5');
    expect(field('input[name="candidates"]').value).toBe('3 5');
    commit(field('input[name="total"]'), '8');
    click(button('Last step'));
    expect(byTest('solutions')).toBe('1');
    commit(field('select[name="sum-preset"]'), 'ten');
    click(button('Last step'));
    expect(byTest('solutions')).toBe('6');
    click(/** @type {Element} */ (document.querySelector('[data-node="0"]')));
    expect(byTest('calls')).toBe('1');
  });

  it('keeps each problem where it was when switching', () => {
    render();
    click(button('Last step'));
    toSum();
    expect(byTest('calls')).toBe('1');
    click(field('input[name="problem"][value="word"]'));
    expect(byTest('result')).toBe('Found');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('read Retreats');
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Not quite');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
