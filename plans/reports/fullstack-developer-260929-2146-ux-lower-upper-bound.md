# UX fixes: lower and upper bound lesson

- Window strip: one-row bar over n + 1 slots above the cells (`data-testid="window-strip"`), so hi = n is representable.
- Legend: `copy.en.js` legend.left/right are functions of the test; the page passes `<`/`≥` (lower) or `≤`/`>` (upper).
- "Present target" kept; binary-search `randomPresent` changed to "Present target" (no test pinned it).
- New array raises a notice tied to `player.index` ("New array of N values. Target is X."); any other rebuild clears it.
- Tests added in `page.test.js`: strip width follows window, legend names the test per variant, notice after New array.

Validation: targeted vitest 59 passed; eslint and prettier clean; `npm run check` 0 errors 0 warnings. Full `npm test`: 5 failures, all in dfs-grid, dijkstra-grid, and merge-quick-sort page tests (other developers' files; several are 7-10 s timeouts under parallel load). None touch my paths.

Status: DONE
Summary: LB1, LB2, LB3 applied with three new page tests; my paths are green.
Concerns/Blockers: Full npm test has 5 failures in other lessons' page tests, outside my ownership.
