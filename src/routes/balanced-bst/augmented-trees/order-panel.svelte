<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_KEY,
    MAX_KEYS,
    MAX_OPS,
    MIN_KEY,
    inorderSlots,
    makeOrderOps,
    orderPseudocode,
    orderTrace,
  } from '$lib/algo-engine/augmented-trees.js';
  import { en as m } from '$lib/lessons/augmented-trees/copy.en.js';
  import { LEGEND, QUERY_TYPES, ROLE_STATE, roleOf } from './node-roles.js';

  /** @typedef {import('$lib/algo-engine/augmented-trees.js').OrderOp} OrderOp */
  /** @typedef {import('$lib/algo-engine/augmented-trees.js').AugFrame} AugFrame */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */

  /**
   * The subtree-size half of the lesson. The page owns the player, the log and the preset so they
   * survive a switch to the interval tree and back.
   * @type {{
   *   player: ReturnType<typeof import('$lib/player/player.svelte.js').createPlayer<AugFrame>>,
   *   ops: OrderOp[],
   *   preset: string,
   *   controls: import('svelte').Snippet,
   * }}
   */
  let { player, ops = $bindable(), preset = $bindable(), controls } = $props();

  const PRESETS = /** @type {const} */ (['queries', 'rotations', 'scores', 'random']);

  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(45);
  /** @type {number | null} */
  let draft = $state(45);
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describeOrder(frame));
  const sorted = $derived(inorderSlots(frame));
  const isQuery = $derived(frame.op !== null && QUERY_TYPES.has(frame.op.type));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validKey = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_KEY && v <= MAX_KEY;

  function commitKey() {
    if (validKey(draft)) key = /** @type {number} */ (draft);
    else draft = key;
  }

  /** @param {OrderOp['type']} type */
  function add(type) {
    if (!validKey(draft)) {
      draft = key;
      say(m.keyError);
      return;
    }
    key = /** @type {number} */ (draft);
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    const present = inorderSlots(finalFrame).some((s) => finalFrame.nodes[s].key === key);
    if (type === 'insert' && finalFrame.size >= MAX_KEYS && !present) {
      say(m.fullKeys);
      return;
    }
    notice = { text: '', at: -1 };
    preset = '';
    const next = [...ops, { type, key }];
    const frames = orderTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {OrderOp[]} next @param {boolean} toEnd */
  function setOps(next, toEnd) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = orderTrace(next);
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
    setOps(makeOrderOps(picked, Math.random), false);
    // The sorted preset is about its rotations; the others are about their queries.
    if (picked !== 'rotations') {
      player.seek(player.frames.findIndex((f) => f.op !== null && QUERY_TYPES.has(f.op.type)));
    }
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {string | number} id */
  function pick(id) {
    const k = frame.nodes[/** @type {number} */ (id)].key;
    draft = k;
    key = k;
  }

  /** @param {number} slot @returns {TreeNode | null} */
  function toTree(slot) {
    if (slot === -1) return null;
    const n = frame.nodes[slot];
    const role = roleOf(frame, slot);
    return {
      id: slot,
      label: String(n.key),
      state: role ? ROLE_STATE[role] : '',
      marker: role ? m.markers[role] : '',
      note: m.sizeNote(n.size),
      children: [toTree(n.left), toTree(n.right)],
    };
  }

  const roots = $derived.by(() => {
    const t = toTree(frame.root);
    return t ? [t] : [];
  });
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const answer = $derived(frame.result === null ? m.noAnswer : String(frame.result));

  /** @param {TreeNode} node */
  function labelOf(node) {
    const role = roleOf(frame, /** @type {number} */ (node.id));
    return m.nodeLabel(`Key ${node.label}`, node.note ?? '', role ? m.roles[role] : '');
  }

  const windows = $derived(
    isQuery && frame.counted > 0 ? [{ from: 0, to: frame.counted, label: m.countedLabel }] : [],
  );
  // The walk's position in the sorted order, or the gap a missing key would fill.
  const pointers = $derived.by(() => {
    if (frame.kind === 'rank-missing') return [{ name: m.pointerGap, index: frame.counted }];
    const at = isQuery && frame.current >= 0 ? sorted.indexOf(frame.current) : -1;
    return at >= 0 ? [{ name: m.pointerX, index: at }] : [];
  });

  /** @param {number} i */
  function stripState(i) {
    const slot = sorted[i];
    if (!isQuery) return '';
    if (slot === frame.answer) return 'sorted';
    if (slot === frame.current) return 'compare';
    return i < frame.counted ? 'visited' : '';
  }

  /** @param {number} i */
  function stripLabel(i) {
    const state = stripState(i);
    return m.sortedCell(
      i + 1,
      frame.nodes[sorted[i]].key,
      state === 'sorted'
        ? m.roles.answer
        : state === 'compare'
          ? m.roles.compare
          : state === 'visited'
            ? m.countedLabel
            : '',
    );
  }
</script>

<!-- Enter in the key field submits the form, which inserts; the other buttons never submit. -->
<form
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
  <div class="flex flex-wrap gap-2">
    <button type="submit" class="btn-primary">{m.insert}</button>
    <button type="button" onclick={() => add('delete')} class="btn-outline">{m.remove}</button>
    <button type="button" onclick={() => add('rank')} class="btn-secondary">{m.rank}</button>
    <button type="button" onclick={() => add('select')} class="btn-secondary">{m.select}</button>
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
    <select name="order-preset" class="field" value={preset} onchange={loadPreset}>
      <option value="" disabled>{m.presetPlaceholder}</option>
      {#each PRESETS as p (p)}
        <option value={p}>{m.orderPresets[p]}</option>
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
        ariaLabel={m.treeLabel(
          sorted.map((s) => frame.nodes[s].key),
          frame.height,
        )}
        {labelOf}
        onselect={pick}
        emptyText={m.emptyTree}
        speed={player.speed}
      />
      <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {#each LEGEND as l (l)}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"
            ></span>
            {m.markers[l] ? `${m.markers[l]} ${m.roles[l]}` : m.roles[l]}
          </li>
        {/each}
      </ul>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-4" data-testid="sorted-card">
      <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.sortedTitle}
      </h2>
      <p class="mb-2 text-sm text-slate-600">{m.sortedNote}</p>
      {#if sorted.length > 0}
        <ArrayStrip
          values={sorted.map((s) => frame.nodes[s].key)}
          ariaLabel={m.sortedLabel(sorted.map((s) => frame.nodes[s].key))}
          stateOf={stripState}
          markerOf={(i) => String(i + 1)}
          labelOf={stripLabel}
          showIndices={false}
          {windows}
          {pointers}
          speed={player.speed}
        />
      {:else}
        <p class="text-sm text-slate-500">{m.emptyTree}</p>
      {/if}
    </div>
    <p
      class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
      aria-live={player.playing ? 'off' : 'polite'}
    >
      {narration}
    </p>
  </div>

  <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
    <dl class="grid grid-cols-2 gap-3">
      {#each [[m.stats.comparisons, frame.comparisons, 'comparisons'], [m.stats.updates, frame.updates, 'updates'], [m.stats.height, frame.height, 'height'], [m.stats.rotations, frame.rotations, 'rotations'], [m.stats.keys, frame.size, 'size'], [m.stats.answer, answer, 'answer']] as [label, value, id] (id)}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{label}</dt>
          <dd class="truncate text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
        </div>
      {/each}
    </dl>
    <ChipList
      title={m.opsTitle}
      items={chips}
      emptyText={m.opsEmpty}
      limit={MAX_OPS}
      hotLabel={m.opsHotLabel}
    />
    <CodePanel lines={orderPseudocode} active={frame.lines} />
  </div>
  <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
    {@render controls()}
  </div>
</div>
