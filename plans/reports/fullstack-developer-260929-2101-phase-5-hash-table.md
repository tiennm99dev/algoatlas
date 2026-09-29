# Phase 5 report: structures/hash-table

Status: DONE_WITH_CONCERNS

## Files created
- src/lib/algo-engine/hash-table.js, hash-table.test.js (14 tests)
- src/lib/lessons/hash-table/copy.en.js
- src/routes/structures/hash-table/+page.svelte, page.test.js (6 tests)

## Validation
- vitest on both test files: 20 passed. eslint and prettier clean on all five files.
- `npm run check`: no diagnostics in hash-table paths.
- `npm test`: 20 files, 259 tests, all passed (no failures in files I do not own).

## Trace length at the size caps (24 keys, plus a search)
- Random keys: mod-prime 97, mod-pow2 96, multiply 91.
- Multiples of 8: mod-prime 88, mod-pow2 174, multiply 91. All well under 400.

## Decisions and concerns
- `done` is emitted only when no search is requested; a search trace ends on `search-hit` or `search-miss` (required by the page tests that read the last step).
- Rehash frames show the new table filling; `bucket` is the destination bucket and the `moved` chip is the last chip of that chain.
- Search or key/fn changes rebuild the trace; changing keys or hash function drops the search.
- Initial preset is `random` with the fixed initial key list, so the first render is deterministic.
- Chip state is shown by color, a visible mark (? ✓ + →) and sr-only text, all from copy.
- The pending-keys row reuses ChipList (limit 24); no shared component gaps found.
- Test 6 also asserts the text field reverts to the last valid keys.
