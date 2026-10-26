// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { binaryHeapTrace, makeHeapOps } from '$lib/algo-engine/binary-heaps.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/binary-heaps/copy.en.js';

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
const valueInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="value"]'));
const heapLabel = () =>
  document.querySelector('svg[aria-label*="eap"]')?.getAttribute('aria-label') ?? '';
function submit() {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('binary heaps lesson', () => {
  it('starts on an empty min-heap and runs the log to the end', () => {
    render();
    expect(text()).toContain('An empty min-heap.');
    click(button('Next step'));
    expect(text()).toContain('Insert 42: put it in the next free slot, 0');
    click(button('Last step'));
    const last = binaryHeapTrace(makeHeapOps('build')).at(-1);
    expect(heapLabel()).toContain(`Min-heap of 8, array: ${last?.values.join(', ')}.`);
    expect(text()).toContain(`${last?.comparisons} comparisons and ${last?.swaps} swaps`);
  });

  it('inserts a typed value and jumps to its first step', () => {
    render();
    commit(valueInput(), '1');
    submit();
    expect(text()).toContain('Insert 1: put it in the next free slot, 8');
    click(button('Last step'));
    expect(heapLabel()).toMatch(/^Min-heap of 9, array: 1, /);
  });

  it('extracts the minimum and lists it as removed', () => {
    render();
    click(buttonByText('Extract min'));
    expect(text()).toContain('Take the root 8, the smallest value.');
    click(button('Last step'));
    expect(text()).toContain('Removed, in order');
    expect(heapLabel()).toMatch(/^Min-heap of 7, /);
  });

  it('switches to a max-heap on the same log', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="max"]')));
    expect(buttonByText('Extract max')).toBeTruthy();
    expect(heapLabel()).toContain(
      `Max-heap of 8, array: ${binaryHeapTrace(makeHeapOps('build'), 'max').at(-1)?.values.join(', ')}.`,
    );
    expect(text()).toContain('Top: the maximum');
  });

  it('undoes, resets and loads a preset', () => {
    render();
    click(buttonByText(m.undo));
    expect(heapLabel()).toMatch(/^Min-heap of 9, array: 5, /);
    click(buttonByText(m.reset));
    expect(text()).toContain('An empty min-heap.');
    click(buttonByText('Extract min'));
    expect(text()).toContain(m.emptyError);
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'drain');
    click(button('Last step'));
    expect(text()).toContain('The heap is empty.');
  });

  it('refuses a bad value and keeps the last valid one', () => {
    render();
    commit(valueInput(), '150');
    expect(valueInput().value).toBe('12');
    valueInput().value = '';
    valueInput().dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(text()).toContain(m.valueError);
  });

  it('refuses inserts into a full heap', () => {
    render();
    for (let i = 0; i < 8; i++) {
      commit(valueInput(), String(i));
      submit();
    }
    expect(text()).toContain(m.full);
  });

  it('shows a slot’s parent and children from the keyboard', () => {
    render();
    click(button('Last step'));
    const cells = [...document.querySelectorAll('[role="button"]')];
    const slot3 = /** @type {HTMLElement} */ (
      cells.find((c) => c.getAttribute('aria-label')?.startsWith('Slot 3:'))
    );
    slot3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('Slot 3: parent ⌊(3 − 1)/2⌋ = 1; children 2·3 + 1 = 7.');
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
