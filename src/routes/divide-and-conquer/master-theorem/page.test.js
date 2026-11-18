// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/master-theorem/copy.vi.js';

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
  vi.useRealTimers();
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

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const nodeTitles = () =>
  [...document.querySelectorAll('svg g > title')]
    .map((t) => t.textContent ?? '')
    .filter((t) => t.startsWith('Lời gọi cỡ'));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('master theorem lesson', () => {
  it('starts on merge sort with divide, conquer and combine named', () => {
    render();
    expect(narration()).toContain('T(n) = 2T(n/2) + n.');
    expect(narration()).toContain('Chia: 2 bài toán con cỡ n/2');
    expect(narration()).toContain('Kết hợp: f(n) = n là phần việc');
    expect(nodeTitles()).toHaveLength(31);
  });

  it('sums each level and ends in case 2 with every level starred', () => {
    render();
    click(button('Bước tiếp'));
    expect(narration()).toContain('Tầng 0: 1 lời gọi cỡ 16');
    expect(text()).toContain('Tầng 0');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('T(n) = Θ(n log n). Tầng nào cũng được gắn sao');
    expect(text()).toContain('Trường hợp 2: T(n) = Θ(n log n)');
    expect(nodeTitles().every((t) => t.endsWith('trội'))).toBe(true);
  });

  it('stars only the leaves for Strassen and names the irrational exponent', () => {
    render();
    commit(field('preset'), 'strassen');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Trường hợp 1: T(n) = Θ(n^(log₂ 7)) ≈ Θ(n^2.81)');
    const dominant = nodeTitles().filter((t) => t.endsWith('trội'));
    expect(dominant).toHaveLength(49);
    expect(dominant.every((t) => t.startsWith('Lời gọi cỡ 1 '))).toBe(true);
  });

  it('stars the root in case 3 and checks regularity', () => {
    render();
    commit(field('preset'), 'root');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('a·f(n/b) ≤ 0.5·f(n), với 0.5 < 1');
    expect(nodeTitles().filter((t) => t.endsWith('trội'))).toEqual([
      'Lời gọi cỡ 16 ở tầng 0, chi phí 256, trội',
    ]);
  });

  it('says no case applies to n / log n', () => {
    render();
    commit(field('preset'), 'gap');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Không trường hợp nào áp dụng');
    expect(nodeTitles().some((t) => t.endsWith('trội'))).toBe(false);
  });

  it('rebuilds the trace when a field changes and clears the preset', () => {
    render();
    commit(field('k'), '3');
    commit(field('a'), '4');
    expect(narration()).toContain('T(n) = 4T(n/2) + n.');
    expect(/** @type {HTMLSelectElement} */ (field('preset')).value).toBe('');
    commit(field('p'), '1');
    expect(narration()).toContain('T(n) = 4T(n/2) + n log n.');
    commit(field('d'), '2');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Trường hợp 2: T(n) = Θ(n² log² n)');
  });

  it('refuses a tree too big to draw and keeps the last valid value', () => {
    render();
    commit(field('k'), '6');
    expect(text()).toContain('cây được vẽ có tối đa 85 lời gọi');
    expect(/** @type {HTMLInputElement} */ (field('k')).value).toBe('4');
    commit(field('a'), '0');
    expect(/** @type {HTMLInputElement} */ (field('a')).value).toBe('2');
    click(button('Bước tiếp'));
    expect(text()).not.toContain('cây được vẽ có tối đa');
  });

  it('commits the number fields on Enter', () => {
    render();
    const b = /** @type {HTMLInputElement} */ (field('b'));
    b.value = '4';
    b.dispatchEvent(new Event('input', { bubbles: true }));
    b.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('T(n) = 2T(n/4) + n.');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[2]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '0.75';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '0.1875';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
