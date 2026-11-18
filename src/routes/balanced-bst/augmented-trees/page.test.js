// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/augmented-trees/copy.vi.js';
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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const intervalRadio = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="mode"][value="interval"]'));
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};
/** Step until the narration contains the text. @param {string} text */
function stepTo(text) {
  for (let i = 0; i < 400; i++) {
    if (narration().includes(text)) return;
    click(button('Bước tiếp'));
  }
  throw new Error(`never narrated: ${text}`);
}

describe('ordered maps and augmented trees lesson', () => {
  it('opens on the first query with the tree already built, sizes on the nodes', () => {
    render();
    expect(narration()).toBe('Tìm khoá nhỏ thứ 5, bắt đầu từ gốc với k = 5.');
    expect(stat('size')).toBe('7');
    expect(document.body.textContent).toContain('size 7');
  });

  it('narrates k shrinking through select and ends on the answer', () => {
    render();
    next(1);
    expect(narration()).toBe(
      'Tại 40: s = 3 + 1 = 4. k = 5 > 4, nên bỏ qua 4 khoá đó: k = 5 − 4 = 1, rồi rẽ phải.',
    );
    next(1);
    expect(narration()).toBe(
      'Tại 60: s = 1 + 1 = 2. k = 1 < 2, nên kết quả nằm bên trái và k vẫn là 1.',
    );
    next(1);
    expect(narration()).toBe('Tại 50: s = 0 + 1 = 1, đúng bằng k. Khoá nhỏ thứ 5 là 50.');
    expect(stat('answer')).toBe('50');
    expect(stat('comparisons')).toBe('3');
    expect(
      document.querySelector('[data-testid="sorted-card"] svg')?.getAttribute('aria-label'),
    ).toContain('đứng trước kết quả');
  });

  it('adds the left size at each right turn of a rank query, and reports a gap for a missing key', () => {
    render();
    stepTo('Tìm thứ hạng của 45');
    next(1);
    expect(narration()).toBe(
      '45 > 40: 40 và 3 khoá bên trái nó đều nhỏ hơn, nên cộng thêm 4. Giờ r = 5. Rẽ phải.',
    );
    next(3);
    expect(narration()).toBe(
      '45 không có trong cây, nhưng phép đếm vẫn dùng được: có 4 khoá nhỏ hơn, nên nếu có trong cây thì nó sẽ có thứ hạng 5.',
    );
    expect(stat('answer')).toBe('5');
  });

  it('refuses an out-of-range k from the root size alone', () => {
    render();
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toBe(
      'Không có khoá nhỏ thứ 9: size của gốc cho biết cây chỉ có 7 khoá. Không cần đi xuống.',
    );
    expect(stat('comparisons')).toBe('0');
  });

  it('runs what the learner types: insert, then rank and select of the new key', () => {
    render();
    commit(input('key'), '25');
    click(buttonByText(m.insert));
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('8');
    click(buttonByText(m.rank));
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(stat('answer')).toBe('3');
    commit(input('key'), '3');
    click(buttonByText(m.select));
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(stat('answer')).toBe('25');
  });

  it('recomputes sizes on the way back up and through a rotation', () => {
    render();
    commit(input('order-preset'), 'rotations');
    expect(narration()).toBe(m.emptyTree);
    stepTo('quay trái tại 10');
    expect(narration()).toContain('giờ 20 có size 3 và 10 có size 1');
    click(button('Bước trước'));
    expect(narration()).toBe('Tại 10: size = 1 + 0 + 2 = 3.');
  });

  it('undoes, resets and reloads a preset', () => {
    render();
    click(buttonByText(m.undo));
    expect(document.body.textContent).not.toContain('select(9)');
    click(buttonByText(m.reset));
    expect(stat('size')).toBe('0');
    expect(narration()).toBe(m.emptyTree);
    commit(input('order-preset'), 'scores');
    expect(narration()).toBe('Tìm thứ hạng của 68, bắt đầu từ gốc với r = 1.');
    expect(stat('size')).toBe('8');
  });

  it('shows a notice for a bad key and keeps the last valid one', () => {
    render();
    commit(input('key'), '500');
    expect(input('key').value).toBe('45');
    input('key').value = '500';
    input('key').dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    click(buttonByText(m.rank));
    expect(narration()).toBe(m.keyError);
    expect(input('key').value).toBe('45');
    expect(stat('size')).toBe('7');
  });

  it('copies a node into the field with the keyboard', () => {
    render();
    const root = /** @type {SVGGElement} */ (
      [...document.querySelectorAll('g[role="button"]')].find((g) =>
        g.getAttribute('aria-label')?.startsWith('Key 40,'),
      )
    );
    expect(root.getAttribute('aria-label')).toContain('size 7');
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(input('key').value).toBe('40');
  });

  it('switches to the interval tree and finds an overlap by following max', () => {
    render();
    click(intervalRadio());
    expect(narration()).toBe('Tìm một đoạn bất kì giao với [22, 25], bắt đầu từ gốc.');
    expect(stat('size')).toBe('10');
    expect(
      document.querySelector('[data-testid="number-line"]')?.getAttribute('aria-label'),
    ).toContain('Truy vấn [22, 25]');
    next(1);
    expect(narration()).toBe('[16, 21] không giao với [22, 25]: nó kết thúc ở 21, trước 22.');
    next(1);
    expect(narration()).toContain('Giá trị max của cây con trái là 23 ≥ 22, nên rẽ trái.');
    stepTo('] giao với [22, 25]:');
    expect(stat('answer')).toBe('[15, 23]');
  });

  it('reports no overlap and finds the long interval on the far left', () => {
    render();
    click(intervalRadio());
    stepTo('nên không đoạn nào giao với [11, 14]');
    expect(stat('answer')).toBe('không có');
    commit(input('interval-preset'), 'long');
    stepTo('] giao với [80, 85]:');
    expect(stat('answer')).toBe('[10, 90]');
    expect(stat('comparisons')).toBe('3');
  });

  it('keeps a number line label on the drawing when a long interval starts near zero', () => {
    render();
    click(intervalRadio());
    commit(input('low'), '0');
    commit(input('high'), '90');
    click(buttonByText('Đặt lại'));
    click(buttonByText('Chèn'));
    stepTo('Cây có 1 đoạn');
    const label = [...document.querySelectorAll('[data-testid="number-line"] text')].find(
      (t) => t.textContent === '[0, 90]',
    );
    expect(label?.getAttribute('text-anchor')).toBe('start');
    expect(Number(label?.getAttribute('x'))).toBeGreaterThan(0);
  });

  it('inserts and deletes typed intervals and refuses reversed endpoints', () => {
    render();
    click(intervalRadio());
    commit(input('low'), '40');
    commit(input('high'), '30');
    click(buttonByText(m.overlap));
    expect(narration()).toBe(m.orderError);
    expect(input('low').value).toBe('22');
    expect(input('high').value).toBe('25');
    commit(input('low'), '40');
    commit(input('high'), '50');
    click(buttonByText(m.overlap));
    stepTo('nên không đoạn nào giao với [40, 50]');
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('10');
    click(buttonByText(m.remove));
    expect(narration()).not.toBe(m.orderError);
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('10');
    commit(input('low'), '16');
    commit(input('high'), '21');
    click(buttonByText(m.remove));
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('9');
  });

  it('keeps each half’s log across a switch', () => {
    render();
    click(buttonByText(m.reset));
    click(intervalRadio());
    expect(stat('size')).toBe('10');
    click(
      /** @type {HTMLInputElement} */ (document.querySelector('input[name="mode"][value="order"]')),
    );
    expect(stat('size')).toBe('0');
  });

  it('checks a practice answer, gives a hint, and every question is well formed', () => {
    render();
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (el) => el.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const submit = (value) => {
      answer.value = value;
      answer.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    submit('30');
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    submit('60');
    expect(q.textContent).not.toContain('Chưa đúng');
  });
});
