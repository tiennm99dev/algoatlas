<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    ORDERS,
    PRESETS,
    PRESET_TEXT,
    formatTree,
    parseTree,
    traversalOrder,
    traversalPseudocode,
    traversalTrace,
  } from '$lib/algo-engine/tree-traversals.js';
  import { en as m } from '$lib/lessons/tree-traversals/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/tree-traversals.js').Slots} Slots */
  /** @typedef {import('$lib/algo-engine/tree-traversals.js').TraversalOrder} TraversalOrder */
  /** @typedef {import('$lib/algo-engine/tree-traversals.js').TraversalPreset} TraversalPreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = /** @type {{ slots: Slots }} */ (parseTree(PRESET_TEXT.letters)).slots;
  /** @type {Slots} */
  let slots = $state.raw(INITIAL);
  let text = $state(formatTree(INITIAL));
  let order = $state(/** @type {TraversalOrder} */ ('pre'));
  let preset = $state('letters');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(traversalTrace(INITIAL, 'pre'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, slots));
  const total = $derived(slots.filter((s) => s !== null).length);

  /** @param {string} t */
  function say(t) {
    notice = { text: t, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(traversalTrace(slots, order));
  }

  function commitTree() {
    const r = parseTree(text);
    if ('error' in r) {
      text = formatTree(slots);
      say(m.treeErrors[r.error]);
      return;
    }
    slots = r.slots;
    text = formatTree(r.slots);
    preset = '';
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {TraversalPreset} */ (e.currentTarget.value);
    slots = /** @type {{ slots: Slots }} */ (parseTree(PRESET_TEXT[picked])).slots;
    text = formatTree(slots);
    preset = picked;
    rebuild();
  }

  const waiting = $derived(new Set(frame.work.map((w) => w.slot)));

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (i === frame.current && frame.kind !== 'done') return 'active';
    if (frame.number[i] !== null) return 'visited';
    if (waiting.has(i)) return 'frontier';
    return '';
  }

  /** @param {number} i @returns {TreeNode | null} */
  function build(i) {
    if (i >= slots.length || slots[i] === null) return null;
    const s = stateOf(i);
    const n = frame.number[i];
    const kids = [build(2 * i + 1), build(2 * i + 2)];
    return {
      id: i,
      label: String(slots[i]),
      state: s,
      marker:
        n !== null
          ? String(n)
          : s === 'active'
            ? m.markers.active
            : s === 'frontier'
              ? m.markers.frontier
              : '',
      children: kids.some(Boolean) ? kids : [],
    };
  }

  const roots = $derived.by(() => {
    const r = build(0);
    return r ? [r] : [];
  });

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const i = Number(node.id);
    const s = stateOf(i);
    return m.nodeLabel(
      node.label,
      frame.number[i],
      s === 'active' || s === 'frontier' ? m.states[s] : '',
    );
  }

  const workItems = $derived(
    frame.work.map((w) => ({
      label: m.workItem(String(slots[w.slot]), w.visit),
      state: /** @type {VisualState} */ (w.visit ? 'frontier' : ''),
    })),
  );

  const outputChips = $derived(
    frame.output.map((i, k, all) => ({
      label: String(slots[i]),
      hot: k === all.length - 1 && frame.kind === 'visit',
    })),
  );

  const visitedLabels = $derived(frame.output.map((i) => String(slots[i])));

  const allOrders = $derived(
    ORDERS.map((o) => ({
      o,
      seq: traversalOrder(slots, o)
        .map((i) => slots[i])
        .join(' '),
    })),
  );

  const stats = $derived([
    [m.stats.visited, m.ofTotal(frame.output.length, total), 'visited'],
    [m.stats.peak, String(frame.peak), 'peak'],
    [m.stats.pushes, String(frame.pushes), 'pushes'],
    [m.stats.pops, String(frame.pops), 'pops'],
  ]);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.active} ${m.legend.active}`],
    ['frontier', `${m.markers.frontier} ${m.legend.frontier}`],
    ['visited', `1 2 3 ${m.legend.visited}`],
    ['', m.legend.idle],
  ]);

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitTree();
    }}
  >
    <SegmentedControl
      legend={m.orderLabel}
      name="order"
      options={ORDERS.map((o) => ({ value: o, label: m.orders[o] }))}
      bind:value={order}
      onchange={rebuild}
    />
    <label class={labelClass}>
      {m.treeLabel}
      <input
        type="text"
        name="tree"
        class="field w-72 max-w-full"
        bind:value={text}
        onchange={commitTree}
      />
    </label>
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria(visitedLabels, total)}
          labelOf={nodeLabel}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (label)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.workTitle(order)}
        </h2>
        <StackQueueView
          kind={order === 'level' ? 'queue' : 'stack'}
          items={workItems}
          ariaLabel={m.workAria(
            order,
            workItems.map((w) => w.label),
          )}
          speed={player.speed}
        />
        {#if order !== 'level'}
          <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG['']}"></span>{m
                .workLegend.expand}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.frontier}"></span>{m
                .workLegend.visit}
            </li>
          </ul>
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
        {#each stats as [label, value, id] (id)}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="truncate text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <ChipList title={m.outputTitle} items={outputChips} emptyText={m.outputEmpty} limit={15} />
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.allTitle}</h2>
        {#if frame.kind === 'done'}
          <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm" data-testid="all-orders">
            {#each allOrders as row (row.o)}
              <dt class="font-medium {row.o === order ? 'text-teal-800' : 'text-slate-700'}">
                {m.orders[row.o]}
              </dt>
              <dd class="font-mono break-words text-slate-800">{row.seq}</dd>
            {/each}
          </dl>
        {:else}
          <p class="text-sm text-slate-500">{m.allHidden}</p>
        {/if}
      </div>
      <CodePanel lines={traversalPseudocode[order]} active={frame.lines} />
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.recursiveTitle}</h2>
        <pre class="font-mono text-xs whitespace-pre-wrap text-slate-800">{m.recursive[order].join(
            '\n',
          )}</pre>
      </div>
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
