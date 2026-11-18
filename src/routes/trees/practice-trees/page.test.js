// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-trees/copy.vi.js';
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
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {number} key */
const node = (key) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) => {
    const name = g.getAttribute('aria-label') ?? '';
    return name === `Khoá ${key}` || name.startsWith(`Khoá ${key},`);
  });
  if (!el) throw new Error(`no node ${key}`);
  return /** @type {SVGGElement} */ (el);
};
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: tree problems lesson', () => {
  it('validates a BST with narrowing key ranges', () => {
    render();
    expect(narration()).toBe(
      'Kiểm tra gốc với khoảng rộng nhất, (−∞, +∞). Mỗi lần đi xuống, khoảng lại hẹp đi.',
    );
    next(1);
    expect(narration()).toBe('−∞ < 50 < +∞: 50 nằm trong khoảng của nó.');
    next(1);
    expect(narration()).toBe(
      'Sang trái: các khoá ở đó phải nhỏ hơn 50, nên khoảng thành (−∞, 50).',
    );
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Mọi khoá đều nằm trong khoảng của nó: đây là một BST hợp lệ.');
    expect(byTest('result')).toBe('hợp lệ');
    expect(byTest('comparisons')).toBe('14');
  });

  it('catches the trap that the parent-only check misses', () => {
    render();
    commit(presetSelect(), 'trap');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('không phải BST');
    click(button('Bước trước'));
    expect(narration()).toBe(
      '60 phá vỡ tính chất BST: một tổ tiên đòi mọi khoá ở đây phải nằm trong (30, 50). Trả về false.',
    );
    expect(byTest('inorder-verdict')).toBe('Không tăng ngặt: không phải BST.');
    click(field('input[name="method"][value="local"]'));
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('hợp lệ');
  });

  it('finds the lowest common ancestor of two clicked keys', () => {
    render();
    click(field('input[name="problem"][value="lca"]'));
    expect(byTest('picks')).toBe('p = 20, q = 40');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong sau 2 bước: LCA(20, 40) = 30.');
    click(node(60));
    expect(byTest('picks')).toBe('p = 40, q = 60');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong sau 1 bước: LCA(40, 60) = 50.');
    expect(byTest('answer')).toBe('50');
  });

  it('picks with the keyboard', () => {
    render();
    click(field('input[name="problem"][value="lca"]'));
    const root = node(50);
    root.focus();
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    /** @type {SVGGElement} */ (document.activeElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(byTest('picks')).toBe('p = 40, q = 30');
  });

  it('warns that the walk can be wrong on a tree that is not a BST', () => {
    render();
    commit(presetSelect(), 'trap');
    click(field('input[name="problem"][value="lca"]'));
    expect(byTest('picks')).toBe('p = 70, q = 20');
    click(node(60));
    expect(byTest('picks')).toBe('p = 20, q = 60');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('50');
    expect(byTest('not-bst')).toContain('Tổ tiên chung gần nhất theo liên kết cha: 30.');
  });

  it('refuses bad keys and keeps the last valid tree', () => {
    render();
    commit(field('input[name="keys"]'), '5 5');
    expect(narration()).toBe(m.keyErrors.duplicate);
    expect(field('input[name="keys"]').value).toBe('50, 30, 70, 20, 40, 60, 80');
    commit(field('input[name="keys"]'), '8 3 9');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('hợp lệ');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '30';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '60';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
