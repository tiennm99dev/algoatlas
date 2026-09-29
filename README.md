# AlgoAtlas

Learn data structures and algorithms by stepping through them. Every lesson runs the real algorithm on input you control — play, pause, rewind, and watch the cost add up. The site is built for desktop screens first.

Live: https://tiennm99dev.github.io/algoatlas/

## Lessons

| Topic | Lesson | Path | Interaction |
| --- | --- | --- | --- |
| Sorting | Bubble sort & insertion sort | `/sorting/bubble-insertion-sort/` | Pick algorithm and starting array, step through, compare both algorithms’ totals on the same array |
| Searching | Binary search | `/searching/binary-search/` | Watch mode, or "you drive" — probe cells yourself and compare with binary search |
| Graphs | Breadth-first search on a grid | `/graphs/bfs-grid/` | Paint walls, move start/goal, watch the frontier expand and the shortest path appear |

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
npm run preview   # serve build/
```

## Deploy

`main` deploys to GitHub Pages through `.github/workflows/deploy.yml`, which reruns lint, format, type check, and tests before building. See `RUNBOOK.md` for rollback.

## Architecture

- **Static site**: SvelteKit + `@sveltejs/adapter-static`, every route prerendered, `paths.base = '/algoatlas'` (override with `SITE_BASE`).
- **Language**: JavaScript only. Types live in JSDoc and are checked by `svelte-check` (`checkJs` + `strict`).
- **Styling**: Tailwind 4 via `@tailwindcss/vite`. The shared visualizer palette (`state-compare`, `state-sorted`, `state-path`, …) is defined in `@theme` in `src/app.css`.
- **Algorithm engines** (`src/lib/algo-engine/`): pure, DOM-free modules. Each algorithm runs once and returns a trace — an array of immutable frames carrying the data state, highlighted indices, running counters, and the pseudocode line. Rewinding is just showing an earlier frame.
- **Player** (`src/lib/player/player.svelte.js`): shared step/rewind/scrub/autoplay over any trace, driven by `step-controls.svelte`, which also stops playback on unmount. `code-panel.svelte` highlights the pseudocode lines each frame executes.
- **Shared UI**: button tiers (`btn-primary`, `btn-secondary`, `btn-outline`, `btn-icon`), `field`, and `focus-ring` are Tailwind `@utility` classes in `src/app.css`; `segmented-control.svelte` is the shared radio toggle.
- **Security**: `svelte.config.js` sets a hash-based Content Security Policy, emitted as a meta tag on every prerendered page.
- **Lessons**: one `+page.svelte` per lesson, wrapped in `lesson-layout.svelte` (intro, takeaways, complexity table). English copy is colocated in `src/lib/lessons/<slug>/copy.en.js` and registered in `src/lib/lessons/registry.js`; topic hubs are generated from the registry by `src/routes/[topic]/`.
- **Adding a lesson**: write a trace function plus tests in `algo-engine/`, add `copy.en.js`, register it, and add the route under its topic.

## License

Apache-2.0. See `LICENSE`.
