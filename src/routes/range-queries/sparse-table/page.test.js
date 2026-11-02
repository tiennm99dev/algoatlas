// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { floorLog2, foldRange, sparseTrace } from '$lib/algo-engine/sparse-table.js';
import { en as m } from '$lib/lessons/sparse-table/copy.en.js';

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
  vi.useRealTimers();
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

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
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

/** @param {number} i */
const arrayCell = (i) => /** @type {Element} */ (document.querySelector(`[data-index="${i}"]`));

/** @param {string} label */
const tableCell = (label) =>
  /** @type {Element} */ (document.querySelector(`[role="button"][aria-label^="${label}"]`));

describe('sparse table lesson', () => {
  it('starts on the build and ends with the query answer', () => {
    render();
    expect(text()).toContain('Build the table for 8 values with min, then answer a[1..6].');
    click(button('Next step'));
    expect(text()).toContain('Level 0 holds blocks of length 1');
    click(button('Last step'));
    expect(document.querySelector('[data-testid="result-line"]')?.textContent).toContain(
      'min(st[2][1], st[2][3]) = min(1, 1) = 1',
    );
    expect(text()).toContain('took 2 reads instead of 6 reads');
  });

  it('types a range and jumps to its query', () => {
    render();
    commit(input('l'), '4');
    commit(input('r'), '7');
    expect(text()).toContain('The range has 4 cells. The largest power of two that fits is 2^2');
    click(button('Last step'));
    expect(document.querySelector('[data-testid="result-line"]')?.textContent).toContain(
      'min(st[2][4], st[2][4]) = min(1, 1) = 1',
    );
  });

  it('picks a range with two clicks and with the keyboard', () => {
    render();
    click(arrayCell(0));
    expect(text()).toContain('Range starts at 0.');
    click(arrayCell(2));
    expect(text()).toContain('The range has 3 cells');
    const first = /** @type {HTMLElement} */ (arrayCell(5));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('Range starts at 5.');
  });

  it('shows the overlap failing under sum', () => {
    render();
    click(/** @type {Element} */ (document.querySelector('input[value="sum"]')));
    click(button('Last step'));
    expect(text()).toContain('wrong answer 31 instead of 23');
  });

  it('changes the table when the operation changes', () => {
    render();
    click(/** @type {Element} */ (document.querySelector('input[value="max"]')));
    click(button('Last step'));
    expect(document.querySelector('[data-testid="result-line"]')?.textContent).toContain(
      'max(7, 7) = 7',
    );
  });

  it('inspects a table cell, and explains a block that does not fit', () => {
    render();
    click(button('Last step'));
    click(tableCell('st[2][1]'));
    expect(document.querySelector('[data-testid="inspect-line"]')?.textContent).toContain(
      'st[2][1] covers a[1..4], 4 cells: min = 1.',
    );
    click(tableCell('st[3][5]'));
    expect(text()).toContain('length 8 starting at 5 would run past the end');
  });

  it('refuses bad input and keeps the last valid value', () => {
    render();
    commit(input('values'), '1, 2, x');
    expect(text()).toContain(m.valueErrors.format);
    expect(input('values').value).toBe('5, 2, 4, 7, 1, 3, 6, 8');
    commit(input('values'), '100');
    expect(text()).toContain(m.valueErrors.range);
    commit(input('r'), '99');
    expect(text()).toContain('l and r must be whole numbers');
    expect(input('r').value).toBe('6');
  });

  it('clamps the range to a shorter array', () => {
    render();
    commit(input('values'), '9, 3, 6');
    expect(input('r').value).toBe('2');
    expect(input('l').value).toBe('1');
    click(button('Last step'));
    expect(document.querySelector('[data-testid="result-line"]')?.textContent).toContain('= 3');
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
  });

  it('does not call a sum wrong when the shared cells add up to 0', () => {
    render();
    commit(input('values'), '1, 0, 1');
    commit(input('l'), '0');
    commit(input('r'), '2');
    click(/** @type {Element} */ (document.querySelector('input[value="sum"]')));
    click(button('Last step'));
    expect(text()).toContain('the right answer 2, by luck');
    expect(text()).not.toContain('wrong answer');
  });

  it('clears a refusal when a valid table cell is inspected next', () => {
    render();
    click(button('Last step'));
    click(tableCell(m.tableCellLabel(3, 1, null, false, '')));
    expect(text()).toContain('No block here');
    click(tableCell(m.tableCellLabel(0, 1, 2, true, '')));
    expect(text()).not.toContain('No block here');
  });

  it('names a negative value as out of range', () => {
    render();
    commit(input('values'), '3, −1');
    expect(text()).toContain(m.valueErrors.range);
  });
});

describe('sparse table practice answers', () => {
  const a = [5, 2, 4, 7, 1, 3, 6, 8];

  it('has well-formed questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('matches the engine', () => {
    const answers = m.practice.map((ex) => /** @type {{ answer?: unknown }} */ (ex).answer);
    expect(answers[0]).toBe(floorLog2(6));
    expect(answers[1]).toBe(foldRange(a, 1, 4, 'min'));
    expect(foldRange(a, 1, 6, 'sum')).toBe(23);
    expect(answers[2]).toBe(sparseTrace(a, 1, 6, 'sum').at(-1)?.result);
    const full = sparseTrace(Array(16).fill(1), 0, 15, 'min').at(-1);
    expect(answers[3]).toBe(full?.filled);
  });
});
