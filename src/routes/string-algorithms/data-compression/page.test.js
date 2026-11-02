// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_LEN } from '$lib/algo-engine/data-compression.js';
import { en as m } from '$lib/lessons/data-compression/copy.en.js';
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

describe('Data compression lesson', () => {
  it('builds the Huffman tree first, then reads through all three', () => {
    render();
    expect(narration()).toContain('Huffman needs the letter counts');
    expect(stat('stream')).toBe(m.streamEmpty);
    click(button('Next step'));
    expect(narration()).toBe('Merge the two lightest trees into cb, with count 6.');
    stepUntil('One tree remains');
    expect(document.body.textContent).toContain('a = 1');
    stepUntil('Now read the text');
    click(button('Next step'));
    expect(narration()).toBe(
      'a: Run-length starts a run of a. Huffman emits 1. LZW already knows a, so it keeps growing.',
    );
    expect(stat('raw')).toBe('8 bits');
    expect(stat('huff')).toBe(m.bitsValue(1));
    expect(stat('open-run')).toBe('Open run: a × 1');
    expect(titles()).toContain('Letter 0: a, read now');
  });

  it('reaches the known totals for each method', () => {
    render();
    toLast();
    expect(stat('raw')).toBe('112 bits');
    expect(stat('run')).toBe('48 bits');
    expect(stat('huff')).toBe('20 bits');
    expect(stat('lzw')).toBe('81 bits');
    expect(document.body.textContent).toContain('a × 8');
    expect(narration()).toContain('Raw 112 bits, run-length 48, Huffman 20, LZW 81');
  });

  it('grows the LZW dictionary with each code', () => {
    render();
    commit(field('text'), 'abab');
    stepUntil('LZW emits 97, adds ab as 256');
    expect(document.body.textContent).toContain('256 = ab');
    expect(document.body.textContent).toContain('97 (a)');
    stepUntil('LZW emits 98, adds ba as 257');
    stepUntil('LZW already knows ab');
    expect(stat('lzw-w')).toBe('Growing string w: ab');
    toLast();
    expect(stat('lzw')).toBe('27 bits');
    expect(document.body.textContent).toContain('256 (ab)');
  });

  it('switches presets and shows which method suits the text', () => {
    render();
    commit(field('preset'), 'flat');
    toLast();
    expect(stat('raw')).toBe('80 bits');
    expect(stat('run')).toBe('160 bits');
    commit(field('preset'), 'repeats');
    toLast();
    expect(stat('run')).toBe(`${16 * 16} bits`);
    expect(Number(stat('lzw')?.split(' ')[0])).toBeLessThan(128);
  });

  it('handles a text of one letter', () => {
    render();
    commit(field('text'), 'aaa');
    expect(narration()).toContain('Huffman needs');
    click(button('Next step'));
    expect(narration()).toContain('One tree remains');
    toLast();
    expect(stat('huff')).toBe('3 bits');
    expect(stat('run')).toBe('16 bits');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_LEN);
    const good = field('text').value;
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe(good);
    commit(field('text'), 'a'.repeat(MAX_LEN + 1));
    expect(narration()).toBe(errors.length);
    commit(field('text'), ' ');
    expect(narration()).toBe(errors.empty);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    checkFirstQuestion('6', '48');
  });
});
