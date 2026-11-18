// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/permutations-subsets/copy.vi.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));

describe('permutations, combinations and subsets lesson', () => {
  it('lists the permutations as the recursion picks and unpicks', () => {
    render();
    expect(narration()).toContain('Sinh mọi hoán vị của 3 phần tử');
    click(button('Bước tiếp'));
    expect(narration()).toBe('Chọn A. Đường đi giờ là A.');
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('6');
    expect(byTest('calls')).toBe('16');
    expect(byTest('copied')).toBe('18');
    expect(byTest('count')).toBe('n! = 6 nếu mọi phần tử đều khác nhau.');
    expect(narration()).toBe('Xong: 6 kết quả từ 16 lời gọi, đã chép 18 phần tử.');
  });

  it('skips duplicates only when asked to', () => {
    render();
    commit(field('input[name="items"]'), 'A A B');
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('6');
    click(field('input[name="unique"][value="on"]'));
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('3');
    expect(byTest('skipped')).not.toBe('0');
  });

  it('switches between the three problems', () => {
    render();
    click(field('input[name="mode"][value="subset"]'));
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('8');
    click(field('input[name="mode"][value="comb"]'));
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('3');
    commit(field('input[name="k"]'), '1');
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('3');
    commit(field('input[name="k"]'), '3');
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('1');
  });

  it('loads an example', () => {
    render();
    commit(field('select[name="preset"]'), 'five');
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('10');
    expect(field('input[name="items"]').value).toBe('A B C D E');
    commit(field('select[name="preset"]'), 'twins');
    click(button('Đến bước cuối'));
    expect(byTest('results')).toBe('6');
  });

  it('cuts the list to the smaller cap on a switch to permutations', () => {
    render();
    commit(field('select[name="preset"]'), 'five');
    click(field('input[name="mode"][value="perm"]'));
    expect(field('input[name="items"]').value).toBe('A B C D');
  });

  it('refuses bad input and keeps the last valid values', () => {
    render();
    commit(field('input[name="items"]'), 'A B C D E');
    expect(narration()).toBe(
      'Hãy nhập từ 1 đến 4 phần tử, cách nhau bởi dấu cách, mỗi phần tử gồm một hoặc hai chữ cái hay chữ số.',
    );
    expect(field('input[name="items"]').value).toBe('A B C');
    click(field('input[name="mode"][value="comb"]'));
    commit(field('input[name="k"]'), '9');
    expect(narration()).toBe('k phải là số nguyên từ 0 đến 3.');
    expect(field('input[name="k"]').value).toBe('2');
  });

  it('jumps to a call from the tree, by pointer and by keyboard', () => {
    render();
    click(button('Đến bước cuối'));
    click(/** @type {Element} */ (document.querySelector('[data-node="0"]')));
    expect(byTest('calls')).toBe('1');
    click(button('Đến bước cuối'));
    /** @type {Element} */ (document.querySelector('[data-node="0"]')).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(byTest('calls')).toBe('1');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('Có bốn cách');
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Chưa đúng');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
