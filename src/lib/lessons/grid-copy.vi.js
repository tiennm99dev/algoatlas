/**
 * Wording shared by every grid lesson. Lesson copies spread this in and add their own
 * legend, stat labels, and narration.
 */
export const gridCopy = {
  toolLabel: 'Sửa',
  tools: { wall: 'Tường', start: 'Dời điểm xuất phát', goal: 'Dời đích' },
  gridLabel: 'Lưới. Dùng phím mũi tên để di chuyển, Enter để sửa ô đang chọn.',
  blockedCell:
    'Hãy chọn một ô trống: điểm xuất phát và đích không được nằm trên tường hay trùng nhau.',
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
    const where = `Hàng ${Math.floor(cell / cols)}, cột ${cell % cols}`;
    return [where, kind, ...notes].filter(Boolean).join(', ');
  },
  /** Confirmations for keyboard edits, which recolor a cell without changing the narration. */
  edits: {
    wallAdded: /** @param {string} at */ (at) => `Đã thêm tường ở ${at}.`,
    wallRemoved: /** @param {string} at */ (at) => `Đã bỏ tường ở ${at}.`,
    startMoved: /** @param {string} at */ (at) => `Đã dời điểm xuất phát đến ${at}.`,
    goalMoved: /** @param {string} at */ (at) => `Đã dời đích đến ${at}.`,
  },
};
