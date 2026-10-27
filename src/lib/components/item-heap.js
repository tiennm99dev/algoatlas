/**
 * A binary heap over any items, ordered by `before(a, b)` (true when a belongs nearer the
 * top), that counts its comparisons so a trace can report them. `before` = `<` gives a
 * min-heap, `>` a max-heap. Pure; the array `a` is the heap itself, top first.
 * @template T
 * @param {(a: T, b: T) => boolean} before
 */
export function makeHeap(before) {
  /** @type {T[]} */
  const a = [];
  const counter = { comparisons: 0 };
  /** @param {number} x @param {number} y */
  const first = (x, y) => {
    counter.comparisons++;
    return before(a[x], a[y]);
  };
  /** @param {number} i @returns {number} the slot the item settled in */
  function siftDown(i) {
    for (;;) {
      const l = 2 * i + 1;
      if (l >= a.length) return i;
      let c = l;
      if (l + 1 < a.length && first(l + 1, l)) c = l + 1;
      if (!first(c, i)) return i;
      [a[i], a[c]] = [a[c], a[i]];
      i = c;
    }
  }
  return {
    a,
    counter,
    /** @param {T} item @returns {number} the slot it settled in */
    push(item) {
      a.push(item);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!first(i, p)) break;
        [a[i], a[p]] = [a[p], a[i]];
        i = p;
      }
      return i;
    },
    /** Removes and returns the top. @returns {T} */
    pop() {
      const top = a[0];
      const last = /** @type {T} */ (a.pop());
      if (a.length) {
        a[0] = last;
        siftDown(0);
      }
      return top;
    },
    /** Puts `item` in place of the top and sifts it down. @param {T} item @returns {number} its slot */
    replaceTop(item) {
      a[0] = item;
      return siftDown(0);
    },
  };
}
