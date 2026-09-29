# Hash table review fixes

- Chain cap removed; chips wrap, so every highlighted chip is drawn (H3).
- Alert banner replaced by a frame-tied notice shown in the narration (M1/C1); "New keys" confirms with "New keys loaded." (L4).
- Search field keeps last valid value, commits on change (M2).
- Focus ring is ring-slate-700 (L6); pseudocode line is `b = h(key)   // a bucket in 0..m-1` (L8; no engine test pinned it).
- Legend shows `marker label`; stats grid spans the odd last card; panel heading in ChipList style; `complexityHead` = Operation/Cost/Why; unused `more` copy removed.
- Tests added in page.test.js: long chain hit chip drawn, notice gone after Next step, new-keys notice, search revert.

Validation: targeted vitest 43 pass; eslint, prettier, svelte-check clean for my paths. Full `npm test`: 291 pass, 3 fail in files I don't own (chip-list.test.js x2, merge-quick-sort page.test.js x1), from other in-progress edits.
