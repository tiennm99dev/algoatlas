// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-range-queries/copy.en.js';
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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {string} value */
const rangeRadio = (value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="range-size"][value="${value}"]`)
  );

describe('practice: range query problems lesson', () => {
  it('opens on the totals of the first preset, with the winner named', () => {
    render();
    expect(presetSelect().value).toBe('sumsAndSets');
    expect(stat('size')).toBe('1,024');
    expect(stat('ops')).toBe('300');
    expect(stat('fenwick-total')).toBe('4,435');
    expect(stat('segment-total')).toBe('8,589');
    expect(stat('cheapest')).toBe('Fenwick tree');
    expect(narration()).toBe(
      'Cheapest: Fenwick tree with 4,435 touches. Out of the running: Sparse table.',
    );
    expect(document.querySelector('[data-testid="fenwick-card"]')?.textContent).toContain(
      m.cheapestWord,
    );
  });

  it('rewinds to the start and steps through the build and the operations', () => {
    render();
    commit(field('ops'), 's0-3 u1=5');
    click(button('First step'));
    expect(narration()).toContain('1,024 cells and nothing built yet');
    expect(stat('fenwick-total')).toBe('0');
    expect(stat('cheapest')).toBe(m.noValue);

    click(button('Next step'));
    expect(narration()).toContain('Built, in touches: Plain array 0, Prefix sums 1,025');
    expect(stat('prefix-build')).toBe('1,025');

    click(button('Next step'));
    expect(narration()).toContain('Sum of a[0..3] is');
    expect(narration()).toContain('Plain array 4, Prefix sums 2');
    expect(narration()).toContain('Sparse table cannot answer it and drops out.');
    expect(stat('plain-cost')).toBe('4');
    expect(stat('answer')).toBe(String(11 + 48 + 85 + 22));
    expect(document.querySelector('[data-testid="range-track"]')?.getAttribute('aria-label')).toBe(
      'Sum of a[0..3] in an array of 1,024 cells.',
    );

    click(button('Next step'));
    expect(narration()).toContain('Set a[1] = 5.');
    expect(stat('prefix-cost')).toBe('1,023');
    expect(stat('answer')).toBe(m.noValue);

    click(button('Next step'));
    expect(narration()).toContain('Cheapest: Plain array with 5 touches.');
    expect(document.querySelector('[data-testid="range-track"]')).toBeNull();
    expect(document.body.textContent).toContain(m.rangeIdle);
  });

  it('marks a structure that cannot answer, and says why', () => {
    render();
    commit(presetSelect(), 'everything');
    const card = document.querySelector('[data-testid="prefix-card"]')?.textContent ?? '';
    expect(card).toContain(m.outWord);
    expect(card).toContain(m.outWhy.prefix);
    expect(narration()).toContain('Out of the running: Prefix sums, Sparse table and Fenwick tree');
  });

  it('marks a total past the bar scale with the cut-off sign', () => {
    render();
    commit(presetSelect(), 'minsAndSets');
    expect(stat('sparse-total')).toBe('1,393,728');
    expect(document.querySelector('[data-testid="sparse-card"]')?.textContent).toContain(
      m.barCutMark,
    );
    expect(document.querySelector('[data-testid="segment-card"]')?.textContent).not.toContain(
      m.barCutMark,
    );
  });

  it('every preset loads and keeps the builder fields in step', () => {
    render();
    commit(presetSelect(), 'shortRanges');
    expect(field('sums').value).toBe('75');
    expect(field('mins').value).toBe('75');
    expect(field('sets').value).toBe('150');
    expect(rangeRadio('short').checked).toBe(true);
    expect(stat('cheapest')).toBe('Plain array');
    expect(stat('plain-total')).toBe('863');
    for (const [name, winner] of [
      ['staticSums', 'Prefix sums'],
      ['staticMins', 'Sparse table'],
      ['minsAndSets', 'Segment tree'],
      ['everything', 'Segment tree'],
      ['sumsAndSets', 'Fenwick tree'],
    ]) {
      commit(presetSelect(), name);
      expect(stat('cheapest')).toBe(winner);
      expect(stat('ops')).toBe('300');
    }
  });

  it('builds a workload from the counts, the size and the range length', () => {
    render();
    commit(field('sums'), '10');
    expect(presetSelect().value).toBe('');
    expect(stat('ops')).toBe('160');
    commit(field('sets'), '0');
    expect(stat('ops')).toBe('10');
    expect(stat('prefix-work')).toBe('20');
    commit(field('mins'), '5');
    expect(stat('ops')).toBe('15');
    expect(document.querySelector('[data-testid="prefix-card"]')?.textContent).toContain(m.outWord);

    commit(field('size'), '16');
    expect(stat('size')).toBe('16');
    expect(stat('segment-build')).toBe('31');

    const anyTotal = stat('plain-total');
    click(rangeRadio('long'));
    expect(stat('plain-total')).not.toBe(anyTotal);
    expect(Number(stat('plain-total'))).toBeGreaterThanOrEqual(15 * 8);
  });

  it('new ranges change the workload but not the counts', () => {
    render();
    commit(field('size'), '64');
    const before = field('ops').value;
    click(buttonByText(m.newRanges));
    expect(field('ops').value).not.toBe(before);
    expect(stat('ops')).toBe('300');
    expect(presetSelect().value).toBe('');
    // A preset always comes back with its first ranges.
    commit(presetSelect(), 'sumsAndSets');
    expect(field('ops').value).toBe(before);
  });

  it('refuses a bad size and bad counts, keeping the last valid workload', () => {
    render();
    commit(field('size'), '3');
    expect(narration()).toBe(m.sizeError);
    expect(field('size').value).toBe('1024');
    commit(field('size'), '');
    expect(narration()).toBe(m.sizeError);
    expect(field('size').value).toBe('1024');
    commit(field('size'), '2000');
    expect(narration()).toBe(m.sizeError);

    commit(field('sums'), '200');
    expect(narration()).toBe(m.countError);
    expect(field('sums').value).toBe('150');
    commit(field('sums'), '1.5');
    expect(narration()).toBe(m.countError);
    expect(stat('ops')).toBe('300');
    expect(stat('fenwick-total')).toBe('4,435');
  });

  it('refuses all-zero counts', () => {
    render();
    commit(presetSelect(), 'staticSums');
    commit(field('sums'), '0');
    expect(narration()).toBe(m.countError);
    expect(field('sums').value).toBe('300');
  });

  it('a refused field also refuses the new ranges click that follows it', () => {
    render();
    const before = field('ops').value;
    commit(field('size'), '3');
    click(buttonByText(m.newRanges));
    expect(field('ops').value).toBe(before);
    expect(narration()).toBe(m.sizeError);
  });

  it('runs typed operations and refuses bad ones', () => {
    render();
    const kept = field('ops').value;
    commit(field('ops'), 's2');
    expect(narration()).toBe(m.opErrors.format);
    expect(field('ops').value).toBe(kept);
    commit(field('ops'), '');
    expect(narration()).toBe(m.opErrors.empty);
    commit(field('ops'), 's0-5000');
    expect(narration()).toBe(m.opErrors.range);
    commit(field('ops'), 'u0=100');
    expect(narration()).toBe(m.opErrors.value);
    commit(field('ops'), Array(301).fill('s0-1').join(' '));
    expect(narration()).toBe(m.opErrors.count);
    expect(field('ops').value).toBe(kept);

    commit(field('ops'), 'u0=5 m0-9');
    expect(stat('ops')).toBe('2');
    expect(field('sets').value).toBe('1');
    expect(field('mins').value).toBe('1');
    expect(field('sums').value).toBe('0');
    expect(presetSelect().value).toBe('');
  });

  it('keeps typed operations across a size that fits and refuses one that does not', () => {
    render();
    commit(field('ops'), 's0-9 u3=7');
    commit(field('size'), '10');
    expect(stat('size')).toBe('10');
    expect(field('ops').value).toBe('s0-9 u3=7');
    commit(field('size'), '9');
    expect(narration()).toBe(m.sizeTooSmall);
    expect(field('size').value).toBe('10');
    expect(stat('size')).toBe('10');
  });

  it('Enter runs the typed operations, and Enter in a builder field commits it', () => {
    render();
    field('ops').value = 's0-1';
    field('ops').dispatchEvent(new Event('input', { bubbles: true }));
    field('ops')
      .closest('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(stat('ops')).toBe('1');
    expect(stat('plain-total')).toBe('2');

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    field('size').dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
  });

  it('shows the chips around the current step', () => {
    render();
    click(button('First step'));
    const chips = () => [...document.querySelectorAll('ol li')].map((li) => li.textContent?.trim());
    const first = field('ops').value.split(' ');
    expect(chips()).toContain(first[0]);
    for (let i = 0; i < 40; i++) click(button('Next step'));
    expect(chips()).toContain(first[39]);
    expect(chips()).not.toContain(first[0]);
    expect(document.body.textContent).toContain(`(${m.opsHotLabel})`);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (el) => el.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const submit = (value) => {
      answer.value = value;
      answer.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    submit('99');
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    submit('4,435');
    expect(q.textContent).not.toContain('Not quite');
  });

  it('names a single touch in the singular', () => {
    render();
    commit(field('ops'), 'u0=5');
    expect(document.body.textContent).toContain('Plain array with 1 touch.');
  });

  it('the suggested experiment shows sqrt blocks passing the Fenwick tree as sums become sets', () => {
    render();
    expect(stat('cheapest')).toBe('Fenwick tree');
    commit(field('sums'), '75');
    commit(field('sets'), '225');
    expect(stat('cheapest')).toBe('Fenwick tree');
    commit(field('sums'), '50');
    commit(field('sets'), '250');
    expect(stat('cheapest')).toBe('Sqrt blocks');
  });

  it('every stored practice answer and quoted total is what the widget shows', () => {
    render();
    const [fenwickTotal, gap, minsWinner, smallWinner, standing, chain, shortWinner] = m.practice;
    expect(/** @type {{ answer: number }} */ (fenwickTotal).answer).toBe(4435);
    expect(stat('fenwick-build')).toBe('2,047');
    expect(stat('fenwick-work')).toBe('2,388');
    expect(stat('fenwick-total')).toBe('4,435');
    expect(/** @type {{ answer: number }} */ (gap).answer).toBe(8589 - 4435);
    expect(stat('segment-total')).toBe('8,589');

    commit(presetSelect(), 'minsAndSets');
    expect(stat('cheapest')).toBe('Segment tree');
    expect(/** @type {any} */ (minsWinner).options[/** @type {any} */ (minsWinner).answer]).toBe(
      'Segment tree',
    );
    expect(stat('segment-total')).toBe('8,589');
    expect(stat('sqrt-total')).toBe('12,404');
    expect(stat('plain-total')).toBe('50,480');
    expect(stat('sparse-build')).toBe('9,228');

    commit(field('size'), '16');
    expect(stat('cheapest')).toBe('Plain array');
    expect(/** @type {any} */ (smallWinner).answer).toBe(1);
    expect(stat('plain-total')).toBe('1,075');
    expect(stat('sqrt-total')).toBe('1,455');
    expect(stat('segment-total')).toBe('2,299');

    commit(field('size'), '1024');
    commit(presetSelect(), 'everything');
    const left = ['plain', 'prefix', 'sparse', 'fenwick', 'segment', 'sqrt']
      .map((id, i) => ({ i, out: document.querySelector(`[data-testid="${id}-card"]`) }))
      .filter((c) => !c.out?.textContent?.includes(`${m.outMark} ${m.outWord}`))
      .map((c) => c.i);
    expect(left).toEqual(/** @type {any} */ (standing).answers);
    expect(stat('cheapest')).toBe('Segment tree');

    commit(field('ops'), 'u0=5');
    expect(stat('fenwick-total')).toBe('2,058');
    expect(/** @type {{ answer: number }} */ (chain).answer).toBe(11);
    expect(stat('prefix-work')).toBe('1,024');

    commit(presetSelect(), 'shortRanges');
    expect(stat('cheapest')).toBe('Plain array');
    expect(/** @type {any} */ (shortWinner).accept).toContain('plain array');
    expect(stat('plain-total')).toBe('863');
    for (const id of ['segment', 'sqrt']) {
      expect(Number(stat(`${id}-build`)?.replace(',', ''))).toBeGreaterThan(863);
    }
  });
});
