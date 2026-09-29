# Phase 7: graphs/dijkstra-grid

Runs after phase 2, in parallel with phases 3-6 and 8. Effort 3h. Read [lesson-conventions.md](lesson-conventions.md) first.

## Context and requirements

Mud makes the route with the fewest steps more expensive than a longer detour. The algorithm is Dijkstra with a min priority queue and lazy deletion: push duplicates and skip stale entries. The queue is a plain array kept sorted by `(d, insertion sequence)` (no heap), so the trace is deterministic.

**Cost model (a deliberate deviation, see plan.md):** a step between two cells costs the average of their terrain, `(cost[a] + cost[b]) / 2`. Open ground is 1 and mud is 5, so a step costs 1 on open ground, 3 onto or off mud, and 5 inside mud. Every value is an integer. Under the report's "pay on entering" model, a cell's first push is always optimal, so stale entries and improvements could never happen.

The page uses `GridBoard` (mud comes through the `terrain-mud` class from phase 1) and `ChipList` for the queue.

## Files (owned; create all)

- `src/lib/algo-engine/dijkstra-grid.js`, `src/lib/algo-engine/dijkstra-grid.test.js`
- `src/lib/lessons/dijkstra-grid/copy.en.js`
- `src/routes/graphs/dijkstra-grid/+page.svelte`, `src/routes/graphs/dijkstra-grid/page.test.js`

Import read-only from `$lib/algo-engine/graph.js`: `neighbors`, `bfsGridTrace`, and the `Grid` typedef. `graph.js` itself is not edited.

## Engine: exports and frame

- `MUD_COST = 5`, `dijkstraPseudocode`
- `stepCost(cost, a, b)`
- `pathCost(path, cost)`: the sum of step costs, 0 for a single cell
- `dijkstraGridTrace(grid: WeightedGrid)`
- `randomTerrain(rows, cols, wallDensity, mudDensity, keep, rand)` → `{walls: Set<number>, cost: number[]}`: cells in `keep` stay open with cost 1, and costs are only ever 1 or 5
- `/** @typedef {Grid & {cost: number[]}} WeightedGrid */`

```js
/**
 * @typedef {object} DijkstraFrame
 * @property {'start'|'pop'|'stale'|'relax'|'found'|'no-path'} kind
 * @property {number} current   Cell just popped, -1 when none.
 * @property {number} popped    d of the popped entry, -1 when none.
 * @property {number} touched   Neighbor just relaxed, -1 when none.
 * @property {number[]} dist    Best known cost per cell, -1 unknown.
 * @property {number[]} settled Cells finalised, in pop order.
 * @property {[number, number][]} pq  [cell, d] pairs, cheapest first.
 * @property {number[]} path
 * @property {boolean} improved On 'relax': it lowered an already known dist.
 * @property {number[]} lines
 * @property {number} relaxations  Running total.
 * @property {number} maxQueue     Largest pq length so far.
 */
```

**Pseudocode** (copy verbatim). This is the report's array with one change: line 6 states the step cost of the model above, so the pseudocode never disagrees with the numbers on screen.
```js
['dist[*] = infinity; dist[start] = 0; pq = [(0, start)]', 'while pq is not empty:',
 '  (d, cell) = pq.popMin()', '  if d > dist[cell]: continue                 // stale entry',
 '  if cell == goal: walk parents back; stop', '  for each open neighbor of cell:',
 '    nd = d + step(cell, neighbor)     // average of the two cells’ costs', '    if nd < dist[neighbor]:',
 '      dist[neighbor] = nd; parent[neighbor] = cell; pq.push((nd, neighbor))', 'no path — goal is walled off']
```

Frames and lines:
- `start` [0]
- `pop` [1,2,3]: add to `settled`
- `stale` [1,2,3]
- `found` [4]
- `relax` [5,6,7,8] per improving neighbor, in `neighbors()` order (up, right, down, left), skipping walls: `relaxations++`, and set `improved` when the dist was already known
- `no-path` [1,9]

Stop when the goal is **popped**, not when it is pushed.

## Copy (`copy.en.js`)

- slug `dijkstra-grid`, topic `graphs`, level `Intermediate`, title `Dijkstra’s algorithm on a grid`.
- intro: "When some steps cost more than others, the path with the fewest steps is no longer the cheapest. Dijkstra’s algorithm always expands the cheapest known cell next, so when it reaches the goal it has found the cheapest route."
- instruction: "Paint walls and mud, move the start and goal, then play. A step costs the average of the two cells it joins: 1 on open ground, 5 inside mud, 3 onto or off it. Numbers show the cheapest known cost to reach each cell."
- takeaways:
  1. "The priority queue replaces BFS’s queue: the cell with the smallest known cost always comes out next."
  2. "A cell is final only when it is popped, not when it is first reached. A cheaper route may still turn up in between; watch the goal’s cost drop before it is settled."
  3. "Instead of lowering an entry already in the queue, this version pushes a new one and skips the stale entry when it surfaces."
  4. "With every cost equal, Dijkstra explores in the same rings as BFS. Negative costs break it; they need Bellman–Ford."
- `complexityHead: ['Resource', 'Cost', 'Why']`, complexity:
  - `['Time', 'O((V + E) log V)', 'With a binary heap, each push and pop costs O(log V), and there is at most one push per relaxation.']`
  - `['Memory', 'O(V + E)', 'The queue can hold one entry per relaxation, stale ones included.']`
- nextTeaser: "Next up: A* search, which aims Dijkstra at the goal with a distance estimate."
- Labels:
  - `tools: {wall: 'Walls', mud: 'Mud', start: 'Move start', goal: 'Move goal'}`
  - `randomTerrain: 'Random terrain'`, `clearTerrain: 'Clear'`
  - `pqLabel: 'Priority queue (cheapest first)'`, `pqEmpty: 'empty'`, `pqChip(cell, cols, d)` → `(r,c) ${d}`
  - `settledLabel: 'Settled'`, `relaxLabel: 'Relaxations'`, `costLabel: 'Path cost'`
  - `compareTitle: 'Same grid, fewest steps'`, `bfsRoute(steps, cost)` → `BFS route: ${steps} steps, cost ${cost}`, `dijkstraRoute(steps, cost)` → `Dijkstra route: ${steps} steps, cost ${cost}`
  - `legend`: the BFS set, with frontier renamed "In queue", visited renamed "Settled", and `mud: 'Mud (cost 5)'` added
  - `cellLabel(cell, cols, kind, mud, dist)` → `Row r, column c[, kind][, mud, cost 5][, best cost d]`
  - `edits`: the BFS ones plus `mudAdded(at)` → `Mud added at ${at}.` and `mudRemoved(at)`
  - `blockedCell`, `coord`, and `gridLabel` have the same text as BFS
- `describe(f, cols)`: these strings are fixed, because the tests use them:
  - found: `Reached the goal at cost ${d}. The route has ${steps} steps.`
  - stale: `... a stale entry, skip it.`
  - no-path: `The queue is empty and the goal was never reached — walls cut it off.`

## Page: controls and visual encoding

- Defaults: 10×16, no walls, start (4,2), goal (4,13), mud in rows 2-7 × columns 6-9. Verified: Dijkstra costs 17 over 17 steps, and the BFS route costs 27 over 11 steps.
- State: `walls` (`$state.raw` Set) and `cost` (`$state.raw` number[]). Edits assign fresh copies.
- `onPaintStart`:
  - `wall` tool: paint on or off
  - `mud` tool: paint mud on or off; mud never goes on a wall, the start, or the goal
  - start or goal tool: `edit`, then return `null`
  A wall placed on mud resets that cell's cost to 1. Keyboard `edit` confirms each change with the `edits` messages.
- `cellLook` follows the DFS page's classes, with these differences:
  - mud adds ` terrain-mud` to whatever state class the cell has
  - the mark is `dist[cell]` when it is at least 0
  - the label passes `mud = cost[cell] === MUD_COST`
- Stats: Settled (`settled.length`), Relaxations, and Path cost (`—` until found). The compare panel shows `bfsRoute` and `dijkstraRoute`, both `$derived` from the grid state only; the BFS route cost comes from `pathCost(bfsPath, cost)`.
- `ChipList` shows `frame.pq` with `pqChip` labels. A chip is hot when its cell is `touched`.

## Tests

**Engine** (`dijkstra-grid.test.js`):
1. On 50 seeded random terrains (6×8), the final cost equals a Bellman–Ford reference written in the test file with the same `stepCost`.
2. With every cost at 1, the path cost equals the `bfsGridTrace` path length − 1.
3. On the default band grid, the costs are 17 (Dijkstra) and 27 (`pathCost` of the BFS path).
4. On the 3×3 grid `cost = [1,5,1, 1,1,1, 1,1,1]` with start 0 and goal 2, the goal is first pushed with d 6, and `found` reports 4 with path `[0,3,4,5,2]`. So a relax of the goal with `improved === true` exists before `found`.
5. The band grid has at least one `stale` frame.
6. Paths are contiguous and wall-free.
7. A sealed goal gives `no-path`.
8. Across pops, the dist of a settled cell never changes.
9. `pq` is sorted by d in every frame.
10. `randomTerrain` never produces a cost outside {1, 5} and keeps the `keep` cells open.
11. Pseudocode coverage: the band grid plus a sealed grid cover every line.
12. Frames are not aliased.

**Page** (`page.test.js`):
1. The last step shows `Reached the goal at cost 17`, and the compare panel shows `BFS route: 11 steps, cost 27`.
2. With the `mud` tool, `keyActivate(button('Row 0, column 0'))` gives `button('Row 0, column 0, mud, cost 5')` and `Mud added at (0,0).`
3. With the wall tool on mud cell (4,6), the result is `button('Row 4, column 6, Wall')`.
4. After the last step, `button('Row 4, column 2, Start, best cost 0')` exists.
5. Sealing (3,13), (5,13), (4,12), and (4,14), then taking the last step, shows `walls cut it off`.

## Acceptance

All tests pass, and the scoped validation in conventions section 5 is clean. Report whether the `terrain-mud` hatch stays legible over `bg-state-visited` and `bg-state-path`; this is unverified without a browser, so say so.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Stopping on push instead of pop | M x H | Engine test 4 pins the improvement before `found`. |
| Hatch is only visual | H x M | The aria-label carries "mud, cost 5", and the legend names it. |
| A sorted-array queue costs O(n) per push | L x L | 160 cells at most. The complexity row states the heap bound. |

## Rollback

Delete the five owned files.
