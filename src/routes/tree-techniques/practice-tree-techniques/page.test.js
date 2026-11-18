// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-tree-techniques/copy.vi.js';
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

/** @param {string} name @param {string} value */
function choose(name, value) {
  const el = /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
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

/** @param {string} value */
function typeOps(value) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[name="ops"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}
const opsField = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="ops"]')).value;
/** @param {string} label */
const nodeName = (label) =>
  [...document.querySelectorAll('svg g title')]
    .map((t) => t.textContent ?? '')
    .find((t) => t.startsWith(`Nút ${label},`)) ?? '';

describe('advanced tree problems practice', () => {
  it('runs each operation both ways and keeps the totals', () => {
    render();
    expect(narration()).toBe(
      '5 thao tác trên một cây 15 nút, được cắt thành 6 chuỗi nặng. Mỗi bước chạy một thao tác theo cả hai cách.',
    );
    next(1);
    expect(narration()).toBe(
      'sum M L = 34. Cách thô: đi qua 8 nút của đường đi. HLD: 3 đoạn trên chuỗi, thăm 29 nút segment tree.',
    );
    expect(byTest('answer')).toBe('34');
    expect(nodeName('A')).toBe('Nút A, giá trị 3, tổ tiên chung gần nhất');
    expect(nodeName('M')).toBe('Nút M, giá trị 9, trên đường đi của truy vấn, u');
    next(1);
    expect(narration()).toBe(
      'dist M L = 7 cạnh: lca là A, nên 4 + 3 − 2·0. Cách thô: đi qua 8 nút. HLD: leo qua 3 chuỗi đến A, rồi đọc 3 độ sâu: 6 bước.',
    );
    next(1);
    expect(nodeName('D')).toBe('Nút D, giá trị 0, vừa đặt giá trị');
    click(button('Đến bước cuối'));
    expect(byTest('naive')).toBe('34');
    expect(byTest('hld')).toBe('75');
    expect(narration()).toContain('cách thô 34, HLD 75, ở đây cách thô làm ít việc hơn.');
    expect(document.body.textContent).toContain('sum M L → 33 · 8 · 29');
  });

  it('runs typed operations and refuses bad ones', () => {
    render();
    typeOps('dist k o, set a 9, sum a a');
    expect(opsField()).toBe('dist K O, set A 9, sum A A');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('–');
    click(button('Bước trước'));
    expect(byTest('answer')).toBe('9');
    typeOps('sum A Q');
    expect(narration()).toBe(m.opErrors.node);
    expect(opsField()).toBe('dist K O, set A 9, sum A A');
    typeOps('jump A B');
    expect(narration()).toBe(m.opErrors.format);
    typeOps('set A 12');
    expect(narration()).toBe(m.opErrors.value);
  });

  it('loads the caterpillar workload', () => {
    render();
    choose('preset', 'caterpillar');
    expect(opsField()).toBe('sum N Z, dist N Z, sum Y Z, set G 9, sum N Z');
    click(button('Đến bước cuối'));
    expect(byTest('naive')).toBe('50');
    expect(byTest('hld')).toBe('80');
    expect(byTest('step')).toBe('5/5');
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
    answer.value = '34';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '33';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
