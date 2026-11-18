// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/b-trees/copy.vi.js';
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
/** @param {string} value */
function pickOrder(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="order"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}
/** Steps forward until the narration holds `part`. @param {string} part */
function stepTo(part) {
  for (let i = 0; i < 80 && !narration().includes(part); i++) click(button('Bước tiếp'));
  expect(narration()).toContain(part);
}
const treeLabel = () => document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';

describe('B-trees lesson', () => {
  it('starts empty and grows to three levels at order 3', () => {
    render(Page);
    expect(narration()).toContain('Cây đang rỗng.');
    click(button('Đến bước cuối'));
    expect(stat('height')).toBe('3');
    expect(stat('splits')).toBe('4');
    expect(treeLabel()).toContain('Tầng 1: 40. Tầng 2: 20, 60. Tầng 3: 10, 30, 50, 70.');
  });

  it('narrates a split and a new root', () => {
    render(Page);
    stepTo('thừa một khoá so với bậc 3');
    stepTo('trở thành gốc mới');
    expect(stat('splits')).toBe('1');
    stepTo('được đẩy lên nút cha, và các khoá');
  });

  it('rebuilds the same log when the order changes', () => {
    render(Page);
    pickOrder('5');
    expect(treeLabel()).toContain('Cây B bậc 5, chiều cao 2.');
    expect(stat('height')).toBe('2');
    pickOrder('4');
    expect(treeLabel()).toContain('Tầng 1: 20, 40.');
  });

  it('merges, shrinks and borrows on the delete preset', () => {
    render(Page);
    commit(presetSelect(), 'merge');
    stepTo('Xoá khoá khỏi lá.');
    stepTo('nhìn sang các nút anh em');
    stepTo('Không nút anh em nào dư khoá');
    stepTo('con duy nhất của nó trở thành gốc');
    expect(stat('height')).toBe('2');
    stepTo('nằm ở một nút trong');
    stepTo('Một nút anh em dư được một khoá');
    click(button('Đến bước cuối'));
    expect(stat('fixes')).toBe('3');
    expect(treeLabel()).toContain('Tầng 1: 20, 50. Tầng 2: 10, 30, 60.');
  });

  it('inserts, searches and deletes a typed key', () => {
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Chèn'));
    expect(narration()).toContain('Đọc một nút');
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('8');
    click(buttonByText('Tìm'));
    stepTo('Đã tìm thấy 45 sau');
    expect(stat('reads')).toBe('3');
    click(buttonByText('Xoá'));
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('7');
  });

  it('undoes the last operation and resets', () => {
    render(Page);
    click(buttonByText('Hoàn tác'));
    expect(stat('size')).toBe('6');
    expect(presetSelect().value).toBe('');
    click(buttonByText('Đặt lại'));
    expect(narration()).toContain('Cây đang rỗng.');
    const reset = buttonByText('Đặt lại');
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
    click(buttonByText('Tìm'));
    expect(narration()).toContain('số nguyên từ 0 đến 99');
    expect(keyInput().value).toBe('45');
    click(button('Bước tiếp'));
    expect(narration()).not.toContain('số nguyên');
  });

  it('refuses a key past the size cap and an operation past the log cap', () => {
    render(Page);
    for (let k = 1; k < 16; k++) {
      commit(keyInput(), String(k));
      click(buttonByText('Chèn'));
    }
    expect(narration()).toContain('Cây đã đầy (20 khoá).');
    for (let i = 0; i < 4; i++) click(buttonByText('Tìm'));
    expect(narration()).toContain('Danh sách thao tác đã đầy (24 thao tác).');
  });

  it('inserts when Enter submits the form', () => {
    render(Page);
    commit(keyInput(), '45');
    /** @type {HTMLFormElement} */ (keyInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toContain('Đọc một nút');
    expect(buttonByText('Tìm').type).toBe('button');
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
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    submit('3');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('marks a node being read apart from a node just changed', () => {
    render(Page);
    const title = () => document.querySelector('g[data-node] title')?.textContent ?? '';
    stepTo('Đọc một nút');
    click(button('Bước tiếp'));
    stepTo('Thêm 20 vào lá');
    expect(title()).toContain('vừa thay đổi');
    expect(title()).not.toContain('đang đọc');
  });
});
