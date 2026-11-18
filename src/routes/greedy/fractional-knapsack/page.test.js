// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/fractional-knapsack/copy.vi.js';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
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

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const rows = () =>
  [...document.querySelectorAll('[data-testid="rows"] tbody tr')].map((tr) =>
    [...tr.children].map((c) => c.textContent?.replace(/\s+/g, ' ').trim()).join(' | '),
  );

/** @param {string} value */
function pickProblem(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('fractional knapsack lesson', () => {
  it('starts on the textbook knapsack', () => {
    render();
    expect(narration()).toContain('Xếp vào cái túi sức chứa 50 từ 3 vật');
    expect(stat('Còn trống')).toBe('50');
    expect(document.querySelector('[data-testid="zero-one"]')?.textContent).toContain(
      'Tham lam theo giá trị/khối lượng xếp được 160; tốt nhất là 220, nên tham lam thua.',
    );
  });

  it('sorts by value per weight and packs whole items first', () => {
    render();
    click(button('Bước tiếp'));
    expect(narration()).toContain(
      'Sắp xếp theo giá trị trên mỗi đơn vị khối lượng, cao nhất trước: A (6), B (5), C (4).',
    );
    click(button('Bước tiếp'));
    expect(narration()).toContain('Còn trống 50 đơn vị, nên vừa cả vật.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Lấy cả A: +60. Giá trị 60, còn trống 40 đơn vị.');
    expect(rows()[0]).toContain('A ✓');
  });

  it('cuts the last item to two thirds and reaches 240', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Xong: giá trị 240, chỉ cắt C, còn 2/3.');
    expect(stat('Giá trị đã xếp')).toBe('240');
    expect(stat('Còn trống')).toBe('0');
    expect(rows()).toEqual([
      'A ✓ | 60 | 10 | 6 | 1',
      'B ✓ | 100 | 20 | 5 | 1',
      'C ½ | 120 | 30 | 4 | 2/3',
    ]);
    const piece = document.querySelector('g[role="listitem"][aria-label^="C:"]');
    expect(piece?.getAttribute('aria-label')).toBe('C: 2/3, khối lượng 20');
  });

  it('stops early when the knapsack fills, and packs everything when it all fits', () => {
    render();
    commit(field('capacity'), '25');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('Túi đã đầy, nên dừng: C và mọi vật sau nó đều ở ngoài.');
    commit(field('preset'), 'roomy');
    expect(text()).toContain('Đã nạp ví dụ mới.');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Mọi vật đều vừa nguyên vẹn: giá trị 280, còn dư 40 đơn vị.');
  });

  it('refuses bad items and capacities, keeping the last valid ones', () => {
    render();
    commit(field('items'), '60/10, 5/0');
    expect(narration()).toContain('Mỗi khối lượng phải từ 1 đến 99.');
    expect(/** @type {HTMLInputElement} */ (field('items')).value).toBe('60/10, 100/20, 120/30');
    commit(field('capacity'), '0');
    expect(narration()).toContain('Sức chứa phải là số nguyên từ 1 đến 200.');
    expect(/** @type {HTMLInputElement} */ (field('capacity')).value).toBe('50');
    commit(field('items'), '10/5 9/3');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Mọi vật đều vừa nguyên vẹn: giá trị 19');
  });

  it('commits typed items on Enter', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('items'));
    input.value = '30/6 20/4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('từ 2 vật');
  });

  it('schedules the five classic jobs for a profit of 142', () => {
    render();
    pickProblem('jobs');
    expect(narration()).toContain(
      'Xếp lịch 5 việc, mỗi việc dài một ô thời gian, vào các ô từ 1 đến 3.',
    );
    expect(stat('Tốt nhất có thể')).toBe('142');
    click(button('Bước tiếp'));
    expect(narration()).toContain(
      'Sắp xếp theo lợi nhuận, cao nhất trước: A (100), C (27), D (25), B (19), E (15).',
    );
    click(button('Bước tiếp'));
    expect(narration()).toContain('ô 2 là ô trống muộn nhất');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Đặt A vào ô 2');
    click(button('Đến bước cuối'));
    expect(narration()).toContain(
      'Xong: lợi nhuận 142, cao nhất mà một lịch bất kì có thể đạt. Bỏ qua: D, B.',
    );
    expect(stat('Số lần dò ô')).toBe('6');
    expect(rows()).toContain('B | 19 | 1 | bỏ qua');
    expect(document.querySelector('[aria-label^="3 ô thời gian"]')?.textContent).toContain('E');
  });

  it('shows a job that finds every slot taken', () => {
    render();
    pickProblem('jobs');
    commit(field('preset'), 'crowded');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    click(button('Bước trước'));
    expect(narration()).toContain('D: lợi nhuận 6, hạn chót 3. Các ô 3, 2, 1 đều đã có việc.');
    commit(field('jobs'), '5/11');
    expect(narration()).toContain('Mỗi hạn chót phải từ 1 đến 10.');
    expect(/** @type {HTMLInputElement} */ (field('jobs')).value).toBe('9/3, 8/3, 7/3, 6/3');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '220';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '240';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
