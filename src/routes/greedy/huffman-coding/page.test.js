// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/huffman-coding/copy.vi.js';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} prefix */
const node = (prefix) =>
  [...document.querySelectorAll('[aria-label]')]
    .map((el) => el.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith(prefix)) ?? '';
const rows = () =>
  [...document.querySelectorAll('[data-testid="codes"] tbody tr')].map((tr) =>
    [...tr.children].map((c) => c.textContent?.trim()).join(' '),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('Huffman coding lesson', () => {
  it('starts with six leaves in the queue, lightest first', () => {
    render();
    expect(narration()).toContain(
      '6 kí hiệu, mỗi kí hiệu là một cây một lá trong hàng đợi, nhẹ nhất trước: f (5), e (9), c (12), b (13), d (16), a (45).',
    );
    expect(stat('Số bit mã cố định')).toBe('300');
    expect(stat('Số bit Huffman')).toBe('0');
  });

  it('picks the two lightest and merges them', () => {
    render();
    click(button('Bước tiếp'));
    expect(narration()).toContain('Lấy hai cây nhẹ nhất: f (5) và e (9).');
    expect(node('f, trọng số 5')).toContain('một trong hai cây nhẹ nhất');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Gộp chúng dưới một nút có trọng số 14');
    expect(narration()).toContain('Còn 5 cây.');
    expect(stat('Số bit Huffman')).toBe('14');
    expect(node('14, trọng số 14')).toContain('nút vừa gộp');
  });

  it('reads the codes and reaches 224 bits', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toContain(
      'Xong: tổng cộng 224 bit, trung bình 2.24 bit mỗi kí hiệu, so với 300 bit nếu dùng mã cố định 3 bit.',
    );
    expect(stat('Số lần gộp')).toBe('5');
    expect(stat('Số bit mỗi kí hiệu')).toBe('2.24');
    expect(rows()).toEqual([
      'a 45 0 45',
      'b 13 101 39',
      'c 12 100 36',
      'd 16 111 48',
      'e 9 1101 36',
      'f 5 1100 20',
    ]);
    click(button('Bước trước'));
    expect(narration()).toContain(
      'd: đi theo các cạnh từ gốc xuống, đọc được 111, 3 bit × 16 = 48 bit.',
    );
    expect(node('d, trọng số 16')).toContain('đường đi tới lá');
  });

  it('jumps to the step that reads a leaf’s code when the leaf is picked', () => {
    render();
    click(button('Đến bước cuối'));
    const leaf = /** @type {HTMLElement} */ (
      document.querySelector('g[role="button"][aria-label^="f, trọng số 5"]')
    );
    leaf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toContain(
      'f: đi theo các cạnh từ gốc xuống, đọc được 1100, 4 bit × 5 = 20 bit.',
    );
    const merged = /** @type {HTMLElement} */ (
      document.querySelector('g[role="button"][aria-label^="14, trọng số 14"]')
    );
    merged.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(narration()).toContain('Gộp chúng dưới một nút có trọng số 14');
  });

  it('counts the letters of a text', () => {
    render();
    commit(field('text'), 'abracadabra');
    expect(narration()).toContain('Đã đếm được 5 kí tự khác nhau');
    expect(/** @type {HTMLInputElement} */ (field('frequencies')).value).toBe(
      'a:5, b:2, r:2, c:1, d:1',
    );
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Xong: tổng cộng 23 bit');
    expect(stat('Số bit mã cố định')).toBe('33');
  });

  it('matches the fixed-length code on equal counts', () => {
    render();
    commit(field('preset'), 'equal');
    expect(text()).toContain('Đã nạp tần suất mới.');
    click(button('Đến bước cuối'));
    expect(stat('Số bit Huffman')).toBe('40');
    expect(stat('Số bit mã cố định')).toBe('40');
  });

  it('refuses bad frequencies and texts, keeping the last valid ones', () => {
    render();
    commit(field('frequencies'), 'a:1, a:2');
    expect(narration()).toContain('Mỗi kí hiệu chỉ ghi một lần.');
    expect(/** @type {HTMLInputElement} */ (field('frequencies')).value).toBe(
      'a:45, b:13, c:12, d:16, e:9, f:5',
    );
    commit(field('frequencies'), 'a=3');
    expect(narration()).toContain('Hãy nhập các cặp như a:45');
    commit(field('text'), 'zzzz');
    expect(narration()).toContain('Hãy dùng từ 2 đến 10 kí hiệu khác nhau.');
    expect(stat('Số bit mã cố định')).toBe('300');
  });

  it('commits typed frequencies on Enter', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('frequencies'));
    input.value = 'x:3 y:7';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('2 kí hiệu, mỗi kí hiệu là một cây một lá');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '33';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '23';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
