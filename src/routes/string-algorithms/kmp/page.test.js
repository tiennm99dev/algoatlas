// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_PATTERN, MAX_TEXT } from '$lib/algo-engine/kmp.js';
import { en as m } from '$lib/lessons/kmp/copy.en.js';
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

describe('KMP lesson', () => {
  it('builds the prefix function, then searches to the expected counters', () => {
    render();
    expect(narration()).toContain('First compute the prefix function of ababd');
    click(button('Next step'));
    expect(narration()).toBe(
      'P[1] = b against P[0] = a: different, and nothing is matched, so move on to the next letter.',
    );
    stepUntil('π is ready');
    expect(stat('build')).toBe('5');
    expect(titles().some((t) => t.includes('π value column 3: 2'))).toBe(true);
    toLast();
    expect(stat('comparisons')).toBe('18');
    expect(stat('falls')).toBe('4');
    expect(stat('naive')).toBe('28');
    expect(narration()).toContain('1 match with 18 comparisons');
  });

  it('jumps the pattern on a mismatch and keeps the same text index', () => {
    render();
    stepUntil('π is ready');
    stepUntil('Fall back');
    expect(narration()).toContain('Fall back: π[3] = 2');
    expect(narration()).toContain('slide P right by 2');
    expect(stat('i')).toBe('4');
    expect(stat('k')).toBe('2');
    expect(titles().some((t) => t.includes('border kept after the jump'))).toBe(true);
  });

  it('marks a full match and catches the overlapping one', () => {
    render();
    commit(field('preset'), 'overlap');
    stepUntil('occurs at 0');
    expect(titles().some((t) => t.includes('full match'))).toBe(true);
    expect(titles()).toContain('Pattern row column 0: a, full match');
    expect(titles()).toContain('Pattern row column 3: b, full match');
    click(button('Next step'));
    expect(narration()).toContain('To catch overlaps');
    // The border ab stays under the text letters it matched, at columns 2 and 3.
    expect(titles()).toContain('Pattern row column 2: a, border kept after the jump');
    expect(titles()).toContain('Pattern row column 3: b, border kept after the jump');
    toLast();
    expect(stat('comparisons')).toBe('8');
  });

  it('says plainly when a fallback keeps no letters', () => {
    render();
    commit(field('text'), 'abcx');
    commit(field('pattern'), 'abcd');
    stepUntil('Fall back');
    expect(narration()).toBe(
      'Fall back: π[2] = 0. No part of what matched can start a match, so slide P right by 3. Index i stays at 3.',
    );
  });

  it('rebuilds on a typed text and pattern', () => {
    render();
    commit(field('text'), 'AAAAB');
    commit(field('pattern'), 'aab');
    toLast();
    expect(stat('comparisons')).toBe('7');
    expect(stat('falls')).toBe('2');
    expect(field('text').value).toBe('aaaab');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe('abababcabababd');
    commit(field('text'), 'a'.repeat(MAX_TEXT + 1));
    expect(narration()).toBe(errors.textLength);
    commit(field('pattern'), 'a'.repeat(MAX_PATTERN + 1));
    expect(narration()).toBe(errors.patternLength);
    commit(field('pattern'), '');
    expect(narration()).toBe(errors.empty);
    expect(field('pattern').value).toBe('ababd');
  });

  it('commits a field on Enter and handles a pattern longer than the text', () => {
    render();
    const f = field('pattern');
    f.focus();
    f.value = 'abababcabababdab'.slice(0, MAX_PATTERN);
    f.dispatchEvent(new Event('input', { bubbles: true }));
    f.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    commit(field('text'), 'ab');
    toLast();
    expect(narration()).toContain('0 matches');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
