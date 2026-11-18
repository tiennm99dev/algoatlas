// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/two-sat/copy.vi.js';

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
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {Element} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** @param {string} title */
const chips = (title) =>
  [
    ...([...document.querySelectorAll('h2')]
      .find((h) => h.textContent?.trim() === title)
      ?.parentElement?.querySelectorAll('li') ?? []),
  ].map((li) => li.textContent?.trim());

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {string} label @param {number} literal */
function choose(label, literal) {
  const el = /** @type {HTMLSelectElement} */ (
    document.querySelector(`select[aria-label="${label}"]`)
  );
  el.value = String(literal);
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {number} l */
const literalTitle = (l) =>
  [...document.querySelectorAll('svg g title')].find(
    (t) =>
      t.textContent?.startsWith(`Literal ${m.lit(l)},`) || t.textContent === `Literal ${m.lit(l)}`,
  )?.textContent;

describe('2-SAT lesson', () => {
  it('builds the implication graph and reports an assignment', () => {
    render();
    expect(text()).toContain('Mỗi literal là một đỉnh, chưa có cạnh nào.');
    click(button('Bước tiếp'));
    expect(text()).toContain('(¬x₁ ∨ x₂): nếu x₁ thì x₂, và nếu ¬x₂ thì ¬x₁. Thêm cả hai cạnh.');
    expect(statValue(m.stats.edges)).toBe('2');
    for (let i = 0; i < 5; i++) click(button('Bước tiếp'));
    expect(text()).toContain('Tarjan hoàn tất thành phần C1: ¬x₄, x₃, x₂.');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Có nghiệm: x₁ = true, x₂ = true, x₃ = true, x₄ = false. Mệnh đề nào cũng có một literal đúng.',
    );
    expect(statValue(m.stats.comps)).toBe('4');
    expect(statValue(m.stats.result)).toBe(m.results.sat);
    expect(chips(m.assignLabel)).toEqual(['x₁ = true', 'x₂ = true', 'x₃ = true', 'x₄ = false']);
    expect(document.querySelectorAll('li[aria-label^="Mệnh đề"]')).toHaveLength(5);
    expect(text().match(/✓ đã thoả/g)).toHaveLength(5);
    expect(literalTitle(7)).toBe('Literal ¬x₄, đúng, thành phần C1');
  });

  it('explains each choice from the component order', () => {
    render();
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(text()).toContain(
      'C1 (¬x₄) được tìm thấy trước C4 (x₄), nên ¬x₄ đứng sau trong thứ tự tô-pô: gán x₄ = false.',
    );
  });

  it('the unsatisfiable example reports the conflict', () => {
    render();
    click(buttonByText(m.unsatExample));
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Vô nghiệm: các phép kéo theo buộc x₁ phải bằng chính phủ định của nó.',
    );
    expect(statValue(m.stats.result)).toBe(m.results.unsat);
    click(button('Bước trước'));
    expect(text()).toContain('x₁ và ¬x₁ cùng nằm trong C1');
  });

  it('adding a clause and editing a literal rebuild the trace', () => {
    render();
    click(buttonByText(m.addClause));
    expect(document.querySelectorAll('li[aria-label^="Mệnh đề"]')).toHaveLength(6);
    // Turn the new (x₁ ∨ x₂) into (¬x₁ ∨ ¬x₃).
    choose('Mệnh đề 6, literal thứ nhất', 1);
    choose('Mệnh đề 6, literal thứ hai', 5);
    click(button('Đến bước cuối'));
    expect(chips(m.assignLabel)).toEqual(['x₁ = false', 'x₂ = true', 'x₃ = true', 'x₄ = false']);
    // (¬x₂ ∨ ¬x₃) instead makes it unsatisfiable.
    choose('Mệnh đề 6, literal thứ nhất', 3);
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.result)).toBe(m.results.unsat);
    click(button('Xoá mệnh đề 6'));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.result)).toBe(m.results.sat);
  });

  it('refuses a ninth clause with a notice', () => {
    render();
    for (let i = 0; i < 3; i++) click(buttonByText(m.addClause));
    expect(statValue(m.stats.clauses)).toBe('8');
    click(buttonByText(m.addClause));
    expect(text()).toContain(m.full(8));
    expect(statValue(m.stats.clauses)).toBe('8');
    click(button('Bước tiếp'));
    expect(text()).not.toContain(m.full(8));
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Thêm cả hai cạnh.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    answer(q, '2');
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
