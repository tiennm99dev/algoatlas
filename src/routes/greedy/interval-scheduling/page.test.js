// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/interval-scheduling/copy.en.js';

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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} name */
const bar = (name) =>
  [...document.querySelectorAll('g[role="listitem"]')]
    .find((g) => g.getAttribute('aria-label')?.startsWith(`${name} [`))
    ?.getAttribute('aria-label') ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('interval scheduling lesson', () => {
  it('starts on the 11 classic activities', () => {
    render();
    expect(narration()).toContain('Keep as many of the 11 intervals as possible');
    expect(stat('Most possible')).toBe('4');
    expect(document.querySelectorAll('g[role="listitem"]')).toHaveLength(11);
  });

  it('sorts by finish time and keeps the first interval', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Sort by finish time');
    click(button('Next step'));
    expect(narration()).toContain('A [1, 4): nothing is kept yet, so it fits.');
    click(button('Next step'));
    expect(narration()).toContain('Keep A; lastFinish becomes 4.');
    expect(bar('A')).toContain('Kept or placed');
    click(button('Next step'));
    expect(narration()).toContain('B [3, 5): 3 < lastFinish 4, so it clashes with A [1, 4).');
    expect(bar('A')).toContain('Clashes with the scanned one');
  });

  it('keeps four activities by earliest finish', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('Kept 4 intervals: A, D, H, K.');
    expect(stat('Kept')).toBe('4');
    expect(stat('Clash checks')).toBe('11');
    expect(bar('B')).toContain('Skipped');
  });

  it('shows shortest first losing on its trap', () => {
    render();
    commit(field('preset'), 'shortTrap');
    expect(text()).toContain('New intervals loaded.');
    commit(field('rule'), 'shortest');
    expect(narration()).toContain('Rule: Select: shortest first.');
    expect(text()).toContain('if I clashes with no interval in chosen:');
    click(button('Last step'));
    expect(narration()).toContain('Kept 1 interval: B. Earliest finish keeps 2');
    expect(text()).toMatch(/Select: earliest finish\s*2 intervals/);
  });

  it('shows earliest start losing and the rooms it needs', () => {
    render();
    commit(field('preset'), 'startTrap');
    commit(field('rule'), 'start');
    click(button('Last step'));
    expect(narration()).toContain('Kept 1 interval: A. Earliest finish keeps 3');
    commit(field('rule'), 'rooms');
    expect(text()).toContain('free = empty min-heap of room finish times');
    click(button('Last step'));
    expect(narration()).toContain('2 rooms hold every interval. At time 1, 2 intervals overlap');
    expect(stat('Rooms')).toBe('2');
    expect(stat('Depth')).toBe('2');
    expect(bar('C')).toContain('room R2');
  });

  it('partitions the classic activities into 6 rooms', () => {
    render();
    commit(field('rule'), 'rooms');
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain('C [0, 6): no room is open yet.');
    click(button('Next step'));
    expect(narration()).toContain('Open room R1 for C.');
    click(button('Last step'));
    expect(narration()).toContain('6 rooms hold every interval. At time 8, 6 intervals overlap');
    expect(text()).toContain('R1: ');
  });

  it('reads typed intervals and refuses bad ones', () => {
    render();
    commit(field('intervals'), '1-4, 4-6');
    click(button('Last step'));
    expect(narration()).toContain('Kept 2 intervals: A, B.');
    commit(field('intervals'), '5-3');
    expect(narration()).toContain('Every interval must end after it starts.');
    expect(/** @type {HTMLInputElement} */ (field('intervals')).value).toBe('1-4, 4-6');
    commit(field('intervals'), '1-30');
    expect(narration()).toContain('Keep every time between 0 and 24.');
  });

  it('commits typed intervals on Enter and loads random ones', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('intervals'));
    input.value = '0-2 1-3 2-4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('Keep as many of the 3 intervals');
    click(buttonByText('Random intervals'));
    expect(text()).toContain('New intervals loaded.');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
