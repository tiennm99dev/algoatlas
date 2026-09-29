# Phase 1: Shared components (bar-chart, chip-list, grid-board, mud hatch)

Runs alone, before every other phase. Effort 3h. Contracts: [lesson-conventions.md](lesson-conventions.md) section 2. Implement exactly those props, because phases 3-8 code against them in parallel and cannot change them.

## Context

The sorting page draws its bars inline (`src/routes/sorting/bubble-insertion-sort/+page.svelte:121-152`). The BFS page draws its queue panel (`src/routes/graphs/bfs-grid/+page.svelte:327-345`) and about 200 lines of grid interaction (lines 33-46, 81-176, 219, 239-292) inline. Merge/quick sort needs the bars, and DFS, Dijkstra, merge/quick, and BST need the chip list. DFS and Dijkstra need the grid. This phase extracts all three so the new pages do not copy that markup. Behavior must stay identical: the existing tests in `src/routes/lesson-pages.test.js` (10 sorting, 9 BFS) are the safety net and must pass **unchanged**.

## Requirements

- Three new components with the contracts in lesson-conventions.md section 2.
- The sorting page uses `BarChart`, and the BFS page uses `ChipList` and `GridBoard`. The binary-search page does not change.
- A new `@utility terrain-mud` in `src/app.css` for Dijkstra's mud hatch.
- The rendered DOM of both migrated pages stays equivalent: same roles, aria-labels, classes on cells and bars, and text.

## Files

Create:
- `src/lib/components/bar-chart.svelte`
- `src/lib/components/chip-list.svelte`
- `src/lib/components/grid-board.svelte`
- `src/lib/components/bar-chart.test.js`
- `src/lib/components/chip-list.test.js`

Modify:
- `src/routes/sorting/bubble-insertion-sort/+page.svelte`
- `src/routes/graphs/bfs-grid/+page.svelte`
- `src/app.css`

Do not modify: `src/routes/lesson-pages.test.js`, `src/routes/searching/binary-search/+page.svelte`, and any other file.

## Steps

1. **chip-list.svelte.** Move the markup at `bfs-grid/+page.svelte:327-345` into the component. Key chips by index instead of by cell (the DFS stack and Dijkstra queue contain duplicates). In the BFS page, replace the markup with:
   `<ChipList title={m.queueLabel} emptyText={m.queueEmpty} items={frame.queue.map((c) => ({ label: m.coord(c, COLS), hot: c === frame.touched }))} />`
2. **bar-chart.svelte.** Move the `role="img"` block at `bubble-insertion-sort/+page.svelte:121-152` into the component, together with the `flip` and `prefersReducedMotion` imports. Compute `maxValue` inside the component from `items` and `aux`. Add the optional aux row and `dimmed` from the contract. In the page, keep `barState`, `barClass`, `barMarker`, the legend, and the card, and render:
   `<BarChart items={frame.items} stateOf={(i) => barClass[barState(i)]} markerOf={(i) => barMarker[barState(i)] ?? ''} ariaLabel={m.barsLabel(frame.items.map((it) => it.value), frame.sorted.length)} speed={player.speed} />`
   Then delete the page's `maxValue` derived and the unused imports.
3. **grid-board.svelte.** Move the transposed-drawing effect, `shownRows`/`shownCols`/`shown`, `focusIndex`, the `grid` ref, `painting`, `cellFromPoint`, `onPointerDown`, `onPointerMove`, `onCellKeydown`, `<svelte:window>`, and the `role="grid"` markup into the component. The component computes `at(r, c) = r * cols + c` from its props. The BFS page keeps `setWall`, `edit`, `say`, `clearNotice`, `scatter`, `clearWalls`, and the legend, and passes:
   - `cellState={(cell) => ({ ...s, label: m.cellLabel(cell, COLS, s.label, walls.has(cell) ? -1 : frame.dist[cell]) })}`, where `s` is today's `cellState(cell)` (rename that helper to `cellLook`).
   - `onPaintStart={(cell) => { if (tool !== 'wall') { edit(cell); return null; } const on = !walls.has(cell); setWall(cell, on); return on; }}`
   - `onPaint={setWall}`, `onEdit={edit}`, `initialFocus={DEFAULT_START}`, `gridLabel={m.gridLabel}`, `speed={player.speed}`, `rows={ROWS}`, `cols={COLS}`.
4. **app.css.** After the `field` utility, add:
   ```css
   /* Diagonal hatch for costly terrain; a background-image, so it layers over any bg-* state color. */
   @utility terrain-mud {
     background-image: repeating-linear-gradient(135deg, rgb(120 53 15 / 0.55) 0 2px, transparent 2px 7px);
   }
   ```
5. **Component tests** (jsdom docblock, mount with `mount`/`flushSync` as in `lesson-pages.test.js`):
   - `bar-chart.test.js`:
     - renders one column per item, with value labels, when there are 20 or fewer items;
     - hides value labels above 20 items;
     - `dimmed` adds `opacity-40` only to the dimmed columns;
     - with `aux`, renders a second `role="img"` carrying `auxLabel`, with one column per slot and an empty column for `null`;
     - `markerOf` text appears under the right bar.
   - `chip-list.test.js`:
     - shows `emptyText` for no items;
     - renders at most `limit` chips plus a `+N` overflow;
     - a hot chip has `bg-sky-700`;
     - duplicate labels render without a keyed-each error.
6. Run the full gate.

## Acceptance criteria

- `git diff --stat src/routes/lesson-pages.test.js` is empty, and all its tests pass.
- `npm run lint && npm run format:check && npm run check && npm test && npm run build` passes.
- The BFS page no longer contains `onpointerdown`, `matchMedia`, or `role="grid"`. The sorting page no longer imports `svelte/animate`.
- The component APIs match lesson-conventions.md section 2 exactly: prop names, types, and defaults.

## Validation

```sh
npx vitest run src/routes/lesson-pages.test.js src/lib/components
npm run lint && npm run format:check && npm run check && npm test && npm run build
```

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Grid extraction changes pointer or keyboard behavior | M x H | Move code verbatim. The 9 BFS tests cover keyboard edits, arrows, transposed arrows, refusal notices, and sealed goals. Pointer drag has no jsdom test, so compare the diff line by line. |
| `svelte-check` flags callback props typed loosely | M x M | Type every prop in a JSDoc `@type {{...}}` on `$props()`, as `segmented-control.svelte` does. |
| Keying chips by index changes BFS chip identity | L x L | No test depends on chip identity, and chips have no transition. |
| The `terrain-mud` utility fails to compile under Tailwind 4 | L x M | `npm run build` compiles CSS. Add a smoke check in the report that the class appears in the built CSS. |

## Rollback

Revert the single phase commit. No data or URL changes.
