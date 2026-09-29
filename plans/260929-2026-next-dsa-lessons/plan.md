---
title: "Six intermediate DSA lessons and a Data structures topic"
description: "Add merge/quick sort, lower/upper bound, hash table, DFS, Dijkstra, and BST lessons plus three shared visual components."
status: pending
priority: P2
effort: 24h
branch: main
tags: [lessons, svelte, algo-engine, shared-components, structures-topic]
created: 2026-09-29
---

# Six intermediate DSA lessons and a Data structures topic

**Status:** pending. **Source design:** `plans/reports/researcher-260929-2026-next-dsa-lessons.md` (accepted). Phase files copy everything an executor needs, so executors do not need to open the report.

**Outcome:** six new Intermediate lessons ship, registered and documented. They sit on three shared components that are extracted first with no behavior change, and on a fourth topic, `structures` ("Data structures").

## Phases

| # | Phase | Depends on | Runs | Effort | File |
|---|---|---|---|---|---|
| 1 | Shared components: bar-chart, chip-list, grid-board, mud hatch | none | alone | 3h | [phase-1-shared-components.md](phase-1-shared-components.md) |
| 2 | `structures` topic and four-topic hub grid | 1 | alone | 0.5h | [phase-2-structures-topic.md](phase-2-structures-topic.md) |
| 3 | sorting/merge-quick-sort | 2 | parallel with 4-8 | 4h | [phase-3-merge-quick-sort.md](phase-3-merge-quick-sort.md) |
| 4 | searching/lower-upper-bound | 2 | parallel with 3, 5-8 | 2.5h | [phase-4-lower-upper-bound.md](phase-4-lower-upper-bound.md) |
| 5 | structures/hash-table | 2 | parallel with 3-4, 6-8 | 3h | [phase-5-hash-table.md](phase-5-hash-table.md) |
| 6 | graphs/dfs-grid | 2 | parallel with 3-5, 7-8 | 2.5h | [phase-6-dfs-grid.md](phase-6-dfs-grid.md) |
| 7 | graphs/dijkstra-grid | 2 | parallel with 3-6, 8 | 3h | [phase-7-dijkstra-grid.md](phase-7-dijkstra-grid.md) |
| 8 | structures/bst | 2 | parallel with 3-7 | 4h | [phase-8-bst.md](phase-8-bst.md) |
| 9 | Integration: registry, teasers, README, CHANGELOG, full gate | 3-8 | alone | 1.5h | [phase-9-integration.md](phase-9-integration.md) |

Shared rules for phases 1 and 3-8 (component contracts, engine and page rules, test harness, scoped validation, report format) live in [lesson-conventions.md](lesson-conventions.md).

```
1 ──> 2 ──┬─> 3 ─┐
          ├─> 4 ─┤
          ├─> 5 ─┤
          ├─> 6 ─┼──> 9
          ├─> 7 ─┤
          └─> 8 ─┘
```

## File ownership

- Phase 1: `src/lib/components/{bar-chart,chip-list,grid-board}.svelte` (new), `src/lib/components/{bar-chart,chip-list}.test.js` (new), `src/routes/sorting/bubble-insertion-sort/+page.svelte`, `src/routes/graphs/bfs-grid/+page.svelte`, `src/app.css`. `src/routes/lesson-pages.test.js` stays unchanged in this phase; it is the safety net.
- Phase 2: `src/lib/i18n/site.en.js`, `src/routes/+page.svelte`, `src/routes/lesson-pages.test.js` (one expectation only; see the phase file).
- Each of phases 3-8: its own `src/lib/algo-engine/<name>.js` and `.test.js`, `src/lib/lessons/<slug>/copy.en.js`, `src/routes/<topic>/<slug>/+page.svelte` and `page.test.js`. Nothing else.
- Phase 9: `src/lib/lessons/registry.js`, `src/lib/lessons/registry.test.js`, the three existing `copy.en.js` files (`nextTeaser` only), `README.md`, `CHANGELOG.md`.

No two parallel phases share a file. Lesson phases import existing engines and components read-only.

## Decisions recorded in this plan

- **One engine file per lesson.** The report puts merge/quick in `sorting.js`, the bounds in `searching.js`, and DFS and Dijkstra in `graph.js`. Parallel ownership rules that out, so each lesson gets its own engine module and imports the old ones read-only. `graph.js` keeps its `Grid` typedef unchanged, and Dijkstra defines `WeightedGrid` locally.
- **Merge frames keep `items` a permutation.** A literal `a[k] = aux[j]` duplicates an item id mid-merge. That breaks Svelte's keyed `each` and also the report's own permutation test. Frames therefore draw slots `lo..k-1` as merged output and slots `k..hi` as the items still waiting in the buffer (phase 3).
- **Three hash functions, not two.** Under the report's prime schedule (5, 11, 23, 47), multiples of 8 never collide. Its adversarial demo and its test "multiples of 8 under division have longest === n" therefore cannot happen. Phase 5 adds `k mod m` with m a power of two (4, 8, 16, 32), which is the bad case CLRS warns about. Checked in a scratch run: 10 multiples of 8 give a longest chain of 5 with power-of-two m and 1 with prime m.
- **A Dijkstra step costs the average of its two cells** (1 on open ground, 5 through mud, 3 on the edge of mud). Under the report's "pay on entering" model, the first push of every cell is already optimal. No stale entry or improvement can ever happen, so three of the report's tests could never pass. Checked on the default grid in a scratch run: 2 stale pops, 4 improvements, Dijkstra cost 17 against a BFS route cost of 27. Pseudocode line 6 changes to match: `nd = d + step(cell, neighbor)`.
- **Phase 2 edits `lesson-pages.test.js`.** The site chrome test pins the nav to three topics (`lesson-pages.test.js:336-342`), so it fails once `structures` is added. Phase 2 runs alone, so this cannot conflict with other work.
- BST stays in `structures`; there is no `trees` topic yet (report section 2).

## Batch acceptance criteria

1. `npm run lint`, `npm run format:check`, `npm run check`, `npm test`, and `npm run build` all pass on the final tree.
2. The build output contains `index.html` for `sorting/merge-quick-sort/`, `searching/lower-upper-bound/`, `structures/hash-table/`, `structures/bst/`, `graphs/dfs-grid/`, `graphs/dijkstra-grid/`, and the `structures/` hub.
3. Every existing test in `lesson-pages.test.js` passes. Across the whole batch, its only diff is the phase 2 nav expectation.
4. Each new lesson has an engine test file with a pseudocode coverage test, and a colocated `page.test.js` containing the tests its phase lists.
5. `lessons` in `registry.js` is grouped in `topicOrder` order (`sorting, searching, structures, graphs`), and all six new lessons have `level: 'Intermediate'`.
6. No shared component was edited after phase 1. Any change a lesson needed appears as a concern in that phase's report.
7. The README lessons table has nine rows, and the CHANGELOG `[Unreleased]` section lists the new lessons, the new topic, and the new components.

## Rollback

Each phase is its own commit. Lesson commits revert independently, because a lesson is self-contained until phase 9 registers it. Reverting phase 1 requires reverting every later phase first. Reverting phase 9 unregisters the lessons without deleting them.

## Unresolved questions

None blocking. BST is the documented cut line: if phase 8 slips, phase 9 registers five lessons and drops the BST row.
