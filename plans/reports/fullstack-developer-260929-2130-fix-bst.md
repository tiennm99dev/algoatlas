# BST lesson review fixes

- Undo and Reset use `aria-disabled` plus an early-return guard, so focus stays on the button when the log empties. `btn` in `src/app.css` gained additive `aria-disabled:cursor-not-allowed aria-disabled:opacity-40`.
- The `role="status"` banner is gone. Refusals use the frame-tied notice (`say`/`clearNotice`, keyed to `player.index`) rendered in the narration paragraph.
- Preset select has a disabled "Load a preset…" placeholder; it is selected again after Undo, Reset, or any added op, so a preset can be reapplied.
- Teaser now points to breadth-first search on a grid.
- Legend items read `marker label` with `size-3 rounded-sm` swatches. Stats are `grid-cols-2` with Size spanning both. `complexityHead` is `['Resource','Cost','Why']`; rows renamed "Time, balanced" and "Time, worst" to fit that header.
- Three new page tests: Reset focus and aria-disabled, notice dropped after Next step, preset reapply after Reset and Undo.

Validation: bst vitest 29/29 pass; eslint, prettier, and svelte-check clean in my paths. Full `npm test`: 17 failures in bfs/dfs/dijkstra grid tests and one merge-quick test, all in files other developers are editing; no BST failures.

Status: DONE
Summary: All requested BST fixes and three regression tests are in place and green.
Concerns/Blockers: `npm test` shows 17 failures in other lessons' page tests (grid lessons, merge-quick), not in my files and likely mid-edit by others.
