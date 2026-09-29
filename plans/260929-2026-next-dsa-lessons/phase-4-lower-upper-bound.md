# Phase 4: searching/lower-upper-bound

Runs after phase 2, in parallel with phases 3 and 5-8. Effort 2.5h. Read [lesson-conventions.md](lesson-conventions.md) first.

## Context and requirements

This is binary search for "where would x go?" on a half-open window `[lo, hi)`:
- `lower_bound(x)` is the first i with `a[i] >= x`, or n if there is none.
- `upper_bound(x)` is the first i with `a[i] > x`, or n.
- The number of copies of x is `upper - lower`.

Both bounds run the same loop with a different test. The page structure mirrors `src/routes/searching/binary-search/+page.svelte` in watch mode only. There is no drive mode (out of scope). No shared component is needed beyond `SegmentedControl`, `CodePanel`, `StepControls`, and `LessonLayout`.

## Files (owned; create all)

- `src/lib/algo-engine/lower-upper-bound.js`, `src/lib/algo-engine/lower-upper-bound.test.js`
- `src/lib/lessons/lower-upper-bound/copy.en.js`
- `src/routes/searching/lower-upper-bound/+page.svelte`, `src/routes/searching/lower-upper-bound/page.test.js`

## Engine: exports and frame

- `boundPseudocode: {lower: string[], upper: string[]}`
- `boundTrace(a: number[], x: number, variant: 'lower'|'upper'): BoundFrame[]`
- `makeSortedArrayWithDuplicates(n, rand = Math.random): number[]`. The array is non-decreasing. Start at `floor(rand()*5)+1`. For each next value, repeat the previous one with probability 0.35, otherwise add `floor(rand()*4)+1`. Return `[]` for n = 0.

```js
/**
 * @typedef {object} BoundFrame
 * @property {'start'|'probe'|'go-right'|'go-left'|'done'} kind
 * @property {'lower'|'upper'} variant
 * @property {number} lo
 * @property {number} hi        Exclusive.
 * @property {number} mid       -1 when no midpoint is being read.
 * @property {number} answer    -1 until 'done', then lo.
 * @property {number[]} lines
 * @property {number} comparisons  Running total of array reads.
 */
```

**Pseudocode.** These are two arrays that differ only at index 3. Copy them verbatim.
```js
lower: ['lo = 0; hi = n            // half-open window [lo, hi)', 'while lo < hi:',
  '  mid = lo + floor((hi - lo) / 2)', '  if a[mid] < x:          // upper bound: a[mid] <= x',
  '    lo = mid + 1          // answer is right of mid', '  else: hi = mid          // mid could still be the answer',
  'return lo                 // first index where the test fails']
upper: same, but index 3 = '  if a[mid] <= x:         // lower bound: a[mid] < x'
```

Frames and lines:
- `start` [0]
- `probe` [1,2,3]: set `mid`, `comparisons++`
- `go-right` [4]: `lo = mid + 1`, keep `mid`
- `go-left` [5]: `hi = mid`, keep `mid`
- `done` [1,6]: `mid = -1`, `answer = lo`

## Copy (`copy.en.js`)

- slug `lower-upper-bound`, topic `searching`, level `Intermediate`, title `Lower bound & upper bound`.
- intro: "Binary search can answer more than \"is it here?\". Lower bound finds the first position whose value is at least x; upper bound finds the first position whose value is greater than x. Every copy of x sits between the two."
- instruction: "Choose lower or upper bound and a target, then step through. The window is half-open: lo is inside it, hi is just past its end. When the search ends, a caret marks where x would be inserted."
- takeaways:
  1. "Both bounds are the same loop. Only the test on a[mid] changes: < for lower bound, ≤ for upper bound."
  2. "The window [lo, hi) is half-open, so it shrinks with hi = mid, not mid − 1. Mixing this with the closed window of plain binary search is the classic off-by-one bug."
  3. "The answer is always a valid insertion point from 0 to n, even when x is missing, smaller than everything, or larger than everything."
  4. "upper − lower counts the copies of x in O(log n), without scanning the run of equal values."
  5. "There is no early exit on a hit, so every search reads about log₂ n cells."
- `complexityHead: ['Resource', 'Cost', 'Why']`, complexity:
  - `['Time', 'O(log n)', 'The window halves on every read, with no early exit.']`
  - `['Counting x', 'O(log n)', 'Two searches: upper − lower.']`
  - `['Memory', 'O(1)', 'Only lo, hi, and mid.']`
- nextTeaser: "Next up: hash tables, which find a key in O(1) on average with no sorting at all."
- Labels:
  - `variantLabel: 'Search for'`, `variants: {lower: 'Lower bound', upper: 'Upper bound'}`
  - `targetLabel: 'Target x'`, `sizeLabel`, `newArray: 'New array'`, `randomPresent: 'Present target'`, `randomAbsent: 'Missing target'`
  - `arrayLabel(values, lo, hi)` → `Sorted array: ${values.join(', ')}. Window [${lo}, ${hi}).`
  - `legend: {mid: 'Midpoint being read', left: 'Test held (left of lo)', right: 'Test failed (hi and beyond)', range: 'Copies of x', answer: 'Answer'}`
  - `readsLabel: 'Reads'`, `ceilingLabel: 'Most reads needed'`
  - `resultTitle: 'Result'`, `lowerLabel: 'Lower bound'`, `upperLabel: 'Upper bound'`, `countText(x, c)` → `${c} ${c === 1 ? 'copy' : 'copies'} of ${x}`, `pending: '—'`
- `describe(f, a, x)` states the invariant at every step, for example "everything left of lo is < x". These strings are fixed, because the tests use them:
  - start: `Looking for the ${variant} bound of ${x} in [0, ${n}).`
  - done: `The window is empty. ${Lower|Upper} bound of ${x} is ${answer}.`

## Page: controls and visual encoding

- Initial `[2, 5, 5, 5, 8, 11, 11, 14, 17, 17, 17, 17, 20, 23, 26]` (n=15), target 17, variant `lower`. Verified: lower bound 8, upper bound 12, 4 copies, 4 reads each.
- Controls:
  - `SegmentedControl` named `variant`
  - `input type="number"` target with `draft`/`target` commit-on-change (keep the last valid value)
  - Size range from 6 to 24, which builds a new array on change
  - New array
  - Present target, and Missing target (a value not in the array; it may be below min or above max)
- On each variant change, target commit, or array change, rebuild the current trace, and also compute both variants' final answers for the result panel.
- Cells are `div`s inside one `div role="img" aria-label={m.arrayLabel(...)}`. Each cell has `data-index={i}`, a value, an index label, and a marker row (`lo`, `mid`, `hi`, joined by spaces). One extra trailing gap slot at index n carries `hi` when hi = n, and the caret when answer = n. Colors:
  - left of `lo`: `bg-state-visited`
  - at or beyond `hi`: `bg-slate-100 text-slate-600`
  - window: white
  - `mid`: `bg-state-active text-white`
  - at `done`, cells in `[lower, upper)` get `bg-state-sorted text-white` (from both precomputed answers)
  - at `done`, a caret `▼` in `text-state-active` sits over the gap before `answer`
- The legend names the window "half-open [lo, hi)".
- Stats: Reads (`frame.comparisons`) and Most reads needed (`Math.ceil(Math.log2(n + 1))`). The result panel shows lower, upper, and `countText` only at `done`, and `pending` before that.

## Tests

**Engine** (`lower-upper-bound.test.js`):
1. Exhaustive check: over every non-decreasing array of length 0-5 drawn from the alphabet {1,2,3}, and every x from 0 to 4, `lower` equals a linear scan for the first `a[i] >= x`, `upper` equals the first `a[i] > x`, and `upper - lower` equals the count of x.
2. An empty array returns answer 0 for both variants.
3. `lo <= hi` in every frame. `mid` is in `[lo, hi)` on every `probe` frame.
4. The last frame is `done` with `answer >= 0`, and it is the only `done`.
5. `comparisons <= Math.ceil(Math.log2(n + 1))` for n from 0 to 64.
6. Below every value gives 0 and above every value gives n, for both variants.
7. A run of equal values touching either end: `[3,3,3,5]` and `[1,3,3,3]` with x=3.
8. Each pseudocode array is fully covered by the lines of traces over the initial array with x ∈ {17, 1, 99}.
9. `makeSortedArrayWithDuplicates` returns length n and is non-decreasing. It is deterministic with the seeded rand, and returns `[]` for 0.

**Page** (`page.test.js`):
1. The last step shows `Lower bound of 17 is 8.` and `4 copies of 17`. `[data-index="8"]` to `[data-index="11"]` have `bg-state-sorted`, and indices 7 and 12 do not.
2. Clicking `input[value="upper"]` shows `if a[mid] <= x:`. The last step shows `Upper bound of 17 is 12.` and still `4 copies of 17`.
3. `commit(targetInput, '99')`, then the last step shows `Lower bound of 99 is 15.` and `0 copies of 99`.
4. Typing `5` with only an input event (no change): the last step still shows `Lower bound of 17 is 8.`
5. `commit(targetInput, '')` shows `bound of 17` and never `null`.
6. Before the last step, the result panel shows `—`.

## Acceptance

All tests pass, and the scoped validation in conventions section 5 is clean.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Off-by-one between the half-open and closed windows | M x H | Exhaustive engine test 1. The legend and narration say "half-open". |
| Caret at gap n is not drawn | M x M | The explicit trailing gap slot; page test 3 checks the answer text. Report a visual check as unverified (no browser). |
| `role="img"` hides the per-cell state from screen readers | L x M | `arrayLabel` carries the window, and the live narration carries each step. |

## Rollback

Delete the five owned files.
