// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/counting-radix-sort/copy.vi.js';

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

/** @param {string} value */
function pickAlgo(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** @param {number} index */
function seek(index) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Bước"]'));
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const keysInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="keys"]'));
/** @param {string} aria */
const cells = (aria) =>
  [...(document.querySelector(`svg[aria-label="${aria}"]`)?.querySelectorAll('title') ?? [])].map(
    (t) => t.textContent,
  );
const stepCount = () =>
  Number(/** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Bước"]')).max) +
  1;

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('counting sort and radix sort lesson', () => {
  it('tallies keys, then turns the tallies into end positions', () => {
    render();
    expect(text()).toContain('Khoá lớn nhất là 5, nên count có 6 ô, đều bằng 0.');
    click(button('Bước tiếp'));
    expect(text()).toContain('a[0] = 2: tăng count[2] thêm một, giờ nó bằng 1.');
    seek(9);
    expect(text()).toContain('count[1] += count[0]: có 2 khoá ≤ 1');
    seek(13);
    expect(text()).toContain('count[5] += count[4]: có 8 khoá ≤ 5');
  });

  it('places items right to left and keeps equal keys in order', () => {
    render();
    seek(14);
    expect(text()).toContain('a[7] = 3c: count[3] giảm còn 6, nên nó vào out[6]');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Đã sắp xếp xong sau 21 bước lặp: n = 8 bước đếm, k = 5 bước cộng dồn, n bước đặt.',
    );
    const out = cells(m.outputAria).join(' | ');
    expect(out).toContain('Ô 4: 3a');
    expect(out).toContain('Ô 5: 3b');
    expect(out).toContain('Ô 6: 3c');
  });

  it('switches to radix sort and fills the digit buckets', () => {
    render();
    pickAlgo('radix');
    expect(keysInput().value).toBe('170, 45, 75, 90, 802, 24, 2, 66');
    expect(text()).toContain('Khoá lớn nhất, 802, có 3 chữ số');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lượt 1: sắp xếp theo chữ số hàng đơn vị.');
    click(button('Bước tiếp'));
    expect(text()).toContain('170 có chữ số hàng đơn vị là 0: thêm nó vào cuối ngăn 0.');
    expect(document.querySelector('li[aria-label="Ngăn 0: 170"]')).not.toBeNull();
  });

  it('collects the buckets in order after each pass', () => {
    render();
    pickAlgo('radix');
    seek(10);
    expect(text()).toContain('Đọc lần lượt các ngăn 0 đến 9 trở lại vào a.');
    expect(cells(m.arrayAria).map((t) => t?.split(': ')[1].split(',')[0])).toEqual([
      '170',
      '90',
      '802',
      '2',
      '24',
      '45',
      '75',
      '66',
    ]);
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Đã sắp xếp xong sau 3 lượt và 48 lần di chuyển, mà không so sánh hai khoá nào.',
    );
  });

  it('keeps separate keys per algorithm and refuses keys out of range', () => {
    render();
    commit(keysInput(), '4, 12');
    expect(text()).toContain('Ở đây sắp xếp đếm nhận các khoá từ 0 đến 9.');
    expect(keysInput().value).toBe('2, 5, 3, 0, 2, 3, 0, 3');
    pickAlgo('radix');
    commit(keysInput(), '21, 12, 22, 11');
    expect(stepCount()).toBe(1 + 2 * (1 + 4 + 1) + 1);
    commit(keysInput(), '1000, 2');
    expect(text()).toContain('Mọi khoá phải nằm trong khoảng 0–999.');
    pickAlgo('counting');
    expect(keysInput().value).toBe('2, 5, 3, 0, 2, 3, 0, 3');
  });

  it('draws random keys within the limit', () => {
    render();
    click(buttonByText('Ngẫu nhiên'));
    const values = keysInput().value.split(', ').map(Number);
    expect(values).toHaveLength(8);
    expect(values.every((v) => v >= 0 && v <= 9)).toBe(true);
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
