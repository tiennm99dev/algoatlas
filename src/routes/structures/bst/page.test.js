// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
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

const text = () => document.body.textContent ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const keyInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="key"]'));
const treeLabel = () => document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';

describe('binary search tree lesson', () => {
  it('ends the balanced preset at 7 keys and height 3', () => {
    render(Page);
    click(button('Last step'));
    expect(text()).toContain('Tree has 7 keys, height 3.');
  });

  it('inserts a key and walks from the root', () => {
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Insert'));
    expect(text()).toContain('Compare 45 with 50.');
    click(button('Last step'));
    expect(text()).toContain('Tree has 8 keys, height 4.');
  });

  it('ignores a duplicate insert', () => {
    render(Page);
    commit(keyInput(), '30');
    click(buttonByText('Insert'));
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain('30 is already in the tree');
  });

  it('deletes the root with its successor', () => {
    render(Page);
    commit(keyInput(), '50');
    click(buttonByText('Delete'));
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain('smallest key in the right subtree, 60');
    click(button('Last step'));
    expect(treeLabel()).toContain('In order: 20, 30, 40, 60, 70, 80.');
  });

  it('shows the sorted preset degenerating into a list', () => {
    render(Page);
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'sorted',
    );
    click(button('Last step'));
    expect(text()).toContain('height 7');
    expect(text()).toContain('Perfectly balanced height: 3');
  });

  it('undoes the last operation', () => {
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Insert'));
    click(buttonByText('Undo last'));
    click(button('Last step'));
    expect(text()).toContain('Tree has 7 keys, height 3.');
  });

  it('keeps the last valid key when the field is emptied or out of range', () => {
    render(Page);
    commit(keyInput(), '45');
    commit(keyInput(), '');
    expect(keyInput().value).toBe('45');
    commit(keyInput(), '150');
    expect(keyInput().value).toBe('45');
  });

  it('refuses an insert into a full tree', () => {
    render(Page);
    for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      commit(keyInput(), String(k));
      click(buttonByText('Insert'));
    }
    expect(text()).toContain('The tree is full (15 keys).');
    click(button('Last step'));
    expect(text()).toContain('Tree has 15 keys');
  });

  it('empties the log on reset and labels every drawn node', () => {
    render(Page);
    expect(document.querySelectorAll('svg[role="img"] title')).toHaveLength(0);
    click(button('Last step'));
    expect(document.querySelectorAll('svg[role="img"] title')).toHaveLength(7);
    click(buttonByText('Reset'));
    expect(text()).toContain('none yet');
    expect(text()).toContain('The tree is empty.');
  });

  it('keeps focus on Reset and Undo and marks them aria-disabled when the log is empty', () => {
    render(Page);
    const reset = buttonByText('Reset');
    reset.focus();
    click(reset);
    expect(document.activeElement).toBe(reset);
    expect(reset.getAttribute('aria-disabled')).toBe('true');
    expect(reset.disabled).toBe(false);
    const undo = buttonByText('Undo last');
    expect(undo.getAttribute('aria-disabled')).toBe('true');
    click(undo);
    expect(text()).toContain('The tree is empty.');
  });

  it('shows a refusal in place of the narration and drops it on the next step', () => {
    render(Page);
    for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      commit(keyInput(), String(k));
      click(buttonByText('Insert'));
    }
    const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
    expect(narration()).toContain('The tree is full (15 keys).');
    click(button('Next step'));
    expect(narration()).not.toContain('The tree is full');
  });

  it('lets a preset be applied again after Reset', () => {
    render(Page);
    const select = /** @type {HTMLSelectElement} */ (
      document.querySelector('select[name="preset"]')
    );
    commit(select, 'sorted');
    click(buttonByText('Reset'));
    expect(select.value).toBe('');
    commit(select, 'sorted');
    click(button('Last step'));
    expect(text()).toContain('height 7');
    click(buttonByText('Undo last'));
    expect(select.value).toBe('');
  });

  it('wraps the tree in a focusable, labelled horizontal scroller', () => {
    render(Page);
    const scroller = document.querySelector('svg[role="img"]')?.parentElement;
    expect(scroller?.getAttribute('tabindex')).toBe('0');
    expect(scroller?.getAttribute('aria-label')).toBeTruthy();
    expect(scroller?.className).toContain('overflow-x-auto');
  });

  it('inserts when Enter submits the key field and does not submit on Search', () => {
    render(Page);
    commit(keyInput(), '45');
    const form = /** @type {HTMLFormElement} */ (keyInput().closest('form'));
    form.requestSubmit();
    flushSync();
    expect(text()).toContain('Compare 45 with 50.');
    click(button('Last step'));
    expect(text()).toContain('Tree has 8 keys');
    expect(buttonByText('Search').type).toBe('button');
    expect(buttonByText('Delete').type).toBe('button');
    expect(buttonByText('Undo last').type).toBe('button');
    expect(buttonByText('Reset').type).toBe('button');
  });

  it('lets the random preset be chosen twice in a row', () => {
    const rand = vi.spyOn(Math, 'random');
    render(Page);
    const select = /** @type {HTMLSelectElement} */ (
      document.querySelector('select[name="preset"]')
    );
    commit(select, 'random');
    const first = rand.mock.calls.length;
    expect(first).toBeGreaterThan(0);
    expect(select.value).toBe('');
    commit(select, 'random');
    expect(rand.mock.calls.length).toBeGreaterThan(first);
    rand.mockRestore();
  });

  it('describes the root and the balanced height in the tree label', () => {
    render(Page);
    click(button('Last step'));
    expect(treeLabel()).toContain('Root 50. Balanced height would be 3.');
  });
});
