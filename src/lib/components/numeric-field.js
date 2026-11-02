/**
 * What every numeric field of a lesson does with a value it cannot take. A field commits on
 * `change`, which fires just before the click or Enter that asks for an operation, so on its own
 * the field would revert and the operation would quietly run on the previous value. The guard
 * remembers the refusal, and the operation that follows asks it first and is refused too.
 */

/** Whether `v` is a whole number from `lo` to `hi`; an emptied number input binds null. */
/** @param {unknown} v @param {number} lo @param {number} hi */
export const wholeInRange = (v, lo, hi) =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

/**
 * One guard per field:
 *
 *     if (guard.commit(valid(draft))) key = draft;
 *     else { draft = key; say(m.keyError); }
 *
 * and in the operation:
 *
 *     if (guard.refused() || !valid(draft)) { draft = key; say(m.keyError); return; }
 */
export function createFieldGuard() {
  let refused = false;
  const clear = () => {
    refused = false;
  };
  return {
    /**
     * Records a commit. A refusal lasts until the click that caused the commit has finished, so
     * a click on an empty part of the page does not hold it for a later operation. A submit
     * button runs after its click event, hence the timeout.
     * @param {boolean} ok
     * @returns {boolean} `ok`
     */
    commit(ok) {
      refused = !ok;
      if (!ok && typeof window !== 'undefined') {
        window.addEventListener('click', () => setTimeout(clear), { once: true });
      }
      return ok;
    },
    /** Whether the operation asking now must be refused; asking uses the refusal up. */
    refused() {
      const was = refused;
      refused = false;
      return was;
    },
  };
}

/**
 * Enter in a form field commits the field through its own change handler, then runs that field's
 * action. The browser would otherwise leave the field to revert and submit the form. Radios and
 * fields without an action only get the browser's handling or the commit.
 * @param {KeyboardEvent} e
 * @param {Record<string, () => void>} actions  By the field's `name`.
 * @param {() => unknown} [noticeOf]  For a page without a guard: the action runs only if the
 *   commit left this value unchanged.
 */
export function enterField(e, actions, noticeOf) {
  const field = e.target;
  if (e.key !== 'Enter' || !(field instanceof HTMLInputElement) || field.type === 'radio') return;
  e.preventDefault();
  const before = noticeOf?.();
  field.blur();
  field.focus();
  if (noticeOf?.() === before) actions[field.name]?.();
}
