// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/distributed-algorithms/copy.en.js';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );
/** @param {string} label */
const stat = (label) =>
  [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent;

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

describe('distributed algorithms lesson', () => {
  it('elects the largest ID on the ring, round by round', () => {
    render();
    expect(text()).toContain('The diameter is D = 3, so every node runs 3 rounds.');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Round 1: 6 nodes send their largest ID to every neighbour: 12 messages.',
    );
    expect(text()).toContain('A → B: 3');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Round 1: A learns 7 from B, C learns 9 from D and E learns 9 from D.',
    );
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Round 2: only the 3 nodes whose maximum changed last round send: 6 messages.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('Done: D leads after 22 messages in 3 rounds.');
    expect(stat(m.stats.sent)).toBe('22');
    expect(stat(m.stats.leaders)).toBe('1');
  });

  it('counts more messages when every node sends every round', () => {
    render();
    click(radio('variant', 'every'));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.sent)).toBe('36');
    click(buttonByText(m.presets.path));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.sent)).toBe('50');
    click(radio('variant', 'change'));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.sent)).toBe('19');
  });

  it('fails to break symmetry when every ID is equal', () => {
    render();
    click(radio('ids', 'equal'));
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(text()).toContain(
      'All 6 nodes have seen only the ID 1, so every one declares itself leader.',
    );
    click(buttonByText(m.shuffle));
    expect(radio('ids', 'unique').checked).toBe(true);
    click(button('Đến bước cuối'));
    expect(stat(m.stats.leaders)).toBe('1');
  });

  it('elects one leader per piece after a node is added', () => {
    render();
    click(buttonByText('Thêm đỉnh'));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.leaders)).toBe('2');
    expect(text()).toContain('2 leaders, so the election failed.');
  });

  it('checks answers in the practice block', () => {
    render();
    const q = question(0);
    answer(q, '50');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '19');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
