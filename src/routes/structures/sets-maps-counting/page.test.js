// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/sets-maps-counting/copy.en.js';
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Next step'));
};
/** The map rows as "word count" pairs, in display order. */
const mapRows = () =>
  [...document.querySelectorAll('[data-testid="map"] li')].map((li) =>
    li.querySelector('.sr-only')?.textContent?.trim(),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('sets, maps and frequency counting lesson', () => {
  it('counts the words and re-sorts the map by frequency', () => {
    render();
    expect(narration()).toBe('The map count is empty. Each word will cost one hash lookup.');
    next(1);
    expect(narration()).toBe('Read “the”, word 1. Is it a key of count?');
    next(1);
    expect(narration()).toBe('No: add “the” with count 1. The map now has 1 key.');
    next(6);
    expect(narration()).toBe('Yes: count[“the”] goes from 1 to 2.');
    expect(mapRows()[0]).toBe('the: 2');
    click(button('Last step'));
    expect(narration()).toBe('Done. 12 words, 8 distinct. Most frequent: “the”, 4 times.');
    expect(mapRows().slice(0, 2)).toEqual(['the: 4', 'and: 2']);
    expect(byTest('lookups')).toBe('12');
    expect(byTest('list-compares')).toBe('34');
  });

  it('finds the first repeat with a set', () => {
    render();
    commit(field('select[name="preset"]'), 'woodchuck');
    click(field('input[name="mode"][value="set"]'));
    next(18);
    expect(narration()).toBe('Yes: “a” is already in seen. It is the first repeated word.');
    expect(byTest('first-repeat')).toBe('a');
    click(button('Last step'));
    expect(narration()).toBe('Done. 9 distinct words out of 13; 4 words were repeats.');
    expect(document.querySelector('[data-testid="set"]')?.textContent).toContain('woodchuck');
    click(field('input[name="mode"][value="map"]'));
    expect(narration()).toBe(
      'Done. 13 words, 9 distinct. Most frequent: “wood”, “a”, “woodchuck” and “chuck”, 2 times each.',
    );
  });

  it('counts typed words and keeps the last valid text on bad input', () => {
    render();
    const input = field('input[name="words"]');
    commit(input, '123 !!');
    expect(narration()).toBe(m.wordErrors.empty);
    expect(input.value).toBe('the cat and the hat and the bat sat on the mat');
    commit(input, 'B a, A b c');
    click(button('Last step'));
    expect(mapRows()).toEqual(['b: 2', 'a: 2', 'c: 1']);
    expect(byTest('repeats')).toBe('2');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Read “the”, word 1. Is it a key of count?');
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
    answer.value = 'wood';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = 'a';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
