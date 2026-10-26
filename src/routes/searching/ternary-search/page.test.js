// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/ternary-search/copy.en.js';
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
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`);
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('ternary search lesson', () => {
  it('opens on the parabola and closes in on 3.7 in 11 rounds', () => {
    render();
    expect(text()).toContain('Look for the highest point of f on [0.000, 6.000]');
    click(button('Next step'));
    expect(text()).toContain(
      'f(m1) = f(2.000) = 3.555 and f(m2) = f(4.000) = 4.955, so f(m1) < f(m2).',
    );
    click(button('Next step'));
    expect(text()).toContain('lo = 2.000; the interval is now 4.000 wide.');
    expect(byTest('cut-left')).not.toBeNull();
    expect(byTest('cut-right')).toBeNull();
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('hi = 4.667');
    expect(byTest('cut-right')).not.toBeNull();
    click(button('Last step'));
    expect(text()).toContain(
      'The peak is at about x = 3.695, f(x) = 5.000, after 11 rounds and 22 evaluations.',
    );
    expect(byTest('rounds')?.textContent?.trim()).toBe('11');
    expect(byTest('answer')).not.toBeNull();
  });

  it('a smaller ε runs more rounds', () => {
    render();
    click(radio('eps', '0.001'));
    click(button('Last step'));
    expect(byTest('rounds')?.textContent?.trim()).toBe('22');
    expect(byTest('evaluations')?.textContent?.trim()).toBe('44');
    expect(text()).toContain('x = 3.700');
  });

  it('the peak slider moves the answer', () => {
    render();
    commit(/** @type {HTMLInputElement} */ (document.querySelector('input[name="peak"]')), '1.2');
    expect(text()).toContain('Peak at x = 1.2');
    click(button('Last step'));
    expect(text()).toMatch(/x = 1\.(19|20|21)\d/);
  });

  it('dragging the peak slider rebuilds the run before the drag ends', () => {
    render();
    const slider = /** @type {HTMLInputElement} */ (document.querySelector('input[name="peak"]'));
    slider.value = '4.5';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    expect(text()).toContain('Peak at x = 4.5');
    click(button('Last step'));
    expect(text()).toMatch(/x = 4\.(49|50|51)\d/);
  });

  it('two peaks hides the slider and explains the miss', () => {
    render();
    click(radio('shape', 'two-peaks'));
    expect(document.querySelector('input[name="peak"]')).toBeNull();
    click(button('Next step'));
    expect(text()).toContain('f(m1) = f(2.000) = 0.646 and f(m2) = f(4.000) = 3.200');
    click(button('Last step'));
    expect(text()).toContain('was discarded in the first round');
  });

  it('switching curves keeps the tent peak exact', () => {
    render();
    click(radio('shape', 'tent'));
    click(button('Last step'));
    expect(text()).toMatch(/x = 3\.(69|70)\d, f\(x\) = 4\.9/);
  });

  it('zoom narrows the axis to the kept interval', () => {
    render();
    click(button('Last step'));
    const ticks = () =>
      [...(byTest('plot')?.querySelectorAll('text') ?? [])].map((t) => t.textContent);
    expect(ticks()).toContain('6');
    click(/** @type {HTMLElement} */ (document.querySelector('input[name="zoom"]')));
    expect(ticks()).not.toContain('6');
    expect(ticks().some((t) => /^3\.\d\d$/.test(t ?? ''))).toBe(true);
  });

  it('lists the interval after each round', () => {
    render();
    expect(text()).toContain(m.intervalsEmpty);
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('[2.000, 6.000]');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '16';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '32';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
