// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/cache-oblivious-algorithms/copy.en.js';

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
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );
/** @param {string} label */
const stat = (label) =>
  [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent;
/** @param {'A'|'B'} name */
const cells = (name) => document.querySelectorAll(`svg[data-matrix="${name}"] g title`);

/** @param {number} i */
function question(i) {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  return /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[i]);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const field = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('cache-oblivious algorithms lesson', () => {
  it('transposes row by row and counts the block transfers', () => {
    render();
    expect(cells('A')).toHaveLength(64);
    expect(text()).toContain('Each matrix is 16 blocks of 4 words, and the cache holds 4 blocks.');
    click(button('Bước tiếp'));
    expect(text()).toContain('B[0][0] = A[0][0]: the read misses, so its block is fetched');
    expect(cells('A')[0].textContent).toBe('A[0][0], block A0, accessed now, a miss');
    click(button('Bước tiếp'));
    expect(text()).toContain('B[1][0] = A[0][1]: the read hits; the write misses');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.transfers)).toBe('80');
    expect(stat(m.stats.split)).toBe('16 / 64');
    expect(text()).toContain('2.50 times the ideal 32');
  });

  it('reaches the ideal with the recursive order and a Z-order layout', () => {
    render();
    click(radio('order', 'recursive'));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.transfers)).toBe('56');
    commit(input('cache'), '7');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.transfers)).toBe('32');
    commit(input('cache'), '2');
    click(radio('layout', 'z'));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.transfers)).toBe('32');
    expect(text()).toContain('the ideal: every block was fetched exactly once.');
  });

  it('resizes the matrices and blocks', () => {
    render();
    click(radio('size', '16'));
    expect(cells('B')).toHaveLength(256);
    click(radio('block', '8'));
    expect(stat(m.stats.ideal)).toBe('64');
    expect(text()).toContain('Each matrix is 32 blocks of 8 words');
  });

  it('checks answers in the practice block', () => {
    render();
    const q = question(0);
    answer(q, '32');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '80');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
