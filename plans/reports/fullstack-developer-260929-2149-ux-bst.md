# BST lesson UX fixes

Files: src/routes/structures/bst/+page.svelte, page.test.js, src/lib/lessons/bst/copy.en.js.

- Scroller: SVG sits in a focusable `overflow-x-auto` wrapper (tabindex 0, aria-label) with width 1.2x and min-width 0.85x of the viewBox; no node cap.
- Compare nodes use dark text.
- Key field, Insert (submit), Search/Delete in one form; Search, Delete, Undo, Reset are `type="button"`; Undo and Reset sit in a separate bordered group.
- Marker text has a white halo (stroke + paint-order).
- Tree label appends root and balanced height; random preset resets the select to the placeholder so it can be re-rolled; stat label "Comparisons (this operation)"; "The unlinked node is gone."
- Op-log ChipList gets `hotLabel` "last operation".
- 4 new page tests (scroller, Enter inserts and button types, random twice, label). 16 page tests plus engine tests pass (33).

Verification: eslint and prettier clean, `npm run check` 0 diagnostics. `npm test`: 4 failures, all in dfs-grid and dijkstra-grid page tests (other developers' in-progress files); none in BST.
