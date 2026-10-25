// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/algorithms-ram-model/copy.en.js';

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const nInput = () => /** @type {HTMLInputElement} */ (document.querySelector('input[name="n"]'));

/** @param {string} value */
function pickProgram(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="program"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

/** The stat card value under a label. @param {string} label */
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

describe('RAM model lesson', () => {
  it('starts the loop on n = 4 and ends after 5n + 4 = 24 steps', () => {
    render();
    expect(narration()).toContain('Call sumTo(4).');
    click(button('Last step'));
    expect(narration()).toBe('Done after 24 primitive steps.');
    expect(stat('Total primitive steps')).toBe('24');
    expect(stat('Comparisons')).toBe('5');
    expect(text()).toContain('Returned 10: correct ✓');
  });

  it('marks the variables read and written on a step', () => {
    render();
    for (let k = 0; k < 4; k++) click(button('Next step'));
    expect(narration()).toContain('s = s + i makes s = 1');
    expect(text()).toContain('s = 1, written');
    expect(text()).toContain('i = 1, read');
  });

  it('switches to the formula and finishes in 5 steps', () => {
    render();
    pickProgram('formula');
    click(button('Last step'));
    expect(stat('Total primitive steps')).toBe('5');
    expect(text()).toContain('n = 30: 5 steps');
  });

  it('shows the buggy loop returning the wrong answer', () => {
    render();
    commit(nInput(), '10');
    pickProgram('buggy');
    click(button('Last step'));
    expect(stat('Total primitive steps')).toBe('49');
    expect(text()).toContain('Returned 45: wrong ✗');
  });

  it('rebuilds the run when n changes and keeps the last valid n', () => {
    render();
    commit(nInput(), '30');
    click(button('Last step'));
    expect(stat('Total primitive steps')).toBe('154');
    commit(nInput(), '31');
    expect(nInput().value).toBe('30');
    expect(narration()).toBe(m.nError);
    commit(nInput(), '');
    expect(nInput().value).toBe('30');
  });

  it('commits n when the form is submitted with Enter', () => {
    render();
    nInput().value = '2';
    nInput().dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (nInput().closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(stat('Total primitive steps')).toBe('14');
  });

  it('checks practice answers and reveals hints', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    input.value = '35';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    input.value = '39';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
