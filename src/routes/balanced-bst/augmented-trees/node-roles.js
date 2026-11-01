/**
 * What a node is doing in a frame, shared by both trees of the lesson. Each role maps to one
 * palette state and one marker from the copy, so no role relies on colour alone.
 */

/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugFrame} AugFrame */
/** @typedef {'compare'|'path'|'added'|'retrace'|'up'|'down'|'successor'|'answer'} Role */

/** @type {Record<Role, import('$lib/components/visual-state.js').VisualState>} */
export const ROLE_STATE = {
  compare: 'compare',
  path: 'visited',
  added: 'active',
  retrace: 'frontier',
  up: 'swap',
  down: 'path',
  successor: 'frontier',
  answer: 'sorted',
};

export const LEGEND = /** @type {Role[]} */ ([
  'compare',
  'path',
  'added',
  'retrace',
  'up',
  'down',
  'successor',
  'answer',
]);

const INSPECTING = new Set([
  'go-left',
  'go-right',
  'found',
  'dup',
  'select-begin',
  'select-left',
  'select-right',
  'rank-begin',
  'rank-left',
  'rank-right',
  'overlap-begin',
  'overlap-check',
  'overlap-left',
  'overlap-right',
]);

/** @param {AugFrame} f @param {number} slot @returns {Role | null} */
export function roleOf(f, slot) {
  if (f.kind === 'rotate' && slot === f.moved) return 'up';
  if (f.kind === 'rotate' && slot === f.sunk) return 'down';
  if (f.kind === 'retrace' && slot === f.current) return 'retrace';
  if (f.kind === 'attach' && slot === f.current) return 'added';
  if ((f.kind === 'successor' || f.kind === 'copy') && slot === f.succ) return 'successor';
  if (slot === f.answer) return 'answer';
  if (slot === f.current && INSPECTING.has(f.kind)) return 'compare';
  return f.path.includes(slot) && f.kind !== 'retrace' && f.kind !== 'rotate' ? 'path' : null;
}

/** Trees of these presets are already built when the query, the point of the preset, begins. */
export const QUERY_TYPES = new Set(['select', 'rank', 'overlap']);
