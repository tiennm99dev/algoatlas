// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MANACHER_PRESETS, MAX_LEN, naiveExpansions, separate } from '$lib/algo-engine/manacher.js';
import { en as m } from '$lib/lessons/manacher/copy.en.js';
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
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const toLast = () => click(button('Last step'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 500; i++) {
    if (narration().includes(kindText)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated ${kindText}`);
}

/** One wrong answer, a hint, then the right answer, on the first practice question. */
/** @param {string} wrong @param {string} right */
function checkFirstQuestion(wrong, right) {
  const section = /** @type {HTMLElement} */ (
    [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    )
  );
  const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
  const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  const submit = () => {
    q.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    flushSync();
  };
  answer.value = wrong;
  answer.dispatchEvent(new Event('input', { bubbles: true }));
  submit();
  expect(q.textContent).toContain('Not quite');
  const hint = [...q.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === 'Show a hint',
  );
  click(/** @type {HTMLButtonElement} */ (hint));
  expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
  answer.value = right;
  answer.dispatchEvent(new Event('input', { bubbles: true }));
  submit();
  expect(q.textContent).toContain('Correct!');
  for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
}

describe('Manacher lesson', () => {
  it('walks to the known longest palindrome', () => {
    render();
    expect(narration()).toContain('T = #a#b#a#c#');
    expect(stat('band')).toBe('—');
    toLast();
    expect(narration()).toContain('the longest palindrome is abacabacaba, of length 11');
    expect(stat('best')).toBe('11');
    expect(stat('naive')).toBe(String(naiveExpansions(separate(MANACHER_PRESETS.nested))));
    expect(titles()).toContain('Position 11: b, radius 11, longest palindrome');
  });

  it('starts inside the band from the mirror and draws its arc', () => {
    render();
    commit(field('text'), 'abaaba');
    stepUntil('mirrors position');
    expect(narration()).toContain('min(R − i');
    expect(document.querySelector('[data-band]')).not.toBeNull();
    expect(titles().some((t) => t.includes('centre i'))).toBe(true);
    stepUntil('mirrors position 3');
    expect(document.querySelector('[data-arc="mirror"]')).not.toBeNull();
  });

  it('draws one thin arc for each finished radius', () => {
    render();
    commit(field('text'), 'aba');
    toLast();
    // #a#b#a# has radii 1, 3 and 1 above zero.
    expect(document.querySelectorAll('[data-arc="done"]').length).toBe(3);
  });

  it('finds an even palindrome through a separator', () => {
    render();
    commit(field('preset'), 'even');
    toLast();
    expect(narration()).toContain('abba');
    expect(stat('best')).toBe('4');
  });

  it('shows the saving on one repeated letter', () => {
    render();
    commit(field('preset'), 'repeats');
    toLast();
    expect(stat('naive')).toBe('64');
    expect(stat('comparisons')).toBe('15');
    expect(stat('best')).toBe('8');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_LEN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe(MANACHER_PRESETS.nested);
    commit(field('text'), 'a'.repeat(MAX_LEN + 1));
    expect(narration()).toBe(errors.length);
    commit(field('text'), ' ');
    expect(narration()).toBe(errors.empty);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    checkFirstQuestion('8', '9');
  });
});
