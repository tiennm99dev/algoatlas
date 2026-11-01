<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    GEN_PRESETS,
    MAX_ITEMS,
    genPseudocode,
    genTrace,
    parseItems,
    parseK,
    plainCount,
  } from '$lib/algo-engine/permutations-subsets.js';
  import { en as m } from '$lib/lessons/permutations-subsets/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenMode} GenMode */
  /** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenNode} GenNode */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const MODES = /** @type {GenMode[]} */ (['perm', 'comb', 'subset']);
  const UNIQUES = /** @type {('on'|'off')[]} */ (['on', 'off']);
  const FIRST = GEN_PRESETS[0];

  let mode = $state(FIRST.mode);
  let unique = $state(/** @type {'on'|'off'} */ ('off'));
  let items = $state(FIRST.items);
  let k = $state(FIRST.k);
  let preset = $state(FIRST.key);
  let itemsText = $state(FIRST.items.join(' '));
  let kText = $state(String(FIRST.k));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(genTrace(FIRST.mode, FIRST.items, { k: FIRST.k, unique: false }));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(genTrace(mode, $state.snapshot(items), { k, unique: unique === 'on' }));
  }

  /** A mode with a smaller cap keeps only the items it can take. */
  function changeMode() {
    const max = MAX_ITEMS[mode];
    if (items.length > max) {
      items = items.slice(0, max);
      itemsText = items.join(' ');
    }
    if (k > items.length) {
      k = items.length;
      kText = String(k);
    }
    preset = '';
    rebuild();
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = GEN_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    mode = p.mode;
    items = p.items;
    k = p.k;
    unique = p.key === 'abc' ? 'off' : 'on';
    itemsText = p.items.join(' ');
    kText = String(p.k);
    rebuild();
  }

  function commitItems() {
    const max = MAX_ITEMS[mode];
    const next = parseItems(itemsText, max);
    if (next === null) {
      itemsText = items.join(' ');
      notice = { text: m.itemsError(max), at: player.index };
      return;
    }
    itemsText = next.join(' ');
    if (next.join() === items.join()) return;
    items = next;
    if (k > items.length) {
      k = items.length;
      kText = String(k);
    }
    preset = '';
    rebuild();
  }

  function commitK() {
    const next = parseK(kText, items.length);
    if (next === null) {
      kText = String(k);
      notice = { text: m.kError(items.length), at: player.index };
      return;
    }
    kText = String(next);
    if (next === k) return;
    k = next;
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

  /**
   * @param {GenNode} n @param {number} current
   * @returns {VisualState}
   */
  function stateOfNode(n, current) {
    if (n.id === current) return 'active';
    if (n.open) return 'path';
    return n.output ? 'sorted' : 'visited';
  }

  /** @param {GenNode[]} nodes @param {number} current @returns {TreeNode[]} */
  function forest(nodes, current) {
    // A node's id is its index, so the array finds a parent directly.
    /** @type {(TreeNode & {children: TreeNode[]})[]} */
    const built = nodes.map((n) => ({
      id: n.id,
      label: n.parent < 0 ? m.rootLabel : n.label,
      children: [],
      state: stateOfNode(n, current),
      marker: n.output ? m.outputMark : '',
    }));
    for (const n of nodes) built[n.parent]?.children.push(built[n.id]);
    return built.slice(0, 1);
  }

  const roots = $derived(forest(frame.nodes, frame.current));
  const nodeById = $derived(new Map(frame.nodes.map((n) => [n.id, n])));
  const positions = $derived(new Map(frame.path.map((at, i) => [at, i])));
  const count = $derived(plainCount(frame.mode, frame.items.length, frame.k));
  const results = $derived(
    frame.outputs.map((s, i) => ({
      label: m.output(s),
      hot: frame.kind === 'emit' && i === frame.outputs.length - 1,
    })),
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.active],
    ['path', m.legend.open],
    ['visited', m.legend.finished],
    ['sorted', `${m.outputMark} ${m.legend.output}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitItems();
      commitK();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
      onchange={changeMode}
    />
    <SegmentedControl
      legend={m.uniqueLabel}
      name="unique"
      options={UNIQUES.map((v) => ({ value: v, label: m.uniques[v] }))}
      bind:value={unique}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.itemsLabel}
      <input
        type="text"
        name="items"
        class="field w-32 font-mono"
        bind:value={itemsText}
        onchange={commitItems}
      />
    </label>
    {#if mode === 'comb'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.kLabel}
        <input
          type="text"
          inputmode="numeric"
          name="k"
          class="field w-16 font-mono"
          bind:value={kText}
          onchange={commitK}
        />
      </label>
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each GEN_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.itemsTitle}
        </h2>
        <ArrayStrip
          values={frame.items}
          ariaLabel={m.itemsAria}
          stateOf={(i) => (i === frame.at ? 'active' : positions.has(i) ? 'path' : '')}
          markerOf={(i) => {
            const at = positions.get(i);
            return at === undefined ? '' : String(at + 1);
          }}
          labelOf={(i) => m.itemCell(i, frame.items[i], positions.has(i))}
          speed={player.speed}
        />
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{m.treeTitle}</h2>
        <TreeView
          {roots}
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
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.results}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="results">
            {frame.outputs.length}
          </dd>
          <dd class="text-xs text-slate-600" data-testid="count">
            {m.countNote(frame.mode, count)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="calls">{frame.calls}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.copied}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="copied">{frame.copied}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.skipped}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="skipped">{frame.skipped}</dd>
        </div>
      </dl>
      <ChipList
        title={m.pathTitle}
        emptyText={m.pathEmpty}
        items={frame.path.map((at) => ({ label: frame.items[at] }))}
      />
      <ChipList
        title={m.resultsTitle}
        emptyText={m.resultsEmpty}
        limit={32}
        hotLabel={m.legend.active}
        items={results}
      />
      <CodePanel lines={genPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
