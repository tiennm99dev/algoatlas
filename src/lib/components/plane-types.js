/**
 * Shapes the point plane draws. They live in a plain module so engines' pages and tests can
 * name them; a Svelte component's instance script does not export types.
 */

/** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

/**
 * @typedef {object} PlanePoint
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {string} label  Short text inside the dot.
 * @property {VisualState} [state]
 * @property {string} [note]  Text beside the dot, such as its coordinates or a rank.
 * @property {boolean} [fixed]  Never draggable, even when the plane has `onmove`.
 */

/**
 * @typedef {object} PlaneSegment
 * @property {string} key
 * @property {number} x1
 * @property {number} y1
 * @property {number} x2
 * @property {number} y2
 * @property {VisualState} [state]
 * @property {boolean} [dashed]
 * @property {boolean} [arrow]  Draws a head at the (x2, y2) end.
 * @property {boolean} [thick]
 * @property {string} [label]  Text at the midpoint.
 */

/**
 * @typedef {object} PlanePolygon
 * @property {string} key
 * @property {{x: number, y: number}[]} pts
 * @property {VisualState} state
 */

/**
 * @typedef {object} PlaneMark
 * @property {string} key
 * @property {number} x
 * @property {number} y
 * @property {string} [label]
 */

export {};
