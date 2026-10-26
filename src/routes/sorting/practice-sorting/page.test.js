// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-sorting/copy.en.js';

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
  localStorage.clear();
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
  return /** @type {HTMLButtonElement} */ (el);
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

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const field = (/** @type {string} */ name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** The cells of one sort's row in the totals table. @param {string} name */
function row(name) {
  const th = [...document.querySelectorAll('tbody th')].find((t) => t.textContent?.trim() === name);
  return [...(th?.parentElement?.querySelectorAll('td') ?? [])].map((td) => td.textContent?.trim());
}

/** @param {string} name */
const lane = (name) =>
  document.querySelector(`svg[aria-label^="${name},"]`)?.getAttribute('aria-label') ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: choosing a sort', () => {
  it('races six sorts on the starting cards', () => {
    render();
    expect(narration()).toContain('Six sorts each get their own copy of the same 12 cards.');
    expect(stat(m.stats.length)).toBe('66');
    expect(row(m.sorts.merge)).toEqual(Array(5).fill(m.pending));
    click(button('Next step'));
    expect(narration()).toContain('Step 1: every running sort has made 1 comparison.');
    click(button('Last step'));
    expect(stat(m.stats.running)).toBe('0 of 6');
    expect(narration()).toContain('Merge sort finished first with 30 comparisons');
    expect(narration()).toContain('Bubble sort and Selection sort needed 66');
    expect(row(m.sorts.merge)).toEqual(['30', '40', '4', '12', '✓ kept']);
    expect(row(m.sorts.quick)).toEqual(['36', '24', '6', '0', '✕ reordered']);
    expect(lane(m.sorts.heap)).toBe(
      'Heapsort, ✓ finished 4th: 5, 8, 17, 17, 29, 42, 42, 56, 63, 71, 88, 94',
    );
  });

  it('fills a row when its sort finishes', () => {
    render();
    for (let k = 0; k < 30; k++) click(button('Next step'));
    expect(narration()).toContain('Merge sort finishes now. 5 sorts are still running.');
    expect(row(m.sorts.merge)[0]).toBe('30');
    expect(row(m.sorts.quick)[0]).toBe(m.pending);
    expect(lane(m.sorts.merge)).toContain('✓ finished 1st');
  });

  it('builds a shape at the chosen size', () => {
    render();
    commit(field('size'), '16');
    click(buttonByText(m.shapes.sorted));
    expect(buttonByText(m.shapes.sorted).getAttribute('aria-pressed')).toBe('true');
    expect(field('values').value).toBe(
      '5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95',
    );
    click(button('Last step'));
    expect(row(m.sorts.quick)).toEqual(['120', '0', '15', '0', '– no repeats']);
    expect(row(m.sorts.insertion)[0]).toBe('15');
    click(buttonByText(m.shapes.reversed));
    click(button('Last step'));
    expect(row(m.sorts.bubble).slice(0, 2)).toEqual(['120', '240']);
    expect(row(m.sorts.merge)[0]).toBe('32');
  });

  it('takes typed cards and refuses bad input', () => {
    render();
    commit(field('values'), '3 1 2');
    expect(stat(m.stats.cards)).toBe('3');
    expect(field('size').value).toBe('3');
    commit(field('values'), '3, 200');
    expect(narration()).toBe(m.valueErrors.range);
    expect(field('values').value).toBe('3, 1, 2');
    commit(field('values'), '7');
    expect(narration()).toBe(m.valueErrors.count);
    commit(field('size'), '40');
    expect(narration()).toBe(m.sizeError);
    expect(field('size').value).toBe('3');
    click(button('Next step'));
    expect(narration()).toContain('Step 1');
    // Enter in the cards field submits the form.
    field('values').value = '9, 8, 7, 6';
    field('values').dispatchEvent(new Event('input', { bubbles: true }));
    field('values')
      .closest('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(stat(m.stats.cards)).toBe('4');
    expect(stat(m.stats.length)).toBe('6');
  });

  it('matches sorts to ticked constraints', () => {
    render();
    const status = () =>
      document.querySelector('[data-testid="match-summary"]')?.textContent?.trim();
    expect(status()).toBe(m.matchSummary(Object.values(m.sorts)));
    /** @param {string} label */
    const box = (label) => {
      const el = [...document.querySelectorAll('label')].find(
        (l) => l.textContent?.trim() === label,
      );
      return /** @type {HTMLInputElement} */ (el?.querySelector('input'));
    };
    click(box(m.constraints.stable));
    click(box(m.constraints.worst));
    expect(status()).toBe('1 sort fits: Merge sort.');
    expect(document.querySelector(`li[aria-label="${m.sorts.merge} fits"]`)).not.toBeNull();
    click(box(m.constraints.stable));
    click(box(m.constraints['in-place']));
    expect(status()).toBe('1 sort fits: Heapsort.');
    click(box(m.constraints.stable));
    expect(status()).toContain('No sort in the race meets all of these needs.');
  });

  it('checks a question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[2]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
