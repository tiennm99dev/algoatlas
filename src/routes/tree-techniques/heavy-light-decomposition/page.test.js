// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/heavy-light-decomposition/copy.vi.js';
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
/** @param {string} label */
const node = (label) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) => {
    const name = g.getAttribute('aria-label') ?? '';
    return name === `Nút ${label}` || name.startsWith(`Nút ${label},`);
  });
  if (!el) throw new Error(`no node ${label}`);
  return el;
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

/** @param {string} value */
function setValue(value) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[name="value"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('heavy-light decomposition lesson', () => {
  it('sizes subtrees, then numbers the chains heavy child first', () => {
    render();
    expect(narration()).toContain('Lượt duyệt thứ nhất (dfs1)');
    expect(byTest('array-empty')).toBe(m.arrayEmpty);
    next(2);
    expect(narration()).toBe(
      'H có kích thước 2. Con lớn nhất của nó là M (kích thước 1), nên H–M là cạnh nặng.',
    );
    next(14);
    expect(narration()).toBe('Lượt duyệt thứ hai (dfs2): gốc A mở đầu chuỗi thứ nhất ở vị trí 0.');
    next(5);
    expect(narration()).toBe('I treo trên một cạnh nhẹ: nó mở đầu một chuỗi mới ở vị trí 5.');
    expect(byTest('array-empty')).toBeUndefined();
    expect(node('I').getAttribute('aria-label')).toBe(
      'Nút I, giá trị 5, vị trí 5 trên chuỗi I, đang xử lí',
    );
    expect(byTest('chains')).toBeUndefined();
  });

  it('splits the path M – L into three chain ranges', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Tổng trên đường đi = 8 + 6 + 20 = 34, từ 3 đoạn và 29 nút cây phân đoạn. Đi dọc đường đi từng nút một thì phải đọc 8 nút.',
    );
    expect(byTest('sum')).toBe('34');
    expect(byTest('ranges')).toBe('3');
    expect(byTest('walk')).toBe('8');
    expect(node('G').getAttribute('aria-label')).toContain('đã cộng');
    expect(node('K').getAttribute('aria-label')).not.toContain('đã cộng');
    expect(document.body.textContent).toContain('A–B–D–H–M');
  });

  it('re-runs the query on a new u and opens on the query', () => {
    render();
    choose('u', '10');
    expect(narration()).toBe(
      'Giờ mỗi chuỗi là một khối vị trí. Cộng các giá trị trên đường đi K – L (3 nút).',
    );
    click(button('Đến bước cuối'));
    expect(byTest('sum')).toBe(String(5 + 2 + 8));
    expect(byTest('ranges')).toBe('2');
  });

  it('answers a path query on one chain with a single range', () => {
    render();
    choose('preset', 'path');
    click(button('Đến bước cuối'));
    expect(byTest('ranges')).toBe('1');
    expect(byTest('sum')).toBe('30');
  });

  it('changes a value, refuses a bad one and undoes', () => {
    render();
    click(node('L'));
    setValue('0');
    click(button('Đến bước cuối'));
    expect(byTest('sum')).toBe('26');
    setValue('12');
    expect(narration()).toBe(m.errors.value(9));
    click(buttonByText('Hoàn tác'));
    click(button('Đến bước cuối'));
    expect(byTest('sum')).toBe('34');
  });

  it('adds a child, removes a subtree and refuses the root', () => {
    render();
    click(node('M'));
    click(buttonByText('Thêm con'));
    expect(byTest('selected')).toBe('Đang chọn: P');
    click(node('A'));
    click(buttonByText('Xoá cây con'));
    expect(narration()).toBe(m.errors.root);
    click(node('C'));
    click(buttonByText('Xoá cây con'));
    // L went with C's subtree, so v falls back to the root A.
    click(button('Đến bước cuối'));
    expect(byTest('sum')).toBe(String(3 + 1 + 1 + 6 + 9));
    expect(byTest('ranges')).toBe('1');
  });

  it('selects a node with the arrow keys and Enter', () => {
    render();
    const a = /** @type {SVGGElement} */ (node('A'));
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    /** @type {SVGGElement} */ (document.activeElement).dispatchEvent(
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
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
