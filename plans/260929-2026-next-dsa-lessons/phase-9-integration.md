# Phase 9: Integration (registry, teasers, README, CHANGELOG, full gate)

Runs alone, after phases 3-8 report DONE or DONE_WITH_CONCERNS. Effort 1.5h. If phase 8 (BST) did not land, skip every BST item below.

## Context

Lessons appear on hubs and in the nav only through `src/lib/lessons/registry.js:22` (`lessons`, grouped in topic order; see the comment at line 20). `registry.test.js:8` pins the sorting slugs. The existing teasers point at lessons that now exist:
- `bubble-insertion-sort/copy.en.js`: `nextTeaser` is the last field
- `binary-search/copy.en.js`: `nextTeaser` is the last field
- `bfs-grid/copy.en.js`: `nextTeaser` is the last field

The README lessons table and its Architecture section describe three lessons and four shared components.

## Files (owned)

Modify:
- `src/lib/lessons/registry.js`
- `src/lib/lessons/registry.test.js`
- `src/lib/lessons/bubble-insertion-sort/copy.en.js` (`nextTeaser` only)
- `src/lib/lessons/binary-search/copy.en.js` (`nextTeaser` only)
- `src/lib/lessons/bfs-grid/copy.en.js` (`nextTeaser` only)
- `README.md`
- `CHANGELOG.md`

Also read, but do not edit unless a concern from phases 3-8 requires it: every phase report in `plans/reports/`.

## Steps

1. **Triage concerns.** Read the phase 3-8 reports. Any requested shared-component change goes back to the controller as a question; do not fix it silently here.
2. **registry.js.** Import the six copies (`mergeQuickCopy`, `boundsCopy`, `hashCopy`, `bstCopy`, `dfsCopy`, `dijkstraCopy`). Set:
   `lessons = [sortCopy, mergeQuickCopy, binaryCopy, boundsCopy, hashCopy, bstCopy, bfsCopy, dfsCopy, dijkstraCopy]`
   Update the comment to `// Order: by topic (sorting → searching → structures → graphs), then by difficulty.`
3. **registry.test.js.**
   - Change the sorting expectation to `['bubble-insertion-sort', 'merge-quick-sort']`.
   - Add `lessonsByTopic('structures')` → `['hash-table', 'bst']`.
   - Add a test: `lessons.map((l) => l.topic)`, with consecutive duplicates removed, equals `t().topicOrder`. This makes the registry grouped and ordered. Import `t` from `$lib/i18n/index.js`.
   - Add a test: every lesson's `level` is `'Beginner'` or `'Intermediate'`.
4. **Teasers** (exact text):
   - bubble-insertion-sort: "Next up: merge sort and quicksort, two divide-and-conquer ways past O(n²) on the same array."
   - binary-search: "Next up: lower bound and upper bound, binary search for the first position that fits and a count of duplicates."
   - bfs-grid: "Next up: depth-first search on the same grid, then Dijkstra’s algorithm when some cells cost more to cross."
5. **README.md.**
   - Add six rows to the Lessons table in registry order. Topic cells: Sorting, Searching, Data structures, Graphs. Interaction texts:
     - merge-quick-sort: "Toggle merge sort / quicksort, pick array and pivot rule, watch the call stack and merge buffer, compare totals"
     - lower-upper-bound: "Pick lower or upper bound and a target, watch the half-open window, see the equal range and count"
     - hash-table: "Pick a hash function and key set, watch chains grow and the table rehash, search present or missing keys"
     - bst: "Insert, search, and delete keys, step through each walk, see sorted inserts degenerate into a list"
     - dfs-grid: "Paint walls, watch the stack dive, compare the DFS path with the BFS shortest path"
     - dijkstra-grid: "Paint walls and mud, watch the priority queue settle cells, compare costs with the BFS route"
   - Architecture: in "Shared UI", add `bar-chart.svelte` (bars with an optional buffer row), `chip-list.svelte` (queue/stack/log chips), `grid-board.svelte` (editable grid: pointer painting, keyboard navigation, transposed on phones), and the `terrain-mud` utility.
   - In "Adding a lesson", say that each lesson owns its engine module, and that page interaction tests live beside the route as `page.test.js` (no `+` prefix, so SvelteKit ignores them).
   - Reformat the table with `npx prettier --write README.md`.
6. **CHANGELOG.md.** `[Unreleased]` already has `### Fixed`, `### Changed`, and `### Added` sections. Append bullets to the existing sections, and do not add new headings:
   - `### Added`: the six lessons (one line each, named); the Data structures topic; the shared bar chart, chip list, and grid board components; colocated page tests.
   - `### Changed`: the BFS queue panel, BFS grid, and sorting bars now come from shared components (no behavior change); the home topics grid shows four columns on wide screens; lesson teasers point at the new lessons.
7. **Full gate.** Run it and fix failures in the owned files. For failures in lesson files, send them back to the controller with the failing output.

## Acceptance criteria

- `npm run lint && npm run format:check && npm run check && npm test && npm run build` passes.
- The build output has `index.html` for all nine lesson paths and all four hubs.
- The home page shows four topic cards with 2, 2, 2, and 3 lessons.
- `grep -c '^| ' README.md` counts the header, the separator, and nine lesson rows.
- In `lesson-pages.test.js`, the routing test `every registered lesson has a route` passes for all nine.
- No file outside the owned list changed in this phase.

## Tests

- `registry.test.js`: the updated sorting and structures slugs, and the new topic-order and level tests from step 3.
- The existing routing tests (`lesson-pages.test.js`) serve as integration: prerender entries, registered routes, and nav.

## Validation

```sh
npx vitest run src/lib/lessons/registry.test.js src/routes/lesson-pages.test.js
npm run lint && npm run format:check && npm run check && npm test && npm run build
ls build/sorting build/searching build/structures build/graphs
```

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A lesson phase left a lint, type, or format error that only the full gate catches | M x M | Each lesson ran scoped checks; this phase returns failures to the owner instead of patching another phase's file. |
| The registry order does not follow `topicOrder` | L x M | The new registry test in step 3. |
| CHANGELOG wording drifts from what shipped | L x L | Write the entries from the phase reports, not from the plan. |

## Rollback

Revert this commit. The lessons stay built but become unlisted: routes still prerender, but hubs and nav no longer link them.

## Docs impact

The README (lessons table, architecture) and the CHANGELOG are updated here. `RUNBOOK.md` does not change, because deploy and rollback are unchanged.
