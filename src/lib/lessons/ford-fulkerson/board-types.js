/**
 * Types shared by the flow board and the pages that draw on it.
 *
 * @typedef {import('$lib/components/visual-state.js').VisualState} VisualState
 *
 * One arrow on the board: an edge of the flow network, or an arc of the residual graph.
 * @typedef {object} BoardArc
 * @property {number} from   Vertex index.
 * @property {number} to
 * @property {string} label  Text at the middle of the arrow, such as 3/5.
 * @property {string} title  What a screen reader hears for the arrow.
 * @property {VisualState} state
 * @property {boolean} [dashed]  A backward residual arc, or a cut edge.
 * @property {boolean} [dim]     Drawn faintly (outside the level graph, say).
 */

export {};
