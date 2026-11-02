<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    BNB_PRESETS,
    MAX_ITEMS,
    MAX_NUMBER,
    bnbPseudocode,
    bnbTrace,
    formatItems,
    parseCapacity,
    parseItems,
    plainNodeCount,
  } from '$lib/algo-engine/branch-and-bound.js';
  import { en as m } from '$lib/lessons/branch-and-bound/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/branch-and-bound.js').SearchOrder} SearchOrder */
  /** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbFrame} BnbFrame */
  /** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbStatus} BnbStatus */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const ORDERS = /** @type {SearchOrder[]} */ (['best', 'depth']);
  const FIRST = BNB_PRESETS[0];

  let order = $state(/** @type {SearchOrder} */ ('best'));
  let items = $state(FIRST.items);
  let capacity = $state(FIRST.capacity);
  let preset = $state(FIRST.key);
  let itemsText = $state(formatItems(FIRST.items));
  let capacityText = $state(String(FIRST.capacity));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(bnbTrace(FIRST.items, FIRST.capacity, 'best'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(bnbTrace($state.snapshot(items), capacity, order));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = BNB_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    items = p.items;
    capacity = p.capacity;
    itemsText = formatItems(p.items);
    capacityText = String(p.capacity);
    rebuild();
  }

  function commitItems() {
    const next = parseItems(itemsText);
    if (next === null) {
      itemsText = formatItems($state.snapshot(items));
      notice = { text: m.itemsError(MAX_ITEMS, MAX_NUMBER), at: player.index };
      return;
    }
    itemsText = formatItems(next);
    if (itemsText === formatItems($state.snapshot(items))) return;
    items = next;
    preset = '';
    rebuild();
  }

  function commitCapacity() {
    const next = parseCapacity(capacityText);
    if (next === null) {
      capacityText = String(capacity);
      notice = { text: m.capacityError(MAX_NUMBER), at: player.index };
      return;
    }
    capacityText = String(next);
    if (next === capacity) return;
    capacity = next;
    preset = '';
    rebuild();
  }

  /** @param {string | number} id */
  function seekNode(id) {
    const at = player.frames.findIndex((f) => f.nodes.some((n) => n.id === id));
    if (at < 0) return;
    player.pause();
    player.seek(at);
  }

  /** @type {Record<BnbStatus, VisualState>} */
  const STATUS_STATE = {
    active: 'active',
    frontier: 'frontier',
    expanded: 'visited',
    pruned: 'pruned',
    over: '',
  };

  /** The ids on the path from the root to the best node. @param {BnbFrame} f */
  function bestPath(f) {
    /** @type {number[]} */
    const path = [];
    for (let id = f.bestNode; id >= 0; id = f.nodes[id].parent) path.push(id);
    return path;
  }

  /** @param {BnbFrame} f @returns {TreeNode[]} */
  function forest(f) {
    const onPath = new Set(f.kind === 'done' ? bestPath(f) : []);
    // A node's id is its index, so the array finds a parent directly.
    /** @type {TreeNode[]} */
    const built = f.nodes.map((n) => {
      let marker = '';
      if (n.id === f.bestNode && f.best > 0) marker = m.markers.best;
      else if (n.status === 'pruned') marker = m.markers.pruned;
      else if (n.status === 'over') marker = m.markers.over;
      return {
        id: n.id,
        label: String(n.value),
        children: [null, null],
        state: onPath.has(n.id) ? 'path' : STATUS_STATE[n.status],
        marker,
        note: n.status === 'over' ? m.overNote : m.boundNote(n.bound),
        edgeLabel: n.parent < 0 ? '' : m.edge(f.items[n.level - 1], n.took),
      };
    });
    for (const n of f.nodes) {
      const kids = built[n.parent]?.children;
      if (kids) kids[n.took ? 0 : 1] = built[n.id];
    }
    return built.slice(0, 1);
  }

  /** The items of the best packing, in the order they were decided. @param {BnbFrame} f */
  function packing(f) {
    return bestPath(f)
      .reverse()
      .filter((id) => f.nodes[id].took)
      .map((id) => f.items[f.nodes[id].level - 1].name);
  }

  const roots = $derived(forest(frame));
  const nodeById = $derived(new Map(frame.nodes.map((n) => [n.id, n])));
  const plain = $derived(plainNodeCount($state.snapshot(items), capacity));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.active],
    ['frontier', m.legend.frontier],
    ['visited', m.legend.expanded],
    ['path', m.legend.path],
    ['pruned', `${m.markers.pruned} ${m.legend.pruned}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitItems();
      commitCapacity();
    }}
  >
    <SegmentedControl
      legend={m.orderLabel}
      name="order"
      options={ORDERS.map((v) => ({ value: v, label: m.orders[v] }))}
      bind:value={order}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.itemsLabel}
      <input
        type="text"
        name="items"
        class="field w-64 max-w-full font-mono"
        bind:value={itemsText}
        onchange={commitItems}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.capacityLabel}
      <input
        type="text"
        inputmode="numeric"
        name="capacity"
        class="field w-20 font-mono"
        bind:value={capacityText}
        onchange={commitCapacity}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each BNB_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm text-slate-700">{m.problem(frame.capacity)}</p>
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.itemsTitle}</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm tabular-nums" data-testid="items">
            <thead class="text-xs text-slate-500">
              <tr>
                <th scope="col" class="pr-3 font-medium">{m.itemHead.name}</th>
                <th scope="col" class="pr-3 font-medium">{m.itemHead.weight}</th>
                <th scope="col" class="pr-3 font-medium">{m.itemHead.value}</th>
                <th scope="col" class="font-medium">{m.itemHead.ratio}</th>
              </tr>
            </thead>
            <tbody>
              {#each frame.items as item (item.name)}
                <tr>
                  <th scope="row" class="pr-3 font-semibold">{item.name}</th>
                  <td class="pr-3">{item.weight}</td>
                  <td class="pr-3">{item.value}</td>
                  <td>{m.ratio(item.value / item.weight)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.treeTitle}</h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria}
          labelOf={(node) => {
            const n = nodeById.get(/** @type {number} */ (node.id));
            return n ? m.nodeLabel(n) : node.label;
          }}
          onselect={seekNode}
          selected={frame.current < 0 ? null : frame.current}
          speed={player.speed}
        />
        <p class="text-xs text-slate-600">{m.treeNote}</p>
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
          <li>{m.markers.best} {m.legend.best}</li>
        </ul>
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.best}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="best">{frame.best}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.made}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="made">{frame.nodes.length}</dd>
          <dd class="text-xs text-slate-600" data-testid="plain">{m.plainNote(plain)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.expanded}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="expanded">{frame.expanded}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pruned}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pruned">{frame.pruned}</dd>
        </div>
      </dl>
      <ChipList
        title={m.frontierTitle}
        emptyText={m.frontierEmpty}
        items={frame.frontier.map((id, i) => ({
          label: m.frontierChip(frame.nodes[id]),
          hot: i === 0,
        }))}
      />
      <ChipList
        title={m.packingTitle}
        emptyText={m.packingEmpty}
        items={packing(frame).map((name) => ({ label: name }))}
      />
      <CodePanel lines={bnbPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
