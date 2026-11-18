// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/eulerian-paths/copy.vi.js';

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

/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
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
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
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

/** @param {string} label */
function edgeButton(label) {
  const el = document.querySelector(`[role="button"][aria-label="${label}"]`);
  if (!el) throw new Error(`no edge labelled ${label}`);
  return el;
}

describe('eulerian paths lesson', () => {
  it('checks degrees, then traces the circuit with two detours', () => {
    render();
    expect(text()).toContain('Đếm bậc: mọi bậc đều chẵn.');
    expect(vertex(2).getAttribute('aria-label')).toBe('Đỉnh C, bậc 4');
    click(button('Bước tiếp'));
    expect(text()).toContain('nên có chu trình Euler. Bắt đầu ở A.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đi theo A — B và đẩy B vào stack. A còn 1 cạnh chưa dùng.');
    expect(vertex(1).getAttribute('aria-label')).toBe('Đỉnh B, bút ở đây, còn 1');
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(text()).toContain('A không còn cạnh chưa dùng: lấy nó ra, ghi vào lộ trình. Lùi về C.');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'C vẫn còn cạnh chưa dùng: bắt đầu một chu trình rẽ nhánh ở đây theo C — D.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'chu trình Euler A → B → C → D → E → F → G → E → C → A, dùng cả 9 cạnh, mỗi cạnh một lần.',
    );
    expect(statValue(m.stats.detours)).toBe('2');
    expect(statValue(m.stats.used)).toBe('9 / 9');
    expect(chips(m.routeLabel)).toEqual(['A', 'C', 'E', 'G', 'F', 'E', 'D', 'C', 'B', 'A']);
  });

  it('removing G — E gives a path from E to G', () => {
    render();
    radio('remove');
    click(edgeButton('Xoá cạnh giữa G và E'));
    expect(text()).toContain('Đếm bậc: 2 đỉnh bậc lẻ (E, G).');
    click(button('Bước tiếp'));
    expect(text()).toContain('Có đúng hai đỉnh bậc lẻ, E, G');
    click(button('Đến bước cuối'));
    expect(text()).toContain('đường đi Euler E → ');
    expect(text()).toMatch(/→ G, dùng cả 8 cạnh, mỗi cạnh một lần/);
    click(buttonByText(m.resetGraph));
    expect(text()).toContain('mọi bậc đều chẵn');
  });

  it('refuses a graph with four odd vertices', () => {
    render();
    radio('connect');
    click(vertex(0));
    click(vertex(3));
    click(vertex(1));
    click(vertex(6));
    click(button('Đến bước cuối'));
    expect(text()).toContain('4 đỉnh có bậc lẻ (A, B, D, G)');
    expect(text()).toContain('không có đường đi Euler');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Bắt đầu ở A');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '0');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
