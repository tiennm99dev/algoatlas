// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { sweepTrace } from '$lib/algo-engine/sweep-line.js';
import { en as m } from '$lib/lessons/sweep-line/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
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
  if (!el) throw new Error(`no button with text ${label}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {string} id */
const cell = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const text = () => document.body.textContent ?? '';

/** @param {string} value */
function pick(value) {
  const select = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} value */
function method(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="method"][value="${value}"]`)
  );
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {number} id */
const point = (id) => /** @type {SVGElement} */ (document.querySelector(`[data-point="${id}"]`));

/** @param {SVGElement} el @param {string} key @param {boolean} [shiftKey] */
function press(el, key, shiftKey = false) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  );
  flushSync();
}

const segmentCount = () => document.querySelectorAll('[data-point]').length / 2;
const sweepLine = () => document.querySelector('line.stroke-state-frontier');

describe('sweep line lesson', () => {
  it('sorts the events, then moves the line from one to the next', () => {
    render();
    expect(narration()).toContain('4 segments. All pairs would take 6 tests.');
    expect(sweepLine()).toBeNull();
    click(button('Next step'));
    expect(narration()).toContain('Sort the 8 end points');
    click(button('Next step'));
    expect(narration()).toBe('The line reaches x = 1, where A starts.');
    expect(cell('x')).toBe('1');
    expect(sweepLine()).not.toBeNull();
    click(button('Next step'));
    expect(narration()).toContain('A joins the active set');
    expect(cell('active')).toBe('1');
  });

  it('stops the any-crossing sweep at its first hit', () => {
    render();
    click(button('Last step'));
    expect(cell('answer')).toBe('Yes');
    expect(narration()).toMatch(/Stopped after \d+ pair tests?: at least one pair meets\./);
    expect(document.querySelectorAll('svg circle.stroke-state-swap')).toHaveLength(1);
  });

  it('lists every meeting with the all-crossings method', () => {
    render();
    pick('mesh');
    method('all');
    click(button('Last step'));
    expect(narration()).toMatch(/^All done: 9 meetings found/);
    expect(document.querySelectorAll('svg circle.stroke-state-swap')).toHaveLength(9);
    expect(cell('active')).toBe('0');
  });

  it('answers no on disjoint segments', () => {
    render();
    pick('disjoint');
    expect(cell('answer')).toBe(m.pending);
    click(button('Last step'));
    expect(cell('answer')).toBe('No');
  });

  it('compares pair tests on long parallel segments', () => {
    render();
    pick('parallel');
    expect(cell('cost-brute')).toBe('28');
    expect(cell('cost-all')).toBe('28');
    expect(Number(cell('cost-any'))).toBeLessThan(20);
  });

  it('counts a touch at a shared x as a meeting', () => {
    render();
    pick('touching');
    click(button('Last step'));
    expect(cell('answer')).toBe('Yes');
    expect(text()).toContain('A × B (6, 2)');
  });

  it('reruns live when an end point moves', () => {
    render();
    pick('disjoint');
    click(button('Last step'));
    expect(cell('answer')).toBe('No');
    // B runs from (3, 4) to (8, 3); pulling its right end down to (8, 1) crosses D.
    press(point(3), 'ArrowDown', true);
    press(point(3), 'ArrowDown', true);
    expect(point(3).getAttribute('aria-label')).toContain('(8, 1)');
    expect(cell('answer')).toBe('Yes');
  });

  it('adds a segment and removes one with Delete', async () => {
    render();
    expect(segmentCount()).toBe(4);
    click(buttonByText(m.addSegment));
    expect(segmentCount()).toBe(5);
    press(point(8), 'Delete');
    await Promise.resolve();
    expect(segmentCount()).toBe(4);
  });

  it('refuses a ninth segment and removing the last', () => {
    render();
    pick('parallel');
    click(buttonByText(m.addSegment));
    expect(narration()).toBe(m.fullError(8));
    expect(segmentCount()).toBe(8);
    pick('touching');
    press(point(0), 'Delete');
    press(point(2), 'Delete');
    expect(segmentCount()).toBe(1);
    press(point(4), 'Delete');
    expect(narration()).toBe(m.minError);
    expect(segmentCount()).toBe(1);
  });

  it('keeps its stored answers true to the engine', () => {
    const segs = [
      { id: 0, p: { x: 0, y: 0 }, q: { x: 4, y: 0 } },
      { id: 1, p: { x: 1, y: 2 }, q: { x: 3, y: 2 } },
      { id: 2, p: { x: 5, y: 1 }, q: { x: 6, y: 1 } },
    ];
    const frames = sweepTrace('any', segs);
    expect(Math.max(...frames.map((f) => f.active.length))).toBe(
      /** @type {any} */ (m.practice[2]).answer,
    );
    const last = frames.at(-1);
    expect(last?.events).toHaveLength(6);
    // The worked example claims one pair test and no meeting.
    expect(last?.pairTests).toBe(1);
    expect(last?.hits).toEqual([]);
  });

  it('checks a right and a wrong answer, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const answer = (value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer('5');
    expect(q.textContent).toContain('Not quite');
    click(
      /** @type {HTMLButtonElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Show a hint')
      ),
    );
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer('10');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
