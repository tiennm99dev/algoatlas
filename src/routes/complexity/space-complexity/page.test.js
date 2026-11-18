// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/space-complexity/copy.vi.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const memoryLabel = () =>
  document.querySelector('[aria-label^="Thanh bộ nhớ"]')?.getAttribute('aria-label') ?? '';

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const nInput = () => /** @type {HTMLInputElement} */ (document.querySelector('input[name="n"]'));
const algoSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="algo"]'));

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 200 && !narration().includes(part); k++) click(button('Bước tiếp'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('space complexity lesson', () => {
  it('grows the stack to 6 frames for sum(5), then empties it', () => {
    render();
    expect(narration()).toBe('Ngăn xếp chưa có gì. Chạy với n = 5.');
    click(button('Bước tiếp'));
    expect(narration()).toContain(
      'Gọi sum(5): đẩy vào một khung 2 từ máy. Độ sâu 1, đang dùng 2 từ máy.',
    );
    stepUntil('trường hợp cơ sở');
    expect(stat(m.stats.depth)).toBe('6');
    expect(stat(m.stats.words)).toBe('12');
    expect(memoryLabel()).toContain('đang dùng 12/12 từ máy');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.depth)).toBe('0');
    expect(stat(m.stats.peak)).toBe('12');
    expect(narration()).toContain('Mức đỉnh 12 từ máy, ngăn xếp sâu nhất 6 khung');
  });

  it('keeps bits(n) shallow and the loop constant', () => {
    render();
    commit(nInput(), '12');
    commit(algoSelect(), 'bits-rec');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.maxDepth)).toBe('4');
    expect(stat(m.stats.peak)).toBe('8');
    commit(algoSelect(), 'sum-loop');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.peak)).toBe('4');
    expect(narration()).toContain('Θ(1)');
  });

  it('puts the copy on the heap and reverses in place without one', () => {
    render();
    commit(algoSelect(), 'reverse-copy');
    stepUntil('Cấp phát B');
    expect(stat(m.stats.words)).toBe('9');
    expect(text()).toContain(m.arrayB);
    click(button('Đến bước cuối'));
    expect(stat(m.stats.peak)).toBe('9');
    commit(algoSelect(), 'reverse-in-place');
    stepUntil('Đổi chỗ A[0] và A[4]');
    expect(document.querySelector(`[aria-label="${m.arrayB}"]`)).toBeNull();
    click(button('Đến bước cuối'));
    expect(stat(m.stats.peak)).toBe('5');
  });

  it('keeps the last valid n and submits with Enter', () => {
    render();
    commit(nInput(), '13');
    expect(narration()).toBe(m.nError);
    expect(nInput().value).toBe('5');
    nInput().value = '2';
    nInput().dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (nInput().closest('form')).requestSubmit();
    flushSync();
    click(button('Đến bước cuối'));
    expect(stat(m.stats.peak)).toBe('6');
  });

  it('checks the bits(1000) question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
