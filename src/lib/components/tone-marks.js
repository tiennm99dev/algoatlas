/**
 * Vietnamese tone-mark placement, the new style the site uses wherever it writes Vietnamese: in
 * an open syllable ending in `oa`, `oe` or `uy`, the mark sits on the last
 * vowel (hoá, hoà, khoẻ, thuỷ, luỹ), not on the first (hóa, hòa, khỏe,
 * thủy, lũy). Closed syllables (khoảng, hoàn, thuyền, toán) and `qu`
 * syllables (quý, quả) already agree in both styles and never change.
 *
 * `oldToneMarks` finds the old-style words in a text, for the content test;
 * `newToneMarks` rewrites them.
 */

/** Each toned vowel → [base vowel, tone index]; tones: sắc, huyền, hỏi, ngã, nặng. */
const TONED = {
  o: 'óòỏõọ',
  O: 'ÓÒỎÕỌ',
  u: 'úùủũụ',
  U: 'ÚÙỦŨỤ',
};

/** The toned forms of the last vowel, in the same tone order. */
const LAST = {
  a: 'áàảãạ',
  A: 'ÁÀẢÃẠ',
  e: 'éèẻẽẹ',
  E: 'ÉÈẺẼẸ',
  y: 'ýỳỷỹỵ',
  Y: 'ÝỲỶỸỴ',
};

const CONSONANTS = 'bcdđghklmnpqrstvxBCDĐGHKLMNPQRSTVX';

/**
 * A whole word: an optional consonant onset, a toned `o` before `a`/`e` or a
 * toned `u` before `y`, and nothing after. The lookarounds keep it a whole
 * word, so a closed syllable (khoảng) or a longer word never matches.
 */
const OLD = new RegExp(
  `(?<![\\p{L}\\p{M}])([${CONSONANTS}]{0,3})` +
    `(?:([${TONED.o}${TONED.O}])([aAeE])|([${TONED.u}${TONED.U}])([yY]))` +
    `(?![\\p{L}\\p{M}])`,
  'gu',
);

/**
 * @param {string} ch a toned first vowel
 * @returns {[string, number]} its base vowel and tone index
 */
function untone(ch) {
  for (const [base, forms] of Object.entries(TONED)) {
    const i = forms.indexOf(ch);
    if (i >= 0) return [base, i];
  }
  return [ch, -1];
}

/**
 * The new-style spelling of one old-style match, or null when it must stay
 * (a `qu` onset, where `u` belongs to the consonant).
 * @param {string} onset
 * @param {string} first toned first vowel
 * @param {string} last plain last vowel
 */
function respell(onset, first, last) {
  if (/[qQ]$/.test(onset)) return null;
  const [base, tone] = untone(first);
  return `${onset}${base}${LAST[/** @type {keyof typeof LAST} */ (last)][tone]}`;
}

/**
 * The old-style words in `text`, in order, each once per occurrence.
 * @param {string} text
 * @returns {string[]}
 */
export function oldToneMarks(text) {
  const out = [];
  for (const m of text.matchAll(OLD)) {
    const [word, onset, o, oLast, u, uLast] = m;
    if (respell(onset, o ?? u, oLast ?? uLast) !== null) out.push(word);
  }
  return out;
}

/**
 * `text` with every old-style word rewritten in the new style:
 * 'Hóa học, thủy tinh' → 'Hoá học, thuỷ tinh'.
 * @param {string} text
 */
export function newToneMarks(text) {
  return text.replace(
    OLD,
    (word, onset, o, oLast, u, uLast) => respell(onset, o ?? u, oLast ?? uLast) ?? word,
  );
}
