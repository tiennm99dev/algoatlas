# Phase 5: structures/hash-table (separate chaining)

Runs after phase 2 (which provides the `structures` topic), in parallel with phases 3-4 and 6-8. Effort 3h. Read [lesson-conventions.md](lesson-conventions.md) first.

## Context and requirements

The learner watches integer keys hash into buckets, collide into chains, and get rehashed when the load factor passes 0.75. Afterwards they can search for a key. The lesson follows CLRS 11.2 (chaining) and 11.3 (division and multiplication methods). The table is drawn as rows of chips, built by the page itself.

**Deviation from the report (recorded in plan.md):** the Hash control has three options. The report's prime schedule never produces the "multiples of 8 pile up" case, so the bad case is shown by `k mod m` with m a power of two:
- `mod-prime`: `k mod m`, sizes 5, 11, 23, 47
- `mod-pow2`: `k mod m`, sizes 4, 8, 16, 32
- `multiply`: `floor(m * ((k * A) % 1))` with `A = (Math.sqrt(5) - 1) / 2`, sizes 4, 8, 16, 32

## Files (owned; create all)

- `src/lib/algo-engine/hash-table.js`, `src/lib/algo-engine/hash-table.test.js`
- `src/lib/lessons/hash-table/copy.en.js`
- `src/routes/structures/hash-table/+page.svelte`, `src/routes/structures/hash-table/page.test.js`

## Engine: exports and frame

- `HASH_SIZES` (the schedule above), `MAX_LOAD = 0.75`, `MAX_KEYS = 24`, `hashPseudocode`
- `hashKey(key, m, fn)`
- `hashTableTrace(keys: number[], fn, search: number | null = null)`: insert every key in order, then optionally search
- `makeKeys(preset: 'random'|'sequential'|'multiples-of-8', n, rand)`:
  - random: n distinct integers in 0-999
  - sequential: 100, 101, ... up to 100 + n - 1
  - multiples-of-8: 0, 8, ... up to 8(n-1)
- `parseKeys(text): {keys: number[]} | {error: 'format'|'range'|'count'}`: comma-separated whole numbers in 0-999, at most `MAX_KEYS`. Duplicates are allowed; they exercise the update path.

```js
/**
 * @typedef {object} HashFrame
 * @property {'start'|'hash'|'walk'|'append'|'update'|'grow'|'rehash'|'grown'|'search-hit'|'search-miss'|'done'} kind
 * @property {number[][]} buckets  Snapshot of every chain (deep-copied per frame).
 * @property {number} m            Table size.
 * @property {number} n            Distinct keys stored.
 * @property {number} key          Key in flight, -1 when none.
 * @property {number} bucket       Focus bucket, -1 when none.
 * @property {number} pos          Index in the chain being compared, -1 when none.
 * @property {number} moved        Key just moved by a rehash, -1 when none.
 * @property {number[]} pending    Keys still waiting to be rehashed (empty outside a grow).
 * @property {number[]} lines
 * @property {number} comparisons  Running total of key comparisons.
 * @property {number} collisions   Running total of inserts into a non-empty chain.
 * @property {number} load         n / m.
 * @property {number} longest      Longest chain length.
 */
```

**Pseudocode** (copy verbatim):
```js
['insert(key):', '  b = hash(key) mod m', '  walk chain b: if an entry equals key, update it and stop',
 '  append key to chain b; n = n + 1', '  if n / m > 0.75: grow()',
 'grow(): m = larger size; re-insert every key with the new hash',
 'search(key): b = hash(key); walk chain b; found or not found']
```

Frames and lines:
- `start` []
- insert: `hash` [0,1], then `walk` [2] once per compared entry (`comparisons++`), then either `update` [2] (duplicate found: n unchanged, stop) or `append` [3] (`collisions++` if the chain was non-empty)
- after the append, if `n / m > MAX_LOAD` and a larger size exists:
  - `grow` [4,5]: old table still shown, `pending` = all keys in bucket order, each chain front to back
  - `rehash` [5] per key: new m, keys moved so far, `moved`; no comparisons or collisions counted
  - `grown` [5]
- search: `hash` [6], `walk` [6] per entry, then `search-hit` [6] (`pos` = hit index) or `search-miss` [6] (`pos` = -1)
- `done` []

Check the load after the insert, as Java's HashMap does.

## Copy (`copy.en.js`)

- slug `hash-table`, topic `structures`, level `Intermediate`, title `Hash table`.
- intro: "A hash table turns a key into a bucket number, so finding the key means looking in one short list instead of the whole collection. Watch keys land in buckets, collide, and get spread out again when the table grows."
- instruction: "Pick a hash function and a set of keys, then step through the inserts. When the table is more than 75% full it doubles in size and every key is rehashed. Then search for a key that is present or missing."
- takeaways:
  1. "Chaining keeps every key whose hash collides in one list per bucket. A lookup walks only that list."
  2. "The load factor n/m sets the average chain length. Growing the table when it passes 0.75 keeps lookups O(1) on average, and each key is moved O(1) times on average across all the growth."
  3. "A bad table size ruins a good-looking hash: with m a power of two, k mod m keeps only the last bits, so multiples of 8 all land in the same few buckets. A prime m, or the multiplication method, spreads them."
  4. "A search for a missing key costs the whole chain; a hit stops at the key's position."
- complexity:
  - `['Average', 'O(1)', 'Chains stay short while the load factor is bounded.']`
  - `['Worst', 'O(n)', 'Every key hashes to one bucket.']`
  - `['Grow', 'O(n) once, O(1) amortized', 'Doubling spreads the cost of rehashing over the inserts that filled the table.']`
- nextTeaser: "Next up: binary search trees, which keep keys in order so you can also ask for the smallest, largest, or next key."
- Labels:
  - `hashLabel: 'Hash'`, `hashes: {'mod-prime': 'k mod m, m prime', 'mod-pow2': 'k mod m, m = 2ᵖ', multiply: 'Multiplication'}`
  - `formula(fn, m)` → `h(k) = k mod ${m}` or `h(k) = ⌊${m} · frac(k · 0.618…)⌋`
  - `presetLabel: 'Keys'`, `presets: {random: 'Random', sequential: 'Sequential', 'multiples-of-8': 'Multiples of 8', custom: 'Custom'}`
  - `customLabel: 'Keys (comma-separated)'`, `countLabel: 'Count'`, `newKeys: 'New keys'`, `searchLabel: 'Search for'`, `searchButton: 'Search'`
  - `keyErrors: {format: 'Keys must be whole numbers from 0 to 999, separated by commas.', range: 'Keys must be whole numbers from 0 to 999.', count: 'Use at most 24 keys.'}`
  - `stats: {comparisons: 'Comparisons', collisions: 'Collisions', load: 'Load factor', longest: 'Longest chain', size: 'Table size'}`
  - `bucketsLabel: 'Buckets'`, `pendingLabel: 'Waiting to rehash'`, `more(n)` → `+${n}`
  - legend: compare, hit, new, moving
- `describe(f)`: one sentence per kind. These strings are fixed, because the tests use them:
  - search `hash`: `Search ${key}: hash to bucket ${b}.`
  - `search-hit`: `Found ${key} at position ${pos} of chain ${b} after ${c} comparison${c === 1 ? '' : 's'}.`, where c = pos + 1
  - `search-miss`: `${key} is not in chain ${b}: ${c} comparison${c === 1 ? '' : 's'}.`, where c = the chain length
  - `done`: `Inserted ${n} keys into ${m} buckets. Load factor ${load.toFixed(2)}.`

## Page: controls and visual encoding

- Initial keys `[12, 44, 13, 88, 23, 94, 11, 39, 20, 16]`, fn `mod-prime`, no search. Verified: final m = 23, longest chain 2 (bucket 16 holds 39, 16).
- Controls:
  - `SegmentedControl` named `hash`
  - `select name="preset"` (custom shows a text field that commits on change; on error, show the notice and keep the last valid keys)
  - Count range 4-24 for generated presets
  - New keys (random only)
  - Search number field (0-999) with a Search button
- Search rebuilds the trace with `search` and seeks the player to the first search `hash` frame.
- The table is an `ol aria-label={m.bucketsLabel}` with one `li` per bucket: the index label, then the chips left to right. After 8 chips, show `more(len - 8)`. Chip states:
  - compared (`walk`, at `pos`): `bg-state-compare text-white`
  - hit: `bg-state-sorted text-white`
  - just appended: `bg-state-active text-white`
  - `moved`: `bg-state-frontier`
  - otherwise `bg-slate-100`
- During a grow, a `pendingLabel` row of chips is shown. The formula line sits under the table.
- Stats: the five `stats`, with the load factor shown via `toFixed(2)`.

## Tests

**Engine** (`hash-table.test.js`):
1. After 200 seeded random key sequences (up to 24 keys, duplicates included, all three fns), every key sits in bucket `hashKey(key, m, fn)`, the total chain length equals the distinct count, and the final `load <= 0.75`.
2. Duplicates do not raise `n` and produce an `update` frame.
3. Each grow keeps the key multiset and moves m to the next scheduled size.
4. A search miss costs the chain length in comparisons, and a hit costs pos + 1 (measured as the comparison difference across the search).
5. `hashKey` is in `[0, m)` for all keys 0-999 and every size of every fn.
6. Under `mod-pow2`, 10 multiples of 8 all land in bucket 0 while m ∈ {4, 8}. The final longest chain is 5 (m=16). Under `mod-prime` it is 1.
7. Frames are not aliased: mutating `frames[3].buckets[0]` leaves `frames[4]` unchanged.
8. Every pseudocode line is covered by the initial keys plus a duplicate plus a search hit and a search miss.
9. `parseKeys` accepts `'5, 17,3'`, and rejects `'5,-3'` (range), `'a,b'` (format), and 25 keys (count).

**Page** (`page.test.js`):
1. The last step shows `Inserted 10 keys into 23 buckets.`, and the Table size stat reads 23.
2. Clicking `input[value="multiply"]` resets to `Step 1 of`, and the page contains `frac(k`. The last step then shows `into 16 buckets`.
3. With preset `multiples-of-8` (select change) and `mod-pow2`, the last step shows a Longest chain of 5. Switching to `mod-prime` and taking the last step shows 1.
4. Search for 62: the page seeks to `Search 62: hash to bucket 16.`, and the last step shows `62 is not in chain 16: 2 comparisons.`
5. Search for 39: the last step shows `Found 39 at position 0 of chain 16 after 1 comparison.`
6. The custom text `5, -3` shows the range error, and the Step counter is unchanged.

## Acceptance

All tests pass, and the scoped validation in conventions section 5 is clean. Report the trace length for 24 keys.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Float error in the multiplication method | L x M | `(k * A) % 1` is fine for k < 1000; engine test 5. |
| Rehash order nondeterminism | L x M | Iterate buckets in index order, chains front to back; tests 3 and 7. |
| The schedule runs out | L x L | `MAX_KEYS = 24` fits every schedule at load 0.75. If no larger size exists, skip the grow. |

## Rollback

Delete the five owned files.
