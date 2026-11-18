// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/multithreaded-algorithms/copy.en.js';

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

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );
const dag = () => document.querySelector('svg[role="img"]')?.getAttribute('aria-label');
/** @param {number} p */
const row = (p) => document.querySelector(`tr[data-p="${p}"]`)?.textContent ?? '';

/** @param {number} i */
function question(i) {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  return /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[i]);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const field = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('multithreaded algorithms lesson', () => {
  it('schedules P-FIB(5) on two processors', () => {
    render();
    expect(dag()).toBe('Computation DAG with 22 strands: work 22, span 9.');
    expect(text()).toContain('no schedule on 2 processors can take fewer than max(T₁/P, T∞) = 11');
    click(button('Bước tiếp'));
    expect(text()).toContain('Step 1: P1 runs P-FIB(5) spawns.');
    expect(text()).toContain('1 processor idles: nothing else is ready.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Step 2: P1 runs P-FIB(4) spawns; P2 runs P-FIB(3) spawns.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Done in T_P = 13 steps on 2 processors');
    expect(row(2)).toContain('13');
  });

  it('rebuilds the schedule when the processors change', () => {
    render();
    commit(input('processors'), '8');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Done in T_P = 9 steps on 8 processors');
    commit(input('processors'), '1');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Done in T_P = 22 steps on 1 processor,');
  });

  it('switches to parallel merge sort and resizes it', () => {
    render();
    click(radio('program', 'mergesort'));
    expect(dag()).toBe('Computation DAG with 22 strands: work 39, span 18.');
    commit(input('size'), '16');
    expect(dag()).toBe('Computation DAG with 46 strands: work 95, span 35.');
    commit(input('processors'), '4');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Done in T_P = 45 steps on 4 processors');
    click(button('Bước trước'));
    expect(text()).toContain('P1 runs merge 0–15');
  });

  it('marks the critical path and can hide it', () => {
    render();
    const thick = () => document.querySelectorAll('line[stroke-width="4"]').length;
    // P-FIB(5) has a critical path of 9 strands, so 8 edges.
    expect(thick()).toBe(8);
    click(input('critical'));
    expect(thick()).toBe(0);
  });

  it('checks answers in the practice block', () => {
    render();
    const q = question(0);
    answer(q, '9');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '11');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
