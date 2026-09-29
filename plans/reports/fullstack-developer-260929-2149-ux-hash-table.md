# Hash table UX fixes

- Compare chip now uses text-slate-900.
- Search field and button sit in a form; Enter runs the search. A `searched` flag lets any rebuild without a lookup (hash function, custom keys, new keys) say "The search was cleared because the table changed."
- Bucket list uses columns-2 above 16 buckets and md:columns-3 above 32; the focused bucket scrolls into view when stepping, not while playing (guarded for jsdom).
- Empty text is slate-500, bucket index has an sr-only "Bucket" prefix, the "Waiting to rehash" card is always mounted (empty outside growth).
- Complexity rows already agree with the "Case" head; no change.
- Tests added: Enter submits search, cleared-search notice, sr-only prefix.

Validation: hash-table vitest 27/27, eslint and prettier clean, svelte-check clean for these paths. Full `npm test`: 341 pass, 2 fail in other developers' lessons (dfs-grid and dijkstra-grid stale-copy label tests), not in my files.
