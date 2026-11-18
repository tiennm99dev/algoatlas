// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
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

/** @param {string} value */
function pickTool(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

const text = () => document.body.textContent ?? '';

describe('dijkstra lesson', () => {
  it('finds the cheapest route and compares it with the BFS route', () => {
    render();
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã đến đích với chi phí 17');
    expect(text()).toContain('Đường BFS: 11 bước, chi phí 27');
    expect(text()).toContain('Đường Dijkstra: 17 bước, chi phí 17');
  });

  it('adds mud from the keyboard and states its cost in the label', () => {
    render();
    pickTool('mud');
    keyActivate(button('Hàng 0, cột 0'));
    expect(button('Hàng 0, cột 0, bùn, chi phí 5')).toBeTruthy();
    expect(text()).toContain('Đã thêm bùn ở (0,0).');
  });

  it('a wall replaces the mud underneath it', () => {
    render();
    keyActivate(button('Hàng 4, cột 6, bùn, chi phí 5'));
    expect(button('Hàng 4, cột 6, Tường')).toBeTruthy();
  });

  it('announces the best cost in cell labels', () => {
    render();
    click(button('Đến bước cuối'));
    expect(button('Hàng 4, cột 2, Điểm xuất phát, chi phí tốt nhất 0')).toBeTruthy();
  });

  it('reports no path when the goal is walled in', () => {
    render();
    for (const [r, c] of [
      [3, 13],
      [5, 13],
      [4, 12],
      [4, 14],
    ]) {
      keyActivate(button(`Hàng ${r}, cột ${c}`));
    }
    click(button('Đến bước cuối'));
    expect(text()).toContain('tường đã chặn kín');
  });

  it('moving the start onto mud clears its cost and says so', () => {
    render();
    pickTool('start');
    keyActivate(button('Hàng 4, cột 7, bùn, chi phí 5'));
    expect(text()).toContain('Đã dời điểm xuất phát đến (4,7). Bùn ở ô đó đã được dọn.');
    // No mud is announced under the start.
    expect(button('Hàng 4, cột 7, Điểm xuất phát, chi phí tốt nhất 0')).toBeTruthy();
    const next = button('Bước tiếp');
    for (let i = 0; i < 20 && !text().includes('(4,8) còn trống và chưa ai đến'); i++) click(next);
    // The first hop into the neighboring mud costs 3 (the average of 1 and 5), not 5.
    expect(text()).toContain(
      '(4,8) còn trống và chưa ai đến — chi phí là 0 + 3 (bước có bùn) = 3 qua (4,7)',
    );
  });

  it('moving the goal onto mud clears its cost too', () => {
    render();
    pickTool('goal');
    keyActivate(button('Hàng 4, cột 8, bùn, chi phí 5'));
    expect(button('Hàng 4, cột 8, Đích')).toBeTruthy();
    expect(text()).toContain('Bùn ở ô đó đã được dọn.');
  });

  it('labels a stale pop as skipped, not as expanding', () => {
    render();
    const next = button('Bước tiếp');
    for (let i = 0; i < 600 && !text().includes('đây là bản cũ, bỏ qua'); i++) click(next);
    expect(text()).toContain('đây là bản cũ, bỏ qua');
    expect(document.querySelector('button[aria-label*="Bản cũ, bỏ qua"]')).not.toBeNull();
    expect(document.querySelector('button[aria-label*="Đang mở rộng"]')).toBeNull();
  });

  it('narrates a relaxation as popped cost plus step, naming a mud step', () => {
    render();
    const next = button('Bước tiếp');
    for (let i = 0; i < 600 && !text().includes('(bước có bùn)'); i++) click(next);
    expect(text()).toMatch(/\d+ \+ \d+ \(bước có bùn\) = \d+/);
  });

  it('labels a stale queue entry and the hot chip as just pushed', () => {
    render();
    const next = button('Bước tiếp');
    const chips = () => [...document.querySelectorAll('ol li')].map((c) => c.textContent ?? '');
    for (let i = 0; i < 600 && !chips().some((t) => t.includes('(cũ)')); i++) click(next);
    expect(chips().some((t) => /^\(\d+,\d+\) \d+ \(cũ\)$/.test(t.trim()))).toBe(true);
    expect(chips().some((t) => t.includes('(vừa đẩy vào)'))).toBe(true);
  });

  it('lights only the live queue entry of the touched cell', () => {
    render();
    const next = button('Bước tiếp');
    for (let i = 0; i < 600; i++) {
      click(next);
      const chips = [...document.querySelectorAll('ol li')];
      const labels = chips.map((c) => c.textContent?.replace(/ \(vừa đẩy vào\)$/, '').trim());
      const hot = chips.filter((c) => c.querySelector('.sr-only'));
      if (hot.length && new Set(labels.map((l) => l?.split(' ')[0])).size < labels.length) {
        // A duplicate cell is queued: exactly one of its entries is hot.
        expect(hot).toHaveLength(1);
        return;
      }
    }
    throw new Error('no duplicate entry was ever queued alongside a hot chip');
  });
});
