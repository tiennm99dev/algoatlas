// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/amortized-analysis/copy.en.js';

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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickMethod(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="method"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 400 && !narration().includes(part); k++) click(button('Next step'));
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('amortized analysis lesson', () => {
  it('counts 30 flips for 16 increments of a 4-bit counter', () => {
    render();
    expect(narration()).toBe(
      'A 4-bit counter at 0000: no 1s, no coins, Φ = 0. We will run 16 increments.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Increment 1: start at bit 0 of 0000 (value 0).');
    click(button('Next step'));
    expect(narration()).toContain('Bit 0 is 0: set it to 1');
    expect(stat(m.stats.phi)).toBe('1');
    expect(text()).toContain('Bit 0: 1, holds a coin, just set');
    click(button('Last step'));
    expect(stat(m.stats.total)).toBe('30');
    expect(stat(m.stats.bound)).toBe('32');
    expect(stat(m.stats.worst)).toBe('4');
    expect(stat(m.stats.phi)).toBe('0');
    expect(narration()).toContain('16 increments cost 30 flips in total');
  });

  it('spends coins on the overflow and shows the amortized cost 0', () => {
    render();
    stepUntil('All 4 bits were 1');
    expect(narration()).toContain('Cost 4, amortized 0');
    pickMethod('potential');
    expect(text()).toContain('Increment 16: ĉ = c + ΔΦ = 4 + (0 − 4) = 0.');
  });

  it('reads the same run with each method', () => {
    render();
    commit(input('ops'), '3');
    click(button('Last step'));
    expect(text()).toContain(m.accounting.balance(6, 4, 2));
    expect(text()).toContain('0011₂ = 3');
    pickMethod('aggregate');
    expect(document.querySelector(`[aria-label="${m.aggregate.tableAria}"]`)).not.toBeNull();
    expect(text()).toContain('Total = Σ ⌊3/2ⁱ⌋ = 4 < 2 × 3 = 6');
    pickMethod('potential');
    expect(text()).toContain('Σ ĉ = 6 = Σ c + Φ − Φ₀ = 4 + 2 − 0');
  });

  it('keeps the last valid values and submits with Enter', () => {
    render();
    commit(input('bits'), '9');
    expect(narration()).toBe(m.bitsError);
    expect(input('bits').value).toBe('4');
    commit(input('ops'), '0');
    expect(narration()).toBe(m.opsError);
    expect(input('ops').value).toBe('16');
    input('bits').value = '8';
    input('bits').dispatchEvent(new Event('input', { bubbles: true }));
    input('ops').value = '64';
    input('ops').dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (input('bits').closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(stat(m.stats.total)).toBe('127');
    expect(stat(m.stats.worst)).toBe('7');
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '32';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
