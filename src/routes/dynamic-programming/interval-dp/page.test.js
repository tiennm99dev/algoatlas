// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { INTERVAL_PRESETS, intervalTrace, orderCount } from '$lib/algo-engine/interval-dp.js';
import { vi as m } from '$lib/lessons/interval-dp/copy.vi.js';
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
const arrows = () => document.querySelectorAll('line[marker-end]').length;
/** @param {number} r @param {number} c */
const cell = (r, c) => /** @type {Element} */ (document.querySelector(`[data-cell="${r}-${c}"]`));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('interval DP lesson', () => {
  it('fills by length and rebuilds the matrix order', () => {
    render();
    expect(narration()).toBe(
      'Nhân 3 ma trận với ít phép nhân số nhất. Tích là như nhau với mọi thứ tự, nhưng khối lượng công việc thì không.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Độ dài 1: một ma trận không cần phép nhân nào, nên đường chéo bằng 0.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toContain('Độ dài 2');
    click(button('Bước tiếp'));
    expect(narration()).toBe('Đoạn A1..A2: bắt đầu bằng ∞ và thử 1 cách chia.');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Chia ngay sau A1: 0 + 0 + 10·100·5 = 5000. Đây là phương án đầu tiên, nên tạm thời là tốt nhất.',
    );
    expect(arrows()).toBe(2);
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('7500');
    expect(byTest('baseline')).toBe('75000');
    expect(byTest('order')).toBe('((A1 A2) A3)');
    expect(byTest('tried')).toBe('4 / 4');
    expect(byTest('filled')).toBe('6 / 6');
    expect(byTest('orders')).toBe('2');
  });

  it('jumps to a cell by pointer and by keyboard', () => {
    render();
    click(cell(0, 1));
    expect(narration()).toBe('m[1][2] = 5000, với cách chia tốt nhất ngay sau A1: A1 và A2.');
    const here = cell(1, 1);
    here.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    cell(1, 2).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toBe('m[2][3] = 25000, với cách chia tốt nhất ngay sau A2: A2 và A3.');
    click(cell(2, 0));
    expect(narration()).toBe('m[2][3] = 25000, với cách chia tốt nhất ngay sau A2: A2 và A3.');
  });

  it('switches to rod cutting and reads the pieces', () => {
    render();
    click(field('input[name="problem"][value="rod"]'));
    expect(field('input[name="input"]').value).toBe('1, 5, 8, 9');
    commit(field('select[name="preset"]'), 'eight');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Độ dài 1: một khúc không cắt được, nên mỗi ô trên đường chéo là giá của nó, 1.',
    );
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('22');
    expect(byTest('baseline')).toBe('20');
    expect(byTest('order')).toBe('2 + 6');
    expect(byTest('orders')).toBe('128');
    commit(field('select[name="preset"]'), 'whole');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Giá tốt nhất: 9, với các mẩu 3.');
  });

  it('reads typed input and refuses bad lists', () => {
    render();
    commit(field('input[name="input"]'), '2, 3, 4');
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('24');
    commit(field('input[name="input"]'), '5');
    expect(narration()).toBe('Hãy gõ từ 2 đến 8 kích thước: n ma trận có n + 1 kích thước.');
    expect(field('input[name="input"]').value).toBe('2, 3, 4');
    commit(field('input[name="input"]'), '2, 101');
    expect(narration()).toBe('Mỗi kích thước phải từ 1 đến 100.');
    commit(field('input[name="input"]'), 'a, b');
    expect(narration()).toBe('Hãy viết các số nguyên cách nhau bởi dấu phẩy.');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Độ dài 1');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    const [three, , six] = INTERVAL_PRESETS.matrix;
    expect(intervalTrace('matrix', three.input).at(-1)?.result).toBe(stored(0));
    const chain = intervalTrace('matrix', six.input).at(-1);
    expect(chain?.table[1][4]).toBe(stored(1));
    expect(chain?.tried).toBe(stored(2));
    expect(intervalTrace('rod', INTERVAL_PRESETS.rod[1].input).at(-1)?.result).toBe(stored(4));
    expect(orderCount('matrix', 6)).toBe(stored(6));
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
    answer.value = '5375';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '7125';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
