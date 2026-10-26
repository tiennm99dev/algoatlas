// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { heapsortTrace } from '$lib/algo-engine/heapsort.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/heapsort/copy.en.js';

const INITIAL = [35, 12, 58, 7, 91, 26, 44, 63, 19, 80];

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
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
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

const text = () => document.body.textContent ?? '';
const valuesInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="values"]'));
const arrayLabel = () =>
  document.querySelector('svg[aria-label^="Array:"]')?.getAttribute('aria-label') ?? '';

/** @param {number} index */
function seek(index) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Step"]'));
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('heapsort lesson', () => {
  it('starts the build at the last internal node', () => {
    render();
    expect(text()).toContain('sift down each internal node from slot 4 back to slot 0');
    click(button('Next step'));
    expect(text()).toContain('Sift down slot 4 (91)');
    click(button('Next step'));
    expect(text()).toContain('Slot 4 has one child, 80 at slot 9.');
  });

  it('draws the heap as a tree and an array of the same values', () => {
    render();
    expect(arrayLabel()).toBe(`Array: ${INITIAL.join(', ')}. Heap is slots 0 to 9.`);
    expect(document.querySelectorAll('svg[aria-label^="Array:"]')).toHaveLength(2);
  });

  it('swaps the maximum to the end on the first extract', () => {
    render();
    const at = heapsortTrace(INITIAL).findIndex((f) => f.kind === 'extract');
    seek(at);
    expect(text()).toContain('The root held the maximum, 91. Swap it to slot 9');
    expect(text()).toContain('Extract max');
    expect(arrayLabel()).toContain('Heap is slots 0 to 8; slots 9 to 9 are sorted.');
  });

  it('ends sorted with the totals', () => {
    render();
    click(button('Last step'));
    const last = heapsortTrace(INITIAL).at(-1);
    expect(text()).toContain(
      `Sorted with ${last?.comparisons} comparisons and ${last?.swaps} swaps, all inside the array.`,
    );
    expect(arrayLabel()).toBe('Array: 7, 12, 19, 26, 35, 44, 58, 63, 80, 91. All sorted.');
  });

  it('loads typed values and refuses bad ones', () => {
    render();
    commit(valuesInput(), '4, 10, 3, 5, 1');
    expect(arrayLabel()).toBe('Array: 4, 10, 3, 5, 1. Heap is slots 0 to 4.');
    commit(valuesInput(), '4, 200');
    expect(text()).toContain('Every value must be from 0 to 99.');
    expect(valuesInput().value).toBe('4, 10, 3, 5, 1');
  });

  it('builds a reversed array with no swaps', () => {
    render();
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'reversed',
    );
    expect(text()).toContain('New array loaded.');
    const build = heapsortTrace(valuesInput().value.split(', ').map(Number)).filter(
      (f) => f.phase === 'build',
    );
    expect(build.at(-1)?.swaps).toBe(0);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Sift down slot 4 (91)');
  });

  it('checks the first practice question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '10, 4, 3, 5, 1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '10, 5, 3, 4, 1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
