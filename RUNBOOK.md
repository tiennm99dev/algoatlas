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

If the workflow itself is broken, re-run an earlier successful deployment from the repository's **Deployments** tab.

## CI

`.github/workflows/ci.yml` runs lint, type check, tests, and build on every PR and push to `main`.

## Things to not do

- Never change `paths.base` in `svelte.config.js` without updating `SITE_BASE` in the deploy workflow.
- Never edit `VERSION` or `package.json` `version` independently — they must agree.
