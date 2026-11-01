// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/n-queens-sudoku/copy.en.js';
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
const square = (r, c) =>
  /** @type {SVGElement} */ (document.querySelector(`[data-square="${r}-${c}"]`));
const toSudoku = () => click(field('input[name="puzzle"][value="sudoku"]'));

describe('N-queens and Sudoku lesson', () => {
  it('places and takes back queens as it steps', () => {
    render();
    expect(narration()).toContain('Put 4 queens on this 4 × 4 board');
    click(button('Next step'));
    expect(narration()).toBe('Row 0: column 0 is safe. Put a queen there.');
    expect(square(0, 0).textContent).toContain('♛');
    click(button('Next step'));
    expect(narration()).toBe(
      'Row 1: columns 0 and 1 attacked, so skip. Column 2 is safe. Put a queen there.',
    );
    click(button('Next step'));
    expect(narration()).toBe(
      'Row 2: every column is attacked. This board cannot be finished, so back up to row 1.',
    );
    click(button('Next step'));
    expect(narration()).toContain('Take it back');
    expect(square(1, 2).textContent).toContain('♕');
    click(button('Last step'));
    expect(byTest('solutions')).toBe('1');
    expect(byTest('placed')).toBe('8');
    expect(byTest('removed')).toBe('4');
    expect(byTest('tested')).toBe('26');
    expect(byTest('naive')).toBe('256');
  });

  it('changes n and the goal', () => {
    render();
    commit(field('input[name="n"]'), '6');
    click(field('input[name="goal"][value="all"]'));
    click(button('Last step'));
    expect(byTest('solutions')).toBe('4');
    commit(field('input[name="n"]'), '3');
    click(button('Last step'));
    expect(byTest('solutions')).toBe('0');
    expect(narration()).toContain('No solution for n = 3');
  });

  it('refuses a bad size and a size too large for all solutions', () => {
    render();
    commit(field('input[name="n"]'), '9');
    expect(narration()).toBe('The board size must be a whole number from 1 to 8.');
    expect(field('input[name="n"]').value).toBe('4');
    click(field('input[name="goal"][value="all"]'));
    commit(field('input[name="n"]'), '8');
    expect(narration()).toContain('up to n = 6');
    expect(field('input[name="n"]').value).toBe('4');
    click(field('input[name="goal"][value="first"]'));
    commit(field('input[name="n"]'), '8');
    click(field('input[name="goal"][value="all"]'));
    expect(narration()).toContain('up to n = 6');
    expect(field('input[name="goal"][value="first"]').checked).toBe(true);
  });

  it('holds the first queen with a click, and keys work too', () => {
    render();
    click(square(0, 1));
    expect(narration()).toContain('held in column 1');
    click(button('Last step'));
    expect(byTest('removed')).toBe('0');
    click(square(2, 2));
    expect(narration()).toBe(m.topRowOnly);
    click(button('First step'));
    square(0, 2).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(narration()).toContain('held in column 2');
    square(0, 0).focus();
    square(0, 0).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(document.activeElement).toBe(square(1, 0));
  });

  it('solves a Sudoku step by step and backs up', () => {
    render();
    toSudoku();
    expect(narration()).toContain('every digit from 1 to 4');
    click(button('Next step'));
    expect(narration()).toContain('fits, so write it and move on');
    click(button('Last step'));
    expect(byTest('result')).toBe('Solved');
    expect(byTest('removed')).toBe('3');
  });

  it('edits a Sudoku cell and resets the grid', () => {
    render();
    toSudoku();
    click(square(0, 0));
    expect(square(0, 0).textContent).toContain('1');
    expect(field('select[name="grid"]').value).toBe('');
    click(square(0, 1));
    click(square(0, 1));
    click(button('Next step'));
    click(button('Last step'));
    expect(byTest('result')).toBe('No solution');
    const reset = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === m.resetGrid,
    );
    click(/** @type {Element} */ (reset));
    expect(square(0, 0).textContent).toBe('');
    expect(field('select[name="grid"]').value).toBe('small');
  });

  it('loads the other grids', () => {
    render();
    toSudoku();
    commit(field('select[name="grid"]'), 'nine');
    click(button('Last step'));
    expect(byTest('result')).toBe('Solved');
    expect(document.querySelectorAll('[data-square]')).toHaveLength(81);
    commit(field('select[name="grid"]'), 'clash');
    click(button('Next step'));
    expect(narration()).toContain('already break a rule');
    click(button('Last step'));
    expect(byTest('result')).toBe('No solution');
    expect(narration()).toBe('No solution: the clues clash, so the search never starts.');
  });

  it('keeps each puzzle where it was when switching', () => {
    render();
    click(button('Last step'));
    toSudoku();
    expect(byTest('placed')).toBe('0');
    click(field('input[name="puzzle"][value="queens"]'));
    expect(byTest('placed')).toBe('8');
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
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('All solutions');
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Not quite');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
