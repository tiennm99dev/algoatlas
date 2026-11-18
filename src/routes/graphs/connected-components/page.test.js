// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/connected-components/copy.vi.js';

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

/** Keyboard activation reports detail 0, which the grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {string} key */
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
/** @param {string} value */
const radio = (value) =>
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));

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

describe('connected components lesson', () => {
  it('labels the first island, then counts all nine', () => {
    render();
    expect(text()).toContain('Chưa ô nào có nhãn.');
    click(button('Bước tiếp'));
    expect(text()).toContain('(0,0) là đất chưa có nhãn: một hòn đảo mới. Gán nhãn 1');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain(
      '(0,1) là đất chưa có nhãn, kề với (0,0): gán nhãn 1 và đưa vào hàng đợi.',
    );
    const queue = [...document.querySelectorAll('ol li')].map((li) => li.textContent?.trim());
    expect(queue).toContain('(0,1) (vừa gán nhãn)');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.islands)).toBe('9');
    expect(statValue(m.stats.largest)).toBe('7');
    expect(text()).toContain('Quét xong: 9 đảo, sau 97 lần xét ô kề.');
    expect(button('Hàng 6, cột 6, đảo 7')).toBeTruthy();
  });

  it('8 directions merge the diagonal chain', () => {
    render();
    radio('8');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.islands)).toBe('7');
    expect(button('Hàng 4, cột 2, đảo 4')).toBeTruthy();
  });

  it('keyboard edits switch land and water and rebuild the trace', () => {
    render();
    keyActivate(button('Hàng 0, cột 3, Nước'));
    expect(text()).toContain('Đã thêm đất ở (0,3).');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.islands)).toBe('10');
    keyActivate(button('Hàng 0, cột 3, đảo 2'));
    expect(text()).toContain('Đã đổi (0,3) thành nước.');
  });

  it('a pointer stroke paints land across cells', () => {
    render();
    const a = button('Hàng 0, cột 3, Nước');
    const b = button('Hàng 0, cột 4, Nước');
    // jsdom has no layout, so point the hit test at the cell under the pretend pointer.
    let under = a;
    document.elementFromPoint = () => under;
    a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    flushSync();
    under = b;
    b.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, buttons: 1 }));
    flushSync();
    expect(button('Hàng 0, cột 3, Đất, chưa có nhãn')).toBeTruthy();
    expect(button('Hàng 0, cột 4, Đất, chưa có nhãn')).toBeTruthy();
  });

  it('all water and reset change the map', () => {
    render();
    click(buttonByText(m.clearMap));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.islands)).toBe('0');
    expect(text()).toContain('Quét xong: 0 đảo');
    click(buttonByText(m.resetMap));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.islands)).toBe('9');
  });

  it('moves focus with the arrow keys', () => {
    render();
    const first = button('Hàng 0, cột 0, Đất, chưa có nhãn');
    first.focus();
    press(first, 'ArrowRight');
    expect(document.activeElement).toBe(button('Hàng 0, cột 1, Đất, chưa có nhãn'));
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '7');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '9');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
