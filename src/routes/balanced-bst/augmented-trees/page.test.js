// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/augmented-trees/copy.en.js';
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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const intervalRadio = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="mode"][value="interval"]'));
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Next step'));
};
/** Step until the narration contains the text. @param {string} text */
function stepTo(text) {
  for (let i = 0; i < 400; i++) {
    if (narration().includes(text)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated: ${text}`);
}

describe('ordered maps and augmented trees lesson', () => {
  it('opens on the first query with the tree already built, sizes on the nodes', () => {
    render();
    expect(narration()).toBe('Find the 5th smallest key, starting at the root with k = 5.');
    expect(stat('size')).toBe('7');
    expect(document.body.textContent).toContain('size 7');
  });

  it('narrates k shrinking through select and ends on the answer', () => {
    render();
    next(1);
    expect(narration()).toBe(
      'At 40: s = 3 + 1 = 4. k = 5 > 4, so skip those 4 keys: k = 5 − 4 = 1, and go right.',
    );
    next(1);
    expect(narration()).toBe(
      'At 60: s = 1 + 1 = 2. k = 1 < 2, so the answer is on the left and k stays 1.',
    );
    next(1);
    expect(narration()).toBe('At 50: s = 0 + 1 = 1, which equals k. The 5th smallest key is 50.');
    expect(stat('answer')).toBe('50');
    expect(stat('comparisons')).toBe('3');
    expect(
      document.querySelector('[data-testid="sorted-card"] svg')?.getAttribute('aria-label'),
    ).toContain('before the answer');
  });

  it('adds the left size at each right turn of a rank query, and reports a gap for a missing key', () => {
    render();
    stepTo('Find the rank of 45');
    next(1);
    expect(narration()).toBe(
      '45 > 40: 40 and its 3 left keys are all smaller, so add 4. Now r = 5. Go right.',
    );
    next(3);
    expect(narration()).toBe(
      '45 is not in the tree, but the count still works: 4 keys are smaller, so it would have rank 5.',
    );
    expect(stat('answer')).toBe('5');
  });

  it('refuses an out-of-range k from the root size alone', () => {
    render();
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toBe(
      'There is no 9th smallest key: the root’s size says the tree holds 7 keys. No walk is needed.',
    );
    expect(stat('comparisons')).toBe('0');
  });

  it('runs what the learner types: insert, then rank and select of the new key', () => {
    render();
    commit(input('key'), '25');
    click(buttonByText(m.insert));
    click(button('Last step'));
    expect(stat('size')).toBe('8');
    click(buttonByText(m.rank));
    click(button('Last step'));
    click(button('Previous step'));
    expect(stat('answer')).toBe('3');
    commit(input('key'), '3');
    click(buttonByText(m.select));
    click(button('Last step'));
    click(button('Previous step'));
    expect(stat('answer')).toBe('25');
  });

  it('recomputes sizes on the way back up and through a rotation', () => {
    render();
    commit(input('order-preset'), 'rotations');
    expect(narration()).toBe(m.emptyTree);
    stepTo('rotate left at 10');
    expect(narration()).toContain('20 now has size 3 and 10 has size 1');
    click(button('Previous step'));
    expect(narration()).toBe('At 10: size = 1 + 0 + 2 = 3.');
  });

  it('undoes, resets and reloads a preset', () => {
    render();
    click(buttonByText(m.undo));
    expect(document.body.textContent).not.toContain('select(9)');
    click(buttonByText(m.reset));
    expect(stat('size')).toBe('0');
    expect(narration()).toBe(m.emptyTree);
    commit(input('order-preset'), 'scores');
    expect(narration()).toBe('Find the rank of 68, starting at the root with r = 1.');
    expect(stat('size')).toBe('8');
  });

  it('shows a notice for a bad key and keeps the last valid one', () => {
    render();
    commit(input('key'), '500');
    expect(input('key').value).toBe('45');
    input('key').value = '500';
    input('key').dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    click(buttonByText(m.rank));
    expect(narration()).toBe(m.keyError);
    expect(input('key').value).toBe('45');
    expect(stat('size')).toBe('7');
  });

  it('copies a node into the field with the keyboard', () => {
    render();
    const root = /** @type {SVGGElement} */ (
      [...document.querySelectorAll('g[role="button"]')].find((g) =>
        g.getAttribute('aria-label')?.startsWith('Key 40,'),
      )
    );
    expect(root.getAttribute('aria-label')).toContain('size 7');
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(input('key').value).toBe('40');
  });

  it('switches to the interval tree and finds an overlap by following max', () => {
    render();
    click(intervalRadio());
    expect(narration()).toBe('Look for any interval that overlaps [22, 25], starting at the root.');
    expect(stat('size')).toBe('10');
    expect(
      document.querySelector('[data-testid="number-line"]')?.getAttribute('aria-label'),
    ).toContain('Query [22, 25]');
    next(1);
    expect(narration()).toBe('[16, 21] does not overlap [22, 25]: it ends at 21, before 22.');
    next(1);
    expect(narration()).toContain('The left subtree’s max is 23 ≥ 22, so go left.');
    stepTo('overlaps [22, 25]:');
    expect(stat('answer')).toBe('[15, 23]');
  });

  it('reports no overlap and finds the long interval on the far left', () => {
    render();
    click(intervalRadio());
    stepTo('so no interval overlaps [11, 14]');
    expect(stat('answer')).toBe('none');
    commit(input('interval-preset'), 'long');
    stepTo('overlaps [80, 85]:');
    expect(stat('answer')).toBe('[10, 90]');
    expect(stat('comparisons')).toBe('3');
  });

  it('keeps a number line label on the drawing when a long interval starts near zero', () => {
    render();
    click(intervalRadio());
    commit(input('low'), '0');
    commit(input('high'), '90');
    click(buttonByText('Reset'));
    click(buttonByText('Insert'));
    stepTo('The tree has 1 interval');
    const label = [...document.querySelectorAll('[data-testid="number-line"] text')].find(
      (t) => t.textContent === '[0, 90]',
    );
    expect(label?.getAttribute('text-anchor')).toBe('start');
    expect(Number(label?.getAttribute('x'))).toBeGreaterThan(0);
  });

  it('inserts and deletes typed intervals and refuses reversed endpoints', () => {
    render();
    click(intervalRadio());
    commit(input('low'), '40');
    commit(input('high'), '30');
    click(buttonByText(m.overlap));
    expect(narration()).toBe(m.orderError);
    expect(input('low').value).toBe('22');
    expect(input('high').value).toBe('25');
    commit(input('low'), '40');
    commit(input('high'), '50');
    click(buttonByText(m.overlap));
    stepTo('so no interval overlaps [40, 50]');
    click(button('Last step'));
    expect(stat('size')).toBe('10');
    click(buttonByText(m.remove));
    expect(narration()).not.toBe(m.orderError);
    click(button('Last step'));
    expect(stat('size')).toBe('10');
    commit(input('low'), '16');
    commit(input('high'), '21');
    click(buttonByText(m.remove));
    click(button('Last step'));
    expect(stat('size')).toBe('9');
  });

  it('keeps each half’s log across a switch', () => {
    render();
    click(buttonByText(m.reset));
    click(intervalRadio());
    expect(stat('size')).toBe('10');
    click(
      /** @type {HTMLInputElement} */ (document.querySelector('input[name="mode"][value="order"]')),
    );
    expect(stat('size')).toBe('0');
  });

  it('checks a practice answer, gives a hint, and every question is well formed', () => {
    render();
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (el) => el.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const submit = (value) => {
      answer.value = value;
      answer.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    submit('30');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    submit('60');
    expect(q.textContent).not.toContain('Not quite');
  });
});
