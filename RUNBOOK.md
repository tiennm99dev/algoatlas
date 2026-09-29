# Runbook — AlgoAtlas

## Deployment

Production deploys from `main` via `.github/workflows/deploy.yml`.

- Live URL: `https://tiennm99dev.github.io/algoatlas/`
- Build: `npm run build` (SvelteKit static, output in `build/`)
- Mechanism: `actions/upload-pages-artifact` + `actions/deploy-pages`; Pages source is set to "GitHub Actions"
- Concurrency: `pages-deploy` group, cancel-in-progress disabled so a retry never aborts an in-flight rollback

## Rollback

1. Find the bad commit: `git log --oneline main`
2. `git revert <sha>` and push to `main`
3. The next workflow run redeploys the previous good state

If the workflow itself is broken, open the last successful **Deploy to GitHub Pages** run in the **Actions** tab and choose **Re-run all jobs**; it rebuilds that commit and publishes it.

## CI

`.github/workflows/ci.yml` runs lint, format check, type check, tests, and build on every PR and push to `main`. The deploy workflow repeats the same gate before it builds, so a failing commit on `main` is never published.

## Things to not do

- The base path comes from the `SITE_BASE` env var, defaulting to `/algoatlas` in `svelte.config.js`; the deploy workflow sets the same value explicitly. Change both together.
- Never edit `VERSION` or `package.json` `version` independently — they must agree.

## Dependencies

- `package.json#overrides` pins `cookie` to 0.7.2 because `@sveltejs/kit` still declares `cookie@^0.6.0`, which resolves to a version with an out-of-bounds character bug in cookie name and path parsing (GHSA-pxg6-pf52-xh8x). Drop the override once Kit requires `cookie@^0.7`.
