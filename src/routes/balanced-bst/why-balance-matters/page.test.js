// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/why-balance-matters/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component @param {Record<string, any>} [props] */
function render(Component, props = {}) {
  app = mount(Component, { target: document.body, props });
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

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
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

const keysInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="keys"]'));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
/** @param {'plain'|'avl'} id */
const heightOf = (id) => document.querySelector(`[data-testid="${id}-height"]`)?.textContent;

describe('why balance matters lesson', () => {
  it('starts with two empty trees and a first narration', () => {
    render(Page);
    expect(narration()).toContain('Both trees start empty');
    expect(heightOf('plain')).toBe('0');
    expect(heightOf('avl')).toBe('0');
  });

  it('ends the sorted preset with a list against a shallow tree', () => {
    render(Page);
    click(button('Last step'));
    expect(heightOf('plain')).toBe('10');
    expect(heightOf('avl')).toBe('4');
    expect(narration()).toContain('Plain BST height 10 and 45 comparisons');
  });

  it('narrates each tree in turn as it steps', () => {
    render(Page);
    click(button('Next step'));
    expect(narration()).toContain('Key 1 becomes the root of the plain BST.');
    click(button('Next step'));
    expect(narration()).toContain('Key 1 becomes the root of the AVL tree.');
  });

  it('runs a typed list and shows a rotation', () => {
    render(Page);
    commit(keysInput(), '30, 10, 20');
    expect(presetSelect().value).toBe('');
    for (let i = 0; i < 7; i++) click(button('Next step'));
    expect(narration()).toContain('The heavy side bends inward');
    click(button('Next step'));
    expect(narration()).toContain('rotate right at 30');
    click(button('Last step'));
    expect(heightOf('plain')).toBe('3');
    expect(heightOf('avl')).toBe('2');
  });

  it('runs the list when the form is submitted', () => {
    render(Page);
    keysInput().value = '5, 3';
    keysInput().dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (keysInput().closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(heightOf('plain')).toBe('2');
  });

  it('refuses a bad list with a notice and keeps the last valid one', () => {
    render(Page);
    commit(keysInput(), '1, 1');
    expect(narration()).toContain('Each key may appear only once.');
    expect(keysInput().value).toBe('1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
    click(button('Next step'));
    expect(narration()).not.toContain('only once');
    commit(keysInput(), '');
    expect(narration()).toContain('Type at least one key.');
    commit(keysInput(), '500');
    expect(narration()).toContain('from 0 to 99');
  });

  it('switches presets, including a random one that can be picked twice', () => {
    render(Page);
    commit(presetSelect(), 'balanced');
    click(button('Last step'));
    expect(heightOf('plain')).toBe('4');
    expect(narration()).toContain('after 0 rotations');
    const rand = vi.spyOn(Math, 'random');
    commit(presetSelect(), 'random');
    const first = rand.mock.calls.length;
    expect(first).toBeGreaterThan(0);
    expect(presetSelect().value).toBe('');
    commit(presetSelect(), 'random');
    expect(rand.mock.calls.length).toBeGreaterThan(first);
    rand.mockRestore();
  });

  it('resets to the sorted preset', () => {
    render(Page);
    commit(keysInput(), '5, 3');
    click(buttonByText('Reset'));
    expect(keysInput().value).toContain('10');
    expect(presetSelect().value).toBe('sorted');
    expect(narration()).toContain('Both trees start empty');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render(Page);
    const block = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (block.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const submit = (value) => {
      answer.value = value;
      answer.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    submit('5');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    submit('28');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
