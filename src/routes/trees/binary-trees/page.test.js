// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/binary-trees/copy.vi.js';
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

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} start */
const node = (start) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) =>
    g.getAttribute('aria-label')?.startsWith(start),
  );
  if (!el) throw new Error(`no node ${start}`);
  return /** @type {SVGGElement} */ (el);
};
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
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

describe('binary trees and terminology lesson', () => {
  it('measures depth on the way down and height on the way up', () => {
    render();
    expect(narration()).toBe('Gọi measure trên gốc A với độ sâu 0.');
    next(1);
    expect(narration()).toBe('A là gốc, nên độ sâu của nó là 0.');
    next(2);
    expect(narration()).toBe('B nằm dưới cha một cạnh, nên độ sâu của nó là 1.');
    next(3);
    expect(narration()).toBe('D không có con: nó là lá, chiều cao 0.');
    expect(byTest('height')).toBe('?');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Xong: chiều cao 2, 3 lá. Một cây hoàn hảo cùng chiều cao sẽ có 7 nút.',
    );
    expect(byTest('height')).toBe('2');
    expect(byTest('prop-full')).toBe('không');
    expect(byTest('prop-complete')).toBe('có');
    expect(node('Nút A').getAttribute('aria-label')).toBe('Nút A, độ sâu 0, chiều cao 2, đã đo');
  });

  it('adds a child to the selected node and labels it at once', () => {
    render();
    click(node('Nút C'));
    expect(byTest('selected')).toBe('Đang chọn: C');
    expect(byTest('slot-math')).toBe('Ô 2: cha ⌊(i − 1) / 2⌋ = 0, con 2i + 1 = 5 và 2i + 2 = 6.');
    click(buttonByText('Thêm con phải'));
    expect(byTest('size')).toBe('7');
    expect(byTest('prop-full')).toBe('có');
    expect(byTest('prop-perfect')).toBe('có');
    expect(node('Nút G').getAttribute('aria-label')).toContain('độ sâu 2, chiều cao 0');
  });

  it('refuses a taken child and a child that would be too deep', () => {
    render();
    click(node('Nút A'));
    click(buttonByText('Thêm con trái'));
    expect(narration()).toBe('A đã có con trái rồi.');
    commit(presetSelect(), 'chain');
    click(node('Nút D'));
    click(buttonByText('Thêm con trái'));
    expect(narration()).toBe(m.errors.depth(3));
    expect(byTest('size')).toBe('4');
  });

  it('shows the chain wasting array slots', () => {
    render();
    commit(presetSelect(), 'chain');
    expect(byTest('array')).toBe('15');
    expect(byTest('prop-complete')).toBe('không');
    const frames = document.querySelectorAll('[aria-label^="Ô "]');
    expect(frames.length).toBe(15);
  });

  it('removes a subtree, undoes it, and empties the tree', () => {
    render();
    click(node('Nút B'));
    click(buttonByText('Xoá cây con'));
    expect(byTest('size')).toBe('3');
    expect(byTest('selected')).toBe('Đang chọn: A');
    click(buttonByText('Hoàn tác'));
    expect(byTest('size')).toBe('6');
    click(node('Nút A'));
    click(buttonByText('Xoá cây con'));
    expect(byTest('size')).toBe('0');
    click(buttonByText('Thêm gốc'));
    expect(byTest('size')).toBe('1');
    expect(narration()).toContain('Cây hoàn hảo');
  });

  it('selects a node from the array row and with the keyboard', () => {
    render();
    click(/** @type {Element} */ (document.querySelector('[aria-label="Ô 4: E"]')));
    expect(byTest('selected')).toBe('Đang chọn: E');
    const a = node('Nút A');
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    /** @type {HTMLElement} */ (document.activeElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(byTest('selected')).toBe('Đang chọn: B');
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
    answer.value = '8';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
