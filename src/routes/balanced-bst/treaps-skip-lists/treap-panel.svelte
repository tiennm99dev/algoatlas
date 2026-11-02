<script>
  import { createFieldGuard, enterField } from '$lib/components/numeric-field.js';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_KEY,
    MAX_PRIORITY,
    MAX_TREAP_KEYS,
    MAX_TREAP_OPS,
    MIN_KEY,
    MIN_PRIORITY,
    makeTreapOps,
    treapKeys,
    treapPseudocode,
    treapTrace,
  } from '$lib/algo-engine/treaps-skip-lists.js';
  import { en as m } from '$lib/lessons/treaps-skip-lists/copy.en.js';

  /** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').TreapOp} TreapOp */
  /** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').TreapFrame} TreapFrame */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {'compare'|'path'|'added'|'up'|'down'|'ok'} Role */

  /**
   * The treap half of the lesson. The page owns the player, the log and the preset so they survive a
   * switch to the skip list and back.
   * @type {{
   *   player: ReturnType<typeof import('$lib/player/player.svelte.js').createPlayer<TreapFrame>>,
   *   ops: TreapOp[],
   *   preset: string,
   *   controls: import('svelte').Snippet,
   * }}
   */
  let { player, ops = $bindable(), preset = $bindable(), controls } = $props();

  const PRESETS = /** @type {const} */ (['shuffled', 'reordered', 'chain', 'random']);
  /** @type {Record<Role, import('$lib/components/visual-state.js').VisualState>} */
  const ROLE_STATE = {
    compare: 'compare',
    path: 'visited',
    added: 'active',
    up: 'sorted',
    down: 'path',
    ok: 'frontier',
  };
  const LEGEND = /** @type {Role[]} */ (['compare', 'path', 'added', 'up', 'down', 'ok']);

  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(45);
  /** @type {number | null} */
  let draft = $state(45);
  /** @type {number | null} */
  let priorityDraft = $state(null);
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describeTreap(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validKey = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_KEY && v <= MAX_KEY;
  /** @param {unknown} v */
  const validPriority = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_PRIORITY && v <= MAX_PRIORITY;

  const keyField = createFieldGuard();
  const priorityField = createFieldGuard();

  function commitKey() {
    if (keyField.commit(validKey(draft))) key = /** @type {number} */ (draft);
    else {
      draft = key;
      say(m.keyError);
    }
  }

  function commitPriority() {
    if (!priorityField.commit(priorityDraft === null || validPriority(priorityDraft))) {
      priorityDraft = null;
      say(m.priorityError);
    }
  }

  /** @param {TreapOp['type']} type */
  function add(type) {
    if (keyField.refused() || !validKey(draft)) {
      draft = key;
      say(m.keyError);
      return;
    }
    if (priorityField.refused()) {
      say(m.priorityError);
      return;
    }
    key = /** @type {number} */ (draft);
    if (ops.length >= MAX_TREAP_OPS) {
      say(m.treapLogFull);
      return;
    }
    if (
      type === 'insert' &&
      finalFrame.size >= MAX_TREAP_KEYS &&
      !treapKeys(finalFrame).includes(key)
    ) {
      say(m.treapFull);
      return;
    }
    notice = { text: '', at: -1 };
    preset = '';
    const priority = validPriority(priorityDraft)
      ? /** @type {number} */ (priorityDraft)
      : Math.floor(Math.random() * (MAX_PRIORITY + 1));
    /** @type {TreapOp[]} */
    const next = [...ops, type === 'insert' ? { type, key, priority } : { type, key }];
    const frames = treapTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {TreapOp[]} next @param {boolean} toEnd */
  function setOps(next, toEnd) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = treapTrace(next);
    player.load(frames);
    if (toEnd) player.seek(frames.length - 1);
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), true);
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    setOps([], false);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {typeof PRESETS[number]} */ (e.currentTarget.value);
    setOps(makeTreapOps(picked, Math.random), false);
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {string | number} id */
  function pick(id) {
    const k = frame.nodes[/** @type {number} */ (id)].key;
    if (k === null) return;
    draft = k;
    key = k;
  }

  /** @param {number} slot @returns {Role | null} */
  function roleOf(slot) {
    const f = frame;
    if (f.kind === 'rotate-up') {
      if (slot === f.current) return 'up';
      if (slot === f.other) return 'down';
    }
    if (f.kind === 'rotate-down') {
      if (slot === f.other) return 'up';
      if (slot === f.current) return 'down';
    }
    if (f.kind === 'attach' && slot === f.current) return 'added';
    if (f.kind === 'heap-ok' && slot === f.current) return 'ok';
    if (f.current === slot && ['visit', 'go-left', 'go-right', 'found', 'dup'].includes(f.kind))
      return 'compare';
    return f.path.includes(slot) ? 'path' : null;
  }

  /** @param {number} slot @returns {TreeNode | null} */
  function toTree(slot) {
    if (slot === -1) return null;
    const n = frame.nodes[slot];
    const role = roleOf(slot);
    return {
      id: slot,
      label: String(n.key),
      state: role ? ROLE_STATE[role] : '',
      marker: role && role !== 'path' ? m.markers[role] : '',
      note: m.priorityNote(n.priority),
      children: [toTree(n.left), toTree(n.right)],
    };
  }

  const roots = $derived.by(() => {
    const t = toTree(frame.root);
    return t ? [t] : [];
  });
  const keys = $derived(treapKeys(frame));
  const chips = $derived(
    ops.map((op, i) => ({ label: m.treapOpChip(op), hot: i === frame.opIndex })),
  );
  const stats = $derived([
    ['comparisons', m.treapStats.comparisons, frame.comparisons],
    ['op-rotations', m.treapStats.opRotations, frame.opRotations],
    ['rotations', m.treapStats.rotations, frame.rotations],
    ['height', m.treapStats.height, frame.height],
  ]);

  /** @param {TreeNode} node */
  function labelOf(node) {
    const role = roleOf(/** @type {number} */ (node.id));
    return m.treapNodeLabel(node.label, node.note ?? '', role ? m.treapRoles[role] : '');
  }
</script>

<!-- Enter in the key field submits the form, which inserts; the other buttons never submit. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
  onkeydown={(e) => enterField(e, { key: () => add('insert'), priority: () => add('insert') })}
  class="mb-4 flex flex-wrap items-end gap-4"
  onsubmit={(e) => {
    e.preventDefault();
    add('insert');
  }}
>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.keyLabel}
    <input
      type="number"
      name="key"
      min={MIN_KEY}
      max={MAX_KEY}
      step="1"
      class="field w-24"
      bind:value={draft}
      onchange={commitKey}
    />
  </label>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.priorityLabel}
    <input
      type="number"
      name="priority"
      min={MIN_PRIORITY}
      max={MAX_PRIORITY}
      step="1"
      class="field w-32"
      bind:value={priorityDraft}
      onchange={commitPriority}
    />
  </label>
  <div class="flex flex-wrap gap-2">
    <button type="submit" class="btn-primary">{m.insert}</button>
    <button type="button" onclick={() => add('search')} class="btn-secondary">{m.search}</button>
    <button type="button" onclick={() => add('delete')} class="btn-outline">{m.remove}</button>
  </div>
  <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the log empties. -->
  <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
    <button type="button" onclick={undo} class="btn-outline" aria-disabled={ops.length === 0}
      >{m.undo}</button
    >
    <button type="button" onclick={reset} class="btn-outline" aria-disabled={ops.length === 0}
      >{m.reset}</button
    >
  </div>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.presetLabel}
    <select name="preset" class="field" value={preset} onchange={loadPreset}>
      <option value="" disabled>{m.presetPlaceholder}</option>
      {#each PRESETS as p (p)}
        <option value={p}>{m.treapPresets[p]}</option>
      {/each}
    </select>
  </label>
</form>

<div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
  <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <TreeView
        {roots}
        binary
        ariaLabel={m.treapLabel(keys, frame.height)}
        {labelOf}
        onselect={pick}
        emptyText={m.treapEmpty}
        speed={player.speed}
      />
      <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {#each LEGEND as l (l)}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"
            ></span>
            {m.legendTreap[l]}
          </li>
        {/each}
      </ul>
    </div>
    <p
      class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
      aria-live={player.playing ? 'off' : 'polite'}
    >
      {narration}
    </p>
  </div>

  <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
    <dl class="grid grid-cols-2 gap-3">
      {#each stats as [id, label, value] (id)}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{label}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
        </div>
      {/each}
      <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.treapStats.size}</dt>
        <dd class="text-2xl font-bold tabular-nums" data-testid="size">{frame.size}</dd>
      </div>
    </dl>
    <p class="text-sm text-slate-600">{m.treapNote(frame.size)}</p>
    <ChipList
      title={m.opsTitle}
      items={chips}
      emptyText={m.opsEmpty}
      limit={MAX_TREAP_OPS}
      hotLabel={m.opsHotLabel}
    />
    <CodePanel lines={treapPseudocode} active={frame.lines} />
  </div>
  <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
    {@render controls()}
  </div>
</div>
