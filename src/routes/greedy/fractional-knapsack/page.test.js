// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/fractional-knapsack/copy.en.js';

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
const rows = () =>
  [...document.querySelectorAll('[data-testid="rows"] tbody tr')].map((tr) =>
    [...tr.children].map((c) => c.textContent?.replace(/\s+/g, ' ').trim()).join(' | '),
  );

/** @param {string} value */
function pickProblem(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('fractional knapsack lesson', () => {
  it('starts on the textbook knapsack', () => {
    render();
    expect(narration()).toContain('Fill a knapsack of capacity 50 from 3 items');
    expect(stat('Room left')).toBe('50');
    expect(document.querySelector('[data-testid="zero-one"]')?.textContent).toContain(
      'Greedy by value/weight packs 160; the best is 220, so greedy loses.',
    );
  });

  it('sorts by value per weight and packs whole items first', () => {
    render();
    click(button('Next step'));
    expect(narration()).toContain('Sort by value per weight, highest first: A (6), B (5), C (4).');
    click(button('Next step'));
    expect(narration()).toContain('50 units of room, so all of it fits.');
    click(button('Next step'));
    expect(narration()).toContain('Take all of A: +60. Value 60, 40 units left.');
    expect(rows()[0]).toContain('A ✓');
  });

  it('cuts the last item to two thirds and reaches 240', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('Done: value 240, with only C cut, to 2/3.');
    expect(stat('Value packed')).toBe('240');
    expect(stat('Room left')).toBe('0');
    expect(rows()).toEqual([
      'A ✓ | 60 | 10 | 6 | 1',
      'B ✓ | 100 | 20 | 5 | 1',
      'C ½ | 120 | 30 | 4 | 2/3',
    ]);
    const piece = document.querySelector('g[role="listitem"][aria-label^="C:"]');
    expect(piece?.getAttribute('aria-label')).toBe('C: 2/3, weight 20');
  });

  it('stops early when the knapsack fills, and packs everything when it all fits', () => {
    render();
    commit(field('capacity'), '25');
    click(button('Last step'));
    click(button('Previous step'));
    expect(narration()).toContain(
      'The knapsack is full, so stop: C and every item after it stay out.',
    );
    commit(field('preset'), 'roomy');
    expect(text()).toContain('New example loaded.');
    click(button('Last step'));
    expect(narration()).toContain('Every item fits whole: value 280 with 40 units to spare.');
  });

  it('refuses bad items and capacities, keeping the last valid ones', () => {
    render();
    commit(field('items'), '60/10, 5/0');
    expect(narration()).toContain('Keep every weight between 1 and 99.');
    expect(/** @type {HTMLInputElement} */ (field('items')).value).toBe('60/10, 100/20, 120/30');
    commit(field('capacity'), '0');
    expect(narration()).toContain('The capacity must be a whole number from 1 to 200.');
    expect(/** @type {HTMLInputElement} */ (field('capacity')).value).toBe('50');
    commit(field('items'), '10/5 9/3');
    click(button('Last step'));
    expect(narration()).toContain('Every item fits whole: value 19');
  });

  it('commits typed items on Enter', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('items'));
    input.value = '30/6 20/4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('from 2 items');
  });

  it('schedules the five classic jobs for a profit of 142', () => {
    render();
    pickProblem('jobs');
    expect(narration()).toContain('Schedule 5 jobs, each one time slot long, in slots 1 to 3.');
    expect(stat('Best possible')).toBe('142');
    click(button('Next step'));
    expect(narration()).toContain(
      'Sort by profit, highest first: A (100), C (27), D (25), B (19), E (15).',
    );
    click(button('Next step'));
    expect(narration()).toContain('slot 2 is the latest free one');
    click(button('Next step'));
    expect(narration()).toContain('Put A in slot 2');
    click(button('Last step'));
    expect(narration()).toContain(
      'Done: profit 142, the best any schedule can earn. Skipped: D, B.',
    );
    expect(stat('Slot probes')).toBe('6');
    expect(rows()).toContain('B | 19 | 1 | skipped');
    expect(document.querySelector('[aria-label^="3 time slots"]')?.textContent).toContain('E');
  });

  it('shows a job that finds every slot taken', () => {
    render();
    pickProblem('jobs');
    commit(field('preset'), 'crowded');
    click(button('Last step'));
    click(button('Previous step'));
    click(button('Previous step'));
    expect(narration()).toContain('D: profit 6, deadline 3. Slots 3, 2, 1 are all taken.');
    commit(field('jobs'), '5/11');
    expect(narration()).toContain('Keep every deadline between 1 and 10.');
    expect(/** @type {HTMLInputElement} */ (field('jobs')).value).toBe('9/3, 8/3, 7/3, 6/3');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '220';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '240';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
