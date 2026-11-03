// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  MAX_DIVISOR_N,
  MAX_MODULUS,
  MAX_RANGE_N,
  MAX_VALUE,
  MAX_VALUES,
  START,
  calculate,
  divisorsTrace,
  pairsTrace,
  rangeSumTrace,
  subarraysTrace,
} from '$lib/algo-engine/practice-number-theory.js';
import { en as m } from '$lib/lessons/practice-number-theory/copy.en.js';
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
const next = () => click(button('Next step'));
const toLast = () => click(button('Last step'));
/** @param {string} value */
function answer(value) {
  const input = field('guess');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');

describe('number theory sandbox', () => {
  it('walks σ and τ of 360 and lists the divisors', () => {
    render();
    expect(narration()).toContain('divisors of 360');
    expect(stat('feedback')).toBe('');
    next();
    expect(narration()).toContain('2^3 exactly divides n');
    next();
    expect(stat('answer')).toBe('15');
    expect(stat('tau')).toBe('4');
    toLast();
    expect(stat('answer')).toBe('1,170');
    expect(stat('tau')).toBe('24');
    expect(stat('rows')).toContain('1,170');
    expect(stat('brute')).toBe('360');
    expect(document.body.textContent).toContain('180');
    expect(document.body.textContent).toContain(m.askDone);
    expect(document.body.textContent).not.toContain(m.askIdle);
  });

  it('checks the learner’s running total before moving on', () => {
    render();
    expect(document.body.textContent).toContain(m.askIdle);
    next();
    answer('14');
    expect(stat('feedback')).toBe('Not quite. Multiply σ = 1 by 15.');
    expect(stat('wrong')).toBe('1');
    expect(narration()).toContain('2^3 exactly divides n');
    answer('15');
    expect(stat('feedback')).toBe(m.askRight(15));
    expect(stat('right')).toBe('1');
    expect(narration()).toBe('σ = 15 and τ = 4.');
    next();
    expect(stat('feedback')).toBe('');
    field('guess').value = '';
    field('guess').dispatchEvent(new Event('input', { bubbles: true }));
    field('guess').form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(stat('feedback')).toBe(m.askEmpty);
    expect(stat('wrong')).toBe('1');
  });

  it('sums σ up to N by rounds of d', () => {
    render();
    commit(field('puzzle'), 'rangeSum');
    expect(narration()).toContain('σ(1) + … + σ(10)');
    next();
    expect(narration()).toContain('d = 1 divides ⌊10 / 1⌋ = 10');
    answer('10');
    expect(stat('answer')).toBe('10');
    toLast();
    expect(stat('answer')).toBe('87');
    commit(field('limit'), String(MAX_RANGE_N));
    toLast();
    expect(document.body.textContent).toContain(m.tableHidden(MAX_RANGE_N - 8));
  });

  it('counts pairs by remainder buckets', () => {
    render();
    commit(field('puzzle'), 'pairs');
    expect(field('values').value).toBe('1, 2, 3, 4, 5, 6');
    expect(field('m').value).toBe('3');
    next();
    expect(narration()).toContain('Value 1 has remainder 1, so it needs remainder 2');
    expect(titles()).toContain('Remainder 2: seen 0, looked up');
    answer('0');
    expect(titles()).toContain('Remainder 1: seen 1, just counted');
    toLast();
    expect(stat('answer')).toBe('5');
    expect(narration()).toContain('5 pairs sum');
    expect(stat('brute')).toBe('15');
  });

  it('counts subarrays by prefix remainders, starting from the empty prefix', () => {
    render();
    commit(field('puzzle'), 'subarrays');
    expect(field('values').value).toBe('4, 5, 0, 2, 3, 1');
    expect(titles()).toContain('Remainder 0: seen 1');
    toLast();
    expect(stat('answer')).toBe('7');
    expect(stat('brute')).toBe('21');
  });

  it('refuses bad input and keeps the last good value', () => {
    render();
    commit(field('n'), '0');
    expect(narration()).toBe(m.nError(MAX_DIVISOR_N));
    expect(field('n').value).toBe('360');
    commit(field('n'), '36');
    toLast();
    expect(stat('tau')).toBe('9');
    commit(field('puzzle'), 'rangeSum');
    commit(field('limit'), '151');
    expect(narration()).toBe(m.rangeError(MAX_RANGE_N));
    expect(field('limit').value).toBe('10');
    commit(field('puzzle'), 'pairs');
    commit(field('values'), '1, x');
    expect(narration()).toBe(m.valuesError(MAX_VALUES, MAX_VALUE));
    expect(field('values').value).toBe('1, 2, 3, 4, 5, 6');
    commit(field('m'), '13');
    expect(narration()).toBe(m.modulusError(MAX_MODULUS));
    expect(field('m').value).toBe('3');
  });

  it('keeps each list problem’s own input and resets the score on a new input', () => {
    render();
    commit(field('puzzle'), 'pairs');
    commit(field('values'), '3, 3, 3, 3');
    next();
    answer('9');
    expect(stat('wrong')).toBe('1');
    toLast();
    expect(stat('answer')).toBe('6');
    commit(field('puzzle'), 'subarrays');
    expect(stat('wrong')).toBe('0');
    commit(field('m'), '3');
    commit(field('values'), '3, 3, 3, 3');
    toLast();
    expect(stat('answer')).toBe('10');
    commit(field('puzzle'), 'pairs');
    expect(field('values').value).toBe('3, 3, 3, 3');
  });
});

describe('sum of σ(i) narration', () => {
  it('uses the singular for one round', () => {
    render();
    commit(field('puzzle'), 'rangeSum');
    commit(field('limit'), '1');
    toLast();
    expect(narration()).toContain('in 1 round.');
  });
});

describe('modular calculator', () => {
  it('shows the new result when the operation changes after a refusal', () => {
    render();
    commit(field('calc-a'), '-1');
    expect(stat('calc')).toBe(m.calcValueError(1_000_000_000));
    commit(field('calc-op'), 'add');
    expect(stat('calc')).toBe('5 + 3 ≡ 1 (mod 7)');
  });

  it('computes each operation and says when there is no inverse', () => {
    render();
    expect(stat('calc')).toBe('5 ÷ 3 ≡ 4 (mod 7), using 3⁻¹ ≡ 5');
    commit(field('calc-op'), 'pow');
    commit(field('calc-a'), '2');
    commit(field('calc-b'), '1000000000');
    commit(field('calc-m'), '1000000007');
    expect(stat('calc')).toBe('2 ^ 1,000,000,000 ≡ 140,625,001 (mod 1,000,000,007)');
    commit(field('calc-op'), 'div');
    commit(field('calc-b'), '2');
    commit(field('calc-m'), '4');
    expect(stat('calc')).toBe(m.calcNoInverse(2, 4));
  });

  it('refuses bad input and keeps the last good value', () => {
    render();
    commit(field('calc-a'), '-1');
    expect(stat('calc')).toBe(m.calcValueError(1_000_000_000));
    expect(field('calc-a').value).toBe('5');
    commit(field('calc-m'), '0');
    expect(stat('calc')).toBe(m.calcModulusError(1_000_000_007));
    expect(field('calc-m').value).toBe('7');
    commit(field('calc-a'), '6');
    expect(stat('calc')).toBe('6 ÷ 3 ≡ 2 (mod 7), using 3⁻¹ ≡ 5');
  });
});

describe('number theory practice', () => {
  it('checks an answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    input.value = '810';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    input.value = '1170';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores answers the engine agrees with', () => {
    const answers = m.practice.map((ex) => /** @type {any} */ (ex).answer);
    /** @param {import('$lib/algo-engine/practice-number-theory.js').PracticeFrame[]} f */
    const end = (f) =>
      /** @type {import('$lib/algo-engine/practice-number-theory.js').PracticeFrame} */ (f.at(-1));
    expect(answers[0]).toBe(end(divisorsTrace(360)).total);
    expect(answers[1]).toBe(end(divisorsTrace(360)).tau);
    expect([36, 49, 50, 360].map((n) => end(divisorsTrace(n)).tau % 2)).toEqual([1, 1, 0, 0]);
    expect(answers[3]).toBe(end(rangeSumTrace(10)).total);
    expect(answers[4]).toBe(end(pairsTrace(START.values, START.m)).total);
    expect(answers[5]).toBe(end(subarraysTrace(START.subValues, START.subM)).total);
    expect(answers[6]).toBe(
      Array.from({ length: 100 }, (_, i) => i + 1).filter((x) => x % 7 === 3).length,
    );
    expect(calculate('div', 5, 3, 7)).toMatchObject({ value: answers[7] });
  });
});
