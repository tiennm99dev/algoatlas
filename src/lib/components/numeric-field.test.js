// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFieldGuard, enterField, wholeInRange } from './numeric-field.js';

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('wholeInRange', () => {
  it('takes whole numbers in range only', () => {
    expect(wholeInRange(5, 0, 9)).toBe(true);
    expect(wholeInRange(10, 0, 9)).toBe(false);
    expect(wholeInRange(1.5, 0, 9)).toBe(false);
    expect(wholeInRange(null, 0, 9)).toBe(false);
  });
});

describe('createFieldGuard', () => {
  it('refuses the operation right after a refused commit, once', () => {
    const guard = createFieldGuard();
    expect(guard.commit(false)).toBe(false);
    expect(guard.refused()).toBe(true);
    expect(guard.refused()).toBe(false);
  });

  it('forgets a refusal when a later value is good', () => {
    const guard = createFieldGuard();
    guard.commit(false);
    expect(guard.commit(true)).toBe(true);
    expect(guard.refused()).toBe(false);
  });

  it('still refuses a submit that follows the click, then forgets', () => {
    vi.useFakeTimers();
    const guard = createFieldGuard();
    guard.commit(false);
    document.body.click();
    expect(guard.refused()).toBe(true);
    guard.commit(false);
    document.body.click();
    vi.runAllTimers();
    expect(guard.refused()).toBe(false);
  });
});

describe('enterField', () => {
  /** @param {string} type */
  function field(type) {
    const input = document.createElement('input');
    input.type = type;
    input.name = 'key';
    document.body.append(input);
    input.focus();
    return input;
  }

  /** @param {HTMLElement} el @param {string} key @param {(e: KeyboardEvent) => void} on */
  function press(el, key, on) {
    el.addEventListener('keydown', on);
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e;
  }

  it('runs the action of the field and stops the browser submitting', () => {
    const run = vi.fn();
    const e = press(field('number'), 'Enter', (ev) => enterField(ev, { key: run }));
    expect(run).toHaveBeenCalledOnce();
    expect(e.defaultPrevented).toBe(true);
  });

  it('skips the action when the commit changed the notice', () => {
    const run = vi.fn();
    let notice = 'a';
    const input = field('number');
    input.addEventListener('blur', () => (notice = 'b'));
    press(input, 'Enter', (ev) => enterField(ev, { key: run }, () => notice));
    expect(run).not.toHaveBeenCalled();
  });

  it('leaves other keys and radios alone', () => {
    const run = vi.fn();
    press(field('number'), 'a', (ev) => enterField(ev, { key: run }));
    const e = press(field('radio'), 'Enter', (ev) => enterField(ev, { key: run }));
    expect(run).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });
});
