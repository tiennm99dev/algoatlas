/**
 * Shapes the linked list lessons hand to `pointer-diagram.svelte`.
 * @typedef {import('$lib/components/visual-state.js').VisualState} VisualState
 */

/**
 * One node box at a grid position. `next` and `prev` are node ids, or null for a null
 * pointer (drawn as a slash in the field). `prev` is drawn only when the diagram is doubly.
 * `hotNext` and `hotPrev` mark the pointer written on this step; `stale` dashes the links of
 * a node that has left the list.
 * @typedef {object} DiagramNode
 * @property {number} id
 * @property {string} label
 * @property {number} col  Column, fractions allowed; the drawing shifts so the smallest is 0.
 * @property {number} row  Row, top to bottom.
 * @property {string} title  Spoken and tooltip name of the node.
 * @property {number | null} next
 * @property {number | null} [prev]
 * @property {VisualState} [state]
 * @property {string} [marker]
 * @property {boolean} [hotNext]
 * @property {boolean} [hotPrev]
 * @property {boolean} [stale]
 */

/**
 * A named variable that points at a node, or at null.
 * @typedef {object} DiagramPointer
 * @property {string} name
 * @property {number | null} id
 * @property {boolean} [hot]  Written on this step.
 */

export {};
