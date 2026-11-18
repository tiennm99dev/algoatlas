// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component */
function render(Component) {
  app = mount(Component, { target: document.body });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
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

/** @param {HTMLElement} target @param {KeyboardEventInit} init */
function key(target, init) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

/** @param {string} label */
function statValue(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

describe('dfs lesson', () => {
  it('finds a long path on the default grid and compares it with BFS', () => {
    render(Page);
    click(button('Đến bước cuối'));
    expect(text()).toContain('đường đi dài 54 bước');
    expect(statValue('Đường ngắn nhất của BFS')).toBe('22');
    expect(statValue('Độ dài đường DFS')).toBe('54');
  });

  it('keyboard activation toggles a wall and rebuilds the trace', () => {
    render(Page);
    keyActivate(button('Hàng 0, cột 0'));
    expect(button('Hàng 0, cột 0, Tường')).toBeTruthy();
    expect(text()).toMatch(/Bước 1\/\d+/);
    expect(text()).toContain('Đã thêm tường ở (0,0).');
  });

  it('announces visit numbers in cell labels', () => {
    render(Page);
    click(button('Đến bước cuối'));
    expect(button('Hàng 4, cột 2, Điểm xuất phát, thăm thứ 1')).toBeTruthy();
  });

  it('narrates a push and lists it on the stack', () => {
    render(Page);
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('Đẩy (4,1) vào stack: ô trống và chưa được thăm.');
    const stack = [...document.querySelectorAll('ol li')].map((li) => li.textContent?.trim());
    expect(stack).toContain('(4,1) (vừa đẩy vào)');
  });

  it('reports no path when the goal is walled in', () => {
    render(Page);
    for (const [r, c] of [
      [4, 13],
      [6, 13],
      [5, 12],
      [5, 14],
    ]) {
      keyActivate(button(`Hàng ${r}, cột ${c}`));
    }
    click(button('Đến bước cuối'));
    expect(text()).toContain('tường đã chặn kín đường');
    expect(statValue('Đường ngắn nhất của BFS')).toBe('—');
  });

  it('moves focus with the arrow keys', () => {
    render(Page);
    const startCell = button('Hàng 4, cột 2, Điểm xuất phát');
    startCell.focus();
    key(startCell, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(button('Hàng 4, cột 3'));
  });

  it('labels a skipped stale copy as skipped, not as expanding', () => {
    render(Page);
    // A walled-in goal makes DFS sweep the open field, where stale copies surface.
    const clear = [...document.querySelectorAll('button')].find(
      (b) => b.textContent === 'Xoá hết tường',
    );
    click(/** @type {HTMLElement} */ (clear));
    for (const [r, c] of [
      [4, 13],
      [6, 13],
      [5, 12],
      [5, 14],
    ]) {
      keyActivate(button(`Hàng ${r}, cột ${c}`));
    }
    const next = button('Bước tiếp');
    for (let i = 0; i < 400 && !text().includes('nên ta bỏ qua'); i++) click(next);
    expect(text()).toContain('nên ta bỏ qua');
    const cell = document.querySelector('button[aria-label*="Bản cũ, bỏ qua"]');
    expect(cell).not.toBeNull();
    expect(document.querySelector('button[aria-label*="Đang xét"]')).toBeNull();
  });

  it('announces the top stack entry as just pushed', () => {
    render(Page);
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    const hot = document.querySelectorAll('ol li .sr-only');
    expect(hot).toHaveLength(1);
    expect(hot[0].textContent).toBe(' (vừa đẩy vào)');
  });
});
