// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/selection-sort-stability/copy.vi.js';

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
  document.querySelector('ol[aria-label^="Các lá bài theo thứ tự"]')?.getAttribute('aria-label');

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
    expect(cards()).toBe(
      'Các lá bài theo thứ tự: 3a, 4a, 3b, 1a, 4b, 2a. 0/6 lá đã ở vị trí cuối cùng.',
    );
    click(button('Bước tiếp'));
    expect(text()).toContain('Lượt 1: lấp ô 0. Bắt đầu với min = 0 (3a).');
    click(button('Bước tiếp'));
    expect(text()).toContain('4a không nhỏ hơn 3a: min vẫn ở ô 0.');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('1a < giá trị nhỏ nhất cũ: min chuyển sang ô 3.');
  });

  it('ends unstable with the swap version and stable with the shift version', () => {
    render();
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã sắp xếp xong với 15 lần so sánh và 4 ô đã ghi.');
    expect(text()).toContain('Ở đây không ổn định: khoá 3 giờ đọc là b, a.');
    expect(cards()).toContain('1a, 2a, 3b, 3a, 4b, 4a');
    pickVariant('shift');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã sắp xếp xong với 15 lần so sánh và 11 ô đã ghi.');
    expect(text()).toContain('Mọi khoá lặp lại đều giữ đúng thứ tự đầu vào.');
    expect(cards()).toContain('1a, 2a, 3a, 3b, 4a, 4b');
  });

  it('compares both versions on the same keys', () => {
    render();
    expect(text()).toMatch(/Đổi chỗ \(kinh điển\)\s*15 lần so sánh · 4 ô đã ghi/);
    expect(text()).toMatch(/Dời \(ổn định\)\s*15 lần so sánh · 11 ô đã ghi/);
    expect(text()).toContain('các khoá bằng nhau bị đảo thứ tự');
    expect(text()).toContain('các khoá bằng nhau giữ nguyên thứ tự');
  });

  it('describes the jump of a swap and the shift of a rotation', () => {
    render();
    for (let i = 0; i < 7; i++) click(button('Bước tiếp'));
    expect(text()).toContain('Đổi chỗ ô 0 và ô 3: 1a lên đầu, còn 3a nhảy tới ô 3');
    pickVariant('shift');
    for (let i = 0; i < 7; i++) click(button('Bước tiếp'));
    expect(text()).toContain('dời 3 lá ở các ô 0 đến 2 sang phải một ô');
  });

  it('loads typed keys and tags the repeats', () => {
    render();
    commit(keysInput(), '2, 2, 1');
    expect(cards()).toBe('Các lá bài theo thứ tự: 2a, 2b, 1a. 0/3 lá đã ở vị trí cuối cùng.');
    click(button('Đến bước cuối'));
    expect(cards()).toContain('1a, 2b, 2a');
    expect(text()).toContain('2: b → a');
    expect(text()).toContain('✕ bị đảo thứ tự');
  });

  it('refuses bad keys with a notice and keeps the last valid ones', () => {
    render();
    commit(keysInput(), '3, banana');
    expect(text()).toContain('Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách');
    expect(keysInput().value).toBe('3, 4, 3, 1, 4, 2');
    commit(keysInput(), '7');
    expect(text()).toContain('Hãy gõ từ 2 đến 10 khoá.');
    commit(keysInput(), '7, 120');
    expect(text()).toContain('Mọi khoá phải nằm trong khoảng 0–99.');
  });

  it('submits the keys with Enter', () => {
    render();
    const input = keysInput();
    input.value = '5, 1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.requestSubmit();
    flushSync();
    expect(cards()).toBe('Các lá bài theo thứ tự: 5a, 1a. 0/2 lá đã ở vị trí cuối cùng.');
  });

  it('draws random keys of the same length', () => {
    render();
    click(buttonByText('Ngẫu nhiên'));
    expect(keysInput().value.split(', ')).toHaveLength(6);
  });

  it('says when no key repeats', () => {
    render();
    commit(keysInput(), '4, 1, 3');
    expect(text()).toContain('Không có khoá nào lặp lại.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Không có khoá nào lặp lại, nên chưa thấy được tính ổn định.');
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
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '28';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
