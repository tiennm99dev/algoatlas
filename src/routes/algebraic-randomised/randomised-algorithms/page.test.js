// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  MAX_N,
  MAX_RUNS,
  MAX_VALUE,
  MIN_N,
  QUICK_PRESETS,
  RUN_BATCH,
  expectedComparisons,
  quicksortTrace,
} from '$lib/algo-engine/randomised-algorithms.js';
import { vi as m } from '$lib/lessons/randomised-algorithms/copy.vi.js';
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
const toLast = () => click(button('Đến bước cuối'));
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Bước tiếp'));
};
/** @param {string} value */
function pickRule(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="rule"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

describe('randomised algorithms lesson', () => {
  it('steps through one randomised run that ends sorted', () => {
    render();
    expect(narration()).toContain(
      'Sắp xếp 16 giá trị, mỗi lời gọi dùng một chốt chọn ngẫu nhiên đều',
    );
    expect(stat('expected')).toBe(m.oneDp(expectedComparisons(16)));
    expect(stat('worst')).toBe('120');
    next(2);
    expect(narration()).toMatch(/Đồng xu chọn vị trí \d+: đổi nó về cuối/);
    next(1);
    expect(narration()).toMatch(/^So sánh \d+ với x = \d+/);
    toLast();
    expect(narration()).toContain('kết quả luôn được sắp xếp');
    const markers = [...document.querySelectorAll('[role="img"] span')]
      .map((s) => s.textContent?.trim())
      .filter((t) => t === '✓');
    expect(markers).toHaveLength(16);
  });

  it('hits the worst case on sorted input with the last-element pivot', () => {
    render();
    commit(field('preset'), 'sorted');
    pickRule('last');
    toLast();
    expect(stat('comparisons')).toBe('120');
    expect(stat('depth')).toBe('15');
    expect(narration()).toContain('Mọi lần chạy trên đầu vào này đều đi đúng những bước như nhau');
  });

  it('samples many runs into a histogram, and clears it when the input changes', () => {
    render();
    expect(stat('runs')).toBe('0');
    click(buttonByText(m.runMany(RUN_BATCH)));
    click(buttonByText(m.runMany(RUN_BATCH)));
    expect(stat('runs')).toBe('200');
    expect(stat('correct')).toBe('200/200');
    expect(Math.abs(Number(stat('mean')) - expectedComparisons(16))).toBeLessThan(5);
    expect(document.querySelector('[data-testid="histogram"]')?.children.length).toBeGreaterThan(1);
    pickRule('last');
    expect(stat('runs')).toBe('0');
    commit(field('preset'), 'sorted');
    click(buttonByText(m.runMany(RUN_BATCH)));
    expect(stat('min')).toBe('120');
    expect(stat('max')).toBe('120');
    expect(document.querySelector('[data-testid="histogram"]')?.children.length).toBe(1);
    click(buttonByText(m.clear));
    expect(stat('runs')).toBe('0');
  });

  it('caps the number of sampled runs', () => {
    render();
    for (let k = 0; k < MAX_RUNS / RUN_BATCH; k++) click(buttonByText(m.runMany(RUN_BATCH)));
    expect(stat('runs')).toBe(String(MAX_RUNS));
    click(buttonByText(m.runMany(RUN_BATCH)));
    expect(narration()).toBe(m.runsFull(MAX_RUNS));
  });

  it('rebuilds from typed values and refuses bad ones', () => {
    render();
    commit(field('values'), '3 1 2');
    pickRule('last');
    toLast();
    expect(stat('comparisons')).toBe('2');
    expect(stat('worst')).toBe('3');
    commit(field('values'), '5');
    expect(narration()).toBe(m.valuesError(MIN_N, MAX_N, MAX_VALUE));
    expect(field('values').value).toBe('3, 1, 2');
    commit(field('values'), '1, 2, 100');
    expect(narration()).toBe(m.valuesError(MIN_N, MAX_N, MAX_VALUE));
    click(buttonByText(m.reroll));
    toLast();
    expect(stat('comparisons')).toBe('2');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '256';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[1]).hints[0]);
    answer.value = '120';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const worst = quicksortTrace(QUICK_PRESETS.sorted, 'last').at(-1);
    expect(/** @type {any} */ (m.practice[1]).answer).toBe(worst?.comparisons);
    expect(
      Math.abs(/** @type {any} */ (m.practice[2]).answer - expectedComparisons(16)),
    ).toBeLessThan(0.05);
    // For 3 keys, the ends are compared in 2 of the 3 equally likely first pivots.
    expect(Math.abs(/** @type {any} */ (m.practice[4]).answer - 2 / 3)).toBeLessThan(1e-9);
  });
});
