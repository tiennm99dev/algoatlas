// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-intractability/copy.vi.js';
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
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {string} card @param {string} bin */
function sort(card, bin) {
  click(
    /** @type {Element} */ (document.querySelector(`input[name="bin-${card}"][value="${bin}"]`)),
  );
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();

describe('reductions and hardness practice', () => {
  it('checks the sort one card at a time', () => {
    render();
    expect(narration()).toContain('Xếp 8 thẻ');
    sort('eulerCircuit', 'p');
    sort('hamCycle', 'p');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Chu trình Euler: đúng, Đa thức.');
    expect(byTest('verdict-eulerCircuit')).toContain('✓ Đúng.');
    expect(byTest('verdict-hamCycle')).toBeUndefined();
    click(button('Bước tiếp'));
    expect(narration()).toContain('Chu trình Hamilton: không phải Đa thức, mà là NP-đầy đủ.');
    expect(byTest('wrong')).toBe('1');
    click(button('Bước tiếp'));
    expect(narration()).toContain('2-SAT: chưa xếp. Thẻ này thuộc ô Đa thức.');
  });

  it('scores everything with Check all, and clears', () => {
    render();
    for (const [card, bin] of [
      ['eulerCircuit', 'p'],
      ['hamCycle', 'npc'],
      ['twoSat', 'p'],
      ['threeSat', 'npc'],
      ['metricTsp', 'approx'],
      ['generalTsp', 'npc'],
      ['vertexCover', 'approx'],
      ['dagLongestPath', 'p'],
    ])
      sort(card, bin);
    click(buttonByText(m.checkAll));
    expect(byTest('right')).toBe('8');
    expect(byTest('checked')).toBe('8 / 8');
    expect(narration()).toContain('Xếp hoàn hảo.');
    click(buttonByText(m.clear));
    click(buttonByText(m.checkAll));
    expect(byTest('unsorted')).toBe('8');
  });

  it('deals a new hand of eight cards', () => {
    render();
    click(buttonByText(m.deal));
    expect(document.querySelectorAll('[data-card]')).toHaveLength(8);
    expect(byTest('checked')).toBe('0 / 8');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Chu trình Euler: chưa xếp');
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
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('Bấm “Kiểm tra tất cả” và đếm');
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Chưa đúng');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
