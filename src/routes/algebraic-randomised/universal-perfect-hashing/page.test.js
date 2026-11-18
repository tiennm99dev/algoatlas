// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { lcg } from '$lib/algo-engine/seeded-random.js';
import {
  HASH_PRESETS,
  MAX_KEY,
  MAX_N,
  MAX_SAMPLES,
  MIN_N,
  SAMPLE_BATCH,
  exactMeanPairs,
  fixedPairs,
  hashOf,
  perfectHashTrace,
} from '$lib/algo-engine/universal-perfect-hashing.js';
import { en as m } from '$lib/lessons/universal-perfect-hashing/copy.en.js';
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
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const toLast = () => click(button('Last step'));
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Next step'));
};
/** @param {string} mark */
const marked = (mark) =>
  [...document.querySelectorAll('[data-testid="buckets"] [aria-label]')].filter((el) =>
    el.getAttribute('aria-label')?.endsWith(mark),
  ).length;

describe('universal and perfect hashing lesson', () => {
  it('steps through the first level and then a collision-free second level', () => {
    render();
    const trace = perfectHashTrace(HASH_PRESETS.textbook, lcg(7));
    const done =
      /** @type {import('$lib/algo-engine/universal-perfect-hashing.js').PerfectFrame} */ (
        trace.at(-1)
      );
    expect(narration()).toContain('Build a perfect hash table for 9 keys');
    next(2);
    const place = trace[2];
    expect(narration()).toContain(
      `h(${place.key}) = ((${place.a}·${place.key} + ${place.b}) mod 101) mod 9`,
    );
    expect(narration()).toContain(
      `put ${place.key} in bucket ${hashOf(place.key, place.a, place.b, 9)}`,
    );
    toLast();
    expect(narration()).toContain(`using 9 + ${done.slots} = ${9 + done.slots} slots`);
    expect(stat('first-draws')).toBe(String(done.firstDraws));
    expect(stat('second-draws')).toBe(String(done.secondDraws));
    expect(stat('sum-squares')).toBe(`${done.sumSquares} / 36`);
    expect(marked('bucket finished')).toBe(done.slots);
  });

  it('looks a key up in the finished table only', () => {
    render();
    click(buttonByText(m.lookupButton));
    expect(narration()).toBe(m.lookupWait);
    toLast();
    click(buttonByText(m.lookupButton));
    expect(narration()).toMatch(/^60 hashes to bucket \d+, then to its slot \d+: found 60/);
    commit(field('probe'), '11');
    click(buttonByText(m.lookupButton));
    expect(narration()).toMatch(/^11 hashes to bucket \d+/);
    expect(narration()).toContain('not stored');
    commit(field('probe'), '500');
    expect(narration()).toBe(m.lookupError(MAX_KEY));
    expect(field('probe').value).toBe('11');
  });

  it('pressing Enter in the lookup field runs the lookup', () => {
    render();
    toLast();
    const input = field('probe');
    input.value = '52';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toMatch(/^52 hashes to bucket \d+, then to its slot \d+: found 52/);
  });

  it('samples random draws and compares them with the fixed hash', () => {
    render();
    commit(field('preset'), 'attack');
    expect(stat('fixed')).toBe('45');
    expect(stat('bound')).toBe('4.5');
    expect(stat('exact')).toBe(m.twoDp(exactMeanPairs(HASH_PRESETS.attack)));
    expect(stat('draws')).toBe('0');
    click(buttonByText(m.sampleMany(SAMPLE_BATCH)));
    click(buttonByText(m.sampleMany(SAMPLE_BATCH)));
    expect(stat('draws')).toBe('200');
    expect(Number(stat('mean'))).toBeLessThan(6);
    expect(Number(stat('good')?.split(' ')[0])).toBeGreaterThan(100);
    expect(document.querySelector('[data-testid="histogram"]')?.children.length).toBe(46);
    click(buttonByText(m.clear));
    expect(stat('draws')).toBe('0');
  });

  it('caps the number of sampled draws', () => {
    render();
    for (let k = 0; k < MAX_SAMPLES / SAMPLE_BATCH; k++)
      click(buttonByText(m.sampleMany(SAMPLE_BATCH)));
    expect(stat('draws')).toBe(String(MAX_SAMPLES));
    click(buttonByText(m.sampleMany(SAMPLE_BATCH)));
    expect(narration()).toBe(m.samplesFull(MAX_SAMPLES));
  });

  it('rebuilds from typed keys, refuses bad ones, and redraws', () => {
    render();
    commit(field('keys'), '5 17');
    expect(narration()).toContain('for 2 keys');
    expect(stat('fixed')).toBe(String(fixedPairs([5, 17])));
    toLast();
    expect(narration()).toContain('No two keys share a slot');
    for (const bad of ['5', '5 5', '1 2 300']) {
      commit(field('keys'), bad);
      expect(narration()).toBe(m.keysError(MIN_N, MAX_N, MAX_KEY));
      expect(field('keys').value).toBe('5, 17');
    }
    click(buttonByText(m.reroll));
    expect(narration()).toContain('for 2 keys');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[1]).hints[0]);
    answer.value = '45';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    expect(/** @type {any} */ (m.practice[0]).answer).toBe(hashOf(75, 3, 42, 9));
    expect(/** @type {any} */ (m.practice[1]).answer).toBe(fixedPairs(HASH_PRESETS.attack));
    expect(/** @type {any} */ (m.practice[2]).answer).toBe((10 * 9) / 2 / 10);
    expect(/** @type {any} */ (m.practice[3]).answer).toBe(3 ** 2);
  });
});
