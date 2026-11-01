// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/red-black-trees/copy.en.js';
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

const keyInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="key"]'));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** Steps forward until the narration holds `part`. @param {string} part */
function stepTo(part) {
  for (let i = 0; i < 120 && !narration().includes(part); i++) click(button('Next step'));
  expect(narration()).toContain(part);
}

describe('red-black trees lesson', () => {
  it('starts empty and ends the textbook example with root 7', () => {
    render(Page);
    expect(narration()).toContain('The tree is empty.');
    click(button('Last step'));
    expect(stat('black-height')).toBe('2');
    expect(stat('height')).toBe('4');
    expect(stat('rotations')).toBe('2');
    expect(document.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toContain(
      'In order: 1, 2, 4, 5, 7, 8, 11, 14, 15.',
    );
  });

  it('shows colour in text as well as on the fill', () => {
    render(Page);
    click(button('Last step'));
    expect(document.querySelectorAll('svg [data-color="red"]').length).toBeGreaterThan(0);
    expect(document.querySelector('svg')?.textContent).toContain('B bh 2');
    expect(document.querySelector('svg title')?.textContent).toMatch(/Key \d+, (red|black), bh/);
  });

  it('flags a red-red pair in the rule list and clears it after the repair', () => {
    render(Page);
    commit(presetSelect(), 'outer');
    stepTo('is red and so is its parent');
    expect(document.querySelector('[data-testid="rule-red-red"]')?.textContent).toContain('✗');
    stepTo('moves up in black');
    expect(document.querySelector('[data-testid="rule-red-red"]')?.textContent).toContain('✓');
  });

  it('narrates each kind of repair', () => {
    render(Page);
    commit(presetSelect(), 'uncle');
    stepTo('The uncle is red');
    expect(document.querySelector('[data-testid="rule-root"]')?.textContent).toContain('✗');
    stepTo('The root is red, so paint it black');
    commit(presetSelect(), 'inner');
    stepTo('inner child');
    stepTo('ready to rotate');
    stepTo('moves up in black');
  });

  it('inserts a typed key, searches it and ignores a repeat', () => {
    render(Page);
    commit(keyInput(), '6');
    click(buttonByText('Insert'));
    expect(narration()).toContain('Compare 6 with 7.');
    click(button('Last step'));
    expect(stat('size')).toBe('10');
    click(buttonByText('Search'));
    stepTo('Found 6');
    click(buttonByText('Insert'));
    stepTo('is already in the tree');
  });

  it('undoes the last operation and resets', () => {
    render(Page);
    click(buttonByText('Undo last'));
    expect(stat('size')).toBe('8');
    expect(presetSelect().value).toBe('');
    click(buttonByText('Reset'));
    expect(narration()).toContain('The tree is empty.');
    const reset = buttonByText('Reset');
    expect(reset.getAttribute('aria-disabled')).toBe('true');
    expect(reset.disabled).toBe(false);
  });

  it('keeps the last valid key and refuses a bad one with a notice', () => {
    render(Page);
    commit(keyInput(), '45');
    commit(keyInput(), '');
    expect(keyInput().value).toBe('45');
    keyInput().value = '150';
    keyInput().dispatchEvent(new Event('input', { bubbles: true }));
    click(buttonByText('Search'));
    expect(narration()).toContain('whole numbers from 0 to 99');
    expect(keyInput().value).toBe('45');
    click(button('Next step'));
    expect(narration()).not.toContain('whole numbers');
  });

  it('refuses a key past the size cap and an operation past the log cap', () => {
    render(Page);
    for (let k = 40; k < 47; k++) {
      commit(keyInput(), String(k));
      click(buttonByText('Insert'));
    }
    expect(narration()).toContain('The tree is full (15 keys).');
    for (let i = 0; i < 10; i++) click(buttonByText('Search'));
    expect(narration()).toContain('The log is full (24 operations).');
  });

  it('inserts when Enter submits the form', () => {
    render(Page);
    commit(keyInput(), '6');
    /** @type {HTMLFormElement} */ (keyInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toContain('Compare 6 with 7.');
    expect(buttonByText('Search').type).toBe('button');
  });

  it('lets the random preset be chosen twice in a row', () => {
    const rand = vi.spyOn(Math, 'random');
    render(Page);
    commit(presetSelect(), 'random');
    const first = rand.mock.calls.length;
    expect(first).toBeGreaterThan(0);
    expect(presetSelect().value).toBe('');
    commit(presetSelect(), 'random');
    expect(rand.mock.calls.length).toBeGreaterThan(first);
    rand.mockRestore();
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
    submit('3');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
