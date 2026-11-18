// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-arrays-strings/copy.vi.js';

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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const verdict = () =>
  document.querySelector('[data-testid="verdict"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

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
function pickTechnique(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="technique"][value="${value}"]`)
    ),
  );
}

/** @param {string} value */
function pickProblem(value) {
  const select = /** @type {HTMLSelectElement} */ (
    document.querySelector('select[name="problem"]')
  );
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Steps column of the comparison table, by technique name. */
function compareSteps() {
  return Object.fromEntries(
    [...document.querySelectorAll('[data-testid="compare"] tbody tr')].map((tr) => [
      tr.querySelector('th')?.textContent?.trim(),
      tr.querySelectorAll('td')[1]?.textContent?.trim(),
    ]),
  );
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('array and string practice lesson', () => {
  it('runs two pointers on the sorted pair-sum sample', () => {
    render();
    expect(verdict()).toContain('Hai con trỏ: Phù hợp nhất');
    expect(narration()).toBe(
      'Tìm một cặp có tổng 14. Đặt lo ở giá trị đầu tiên và hi ở giá trị cuối cùng.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'a[0] + a[6] = 1 + 15 = 16 > 14: quá lớn. a[lo] là số ghép cặp nhỏ nhất còn lại của a[hi], nên dời hi sang trái.',
    );
    expect(text()).toContain('Chỉ số 6: 15, đang đọc');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong: a[1] + a[5] = 14, sau 3 bước.');
    expect(stat(m.stats.answer)).toBe('(1, 5)');
    expect(text()).toContain('Chỉ số 1: 3, thuộc đáp án');
    expect(compareSteps()).toEqual({
      'Hai con trỏ': '3',
      'Cửa sổ trượt': m.notApplicable,
      'Prefix sum': m.notApplicable,
      'Vét cạn': '10',
    });
  });

  it('explains a technique that does not fit', () => {
    render();
    pickTechnique('window');
    expect(verdict()).toContain('Cửa sổ trượt: Không phù hợp');
    expect(narration()).toContain('Cửa sổ trượt không phù hợp với bài toán này.');
    expect(text()).toContain(m.noCode);
    pickTechnique('brute');
    expect(verdict()).toContain('Vét cạn: Dùng được, nhưng chưa tốt nhất');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.steps)).toBe('10');
  });

  it('compares the techniques on the shortest-run sample', () => {
    render();
    pickProblem('shortest-window');
    expect(text()).toContain(m.statements['shortest-window']);
    pickTechnique('window');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.answer)).toBe('2');
    expect(narration()).toBe('Xong: đoạn ngắn nhất là a[4..5], độ dài 2, sau 11 bước.');
    pickTechnique('prefix');
    expect(text()).toContain(m.auxTitles.prefix);
    click(button('Bước tiếp'));
    expect(narration()).toBe('P[1] = P[0] + a[0] = 0 + 2 = 2.');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.steps)).toBe('23');
    expect(compareSteps()['Vét cạn']).toBe('17');
  });

  it('answers range queries with prefix sums and edits the queries', () => {
    render();
    pickProblem('range-sums');
    pickTechnique('prefix');
    expect(input('queries').value).toBe('0 3, 2 6, 5 5, 1 7');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.answer)).toBe('7, 11, −1, 15');
    commit(input('queries'), '0 7');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.answer)).toBe('18');
    expect(stat(m.stats.steps)).toBe('9');
    commit(input('queries'), '3 9');
    expect(narration()).toBe(m.queryErrors.range);
    expect(input('queries').value).toBe('0 7');
  });

  it('checks a palindrome by copying it backwards', () => {
    render();
    pickProblem('palindrome');
    pickTechnique('brute');
    expect(text()).toContain(m.auxTitles.reversed);
    commit(input('values'), 'lever');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.answer)).toBe(m.no);
    expect(text()).toContain('Chỉ số 0: l, không khớp');
    click(buttonByText(m.sampleButton));
    expect(input('values').value).toBe('abcdcba');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.answer)).toBe(m.yes);
  });

  it('rejects input the problem does not allow and keeps the last valid values', () => {
    render();
    commit(input('values'), '5, 1, 3');
    expect(narration()).toBe(m.valueErrors.unsorted);
    expect(input('values').value).toBe('1, 3, 4, 6, 8, 11, 15');
    commit(input('target'), '500');
    expect(narration()).toBe(m.targetError('pair-sum', 7));
    expect(input('target').value).toBe('14');
    pickProblem('shortest-window');
    commit(input('values'), '2, -1');
    expect(narration()).toBe(m.valueErrors.negative);
    pickProblem('max-window');
    commit(input('values'), '1, 2');
    expect(input('target').value).toBe('2');
  });

  it('steps with the keyboard', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('a[0] + a[6]');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
