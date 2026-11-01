// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/treaps-skip-lists/copy.en.js';
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
const priorityInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="priority"]'));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
const towerSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="tower"]'));
const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const svgLabel = () => document.querySelector('svg[aria-label]')?.getAttribute('aria-label') ?? '';
/** @param {string} value */
function pickMode(value) {
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="mode"][value="${value}"]`)
  ).click();
  flushSync();
}
/** Steps forward until the narration holds `part`. @param {string} part */
function stepTo(part) {
  for (let i = 0; i < 80 && !narration().includes(part); i++) click(button('Next step'));
  expect(narration()).toContain(part);
}

describe('treaps and skip lists lesson', () => {
  it('opens on the skip list search, at the top of the towers', () => {
    render(Page);
    expect(narration()).toContain('Start at the head on level 4');
    expect(svgLabel()).toContain('8 keys and 4 levels');
  });

  it('drops level by level to the target', () => {
    render(Page);
    click(button('Next step'));
    expect(narration()).toContain('drop to level 3');
    stepTo('move right');
    stepTo('Found 70 on the bottom level, after 6 comparisons.');
    expect(stat('rights')).toBe('2');
    expect(stat('drops')).toBe('3');
  });

  it('walks every key on the flat preset', () => {
    render(Page);
    commit(presetSelect(), 'flat');
    stepTo('Found 70');
    expect(stat('comparisons')).toBe('7');
    expect(stat('drops')).toBe('0');
    expect(stat('levels')).toBe('1');
  });

  it('flips a coin per level when inserting, then links the tower', () => {
    render(Page);
    commit(keyInput(), '45');
    commit(towerSelect(), '3');
    click(buttonByText('Insert'));
    stepTo('Heads: the tower grows to height 2.');
    stepTo('Tails: the tower stops at height 3.');
    stepTo('Link the new tower for 45');
    expect(stat('size')).toBe('9');
    expect(svgLabel()).toContain('45 height 3');
  });

  it('flips real coins when the field is left on coin flips', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Insert'));
    expect(rand).toHaveBeenCalled();
    stepTo('Tails: the tower stops at height 1.');
    rand.mockRestore();
  });

  it('searches, deletes, undoes and resets in the skip list', () => {
    render(Page);
    commit(keyInput(), '40');
    click(buttonByText('Delete'));
    stepTo('Unlink the tower');
    expect(stat('size')).toBe('7');
    commit(keyInput(), '41');
    click(buttonByText('Search'));
    stepTo('so 41 is not in the list');
    click(buttonByText('Undo last'));
    expect(presetSelect().value).toBe('');
    click(buttonByText('Reset'));
    expect(narration()).toContain('The list is empty.');
    expect(buttonByText('Reset').getAttribute('aria-disabled')).toBe('true');
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
  });

  it('refuses a key past the size cap and an operation past the log cap', () => {
    render(Page);
    commit(towerSelect(), '1');
    for (let k = 81; k < 86; k++) {
      commit(keyInput(), String(k));
      click(buttonByText('Insert'));
    }
    expect(narration()).toContain('The list is full (12 keys).');
    for (let i = 0; i < 12; i++) click(buttonByText('Search'));
    expect(narration()).toContain('The log is full (24 operations).');
  });

  it('switches to the treap and rotates a node up', () => {
    render(Page);
    pickMode('treap');
    expect(narration()).toContain('The treap is empty.');
    stepTo('moves up');
    click(button('Last step'));
    expect(stat('height')).toBe('4');
    expect(stat('rotations')).toBe('4');
    expect(document.querySelector('svg')?.textContent).toContain('p 7');
  });

  it('keeps each structure when switching away and back', () => {
    render(Page);
    commit(keyInput(), '40');
    click(buttonByText('Delete'));
    click(button('Last step'));
    pickMode('treap');
    commit(keyInput(), '45');
    priorityInput().value = '1';
    priorityInput().dispatchEvent(new Event('input', { bubbles: true }));
    click(buttonByText('Insert'));
    pickMode('skip');
    expect(stat('size')).toBe('7');
    pickMode('treap');
    click(button('Last step'));
    expect(stat('size')).toBe('8');
  });

  it('inserts with a typed priority and rotates it to the root', () => {
    render(Page);
    pickMode('treap');
    commit(presetSelect(), 'chain');
    click(button('Last step'));
    expect(stat('height')).toBe('7');
    commit(keyInput(), '45');
    commit(priorityInput(), '0');
    click(buttonByText('Insert'));
    stepTo('Attach 45 as a leaf with priority 0.');
    click(button('Last step'));
    expect(stat('height')).toBe('5');
  });

  it('draws a random priority when the field is blank', () => {
    const rand = vi.spyOn(Math, 'random');
    render(Page);
    pickMode('treap');
    const before = rand.mock.calls.length;
    commit(keyInput(), '45');
    click(buttonByText('Insert'));
    expect(rand.mock.calls.length).toBeGreaterThan(before);
    rand.mockRestore();
  });

  it('refuses a bad priority and clears the field', () => {
    render(Page);
    pickMode('treap');
    commit(priorityInput(), '500');
    expect(narration()).toContain('Priorities must be whole numbers');
    expect(priorityInput().value).toBe('');
  });

  it('deletes from the treap by rotating down', () => {
    render(Page);
    pickMode('treap');
    click(button('Last step'));
    commit(keyInput(), '20');
    click(buttonByText('Delete'));
    stepTo('rotate it down until it is a leaf');
    stepTo('moves up and 20 moves down');
    stepTo('The node is a leaf now');
    expect(stat('size')).toBe('6');
  });

  it('gives the same treap from the reordered pairs', () => {
    render(Page);
    pickMode('treap');
    click(button('Last step'));
    const shape = document.querySelector('svg')?.getAttribute('aria-label');
    commit(presetSelect(), 'reordered');
    click(button('Last step'));
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe(shape);
    expect(stat('height')).toBe('4');
    expect(stat('rotations')).toBe('5');
  });

  it('picks a treap node by pointer and keyboard', () => {
    render(Page);
    pickMode('treap');
    click(button('Last step'));
    const nodes = [...document.querySelectorAll('svg [role="button"]')];
    expect(nodes.length).toBe(7);
    nodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    const first = keyInput().value;
    expect(first).not.toBe('45');
    nodes[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(keyInput().value).not.toBe(first);
  });

  it('lets the random presets be chosen twice in a row', () => {
    const rand = vi.spyOn(Math, 'random');
    render(Page);
    commit(presetSelect(), 'random');
    expect(presetSelect().value).toBe('');
    pickMode('treap');
    commit(presetSelect(), 'random');
    expect(presetSelect().value).toBe('');
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
    submit('6');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
