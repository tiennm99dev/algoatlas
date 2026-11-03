// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { attackTrace, MAX_PRIME, MIN_PRIME, rsaTrace } from '$lib/algo-engine/rsa-cryptography.js';
import { en as m } from '$lib/lessons/rsa-cryptography/copy.en.js';
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
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const next = () => click(button('Next step'));
const toLast = () => click(button('Last step'));
const toAttacker = () =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector('input[name="mode"][value="attacker"]')
    ),
  );

describe('RSA lesson, owner view', () => {
  it('walks key generation, encryption and decryption', () => {
    render();
    expect(narration()).toContain('p = 61 and q = 53');
    expect(stat('v-n')).toBe(m.unknown);
    expect(stat('v-e')).toBe(m.unknown);
    next();
    expect(stat('v-n')).toContain('3,233');
    expect(stat('v-n')).toContain(m.justFound);
    next();
    expect(stat('v-phi')).toContain('3,120');
    next();
    expect(stat('v-e')).toContain('17');
    next();
    expect(narration()).toContain('first rows');
    expect(document.body.textContent).toContain(m.euclidTitle);
    toLast();
    expect(stat('v-d')).toBe('2,753');
    expect(stat('v-c')).toBe('2,790');
    expect(stat('v-recovered')).toBe('65');
    expect(stat('check')).toBe('1');
    expect(stat('match')).toBe(m.matchYes);
    expect(narration()).toContain('equals M = 65');
  });

  it('writes a negative coefficient with a true minus sign', () => {
    render();
    while (!narration().startsWith('Quotient')) next();
    expect(narration()).toBe('Quotient 183 gives r = 9 and t = −183.');
  });

  it('shows the exponent bits while powering', () => {
    render();
    const frames = rsaTrace(61, 53, 17, 65);
    const at = frames.findIndex((f) => f.kind === 'encrypt');
    for (let i = 0; i < at; i++) next();
    expect(document.body.textContent).toContain(m.powerTitle.encrypt);
    expect(narration()).toContain('Bit 0 of e is 1');
    expect(titles()).toContain('Bit with weight 2 to the 0: 1, being read');
    next();
    expect(narration()).toContain('Bit 1 of e is 0');
    expect(titles()).toContain('Bit with weight 2 to the 0: 1, multiplied in');
    expect(titles()).toContain('Bit with weight 2 to the 1: 0, being read');
  });

  it('rebuilds from a preset and each field', () => {
    render();
    commit(field('preset'), 'tiny');
    toLast();
    expect(stat('v-d')).toBe('7');
    expect(stat('v-c')).toBe('8');
    commit(field('M'), '4');
    toLast();
    expect(stat('v-c')).toBe('31');
    expect(stat('v-recovered')).toBe('4');
    commit(field('e'), '7');
    toLast();
    expect(stat('v-d')).toBe('3');
    commit(field('preset'), 'multiple');
    toLast();
    expect(stat('v-recovered')).toBe('122');
  });

  it('refuses bad input and keeps the last good value', () => {
    render();
    commit(field('p'), '15');
    expect(narration()).toBe(m.primeError(MIN_PRIME, MAX_PRIME));
    expect(field('p').value).toBe('61');
    commit(field('p'), '53');
    expect(narration()).toBe(m.primeError(MIN_PRIME, MAX_PRIME));
    commit(field('q'), '503');
    expect(field('q').value).toBe('53');
    commit(field('e'), '4');
    expect(narration()).toBe(m.exponentError(3120));
    expect(field('e').value).toBe('17');
    commit(field('M'), '3233');
    expect(narration()).toBe(m.messageError(3233));
    expect(field('M').value).toBe('65');
    commit(field('M'), '');
    expect(field('M').value).toBe('65');
  });

  it('brings e and M back into range when new primes need it', () => {
    render();
    commit(field('p'), '3');
    expect(field('M').value).toBe('65');
    commit(field('q'), '5');
    expect(field('e').value).toBe('3');
    expect(field('M').value).toBe('5');
    expect(narration()).toContain(m.exponentChanged(3));
    expect(narration()).toContain(m.messageChanged(5));
    toLast();
    expect(stat('v-recovered')).toBe('5');
  });
});

describe('RSA lesson, attacker view', () => {
  it('factors n from the public values alone and reads the message', () => {
    render();
    toAttacker();
    expect(narration()).toContain('n = 3,233, e = 17, c = 2,790');
    expect(stat('a-p')).toBe(m.unknown);
    next();
    expect(stat('attack-line')).toBe('3,233 mod 2 = 1');
    toLast();
    expect(stat('trials')).toBe('27');
    expect(stat('a-p')).toBe('53');
    expect(stat('a-q')).toBe('61');
    expect(stat('a-d')).toBe('2,753');
    expect(stat('a-M')).toBe('65');
  });

  it('follows the key the owner typed', () => {
    render();
    commit(field('preset'), 'tiny');
    toAttacker();
    toLast();
    expect(stat('trials')).toBe('2');
    expect(stat('a-M')).toBe('2');
  });

  it('shows how trial division scales', () => {
    render();
    expect(document.querySelector('[data-testid="scale"]')).toBeNull();
    toAttacker();
    const text = stat('scale') ?? '';
    expect(text).toContain('617 (RSA-2048)');
    expect(text).toContain('≈ 5 seconds');
    expect(text).toContain('under a second');
    expect(text).toContain('years');
  });
});

describe('RSA practice', () => {
  it('checks an answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores answers the engine agrees with', () => {
    const answers = m.practice.map((ex) => /** @type {any} */ (ex).answer);
    expect(answers[0]).toBe(rsaTrace(3, 11, 3, 2).at(-1)?.d);
    expect(answers[1]).toBe(rsaTrace(3, 11, 3, 4).at(-1)?.c);
    expect(rsaTrace(3, 11, 3, 4).at(-1)?.recovered).toBe(4);
    expect(answers[2]).toBe(rsaTrace(61, 53, 17, 65).at(-1)?.c);
    expect(answers[4]).toBe(attackTrace(3233, 17, 2790).at(-1)?.trials);
  });
});
