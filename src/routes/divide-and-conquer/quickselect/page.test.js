// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { selectTrace } from '$lib/algo-engine/quickselect.js';
import { vi as m } from '$lib/lessons/quickselect/copy.vi.js';

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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
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

/** @param {number} index */
function seek(index) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Bước"]'));
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** @param {string} value */
function pickRule(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
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
const EXAMPLE = [38, 12, 77, 5, 64, 29, 91, 46, 18, 83, 55, 3];

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('quickselect lesson', () => {
  it('starts on the 6th smallest of the example', () => {
    render();
    expect(narration()).toContain('Tìm phần tử nhỏ thứ 6 trong 12 giá trị');
    expect(narration()).toContain('ô 5');
  });

  it('finds the answer and reports rounds and comparisons', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toContain(
      'Phần tử nhỏ thứ 6 là 38, tìm được sau 2 vòng với 21 lần so sánh',
    );
    expect(stat('Số vòng')).toBe('2');
  });

  it('fades the discarded side after a discard', () => {
    render();
    const trace = selectTrace(EXAMPLE, 6, 'last');
    const at = trace.findIndex((f) => f.kind === 'discard');
    seek(at);
    expect(narration()).toMatch(/nên bỏ \[\d+–\d+\]/);
    expect(stat('Giá trị còn xét')).toBe(String(trace[at].hi - trace[at].lo + 1));
  });

  it('shows groups of 5 and their medians under median of medians', () => {
    render();
    pickRule('mom');
    expect(narration()).toContain('Cách chọn chốt: Trung vị của các trung vị.');
    expect(text()).toContain('medianOfMedians(a, lo, hi):');
    const trace = selectTrace(EXAMPLE, 6, 'mom');
    seek(trace.findIndex((f) => f.kind === 'groups'));
    expect(narration()).toContain('thành 3 nhóm, mỗi nhóm tối đa 5');
    seek(trace.findIndex((f) => f.kind === 'medians'));
    expect(narration()).toContain('tìm được nhờ một lần chọn đệ quy');
    const strip = document.querySelector('[aria-label^="Mảng:"]');
    expect(strip?.textContent).toContain('m');
    expect(strip?.getAttribute('aria-label')).toContain('g1');
  });

  it('compares the three pivot rules on the same input', () => {
    render();
    expect(text()).toMatch(/Giá trị cuối\s*21 lần so sánh/);
    expect(text()).toMatch(/Trung vị của các trung vị\s*30 lần so sánh/);
    expect(text()).toContain('19 lần trong số đó dùng để chọn chốt');
    expect(text()).toContain('Sắp xếp trước, rồi lấy theo chỉ số');
  });

  it('runs the random rule without breaking the answer', () => {
    render();
    pickRule('random');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Phần tử nhỏ thứ 6 là 38');
  });

  it('shows the quadratic case for the minimum of sorted input', () => {
    render();
    commit(field('preset'), 'sorted');
    expect(text()).toContain('Đã nạp mảng mới.');
    commit(field('k'), '1');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('sau 11 vòng với 66 lần so sánh');
    pickRule('mom');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('sau 3 vòng với 36 lần so sánh');
  });

  it('refuses a k outside 1..n and bad values, keeping the last valid ones', () => {
    render();
    commit(field('k'), '13');
    expect(narration()).toContain('k phải là số nguyên từ 1 đến 12');
    expect(/** @type {HTMLInputElement} */ (field('k')).value).toBe('6');
    commit(field('values'), '1, 2, q');
    expect(narration()).toContain('Hãy nhập các số nguyên');
    expect(/** @type {HTMLInputElement} */ (field('values')).value).toBe(EXAMPLE.join(', '));
  });

  it('clamps k when fewer values are typed, and commits on Enter', () => {
    render();
    const values = /** @type {HTMLInputElement} */ (field('values'));
    values.value = '9 4 7';
    values.dispatchEvent(new Event('input', { bubbles: true }));
    values.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('Tìm phần tử nhỏ thứ 3 trong 3 giá trị');
  });

  it('loads a random array from the button', () => {
    render();
    click(buttonByText('Mảng ngẫu nhiên'));
    expect(text()).toContain('Đã nạp mảng mới.');
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
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
