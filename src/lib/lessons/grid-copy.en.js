/**
 * Wording shared by every grid lesson. Lesson copies spread this in and add their own
 * legend, stat labels, and narration.
 */
export const gridCopy = {
  toolLabel: 'Edit',
  tools: { wall: 'Walls', start: 'Move start', goal: 'Move goal' },
  gridLabel: 'Grid. Use arrow keys to move, Enter to edit the focused cell.',
  blockedCell: 'Pick an open cell — start and goal cannot sit on a wall or on each other.',
  /** @param {number} cell @param {number} cols */
  coord(cell, cols) {
    return `(${Math.floor(cell / cols)},${cell % cols})`;
  },
  /**
   * The full accessible name of a cell: its position, its state, then any lesson notes
   * (distance, visit order, terrain). Empty notes are dropped.
   * @param {number} cell @param {number} cols @param {string} kind @param {...string} notes
   */
  cellLabel(cell, cols, kind, ...notes) {
    const where = `Row ${Math.floor(cell / cols)}, column ${cell % cols}`;
    return [where, kind, ...notes].filter(Boolean).join(', ');
  },
  /** Confirmations for keyboard edits, which recolor a cell without changing the narration. */
  edits: {
    wallAdded: /** @param {string} at */ (at) => `Wall added at ${at}.`,
    wallRemoved: /** @param {string} at */ (at) => `Wall removed at ${at}.`,
    startMoved: /** @param {string} at */ (at) => `Start moved to ${at}.`,
    goalMoved: /** @param {string} at */ (at) => `Goal moved to ${at}.`,
  },
};
