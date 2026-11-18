// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/fixed-parameter-algorithms/copy.vi.js';
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

/** A search tree node by the start of its accessible name. @param {string} start */
const treeNode = (start) =>
  /** @type {Element} */ (
    [...document.querySelectorAll('[aria-label]')].find((el) =>
      el.getAttribute('aria-label')?.startsWith(start),
    )
  );

describe('fixed-parameter algorithms lesson', () => {
  it('searches the spider for a cover of 3', () => {
    render();
    expect(narration()).toContain('Có tập phủ đỉnh nào gồm tối đa k = 3 đỉnh không?');
    click(button('Bước tiếp'));
    expect(narration()).toContain('A – B là cạnh chưa phủ đầu tiên');
    expect(byTest('made')).toBe('1');
    click(button('Đến bước cuối'));
    expect(byTest('made')).toBe('15');
    expect(byTest('answer')).toBe('có, {B, C, D}');
    expect(byTest('brute')).toBe('64');
    expect(narration()).toContain('Xong: “có”, sau 15 nút tìm kiếm.');
  });

  it('says no for k = 2, and at once with the kernel', () => {
    render();
    commit(field('input[name="k"]'), '2');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('không');
    expect(byTest('made')).toBe('7');
    click(field('input[name="kernel"][value="on"]'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('A có nhiều hơn 2 cạnh chưa phủ');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Còn lại 3 cạnh: câu trả lời là “không”');
    click(button('Đến bước cuối'));
    expect(byTest('made')).toBe('0');
    expect(narration()).toBe('Xong: hạt nhân đã trả lời “không” trước khi tìm kiếm.');
  });

  it('refuses a bad k and keeps the last one', () => {
    render();
    commit(field('input[name="k"]'), '9');
    expect(narration()).toBe(m.kError(5));
    expect(field('input[name="k"]').value).toBe('3');
  });

  it('loads the two stars and follows a graph edit', () => {
    render();
    commit(field('select[name="preset"]'), 'stars');
    click(button('Đến bước cuối'));
    expect(byTest('budget')).toBe('0');
    expect(byTest('answer')).toBe('có, {A, B}');
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="remove"]')));
    click(/** @type {Element} */ (document.querySelector('[aria-label="Xoá cạnh giữa A và B"]')));
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('có, {A, B}');
  });

  it('jumps to a search node by pointer and keyboard', () => {
    render();
    click(button('Đến bước cuối'));
    click(treeNode('Đã lấy A,'));
    expect(byTest('made')).toBe('2');
    click(button('Đến bước cuối'));
    treeNode('Gốc,').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(byTest('made')).toBe('1');
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
    answer.value = '16';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('Một cây nhị phân sâu không quá k');
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Chưa đúng');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
