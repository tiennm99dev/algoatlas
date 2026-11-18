// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { GEO_PRESETS, puzzleTrace } from '$lib/algo-engine/practice-geometry.js';
import { vi as m } from '$lib/lessons/practice-geometry/copy.vi.js';
import Page from './+page.svelte';

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
  vi.restoreAllMocks();
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
  if (!el) throw new Error(`no button with text ${label}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {string} id */
const cell = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {string} name @param {string} value */
function choose(name, value) {
  const select = /** @type {HTMLSelectElement} */ (
    document.querySelector(`select[name="${name}"]`)
  );
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {number} id */
const point = (id) => /** @type {SVGElement} */ (document.querySelector(`[data-point="${id}"]`));

/** @param {Element} el @param {string} key @param {boolean} [shiftKey] */
function press(el, key, shiftKey = false) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  );
  flushSync();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} value */
function guess(value) {
  const input = field('guess');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('geometry practice', () => {
  it('checks a predicted cross product and moves on only when it is right', () => {
    render();
    expect(narration()).toContain('Đường thẳng A → B đi từ A (1, 1) đến B (11, 6)');
    click(button('Bước tiếp'));
    expect(narration()).toContain('p = C (2, 5)');
    guess('30');
    expect(cell('feedback')).toContain('Chưa đúng');
    expect(cell('wrong')).toBe('1');
    guess('35');
    expect(cell('feedback')).toBe('Đúng rồi: 35.');
    expect(cell('correct')).toBe('1');
    expect(narration()).toContain('C nằm bên trái A → B');
    expect(cell('left')).toBe('1');
  });

  it('asks for a whole number first', () => {
    render();
    click(button('Bước tiếp'));
    guess('');
    expect(cell('feedback')).toBe(m.askEmpty);
  });

  it('finds the points on line AB exactly', () => {
    render();
    click(button('Đến bước cuối'));
    expect(cell('left')).toBe('3');
    expect(cell('right')).toBe('2');
    expect(cell('on')).toBe('2');
    expect(text()).toContain(m.askDone);
    expect(point(3).getAttribute('aria-label')).toContain('trên đường thẳng AB');
  });

  it('sums the fence area with the shoelace terms', () => {
    render();
    choose('puzzle', 'fence');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Bao lồi có 6 đỉnh');
    click(button('Bước tiếp'));
    guess('-7');
    expect(cell('twice')).toBe('−7');
    click(button('Đến bước cuối'));
    expect(cell('area')).toBe('46.5');
    expect(cell('perimeter')).toBe('27.38');
  });

  it('compares only hull corners for the farthest pair', () => {
    render();
    choose('puzzle', 'diameter');
    click(button('Đến bước cuối'));
    expect(cell('best')).toBe('125');
    expect(cell('pairs')).toBe('15');
    expect(cell('brute')).toBe('36');
    expect(narration()).toContain('Cặp xa nhất là A và B');
  });

  it('re-runs when an example loads or a point moves', () => {
    render();
    choose('puzzle', 'fence');
    choose('preset', 'square');
    click(button('Đến bước cuối'));
    expect(cell('area')).toBe('48');
    // E at (6, 4) moves out past the top edge to (6, 8): a fifth corner adds a triangle of 4.
    for (let i = 0; i < 4; i++) press(point(4), 'ArrowUp', true);
    click(button('Đến bước cuối'));
    expect(cell('corners')).toBe('5');
    expect(cell('area')).toBe('52');
  });

  it('refuses to move a point onto another', () => {
    render();
    // G (9, 5) goes up to (9, 6), right to (10, 6), then right again onto B at (11, 6).
    press(point(6), 'ArrowUp', true);
    press(point(6), 'ArrowRight', true);
    press(point(6), 'ArrowRight', true);
    expect(text()).toContain(m.occupiedError);
    expect(point(6).getAttribute('aria-label')).toContain('(10, 6)');
  });

  it('adds a point from the fields, removes it, and keeps at least three', async () => {
    render();
    commit(field('x'), '12');
    commit(field('y'), '0');
    click(buttonByText(m.addPoint));
    click(button('Đến bước cuối'));
    expect(cell('right')).toBe('3');
    press(point(9), 'Delete');
    await Promise.resolve();
    click(button('Đến bước cuối'));
    expect(cell('right')).toBe('2');
    choose('preset', 'triangle');
    for (const id of [5, 4, 3, 2]) press(point(id), 'Delete');
    expect(text()).toContain(m.minError(3));
  });

  it('refuses a bad coordinate and needs a selection to remove', () => {
    render();
    commit(field('y'), '50');
    expect(text()).toContain(m.coordError(12, 8));
    expect(field('y').value).toBe('0');
    click(buttonByText(m.removePoint));
    expect(text()).toContain(m.selectFirst);
    press(point(2), 'Enter');
    click(buttonByText(m.removePoint));
    expect(point(2)).toBeNull();
  });

  it('loads a random cloud on the button', () => {
    render();
    vi.spyOn(Math, 'random').mockImplementation(
      (() => {
        let s = 3;
        return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
      })(),
    );
    click(buttonByText(m.random));
    expect(document.querySelectorAll('[data-point]')).toHaveLength(9);
  });

  it('keeps its stored answers true to the engine', () => {
    const field = GEO_PRESETS.field;
    const side = puzzleTrace('side', field);
    const fence = puzzleTrace('fence', field).at(-1);
    const far = puzzleTrace('diameter', field).at(-1);
    const answers = m.practice.map((ex) => /** @type {any} */ (ex).answer);
    expect(side.at(-1)?.sides.on.length).toBe(answers[0]);
    expect(side.find((f) => f.kind === 'read')?.ask).toBe(answers[1]);
    expect((fence?.twice ?? 0) / 2).toBe(answers[2]);
    expect(far?.best).toBe(answers[3]);
    expect(far?.steps).toBe(answers[4]);
    expect(far?.brute).toBe(36);
  });

  it('checks a right and a wrong answer, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const answer = (value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer('3');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLButtonElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('2');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
