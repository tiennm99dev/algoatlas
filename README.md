# AlgoAtlas

Learn data structures and algorithms by stepping through them. Every lesson runs the real algorithm on input you control — play, pause, rewind, and watch the cost add up. The site is built for desktop screens first.

Live: https://tiennm99dev.github.io/algoatlas/

## Lessons

The curriculum in `src/lib/curriculum/dsa.json` drives the site. It plans 186 lessons in 34 topics over three levels: Foundations, Core algorithms, and Advanced topics. A topic is a curriculum chapter, and its slug is the first part of every lesson URL (`/<topic>/<slug>/`). Each lesson has a kind:

- **Theory**: one algorithm or structure, stepped through on input you control.
- **Practice**: a hands-on problem runner or sandbox for the topic, with answer-checked questions.
- **Review**: one per level, a quiz that mixes every topic of that level.

The home page groups topics by level, each topic hub lists all of its planned lessons in book order, and previous and next links follow the same order. A lesson that is not written yet is a `noindex` stub page with its key ideas and planned interaction, so every link works from the start. `npm run stubs` shows what is left. These lessons are written so far:

| Topic          | Lesson                         | Path                              | Interaction                                                                                                     |
| -------------- | ------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Sorting        | Bubble sort & insertion sort   | `/sorting/bubble-insertion-sort/` | Pick algorithm and starting array, step through, compare both algorithms’ totals on the same array              |
| Sorting        | Merge sort & quicksort         | `/sorting/merge-quick-sort/`      | Toggle merge sort / quicksort, pick array and pivot rule, watch the call stack and merge buffer, compare totals |
| Searching      | Binary search                  | `/searching/binary-search/`       | Watch mode, or "you drive" — probe cells yourself and compare with binary search                                |
| Searching      | Lower bound & upper bound      | `/searching/lower-upper-bound/`   | Pick lower or upper bound and a target, watch the half-open window, see the equal range and count               |
| Hashing        | Hash table                     | `/structures/hash-table/`         | Pick a hash function and key set, watch chains grow and the table rehash, search present or missing keys        |
| Trees          | Binary search tree             | `/trees/bst/`                     | Insert, search, and delete keys, step through each walk, see sorted inserts degenerate into a list              |
| Graphs         | Breadth-first search on a grid | `/graphs/bfs-grid/`               | Paint walls, move start/goal, watch the frontier expand and the shortest path appear                            |
| Graphs         | Depth-first search on a grid   | `/graphs/dfs-grid/`               | Paint walls, watch the stack dive, compare the DFS path with the BFS shortest path                              |
| Shortest paths | Dijkstra’s algorithm on a grid | `/shortest-paths/dijkstra-grid/`  | Paint walls and mud, watch the priority queue settle cells, compare costs with the BFS route                    |

## Develop

Requires Node 24+ and npm.

```sh
npm install
npm run dev       # http://localhost:5173/algoatlas/
npm test          # Vitest: engine, player, and page interaction tests
npm run lint      # ESLint
npm run format:check  # Prettier (npm run format to fix)
npm run check     # svelte-check with strict JSDoc types, warnings fail
npm run build     # static output in build/
npm run stubs     # unwritten lessons per topic; `-- <topic>` lists one, `--strict` exits 1 on any
npm run preview   # serve build/
```

## Deploy

`main` deploys to GitHub Pages through `.github/workflows/deploy.yml`, which reruns lint, format, type check, and tests before building. See `RUNBOOK.md` for rollback.

`static/404.html` is a hand-written, script-free page that GitHub Pages serves for unknown URLs; its home link assumes the `/algoatlas/` base path.

## Architecture

- **Static site**: SvelteKit + `@sveltejs/adapter-static`, every route prerendered, `paths.base = '/algoatlas'` (override with `SITE_BASE`).
- **Language**: JavaScript only. Types live in JSDoc and are checked by `svelte-check` (`checkJs` + `strict`).
- **Styling**: Tailwind 4 via `@tailwindcss/vite`. The shared visualizer palette (`state-compare`, `state-sorted`, `state-path`, …) is defined in `@theme` in `src/app.css`.
- **Algorithm engines** (`src/lib/algo-engine/`): pure, DOM-free modules. Each algorithm runs once and returns a trace — an array of immutable frames carrying the data state, highlighted indices, running counters, and the pseudocode line. Rewinding is just showing an earlier frame.
- **Player** (`src/lib/player/player.svelte.js`): shared step/rewind/scrub/autoplay over any trace, driven by `step-controls.svelte`, which also stops playback on unmount. `code-panel.svelte` highlights the pseudocode lines each frame executes.
- **Shared visualizers** (`src/lib/components/`): SVG building blocks that lessons configure with plain data and state callbacks: `array-strip` (cells, named pointers, half-open windows), `linked-list-view`, `stack-queue-view`, `tree-view` (binary or n-ary trees and forests), `heap-view` (implicit tree plus array), `union-find-forest` (parent array as a forest), `graph-canvas` (fixed-position graph that can also be an editor), and `dp-table` (table with dependency arrows). They share the state palette through `visual-state.js`, name every element for screen readers, and with an `onselect` prop turn into roving-focus buttons. Their pure logic lives beside them in `tree-layout.js` and `graph-editor.js`.
- **Practice**: `practice-block.svelte` renders answer-checked questions (number, choice, multi, text, order) from plain data, with hints revealed one at a time, a solution after the first try, and a per-viewer "Solved" tick in `localStorage`. `answer-check.js` checks answers (English number format, Big-O spelling folded) and `exerciseProblems()` lets tests reject a malformed question. Review lessons are quiz pages built from it.
- **Shared UI**: button tiers (`btn-primary`, `btn-secondary`, `btn-outline`, `btn-icon`), `field`, and `focus-ring` are Tailwind `@utility` classes in `src/app.css`; `segmented-control.svelte` is the shared radio toggle. Visualizer building blocks: `bar-chart.svelte` (bars with an optional buffer row), `chip-list.svelte` (queue, stack, and log chips), and `grid-board.svelte` (editable grid with pointer painting, keyboard navigation, and a transposed layout on phones); the `terrain-mud` utility hatches weighted cells. Grid lessons share their editing state (walls, start, goal, tools, notices) through `src/lib/player/grid-editor.svelte.js` and their cell copy through `src/lib/lessons/grid-copy.en.js`.
- **Security**: `svelte.config.js` sets a hash-based Content Security Policy, emitted as a meta tag on every prerendered page.
- **Curriculum** (`src/lib/curriculum/`): `dsa.json` lists three levels of chapters and their lessons (title, kind, key ideas, planned interaction). A chapter is a topic: its slug is the topic key in every URL, and `index.js` derives `topics` and `topicOrder` from it, so `site.en.js` holds only chrome strings. The home page groups topics by level, and topic hubs list every planned lesson, marking unwritten ones as coming soon.
- **Stubs and redirects**: `src/routes/[topic]/[slug]/` prerenders every unwritten lesson as a `noindex` stub page (title, kind, key ideas, planned interaction, book-order neighbors). Its `entries()` skips lessons that have a static route, found through the `import.meta.glob('/src/routes/*/*/+page.svelte')` keys in `src/lib/lessons/static-routes.js`. The same route serves the old URLs of moved lessons, listed in `src/lib/curriculum/legacy-redirects.js`, as script-free meta-refresh pages (`/structures/bst/` and `/graphs/dijkstra-grid/`). `npm run stubs` (`scripts/stub-report.js`) counts the stubs per topic. `scripts/import-curriculum.js <manifest.json>` regenerates `dsa.json` from a syllabus manifest, keeping the hand-written chapter blurbs and writing Prettier-formatted JSON.
- **Lessons**: one `+page.svelte` per lesson, wrapped in `lesson-layout.svelte` (intro, takeaways, complexity table). English copy is colocated in `src/lib/lessons/<slug>/copy.en.js`. `src/lib/lessons/registry.js` discovers every copy module with an eager `import.meta.glob` and orders the lessons by the curriculum, which also sets previous and next.
- **Adding a lesson**: pick the lesson's slug and topic from `dsa.json`, then add `src/lib/lessons/<slug>/copy.en.js` (its `topic` must be the chapter slug), the engine module plus tests in `src/lib/algo-engine/<slug>.js` (review lessons have none), and the route `src/routes/<topic>/<slug>/+page.svelte` with its interaction tests beside it as `page.test.js` (no `+` prefix, so SvelteKit ignores it). No registry or i18n edit is needed; the registry throws on a copy module whose slug or topic does not match the curriculum. The static route replaces the lesson's stub, and `npm run stubs -- <topic>` shows what is left in the topic. `src/lib/lessons/lesson-content.test.js` checks every written lesson against its kind: theory pages use the step controls, and practice and review lessons carry a well-formed `practice` quiz of at least 5 and 10 questions. The full brief for a lesson author, covering the trace contract, the shared components, the quality bar, and the checks every batch passes, is `.claude/skills/write-lesson/SKILL.md`.

## License

Apache-2.0. See `LICENSE`.
