// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/amortized-dynamic-arrays/copy.vi.js';

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
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickMethod(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="method"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 400 && !narration().includes(part); k++) click(button('Bước tiếp'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('amortized dynamic arrays lesson', () => {
  it('pays for 9 appends with 3 coins each', () => {
    render();
    expect(narration()).toBe(
      'Một mảng động rỗng sức chứa 1 và một ống heo rỗng. Ta sẽ chạy 9 lần thêm, mỗi lần thu 3 xu.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe('Lần thêm 1: bỏ 3 xu vào ống heo, giờ ống heo có 3 xu.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Ghi 1 vào A[0], tốn 1 xu. Lần thêm 1 tốn 1 bước');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.total)).toBe('24');
    expect(stat(m.stats.bound)).toBe('27');
    expect(stat(m.stats.bank)).toBe('3');
    expect(stat(m.stats.worst)).toBe('9');
    expect(narration()).toContain(
      'Ống heo chưa bao giờ xuống dưới 0, nên c = 3 trả đủ cho mọi lần thêm.',
    );
  });

  it('shows the old block while a resize copies it', () => {
    render();
    stepUntil('Cấp phát một khối 4 ô');
    expect(text()).toContain(m.oldBlockTitle);
    click(button('Bước tiếp'));
    expect(narration()).toBe('Sao chép phần tử 0, tốn 1 xu. Ống heo: 5.');
    stepUntil('Đổi kích thước xong');
    expect(text()).not.toContain(m.oldBlockTitle);
  });

  it('goes into debt on append 5 with a charge of 2', () => {
    render();
    commit(input('charge'), '2');
    stepUntil('đang âm!');
    expect(narration()).toBe('Sao chép phần tử 3, tốn 1 xu. Ống heo: −1 — đang âm!');
    expect(stat(m.stats.op)).toBe('5 / 9');
    expect(text()).toContain(m.debt);
    click(button('Đến bước cuối'));
    expect(text()).toContain(m.accounting.broke(5, 2));
    expect(narration()).toContain('Ống heo bị âm ở lần thêm 5, nên c = 2 là chưa đủ.');
  });

  it('adds up the same run with the aggregate method', () => {
    render();
    pickMethod('aggregate');
    click(button('Đến bước cuối'));
    expect(text()).toContain('9 lần thêm: 9 lần ghi + sao chép 1 + 2 + 4 + 8 = 9 + 15 = 24 bước.');
    expect(text()).toContain('24 < 3 × 9 = 27, trung bình 2.67 bước mỗi lần thêm.');
  });

  it('keeps the last valid values and submits with Enter', () => {
    render();
    commit(input('appends'), '65');
    expect(narration()).toBe(m.appendsError);
    expect(input('appends').value).toBe('9');
    commit(input('charge'), '0');
    expect(narration()).toBe(m.chargeError);
    expect(input('charge').value).toBe('3');
    input('appends').value = '64';
    input('appends').dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (input('appends').closest('form')).requestSubmit();
    flushSync();
    click(button('Đến bước cuối'));
    expect(stat(m.stats.total)).toBe('127');
    expect(stat(m.stats.worst)).toBe('33');
    expect(stat(m.stats.bank)).toBe('65');
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '48';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
