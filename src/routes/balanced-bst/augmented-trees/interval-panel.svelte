<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG, STATE_FILL, stateStroke } from '$lib/components/visual-state.js';
  import {
    MAX_INTERVALS,
    MAX_KEY,
    MAX_OPS,
    MIN_KEY,
    inorderSlots,
    intervalPseudocode,
    intervalTrace,
    makeIntervalOps,
  } from '$lib/algo-engine/augmented-trees.js';
  import { en as m } from '$lib/lessons/augmented-trees/copy.en.js';
  import { LEGEND, QUERY_TYPES, ROLE_STATE, roleOf } from './node-roles.js';

  /** @typedef {import('$lib/algo-engine/augmented-trees.js').IntervalOp} IntervalOp */
  /** @typedef {import('$lib/algo-engine/augmented-trees.js').AugFrame} AugFrame */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */

  /**
   * The interval half of the lesson: a tree ordered by low endpoint, each node storing the
   * largest high endpoint of its subtree, with the same intervals drawn on a number line.
   * @type {{
   *   player: ReturnType<typeof import('$lib/player/player.svelte.js').createPlayer<AugFrame>>,
   *   ops: IntervalOp[],
   *   preset: string,
   *   controls: import('svelte').Snippet,
   * }}
   */
  let { player, ops = $bindable(), preset = $bindable(), controls } = $props();

  const PRESETS = /** @type {const} */ (['textbook', 'long', 'rotations', 'random']);

  // Number line drawing: one row per interval, 6 units per value.
  const LINE_LEFT = 12;
  const LINE_UNIT = 6;
  const LINE_ROW = 20;
  const LINE_TOP = 18;

  // Drafts follow the inputs as the learner types; `low` and `high` are the last pair used.
  let low = $state(22);
  let high = $state(25);
  /** @type {number | null} */
  let lowDraft = $state(22);
  /** @type {number | null} */
  let highDraft = $state(25);
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describeInterval(frame));
  const inOrder = $derived(inorderSlots(frame));
  const spans = $derived(inOrder.map((s) => m.span(frame.nodes[s].key, frame.nodes[s].high)));
  const query = $derived(
    frame.op && frame.op.type === 'overlap' && 'high' in frame.op
      ? { lo: frame.op.key, hi: frame.op.high }
      : null,
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validEnd = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_KEY && v <= MAX_KEY;

  // A pair is only checked when it is used, so moving both ends past each other stays possible.
  function commitLow() {
    if (!validEnd(lowDraft)) lowDraft = low;
  }

  function commitHigh() {
    if (!validEnd(highDraft)) highDraft = high;
  }

  /** @param {IntervalOp['type']} type */
  function add(type) {
    if (!validEnd(lowDraft) || !validEnd(highDraft)) {
      lowDraft = low;
      highDraft = high;
      say(m.keyError);
      return;
    }
    const lo = /** @type {number} */ (lowDraft);
    const hi = /** @type {number} */ (highDraft);
    if (lo > hi) {
      lowDraft = low;
      highDraft = high;
      say(m.orderError);
      return;
    }
    low = lo;
    high = hi;
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    const present = inorderSlots(finalFrame).some(
      (s) => finalFrame.nodes[s].key === lo && finalFrame.nodes[s].high === hi,
    );
    if (type === 'insert' && finalFrame.size >= MAX_INTERVALS && !present) {
      say(m.fullIntervals);
      return;
    }
    notice = { text: '', at: -1 };
    preset = '';
    const next = [...ops, { type, key: lo, high: hi }];
    const frames = intervalTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {IntervalOp[]} next @param {boolean} toEnd */
  function setOps(next, toEnd) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = intervalTrace(next);
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
    setOps(makeIntervalOps(picked, Math.random), false);
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
    const n = frame.nodes[/** @type {number} */ (id)];
    low = n.key;
    high = n.high;
    lowDraft = n.key;
    highDraft = n.high;
  }

  /** @param {number} slot @returns {TreeNode | null} */
  function toTree(slot) {
    if (slot === -1) return null;
    const n = frame.nodes[slot];
    const role = roleOf(frame, slot);
    return {
      id: slot,
      label: m.nodeText(n.key, n.high),
      state: role ? ROLE_STATE[role] : '',
      marker: role ? m.markers[role] : '',
      note: m.maxNote(n.max),
      children: [toTree(n.left), toTree(n.right)],
    };
  }

  const roots = $derived.by(() => {
    const t = toTree(frame.root);
    return t ? [t] : [];
  });
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const answer = $derived(
    frame.answer >= 0
      ? m.span(frame.nodes[frame.answer].key, frame.nodes[frame.answer].high)
      : frame.kind === 'overlap-none'
        ? m.noOverlap
        : m.noAnswer,
  );

  /** @param {TreeNode} node */
  function labelOf(node) {
    const slot = /** @type {number} */ (node.id);
    const n = frame.nodes[slot];
    const role = roleOf(frame, slot);
    return m.nodeLabel(
      `Interval ${m.span(n.key, n.high)}`,
      node.note ?? '',
      role ? m.roles[role] : '',
    );
  }

  /** @param {number} v */
  const lineX = (v) => LINE_LEFT + v * LINE_UNIT;
  const lineHeight = $derived(LINE_TOP + Math.max(1, inOrder.length) * LINE_ROW + 4);
</script>

<!-- Enter in a field submits the form, which inserts; the other buttons never submit. -->
<form
  class="mb-4 flex flex-wrap items-end gap-4"
  onsubmit={(e) => {
    e.preventDefault();
    add('insert');
  }}
>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.lowLabel}
    <input
      type="number"
      name="low"
      min={MIN_KEY}
      max={MAX_KEY}
      step="1"
      class="field w-20"
      bind:value={lowDraft}
      onchange={commitLow}
    />
  </label>
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.highLabel}
    <input
      type="number"
      name="high"
      min={MIN_KEY}
      max={MAX_KEY}
      step="1"
      class="field w-20"
      bind:value={highDraft}
      onchange={commitHigh}
    />
  </label>
  <div class="flex flex-wrap gap-2">
    <button type="submit" class="btn-primary">{m.insert}</button>
    <button type="button" onclick={() => add('delete')} class="btn-outline">{m.remove}</button>
    <button type="button" onclick={() => add('overlap')} class="btn-secondary">{m.overlap}</button>
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
    <select name="interval-preset" class="field" value={preset} onchange={loadPreset}>
      <option value="" disabled>{m.presetPlaceholder}</option>
      {#each PRESETS as p (p)}
        <option value={p}>{m.intervalPresets[p]}</option>
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
        ariaLabel={m.intervalTreeLabel(spans, frame.height)}
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
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.lineTitle}
      </h2>
      <ScrollFrame>
        <svg
          viewBox="0 0 {LINE_LEFT * 2 + 99 * LINE_UNIT} {lineHeight}"
          role="img"
          aria-label={m.lineLabel(spans, query ? m.span(query.lo, query.hi) : null)}
          class="mx-auto block h-auto w-full"
          style="min-width: 560px"
          data-testid="number-line"
        >
          {#if query}
            <rect
              x={lineX(query.lo) - 2}
              y="12"
              width={(query.hi - query.lo) * LINE_UNIT + 4}
              height={lineHeight - 12}
              class="fill-amber-200"
              stroke-dasharray="4 3"
              stroke="#92400e"
            />
          {/if}
          {#each [0, 25, 50, 75, 99] as tick (tick)}
            <text
              x={lineX(tick)}
              y="8"
              text-anchor="middle"
              font-size="10"
              class="fill-slate-500"
              aria-hidden="true">{tick}</text
            >
          {/each}
          {#each inOrder as slot, i (slot)}
            {@const n = frame.nodes[slot]}
            {@const role = roleOf(frame, slot)}
            {@const state = role ? ROLE_STATE[role] : ''}
            {@const y = LINE_TOP + i * LINE_ROW}
            <!-- The label goes after the bar, before it when the bar nearly reaches the right
                 edge, and inside it when the bar also starts too close to the left edge. -->
            {@const flip = n.high > 75}
            {@const inside = flip && n.key < 12}
            <rect
              x={lineX(n.key)}
              {y}
              width={Math.max((n.high - n.key) * LINE_UNIT, 3)}
              height="12"
              rx="2"
              stroke-width="1.5"
              class="{state ? STATE_FILL[state] : 'fill-slate-200'} {stateStroke(state)}"
            />
            <text
              x={inside ? lineX(n.key) + 4 : flip ? lineX(n.key) - 4 : lineX(n.high) + 6}
              y={y + 10}
              text-anchor={flip && !inside ? 'end' : 'start'}
              font-size="11"
              font-weight={state ? 700 : 400}
              stroke="white"
              stroke-width="3"
              paint-order="stroke"
              class="fill-slate-800"
              aria-hidden="true"
              >{role && m.markers[role] ? `${m.markers[role]} ` : ''}{m.span(n.key, n.high)}</text
            >
          {/each}
        </svg>
      </ScrollFrame>
      {#if query}
        <p class="mt-2 text-xs text-slate-600">
          <span class="mr-1 inline-block size-3 rounded-sm border border-amber-800 bg-amber-200"
          ></span>
          {m.lineQuery}
          {m.span(query.lo, query.hi)}
        </p>
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
      {#each [[m.stats.comparisons, frame.comparisons, 'comparisons'], [m.stats.updates, frame.updates, 'updates'], [m.stats.height, frame.height, 'height'], [m.stats.rotations, frame.rotations, 'rotations'], [m.stats.intervals, frame.size, 'size'], [m.stats.answer, answer, 'answer']] as [label, value, id] (id)}
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
    <CodePanel lines={intervalPseudocode} active={frame.lines} />
  </div>
  <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
    {@render controls()}
  </div>
</div>
