# Tooling, CI/CD, and Security Review: AlgoAtlas

Date: 2026-09-29. Commit: `d9d85e9`. Read-only review; no source edited.

## Command results

| Command | Result |
| --- | --- |
| `npm run lint` | pass, 0 problems |
| `npm run check` | pass, 0 errors, 0 warnings |
| `npm test` | pass, 5 files / 46 tests |
| `npm run build` | pass, prerendered to `build/` |
| `npm audit` | 0 vulnerabilities |
| `npm ls --all` | exit 0; `cookie@0.7.2 overridden` under `@sveltejs/kit` |
| `npx prettier --check .` | **fails, 16 files** (README.md plus 15 under `src/`) |
| `npm outdated` | only `typescript` 6.0.3 vs 7.0.2 (see note below) |

Verified with `gh api`: `actions/checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5` all exist as major tags. Pages `build_type=workflow`, HTTPS enforced. The `github-pages` environment only allows `main`, so a `workflow_dispatch` from another branch cannot deploy. `main` has no branch protection. Default workflow token is `read`. Last CI and Deploy runs succeeded.

## Findings

### M1. Deploy does not gate on lint, check, or tests (Medium)
`.github/workflows/deploy.yml:20-38`. Deploy runs in parallel with CI on the same push and only runs `npm run build`. `main` is unprotected, so a direct push that breaks a test or the type check still publishes. Example: a regression in `bfsGridTrace` passes the build, fails `npm test` in CI, and is live anyway.
Fix: add `npm run lint`, `npm run check`, and `npm test` before `Build` in the deploy `build` job. The alternative is a reusable CI workflow (`workflow_call`) that the deploy job `needs:`. Adding branch protection that requires the `CI / ci` check would also cover this.

### M2. Pages and OIDC write scopes granted to the build job (Medium)
`.github/workflows/deploy.yml:9-12`. `pages: write` and `id-token: write` are set at workflow level, so the `build` job gets them too. That job runs `npm ci` and `vite build`, which executes third-party plugin code. Compromised build-time code could mint the OIDC token and deploy a tampered site directly. Exposure today is low: the only package with an install script is `fsevents` (optional, macOS-only). The build step still runs dependency code, though.
Fix: set workflow-level `permissions: contents: read` and move `pages: write` and `id-token: write` to `jobs.deploy.permissions`.

### M3. Prettier is configured but not enforced, and the tree is unformatted (Medium)
`package.json:15`, `.github/workflows/ci.yml`. `npx prettier --check .` fails on 16 files. There is a `format` (write) script but no check script and no CI step, so drift will keep growing, and the first `npm run format` will produce a large, noisy diff.
Fix: run `npm run format` once in its own commit. Then add `"format:check": "prettier --check ."` and a CI step for it.

### L1. Autoplay timer is not cleared on unmount (Low)
`src/routes/sorting/bubble-insertion-sort/+page.svelte:34`, `src/routes/searching/binary-search/+page.svelte:27`, `src/routes/graphs/bfs-grid/+page.svelte:33`, `src/lib/player/player.svelte.js:25-44`. No page calls `player.pause()` on destroy. If the user presses Play and then navigates client-side, the `setTimeout` chain keeps ticking on the detached player until the trace ends. At 0.5x on a long trace that can run for minutes, and it repeats on every visit.
Fix: in each page (or once in `createPlayer`), add `$effect(() => () => player.pause());`. Add a test that unmounts during playback and checks that no timers remain (`vi.getTimerCount()`).

### L2. Keyboard shortcuts ignore modifier keys (Low, browser behavior uncertain)
`src/lib/components/step-controls.svelte:19-28`. The window handler reacts to ArrowLeft/ArrowRight/Space even when Alt, Ctrl, or Meta is held, and calls `preventDefault()`. Alt+ArrowLeft is the browser Back shortcut on Windows/Linux. It would step the player back, and in Chromium it may also block history navigation (not verified: no browser available).
Fix: add `if (e.altKey || e.ctrlKey || e.metaKey) return;` at the top of the handler.

### L3. Topic lookup uses `in`, which also matches prototype keys (Low)
`src/routes/[topic]/+page.js:11`. For `constructor`, `toString`, and similar, `params.topic in t().topics` is true, so `load` returns and the page crashes on `topic.title`, where `topic` is a prototype function. On Pages only the prerendered topics exist, so this is reachable only through client-side routing to such a path. Impact is minimal.
Fix: `Object.hasOwn(t().topics, params.topic)`.

### L4. svelte-check warnings do not fail CI (Low)
`package.json:11`. By default svelte-check exits non-zero only on errors, so future a11y and Svelte warnings pass CI unnoticed. The count is 0 today, so this is cheap to lock in.
Fix: append `--fail-on-warnings`.

### L5. CI hygiene (Low)
`.github/workflows/ci.yml`, `deploy.yml`. No `timeout-minutes` (a hung job burns up to 6h), and CI has no `concurrency` group to cancel superseded PR runs. npm caching via `setup-node` `cache: 'npm'` is correct.
Fix: `timeout-minutes: 10` per job. In CI, add `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.

### L6. Documentation and metadata gaps (Low)
- `README.md` says "Requires Node 24+", but `package.json` has no `engines`. Fix: `"engines": { "node": ">=24" }`.
- `RUNBOOK.md` says `VERSION` and `package.json#version` "must agree", but nothing enforces it. Fix: add a CI step, e.g. `test "$(cat VERSION)" = "$(node -p 'require(\"./package.json\").version')"`.
- `.gitignore:21,23`: `npm-debug.log*` is listed twice.
- `package.json` `version` `0.1.0.0` is not valid semver. It is harmless for a private, unpublished package (`npm ci` and `npm ls` accept it), but `npm version` cannot bump it. The 4-digit scheme is an explicit project decision, so this is noted only.
- Everything else in README, RUNBOOK, and CHANGELOG matches the code: commands, dev URL under `/algoatlas/`, lesson paths, the concurrency note, and the listed features (quiz, "you drive", wall painting, keyboard shortcuts, speed).

## Test coverage gaps

No coverage tool is configured, so there is no percentage. Gaps found by reading the tests:
1. **Keyboard shortcuts** (`step-controls.svelte:19-28`): untested. That includes the `locked` rule (ArrowRight and Space are blocked during a quiz, ArrowLeft is not) and the guard that ignores keys typed in focused inputs.
2. **Player edge cases**: changing speed mid-play, `load()` during playback, `toggle()`, and teardown (L1).
3. **Topic hub route** (`[topic]/+page.js`): no test that `entries()` matches `topicOrder`, or that an unknown topic throws a 404.
4. **Registry-to-route consistency**: nothing checks that every `lessons` entry has a matching `src/routes/<topic>/<slug>/+page.svelte`, or that every `lesson.topic` exists in `site.en.js` topics. The prerender crawl catches broken links only for pages that are linked.
5. **Base path**: `src/test-support/app-paths-stub.js` makes `resolve` and `asset` identity functions, so no test covers `/algoatlas` prefixing. Mitigation: SvelteKit's prerender crawl fails the build on internal 404s (default `handleHttpError: 'fail'`), and CI builds with the real base. That is acceptable, but CI's build is the only guard.
6. **Layout and landing page** (`+layout.svelte`, `+page.svelte`): not rendered in any test.
7. The stub covers only `$app/paths`. A future import of `$app/state`, `$app/navigation`, and so on will fail in Vitest with a resolution error. Option: use the `sveltekit()` plugin in `vitest.config.js` instead of hand-written aliases. Uncertain: check that it works with the jsdom setup.

## Static-site security

- **XSS**: there is no `{@html}`, `innerHTML`, `eval`, or `new Function` in `src/`. All copy is static modules that Svelte escapes. The only DOM `innerHTML` write is test cleanup.
- **External links**: all 3 in `+layout.svelte:35-39` use `target="_blank" rel="noopener noreferrer"`. There are no other external links.
- **Third-party origins**: none. Fonts are bundled from `@fontsource` and the favicon is local.
- **CSP**: none today. It is feasible on Pages with a `<meta>` tag through `kit.csp` (`mode: 'hash'`), which SvelteKit emits for prerendered pages. Suggested directives: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'`. `'unsafe-inline'` for styles is needed for `app.html`'s `style="display: contents"` and Svelte style attributes. `frame-ancestors`, HSTS, and other headers cannot be set through a meta tag on Pages. Priority is low because the site has no user data, auth, or third-party scripts.

## Dependency notes (not findings)

- Keep `typescript` at `^6`. `svelte-check@4.7.6` declares peer `typescript: ^5 || ^6`, so moving to 7 would break the peer range.
- The `cookie: 0.7.2` override is still needed. `@sveltejs/kit@2.70.3` (the latest) still declares `cookie ^0.6.0`. Recheck when Kit bumps it.
- All other ranges are caret. The lockfile matches `package.json` (`npm ls --all` exit 0, CI `npm ci` green).

## Unresolved questions

- L2: does Chromium honor `preventDefault()` on Alt+ArrowLeft? This could not be checked without a browser.
- M1: do you prefer gating deploy inside `deploy.yml`, or requiring CI through branch protection on `main`?
