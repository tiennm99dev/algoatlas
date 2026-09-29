# Phase 6: graphs/dfs-grid

Runs after phase 2, in parallel with phases 3-5 and 7-8. Effort 2.5h. Read [lesson-conventions.md](lesson-conventions.md) first.

## Context and requirements

This lesson uses the same maze as BFS, but explores with an explicit stack. The path DFS finds is usually not the shortest; that is the lesson. The algorithm is iterative DFS (CLRS 22.3 made iterative). Each stack entry is a `{cell, from}` pair, and a cell is marked visited when it is **popped**. Stale duplicates are skipped and shown as `skip` frames. Neighbors are pushed in reverse BFS order, so "up" is popped first.

The page uses `GridBoard` (painting, keyboard, and transposed drawing come for free) and `ChipList` for the stack. The controls and editing behavior are identical to the BFS page after phase 1: the tools are wall / start / goal, with Random walls and Clear walls buttons. The page compares its path length against `bfsGridTrace` on the same grid.

## Files (owned; create all)

- `src/lib/algo-engine/dfs-grid.js`, `src/lib/algo-engine/dfs-grid.test.js`
- `src/lib/lessons/dfs-grid/copy.en.js`
- `src/routes/graphs/dfs-grid/+page.svelte`, `src/routes/graphs/dfs-grid/page.test.js`

Import read-only from `$lib/algo-engine/graph.js`: `neighbors`, `randomWalls`, `bfsGridTrace`, and the `Grid` typedef.

## Engine: exports and frame

`dfsPseudocode` and `dfsGridTrace(grid: Grid): DfsFrame[]`.

```js
/**
 * @typedef {object} DfsFrame
 * @property {'start'|'pop'|'push'|'skip'|'found'|'no-path'} kind
 * @property {number} current   Cell just popped, -1 when none.
 * @property {number} touched   Neighbor just pushed, -1 when none.
 * @property {number[]} stack   Cells on the stack, top last (duplicates possible).
 * @property {number[]} order   Visit number per cell, starting at 1; -1 unvisited.
 * @property {number[]} path    start→goal once found, else [].
 * @property {number[]} lines
 * @property {number} visited   Running count of visited cells.
 */
```

**Pseudocode** (copy verbatim):
```js
['stack = [(start, none)]', 'while stack is not empty:', '  (cell, from) = stack.pop()',
 '  if cell is already visited: continue      // stale duplicate', '  visited.add(cell); parent[cell] = from',
 '  if cell == goal: walk parents back; stop', '  for each neighbor of cell (left, down, right, up):',
 '    if neighbor is open and not visited: stack.push((neighbor, cell))', 'no path — goal is walled off']
```

Frames and lines:
- `start` [0]
- `pop` [1,2,3,4]: set `order`, `visited++`, record the parent from the entry
- `skip` [1,2,3]: cell already visited
- `found` [5]: `path` from the parents
- `push` [6,7] per pushed neighbor, iterating `neighbors(cell).slice().reverse()` (left, down, right, up), skipping walls and visited cells
- `no-path` [1,8]

The parent is recorded at pop time, from the entry's `from`, and never at push time.

## Copy (`copy.en.js`)

- slug `dfs-grid`, topic `graphs`, level `Intermediate`, title `Depth-first search on a grid`.
- intro: "DFS dives down one corridor as far as it can and backs up only when it is stuck. It reaches every cell BFS reaches, but the first path it finds to the goal is usually not the shortest."
- instruction: "Draw walls by clicking or dragging over the grid, or press Enter on a focused cell. Move the start and goal, then play. Numbers show the order in which cells were visited. Compare the DFS path with the BFS shortest path."
- takeaways:
  1. "DFS is BFS with a stack instead of a queue: the most recently discovered cell is explored next."
  2. "A cell can be pushed several times before it is visited. Marking it visited when it is popped, and skipping the stale copies, keeps each parent link right."
  3. "The first path DFS finds depends on the neighbor order, not on distance. On this grid it can be far longer than the BFS path."
  4. "DFS keeps only the current branch and its pending neighbors, which is why it underlies maze generation, cycle detection, and topological sort."
- `complexityHead: ['Resource', 'Cost', 'Why']`, complexity:
  - `['Time', 'O(V + E)', 'Each cell is visited once, and each edge causes at most one push from each end.']`
  - `['Memory', 'O(V + E)', 'The stack can hold a duplicate entry per edge until the stale ones are skipped.']`
- nextTeaser: "Next up: Dijkstra’s algorithm, for when some cells cost more to cross than others."
- Labels: `toolLabel`, `tools`, `randomMaze`, `clearWalls`, `gridLabel`, `blockedCell`, `edits`, and `coord` all have the same text as `bfs-grid/copy.en.js`. The rest are new:
  - `stackLabel: 'Stack (top first)'`, `stackEmpty: 'empty'`
  - `visitedLabel: 'Visited'`, `pathLabel: 'DFS path length'`, `bfsLabel: 'BFS shortest path'`
  - `legend: {start: 'Start', goal: 'Goal', wall: 'Wall', frontier: 'On the stack', visited: 'Visited', current: 'Visiting', path: 'DFS path'}`
  - `cellLabel(cell, cols, kind, order)` → `Row r, column c[, kind][, visit N]`
- `describe(f, cols)`: these strings are fixed, because the tests use them:
  - start: `Push the start onto the stack.`
  - pop: `Pop ${at} and visit it (visit ${order}).`
  - skip: `${at} was already visited: a stale copy, so skip it.`
  - push: `Push ${at(touched)}: open and not visited yet.`
  - found: `Reached the goal. Following parents back gives a path of ${len} steps.`
  - no-path: `The stack is empty and the goal was never reached — walls cut it off.`

## Page: controls and visual encoding

- The defaults are exactly the BFS page's: 10×16, the same two wall barriers, start (4,2), goal (5,13). Verified: the DFS path is 54 steps and visits 55 cells, while the BFS shortest path is 22.
- Everything else follows the BFS page after phase 1: `rebuild()`, `setWall`, `edit`, `say`, `clearNotice`, `scatter` (`randomWalls(ROWS, COLS, 0.28, [start, goal])`), `clearWalls`, and the `GridBoard` wiring.
- `cellLook(cell)` gives each cell its classes and mark:
  - start: `bg-emerald-700 text-white`, mark S
  - goal: `bg-rose-600 text-white`, mark G
  - wall: `bg-slate-800`
  - path: `bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset`
  - current: `bg-state-active text-white`
  - on the stack: `bg-state-frontier text-slate-900`, plus a `ring-sky-900` ring when touched
  - visited: `bg-state-visited text-indigo-900`
  - otherwise `bg-white`
  - the mark is `order[cell]` when it is at least 1
- Stats: Visited, DFS path length (`—` until found), and BFS shortest path. The BFS figure comes from `$derived` of `bfsGridTrace(...).at(-1)` on the same grid: path length − 1, or `—`.
- `ChipList`: the title is `stackLabel`, and the items are `frame.stack` reversed (top first) with labels from `coord`. The chip is hot when its cell is `touched`.

## Tests

**Engine** (`dfs-grid.test.js`):
1. On 50 seeded random grids (6×8, wall density 0.3), DFS finds a path exactly when BFS does.
2. Every returned path is contiguous (each step is in `neighbors`), avoids walls, and starts and ends correctly.
3. The DFS path length is at least the BFS path length on those grids.
4. On a 1×N corridor, the DFS path equals the BFS path.
5. When start equals goal, the frames are start, pop, found, and the path is `[start]`.
6. A sealed goal ends with `no-path`.
7. Visit numbers are unique and run 1..visited, in pop order.
8. When the result is not found, the last frame has an empty stack.
9. On the 3×3 open grid from the center, the first popped neighbor is "up" (cell 1).
10. A `skip` frame exists on a 3×3 grid with walls {5, 7}, start 0, and goal 8. The goal is sealed, so every stale copy gets popped; verified: 1 skip.
11. Pseudocode coverage: the grid from test 10 together with an open grid where the goal is found covers every line.
12. Frames are not aliased: mutating `frames[2].stack` leaves `frames[3]` unchanged.

**Page** (`page.test.js`):
1. The last step on the default grid shows `path of 54 steps`, and the BFS shortest path stat shows 22.
2. `keyActivate(button('Row 0, column 0'))` gives `button('Row 0, column 0, Wall')`, the text `Step 1 of`, and `Wall added at (0,0).`
3. After the last step, `button('Row 4, column 2, Start, visit 1')` exists.
4. After two Next steps, the text shows `Push (4,1): open and not visited yet.`, and the stack panel contains `(4,1)`.
5. Sealing the goal's neighbors (4,13), (6,13), (5,12), and (5,14), then taking the last step, shows `walls cut it off`.
6. Arrow keys move focus: from the start cell, ArrowRight focuses `Row 4, column 3`. This checks the grid-board wiring.

## Acceptance

All tests pass, and the scoped validation in conventions section 5 is clean. Report the trace length on the default grid and on an open 10×16 grid.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Parent recorded at push time gives wrong paths | M x H | Store `from` in the stack entry; engine test 2. |
| The stack chip list gets long | M x L | `ChipList` truncates at 18 with `+N`. |
| The BFS comparison recomputes on every frame | L x L | Derive it from the grid state only, not from `player.index`. |

## Rollback

Delete the five owned files.
