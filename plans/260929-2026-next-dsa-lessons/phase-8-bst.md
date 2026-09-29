# Phase 8: structures/bst

Runs after phase 2 (which provides the `structures` topic), in parallel with phases 3-7. Effort 4h. Read [lesson-conventions.md](lesson-conventions.md) first. This is the batch's cut line: if it slips, phase 9 ships without it, and nothing else depends on it.

## Context and requirements

The page keeps an appended log of Insert / Search / Delete operations. `bstTrace(ops)` replays the whole log, and after each new operation the page seeks the player to that operation's first frame. The tree is drawn as an SVG whose layout is a pure function of the frame: x is the in-order rank and y is the depth. The algorithms follow CLRS 12.2-12.3 and use Hibbard deletion with the in-order successor. The tree is capped at 15 nodes and the log at 40 operations. The page uses `ChipList` for the operations log.

## Files (owned; create all)

- `src/lib/algo-engine/bst.js`, `src/lib/algo-engine/bst.test.js`
- `src/lib/lessons/bst/copy.en.js`
- `src/routes/structures/bst/+page.svelte`, `src/routes/structures/bst/page.test.js`

## Engine: exports and frame

- `bstPseudocode`, `MAX_NODES = 15`, `MAX_OPS = 40`
- `bstTrace(ops: {type: 'insert'|'search'|'delete', key: number}[]): BstFrame[]`
- `layoutTree(frame): ({x: number, y: number} | null)[]`: one entry per slot; `null` for freed or unreachable slots
- `inorderKeys(frame): number[]`, `treeHeight(frame): number`
- `makeOps(preset: 'balanced'|'sorted'|'random', rand)`:
  - balanced: inserts 50, 30, 70, 20, 40, 60, 80
  - sorted: 10, 20, ... 70
  - random: 7 distinct keys in 1-99

```js
/**
 * @typedef {object} BstFrame
 * @property {'start'|'visit'|'go-left'|'go-right'|'insert'|'found'|'missing'|'dup'|'successor'|'relink'|'remove'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {{type: string, key: number} | null} op
 * @property {{key: number | null, left: number, right: number}[]} nodes  Slot-stable; children are slot indices, -1 none; freed slots have key null.
 * @property {number} root     -1 when empty.
 * @property {number} current  Slot being compared or changed, -1 when none.
 * @property {number[]} path   Slots visited by this op so far.
 * @property {number} succ     Successor slot during a two-child delete, -1 otherwise.
 * @property {number[]} lines
 * @property {number} comparisons  Per op (reset at each op's first frame).
 * @property {number} height   Nodes on the longest root-to-leaf path (empty 0).
 * @property {number} size
 */
```

**Pseudocode** (copy verbatim):
```js
['search / insert: node = root', '  while node exists:', '    if key == node.key: found (insert: duplicate, stop)',
 '    node = key < node.key ? node.left : node.right',
 '  insert: attach a new leaf where the walk fell off; search: not found', 'delete: find the node, then:',
 '  0 or 1 child: replace the node by its child (or nothing)',
 '  2 children: copy the smallest key of the right subtree here, delete that node']
```

Frames and lines:
- `start` [0]
- `visit` [1,2] for search and insert, [5,1,2] for delete: `comparisons++`, `current`, extend `path`
- `go-left` / `go-right` [3]
- `insert` [4]: new slot appended; slots are never reused
- `dup` [2]
- `missing` [4]: search or delete of an absent key; for an empty tree it is the op's only frame
- `found` [2]: search hit, or the node to delete
- delete with 0 or 1 child: `relink` [6] (the parent link, or the root, now points to the child), then `remove` [6] (slot freed)
- delete with 2 children:
  - `successor` [7] per step from `right` down the left spine, with `succ` set
  - `relink` [7]: copy the successor key into the node
  - `remove` [7]: the successor's parent link takes the successor's right child, and the successor slot is freed
- `done` [] once at the end of the trace

A refused insert (the tree already has `MAX_NODES` keys) is filtered out by the page before tracing.

## Copy (`copy.en.js`)

- slug `bst`, topic `structures`, level `Intermediate`, title `Binary search tree`.
- intro: "A binary search tree keeps every key smaller than a node on its left and every larger key on its right. Search, insert, and delete each walk one path from the root, so their cost is the height of the tree."
- instruction: "Type a key and insert, search, or delete it, then step through the walk. Load the sorted preset to see the tree lean into a list. Undo removes the last operation."
- takeaways:
  1. "Each comparison throws away one whole subtree, so an operation costs one step per level: O(height)."
  2. "Insert keys in sorted order and every new key goes right: the tree becomes a list with height n. Balanced trees such as AVL and red-black trees rotate to prevent this."
  3. "Deleting a node with two children copies in its successor (the smallest key in the right subtree), then deletes the successor. That node has at most one child, so the second delete is easy."
  4. "An in-order walk (left, node, right) visits the keys in sorted order."
- complexity:
  - `['Balanced', 'O(log n)', 'Height stays about log₂ n.']`
  - `['Worst', 'O(n)', 'Sorted inserts build a single long branch.']`
  - `['Memory', 'O(n)', 'One node per key.']`
- nextTeaser: "Next up: tree traversals and binary heaps, built on the same tree view."
- Labels:
  - `keyLabel: 'Key'`, `insert: 'Insert'`, `search: 'Search'`, `remove: 'Delete'`, `undo: 'Undo last'`, `reset: 'Reset'`
  - `presetLabel: 'Preset'`, `presets: {balanced: 'Balanced order', sorted: 'Sorted order', random: 'Random'}`
  - `opsTitle: 'Operations'`, `opsEmpty: 'none yet'`, `opChip(op)` → `Insert 45`
  - `stats: {comparisons: 'Comparisons', height: 'Height', size: 'Size'}`, `balanced(h)` → `Perfectly balanced height: ${h}`
  - `full: 'The tree is full (15 keys).'`, `keyError: 'Keys must be whole numbers from 0 to 99.'`, `emptyTree: 'The tree is empty.'`
  - `treeLabel(keys, h)` → `Tree with ${keys.length} keys, height ${h}. In order: ${keys.join(', ')}.`
  - legend: compared, path, found, new, removing, successor
- `describe(f)`: these strings are fixed, because the tests use them:
  - visit: `Compare ${key} with ${nodeKey}.`
  - dup: `${key} is already in the tree, so the insert is ignored.`
  - missing: `${key} is not in the tree.`
  - successor: `Two children: find the smallest key in the right subtree, ${succKey}.`
  - done: `Tree has ${size} keys, height ${height}.`

## Page: controls and visual encoding

- Initial log: `makeOps('balanced')`, and the player starts at frame 0. Verified expectations for the tests below: size 7 and height 3; inserting 45 gives height 4; deleting 50 promotes 60 and gives in-order 20, 30, 40, 60, 70, 80 with height 3; the sorted preset gives height 7.
- Controls:
  - one `input type="number"` Key field that keeps its last valid value (integers 0-99)
  - Insert, Search, Delete, Undo last, Reset (empty log), and a Preset `select name="preset"` that replaces the log
- Adding an op appends it (refused with the `full` notice when an insert would exceed 15 keys), rebuilds, and seeks to `frames.findIndex((f) => f.opIndex === newIndex)`.
- SVG: `role="img"` with `aria-label={m.treeLabel(...)}`. The viewBox is `0 0 ${max(1,size)*40} ${max(1,height)*48}`, and each node is drawn at `(x*40+20, y*48+24)` with r 16. Edges are drawn first, keyed by slot. Node fill classes:
  - compared: `fill-state-compare`
  - on the path: `fill-state-visited`
  - found: `fill-state-sorted`
  - just inserted: `fill-state-active`
  - being removed: `fill-state-swap`
  - successor: `fill-state-frontier`
  - otherwise `fill-white stroke-slate-400`
  - key text sits in the circle
- Stats: Comparisons, Height, Size, plus the `balanced(Math.ceil(Math.log2(size + 1)))` line.
- `ChipList` shows the log with `opChip`. The chip for the op of the current frame is hot.

## Tests

**Engine** (`bst.test.js`):
1. After 100 seeded random op sequences (up to 30 ops, keys 0-20), `inorderKeys` of the last frame equals the sorted contents of a reference `Set`.
2. The BST invariant holds at every op's last frame.
3. Delete covers a leaf, one child (left and right), two children, the root, an absent key, and the only node.
4. The two-child delete re-links the successor's right child (for example, balanced plus insert 65, then delete 50; 60's right child 65 stays in the tree).
5. Search comparisons equal the op's path length.
6. `layoutTree` gives strictly increasing x in in-order order, and y equal to the depth.
7. `size` and `height` match a recomputation.
8. The sorted preset gives height 7.
9. A duplicate insert emits `dup`, and the size is unchanged.
10. Frames are not aliased: mutating `frames[2].nodes[0]` leaves `frames[3]` unchanged.
11. Pseudocode coverage over balanced, a search hit, a search miss, a duplicate, and one-child and two-child deletes.

**Page** (`page.test.js`):
1. The last step shows `Tree has 7 keys, height 3.`
2. `commit(keyInput, '45')` then Insert shows `Compare 45 with 50.`, and the last step shows `Tree has 8 keys, height 4.`
3. Key 30 then Insert, followed by three Next steps, shows `30 is already in the tree`.
4. Key 50 then Delete: stepping forward reaches `smallest key in the right subtree, 60`. At the last step, the tree aria-label contains `In order: 20, 30, 40, 60, 70, 80.`
5. Selecting preset `sorted` and taking the last step shows `height 7` and `Perfectly balanced height: 3`.
6. Insert 45 then Undo last, and the last step shows `Tree has 7 keys, height 3.`

## Acceptance

All tests pass, and the scoped validation in conventions section 5 is clean. Report the trace length for 40 ops. The SVG layout is unverified without a browser, so say so.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Successor's right child lost on delete | M x H | Engine test 4. |
| SVG keyed by slot breaks when a slot is freed | M x M | Slots are never reused; the layout returns null for freed slots, and those are skipped. |
| Unbounded log length slows scrubbing | L x M | `MAX_OPS = 40`; refuse more with a notice. |

## Rollback

Delete the five owned files. Phase 9 then omits the BST row.
