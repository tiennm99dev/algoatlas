// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { HULL_PRESETS, hullTrace } from '$lib/algo-engine/dp-optimisations.js';
import { vi as m } from '$lib/lessons/dp-optimisations/copy.vi.js';
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
    expect(narration()).toContain('6 đường thẳng và 11 truy vấn');
    for (let i = 0; i < 7; i++) click(button('Bước tiếp'));
    expect(narration()).toBe('L2 ở lại: nó thấp nhất từ x = 2 cho tới khi L3 thay thế tại x = 4.');
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(narration()).toBe(
      'L4 song song với L3 và không thấp hơn, nên nó không bao giờ là đường thấp nhất. Bỏ qua nó.',
    );
    expect(chips(m.linesTitle).some((c) => c?.startsWith('L4: y = 9 ✕'))).toBe(true);
    click(button('Đến bước cuối'));
    expect(chips(m.hullTitle)).toEqual(['L1', 'L2', 'L3', 'L5', 'L6']);
    expect(byTest('checks')).toBe('3 / 3');
    expect(byTest('moves')).toBe('4 / 4');
    expect(byTest('compares')).toBe('11 / 11');
    expect(byTest('naive')).toBe('66');
    expect(narration()).toBe(
      'Có 11 đáp án sau 3 lần kiểm tra bao và 11 lần so sánh của con trỏ, so với 66 lần nếu thử mọi đường tại mọi x.',
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
      'L3 vô dụng: L1 cắt L2 tại x = 5, không nằm sau x = 6, chỗ mà L3 lẽ ra bắt đầu thấp nhất. Lấy L3 ra.',
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
      'Có 2 đáp án sau 0 lần kiểm tra bao và 2 lần so sánh của con trỏ, so với 4 lần nếu thử mọi đường tại mọi x.',
    );
    commit(field('input[name="lines"]'), '9 0');
    expect(narration()).toBe('Hệ số góc từ −5 đến 5, tung độ gốc từ -20 đến 30.');
    expect(field('input[name="lines"]').value).toBe('1 0, -1 10');
    commit(field('input[name="lines"]'), 'one two');
    expect(narration()).toContain('Viết mỗi đường thẳng bằng hai số nguyên');
    commit(field('input[name="queries"]'), '11');
    expect(narration()).toBe('Mỗi x phải từ 0 đến 10.');
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
    expect(narration()).toBe('Tại x = 10, đường thấp nhất là L6: 0.');
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
