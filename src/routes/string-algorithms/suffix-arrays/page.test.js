// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_LEN } from '$lib/algo-engine/suffix-arrays.js';
import { en as m } from '$lib/lessons/suffix-arrays/copy.en.js';
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
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const toLast = () => click(button('Last step'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 500; i++) {
    if (narration().includes(kindText)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated ${kindText}`);
}

/** The suffixes as drawn, top row first. */
const rows = () =>
  [...document.querySelectorAll('[data-testid^="suffix-"]')].map((el) =>
    [...el.children].map((c) => c.firstChild?.textContent?.trim()).join(''),
  );

describe('Suffix arrays lesson', () => {
  it('starts in text order and sorts banana by doubling', () => {
    render();
    expect(rows()).toEqual(['banana', 'anana', 'nana', 'ana', 'na', 'a']);
    expect(narration()).toContain('a = 0, b = 1');
    click(button('Next step'));
    expect(narration()).toContain('cover 2 letters');
    expect(document.querySelector('[data-testid="row-0"]')?.textContent).toContain('1, 0');
    stepUntil('Every rank is different');
    expect(rows()).toEqual(['a', 'ana', 'anana', 'banana', 'na', 'nana']);
    expect(stat('rounds')).toBe('2');
    expect(stat('distinct')).toBe('—');
  });

  it('fills the LCP bars with Kasai and reads off the answers', () => {
    render();
    stepUntil('Suffix 0 has neighbour');
    stepUntil('Suffix 1 has neighbour 3 above. Compare');
    stepUntil('LCP = 3 between suffix 3 and suffix 1');
    expect(document.querySelector('[data-testid="bar-2"]')?.textContent).toContain('LCP 3');
    stepUntil('h becomes 2');
    stepUntil('The last step proves 2 letters match already');
    toLast();
    expect(stat('distinct')).toBe('15');
    expect(stat('repeat')).toBe('ana');
    expect(stat('comparisons')).toBe('5');
    expect(document.querySelector('[data-testid="bar-3"]')?.textContent).toContain('LCP 0');
  });

  it('marks the suffixes being compared and the letters in play', () => {
    render();
    stepUntil('so h grows to 1');
    const label = document.querySelector('[data-testid="row-2"]')?.getAttribute('aria-label');
    expect(label).toContain('suffix');
    expect(document.body.textContent).toContain('✓');
  });

  it('rebuilds on a preset and on typed text', () => {
    render();
    commit(field('preset'), 'repeats');
    toLast();
    expect(stat('rounds')).toBe('3');
    expect(stat('repeat')).toBe('aaaaaaa');
    commit(field('text'), 'abc');
    expect(rows()).toEqual(['abc', 'bc', 'c']);
    toLast();
    expect(stat('rounds')).toBe('1');
    expect(stat('repeat')).toBe(m.repeatNone);
    expect(stat('distinct')).toBe('6');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_LEN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe('banana');
    commit(field('text'), 'a'.repeat(MAX_LEN + 1));
    expect(narration()).toBe(errors.length);
    commit(field('text'), ' ');
    expect(narration()).toBe(errors.empty);
  });

  it('checks the practice data', () => {
    render();
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    q.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(q.textContent).toContain('Correct!');
  });
});
