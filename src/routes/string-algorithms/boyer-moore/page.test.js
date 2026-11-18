// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_PATTERN, MAX_TEXT } from '$lib/algo-engine/boyer-moore.js';
import { vi as m } from '$lib/lessons/boyer-moore/copy.vi.js';
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

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const toLast = () => click(button('Đến bước cuối'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 400; i++) {
    if (narration().includes(kindText)) return;
    click(button('Bước tiếp'));
  }
  throw new Error(`never narrated ${kindText}`);
}

describe('Boyer-Moore lesson', () => {
  it('fills the table, then runs the classic example to the expected counters', () => {
    render();
    expect(narration()).toBe(
      'Trước hết ghi lại vị trí xuất hiện cuối cùng của mỗi kí tự trong example.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe('P[0] = e, nên last[e] = 0.');
    stepUntil('Đặt P ở vị trí 0');
    expect(titles()).toContain('Chỉ số cuối cột 0: 2');
    click(button('Bước tiếp'));
    expect(narration()).toBe('P[6] = e khác T[6] = a.');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Chữ a xa nhất bên phải trong P ở vị trí 2: cho nó thẳng hàng với văn bản, nhảy 4.',
    );
    expect(stat('rule')).toBe('max(1, j − last[a]) = max(1, 6 − (2)) = 4');
    toLast();
    expect(stat('comparisons')).toBe('15');
    expect(stat('alignments')).toBe('5');
    expect(stat('unread')).toBe('7');
    expect(stat('naive')).toBe('23');
    expect(narration()).toContain(
      '1 lần khớp với 15 lần so sánh, và 7 kí tự của văn bản chưa từng được đọc',
    );
  });

  it('jumps past a letter the pattern does not have', () => {
    render();
    commit(field('preset'), 'absent');
    stepUntil('P không có a');
    expect(narration()).toContain('nhảy 3');
    toLast();
    expect(stat('comparisons')).toBe('6');
    expect(stat('unread')).toBe('14');
    expect(titles().some((t) => t.includes('đã đọc'))).toBe(true);
  });

  it('skips only 1 when the rightmost copy is to the right of the mismatch', () => {
    render();
    commit(field('preset'), 'worst');
    stepUntil('sẽ làm P lùi lại');
    expect(stat('rule')).toBe('max(1, j − last[a]) = max(1, 0 − (4)) = 1');
    toLast();
    expect(stat('comparisons')).toBe('60');
    expect(stat('naive')).toBe('12');
  });

  it('lines up a next letter the pattern has after a match', () => {
    render();
    commit(field('text'), 'abaab');
    commit(field('pattern'), 'ab');
    stepUntil('xuất hiện ở vị trí 0');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Cho kí tự kế tiếp, a, thẳng hàng với lần xuất hiện xa nhất bên phải của nó trong P: nhảy 2.',
    );
  });

  it('jumps past a next letter the pattern lacks after a match', () => {
    render();
    commit(field('text'), 'abxab');
    commit(field('pattern'), 'ab');
    stepUntil('xuất hiện ở vị trí 0');
    click(button('Bước tiếp'));
    expect(narration()).toBe('Kí tự kế tiếp, x, không có trong P, nên nhảy qua nó: nhảy 3.');
  });

  it('reports matches and skips by the letter past the window', () => {
    render();
    commit(field('preset'), 'matches');
    stepUntil('xuất hiện ở vị trí 0');
    expect(titles().some((t) => t.includes('khớp toàn bộ'))).toBe(true);
    click(button('Bước tiếp'));
    expect(narration()).toBe('Kí tự kế tiếp, c, không có trong P, nên nhảy qua nó: nhảy 5.');
    toLast();
    expect(narration()).toContain('3 lần khớp');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe('hereisasimpleexample');
    commit(field('text'), 'a'.repeat(MAX_TEXT + 1));
    expect(narration()).toBe(errors.textLength);
    commit(field('pattern'), 'a'.repeat(MAX_PATTERN + 1));
    expect(narration()).toBe(errors.patternLength);
    commit(field('pattern'), '');
    expect(narration()).toBe(errors.empty);
    expect(field('pattern').value).toBe('example');
  });

  it('rebuilds on typed input, including a pattern longer than the text', () => {
    render();
    commit(field('text'), 'AB');
    expect(field('text').value).toBe('ab');
    toLast();
    expect(stat('alignments')).toBe('0');
    expect(narration()).toContain('0 lần khớp');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
