// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/linked-list-techniques/copy.en.js';
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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const listLabel = () =>
  document.querySelector('[data-node]')?.closest('svg')?.getAttribute('aria-label') ?? '';
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Next step'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {number} id */
const node = (id) => /** @type {SVGGElement} */ (document.querySelector(`g[data-node="${id}"]`));
/** @param {string} key */
const link = (key) => document.querySelector(`path[data-link="${key}"]`);

describe('linked list techniques lesson', () => {
  it('races slow and fast until they meet, then finds the cycle start', () => {
    render();
    expect(narration()).toContain('slow and fast both start at the head, 3.');
    next(6);
    expect(narration()).toContain('slow and fast meet at 6 after 5 rounds');
    click(button('Last step'));
    expect(narration()).toBe(
      'The cycle starts at #2 (5), found with 19 pointer moves and two extra pointers.',
    );
    expect(byTest('steps')).toBe('7');
    expect(byTest('mu')).toBe('2');
    expect(byTest('lambda')).toBe('5');
  });

  it('stops when fast runs off a list without a cycle', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select[name="cycle"]')), '-1');
    click(button('Last step'));
    expect(narration()).toBe('No cycle, found with 9 pointer moves and two extra pointers.');
    click(button('Previous step'));
    expect(narration()).toContain('fast reached the end of the list after 3 rounds');
  });

  it('points the tail at a node clicked in the drawing', () => {
    render();
    click(node(0));
    click(button('Last step'));
    expect(narration()).toContain('The cycle starts at #0 (3)');
    expect(byTest('mu')).toBe('0');
  });

  it('points the tail at a node chosen with the keyboard', () => {
    render();
    const g = /** @type {SVGGElement} */ (document.querySelector('g[data-index="6"]'));
    g.focus();
    g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    click(button('Last step'));
    expect(narration()).toContain('The cycle starts at #6 (2)');
    expect(byTest('lambda')).toBe('1');
  });

  it('reverses the list one flipped arrow at a time', () => {
    render();
    commit(
      /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="algo"]')[1]),
      'reverse',
    );
    next(1);
    expect(narration()).toBe('Save next = curr.next (8) before the arrow out of 3 is overwritten.');
    next(1);
    expect(narration()).toBe('Flip the arrow: 3.next = prev (null). One write, no new nodes.');
    expect(link('0-next')).toBeNull();
    next(2);
    next(1);
    expect(link('1-next')?.getAttribute('class')).toContain('stroke-teal-700');
    click(button('Last step'));
    expect(narration()).toBe(
      'head = prev = 2. The list is reversed with 7 arrow flips and three extra pointers.',
    );
    expect(listLabel()).toBe(
      'Reversed part from prev: 2 → 6 → 9 → 1 → 5 → 8 → 3 → null. Rest from curr: null.',
    );
  });

  it('refuses bad values and keeps the last valid list', () => {
    render();
    commit(input('values'), 'a, b');
    expect(narration()).toBe(m.valueErrors.format);
    expect(input('values').value).toBe('3, 8, 5, 1, 9, 6, 2');
    commit(input('values'), '1 2 3 4 5 6 7 8 9 10 11');
    expect(narration()).toBe(m.valueErrors.count);
  });

  it('keeps the refusal on screen when Enter submits a bad list', () => {
    render();
    commit(input('values'), 'a, b');
    input('values').form?.requestSubmit();
    flushSync();
    expect(narration()).toBe(m.valueErrors.format);
    expect(input('values').value).toBe('3, 8, 5, 1, 9, 6, 2');
  });

  it('keeps the cycle inside a shorter list', () => {
    render();
    commit(input('values'), '4, 7');
    click(button('Last step'));
    expect(narration()).toContain('The cycle starts at #1 (7)');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
