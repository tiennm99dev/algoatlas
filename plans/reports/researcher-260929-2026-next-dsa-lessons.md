# Next DSA lessons for AlgoAtlas: candidates, ranked batch, design sheets

Date: 2026-09-29. Scope: research only, no repo changes. Repo state read: engines (sorting, searching, graph), player, four shared components, registry, site copy, three lesson pages, page test suite, palette.

## Outcome

Ship six lessons in this rank order: merge sort and quicksort, lower and upper bound, hash table, DFS on the grid, Dijkstra on the grid, binary search tree. Add one new topic, `structures` ("Data structures"). Do three small shared-component extractions first (bar chart, chip list, grid board) so the new pages do not copy-paste 250 lines each. No new palette color is required; weighted terrain uses a hatch overlay instead. The player, `step-controls`, `code-panel`, `segmented-control`, and `lesson-layout` need no change.

## 1. Candidate list (11)

Fit ratings: Clean = fits with existing patterns; Strain = needs a small shared extension; Risky = new visual primitive.

| # | Topic / slug | Level | Hook | Frame-model fit |
|---|---|---|---|---|
| 1 | sorting / merge-quick-sort | Intermediate | Same array, two ways past O(n²): divide then merge, or partition around a pivot. | Strain. Recursion flattens to a linear trace if each frame snapshots the call stack; needs an aux buffer row and a stack panel. |
| 2 | searching / lower-upper-bound | Intermediate | Binary search that answers "where would this go?" and counts duplicates as `upper - lower`. | Clean. Near-copy of the binary-search page. |
| 3 | structures / hash-table | Intermediate | Watch keys land in buckets, collide, and get rehashed when the table grows. | Clean. State is `number[][]`; render as rows. |
| 4 | graphs / dfs-grid | Intermediate | Same maze as BFS, but the path found is not the shortest one. | Clean once the grid is extracted; reuses `bfsGridTrace` for the comparison. |
| 5 | graphs / dijkstra-grid | Intermediate | Mud costs 5: the shortest route in steps is no longer the cheapest. | Strain. Needs per-cell cost and a priority-queue panel. |
| 6 | structures / bst | Intermediate | Insert in sorted order and the tree degenerates into a list; delete has three cases. | Risky-ish. Needs a tree SVG layout, but the layout is a pure function of the frame. |
| 7 | structures / stack-queue | Beginner | Balanced brackets with a stack; queue shown as BFS's frontier. | Clean, but low novelty (BFS already shows a queue). |
| 8 | structures / binary-heap | Intermediate | Sift-up and sift-down on an array-as-tree; heapsort for free. | Strain. Two views of one array (bars plus tree). Best after BST provides the tree view. |
| 9 | structures / linked-list | Beginner | Pointer rewiring in insert, delete, reverse. | Risky. Arrows and pointer identity add layout cost for little algorithmic depth. |
| 10 | trees / traversals | Beginner | Pre, in, post, level order on one tree. | Clean after BST exists; cheap follow-up lesson reusing the tree view. |
| 11 | dynamic-programming / lcs-table | Advanced | Fill a 2D table cell by cell, then trace back. | Clean (grid of numbers), but opens a topic with no prior lessons. |

Rejected for this batch: 7 (low value per effort), 8 and 10 (depend on the tree view from 6), 9 (poor cost/benefit), 11 (new topic with no on-ramp).

## 2. Ranked batch for the next release

Ranking weighs learner value, promise made by an existing `nextTeaser`, reuse, risk, and topic balance.

1. **sorting/merge-quick-sort** (Intermediate). Highest learner value; teased by the sorting lesson. One page with an algorithm toggle mirrors the existing bubble/insertion page and lets the totals panel compare them. Medium risk because of the recursion display.
2. **searching/lower-upper-bound** (Intermediate). Teased. Lowest risk; copy the binary-search page structure. Good first phase to validate the workflow.
3. **structures/hash-table** (Intermediate). Closes the "DSA promises data structures, has none" gap with a low-risk visual (rows of chips) and no dependency on shared refactors.
4. **graphs/dfs-grid** (Intermediate). Teased. Cheap once the grid is a component. The "not shortest" comparison against BFS is the lesson.
5. **graphs/dijkstra-grid** (Intermediate). Teased. Needs weights; land it after DFS so the extracted grid has already been used twice.
6. **structures/bst** (Intermediate). The classic data structure. Highest visual risk, so it is last; it is the cut line if capacity runs short (drop it, nothing else depends on it).

Balance after release: sorting 2, searching 2, graphs 3, structures 2 (was 1/1/1/0). Levels: existing lessons are all Beginner, so the new ones should be Intermediate; Beginner "stack-queue" is the obvious filler later.

**New topic: `structures`.** Title "Data structures". Hub blurb: "Store data so that adding, finding, and removing stay fast as it grows." Insert in `topicOrder` as `['sorting', 'searching', 'structures', 'graphs']` (graphs last because Dijkstra uses a priority queue, and hash/BST are gentler). Do not create `trees` yet: with one tree lesson it would be a one-lesson hub. Trade-off: if three or more tree lessons follow (heap, traversals), moving BST to `/trees/` breaks a URL on a static site with no redirects. Open question 1 asks the owner to decide. The hub grid is `md:grid-cols-3`; four topics wrap 3+1, so change it to `lg:grid-cols-4` or accept the wrap.

Teasers: each shipped lesson's `nextTeaser` must be rewritten (merge-quick, lower/upper, DFS, Dijkstra teasers currently promise work in this batch). `registry.test.js` asserts `lessonsByTopic('sorting')` equals only `bubble-insertion-sort`; update it. The registry array must stay grouped by topic in `topicOrder` order.

## 3. Design sheets

Common rules for every sheet: engine functions are pure, DOM-free, take an injectable `rand` where randomness exists, return immutable frames (copy arrays per frame, as the existing engines do), and export a `*Pseudocode` array. Every page starts from a fixed initial input so prerendered HTML equals hydrated HTML (existing convention). Cap input sizes so a trace stays under roughly 400 frames.

### 3.1 sorting/merge-quick-sort

**Files:** `algo-engine/sorting.js` (add `mergeSortTrace`, `quickSortTrace`, two pseudocode arrays; reuse `toItems`, `makeArray`), `lessons/merge-quick-sort/copy.en.js`, `routes/sorting/merge-quick-sort/+page.svelte`. Toggle Algorithm: merge / quick; presets reuse `makeArray` (random, nearly-sorted, reversed, few-unique); size 6 to 24; quick adds a Pivot control: last / median of three / random.

**Frame typedef** (`SortFrame` plus optional fields, so `bar-chart` and the totals panel work unchanged):
- `kind`, `items`, `focus`, `sorted` (final positions), `lines`, `comparisons`, `swaps` (for merge this counts writes to the main array, label it "Writes").
- `range: [lo, hi] | null`: the subarray of the call being worked on; everything outside is dimmed.
- `stack: [number, number][]`: the ranges of the active recursion calls, outermost first (merge: calls with lo < hi; quick: current call plus pending right halves, so the panel shows what is still owed).
- Merge only: `aux: Item[] | null` (copy of the range taken at merge start), `i`, `j`, `k`, `runs: [number, number][]` (finished sorted-but-not-final runs).
- Quick only: `pivot: number` (index, -1 when none), `i`, `j` (Lomuto pointers).
- `depth: number` and a final `maxDepth` shown as a counter.

**Merge pseudocode (top-down, Sedgewick 4e Alg. 2.4 merge with aux copy; CLRS MERGE-SORT recursion):**
```
'mergeSort(a, lo, hi):'
'  if lo >= hi: return'
'  mid = floor((lo + hi) / 2)'
'  mergeSort(a, lo, mid); mergeSort(a, mid + 1, hi)'
'  aux = copy of a[lo..hi]; i = lo; j = mid + 1'
'  for k = lo to hi:'
'    if i > mid: a[k] = aux[j++]            // left run used up'
'    else if j > hi: a[k] = aux[i++]        // right run used up'
'    else if aux[j] < aux[i]: a[k] = aux[j++]   // strict: left wins ties'
'    else: a[k] = aux[i++]'
'done: array is sorted'
```
Frame kinds: `start`, `split` (lines 1-3, push range), `copy` (line 4), `take` (lines 5-8, one per k; `focus=[k]`, aux heads `i`,`j`), `merged` (pop range, add to `runs`), `done`. Single-element calls emit no frames (implicitly sorted); say so in narration.

**Quick pseudocode (Lomuto, CLRS 7.1, with CLRS RANDOMIZED-PARTITION style pivot swap):**
```
'quickSort(a, lo, hi):'
'  if lo >= hi: return'
'  swap chosen pivot into a[hi]; pivot = a[hi]'
'  i = lo - 1'
'  for j = lo to hi - 1:'
'    if a[j] <= pivot: i = i + 1; swap(a[i], a[j])'
'  swap(a[i + 1], a[hi])        // pivot lands in its final slot'
'  quickSort(a, lo, i); quickSort(a, i + 2, hi)'
'done: array is sorted'
```
Frame kinds: `start`, `call`, `pivot` (after any pre-swap), `scan` (compare a[j] to pivot, `swapped` = moves into the low side), `swap` (only when i !== j), `place` (pivot final, add to `sorted`), `done`.

**Visual encoding:** existing palette only. Comparing = `state-compare`; swap/write = `state-swap`; quick pivot = `state-active`; merge aux heads = `state-active` outline on the aux row; finished merge runs = `state-visited` (sorted within run, not final); quick final positions and everything at `done` = `state-sorted`; out-of-range bars at reduced opacity (CSS only). Stack panel = chip list of `[lo-hi]`. Counters: Comparisons, Writes/Swaps, Depth (current and max). Totals panel: merge and quick on the current array, same pattern as the bubble/insertion page.

**Pitfalls:**
- Merge stability: take from the left on ties (`aux[j] < aux[i]` strict). Show a few-unique preset and label equal values with the original id to prove stability; quick is not stable (Lomuto swaps jump over equals).
- Merge write count is exactly n per merge level; assert `writes === n * ceil(log2 n)` only for power-of-two n; otherwise assert an upper bound.
- Lomuto with `<=` and last-element pivot is quadratic on sorted, reversed, and all-equal input: recursion depth reaches n. Keep this as the teaching moment via the presets; median-of-three fixes sorted input but not all-equal input (say so in a takeaway; three-way partition is out of scope).
- Random pivot must come from an injected `rand`; the page passes `Math.random` only on user-triggered rebuilds, and the initial trace uses the deterministic "last" rule.
- Do not count `swap(a[i], a[i])` as a swap; skip the frame.
- Depth is bounded by n at n <= 24, so no smaller-half-first optimisation is needed; mention it in a takeaway only.

**Engine tests:** both sort correctly against `Array.prototype.sort` for empty, one, two, sorted, reversed, all-equal, and 200 random arrays; merge is stable (ids of equals stay ordered); quick is a permutation with `sorted` covering all indices at `done`; every frame's `items` is a permutation of the input ids; `stack` is empty on first and last frame and depth never exceeds n; quick on sorted input with rule "last" has comparisons n(n-1)/2 and median-of-three has fewer; merge comparisons never exceed n*ceil(log2 n); frames are not aliased (mutating one does not change the next); `lines` indexes are within the pseudocode array. Page tests: toggle switches pseudocode and stack panel; last step shows "Sorted"; pivot control is disabled or hidden for merge.

### 3.2 searching/lower-upper-bound

**Files:** `algo-engine/searching.js` (add `boundTrace(a, x, variant)`, `boundPseudocode`, `makeSortedArrayWithDuplicates`), copy, page under `routes/searching/lower-upper-bound/`. Controls: Variant segmented control (lower / upper), target number field (same commit-on-change pattern as binary search: keep last valid), Size, New array, "Pick present / absent". No drive mode (out of scope for this lesson; it would double the page).

**Definitions (half-open window [lo, hi)):** lower_bound(x) = first index i with a[i] >= x, or n if none. upper_bound(x) = first index i with a[i] > x, or n. Number of copies of x = upper - lower. Both are the same loop with a different predicate.

**Frame typedef:** `kind: 'start'|'probe'|'go-right'|'go-left'|'done'`, `variant`, `lo`, `hi` (exclusive), `mid` (-1 when none), `answer` (-1 until `done`), `lines`, `comparisons`. The page also computes both variants' final answers to show the equal range regardless of the toggle.

**Pseudocode (predicate `<` for lower, `<=` for upper; two arrays differing only in line 3):**
```
'lo = 0; hi = n            // half-open window [lo, hi)'
'while lo < hi:'
'  mid = lo + floor((hi - lo) / 2)'
'  if a[mid] < x:          // upper bound: a[mid] <= x'
'    lo = mid + 1          // answer is right of mid'
'  else: hi = mid          // mid could still be the answer'
'return lo                 // first index where the test fails'
```

**Visual encoding:** cells left of `lo` (test held) = `state-visited`; cells at or right of `hi` (test failed) = neutral slate; window cells white; `mid` = `state-active`; at `done` the answer is drawn as a caret in the gap before index `answer` (including gap n at the far right), and the equal range `[lower, upper)` is `state-sorted`. The result panel lists lower, upper, and count. Counters: comparisons, plus `ceil(log2(n+1))` as the ceiling.

**Pitfalls:** off-by-one is the lesson, so narration states the invariant each step ("everything left of lo is < x"). Target absent, below all, above all (answer 0 and n), empty array, and a run of equal values touching either end. `hi = mid` versus `mid - 1` must not be mixed with the closed-window binary search: label the window "half-open" in the legend. There is no early exit on a hit, so the cost is ceil(log2(n+1)) every time; say so. JS has no overflow, so `lo + floor((hi - lo) / 2)` is only a mention.

**Engine tests:** exhaustive check over all sorted arrays up to length 5 drawn from a small alphabet with duplicates, targets from below-min to above-max: `lower` equals the first index with `a[i] >= x` by linear scan, `upper` equals the first with `a[i] > x`, and `upper - lower === count(x)`; empty array returns 0; `lo <= hi` in every frame; last frame has `kind: 'done'` and `answer` set; comparisons never exceed `ceil(log2(n+1))`; `mid` always in [lo, hi). Page tests: switching variant reloads pseudocode text ("<=" appears for upper) and the count panel; equal range highlighted on last step.

### 3.3 structures/hash-table (chaining)

**Files:** new `algo-engine/hash-table.js`, copy, `routes/structures/hash-table/+page.svelte`. Controls: Hash function segmented control (division `k mod m` / multiplication), Key set preset (random, sequential, multiples of 8 as the adversarial case, plus a text field of comma-separated integers), Insert all then a Search field (search a key present or absent), New keys. Keys are integers 0 to 999 (negatives rejected in the field, see pitfalls).

**Frame typedef:** `kind: 'start'|'hash'|'walk'|'append'|'update'|'grow'|'rehash'|'grown'|'search-hit'|'search-miss'|'done'`, `buckets: number[][]` (snapshot of chains), `m`, `n` (distinct keys), `key` (key in flight, -1), `bucket` (focus bucket, -1), `pos` (index within chain being compared, -1), `moved` (key moved during a rehash), `lines`, counters `comparisons`, `collisions` (insert into a non-empty bucket), and derived `load = n/m`, `longest` (longest chain).

**Pseudocode (CLRS 11.2 chaining, plus growth):**
```
'insert(key):'
'  b = hash(key) mod m'
'  walk chain b: if an entry equals key, update it and stop'
'  append key to chain b; n = n + 1'
'  if n / m > 0.75: grow()'
'grow(): m = larger size; re-insert every key with the new hash'
'search(key): b = hash(key); walk chain b; found or not found'
```
Line indices map to the frame kinds above (`hash`=1, `walk`=2, `append`=3, `grow`/`rehash`=4-5, search=6).

**Hash functions (CLRS 11.3):** division `h(k) = k mod m` with m prime and not near a power of two (§11.3.1); multiplication `h(k) = floor(m * frac(k * A))` with `A = (sqrt(5) - 1) / 2` and m a power of two (§11.3.2). Growth schedules therefore differ: division 5, 11, 23, 47; multiplication 4, 8, 16, 32. Do not double a prime-sized table into a power of two under division, which reintroduces the bad case.

**Visual encoding:** one row per bucket with an index label, chain as chips left to right. Walking a chain: compared chip = `state-compare`; hit = `state-sorted`; freshly appended chip = `state-active`; chips moving during rehash = `state-frontier`. Chains longer than 8 collapse to "+n". No new color. Counters: comparisons, collisions, load factor, longest chain, table size m.

**Pitfalls:** JS `%` is negative for negative keys, so either reject negatives in the field or use `((k % m) + m) % m`; choose rejection (simpler, integers only). Duplicate keys update rather than append. Check the load threshold after the insert (as Java's HashMap does) and state it. Rehash iterates buckets in index order, each chain front to back, so tests are deterministic. Multiples of 8 under division with m=4 or 8 pile into one bucket; that is the demonstration, and after the grow to a prime the chains should spread. Fractional part with floats: use `(k * A) % 1`, which is fine for k < 1000; add a test that every result is in [0, m).

**Engine tests:** after any sequence, each key lives in exactly the bucket `hash(key)`, and total chain length equals distinct key count; duplicates do not raise `n`; final `load <= 0.75`; a grow preserves the key multiset and changes `m` per the schedule; search miss costs `chain length` comparisons, hit costs `position + 1`; multiples of 8 under division without growth have `longest === n`; `hash` results are always in [0, m) for both functions; frame `buckets` arrays are not aliased between frames. Page tests: insert preset then last step shows the table size grew; switching hash function reloads the trace and pseudocode.

### 3.4 graphs/dfs-grid

**Files:** `algo-engine/graph.js` (add `dfsGridTrace`, `dfsPseudocode`; reuse `neighbors`, `randomWalls`, `bfsGridTrace`), copy, `routes/graphs/dfs-grid/+page.svelte`. Controls identical to BFS (tools wall/start/goal, random maze, clear), delivered by the extracted grid board.

**Algorithm:** iterative DFS with an explicit stack of `{cell, from}` pairs, marking a cell visited when it is popped. Push neighbors in reverse of the BFS order so "up" is popped first; this is CLRS 22.3 DFS made iterative (Wikipedia "Depth-first search", stack pseudocode).

**Frame typedef:** `kind: 'start'|'pop'|'push'|'skip'|'found'|'no-path'`, `current`, `touched`, `stack: number[]` (cells, top last), `order: number[]` (visit order per cell, -1 unvisited; drawn in each cell), `path: number[]`, `lines`, counter `visited`.

**Pseudocode:**
```
'stack = [(start, none)]'
'while stack is not empty:'
'  (cell, from) = stack.pop()'
'  if cell is already visited: continue      // stale duplicate'
'  visited.add(cell); parent[cell] = from'
'  if cell == goal: walk parents back; stop'
'  for each neighbor of cell (left, down, right, up):'
'    if neighbor is open and not visited: stack.push((neighbor, cell))'
'no path — goal is walled off'
```

**Visual encoding:** same as BFS: stack cells `state-frontier`, current `state-active`, visited `state-visited`, path `state-path` with the amber ring; each cell shows its visit number instead of distance. Extra counters: DFS path length versus the BFS shortest length (computed from `bfsGridTrace(...).at(-1).path`), and cells visited. The stack panel is the chip list, top first.

**Pitfalls:** recording the parent at push time instead of pop time gives wrong paths (a cell can be pushed by several neighbors); storing `from` in the stack entry avoids it. Marking visited at push time changes the traversal order and hides the "stale duplicate" skip; choose mark-on-pop and show `skip` frames. Duplicate entries mean the stack can exceed the number of cells; the chip list truncates like BFS's. DFS path can be far longer than shortest, on an open grid too; do not describe it as "worse" in general.

**Engine tests:** finds a path iff BFS finds one (random walls, seeded `rand`); every returned path is contiguous (each step in `neighbors`) and avoids walls; path length >= BFS length; on a 1xN corridor DFS equals BFS; start equals goal is found at once; sealed goal yields `no-path`; `order` values are unique and increasing; last frame has an empty stack unless found.

### 3.5 graphs/dijkstra-grid

**Files:** `algo-engine/graph.js` (add `dijkstraGridTrace`, `dijkstraPseudocode`, `randomTerrain`), copy, page under `routes/graphs/dijkstra-grid/`. The `Grid` typedef gains an optional `cost: number[]` (cost to enter a cell, default 1, mud = 5; walls stay in `walls`). Tools: wall, mud, start, goal. Buttons: random terrain, clear. `bfsGridTrace` ignores `cost` and stays untouched.

**Algorithm:** Dijkstra with a min priority queue and lazy deletion (push duplicates, skip stale). CLRS 24.3 uses decrease-key; lazy deletion (used by most implementations and Sedgewick's lazy variant) avoids an indexed heap and is visible as a teachable "stale entry" frame. Keep the queue as an array sorted by `(d, insertion order)`; do not build a heap, because the trace only needs ordering.

**Frame typedef:** `kind: 'start'|'pop'|'stale'|'relax'|'found'|'no-path'`, `current`, `touched`, `dist: number[]` (-1 unknown), `settled: number[]` (cells finalised), `pq: [cell, d][]` (min first), `path`, `improved` (a relax that lowered an existing dist), `lines`, counters `settled` count, `relaxations`, `maxQueue`.

**Pseudocode:**
```
'dist[*] = infinity; dist[start] = 0; pq = [(0, start)]'
'while pq is not empty:'
'  (d, cell) = pq.popMin()'
'  if d > dist[cell]: continue                 // stale entry'
'  if cell == goal: walk parents back; stop'
'  for each open neighbor of cell:'
'    nd = d + cost[neighbor]'
'    if nd < dist[neighbor]:'
'      dist[neighbor] = nd; parent[neighbor] = cell; pq.push((nd, neighbor))'
'no path — goal is walled off'
```

**Visual encoding:** BFS encoding (frontier = in pq, active = current, visited = settled, path). Cell number = current best distance. Mud is drawn as a diagonal hatch overlay (`background-image: repeating-linear-gradient(...)`) on top of whichever state color the cell has, so terrain and state stay readable together and no new palette color is needed (mud tinted brown would clash with `state-path` amber). Legend adds "Mud (cost 5)". Counters: settled, relaxations, path cost. Comparison panel: "BFS route would cost N" (sum of `cost` along the BFS path) versus Dijkstra's cost; this is the payoff.

**Pitfalls:** stop when the goal is popped, not when it is first pushed (pushing gives a non-optimal cost; that is exactly the BFS shortcut). Costs must be >= 1; `randomTerrain` and the mud tool never produce zero or negative. Node-cost model: cost is paid on entering a cell and the start cost is not counted; say it in the instruction text. Ties: sort by `(d, insertion order)` for a deterministic trace. Aria labels must include the cost ("mud, cost 5") because the hatch is visual only.

**Engine tests:** final distance equals an independent reference (Bellman-Ford in the test file) on seeded random grids with mud and walls; with all costs 1 the path cost equals `bfsGridTrace` path length minus one; a hand-built grid where the short mud route (fewer cells) is costlier than a long open route, so BFS path cost > Dijkstra path cost; goal is not settled when first pushed (a frame with the goal in `pq` and kind not `found` exists in that grid); stale entries occur (`stale` frame exists) on a grid with a relaxation; path contiguous and wall-free; sealed goal gives `no-path`; `dist` of settled cells never decreases across pops.

### 3.6 structures/bst

**Files:** new `algo-engine/bst.js` (`bstTrace(ops)`, `bstPseudocode`, `layoutTree(frame)` returning `{x: inorder rank, y: depth}` per node), copy, `routes/structures/bst/+page.svelte`. Operations are an appended log: Insert, Search, Delete, each with a number field and button, Undo last, Reset, Preset (balanced order, sorted order, random). After each new op the page seeks the player to that op's first frame (`player.load` then `player.seek`). Cap the tree at 15 nodes.

**Frame typedef:** `kind: 'start'|'visit'|'go-left'|'go-right'|'insert'|'found'|'missing'|'dup'|'successor'|'relink'|'remove'|'done'`, `opIndex`, `op: {type, key}`, `nodes: {key, left, right}[]` (children as indices, -1 none; freed slots marked with `key: null`), `root`, `current`, `path: number[]` (nodes visited by this op), `succ` (successor node during a two-child delete), `lines`, counters `comparisons`, `height`, `size`.

**Pseudocode (CLRS 12.2 and 12.3; Hibbard deletion in Sedgewick 3.2):**
```
'search / insert: node = root'
'  while node exists:'
'    if key == node.key: found (insert: duplicate, stop)'
'    node = key < node.key ? node.left : node.right'
'  insert: attach a new leaf where the walk fell off; search: not found'
'delete: find the node, then:'
'  0 or 1 child: replace the node by its child (or nothing)'
'  2 children: copy the smallest key of the right subtree here, delete that node'
```

**Visual encoding:** SVG, x from in-order rank, y from depth, viewBox computed from the node count so it scales. Node compared = `state-compare`; path walked = `state-visited`; found = `state-sorted`; newly inserted = `state-active`; node being removed = `state-swap`; in-order successor = `state-frontier`. Counters: comparisons, height, size, plus a "perfectly balanced height would be N" line for the sorted-insert takeaway.

**Pitfalls:** duplicate insert is ignored, and the narration says so. Two-child delete: successor is the leftmost node of the right subtree, and the successor's right child must be re-linked to its parent (the classic bug); deleting the root; deleting an absent key; deleting the only node. Keep a slot-stable `nodes` array so frames keep stable indices for SVG keys. Sorted insertion gives height n: expected, not an error.

**Engine tests:** in-order traversal of the final frame equals the sorted distinct keys after random op sequences (with a reference `Set`); BST invariant holds after every op; delete covers leaf, one child, two children, root, and absent key; search comparisons equal path length; `layoutTree` gives strictly increasing x by in-order rank and y equal to depth; `size` and `height` match a recomputation; frames are not aliased.

## 4. Shared-component extensions (do these first, in this order)

All three are refactors covered by the existing page tests for sorting, binary search, and BFS, which act as the safety net. Do them in one prep phase, before any lesson, because two lessons otherwise copy the same markup.

1. **`bar-chart.svelte`** (extract from the sorting page, about 40 lines). Props: `items`, `stateOf(i)`, `markerOf(i)`, optional `aux` (second bar row under the main row, for the merge buffer), optional `dimmed(i)`, `ariaLabel`, `speed`. Keeps `animate:flip` keyed by item id, which also animates merge writes. Needed by merge-quick-sort; bubble/insertion migrates onto it.
2. **`chip-list.svelte`** (extract the BFS queue panel). Props: `title`, `items: {label, hot?}[]`, `emptyText`, `limit = 18`. Serves the BFS queue, DFS stack, Dijkstra priority queue, and merge/quick call stack. This is the cheapest "recursion stack" panel; no depth-tree view is needed.
3. **`grid-board.svelte`** (extract pointer painting, keyboard navigation, the transposed narrow-screen drawing, and the axis labels from the BFS page; about 200 lines moves). Props: `rows`, `cols`, `cellState(cell)`, `cellLabel(cell)`, and callbacks for paint, edit, and move. This is the riskiest extraction, so make it first and rerun the nine BFS tests unchanged. Alternative of copying into two more pages is rejected on DRY grounds. Hatch/terrain styling comes through `cellState` returning an extra class string; no component change for weights.

No second pseudocode panel is required: merge and quick live on one page with a toggle, each with its own array, and `code-panel` already takes `lines` and `active`. No `player` or `step-controls` change.

Small non-component chores per lesson: `registry.js` imports and array order, `site.en.js` topic entry and `topicOrder`, `lesson-pages.test.js` imports and a `describe` block per lesson, README lesson table row, `registry.test.js` sorting slug list, and the four `nextTeaser` rewrites. Lessons touch disjoint files except these shared ones, so parallel implementation needs one owner for the shared list.

## 5. Reference notes (from memory of standard texts; not re-fetched this session)

- **Lomuto vs Hoare.** Lomuto partition (single forward pointer, pivot = last element, returns the pivot's final index) is CLRS 3rd/4th ed. Chapter 7.1 PARTITION. Hoare's original two-pointer scheme (pointers cross, returns a split point, pivot is not necessarily in final place) is CLRS Problem 7-1 and Hoare's 1961 paper "Algorithm 64: Quicksort". Chosen: Lomuto, because the pivot lands in its final slot, which the `sorted` encoding needs, and one pointer is easier to draw. Cost: about 3x more swaps than Hoare and quadratic behaviour on equal keys; note both in takeaways. Sedgewick's Algorithms 4e Alg. 2.5 is a Hoare-style scan that does place the pivot; it is the upgrade path if a later lesson wants three-way partitioning (Alg. 2.6).
- **Merge sort.** CLRS 2.3 (MERGE with sentinels) and Sedgewick 4e Alg. 2.4 (aux copy, no sentinels). Chosen: Sedgewick's aux-copy form, since sentinels are hard to draw and the copy is the visible buffer.
- **lower_bound / upper_bound.** C++ `std::lower_bound` and `std::upper_bound` (cppreference define them as the first element not less than, and the first element greater than, the value). Wikipedia "Binary search algorithm" section "Procedure for finding the leftmost element" (`L=0, R=n`, `if A[m] < T then L = m+1 else R = m`, return `L`) and "rightmost element" (`if A[m] > T then R = m else L = m+1`, that section returns `R - 1`, which is the last index of T; upper_bound is `R` itself). Sedgewick 4e `BinarySearch.rank` (count of keys strictly less) is lower_bound. Chosen: half-open `[lo, hi)`, the C++ form.
- **Hash tables.** CLRS Chapter 11: 11.2 chaining, 11.3.1 division method (prime m, not near a power of two), 11.3.2 multiplication method (`A ~ 0.618`, m a power of two). Load-factor threshold 0.75 follows Java `HashMap`.
- **DFS and Dijkstra.** CLRS 22.3 (DFS) and 24.3 (Dijkstra with decrease-key); Wikipedia "Dijkstra's algorithm" documents the priority-queue variant that inserts duplicates instead of decreasing keys. Sedgewick 4e §4.4 (`DijkstraSP`, indexed priority queue) is the eager form.
- **BST.** CLRS 12.2 (search, insert) and 12.3 (TREE-DELETE with TRANSPLANT, successor for two children); Sedgewick 4e §3.2 (Hibbard deletion, same successor idea).

## Limitations

- Citations are section-level, taken from memory of the standard texts; no page was fetched or line-checked online. Verify exact CLRS section and edition numbering before quoting them in learner copy.
- Frame counts and page performance were reasoned, not measured. The first implementation should log `trace.length` at the size caps and lower them if scrubbing is sluggish.
- No browser exists here, so layout of the tree SVG, the hatch overlay contrast, and the two-row bar chart is unverified; page tests in jsdom only cover behavior.
- Accessibility work per lesson (cell labels, live-region narration, keyboard operation) follows the existing pages but is not designed here; the BST tree and hash rows need their own aria label pattern.
- I did not review the prior review reports in `plans/reports/`, so recurring defects they flagged are not folded in.

## Unresolved questions

1. Keep BST in `structures`, or create `trees` now (URL-move cost later versus a one-lesson hub now)?
2. One merged lesson for merge and quick (recommended, matches the teaser and the bubble/insertion pattern) or two separate lessons (simpler pages, but doubles the copy and tests)?
3. Are the three teasers (merge/quick, lower/upper, DFS/Dijkstra) commitments to keep verbatim? Dijkstra ships a lesson after DFS, so the DFS teaser needs "and Dijkstra" text only until Dijkstra lands.
4. Should BST be cut from this batch to keep it at five? It is the last item and independent, so cutting it costs nothing else.
