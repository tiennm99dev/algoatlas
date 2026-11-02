// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_LEN } from '$lib/algo-engine/z-function.js';
import { en as m } from '$lib/lessons/z-function/copy.en.js';
import { Z_PRESETS, naiveZComparisons, zTrace } from '$lib/algo-engine/z-function.js';
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
  for (let i = 0; i < 400; i++) {
    if (narration().includes(kindText)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated ${kindText}`);
}

const classicEnd = /** @type {import('$lib/algo-engine/z-function.js').ZFrame} */ (
  zTrace(Z_PRESETS.classic.text).at(-1)
);

describe('Z-function lesson', () => {
  it('walks the classic string to the expected Z values and counters', () => {
    render();
    expect(narration()).toBe(
      'Compute the Z-function of aabxaabxcaabxaabxay. The Z-box starts empty.',
    );
    expect(stat('box')).toBe('—');
    click(button('Next step'));
    expect(narration()).toBe('i = 1 is past the box, so nothing is known: start from Z[1] = 0.');
    click(button('Next step'));
    expect(narration()).toBe('S[0] = a equals S[1], so Z[1] grows to 1.');
    expect(titles()).toContain('String column 1: a, letters equal');
    stepUntil('the Z-box becomes [1, 2)');
    stepUntil('Z[1] = 1');
    toLast();
    expect(stat('comparisons')).toBe(String(classicEnd.comparisons));
    expect(stat('reused')).toBe(String(classicEnd.reused));
    expect(stat('naive')).toBe(String(naiveZComparisons(Z_PRESETS.classic.text)));
    expect(titles()).toContain('Z value column 9: 8');
    expect(titles()).toContain('Z value column 13: 5');
  });

  it('starts inside the box from the mirror, without reading letters', () => {
    render();
    commit(field('text'), 'aabxaabxc');
    stepUntil('i = 5 is inside the box [4, 8)');
    expect(narration()).toContain('min(r − i, Z[1]) = 1');
    expect(stat('box')).toBe('[4, 8)');
    expect(titles()).toContain('Z value column 1: 1, mirror of position i');
  });

  it('finds a pattern through the separator', () => {
    render();
    commit(field('preset'), 'search');
    expect(narration()).toContain('S = abc$abcabcabc');
    stepUntil('so the pattern occurs at 0');
    toLast();
    expect(stat('matches')).toBe('3');
    expect(titles()).toContain('Z value column 4: 3, pattern found');
    commit(field('pattern'), '');
    expect(narration()).toBe('Compute the Z-function of abcabcabc. The Z-box starts empty.');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_LEN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe(Z_PRESETS.classic.text);
    commit(field('text'), 'a'.repeat(MAX_LEN + 1));
    expect(narration()).toBe(errors.length);
    commit(field('text'), ' ');
    expect(narration()).toBe(errors.empty);
    commit(field('pattern'), 'a1');
    expect(narration()).toBe(errors.format);
    commit(field('pattern'), 'ab');
    expect(narration()).toBe(errors.combined);
    expect(field('pattern').value).toBe('');
    commit(field('preset'), 'search');
    commit(field('text'), 'a'.repeat(MAX_LEN - 3));
    expect(narration()).toBe(errors.combined);
    expect(field('text').value).toBe('abcabcabc');
  });

  it('shows the savings on a string of one letter', () => {
    render();
    commit(field('preset'), 'repeats');
    toLast();
    expect(stat('comparisons')).toBe('11');
    expect(stat('reused')).toBe('55');
    expect(stat('naive')).toBe('66');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
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
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
