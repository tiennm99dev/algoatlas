/**
 * Joining a list of pieces into one string, two ways, with every character copy counted.
 *
 * - `concat`: `s = s + p` on immutable strings. Nothing can be appended in place, so each step
 *   allocates a new string of length len(s) + len(p), copies all of s into it, writes p after
 *   it, and throws the old s away. Joining k pieces of length L copies L·k(k − 1)/2 old
 *   characters: O(n²) for n characters in total.
 * - `builder`: a mutable buffer with spare capacity, like Java's StringBuilder. A piece that
 *   fits is written into the spare slots; a piece that does not fit first grows the buffer to
 *   max(2 × capacity, needed) and copies the buffer across once. One final copy turns the
 *   buffer into a string. Doubling keeps the growth copies under 2n, so the join is O(n).
 *
 * Lengths are counted in characters (Unicode code points), one cell per character.
 *
 * `inspectText` lists each character's code point and its UTF-8 bytes and UTF-16 code units,
 * the encodings behind "how long is this string".
 */

export const MAX_PIECES = 12;
export const MAX_PIECE_LENGTH = 8;
export const MAX_TOTAL = 32;
export const MIN_CAPACITY = 1;
export const MAX_CAPACITY = 16;
export const MAX_INSPECT = 16;

/** @typedef {'concat' | 'builder'} JoinMode */
export const JOIN_MODES = /** @type {JoinMode[]} */ (['concat', 'builder']);

export const joinPseudocode = {
  concat: [
    'joinByConcat(pieces):',
    '  s = ""',
    '  for each p in pieces:',
    '    t = allocate(len(s) + len(p))   ▹ s cannot change in place',
    '    copy s into t[0..len(s))        ▹ len(s) copies',
    '    copy p into t[len(s)..)         ▹ len(p) writes',
    '    s = t                           ▹ the old s is garbage',
    '  return s',
  ],
  builder: [
    'joinByBuilder(pieces, cap):',
    '  buf = allocate(cap); len = 0',
    '  for each p in pieces:',
    '    if len + len(p) > capacity:',
    '      newCap = max(2 × capacity, len + len(p))',
    '      nb = allocate(newCap); copy buf[0..len) into nb',
    '      buf = nb                      ▹ the old buffer is garbage',
    '    copy p into buf[len..)          ▹ len(p) writes',
    '    len = len + len(p)',
    '  return toString(buf[0..len))      ▹ one final copy of len chars',
  ],
};

/**
 * @typedef {object} StringFrame
 * @property {'start'|'allocate'|'copy'|'append'|'grow'|'build'|'done'} kind
 * @property {JoinMode} mode
 * @property {string[]} pieces
 * @property {number} piece  Index of the piece being joined, -1 outside a join step.
 * @property {(string|null)[]} cells  The string s (concat) or the buffer (builder); null = spare.
 * @property {(string|null)[] | null} next  The new string t, the new buffer, or (builder, at the
 *   end) the result string; null when there is none.
 * @property {number} length  Characters stored in `cells`.
 * @property {number} capacity  Slots in `cells`.
 * @property {[number, number] | null} read  Half-open range of `cells` read on this frame.
 * @property {[number, number] | null} wrote  Half-open range written on this frame, in `next`
 *   when it exists, else in `cells`.
 * @property {number} copies  Characters already joined that were copied again so far.
 * @property {number} writes  Characters of the pieces written so far.
 * @property {number} opCopies  Copies made for the piece being joined.
 * @property {number} allocations  Blocks allocated so far.
 * @property {number} allocated  Total slots of all the blocks allocated so far.
 * @property {number} garbage  Blocks thrown away so far.
 * @property {number[]} lines
 */

/** Characters (code points) of a string. @param {string} s */
export const charsOf = (s) => Array.from(s);

/**
 * Reads pieces separated by spaces.
 * @param {string} text
 * @returns {{ pieces: string[] } | { error: 'empty' | 'long' | 'count' | 'total' }}
 */
export function parsePieces(text) {
  const pieces = text.split(/\s+/).filter(Boolean);
  if (pieces.length === 0) return { error: 'empty' };
  if (pieces.some((p) => charsOf(p).length > MAX_PIECE_LENGTH)) return { error: 'long' };
  if (pieces.length > MAX_PIECES) return { error: 'count' };
  if (pieces.reduce((t, p) => t + charsOf(p).length, 0) > MAX_TOTAL) return { error: 'total' };
  return { pieces };
}

/**
 * @param {JoinMode} mode @param {string[]} pieces
 */
function recorder(mode, pieces) {
  /** @type {StringFrame[]} */
  const frames = [];
  const s = {
    piece: -1,
    /** @type {(string|null)[]} */
    cells: [],
    /** @type {(string|null)[] | null} */
    next: null,
    length: 0,
    /** @type {[number, number] | null} */
    read: null,
    /** @type {[number, number] | null} */
    wrote: null,
    copies: 0,
    writes: 0,
    opCopies: 0,
    allocations: 0,
    allocated: 0,
    garbage: 0,
  };
  /** @param {StringFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      mode,
      pieces: pieces.slice(),
      ...s,
      cells: s.cells.slice(),
      next: s.next ? s.next.slice() : null,
      capacity: s.cells.length,
      read: s.read ? [s.read[0], s.read[1]] : null,
      wrote: s.wrote ? [s.wrote[0], s.wrote[1]] : null,
      lines: lines.slice(),
    });
    s.read = null;
    s.wrote = null;
  }
  /** @param {number} size */
  function allocate(size) {
    s.next = Array.from({ length: size }, () => null);
    s.allocations++;
    s.allocated += size;
  }
  /** Copy cells[0..length) into next. */
  function copyAcross() {
    const next = /** @type {(string|null)[]} */ (s.next);
    for (let i = 0; i < s.length; i++) next[i] = s.cells[i];
    s.copies += s.length;
    s.opCopies += s.length;
    if (s.length > 0) {
      s.read = [0, s.length];
      s.wrote = [0, s.length];
    }
  }
  /** @param {(string|null)[]} block @param {string[]} chars @param {number} at */
  function write(block, chars, at) {
    chars.forEach((c, i) => (block[at + i] = c));
    s.writes += chars.length;
    if (chars.length > 0) s.wrote = [at, at + chars.length];
  }
  return { frames, s, push, allocate, copyAcross, write };
}

/**
 * `s = s + p` for every piece, on immutable strings.
 * @param {string[]} pieces  1 to MAX_PIECES pieces.
 * @returns {StringFrame[]}
 */
export function concatTrace(pieces) {
  const { frames, s, push, allocate, copyAcross, write } = recorder('concat', pieces);
  push('start', [0, 1]);
  pieces.forEach((p, k) => {
    const chars = charsOf(p);
    s.piece = k;
    s.opCopies = 0;
    allocate(s.length + chars.length);
    push('allocate', [2, 3]);
    copyAcross();
    push('copy', [4]);
    const t = /** @type {(string|null)[]} */ (s.next);
    write(t, chars, s.length);
    // s = t: the old string is dropped. The empty string at the start was never allocated.
    if (k > 0) s.garbage++;
    s.cells = t;
    s.next = null;
    s.length = t.length;
    push('append', [5, 6]);
  });
  s.piece = -1;
  s.opCopies = 0;
  push('done', [7]);
  return frames;
}

/**
 * Appends every piece to a growable buffer, then copies it out once.
 * @param {string[]} pieces  1 to MAX_PIECES pieces.
 * @param {number} capacity  MIN_CAPACITY to MAX_CAPACITY.
 * @returns {StringFrame[]}
 */
export function builderTrace(pieces, capacity) {
  const { frames, s, push, allocate, copyAcross, write } = recorder('builder', pieces);
  allocate(capacity);
  s.cells = /** @type {(string|null)[]} */ (s.next);
  s.next = null;
  push('start', [0, 1]);
  pieces.forEach((p, k) => {
    const chars = charsOf(p);
    s.piece = k;
    s.opCopies = 0;
    const needed = s.length + chars.length;
    const grows = needed > s.cells.length;
    if (grows) {
      allocate(Math.max(2 * s.cells.length, needed));
      push('grow', [2, 3, 4]);
      copyAcross();
      push('copy', [5, 6]);
      s.cells = /** @type {(string|null)[]} */ (s.next);
      s.next = null;
      s.garbage++;
    }
    write(s.cells, chars, s.length);
    s.length = needed;
    push('append', grows ? [7, 8] : [2, 3, 7, 8]);
  });
  s.piece = -1;
  s.opCopies = 0;
  allocate(s.length);
  copyAcross();
  push('build', [9]);
  push('done', [9]);
  return frames;
}

/** @param {JoinMode} mode @param {string[]} pieces @param {number} capacity */
export function joinTrace(mode, pieces, capacity) {
  return mode === 'concat' ? concatTrace(pieces) : builderTrace(pieces, capacity);
}

/**
 * The totals of a whole join, without keeping its frames.
 * @param {JoinMode} mode @param {string[]} pieces @param {number} capacity
 */
export function joinCost(mode, pieces, capacity) {
  const f = /** @type {StringFrame} */ (joinTrace(mode, pieces, capacity).at(-1));
  return {
    copies: f.copies,
    writes: f.writes,
    allocations: f.allocations,
    allocated: f.allocated,
    work: f.copies + f.writes,
  };
}

/**
 * @typedef {object} CharInfo
 * @property {string} char
 * @property {number} code  The Unicode code point.
 * @property {string} hex  The code point as U+XXXX.
 * @property {number[]} utf8  Its UTF-8 bytes.
 * @property {number} utf16  UTF-16 code units: 2 for a code point above U+FFFF, else 1.
 */

/** UTF-8 bytes of one code point. @param {number} cp */
export function utf8Bytes(cp) {
  if (cp < 0x80) return [cp];
  if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 63)];
  if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
  return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
}

/**
 * Each character of the text with its code point and encodings.
 * @param {string} text
 * @returns {{ chars: CharInfo[], utf8: number, utf16: number } | { error: 'empty' | 'long' }}
 */
export function inspectText(text) {
  const chars = charsOf(text);
  if (chars.length === 0) return { error: 'empty' };
  if (chars.length > MAX_INSPECT) return { error: 'long' };
  const infos = chars.map((char) => {
    const code = /** @type {number} */ (char.codePointAt(0));
    return {
      char,
      code,
      hex: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
      utf8: utf8Bytes(code),
      utf16: code > 0xffff ? 2 : 1,
    };
  });
  return {
    chars: infos,
    utf8: infos.reduce((t, c) => t + c.utf8.length, 0),
    utf16: infos.reduce((t, c) => t + c.utf16, 0),
  };
}
