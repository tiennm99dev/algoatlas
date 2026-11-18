// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_PATTERN, MAX_TEXT } from '$lib/algo-engine/kmp.js';
import { vi as m } from '$lib/lessons/kmp/copy.vi.js';
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

describe('KMP lesson', () => {
  it('builds the prefix function, then searches to the expected counters', () => {
    render();
    expect(narration()).toContain('Trước hết tính hàm tiền tố của ababd');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'So P[1] = b với P[0] = a: khác nhau, và chưa có gì khớp, nên ta sang kí tự kế tiếp.',
    );
    stepUntil('π đã sẵn sàng');
    expect(stat('build')).toBe('5');
    expect(titles().some((t) => t.includes('Giá trị π cột 3: 2'))).toBe(true);
    toLast();
    expect(stat('comparisons')).toBe('18');
    expect(stat('falls')).toBe('4');
    expect(stat('naive')).toBe('28');
    expect(narration()).toContain('1 lần khớp với 18 lần so sánh');
  });

  it('jumps the pattern on a mismatch and keeps the same text index', () => {
    render();
    stepUntil('π đã sẵn sàng');
    stepUntil('Nhảy lùi');
    expect(narration()).toContain('Nhảy lùi: π[3] = 2');
    expect(narration()).toContain('dời P sang phải 2 ô');
    expect(stat('i')).toBe('4');
    expect(stat('k')).toBe('2');
    expect(titles().some((t) => t.includes('viền được giữ sau khi nhảy'))).toBe(true);
  });

  it('marks a full match and catches the overlapping one', () => {
    render();
    commit(field('preset'), 'overlap');
    stepUntil('xuất hiện ở vị trí 0');
    expect(titles().some((t) => t.includes('khớp toàn bộ'))).toBe(true);
    expect(titles()).toContain('Hàng mẫu cột 0: a, khớp toàn bộ');
    expect(titles()).toContain('Hàng mẫu cột 3: b, khớp toàn bộ');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Để bắt được các lần khớp chồng nhau');
    // The border ab stays under the text letters it matched, at columns 2 and 3.
    expect(titles()).toContain('Hàng mẫu cột 2: a, viền được giữ sau khi nhảy');
    expect(titles()).toContain('Hàng mẫu cột 3: b, viền được giữ sau khi nhảy');
    toLast();
    expect(stat('comparisons')).toBe('8');
  });

  it('says plainly when a fallback keeps no letters', () => {
    render();
    commit(field('text'), 'abcx');
    commit(field('pattern'), 'abcd');
    stepUntil('Nhảy lùi');
    expect(narration()).toBe(
      'Nhảy lùi: π[2] = 0. Không phần nào của đoạn đã khớp có thể làm đầu một lần khớp, nên dời P sang phải 3 ô. Chỉ số i vẫn ở 3.',
    );
  });

  it('rebuilds on a typed text and pattern', () => {
    render();
    commit(field('text'), 'AAAAB');
    commit(field('pattern'), 'aab');
    toLast();
    expect(stat('comparisons')).toBe('7');
    expect(stat('falls')).toBe('2');
    expect(field('text').value).toBe('aaaab');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.fieldErrors(MAX_TEXT, MAX_PATTERN);
    commit(field('text'), 'a b');
    expect(narration()).toBe(errors.format);
    expect(field('text').value).toBe('abababcabababd');
    commit(field('text'), 'a'.repeat(MAX_TEXT + 1));
    expect(narration()).toBe(errors.textLength);
    commit(field('pattern'), 'a'.repeat(MAX_PATTERN + 1));
    expect(narration()).toBe(errors.patternLength);
    commit(field('pattern'), '');
    expect(narration()).toBe(errors.empty);
    expect(field('pattern').value).toBe('ababd');
  });

  it('commits a field on Enter and handles a pattern longer than the text', () => {
    render();
    const f = field('pattern');
    f.focus();
    f.value = 'abababcabababdab'.slice(0, MAX_PATTERN);
    f.dispatchEvent(new Event('input', { bubbles: true }));
    f.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    commit(field('text'), 'ab');
    toLast();
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
