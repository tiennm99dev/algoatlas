// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/p-np-reductions/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));

describe('P, NP and reductions lesson', () => {
  it('builds H pair by pair, then verifies the certificate', () => {
    render();
    expect(narration()).toContain('The input is G and k = 4');
    click(button('Next step'));
    expect(narration()).toContain('A – B is an edge of G, so H gets no edge there');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain('A – E is not an edge of G, so add it to H');
    expect(byTest('map-steps')).toBe('4');
    click(button('Last step'));
    expect(byTest('map-steps')).toBe('15');
    expect(byTest('checks')).toBe('6');
    expect(byTest('verdict')).toBe('S is accepted.');
    expect(byTest('answer')).toBe('yes, for example {A, B, C, D}');
    expect(narration()).toContain('Both answers are yes');
  });

  it('rejects a wrong certificate for a yes instance, then accepts a fixed one', () => {
    render();
    commit(field('select[name="preset"]'), 'house');
    click(button('Last step'));
    expect(byTest('verdict')).toBe('S is rejected.');
    expect(byTest('answer')).toBe('yes, for example {A, B, C}');
    click(button('Vertex D, in the certificate'));
    expect(narration()).toContain('The verifier rejects it at once');
    click(button('Vertex C, not in the certificate'));
    expect(narration()).toContain('A – B is an edge of G, and so not an edge of H');
    click(button('Last step'));
    expect(byTest('verdict')).toBe('S is accepted.');
    expect(field('select[name="preset"]').value).toBe('');
  });

  it('changes k and refuses a bad one', () => {
    render();
    commit(field('input[name="k"]'), '5');
    click(button('Last step'));
    expect(byTest('answer')).toBe('no');
    expect(byTest('subsets')).toBe('6');
    commit(field('input[name="k"]'), '9');
    expect(narration()).toBe(m.kError(6));
    expect(field('input[name="k"]').value).toBe('5');
  });

  it('follows an edit of G', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="remove"]')));
    click(/** @type {Element} */ (document.querySelector('[aria-label="Delete edge A and B"]')));
    click(button('Last step'));
    expect(byTest('verdict')).toBe('S is rejected.');
    expect(byTest('answer')).toBe('no');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('A – B is an edge of G');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '30';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('n(n − 1)/2');
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Not quite');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
