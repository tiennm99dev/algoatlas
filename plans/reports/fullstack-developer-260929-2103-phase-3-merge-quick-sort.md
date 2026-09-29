# Phase 3 report: sorting/merge-quick-sort

Status: DONE

The merge/quick sort lesson is built: engine, copy, page, and tests. Only the five owned files were created; nothing was staged or committed.

## Files
- `src/lib/algo-engine/merge-quick-sort.js`, `merge-quick-sort.test.js` (55 tests)
- `src/lib/lessons/merge-quick-sort/copy.en.js`
- `src/routes/sorting/merge-quick-sort/+page.svelte`, `page.test.js` (6 tests)

## Validation
- vitest on both test files: 61 passed.
- eslint and prettier on the five files: clean.
- `npm run check`: 0 errors, 0 warnings, none in my paths.
- `npm test`: 20 files, 259 tests, all passed (no failures in files I do not own).

## Trace lengths at n=24
- Merge, random input: 183 frames.
- Quick, sorted input, `last`: 347 frames (reversed and all-equal give the same 347).

## Design notes
- Merge display order follows the phase file, so ids stay unique mid-merge.
- Quick `start` frame has an empty stack; the root range enters the work stack right after it.
- Quick `stack` lists only pending ranges with lo < hi; one-element ranges are still added to `sorted` when popped, as specified. The place frame has `pivot = -1` and focus on the placed pivot, so it renders as sorted.
- Depth counts only calls that emit frames (one-element ranges are skipped), giving `maxDepth` 11 for sorted n=12.
- Switching algorithm reloads the stored traces instead of rebuilding, so totals and a random pivot always match what is on screen. Changing the pivot rule or the array rebuilds both.
- The take narration infers which run supplied the value from `lines` (6 or 7 = a run exhausted, 8 without 9 = right).

## Concerns
None blocking. The quick chip list shows the current range first and then pending ranges bottom first, as specified, so the next range to run is at the far end of the list.
