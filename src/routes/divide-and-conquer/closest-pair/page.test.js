// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { closestTrace } from '$lib/algo-engine/closest-pair.js';
import { vi as m } from '$lib/lessons/closest-pair/copy.vi.js';

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

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
const points = () => [...document.querySelectorAll('[data-point]')];
const plane = () =>
  /** @type {SVGSVGElement} */ (document.querySelector('svg[aria-label^="Mặt phẳng"]'));

const EXAMPLE = [
  [10, 80],
  [22, 30],
  [35, 62],
  [41, 15],
  [48, 50],
  [53, 52],
  [62, 85],
  [70, 25],
  [82, 60],
  [90, 10],
].map(([x, y], id) => ({ id, x, y }));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('closest pair lesson', () => {
  it('starts with ten points and the all-pairs count', () => {
    render();
    expect(points()).toHaveLength(10);
    expect(narration()).toContain('Xét mọi cặp sẽ phải tính khoảng cách 45 lần');
    expect(stat('Mọi cặp, n(n − 1)/2')).toBe('45');
  });

  it('finds E–F across the dividing line with fewer checks than all pairs', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Cặp gần nhất là E–F với khoảng cách 5.39 (√29)');
    expect(Number(stat('Số lần tính khoảng cách'))).toBeLessThan(45);
    expect(points()[4].getAttribute('aria-label')).toContain('thuộc cặp gần nhất');
  });

  it('draws the strip of width 2d in the top call', () => {
    render();
    const trace = closestTrace(EXAMPLE);
    const at = trace.findIndex((f) => f.kind === 'strip' && f.range?.[0] === 0 && f.range[1] === 9);
    seek(at);
    expect(narration()).toContain('Dải |x − 53| < 17.69 có 5 điểm, theo thứ tự y: D, H, E, F, G.');
    const inStrip = points().filter((p) => p.getAttribute('aria-label')?.includes('nằm trong dải'));
    expect(inStrip).toHaveLength(4);
    expect(document.querySelector('svg rect.stroke-state-frontier')).not.toBeNull();
  });

  it('fades the points outside the current call', () => {
    render();
    const trace = closestTrace(EXAMPLE);
    seek(trace.findIndex((f) => f.kind === 'base'));
    expect(points().filter((p) => p.getAttribute('class')?.includes('opacity-40')).length).toBe(8);
  });

  it('adds a point where the plane is clicked', () => {
    render();
    const svg = plane();
    svg.getBoundingClientRect = () =>
      /** @type {DOMRect} */ ({
        left: 0,
        top: 0,
        width: 108,
        height: 108,
        right: 108,
        bottom: 108,
      });
    svg.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 34, clientY: 54 }));
    flushSync();
    expect(points()).toHaveLength(11);
    expect(narration()).toContain('Đã thêm điểm K tại (30, 49).');
    expect(/** @type {HTMLInputElement} */ (field('points')).value).toContain('(30, 49)');
  });

  it('removes a point by click or by Enter, but keeps two', () => {
    render();
    click(points()[0]);
    expect(points()).toHaveLength(9);
    expect(narration()).toContain('Đã xoá điểm tại (10, 80).');
    const first = /** @type {HTMLElement} */ (points()[0]);
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(points()).toHaveLength(8);
    commit(field('points'), '(1, 1) (2, 2)');
    click(points()[0]);
    expect(narration()).toContain('Cần giữ lại ít nhất 2 điểm.');
    expect(points()).toHaveLength(2);
  });

  it('moves focus between points with the arrow keys', () => {
    render();
    const first = /** @type {HTMLElement} */ (points()[0]);
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(document.activeElement).toBe(points()[1]);
    expect(points()[1].getAttribute('tabindex')).toBe('0');
  });

  it('refuses bad points and keeps the last valid ones', () => {
    render();
    const before = /** @type {HTMLInputElement} */ (field('points')).value;
    commit(field('points'), '(1, 2) (1, 2)');
    expect(narration()).toContain('Các điểm phải khác nhau.');
    expect(/** @type {HTMLInputElement} */ (field('points')).value).toBe(before);
    commit(field('points'), '(1, 200) (3, 4)');
    expect(narration()).toContain('từ 0 đến 99');
    commit(field('points'), 'hello');
    expect(narration()).toContain('Hãy nhập các điểm dưới dạng cặp x, y');
  });

  it('loads presets and random points', () => {
    render();
    commit(field('preset'), 'crowded');
    expect(text()).toContain('Đã nạp bộ điểm mới.');
    expect(points()).toHaveLength(12);
    click(buttonByText('Điểm ngẫu nhiên'));
    expect(points().length).toBeGreaterThanOrEqual(8);
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
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
