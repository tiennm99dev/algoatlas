# Grid editor extraction and BFS/DFS/Dijkstra review fixes

## Shared modules
- `src/lib/player/grid-editor.svelte.js`: `createGridEditor({rows, cols, walls, start, goal, trace, copy, terrain?})`. It owns the player, walls, start, goal, tool, the frame-tied notice (`narration(text)`, `clearNotice`), `scatter`, `clearWalls`, `edit`, `onPaintStart`, `onPaint`, `onEdit`. The optional `terrain` layer (Dijkstra mud) stays owned by the page so its trace can read the costs.
- `src/lib/lessons/grid-copy.en.js`: `coord`, `cellLabel(cell, cols, kind, ...notes)`, `edits`, `blockedCell`, `gridLabel`, `toolLabel`, `tools`. Lesson copies spread it and keep only a small note helper each (`distanceNote`, `visitNote`, `mudNote`/`costNote`).
- Pages now keep `cellLook`, legend, panels and stats. The cell aria-labels are byte-identical to before.

## Fixes
- Moving start/goal onto mud clears the cell's cost; the confirmation appends "The mud under it was cleared."
- DFS `skip` and Dijkstra `stale` pops keep the visited/settled fill with an inset slate ring, label "Stale copy, skipped", and get a legend entry.
- Dijkstra chip is hot only when its distance equals the current dist (live entry). DFS stack: only the top chip is hot.
- ChipList: sr-only " (current)" suffix on the hot chip, wording via optional `hotLabel`.
- One word "Expanding"; path labels "BFS path length"/"DFS path length"/"Dijkstra path cost" and legend "BFS path"/"DFS path"/"Dijkstra path"; Dijkstra stats are `grid-cols-2` with the odd last card spanning both.
- Graphs blurb in site.en.js updated.

## Tests
- New `grid-editor.test.js` (edit rules, notice lifetime, paint, terrain, cost clear).
- Page tests added: Dijkstra start/goal onto mud (first hop costs 3, not 5), stale label, one hot chip among duplicates; DFS skip label and single hot chip.
- ChipList test for the sr-only marker. Two existing assertions changed for the suffix: chip-list duplicate test and the DFS stack chip `(4,1) (current)`. `lesson-pages.test.js` untouched and green.
- Vitest focused set 106 pass; `npm test` 22 files / 311 pass; eslint, prettier, `npm run check` clean (0 errors).

## Notes
- C7: all three lessons already supply `complexityHead` (rows are resources); no change needed.
- C9: no color-meaning change needed in these lessons (active = current cell, frontier = in queue/on stack). The stale look reuses the visited fill. Listing the known overloads in the conventions doc was outside my files.
- The Dijkstra page annotates the `trace` lambda parameter with `GridInput`; without it svelte-check widens the frame type to `any` there.
