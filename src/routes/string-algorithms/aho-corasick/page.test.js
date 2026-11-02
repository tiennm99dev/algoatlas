// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  AHO_PRESETS,
  MAX_PATTERNS,
  MAX_PATTERN_LEN,
  MAX_TEXT,
  naiveComparisons,
} from '$lib/algo-engine/aho-corasick.js';
import { en as m } from '$lib/lessons/aho-corasick/copy.en.js';
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

describe('Aho-Corasick lesson', () => {
  it('grows the trie, sets the links and scans to the known matches', () => {
    render();
    expect(narration()).toBe('Start with an empty trie: only the root.');
    expect(stat('nodes')).toBe('1');
    click(button('Next step'));
    expect(narration()).toBe('Pattern he: letter h leads to “h”.');
    stepUntil('Mark “hers”');
    expect(stat('nodes')).toBe('10');
    stepUntil('“she” fails to “he”');
    expect(narration()).toContain('Its output link points to “he”.');
    expect(document.querySelectorAll('[data-link="out"]').length).toBe(1);
    expect(titles()).toContain('Node she, ends the pattern she, fails to he, child v');
    stepUntil('The links are ready');
    stepUntil('Pattern she ends here');
    stepUntil('An output link shows he also ends here');
    toLast();
    const { patterns, text } = AHO_PRESETS.classic;
    expect(stat('matches')).toBe('6');
    expect(stat('naive')).toBe(String(naiveComparisons(patterns, text)));
    expect(document.body.textContent).toContain('hers @ 2');
    expect(document.body.textContent).toContain('he @ 9');
  });

  it('falls back on a mismatch without moving back in the text', () => {
    render();
    commit(field('text'), 'shr');
    stepUntil('follow its failure link');
    expect(narration()).toContain('to “h”');
    expect(stat('hops')).toBe('1');
    expect(titles()).toContain('Text position 2: r, being read');
  });

  it('shows the links to the root only when asked', () => {
    render();
    toLast();
    const useful = document.querySelectorAll('[data-link="fail"]').length;
    const all = /** @type {HTMLInputElement} */ (
      document.querySelector('input[name="links"][value="all"]')
    );
    click(all);
    expect(document.querySelectorAll('[data-link="fail"]').length).toBe(9);
    expect(useful).toBeLessThan(9);
  });

  it('rebuilds on a new preset, pattern list and text', () => {
    render();
    commit(field('preset'), 'nested');
    expect(field('patterns').value).toBe('a, aa, aaa');
    toLast();
    expect(stat('matches')).toBe('12');
    commit(field('patterns'), 'a b');
    toLast();
    expect(stat('nodes')).toBe('3');
    expect(stat('matches')).toBe('5');
    commit(field('text'), 'bb');
    toLast();
    expect(stat('matches')).toBe('2');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_PATTERNS, MAX_PATTERN_LEN, MAX_TEXT);
    const good = field('patterns').value;
    commit(field('patterns'), 'a1');
    expect(narration()).toBe(errors.format);
    expect(field('patterns').value).toBe(good);
    commit(field('patterns'), 'a a');
    expect(narration()).toBe(errors.duplicate);
    commit(field('patterns'), 'a b c d e f g');
    expect(narration()).toBe(errors.count);
    commit(field('patterns'), 'abcdefg');
    expect(narration()).toBe(errors.length);
    commit(field('patterns'), ' ');
    expect(narration()).toBe(errors.empty);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.textFormat);
    expect(field('text').value).toBe(AHO_PRESETS.classic.text);
    commit(field('text'), 'a'.repeat(MAX_TEXT + 1));
    expect(narration()).toBe(errors.textLength);
    commit(field('text'), '');
    expect(narration()).toBe(errors.textEmpty);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    checkFirstQuestion('3', '10');
  });
});
