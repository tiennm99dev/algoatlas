// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { HULL_PRESETS, hullTrace } from '$lib/algo-engine/dp-optimisations.js';
import { en as m } from '$lib/lessons/dp-optimisations/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** @param {string} title */
const chips = (title) => {
  const card = [...document.querySelectorAll('h2')].find((h) => h.textContent?.trim() === title);
  return [...(card?.parentElement?.querySelectorAll('li') ?? [])].map((li) =>
    li.textContent?.trim(),
  );
};
/** Plot segments drawn dashed. */
const dashed = () => document.querySelectorAll('line[stroke-dasharray]').length;

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('DP optimisations lesson', () => {
  it('builds the hull, skips a parallel line and walks the queries', () => {
    render();
    expect(narration()).toContain('6 lines and 11 queries');
    for (let i = 0; i < 7; i++) click(button('Bước tiếp'));
    expect(narration()).toBe('L2 stays: it is lowest from x = 2 until L3 takes over at x = 4.');
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(narration()).toBe(
      'L4 is parallel to L3 and not lower, so it is never the lowest. Skip it.',
    );
    expect(chips(m.linesTitle).some((c) => c?.startsWith('L4: y = 9 ✕'))).toBe(true);
    click(button('Đến bước cuối'));
    expect(chips(m.hullTitle)).toEqual(['L1', 'L2', 'L3', 'L5', 'L6']);
    expect(byTest('checks')).toBe('3 / 3');
    expect(byTest('moves')).toBe('4 / 4');
    expect(byTest('compares')).toBe('11 / 11');
    expect(byTest('naive')).toBe('66');
    expect(narration()).toBe(
      '11 answers with 3 hull checks and 11 pointer comparisons, against 66 for trying every line at every x.',
    );
  });

  it('pops a useless line', () => {
    render();
    commit(field('select[name="preset"]'), 'useless');
    const at = hullTrace(HULL_PRESETS[1].lines, HULL_PRESETS[1].queries).findIndex(
      (f) => f.kind === 'check' && f.pops,
    );
    for (let i = 0; i < at; i++) click(button('Bước tiếp'));
    expect(narration()).toBe(
      'L3 is useless: L1 crosses L2 at x = 5, not after x = 6 where L3 would take over. Pop L3.',
    );
    click(button('Đến bước cuối'));
    expect(chips(m.hullTitle)).toEqual(['L4', 'L2', 'L1', 'L5']);
  });

  it('reads typed lines and queries and refuses bad ones', () => {
    render();
    commit(field('input[name="lines"]'), '1 0, −1 10');
    expect(field('select[name="preset"]').value).toBe('');
    expect(field('input[name="lines"]').value).toBe('1 0, -1 10');
    commit(field('input[name="queries"]'), '7 3 3');
    expect(field('input[name="queries"]').value).toBe('3 7');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      '2 answers with 0 hull checks and 2 pointer comparisons, against 4 for trying every line at every x.',
    );
    commit(field('input[name="lines"]'), '9 0');
    expect(narration()).toBe('Slopes go from −5 to 5, intercepts from -20 to 30.');
    expect(field('input[name="lines"]').value).toBe('1 0, -1 10');
    commit(field('input[name="lines"]'), 'one two');
    expect(narration()).toContain('Write each line as two whole numbers');
    commit(field('input[name="queries"]'), '11');
    expect(narration()).toBe('Each x must be from 0 to 10.');
    expect(field('input[name="queries"]').value).toBe('3 7');
  });

  it('draws not-yet-added and removed lines dashed', () => {
    render();
    click(button('Bước tiếp'));
    const before = dashed();
    click(button('Đến bước cuối'));
    expect(dashed()).toBeLessThan(before);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).toBe('At x = 10, the lowest line is L6: 0.');
  });

  it('stores practice answers that the engine reproduces', () => {
    const [cap, mid, touch] = HULL_PRESETS.map((p) => hullTrace(p.lines, p.queries).at(-1));
    const q = /** @type {{answer: number}[]} */ (/** @type {unknown} */ (m.practice));
    expect(cap?.answers[3]).toBe(q[0].answer);
    expect(mid?.removed).toEqual([q[1].answer]);
    expect(touch?.hull.length).toBe(q[2].answer);
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
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
