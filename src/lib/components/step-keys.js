/**
 * Which keys the lesson player answers. The player listens on the window, so it must leave
 * alone the keys a focused control already handles.
 */

/** Elements that own their arrow keys: form fields, the editable grid, roving cells. */
export const OWN_KEYS = 'input, select, textarea, [role="grid"], [role="button"]';

/**
 * The player action for a key press, or null when the press belongs to someone else: a
 * modifier is held, a widget already handled it (`defaultPrevented`), or the focus sits in
 * a control that handles arrow keys itself. Visualizer cells (ArrayStrip, TreeView, linked
 * list, DP table and graph nodes) are `role="button"` elements, not native buttons, and let
 * an arrow through at the end of a row; that arrow must not step the player either.
 * Space toggles playback only inside the player area and never on a button, which already
 * activates natively.
 * @param {Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented'>} e
 * @param {Pick<Element, 'closest'> | null} target
 * @returns {'step' | 'back' | 'toggle' | null}
 */
export function playerKey(e, target) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return null;
  if (target?.closest(OWN_KEYS)) return null;
  if (e.key === 'ArrowRight') return 'step';
  if (e.key === 'ArrowLeft') return 'back';
  if (e.key === ' ' && target?.closest('[data-player-scope]') && !target.closest('button')) {
    return 'toggle';
  }
  return null;
}
