// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/disjoint-set-union/copy.vi.js';
import Page from './+page.svelte';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const preset = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('disjoint set union lesson', () => {
  it('starts with every element alone and ends the friends preset at five sets', () => {
    render();
    expect(narration()).toContain('Ban đầu mỗi phần tử đứng một mình');
    expect(statValue('Số tập')).toBe('10');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Xong: 5 tập, cây cao nhất dài 2 liên kết, tổng cộng đã đi qua 10 liên kết parent.',
    );
    expect(text()).toContain('{0, 1, 2, 3}');
    expect(text()).toContain('{4, 5, 6}');
  });

  it('walks a find from an element up to its root', () => {
    render();
    commit(field('a'), '3');
    click(buttonByText('Tìm gốc của a'));
    expect(narration()).toContain('find(3): bắt đầu ở 3');
    click(button('Bước tiếp'));
    expect(narration()).toBe('parent[3] = 2, nên leo lên 2.');
    click(button('Bước tiếp'));
    expect(narration()).toBe('parent[2] = 0, nên leo lên 0.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('0 là gốc');
    expect(statValue('Số liên kết đã đi (thao tác này)')).toBe('2');
  });

  it('merges two sets with union and answers same-set queries', () => {
    render();
    commit(field('a'), '6');
    commit(field('b'), '9');
    click(buttonByText('Hợp a và b'));
    click(button('Đến bước cuối'));
    expect(statValue('Số tập')).toBe('4');
    commit(field('a'), '9');
    commit(field('b'), '5');
    click(buttonByText('Cùng tập?'));
    click(button('Đến bước cuối'));
    expect(text()).not.toContain('{9}');
    click(button('Bước trước'));
    expect(narration()).toBe('Cả hai gốc đều là 4: có, 9 và 5 ở cùng một tập.');
  });

  it('runs union when Enter submits the form', () => {
    render();
    commit(field('a'), '7');
    commit(field('b'), '8');
    const form = /** @type {HTMLFormElement} */ (field('a').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toContain('Tìm gốc của a = 7');
    expect(buttonByText('Cùng tập?').type).toBe('button');
  });

  it('runs find on a node picked with Enter in the forest', () => {
    render();
    const node = /** @type {HTMLElement} */ (document.querySelector('g[role="button"]'));
    node.focus();
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toMatch(/^find\(\d\): bắt đầu ở \d/);
    expect(text()).toMatch(/find\(\d\)/);
  });

  it('builds a tall chain with the chain preset', () => {
    render();
    commit(preset(), 'chain');
    expect(statValue('Cây cao nhất (số liên kết)')).toBe('6');
    expect(statValue('Số liên kết đã đi (tổng)')).toBe('6');
  });

  it('keeps the last valid element and refuses invalid input', () => {
    render();
    commit(field('a'), '5');
    commit(field('a'), '12');
    expect(field('a').value).toBe('5');
    commit(field('b'), '');
    expect(field('b').value).toBe('4');
  });

  it('undoes, resets and refuses a full log', () => {
    render();
    click(buttonByText('Hoàn tác'));
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Xong: 5 tập');
    click(buttonByText('Đặt lại'));
    expect(text()).toContain('chưa có');
    expect(buttonByText('Đặt lại').getAttribute('aria-disabled')).toBe('true');
    for (let i = 0; i < 17; i++) click(buttonByText('Tìm gốc của a'));
    expect(narration()).toBe(m.logFull);
    click(button('Bước tiếp'));
    expect(narration()).not.toBe(m.logFull);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
