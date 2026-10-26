// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/binary-search-on-answer/copy.en.js';
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

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {number} cap */
const kind = (cap) => document.querySelector(`g[data-cap="${cap}"]`)?.getAttribute('data-kind');

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('binary search on the answer lesson', () => {
  it('opens on the capacity range and finds 18 with 5 checks', () => {
    render();
    expect(text()).toContain('Candidates run from 10, the heaviest parcel, to 48');
    expect(document.querySelectorAll('g[data-cap]')).toHaveLength(39);
    expect(text()).toContain(m.packEmpty);
    click(button('Last step'));
    expect(text()).toContain('The smallest capacity that ships everything in 3 days is 18');
    expect(byTest('checks')).toBe('5');
    expect(byTest('linear')).toBe('9');
    expect(kind(18)).toBe('answer');
    expect(kind(17)).toBe('no');
    expect(kind(19)).toBe('yes');
  });

  it('shows the greedy packing of a checked capacity', () => {
    render();
    click(button('Next step'));
    expect(text()).toContain('Test the middle capacity, mid = 29.');
    expect(kind(29)).toBe('mid');
    click(button('Next step'));
    expect(text()).toContain('At capacity 29 the greedy packing needs 2 days, within D = 3.');
    expect(byTest('verdict')).toBe('2 days ≤ D = 3: ✓ works');
    // The check runs every line of feasible(c), shown in its own code panel.
    const panels = document.querySelectorAll('section[aria-labelledby] ol.font-mono');
    expect(panels[1].querySelectorAll('li[aria-current="step"]')).toHaveLength(5);
    expect(
      document.querySelector('li[aria-label="Day 1: 7 + 2 + 5 + 10 = 24 of 29"]'),
    ).not.toBeNull();
    click(button('Next step'));
    expect(text()).toContain('hi = 29');
    expect(kind(30)).toBe('yes');
  });

  it('changing D reruns the search', () => {
    render();
    commit(input('days'), '2');
    click(button('Last step'));
    expect(text()).toContain('in 2 days is 24');
  });

  it('typed weights replace the parcels and clamp D', () => {
    render();
    commit(input('weights'), '15 15');
    expect(input('days').value).toBe('2');
    click(button('Last step'));
    expect(text()).toContain('in 2 days is 15');
  });

  it('refuses bad weights, days and capacities with a notice', () => {
    render();
    commit(input('weights'), '3, 0');
    expect(text()).toContain('Every weight must be from 1 to 15.');
    expect(input('weights').value).toBe('7, 2, 5, 10, 8, 4, 9, 3');
    commit(input('days'), '9');
    expect(text()).toContain('D must be a whole number from 1 to 8');
    expect(input('days').value).toBe('3');
    commit(input('try'), '5');
    expect(text()).toContain('Try a capacity from 10 to 48.');
  });

  it('a typed capacity shows its own packing until the next step', () => {
    render();
    commit(input('try'), '17');
    expect(byTest('verdict')).toBe('4 days > D = 3: ✕ fails');
    click(button('Next step'));
    expect(text()).not.toContain('4 days > D = 3');
  });

  it('reveals the whole false-then-true strip', () => {
    render();
    const glyphs = () =>
      [...document.querySelectorAll('[data-testid="strip"] g[data-cap] text')].map(
        (t) => t.textContent,
      );
    // Only hi = 48 is known before any check: it ships everything in one day.
    expect(glyphs().filter((g) => g === '✓' || g === '✕')).toEqual(['✓']);
    click(input('reveal'));
    const shown = glyphs()
      .filter((g) => g === '✓' || g === '✕')
      .join('');
    expect(shown).toBe('✕'.repeat(8) + '✓'.repeat(31));
  });

  it('New parcels loads a fresh input', () => {
    render();
    click(buttonByText('New parcels'));
    expect(text()).toContain('Candidates run from');
    expect(input('weights').value).not.toBe('');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '23';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
