// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/space-complexity/copy.en.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const memoryLabel = () =>
  document.querySelector('[aria-label^="Memory bar"]')?.getAttribute('aria-label') ?? '';

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const nInput = () => /** @type {HTMLInputElement} */ (document.querySelector('input[name="n"]'));
const algoSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="algo"]'));

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 200 && !narration().includes(part); k++) click(button('Next step'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('space complexity lesson', () => {
  it('grows the stack to 6 frames for sum(5), then empties it', () => {
    render();
    expect(narration()).toBe('Nothing on the stack yet. Run with n = 5.');
    click(button('Next step'));
    expect(narration()).toContain('Call sum(5): push a frame of 2 words. Depth 1, 2 words in use.');
    stepUntil('base case');
    expect(stat('Stack depth')).toBe('6');
    expect(stat('Words in use')).toBe('12');
    expect(memoryLabel()).toContain('12 of 12 words in use');
    click(button('Last step'));
    expect(stat('Stack depth')).toBe('0');
    expect(stat('Peak words')).toBe('12');
    expect(narration()).toContain('Peak 12 words, deepest stack 6 frames');
  });

  it('keeps bits(n) shallow and the loop constant', () => {
    render();
    commit(nInput(), '12');
    commit(algoSelect(), 'bits-rec');
    click(button('Last step'));
    expect(stat('Deepest stack')).toBe('4');
    expect(stat('Peak words')).toBe('8');
    commit(algoSelect(), 'sum-loop');
    click(button('Last step'));
    expect(stat('Peak words')).toBe('4');
    expect(narration()).toContain('Θ(1)');
  });

  it('puts the copy on the heap and reverses in place without one', () => {
    render();
    commit(algoSelect(), 'reverse-copy');
    stepUntil('Allocate B');
    expect(stat('Words in use')).toBe('9');
    expect(text()).toContain(m.arrayB);
    click(button('Last step'));
    expect(stat('Peak words')).toBe('9');
    commit(algoSelect(), 'reverse-in-place');
    stepUntil('Swap A[0] and A[4]');
    expect(document.querySelector('[aria-label="Heap array B"]')).toBeNull();
    click(button('Last step'));
    expect(stat('Peak words')).toBe('5');
  });

  it('keeps the last valid n and submits with Enter', () => {
    render();
    commit(nInput(), '13');
    expect(narration()).toBe(m.nError);
    expect(nInput().value).toBe('5');
    nInput().value = '2';
    nInput().dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (nInput().closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(stat('Peak words')).toBe('6');
  });

  it('checks the bits(1000) question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
