# Phase 3: sorting/merge-quick-sort

Runs after phase 2, in parallel with phases 4-8. Effort 4h. Read [lesson-conventions.md](lesson-conventions.md) first.

## Context and requirements

One page, with an Algorithm toggle (merge / quick), mirrors the bubble/insertion page. Both algorithms run on the same array, and a totals panel compares them. Recursion is flattened into a linear trace: every frame snapshots the active ranges. The page uses `BarChart` (with an aux row for the merge buffer), `ChipList` (for the stack), `SegmentedControl`, `CodePanel`, `StepControls`, and `LessonLayout`.

## Files (owned; create all)

- `src/lib/algo-engine/merge-quick-sort.js`, `src/lib/algo-engine/merge-quick-sort.test.js`
- `src/lib/lessons/merge-quick-sort/copy.en.js`
- `src/routes/sorting/merge-quick-sort/+page.svelte`, `src/routes/sorting/merge-quick-sort/page.test.js`

Import read-only: `toItems`, `makeArray`, and the `Item` typedef from `$lib/algo-engine/sorting.js`.

## Engine: exports and frame

`mergePseudocode`, `quickPseudocode`, `mergeSortTrace(input: Item[])`, and `quickSortTrace(input: Item[], rule: 'last'|'median3'|'random' = 'last', rand = Math.random)`.

```js
/**
 * @typedef {object} DivideFrame
 * @property {'start'|'split'|'copy'|'take'|'merged'|'call'|'pivot'|'scan'|'swap'|'place'|'done'} kind
 * @property {Item[]} items   Always a permutation of the input ids (see "Merge display order").
 * @property {number[]} focus
 * @property {number[]} sorted   Final positions (quick: placed pivots and 1-element ranges; merge: all at done).
 * @property {number[]} lines
 * @property {number} comparisons
 * @property {number} swaps       Merge: writes to the main array. Quick: real swaps (i !== j).
 * @property {[number, number] | null} range  Current call's [lo, hi]; bars outside it are dimmed.
 * @property {[number, number][]} stack  Merge: active calls with lo < hi, outermost first. Quick: pending ranges, bottom first.
 * @property {number} depth       Current call depth (0 at start and done).
 * @property {number} maxDepth    Running maximum.
 * @property {Item[] | null} aux  Merge only: copy of a[lo..hi] from 'copy' until 'merged'; otherwise null.
 * @property {number} i  Merge: left buffer head (absolute index). Quick: Lomuto i. -1 when none.
 * @property {number} j  Merge: right buffer head. Quick: scan pointer. -1 when none.
 * @property {number} k  Merge: slot being written. -1 otherwise.
 * @property {[number, number][]} runs  Merge: finished runs (sorted within the run, not final). Quick: [].
 * @property {number} pivot  Quick: pivot index (hi) from 'pivot' until 'place'; -1 otherwise.
 * @property {boolean} [swapped]  On 'scan': a[j] <= pivot, so it moves to the low side.
 */
```

**Merge pseudocode** (Sedgewick Alg. 2.4 aux copy; CLRS recursion), copy verbatim:
```js
['mergeSort(a, lo, hi):', '  if lo >= hi: return', '  mid = floor((lo + hi) / 2)',
 '  mergeSort(a, lo, mid); mergeSort(a, mid + 1, hi)', '  aux = copy of a[lo..hi]; i = lo; j = mid + 1',
 '  for k = lo to hi:', '    if i > mid: a[k] = aux[j++]            // left run used up',
 '    else if j > hi: a[k] = aux[i++]        // right run used up',
 '    else if aux[j] < aux[i]: a[k] = aux[j++]   // strict: left wins ties',
 '    else: a[k] = aux[i++]', 'done: array is sorted']
```
Merge frames and lines:
- `start` []
- `split` [0,1,2,3]: push the range, `focus=[]`
- `copy` [4]
- `take` [5,6], [5,7], [5,8], or [5,8,9] for each k: `focus=[k]`, and `comparisons++` only for branches 8 and 9, `swaps++` every time
- `merged` [5]: pop the range, replace the runs inside it with `[lo,hi]`
- `done` [10]: `sorted` = all indices

Ranges with one element emit no frames (they are implicitly sorted; the narration says so).

**Merge display order.** During a merge, `items[lo..k-1]` holds the output taken so far, and `items[k..hi]` holds the untaken buffer items `aux[i..mid]` followed by `aux[j..hi]`. This keeps ids unique (Svelte keyed each) and lets `flip` animate the taken bar into slot k. The `swaps` counter still counts real writes.

**Quick pseudocode** (Lomuto, CLRS 7.1; randomized-partition-style pivot swap), copy verbatim:
```js
['quickSort(a, lo, hi):', '  if lo >= hi: return', '  swap chosen pivot into a[hi]; pivot = a[hi]',
 '  i = lo - 1', '  for j = lo to hi - 1:', '    if a[j] <= pivot: i = i + 1; swap(a[i], a[j])',
 '  swap(a[i + 1], a[hi])        // pivot lands in its final slot',
 '  quickSort(a, lo, i); quickSort(a, i + 2, hi)', 'done: array is sorted']
```
Quick uses an explicit work stack, starting from `[[0, n-1, depth 1]]`. Pop a range. If `lo === hi`, add it to `sorted` with no frame; if `lo > hi`, skip it. Otherwise emit these frames:
- `call` [0,1]
- `pivot` [2,3]: count a swap if the chosen index is not hi
- `scan` [4,5] for each j: `comparisons++`, `swapped`, `focus=[j, hi]`
- `swap` [5]: only when i !== j, `focus=[i, j]`
- `place` [6,7]: count a swap if i+1 !== hi, add i+1 to `sorted`, then push the right range and then the left range, both at depth+1

Finish with `done` [8]. Pivot rules:
- `last` = hi
- `median3` = the median by (value, index) of lo, floor((lo+hi)/2), and hi
- `random` = lo + floor(rand() * (hi - lo + 1))

## Copy (`copy.en.js`)

- slug `merge-quick-sort`, topic `sorting`, level `Intermediate`, title `Merge sort & quicksort`.
- intro: "Both break the O(n²) barrier by divide and conquer. Merge sort splits the array in half, sorts each half, and merges the two sorted runs. Quicksort picks a pivot, moves smaller values to its left, and sorts each side."
- instruction: "Pick an algorithm and a starting array, then step through. The stack panel shows which part of the array each call is working on; bars outside it are dimmed. For quicksort, try each pivot rule on the sorted and reversed arrays."
- takeaways:
  1. "Merge sort always costs about n·log₂ n comparisons: log₂ n levels of splitting, and each level merges n elements."
  2. "Merge sort is stable because a tie takes from the left run. Quicksort is not: a partition swap can jump over an equal value."
  3. "With the last element as pivot, quicksort is quadratic on sorted, reversed, or all-equal input: the recursion goes n levels deep. Median-of-three fixes sorted input but not all-equal input, which needs a three-way partition."
  4. "Merge sort pays for its guarantee with an O(n) buffer. Quicksort partitions in place and needs only its call stack, which stays O(log n) if it recurses into the smaller side first."
- complexity (default head):
  - `['Merge, any input', 'O(n log n)', 'log₂ n levels, n writes per level.']`
  - `['Quick, typical', 'O(n log n)', 'A good pivot splits the range into two similar halves.']`
  - `['Quick, worst', 'O(n²)', 'A pivot that is always the smallest or largest leaves one side empty.']`
  - `['Extra memory', 'O(n) / O(log n)', 'Merge needs a buffer; quicksort needs only its call stack.']`
- nextTeaser: "Next up: binary search. Once an array is sorted, finding a value takes about log₂ n steps."
- Labels:
  - `algorithmLabel`, and `algorithms: {merge: 'Merge sort', quick: 'Quicksort'}`
  - `presetLabel`, and `presets` (same four keys and texts as bubble-insertion-sort), `sizeLabel`, `shuffle: 'New array'`
  - `pivotLabel: 'Pivot'`, and `pivots: {last: 'Last element', median3: 'Median of three', random: 'Random'}`
  - `comparisons`, `moves: {merge: 'Writes', quick: 'Swaps'}`, `depthLabel: 'Recursion depth'`, `depthValue(d, max)` → `${d} (max ${max})`
  - `stackTitle: {merge: 'Call stack (outermost first)', quick: 'Ranges still to sort'}`, `stackEmpty: 'empty'`, `rangeChip(lo, hi)` → `[${lo}–${hi}]`
  - `compareTitle: 'Total cost on this array'`, and `compareRow(c, s, moves)` as in bubble-insertion-sort
  - `stableLabel(ok)` → `ok ? 'equal values kept their order' : 'equal values were reordered'`
  - `barsLabel(values, sortedCount)`, `auxLabel(values)` → `Buffer: ${values.join(', ')}.`
  - `legend`, and `markers: {compare: '?', write: '⇄', pivot: 'P', sorted: '✓'}`
- `describe(f, algo)`: one sentence per kind. These strings are fixed, because the tests use them:
  - `split`: `Split [${lo}–${hi}] at ${mid}: sort the left half, then the right.`
  - `done`: `Sorted with ${c} comparisons and ${s} ${algo === 'merge' ? 'writes' : 'swaps'}.`

## Page: controls and visual encoding

- Initial array `[42, 17, 88, 5, 63, 29, 71, 12, 95, 36, 54, 24]`, algo `merge`, rule `last`. The Size range runs from 6 to 24 and commits on change.
- Controls:
  - `SegmentedControl` named `algo`
  - Starting array `select`
  - Size range
  - `select name="pivot"`, rendered only when `algo === 'quick'`
  - New array button
- `rebuild()` computes both traces once (quick uses the current rule and `Math.random`). It stores the totals and the stability result in `$state`, then calls `player.load(traces[algo])`. Do not use `$derived` for the totals, because the random pivot must match the trace on screen.
- `BarChart` states:
  - write at k (merge) or swap focus (quick): `bg-state-swap` ⇄
  - quick scan `j`: `bg-state-compare` ?
  - quick pivot: `bg-state-active` P
  - index in a merge `run`: `bg-state-visited`
  - `sorted`: `bg-state-sorted` ✓
  - otherwise `bg-slate-400`
  - `dimmed(i)` = outside `range`
  - the aux row is aligned to lo..hi, with `null` elsewhere; buffer heads i and j get `bg-slate-400 ring-2 ring-state-active ring-inset`, taken slots `bg-slate-200`, the rest `bg-slate-400`
- Stats: Comparisons, `moves[algo]`, `depthValue`.
- `ChipList`: merge shows `stack` chips (the last one is hot). Quick shows a hot chip for `range` followed by the pending ranges.
- The totals panel lists both algorithms' rows plus the stability line for each.

## Tests

**Engine** (`merge-quick-sort.test.js`):
1. Both sorts match `Array.prototype.sort` on empty, one, two, sorted, reversed, and all-equal arrays, and on 200 seeded random arrays (sizes 0-24). All three pivot rules are covered.
2. Merge is stable: on `makeArray('few-unique', 20, seeded(4))`, equal values keep ascending ids.
3. Every frame's `items` ids are a permutation of the input ids (both sorts).
4. The first and last frames have an empty `stack`, and `depth <= n` in every frame.
5. Quick, sorted distinct input of n=12, rule `last`: comparisons are exactly 66 and `maxDepth` is 11. `median3` gives fewer comparisons.
6. Quick at `done`: `sorted` covers 0..n-1.
7. Merge writes are 24 for n=8 and 64 for n=16. For every n up to 24, comparisons are at most `n * ceil(log2 n)`.
8. `swap` frames never have i === j.
9. Frames are not aliased: mutating `frames[1].items` leaves `frames[2]` unchanged.
10. Every `lines` index is in range, and each pseudocode array is fully covered by `[5,1,4,2,3]` plus `[1,2,3]` traces.
11. `random` with a seeded rand is deterministic.

**Page** (`page.test.js`):
1. One Next step shows `Split [0–11] at 5`.
2. Clicking `input[value="quick"]` shows `i = lo - 1` and `Ranges still to sort`. Back on merge, the page shows `aux = copy of a[lo..hi]` and `Call stack (outermost first)`.
3. `select[name="pivot"]` is absent for merge and present for quick.
4. The last step matches `/Sorted with \d+ comparisons and \d+ writes\./`, and the first `role="img"` label contains `12 of 12 sorted`.
5. The totals match `/Merge sort\s*\d+ comparisons · \d+ writes/` and `/Quicksort\s*\d+ comparisons · \d+ swaps/`.
6. After seeking the Step range input (`aria-label="Step"`) to the first `copy` frame (index computed in the test from `mergeSortTrace(toItems(INITIAL))`), an element with an aria-label starting `Buffer:` exists.

## Acceptance

All tests above pass, and the scoped validation in conventions section 5 is clean. At n=24, trace lengths are reported: merge on random input, and quick on sorted input with `last`.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Duplicate ids mid-merge crash the keyed each | H x H if ignored | Use the display order above; engine test 3. |
| Random pivot totals disagree with the shown trace | M x M | Compute once in `rebuild()`; the initial rule `last` is deterministic. |
| Quick trace too long (sorted, n=24, `last` ≈ 300+ frames) | M x L | Accept up to about 400; report the length. |

## Rollback

Delete the five owned files. Nothing else references them until phase 9.
