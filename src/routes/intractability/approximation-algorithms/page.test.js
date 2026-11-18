// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/approximation-algorithms/copy.vi.js';
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
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));

describe('approximation algorithms lesson', () => {
  it('runs the matching 2-approximation on the spider', () => {
    render();
    expect(narration()).toContain('Đọc lần lượt 6 cạnh');
    expect(byTest('optimum')).toBe('3');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Cả hai đầu của A – B đều chưa thuộc tập phủ. Lấy cả hai');
    expect(byTest('cover')).toBe('2');
    click(button('Bước tiếp'));
    expect(narration()).toBe('A – C đã có một đầu thuộc tập phủ. Bỏ qua nó.');
    click(button('Đến bước cuối'));
    expect(byTest('cover')).toBe('6');
    expect(byTest('side')).toBe('3');
    expect(byTest('ratio')).toBe('2');
    expect(vertex(1).getAttribute('aria-label')).toBe(
      'Đỉnh B, thuộc tập phủ, thuộc một tập phủ nhỏ nhất',
    );
  });

  it('switches to greedy and compares', () => {
    render();
    click(field('input[name="algorithm"][value="greedy"]'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('A chạm tới 3 cạnh chưa phủ, nhiều nhất trong mọi đỉnh');
    click(button('Đến bước cuối'));
    expect(byTest('cover')).toBe('4');
    expect(byTest('ratio')).toBe('1.33');
    expect(narration()).toContain('Tối ưu {B, C, D} có 3 đỉnh');
  });

  it('loads the star and the path', () => {
    render();
    commit(field('select[name="preset"]'), 'star');
    click(button('Đến bước cuối'));
    expect(byTest('ratio')).toBe('2');
    commit(field('select[name="preset"]'), 'path');
    click(field('input[name="algorithm"][value="greedy"]'));
    click(button('Đến bước cuối'));
    expect(byTest('ratio')).toBe('1');
  });

  it('follows an edit of the graph', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="remove"]')));
    click(/** @type {Element} */ (document.querySelector('[aria-label="Xoá cạnh giữa A và B"]')));
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Đến bước cuối'));
    expect(byTest('optimum')).toBe('3');
    expect(byTest('cover')).toBe('6');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Cả hai đầu của A – B');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('đọc ô “Kích thước tập phủ”');
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Chưa đúng');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
