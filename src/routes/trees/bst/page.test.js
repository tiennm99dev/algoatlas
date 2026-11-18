// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { vi as m } from '$lib/lessons/bst/copy.vi.js';
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
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cây có 7 khoá, chiều cao 3.');
  });

  it('inserts a key and walks from the root', () => {
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Chèn'));
    expect(text()).toContain('So sánh 45 với 50.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cây có 8 khoá, chiều cao 4.');
  });

  it('ignores a duplicate insert', () => {
    render(Page);
    commit(keyInput(), '30');
    click(buttonByText('Chèn'));
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(text()).toContain('30 đã có trong cây');
  });

  it('deletes the root with its successor', () => {
    render(Page);
    commit(keyInput(), '50');
    click(buttonByText('Xoá'));
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(text()).toContain('khoá nhỏ nhất trong cây con phải, đó là 60');
    click(button('Đến bước cuối'));
    expect(treeLabel()).toContain('Theo thứ tự: 20, 30, 40, 60, 70, 80.');
  });

  it('shows the sorted preset degenerating into a list', () => {
    render(Page);
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'sorted',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('chiều cao 7');
    expect(text()).toContain('Chiều cao nếu cân bằng hoàn hảo: 3');
  });

  it('undoes the last operation', () => {
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Chèn'));
    click(buttonByText('Hoàn tác'));
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cây có 7 khoá, chiều cao 3.');
  });

  it('refuses an operation asked for right after an out-of-range key', () => {
    render(Page);
    commit(keyInput(), '45');
    const before = treeLabel();
    commit(keyInput(), '150');
    click(buttonByText('Tìm'));
    expect(text()).toContain(m.keyError);
    expect(treeLabel()).toBe(before);
    expect(keyInput().value).toBe('45');
  });

  it('refuses on Enter too, and shows why', () => {
    render(Page);
    const before = treeLabel();
    const input = keyInput();
    input.focus();
    input.value = '150';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.addEventListener('blur', () =>
      input.dispatchEvent(new Event('change', { bubbles: true })),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(text()).toContain(m.keyError);
    expect(treeLabel()).toBe(before);
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
      click(buttonByText('Chèn'));
    }
    expect(text()).toContain('Cây đã đầy (15 khoá).');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cây có 15 khoá');
  });

  it('empties the log on reset and labels every drawn node', () => {
    render(Page);
    expect(document.querySelectorAll('svg[role="img"] title')).toHaveLength(0);
    click(button('Đến bước cuối'));
    expect(document.querySelectorAll('svg[role="img"] title')).toHaveLength(7);
    click(buttonByText('Đặt lại'));
    expect(text()).toContain('chưa có');
    expect(text()).toContain('Cây đang rỗng.');
  });

  it('keeps focus on Reset and Undo and marks them aria-disabled when the log is empty', () => {
    render(Page);
    const reset = buttonByText('Đặt lại');
    reset.focus();
    click(reset);
    expect(document.activeElement).toBe(reset);
    expect(reset.getAttribute('aria-disabled')).toBe('true');
    expect(reset.disabled).toBe(false);
    const undo = buttonByText('Hoàn tác');
    expect(undo.getAttribute('aria-disabled')).toBe('true');
    click(undo);
    expect(text()).toContain('Cây đang rỗng.');
  });

  it('shows a refusal in place of the narration and drops it on the next step', () => {
    render(Page);
    for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      commit(keyInput(), String(k));
      click(buttonByText('Chèn'));
    }
    const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
    expect(narration()).toContain('Cây đã đầy (15 khoá).');
    click(button('Bước tiếp'));
    expect(narration()).not.toContain('Cây đã đầy');
  });

  it('lets a preset be applied again after Reset', () => {
    render(Page);
    const select = /** @type {HTMLSelectElement} */ (
      document.querySelector('select[name="preset"]')
    );
    commit(select, 'sorted');
    click(buttonByText('Đặt lại'));
    expect(select.value).toBe('');
    commit(select, 'sorted');
    click(button('Đến bước cuối'));
    expect(text()).toContain('chiều cao 7');
    click(buttonByText('Hoàn tác'));
    expect(select.value).toBe('');
  });

  it('wraps the tree in a focusable, labelled horizontal scroller', () => {
    render(Page);
    const scroller = document.querySelector('svg[role="img"]')?.parentElement;
    expect(scroller?.getAttribute('tabindex')).toBe('0');
    expect(scroller?.getAttribute('aria-label')).toBeTruthy();
    expect(scroller?.className).toContain('overflow-x-auto');
    // Marked as a scroll frame, so the arrow keys scroll it instead of stepping the player.
    expect(scroller?.hasAttribute('data-scroll-frame')).toBe(true);
  });

  it('inserts when Enter submits the key field and does not submit on Search', () => {
    render(Page);
    commit(keyInput(), '45');
    const form = /** @type {HTMLFormElement} */ (keyInput().closest('form'));
    form.requestSubmit();
    flushSync();
    expect(text()).toContain('So sánh 45 với 50.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cây có 8 khoá');
    expect(buttonByText('Tìm').type).toBe('button');
    expect(buttonByText('Xoá').type).toBe('button');
    expect(buttonByText('Hoàn tác').type).toBe('button');
    expect(buttonByText('Đặt lại').type).toBe('button');
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
    click(button('Đến bước cuối'));
    expect(treeLabel()).toContain('Gốc 50. Nếu cân bằng, chiều cao sẽ là 3.');
  });
});
