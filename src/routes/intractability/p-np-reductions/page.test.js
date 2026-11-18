// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/p-np-reductions/copy.vi.js';
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

describe('P, NP and reductions lesson', () => {
  it('builds H pair by pair, then verifies the certificate', () => {
    render();
    expect(narration()).toContain('Đầu vào là G và k = 4');
    click(button('Bước tiếp'));
    expect(narration()).toContain('A – B là một cạnh của G, nên H không có cạnh ở đó');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('A – E không phải cạnh của G, nên thêm nó vào H');
    expect(byTest('map-steps')).toBe('4');
    click(button('Đến bước cuối'));
    expect(byTest('map-steps')).toBe('15');
    expect(byTest('checks')).toBe('6');
    expect(byTest('verdict')).toBe('S được chấp nhận.');
    expect(byTest('answer')).toBe('có, ví dụ {A, B, C, D}');
    expect(narration()).toContain('Cả hai câu trả lời đều là “có”');
  });

  it('rejects a wrong certificate for a yes instance, then accepts a fixed one', () => {
    render();
    commit(field('select[name="preset"]'), 'house');
    click(button('Đến bước cuối'));
    expect(byTest('verdict')).toBe('S bị bác bỏ.');
    expect(byTest('answer')).toBe('có, ví dụ {A, B, C}');
    click(button('Đỉnh D, thuộc chứng chỉ'));
    expect(narration()).toContain('Bộ kiểm chứng bác bỏ nó ngay');
    click(button('Đỉnh C, không thuộc chứng chỉ'));
    expect(narration()).toContain('A – B là một cạnh của G, nên không phải cạnh của H');
    click(button('Đến bước cuối'));
    expect(byTest('verdict')).toBe('S được chấp nhận.');
    expect(field('select[name="preset"]').value).toBe('');
  });

  it('changes k and refuses a bad one', () => {
    render();
    commit(field('input[name="k"]'), '5');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('không');
    expect(byTest('subsets')).toBe('6');
    commit(field('input[name="k"]'), '9');
    expect(narration()).toBe(m.kError(6));
    expect(field('input[name="k"]').value).toBe('5');
  });

  it('follows an edit of G', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="remove"]')));
    click(/** @type {Element} */ (document.querySelector('[aria-label="Xoá cạnh giữa A và B"]')));
    click(button('Đến bước cuối'));
    expect(byTest('verdict')).toBe('S bị bác bỏ.');
    expect(byTest('answer')).toBe('không');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('A – B là một cạnh của G');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '30';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('n(n − 1)/2');
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Chưa đúng');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
