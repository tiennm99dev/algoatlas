// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/avl-trees/copy.en.js';
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

describe('AVL trees lesson', () => {
  it('starts empty and walks the left-right case to a balanced tree', () => {
    render(Page);
    expect(narration()).toContain('The tree is empty.');
    click(button('Last step'));
    expect(stat('height')).toBe('2');
    expect(stat('rotations')).toBe('2');
    expect(narration()).toContain('every balance factor within ±1');
  });

  it('narrates the walk, the broken factor and each rotation', () => {
    render(Page);
    /** @type {string[]} */
    const seen = [];
    for (let i = 0; i < 20; i++) {
      seen.push(narration());
      if (button('Next step').getAttribute('aria-disabled') === 'true') break;
      click(button('Next step'));
    }
    const all = seen.join(' | ');
    expect(all).toContain('10 < 30, so go left.');
    expect(all).toContain('This is the LR case.');
    expect(all).toContain('First half of LR');
    expect(all).toContain('Rotate right at 30');
  });

  it('highlights the current repair case in the table', () => {
    render(Page);
    for (let i = 0; i < 40; i++) {
      if (narration().includes('LR case')) break;
      click(button('Next step'));
    }
    expect(document.querySelector('[data-testid="case-LR"]')?.textContent).toContain('(now)');
    expect(document.querySelector('[data-testid="case-LL"]')?.textContent).not.toContain('(now)');
  });

  it('states the height limit that matches the fewest keys per height', () => {
    /** @type {number[]} */
    const fewest = [0, 1];
    for (let h = 2; h <= 7; h++) fewest[h] = fewest[h - 1] + fewest[h - 2] + 1;
    for (let n = 1; n <= 33; n++) {
      const limit = fewest.findLastIndex((count) => count <= n);
      expect(m.bound(n)).toContain(`at most ${limit}.`);
    }
  });

  it('shows balance factors on the nodes', () => {
    render(Page);
    click(button('Last step'));
    expect(document.querySelector('svg')?.textContent).toContain('bf 0');
  });

  it('inserts, searches and deletes a typed key', () => {
    render(Page);
    commit(keyInput(), '25');
    click(buttonByText('Insert'));
    expect(narration()).toContain('Compare 25 with 20.');
    click(button('Last step'));
    expect(stat('height')).toBe('3');
    commit(keyInput(), '25');
    click(buttonByText('Search'));
    click(button('Last step'));
    expect(stat('height')).toBe('3');
    click(buttonByText('Delete'));
    click(button('Last step'));
    expect(stat('height')).toBe('2');
  });

  it('runs a preset, undoes its last step and resets', () => {
    render(Page);
    commit(presetSelect(), 'sorted');
    click(button('Last step'));
    expect(stat('rotations')).toBe('6');
    expect(stat('height')).toBe('4');
    click(buttonByText('Undo last'));
    expect(presetSelect().value).toBe('');
    expect(stat('rotations')).toBe('5');
    click(buttonByText('Reset'));
    expect(narration()).toContain('The tree is empty.');
    expect(buttonByText('Reset').getAttribute('aria-disabled')).toBe('true');
  });

  it('repairs at two levels on the cascading delete', () => {
    render(Page);
    commit(presetSelect(), 'cascade');
    click(button('Last step'));
    expect(stat('op-rotations')).toBe('0');
    expect(stat('height')).toBe('4');
    let delta = 0;
    while (button('Previous step').getAttribute('aria-disabled') !== 'true' && delta < 40) {
      click(button('Previous step'));
      delta++;
      if (stat('op-rotations') === '3') break;
    }
    expect(stat('op-rotations')).toBe('3');
  });

  it('keeps the last valid key and refuses a bad key with a notice', () => {
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

  it('refuses a key past the size cap', () => {
    render(Page);
    for (let k = 40; k < 53; k++) {
      commit(keyInput(), String(k));
      click(buttonByText('Insert'));
    }
    expect(narration()).toContain('The tree is full (15 keys).');
  });

  it('refuses an operation past the log cap', () => {
    render(Page);
    for (let i = 0; i < 18; i++) click(buttonByText('Search'));
    expect(narration()).toContain('The log is full (20 operations).');
  });

  it('lets a node be picked by pointer and keyboard', () => {
    render(Page);
    click(button('Last step'));
    const nodes = [...document.querySelectorAll('svg [role="button"]')];
    expect(nodes.length).toBe(3);
    nodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    const first = keyInput().value;
    expect(['10', '20', '30']).toContain(first);
    nodes[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(keyInput().value).not.toBe(first);
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
    submit('2');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
