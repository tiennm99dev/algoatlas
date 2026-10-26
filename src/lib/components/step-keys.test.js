import { describe, expect, it } from 'vitest';
import { OWN_KEYS, playerKey } from './step-keys.js';

/**
 * A stand-in for a focused element: `closest` answers for the selectors listed.
 * @param {string[]} matches
 */
const at = (...matches) => ({
  closest: (/** @type {string} */ sel) => (matches.includes(sel) ? {} : null),
});

/** @param {string} key @param {Partial<KeyboardEvent>} [extra] */
const press = (key, extra = {}) => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  defaultPrevented: false,
  ...extra,
});

describe('playerKey', () => {
  it('steps and rewinds with the arrows from the page', () => {
    expect(playerKey(press('ArrowRight'), at())).toBe('step');
    expect(playerKey(press('ArrowLeft'), at())).toBe('back');
    expect(playerKey(press('ArrowUp'), at())).toBeNull();
  });

  it('leaves arrows a widget already handled', () => {
    expect(playerKey(press('ArrowRight', { defaultPrevented: true }), at())).toBeNull();
  });

  it('leaves arrows pressed on a roving visualizer cell, even past the end of the row', () => {
    expect(playerKey(press('ArrowRight'), at(OWN_KEYS))).toBeNull();
    expect(playerKey(press('ArrowLeft'), at(OWN_KEYS))).toBeNull();
    expect(OWN_KEYS).toContain('[role="button"]');
    expect(OWN_KEYS).toContain('[role="grid"]');
  });

  it('ignores presses with a modifier', () => {
    expect(playerKey(press('ArrowRight', { shiftKey: true }), at())).toBeNull();
    expect(playerKey(press('ArrowLeft', { ctrlKey: true }), at())).toBeNull();
  });

  it('toggles with Space only inside the player and never on a button', () => {
    expect(playerKey(press(' '), at('[data-player-scope]'))).toBe('toggle');
    expect(playerKey(press(' '), at())).toBeNull();
    expect(playerKey(press(' '), at('[data-player-scope]', 'button'))).toBeNull();
  });

  it('works with no focused element', () => {
    expect(playerKey(press('ArrowRight'), null)).toBe('step');
  });
});
