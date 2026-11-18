// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/linear-search/copy.vi.js';
import Page from './+page.svelte';

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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}
/** @param {number} i */
const cell = (i) => /** @type {SVGElement} */ (document.querySelector(`g[data-index="${i}"]`));

describe('linear search lesson', () => {
  it('opens on the plain scan and finds 63 after 7 comparisons', () => {
    render();
    expect(text()).toContain('Quét 10 ô từ trái sang phải để tìm 63');
    click(button('Bước tiếp'));
    expect(text()).toContain('0 < 10? Đúng. So sánh a[0] = 31 với 63: khác nhau');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Tìm thấy 63 ở chỉ số 6 sau 7 phép so sánh.');
    expect(stat('comparisons')).toBe('7');
    expect(stat('bound-checks')).toBe('7');
    expect(stat('total')).toBe('14');
  });

  it('the sentinel variant keeps one bound check', () => {
    render();
    expect(stat('worst')).toBe('10');
    click(/** @type {HTMLElement} */ (document.querySelector('input[value="sentinel"]')));
    expect(text()).toContain('làm phần tử cầm canh');
    expect(text()).toContain('a[n] = x; i = 0');
    click(button('Đến bước cuối'));
    expect(text()).toContain('đây là bản sao thật: trả về 6.');
    expect(stat('comparisons')).toBe('7');
    expect(stat('bound-checks')).toBe('1');
    // A miss also compares the sentinel copy of x.
    expect(stat('worst')).toBe('11');
  });

  it('a missing target costs n comparisons and n + 1 bound checks', () => {
    render();
    commit(input('target'), '5');
    click(button('Đến bước cuối'));
    expect(text()).toContain('10 < 10? Sai: mọi ô đều đã được xét. 5 không có trong mảng');
    expect(stat('total')).toBe('21');
    expect(stat('final-sentinel')).toBe('11 phép so sánh + 1 lần kiểm tra biên = 12');
  });

  it('presets move the target to either end', () => {
    render();
    click(buttonByText(m.targetFirst));
    click(button('Đến bước cuối'));
    expect(text()).toContain('Tìm thấy 31 ở chỉ số 0 sau 1 phép so sánh.');
    click(buttonByText(m.targetLast));
    click(button('Đến bước cuối'));
    expect(text()).toContain('Tìm thấy 14 ở chỉ số 9 sau 10 phép so sánh.');
  });

  it('a typed array replaces the data and finds the first copy', () => {
    render();
    commit(input('values'), '4 7 7 2');
    commit(input('target'), '7');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Tìm thấy 7 ở chỉ số 1 sau 2 phép so sánh.');
  });

  it('refuses bad input with a notice and keeps the last values', () => {
    render();
    commit(input('values'), '3, x');
    expect(text()).toContain('Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách');
    expect(input('values').value).toBe('31, 8, 52, 19, 77, 40, 63, 25, 90, 14');
    commit(input('target'), '150');
    expect(text()).toContain('Giá trị cần tìm phải là số nguyên từ 0 đến 99.');
    expect(input('target').value).toBe('63');
  });

  it('a cell picked by keyboard becomes the target', () => {
    render();
    const c = cell(0);
    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(document.activeElement).toBe(cell(1));
    cell(1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('Giờ ta tìm 8.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Tìm thấy 8 ở chỉ số 1 sau 2 phép so sánh.');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
  });

  it('has well-formed practice questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
