// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { heapsortTrace } from '$lib/algo-engine/heapsort.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/heapsort/copy.vi.js';

const INITIAL = [35, 12, 58, 7, 91, 26, 44, 63, 19, 80];

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const valuesInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="values"]'));
const arrayLabel = () =>
  document.querySelector('svg[aria-label^="Mảng:"]')?.getAttribute('aria-label') ?? '';

/** @param {number} index */
function seek(index) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Bước"]'));
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('heapsort lesson', () => {
  it('starts the build at the last internal node', () => {
    render();
    expect(text()).toContain('ta đẩy xuống từng nút trong, từ ô 4 lùi về ô 0');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đẩy xuống ô 4 (91)');
    click(button('Bước tiếp'));
    expect(text()).toContain('Ô 4 có một con, 80 ở ô 9.');
  });

  it('draws the heap as a tree and an array of the same values', () => {
    render();
    expect(arrayLabel()).toBe(`Mảng: ${INITIAL.join(', ')}. Heap gồm các ô 0 đến 9.`);
    expect(document.querySelectorAll('svg[aria-label^="Mảng:"]')).toHaveLength(2);
  });

  it('swaps the maximum to the end on the first extract', () => {
    render();
    const at = heapsortTrace(INITIAL).findIndex((f) => f.kind === 'extract');
    seek(at);
    expect(text()).toContain('Gốc đang giữ giá trị lớn nhất, 91. Đổi chỗ nó về ô 9');
    expect(text()).toContain('Lấy giá trị lớn nhất');
    expect(arrayLabel()).toContain('Heap gồm các ô 0 đến 8; các ô 9 đến 9 đã xếp xong.');
  });

  it('ends sorted with the totals', () => {
    render();
    click(button('Đến bước cuối'));
    const last = heapsortTrace(INITIAL).at(-1);
    expect(text()).toContain(
      `Đã sắp xếp xong với ${last?.comparisons} lần so sánh và ${last?.swaps} lần đổi chỗ, tất cả ngay trong mảng.`,
    );
    expect(arrayLabel()).toBe('Mảng: 7, 12, 19, 26, 35, 44, 58, 63, 80, 91. Đã xếp xong toàn bộ.');
  });

  it('loads typed values and refuses bad ones', () => {
    render();
    commit(valuesInput(), '4, 10, 3, 5, 1');
    expect(arrayLabel()).toBe('Mảng: 4, 10, 3, 5, 1. Heap gồm các ô 0 đến 4.');
    commit(valuesInput(), '4, 200');
    expect(text()).toContain('Mọi giá trị phải nằm trong khoảng 0–99.');
    expect(valuesInput().value).toBe('4, 10, 3, 5, 1');
  });

  it('builds a reversed array with no swaps', () => {
    render();
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'reversed',
    );
    expect(text()).toContain('Đã nạp mảng mới.');
    const build = heapsortTrace(valuesInput().value.split(', ').map(Number)).filter(
      (f) => f.phase === 'build',
    );
    expect(build.at(-1)?.swaps).toBe(0);
  });

  it('loads a fresh array from the selected preset with the New array button', () => {
    render();
    const before = valuesInput().value;
    click(buttonByText(m.newArrayButton));
    expect(text()).toContain('Đã nạp mảng mới.');
    expect(valuesInput().value).not.toBe(before);
    expect(valuesInput().value.split(', ')).toHaveLength(before.split(', ').length);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Đẩy xuống ô 4 (91)');
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
    answer.value = '10, 4, 3, 5, 1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '10, 5, 3, 4, 1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
