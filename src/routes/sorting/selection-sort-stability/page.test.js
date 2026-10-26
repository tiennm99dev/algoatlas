// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/selection-sort-stability/copy.en.js';

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

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const keysInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="keys"]'));
const cards = () =>
  document.querySelector('ol[aria-label^="Cards in order"]')?.getAttribute('aria-label');

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {string} value */
function pickVariant(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

describe('selection sort and stability lesson', () => {
  it('starts on the first pass and scans for the minimum', () => {
    render();
    expect(cards()).toBe('Cards in order: 3a, 4a, 3b, 1a, 4b, 2a. 0 of 6 in final place.');
    click(button('Next step'));
    expect(text()).toContain('Pass 1: fill slot 0. Start with min = 0 (3a).');
    click(button('Next step'));
    expect(text()).toContain('4a is not smaller than 3a: min stays at slot 0.');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('1a < the old minimum: min moves to slot 3.');
  });

  it('ends unstable with the swap version and stable with the shift version', () => {
    render();
    click(button('Last step'));
    expect(text()).toContain('Sorted with 15 comparisons and 4 slots written.');
    expect(text()).toContain('Not stable here: key 3 now reads b, a.');
    expect(cards()).toContain('1a, 2a, 3b, 3a, 4b, 4a');
    pickVariant('shift');
    click(button('Last step'));
    expect(text()).toContain('Sorted with 15 comparisons and 11 slots written.');
    expect(text()).toContain('Every repeated key kept its input order.');
    expect(cards()).toContain('1a, 2a, 3a, 3b, 4a, 4b');
  });

  it('compares both versions on the same keys', () => {
    render();
    expect(text()).toMatch(/Swap \(classic\)\s*15 comparisons · 4 slots written/);
    expect(text()).toMatch(/Shift \(stable\)\s*15 comparisons · 11 slots written/);
    expect(text()).toContain('equal keys were reordered');
    expect(text()).toContain('equal keys kept their order');
  });

  it('describes the jump of a swap and the shift of a rotation', () => {
    render();
    for (let i = 0; i < 7; i++) click(button('Next step'));
    expect(text()).toContain('Swap slots 0 and 3: 1a goes to the front, and 3a jumps to slot 3');
    pickVariant('shift');
    for (let i = 0; i < 7; i++) click(button('Next step'));
    expect(text()).toContain('shift the 3 cards in between one slot right');
  });

  it('loads typed keys and tags the repeats', () => {
    render();
    commit(keysInput(), '2, 2, 1');
    expect(cards()).toBe('Cards in order: 2a, 2b, 1a. 0 of 3 in final place.');
    click(button('Last step'));
    expect(cards()).toContain('1a, 2b, 2a');
    expect(text()).toContain('2: b → a');
    expect(text()).toContain('✕ reordered');
  });

  it('refuses bad keys with a notice and keeps the last valid ones', () => {
    render();
    commit(keysInput(), '3, banana');
    expect(text()).toContain('Type whole numbers separated by commas or spaces');
    expect(keysInput().value).toBe('3, 4, 3, 1, 4, 2');
    commit(keysInput(), '7');
    expect(text()).toContain('Type from 2 to 10 keys.');
    commit(keysInput(), '7, 120');
    expect(text()).toContain('Every key must be from 0 to 99.');
  });

  it('submits the keys with Enter', () => {
    render();
    const input = keysInput();
    input.value = '5, 1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.requestSubmit();
    flushSync();
    expect(cards()).toBe('Cards in order: 5a, 1a. 0 of 2 in final place.');
  });

  it('draws random keys of the same length', () => {
    render();
    click(buttonByText('Random'));
    expect(keysInput().value.split(', ')).toHaveLength(6);
  });

  it('says when no key repeats', () => {
    render();
    commit(keysInput(), '4, 1, 3');
    expect(text()).toContain('No key repeats.');
    click(button('Last step'));
    expect(text()).toContain('No key repeats, so stability cannot show.');
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
    answer.value = '64';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '28';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
