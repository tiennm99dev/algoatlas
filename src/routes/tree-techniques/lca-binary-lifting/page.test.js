// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/lca-binary-lifting/copy.vi.js';
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

describe('lowest common ancestor and binary lifting lesson', () => {
  it('builds the table cell by cell from two half jumps', () => {
    render();
    expect(narration()).toContain('Dựng bảng nhảy trước: 14 nút × 4 hàng');
    next(1);
    expect(narration()).toContain('Hàng 2⁰ là cha của mỗi nút');
    expect(byTest('cells')).toBe('14');
    next(4);
    expect(narration()).toBe(
      'up[1][D]: đi lên 1 tầng từ D là B, và lên thêm 1 tầng từ đó là A. Hai bước nhảy một nửa ghép thành một bước nhảy 2.',
    );
    expect(node('D').getAttribute('aria-label')).toBe('Nút D, độ sâu 2, đang điền ô của nút');
    expect(node('B').getAttribute('aria-label')).toContain('tổ tiên ở nửa đường');
  });

  it('answers the family query and agrees with the Euler tour', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toBe('lca = B, sau 10 lần đọc bảng và 3 lần dời con trỏ.');
    expect(byTest('lca')).toBe('B');
    expect(byTest('d')).toBe('2');
    expect(byTest('cells')).toBe('56');
    expect(node('B').getAttribute('aria-label')).toContain('tổ tiên chung gần nhất');
    expect(node('H').getAttribute('aria-label')).toContain('trên đường đi u–v');
    expect(byTest('euler')).toContain('mục nông nhất là B (độ sâu 1)');
  });

  it('re-runs the query when u or v changes, opening on the query', () => {
    render();
    choose('v', '12');
    expect(narration()).toBe('Đã dựng xong bảng (56 ô). Giờ hỏi lca(N, M).');
    click(button('Đến bước cuối'));
    expect(byTest('lca')).toBe('A');
    expect(byTest('euler')).toContain('mục nông nhất là A (độ sâu 0)');
  });

  it('swaps u and v when v is deeper and stops early on an ancestor', () => {
    render();
    choose('u', '1');
    next(1);
    expect(narration()).toContain('I sâu hơn, nên đổi chỗ: u = I (độ sâu 3), v = B (độ sâu 1).');
    click(button('Đến bước cuối'));
    expect(byTest('lca')).toBe('B');
    expect(narration()).toBe('lca = B, sau 1 lần đọc bảng và 1 lần dời con trỏ.');
  });

  it('lifts along a 16-node path by 8, 4, 2 and 1', () => {
    render();
    choose('preset', 'path');
    click(button('Đến bước cuối'));
    expect(byTest('d')).toBe('15');
    expect(byTest('reads')).toBe('4');
    expect(byTest('lca')).toBe('A');
  });

  it('adds and removes nodes, refuses the root and undoes', () => {
    render();
    click(node('I'));
    click(buttonByText('Thêm con'));
    expect(byTest('selected')).toBe('Đang chọn: O');
    expect(byTest('cells')).toBe('60');
    click(node('A'));
    click(buttonByText('Xoá cây con'));
    expect(narration()).toBe(m.errors.root);
    click(node('D'));
    click(buttonByText('Xoá cây con'));
    // N went with D's subtree, so u falls back to the nearest kept ancestor, B.
    expect(byTest('selected')).toBe('Đang chọn: B');
    click(button('Đến bước cuối'));
    expect(byTest('lca')).toBe('B');
    click(buttonByText('Hoàn tác'));
    click(buttonByText('Hoàn tác'));
    click(button('Đến bước cuối'));
    expect(byTest('cells')).toBe('56');
  });

  it('refuses a seventeenth node', () => {
    render();
    choose('preset', 'path');
    click(buttonByText('Thêm con'));
    expect(narration()).toBe(m.errors.full(16));
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
    answer.value = '14';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '56';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
