// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-recursion/copy.en.js';
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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
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

const boardLabel = () =>
  document.querySelector('[data-testid="board"]')?.getAttribute('aria-label') ?? '';

describe('practice: recursive thinking lesson', () => {
  it('solves three disks by trusting the smaller call', () => {
    render();
    expect(narration()).toBe(
      'Move all 3 disks from peg A to peg C, one disk at a time, never putting a bigger disk on a smaller one.',
    );
    next(1);
    expect(narration()).toBe(
      'Call hanoi(3, A, C, B). Trust the smaller call: first park the top 2 disks on B.',
    );
    next(3);
    expect(narration()).toBe('Move disk 1 from A to C (move 1). hanoi(1, A, C, B) is done.');
    next(1);
    expect(narration()).toBe(
      'The smaller disk is parked on C, so move disk 2 from A to B (move 2). Now bring it back on top.',
    );
    expect(boardLabel()).toBe(
      'Peg A: disks 3, bottom first. Peg B: disks 2, bottom first. Peg C: disks 1, bottom first.',
    );
    expect(byTest('depth')).toBe('2');
    click(button('Last step'));
    expect(narration()).toBe('Solved: 3 disks in 7 moves, which is 2³ − 1, the fewest possible.');
    expect(byTest('moves')).toBe('7 of 7');
    expect(boardLabel()).toBe('Peg A: empty. Peg B: empty. Peg C: disks 3, 2, 1, bottom first.');
  });

  it('refuses a bad disk count and keeps the last valid one', () => {
    render();
    commit(field('input[name="disks"]'), '9');
    expect(narration()).toBe(m.disksError(6));
    expect(field('input[name="disks"]').value).toBe('3');
    commit(field('input[name="disks"]'), '4');
    click(button('Last step'));
    expect(byTest('moves')).toBe('15 of 15');
    expect(byTest('calls')).toBe('15');
  });

  it('lists every subset, leaving each item out before taking it', () => {
    render();
    click(field('input[name="problem"][value="subsets"]'));
    next(4);
    expect(narration()).toBe('i = n, every item is decided: output {}, subset 1 of 8.');
    next(1);
    expect(narration()).toBe(
      'Back in subsets(2, {}): every subset without c is listed. Now take c.',
    );
    click(button('Last step'));
    expect(byTest('outputs')).toBe('8 of 8');
    expect(byTest('calls')).toBe('15');
    expect(document.querySelectorAll('svg[role="img"] circle')).toHaveLength(15);
    expect(text()).toContain('{b, c}');
  });

  it('refuses bad items and keeps the last valid ones', () => {
    render();
    click(field('input[name="problem"][value="subsets"]'));
    commit(field('input[name="items"]'), 'a a');
    expect(narration()).toBe(m.itemErrors.duplicate);
    expect(field('input[name="items"]').value).toBe('a, b, c');
    commit(field('input[name="items"]'), 'xy');
    click(button('Last step'));
    expect(byTest('outputs')).toBe('4 of 4');
  });

  it('steps back with the arrow keys', () => {
    render();
    click(button('Last step'));
    const before = narration();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '32';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
