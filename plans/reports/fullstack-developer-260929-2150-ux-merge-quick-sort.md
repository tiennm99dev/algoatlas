# UX fixes: merge sort and quicksort lesson

Applied MQ1 to MQ8 with tests. Edited only the six owned files.

- MQ1: `makeArray('sorted', n)` returns the ascending array (test in `sorting.test.js`); `sorted` preset added to this lesson's copy only.
- MQ2: buffer caption under the chart; `taken` is `bg-slate-400 opacity-40`, head ring is `ring-slate-900`; legend swatches reuse the same classes; merged narration says the buffer is discarded.
- MQ3: buffer row stays mounted (empty slots, label "Buffer: empty.") while merge sort is selected.
- MQ4: quicksort low side `lo..i` drawn with the `run` tier during scan/swap; legend entry "▬ ≤ pivot, low side".
- MQ5: size max 20.
- MQ6: depth card shows "(max M, balanced ≈ ceil(log2 n))".
- MQ7: done narration appends the stability verdict, naming the first reordered pair with ordinals. The stability check lives once in copy (`stability`), and the page totals reuse it.
- MQ8/X3: preset, size, and pivot changes raise notices (preset/size via `newArray`, pivot via `pivotNotice`); pivot select always rendered, disabled for merge; legend write label per algorithm.

Tests: page tests added for MQ1, MQ2, MQ3, MQ4, MQ7, notices, size cap, legend, disabled pivot; two old tests updated (buffer at frame 0, pivot select).

Validation: targeted vitest (108 pass), eslint, prettier, `npm run check` (0 errors, 0 warnings) clean. Full `npm test`: 3 failures, all in dfs-grid and dijkstra-grid page tests (files being edited by other developers, not mine).

Deviation: the sorted-preset test asserts max depth 11 for 12 elements, not 12. The trace counts partitioning calls, and a single-element range is not a call; the takeaway text "n levels deep" is loosely worded but I left it.
