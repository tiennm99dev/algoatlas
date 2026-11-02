// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { fenwickTrace } from '$lib/algo-engine/fenwick-tree.js';
import { en as m } from '$lib/lessons/fenwick-tree/copy.en.js';

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
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
const cell = (i) => /** @type {HTMLElement} */ (document.querySelector(`[data-index="${i}"]`));

const arcCount = () => document.querySelectorAll('path[marker-end]').length;

/** @param {number} k */
function next(k) {
  for (let i = 0; i < k; i++) click(button('Next step'));
}

/**
 * Press Enter in a field the way a browser does it: leaving the field fires its change event.
 * @param {HTMLInputElement} el @param {string} value
 */
function pressEnter(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.addEventListener('blur', () => el.dispatchEvent(new Event('change', { bubbles: true })), {
    once: true,
  });
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  flushSync();
}

const opsCard = () =>
  [...document.querySelectorAll('h2')].find((h) => h.textContent === m.opsTitle)?.parentElement
    ?.textContent ?? '';

describe('Fenwick tree lesson', () => {
  it('opens on the first prefix query and walks its jumps', () => {
    render();
    expect(text()).toContain('prefix(7): start with sum = 0 and i = 7.');
    expect(arcCount()).toBe(0);
    next(1);
    expect(text()).toContain('t[7] sums a[7..7], 2. Running sum = 2.');
    next(1);
    expect(text()).toContain('Clear the lowest bit: i = 7 − 1 = 6');
    expect(arcCount()).toBe(1);
    expect(document.querySelector('[data-testid="bits-line"]')?.textContent).toContain(
      'lowbit(6) = 2',
    );
    next(1);
    expect(text()).toContain('Running sum = 16.');
  });

  it('steps back to the build', () => {
    render();
    click(button('First step'));
    expect(text()).toContain('All 8 cells of t start at 0.');
    next(1);
    expect(text()).toContain('t[1] gets a[1] = 3');
    next(1);
    expect(text()).toContain('Parent of 1 is 1 + lowbit(1) = 2');
  });

  it('ends the log with the range sum and the totals', () => {
    render();
    click(button('Last step'));
    const last = fenwickTrace(
      [3, 1, 4, 1, 5, 9, 2, 6],
      [
        { type: 'prefix', i: 7 },
        { type: 'add', i: 3, delta: 5 },
        { type: 'range', l: 3, r: 7 },
      ],
    ).at(-1);
    expect(text()).toContain(`read ${last?.totalReads} cells and wrote ${last?.totalWrites} cells`);
  });

  it('adds a delta and shows the jump past n', () => {
    render();
    commit(input('index'), '5');
    commit(input('delta'), '-2');
    click(buttonByText(m.addButton));
    expect(text()).toContain('add(5, −2): a[5] changes');
    next(1);
    expect(text()).toContain('Add −2: t[5] = 3.');
    next(5);
    expect(text()).toContain('i = 8 + 8 = 16, past n = 8, so the update stops after 3 writes.');
  });

  it('runs a range sum through two prefix walks', () => {
    render();
    commit(input('index'), '6');
    commit(input('from'), '3');
    click(buttonByText(m.rangeButton));
    expect(text()).toContain('prefix(6): start');
    click(button('Last step'));
    click(button('Previous step'));
    expect(text()).toMatch(/a\[3\.\.6\] = prefix\(6\) − prefix\(2\)/);
  });

  it('submits the prefix query with Enter', () => {
    render();
    commit(input('index'), '4');
    document
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(text()).toContain('prefix(4): start');
  });

  it('sets the index from a cell by pointer and by keyboard', () => {
    render();
    click(cell(6));
    expect(input('index').value).toBe('6');
    expect(text()).toContain('t[6] sums a[5..6], 2 values.');
    const focused = cell(3);
    focused.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(input('index').value).toBe('3');
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    focused.dispatchEvent(event);
    flushSync();
    expect(event.defaultPrevented).toBe(true);
  });

  it('undoes and resets the log', () => {
    render();
    click(buttonByText(m.undo));
    expect(text()).not.toContain('range(3, 7)');
    click(buttonByText(m.reset));
    expect(text()).not.toContain('prefix(7)');
    expect(text()).toContain('Done: the operations read 0 cells and wrote 0 cells');
  });

  it('refuses bad input and keeps the last valid value', () => {
    render();
    commit(input('index'), '9');
    expect(text()).toContain(m.indexError(8));
    expect(input('index').value).toBe('5');
    commit(input('delta'), '100');
    expect(text()).toContain(m.deltaError);
    expect(input('delta').value).toBe('3');
    commit(input('values'), 'a b');
    expect(text()).toContain(m.valueErrors.format);
    expect(input('values').value).toBe('3, 1, 4, 1, 5, 9, 2, 6');
  });

  it('refuses a reversed range and a full log', () => {
    render();
    commit(input('from'), '7');
    click(buttonByText(m.rangeButton));
    expect(text()).toContain(m.rangeError);
    for (let k = 0; k < 5; k++) click(buttonByText(m.prefixButton));
    click(buttonByText(m.prefixButton));
    expect(text()).toContain(m.logFull);
  });

  it('drops operations that no longer fit a shorter array', () => {
    render();
    commit(input('values'), '1, 2, 3, 4');
    expect(text()).not.toContain('prefix(7)');
    expect(text()).toContain('add(3, 5)');
    expect(input('index').value).toBe('4');
    click(button('Last step'));
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
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
  });

  it('keeps a refusal on Enter and runs no operation', () => {
    render();
    const before = opsCard();
    pressEnter(input('index'), '99');
    expect(text()).toContain(m.indexError(8));
    expect(opsCard()).toBe(before);
    pressEnter(input('values'), 'abc');
    expect(text()).toContain(m.valueErrors.format);
    expect(opsCard()).toBe(before);
  });

  it('runs the action of the field Enter was pressed in, and none for new values', () => {
    render();
    pressEnter(input('index'), '4');
    expect(opsCard()).toContain('prefix(4)');
    pressEnter(input('delta'), '2');
    expect(opsCard()).toContain('add(4, 2)');
    const before = opsCard();
    pressEnter(input('values'), '1, 2, 3, 4, 5, 6, 7, 8, 9');
    expect(input('values').value).toBe('1, 2, 3, 4, 5, 6, 7, 8, 9');
    expect(opsCard().replace(' (running now)', '')).toBe(before.replace(' (running now)', ''));
  });

  it('keeps a cell in the tab order when the array shrinks', () => {
    render();
    cell(8).focus();
    flushSync();
    commit(input('values'), '1, 2, 3');
    expect(document.querySelectorAll('[data-index][tabindex="0"]')).toHaveLength(1);
  });
});

describe('Fenwick tree practice answers', () => {
  const a = [3, 1, 4, 1, 5, 9, 2, 6];

  it('has well-formed questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('matches the engine', () => {
    const answers = m.practice.map((ex) => /** @type {{ answer?: unknown }} */ (ex).answer);
    expect(answers[0]).toBe(12 & -12);
    expect(answers[1]).toBe(fenwickTrace(a, []).at(-1)?.t[6]);
    const range = fenwickTrace(a, [{ type: 'range', l: 3, r: 7 }]);
    expect(answers[2]).toBe(range.filter((f) => f.opIndex === 0).at(-1)?.result);
    const big = Array(16).fill(0);
    const walk = fenwickTrace(big, [{ type: 'prefix', i: 13 }]);
    expect(answers[3]).toBe(walk.filter((f) => f.opIndex === 0).at(-1)?.reads);
    const add = fenwickTrace(big, [{ type: 'add', i: 5, delta: 1 }]);
    const order = /** @type {{ items: string[], answer: number[] }} */ (m.practice[4]);
    expect(order.answer.map((k) => order.items[k])).toEqual(
      add
        .filter((f) => f.opIndex === 0)
        .at(-1)
        ?.visited.map((v) => `t[${v}]`),
    );
  });
});
