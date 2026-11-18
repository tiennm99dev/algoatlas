// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/red-black-trees/copy.vi.js';
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
  for (let i = 0; i < 120 && !narration().includes(part); i++) click(button('Bước tiếp'));
  expect(narration()).toContain(part);
}

describe('red-black trees lesson', () => {
  it('starts empty and ends the textbook example with root 7', () => {
    render(Page);
    expect(narration()).toContain('Cây đang rỗng.');
    click(button('Đến bước cuối'));
    expect(stat('black-height')).toBe('2');
    expect(stat('height')).toBe('4');
    expect(stat('rotations')).toBe('2');
    expect(document.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toContain(
      'Theo thứ tự giữa: 1, 2, 4, 5, 7, 8, 11, 14, 15.',
    );
  });

  it('shows colour in text as well as on the fill', () => {
    render(Page);
    click(button('Đến bước cuối'));
    expect(document.querySelectorAll('svg [data-color="red"]').length).toBeGreaterThan(0);
    expect(document.querySelector('svg')?.textContent).toContain('đen bh 2');
    expect(document.querySelector('svg title')?.textContent).toMatch(/Khoá \d+, (đỏ|đen), bh/);
  });

  it('flags a red-red pair in the rule list and clears it after the repair', () => {
    render(Page);
    commit(presetSelect(), 'outer');
    stepTo('của nó cũng đỏ');
    expect(document.querySelector('[data-testid="rule-red-red"]')?.textContent).toContain('✗');
    stepTo('được đưa lên với màu đen');
    expect(document.querySelector('[data-testid="rule-red-red"]')?.textContent).toContain('✓');
  });

  it('narrates each kind of repair', () => {
    render(Page);
    commit(presetSelect(), 'uncle');
    stepTo('Nút chú màu đỏ');
    expect(document.querySelector('[data-testid="rule-root"]')?.textContent).toContain('✗');
    stepTo('Gốc đang đỏ, nên tô nó thành đen');
    commit(presetSelect(), 'inner');
    stepTo('con phía trong');
    stepTo('sẵn sàng để quay');
    stepTo('được đưa lên với màu đen');
  });

  it('inserts a typed key, searches it and ignores a repeat', () => {
    render(Page);
    commit(keyInput(), '6');
    click(buttonByText('Chèn'));
    expect(narration()).toContain('So sánh 6 với 7.');
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('10');
    click(buttonByText('Tìm'));
    stepTo('Đã tìm thấy 6');
    click(buttonByText('Chèn'));
    stepTo('đã có trong cây');
  });

  it('undoes the last operation and resets', () => {
    render(Page);
    click(buttonByText('Hoàn tác'));
    expect(stat('size')).toBe('8');
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
    for (let k = 40; k < 47; k++) {
      commit(keyInput(), String(k));
      click(buttonByText('Chèn'));
    }
    expect(narration()).toContain('Cây đã đầy (15 khoá).');
    for (let i = 0; i < 10; i++) click(buttonByText('Tìm'));
    expect(narration()).toContain('Danh sách thao tác đã đầy (24 thao tác).');
  });

  it('inserts when Enter submits the form', () => {
    render(Page);
    commit(keyInput(), '6');
    /** @type {HTMLFormElement} */ (keyInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toContain('So sánh 6 với 7.');
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

  it('labels a node on the walk down as compared, and z only during the repair', () => {
    render(Page);
    stepTo('So sánh 2 với 11');
    const titles = () =>
      [...document.querySelectorAll('g[data-color] title')].map((t) => t.textContent);
    expect(titles().some((t) => t?.includes('đang so sánh'))).toBe(true);
    expect(titles().some((t) => t?.includes('nút đang được sửa'))).toBe(false);
    stepTo('của nó cũng đỏ');
    expect(titles().some((t) => t?.includes('nút đang được sửa'))).toBe(true);
  });

  it('leaves the black height of the root alone when it paints the root black', () => {
    render(Page);
    commit(presetSelect(), 'uncle');
    stepTo('Nút chú màu đỏ');
    expect(stat('black-height')).toBe('2');
    stepTo('Gốc đang đỏ, nên tô nó thành đen');
    expect(stat('black-height')).toBe('2');
  });
});
