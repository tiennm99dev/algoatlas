/**
 * Binary trees in the array layout: slot i holds a node, its children sit in slots 2i + 1 and
 * 2i + 2 and its parent in slot ⌊(i − 1) / 2⌋ (0-based); `null` is an empty slot. Pure, so
 * engines and tests share it. `parseSlots` reads a tree typed in array order, `-` for a gap.
 */

/** @param {number} i */
export const leftOf = (i) => 2 * i + 1;
/** @param {number} i */
export const rightOf = (i) => 2 * i + 2;
/** @param {number} i @returns {number} -1 for the root */
export const parentOf = (i) => (i === 0 ? -1 : Math.floor((i - 1) / 2));
/** @param {number} i */
export const depthOf = (i) => Math.floor(Math.log2(i + 1));

/**
 * Whether slot i holds a node.
 * @param {readonly unknown[]} slots @param {number} i
 */
export const filled = (slots, i) =>
  i >= 0 && i < slots.length && slots[i] !== null && slots[i] !== undefined;

/** @param {readonly unknown[]} slots @param {number} i @returns {number[]} present children, left first */
export function childrenOf(slots, i) {
  return [leftOf(i), rightOf(i)].filter((c) => filled(slots, c));
}

/** The last filled slot, -1 for an empty tree. @param {readonly unknown[]} slots */
export function lastFilled(slots) {
  for (let i = slots.length - 1; i >= 0; i--) if (slots[i] !== null) return i;
  return -1;
}

/** @typedef {'empty' | 'count' | 'format' | 'duplicate' | 'orphan'} SlotError */

/**
 * Reads a tree written in array order: comma- or space-separated entries, `-` for an empty
 * slot. Trailing empty slots are dropped. Errors, in the order they are checked: nothing
 * typed, more than `max` slots, an entry `isEntry` rejects, two equal values, and a node whose
 * parent slot is empty (the root included).
 * @template T
 * @param {string} text
 * @param {{ max: number, isEntry: (part: string) => boolean, toValue: (part: string) => T }} rules
 * @returns {{ slots: (T | null)[] } | { error: SlotError }}
 */
export function parseSlots(text, { max, isEntry, toValue }) {
  const parts = text
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  while (parts.length && parts[parts.length - 1] === '-') parts.pop();
  if (parts.length === 0) return { error: 'empty' };
  if (parts.length > max) return { error: 'count' };
  if (parts.some((p) => p !== '-' && !isEntry(p))) return { error: 'format' };
  /** @type {(T | null)[]} */
  const slots = parts.map((p) => (p === '-' ? null : toValue(p)));
  const values = slots.filter((v) => v !== null);
  if (new Set(values).size !== values.length) return { error: 'duplicate' };
  if (slots[0] === null) return { error: 'orphan' };
  for (let i = 1; i < slots.length; i++)
    if (slots[i] !== null && slots[parentOf(i)] === null) return { error: 'orphan' };
  return { slots };
}

/** Writes slots back in the text form `parseSlots` reads. @param {readonly unknown[]} slots */
export function formatSlots(slots) {
  return slots.map((s) => (s === null || s === undefined ? '-' : String(s))).join(', ');
}
