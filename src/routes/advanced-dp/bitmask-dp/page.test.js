// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { checkAnswer, exerciseProblems } from '$lib/components/answer-check.js';
import {
  CITY_PRESETS,
  distances,
  heldKarpTrace,
  transitionCount,
} from '$lib/algo-engine/bitmask-dp.js';
import { en as m } from '$lib/lessons/bitmask-dp/copy.en.js';
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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button with text ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {Element} el @param {string} key @param {boolean} [shiftKey] */
function press(el, key, shiftKey = false) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  );
  flushSync();
}

/** @param {string} value */
function pick(value) {
  const select = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {number} id */
const city = (id) => /** @type {SVGElement} */ (document.querySelector(`[data-point="${id}"]`));
/** @param {number} mask @param {number} j */
const cell = (mask, j) => document.querySelector(`[data-cell="${mask}-${j}"]`);
const rows = () => document.querySelectorAll('tr[data-mask]').length;

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('bitmask DP lesson', () => {
  it('fills the mask table and reads back the shortest tour', () => {
    render();
    expect(narration()).toContain('Visit all 4 cities');
    expect(rows()).toBe(8);
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Mask 1 = 0001: only A is visited and the walk stands on A, so dp[{A}][A] = 0.',
    );
    expect(cell(1, 0)?.textContent?.trim()).toBe('0●');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'From {A} at A, go to B: 0 + 5 = 5 for dp[{A, B}][B]. The first walk to that state.',
    );
    expect(cell(3, 1)?.getAttribute('aria-label')).toBe('dp[{A, B}][B]: 5, improved');
    expect(cell(3, 0)?.textContent?.trim()).toBe(m.outside);
    click(button('Đến bước cuối'));
    expect(narration()).toBe('The shortest tour is A → C → D → B → A, length 20.');
    expect(byTest('best')).toBe('20');
    expect(byTest('tries')).toBe('15 / 15');
    expect(byTest('reached')).toBe('13 / 13');
    expect(byTest('tours')).toBe('6');
    expect(byTest('walk')).toBe('A → C → D → B → A');
    expect(cell(15, 1)?.getAttribute('aria-label')).toBe('dp[{A, B, C, D}][B]: 15, on the tour');
  });

  it('loads presets and rebuilds on every edit of the cities', () => {
    render();
    pick('six');
    expect(rows()).toBe(32);
    click(button('Đến bước cuối'));
    expect(byTest('best')).toBe('26');
    expect(byTest('tours')).toBe('120');
    click(buttonByText(m.addCity));
    expect(narration()).toBe(m.fullError(6));
    pick('four');
    click(buttonByText(m.addCity));
    expect(rows()).toBe(16);
    expect(city(4).getAttribute('aria-label')).toContain('City E at (0, 0)');
    expect(byTest('tries')).toBe(`0 / ${transitionCount(5)}`);
    click(buttonByText(m.removeCity));
    expect(rows()).toBe(8);
    click(buttonByText(m.removeCity));
    expect(narration()).toBe(m.selectFirst);
  });

  it('moves, selects and removes a city with the keyboard', () => {
    render();
    press(city(3), 'ArrowLeft', true);
    expect(city(3).getAttribute('aria-label')).toContain('City D at (6, 4)');
    click(button('Đến bước cuối'));
    const want = heldKarpTrace(
      distances([...CITY_PRESETS[0].cities.slice(0, 3), { x: 6, y: 4 }]),
    ).at(-1)?.result;
    expect(byTest('best')).toBe(String(want));
    press(city(1), 'Delete');
    expect(rows()).toBe(4);
    press(city(0), 'Delete');
    expect(narration()).toBe(m.minError(3));
    press(city(2), 'ArrowUp', true);
    press(city(2), 'ArrowLeft', true);
    expect(city(2).getAttribute('aria-label')).toContain('(5, 5)');
  });

  it('refuses to stack two cities', () => {
    render();
    press(city(0), 'ArrowRight', true);
    for (let i = 0; i < 3; i++) press(city(0), 'ArrowRight', true);
    expect(city(0).getAttribute('aria-label')).toContain('(5, 1)');
    press(city(0), 'ArrowRight', true);
    expect(narration()).toBe(m.occupiedError);
    expect(city(0).getAttribute('aria-label')).toContain('(5, 1)');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(1 + 4 + 8).toBe(stored(0));
    expect(heldKarpTrace(distances(CITY_PRESETS[0].cities)).at(-1)?.result).toBe(stored(1));
    expect(heldKarpTrace(distances(CITY_PRESETS[2].cities)).at(-1)?.tries).toBe(stored(2));
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '11';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '13';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const cost = m.practice.find((ex) => ex.type === 'text');
    for (const typed of ['O(2^n * n^2)', 'O(n²·2ⁿ)'])
      expect(checkAnswer(/** @type {any} */ (cost), typed).correct).toBe(true);
  });
});
