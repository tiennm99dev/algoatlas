# Docs and Tooling Audit: AlgoAtlas

Date: 2026-09-29. Branch main at 7bbe606. Read-only audit; no source edited.
Evidence class: current source (read directly) plus `npm run lint`, `npx prettier --check .`, `npm view @sveltejs/kit dependencies.cookie`.

## Verdict

README, RUNBOOK, and CHANGELOG match the source almost everywhere. Every prior tooling finding
(deploy gate, permission scoping, prettier enforcement, autoplay teardown, modifier keys,
`in` topic lookup, `--fail-on-warnings`, timeouts, CI concurrency, engines, duplicate
`.gitignore` line, CSP) is resolved in source. A `docs/` directory is not warranted.
What remains is small: one unenforced rule, one incomplete how-to, and a few precision gaps.

## Verified as correct (no action)

- README:17 "Node 24+" matches `package.json:45` (`engines.node >=24`) and CI/deploy `node-version: '24'`.
- README:19-27 scripts all exist in `package.json:7-17`. Dev URL matches `svelte.config.js:4` (`/algoatlas`).
- README:36 `paths.base`, `SITE_BASE`, prerender (`src/routes/+layout.js`), `adapter-static`.
- README:37 `checkJs` + `strict` (`jsconfig.json`); `--fail-on-warnings` (`package.json:11`).
- README:38 palette `@theme` in `src/app.css:7-18`; README:41 `@utility` btn-*, field, focus-ring in `src/app.css:28-55`.
- README:39-40 engines, player, `step-controls.svelte` teardown (`step-controls.svelte:11`), `code-panel.svelte` (used by all three lesson pages).
- README:42 hash CSP with meta tag: `svelte.config.js:8-21`.
- README:9-13 lesson routes: all three `+page.svelte` exist under `src/routes/<topic>/<slug>/`; `lessonPath` in `registry.js` yields the same paths.
- README:43 hubs generated from registry: `src/routes/[topic]/+page.js` (`entries()` from `topicOrder`, `Object.hasOwn` 404).
- RUNBOOK:10 (concurrency), RUNBOOK:22 (CI events), RUNBOOK:26 (SITE_BASE) match `ci.yml` and `deploy.yml`.
- Workflows: actions use moving major tags (`checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5`); the prior audit confirmed via `gh api` that they exist. Workflow-level `contents: read`; `pages: write` and `id-token: write` only on the deploy job (`deploy.yml:59-61`); `cache: 'npm'`; `timeout-minutes` set; deploy `cancel-in-progress: false` is right for Pages; CI cancels only superseded PR runs.
- `.gitignore:2-6` covers `.svelte-kit/`, `build/`, `node_modules/`. `git ls-files` shows no `build/`, `.svelte-kit/`, or `.env*` tracked. `plans/reports/*.md` are tracked on purpose (stateful records). No `docs/` dir exists.
- `npm run lint` clean. `prettier --check .` flags only `.claude/settings.local.json` (see F6).

## Findings

### F1. "VERSION and package.json must agree" is stated but not enforced (Low)
Evidence: `RUNBOOK.md:27`. `VERSION` and `package.json:3` both hold `0.1.0.0` today, and `CHANGELOG.md:3` plus the release heading (`## [0.1.0.0]`) match. No CI step compares them. The same gap was raised in the earlier report (L6) and is still open.
Four-segment version: intentional. `CHANGELOG.md:3` declares "4-digit MAJOR.MINOR.PATCH.MICRO", so no drift. It is not valid semver, so `npm version` cannot bump it. That is acceptable for a `private` package; keep it, but the sync check matters more because of it.
Edit: add to `.github/workflows/ci.yml` after "Install dependencies":
```yaml
      - name: Version files agree
        run: test "$(cat VERSION)" = "$(node -p "require('./package.json').version")"
```
The alternative is to reword `RUNBOOK.md:27` to "keep in sync by hand". Either is proportional.

### F2. "Adding a lesson" omits the topic-registration step for a new topic (Low)
Evidence: `README.md:44` lists trace + tests, `copy.en.js`, register, route. A lesson in a new topic also needs the topic in `src/lib/i18n/site.en.js` (`topics` and `topicOrder`), because `src/routes/[topic]/+page.js:6-11` reads `topicOrder` for `entries()` and `topics` for the 404 check. The CHANGELOG says a registry-to-route consistency test exists (`src/routes/lesson-pages.test.js`), which will catch a missing route.
Edit: `README.md:44`, append: "A lesson in a new topic also needs that topic added to `topics` and `topicOrder` in `src/lib/i18n/site.en.js`; `src/routes/lesson-pages.test.js` fails if a registered lesson has no route."
Do this only after re-reading `lesson-pages.test.js` to confirm the wording; I confirmed the file exists, not every assertion.

### F3. RUNBOOK rollback fallback points to the wrong place (Low, unverified UI)
Evidence: `RUNBOOK.md:18` says "re-run an earlier successful deployment from the repository's **Deployments** tab". The GitHub Deployments view lists deployments but offers no re-run. Re-running is done from Actions on a prior workflow run. I could not verify the UI without access, so this is marked unverified.
Edit: `RUNBOOK.md:18` becomes "re-run an earlier successful `Deploy to GitHub Pages` run from the repository's **Actions** tab (this rebuilds that commit)."

### F4. RUNBOOK:26 describes `paths.base` and `SITE_BASE` as separate settings (Low)
Evidence: `svelte.config.js:4` sets `const base = process.env.SITE_BASE ?? '/algoatlas'` and passes it as `paths.base`. `deploy.yml:47` sets `SITE_BASE: /algoatlas`, which equals the default, and `ci.yml` sets nothing. There is one setting with an env override, not two. The rule as written points to the wrong thing to change. The two also drift silently: change the default and the deploy env still forces the old value.
Edit: `RUNBOOK.md:26` becomes "Never change the `/algoatlas` base without updating both the default in `svelte.config.js` and `SITE_BASE` in `deploy.yml`; it must equal the Pages repo path." Alternative: drop `SITE_BASE` from `deploy.yml:46-47` and let the default apply. That is simpler, but it is a user decision on config shape, so it is not applied here.

### F5. `cookie` override has no recorded reason (Low)
Evidence: `package.json:41-43` overrides `cookie` to `0.7.2`. `npm view @sveltejs/kit dependencies.cookie` still returns `^0.6.0` and the lockfile line 856 confirms the range, so the override is still active and needed. Nothing in README or RUNBOOK says why. JSON allows no comments, and the `npm audit` advisory that motivated it is not recorded. The prior report only says "still needed".
Edit: add one line to `RUNBOOK.md`, for example a "Dependency overrides" section: "`cookie` is pinned to 0.7.2 in `package.json#overrides` because `@sveltejs/kit` still declares `^0.6.0`, which `npm audit` flags. Remove the override once Kit depends on `>=0.7.0` and `npm audit` stays clean." Confirm the advisory text with `npm audit` before writing; I did not run it here.

### F6. `format:check` fails locally on an ignored tool file (Low)
Evidence: `npx prettier --check .` reports `.claude/settings.local.json`. Git ignores it (global ignore `**/.claude/settings.local.json`) but `.prettierignore` does not, so a maintainer using Claude Code sees a failing `npm run format:check`. CI is unaffected because the file is never checked out.
Edit: append `.claude/` to `.prettierignore` (after line for `plans/`). ESLint already passes, so no change there.

### F7. `package.json` metadata gaps (Low)
- No `license` field although `LICENSE` is Apache-2.0 and `README.md:48` says so. Edit: add `"license": "Apache-2.0",` after `"private": true` (`package.json:4`).
- All nine `dependencies` (`package.json:18-28`: svelte, vite, kit, tailwind, adapter, fontsource) are used only at build time, because the output is static HTML/JS/CSS. The split is harmless for a `private` app deployed from `npm ci`, and it matches the SvelteKit template convention. No edit required. Recommendation: leave as is.
- Scripts: none stale or missing. `test:watch` is undocumented in `README.md:19-27`; optional, skip.
- Lockfile transitive engines (`^22.22.2 || ^24.15.0 || >=26`) are satisfied by CI's floating `'24'`; `engines >=24` is loose but consistent with README.

### F8. Double gate on push to main (Info)
Evidence: `ci.yml:3-7` and `deploy.yml:3-7` both trigger on push to `main` and run the same five steps. This is intentional and documented (`RUNBOOK.md:22`): deploy must gate itself because `main` has no branch protection. It costs one extra ~2-minute run per push. No edit. Do not deduplicate unless branch protection requiring `CI / ci` is added.

### F9. CHANGELOG and release marker (Info)
`git tag` is empty, so `[0.1.0.0]` has no tag and `CHANGELOG.md` has no compare links. Keep a Changelog does not require links. Only add a tag when publishing is intended. `CHANGELOG.md:41` ("quiz mode") is accurate history for the released entry; the Unreleased "Changed" section records its removal, so the two agree. `[Unreleased]` is long for a single-day-old release. That is fine and cuts to a new version when the next release is cut.

## Docs gaps: proportional view

README (48 lines) plus RUNBOOK (27 lines) is enough for this size. Do not add `docs/`, an ADR log, a contributing guide, or an architecture tree. Rationale for non-obvious choices already lives next to the code (`svelte.config.js` CSP comment, `eslint.config.js` unused-vars comment, `vitest.config.js` alias comments). The only additions worth making are F2 (README how-to) and F5 (override reason). Dependabot or Renovate: optional, not recommended without a stated need; the caret ranges plus CI catch most breakage.

## Prior report status

Resolved and verified in source: M1 (`deploy.yml:23-43` gate), M2 (`deploy.yml:59-61`), M3 (`package.json:16`, `ci.yml` format step, tree clean), L1 (`step-controls.svelte:11`), L2 (assumed via CHANGELOG; not re-read), L3 (`[topic]/+page.js:11`), L4 (`package.json:11`), L5 (timeouts, `ci.yml:12-14`), engines, duplicate `.gitignore` line, CSP (`svelte.config.js`). Still open: version-agreement enforcement (F1), override rationale (F5, new).

## Unresolved questions

- F3: does the Deployments tab offer a re-run? Needs someone with repo access to confirm.
- F4: keep `SITE_BASE` in `deploy.yml`, or drop it and rely on the default? User's call on config shape.
