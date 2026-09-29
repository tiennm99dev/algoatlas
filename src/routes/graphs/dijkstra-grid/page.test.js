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
    click(button('Last step'));
    expect(text()).toContain('Reached the goal at cost 17');
    expect(text()).toContain('BFS route: 11 steps, cost 27');
    expect(text()).toContain('Dijkstra route: 17 steps, cost 17');
  });

  it('adds mud from the keyboard and states its cost in the label', () => {
    render();
    pickTool('mud');
    keyActivate(button('Row 0, column 0'));
    expect(button('Row 0, column 0, mud, cost 5')).toBeTruthy();
    expect(text()).toContain('Mud added at (0,0).');
  });

  it('a wall replaces the mud underneath it', () => {
    render();
    keyActivate(button('Row 4, column 6, mud, cost 5'));
    expect(button('Row 4, column 6, Wall')).toBeTruthy();
  });

  it('announces the best cost in cell labels', () => {
    render();
    click(button('Last step'));
    expect(button('Row 4, column 2, Start, best cost 0')).toBeTruthy();
  });

  it('reports no path when the goal is walled in', () => {
    render();
    for (const [r, c] of [
      [3, 13],
      [5, 13],
      [4, 12],
      [4, 14],
    ]) {
      keyActivate(button(`Row ${r}, column ${c}`));
    }
    click(button('Last step'));
    expect(text()).toContain('walls cut it off');
  });

  it('moving the start onto mud clears its cost and says so', () => {
    render();
    pickTool('start');
    keyActivate(button('Row 4, column 7, mud, cost 5'));
    expect(text()).toContain('Start moved to (4,7). The mud under it was cleared.');
    // No mud is announced under the start.
    expect(button('Row 4, column 7, Start, best cost 0')).toBeTruthy();
    const next = button('Next step');
    for (let i = 0; i < 20 && !text().includes('(4,8) is open and unreached'); i++) click(next);
    // The first hop into the neighboring mud costs 3 (the average of 1 and 5), not 5.
    expect(text()).toContain('(4,8) is open and unreached — its cost is 3 via (4,7)');
  });

  it('moving the goal onto mud clears its cost too', () => {
    render();
    pickTool('goal');
    keyActivate(button('Row 4, column 8, mud, cost 5'));
    expect(button('Row 4, column 8, Goal')).toBeTruthy();
    expect(text()).toContain('The mud under it was cleared.');
  });

  it('labels a stale pop as skipped, not as expanding', () => {
    render();
    const next = button('Next step');
    for (let i = 0; i < 600 && !text().includes('a stale entry, skip it'); i++) click(next);
    expect(text()).toContain('a stale entry, skip it');
    expect(document.querySelector('button[aria-label*="Stale copy, skipped"]')).not.toBeNull();
    expect(document.querySelector('button[aria-label*="Expanding"]')).toBeNull();
  });

  it('lights only the live queue entry of the touched cell', () => {
    render();
    const next = button('Next step');
    for (let i = 0; i < 600; i++) {
      click(next);
      const chips = [...document.querySelectorAll('ol li')];
      const labels = chips.map((c) => c.textContent?.replace(/ \(current\)$/, '').trim());
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
