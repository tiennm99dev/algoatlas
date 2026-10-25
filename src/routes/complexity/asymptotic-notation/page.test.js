// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/asymptotic-notation/copy.en.js';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const plotLabel = () => document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';

/** @param {string} name @param {string} value */
function commit(name, value) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`)).value;

/** @param {string} value */
function pickBound(value) {
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="bound"][value="${value}"]`)
  ).click();
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('asymptotic notation lesson', () => {
  it('starts empty and evaluates n = 1 on the first step', () => {
    render();
    expect(narration()).toContain('f(n) = 3n² + 20n + 50');
    expect(plotLabel()).toContain('Empty log-scale plot');
    click(button('Next step'));
    expect(narration()).toBe('n = 1: f(n) = 73, n² = 1, ratio 73.');
    expect(stat('Ratio f(n) / g(n)')).toBe('73');
  });

  it('ends with a Θ verdict and its witness constants', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('= Θ(n²): 3·n² ≤ f(n) ≤ 73·n² for every n ≥ 1');
    expect(document.body.textContent).toContain('Θ (tight)');
  });

  it('gives O only against 2ⁿ and Ω only against n log n', () => {
    render();
    pickBound('exp');
    click(button('Last step'));
    expect(narration()).toContain('O(2ⁿ) but not Ω(2ⁿ): f(n) ≤ 73·2ⁿ for every n ≥ 4');
    pickBound('nlogn');
    click(button('Last step'));
    expect(narration()).toContain('Ω(n log n) but not O(n log n)');
  });

  it('shows an undefined ratio where n log n is 0', () => {
    render();
    pickBound('nlogn');
    click(button('Next step'));
    expect(narration()).toContain('so the ratio is undefined here');
    expect(stat('Ratio f(n) / g(n)')).toBe('—');
  });

  it('rebuilds on a coefficient change and refuses bad input', () => {
    render();
    commit('a', '0');
    commit('b', '0');
    click(button('Last step'));
    expect(narration()).toContain('f(n) = 50 = O(n²)');
    commit('c', '0');
    expect(narration()).toBe(m.zeroError);
    expect(field('c')).toBe('50');
    commit('a', '11');
    expect(narration()).toBe(m.fieldError);
    expect(field('a')).toBe('0');
    commit('maxN', '1');
    expect(narration()).toBe(m.maxNError);
    expect(field('maxN')).toBe('30');
  });

  it('shortens the run when the largest n changes', () => {
    render();
    commit('maxN', '5');
    click(button('Last step'));
    expect(plotLabel()).toContain('up to n = 5');
  });

  it('checks a practice answer that needs the widget', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[2]);
    const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    input.value = '22';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    input.value = '23';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
