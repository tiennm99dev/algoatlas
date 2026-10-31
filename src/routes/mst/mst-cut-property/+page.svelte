<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    adjacency,
    cutPseudocode,
    cutTrace,
    cyclePseudocode,
    cycleTrace,
    minimumSpanningForest,
  } from '$lib/algo-engine/mst-cut-property.js';
  import { en as m } from '$lib/lessons/mst-cut-property/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/mst-cut-property.js').CutFrame} CutFrame */
  /** @typedef {import('$lib/algo-engine/mst-cut-property.js').CycleFrame} CycleFrame */
  /** @typedef {'cut' | 'cycle'} Mode */

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 50, y: 150, label: 'A' },
    { id: 1, x: 170, y: 55, label: 'B' },
    { id: 2, x: 170, y: 245, label: 'C' },
    { id: 3, x: 300, y: 110, label: 'D' },
    { id: 4, x: 320, y: 250, label: 'E' },
    { id: 5, x: 435, y: 160, label: 'F' },
  ];
  /** @type {GraphEdge[]} */
  const DEFAULT_EDGES = [
    { from: 0, to: 1, weight: 3 },
    { from: 0, to: 2, weight: 4 },
    { from: 1, to: 2, weight: 2 },
    { from: 1, to: 3, weight: 5 },
    { from: 2, to: 3, weight: 6 },
    { from: 2, to: 4, weight: 8 },
    { from: 3, to: 4, weight: 7 },
    { from: 3, to: 5, weight: 9 },
    { from: 4, to: 5, weight: 1 },
  ];
  const DEFAULT_SIDE = [0, 1, 2];
  const DEFAULT_TEST = 4;

  let mode = $state(/** @type {Mode} */ ('cut'));
  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  /** Vertex ids on side S of the cut. */
  let sideIds = $state.raw(DEFAULT_SIDE);
  let testEdge = $state(DEFAULT_TEST);
  let showMst = $state(false);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const side = $derived(order.map((id) => sideIds.includes(id)));
  const info = $derived(adjacency(order, edges).list);
  const mst = $derived(minimumSpanningForest(order, edges));
  const mstSet = $derived(new Set(mst.tree));

  /** @returns {(CutFrame | CycleFrame)[]} */
  const build = () =>
    mode === 'cut'
      ? cutTrace({ ids: order, edges, side })
      : cycleTrace({ ids: order, edges, edge: testEdge });
  const player = createPlayer(build());
  /** The mode the loaded trace was built for; `mode` can change a moment before the rebuild. */
  let traced = $state(/** @type {Mode} */ ('cut'));
  const cutFrame = $derived(traced === 'cut' ? /** @type {CutFrame} */ (player.frame) : null);
  const cycleFrame = $derived(traced === 'cycle' ? /** @type {CycleFrame} */ (player.frame) : null);
  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : cutFrame
        ? m.describeCut(cutFrame, names, info, side)
        : cycleFrame
          ? m.describeCycle(cycleFrame, names, info)
          : '',
  );

  let built = graphShape(DEFAULT_NODES, DEFAULT_EDGES);

  function rebuild() {
    built = graphShape(nodes, edges);
    notice = { text: '', at: -1 };
    player.load(build());
    traced = mode;
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    sideIds = sideIds.filter((id) => nodes.some((n) => n.id === id));
    if (testEdge >= edges.length) testEdge = Math.max(0, edges.length - 1);
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built) rebuild();
  }

  /** @param {number} id */
  function flip(id) {
    if (mode !== 'cut') return;
    sideIds = sideIds.includes(id) ? sideIds.filter((x) => x !== id) : [...sideIds, id];
    rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    sideIds = DEFAULT_SIDE;
    testEdge = DEFAULT_TEST;
    rebuild();
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || w < 1 || w > MAX_WEIGHT) {
      e.currentTarget.value = String(edges[k].weight ?? 1);
      notice = { text: m.badWeight(MAX_WEIGHT), at: player.index };
      return;
    }
    edges = edges.map((x, i) => (i === k ? { ...x, weight: w } : x));
    rebuild();
  }

  /** @param {GraphEdge} e */
  const edgeName = (e) =>
    `${names[order.indexOf(e.from)] ?? e.from} — ${names[order.indexOf(e.to)] ?? e.to}`;

  const pathSet = $derived(new Set(cycleFrame?.path ?? []));
  const queueSet = $derived(new Set(cycleFrame?.queue ?? []));

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (cutFrame) return side[i] ? 'frontier' : '';
    const f = /** @type {CycleFrame} */ (cycleFrame);
    if (pathSet.has(i)) return 'path';
    if (f.kind !== 'done' && i === f.current) return 'active';
    if (queueSet.has(i)) return 'frontier';
    if (f.reached[i]) return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    if (cutFrame) return side[i] ? m.states.sideS : m.states.other;
    const f = /** @type {CycleFrame} */ (cycleFrame);
    const parts = [];
    if (i === f.a) parts.push(m.states.a);
    if (i === f.b) parts.push(m.states.b);
    const s = stateAt(i);
    if (s === 'path') parts.push(m.states.path);
    else if (s === 'active') parts.push(m.states.current);
    else if (s === 'frontier') parts.push(m.states.queued);
    else if (s === 'visited') parts.push(m.states.reached);
    return parts.join(', ');
  }

  /** @param {number} id */
  function markerOf(id) {
    const i = order.indexOf(id);
    if (cutFrame) return side[i] ? 'S' : '';
    if (i === cycleFrame?.a) return 'a';
    if (i === cycleFrame?.b) return 'b';
    return '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    // The overlay replaces the step colours, so no colour means two things at once.
    if (showMst) return mstSet.has(k) ? 'sorted' : '';
    if (cutFrame) {
      if (k === cutFrame.edge) return 'active';
      if (k === cutFrame.best) return 'sorted';
      if (cutFrame.crossing.includes(k)) return 'compare';
    } else if (cycleFrame) {
      const f = cycleFrame;
      if (k === f.target) return 'swap';
      if (k === f.edge && f.kind !== 'done') return 'active';
      const a = order.indexOf(e.from);
      const b = order.indexOf(e.to);
      const onPath = f.path.some((v, j) => {
        const next = f.path[j + 1];
        return (v === a && next === b) || (v === b && next === a);
      });
      if (onPath) return 'path';
      if (f.parent[b] === a || f.parent[a] === b) return 'visited';
    }
    return '';
  }

  const crossingItems = $derived(
    (cutFrame?.crossing ?? []).map((k) => ({
      label: m.edgeChip(info[k], names),
      hot: k === cutFrame?.best,
    })),
  );
  const queueItems = $derived((cycleFrame?.queue ?? []).map((v) => ({ label: names[v] })));

  const sideLegend = [
    ['bg-state-frontier', m.legend.sideS],
    ['bg-white border border-slate-400', m.legend.other],
  ];
  const cycleLegend = [
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.queued],
    ['bg-state-visited', m.legend.reached],
    ['bg-state-path', m.legend.path],
  ];
  const cutEdgeLegend = [
    ['bg-state-active', m.legend.edgeNow],
    ['bg-state-sorted', m.legend.best],
    ['bg-state-compare', m.legend.crossing],
  ];
  const cycleEdgeLegend = [
    ['bg-state-swap', m.legend.tested],
    ['bg-state-active', m.legend.edgeNow],
    ['bg-state-path', m.legend.path],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={[
        { value: 'cut', label: m.modes.cut },
        { value: 'cycle', label: m.modes.cycle },
      ]}
      bind:value={mode}
      onchange={rebuild}
    />
    {#if mode === 'cycle'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.testLabel}
        <select
          name="test-edge"
          class="field"
          value={testEdge}
          onchange={(e) => {
            testEdge = Number(e.currentTarget.value);
            rebuild();
          }}
        >
          {#each info as e, k (k)}
            <option value={k}>{m.edgeOption(e, names)}</option>
          {/each}
        </select>
      </label>
    {:else}
      <p class="max-w-64 text-sm text-slate-600">{m.cutHelp}</p>
    {/if}
    <label class="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name="show-mst" bind:checked={showMst} />
      {m.showMst}
    </label>
    <button type="button" class="btn-outline" onclick={reset}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          weighted
          editable
          maxNodes={MAX_NODES}
          nodeState={(id) => stateAt(order.indexOf(id))}
          {edgeState}
          {markerOf}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateName(i));
          }}
          onselect={flip}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#if mode === 'cut'}
            <li class="flex items-center gap-1.5">
              <span class="font-mono font-bold">S</span>{m.legend.sideS}
            </li>
            {#each sideLegend as [cls, label], i (i)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm {cls}"></span>{label}
              </li>
            {/each}
            {#if !showMst}
              {#each cutEdgeLegend as [cls, label], i (i)}
                <li class="flex items-center gap-1.5">
                  <span class="h-1 w-3 rounded-sm {cls}"></span>{label}
                </li>
              {/each}
            {/if}
          {:else}
            <li class="flex items-center gap-1.5">
              <span class="font-mono font-bold">a b</span>{m.legend.ends}
            </li>
            {#each cycleLegend as [cls, label], i (i)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm {cls}"></span>{label}
              </li>
            {/each}
            {#if !showMst}
              {#each cycleEdgeLegend as [cls, label], i (i)}
                <li class="flex items-center gap-1.5">
                  <span class="h-1 w-3 rounded-sm {cls}"></span>{label}
                </li>
              {/each}
              <li class="flex items-center gap-1.5">
                <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.used}
              </li>
            {/if}
          {/if}
          {#if showMst}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-sorted"></span>{m.legend.mst}
            </li>
          {/if}
        </ul>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-3">
      <dl class="grid grid-cols-2 gap-3">
        {#if cutFrame}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.checked}</dt>
            <dd class="text-2xl font-bold tabular-nums">{cutFrame.checked}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.crossing}</dt>
            <dd class="text-2xl font-bold tabular-nums">{cutFrame.crossing.length}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.lightest}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {info[cutFrame.best]?.w ?? m.none}
            </dd>
          </div>
        {:else if cycleFrame}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.checked}</dt>
            <dd class="text-2xl font-bold tabular-nums">{cycleFrame.checked}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.reached}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {cycleFrame.reached.filter(Boolean).length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.tested}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {cycleFrame.target >= 0 ? cycleFrame.w : m.none}
            </dd>
          </div>
        {/if}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.treeEdges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{Math.max(0, order.length - 1)}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.mst}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.mstValue(mst.weight, mst.components)}</dd>
        </div>
      </dl>
      {#if mode === 'cut'}
        <ChipList
          title={m.crossingTitle}
          emptyText={m.emptyText}
          hotLabel={m.hotLabel}
          items={crossingItems}
        />
        <CodePanel lines={cutPseudocode} active={player.frame.lines} />
      {:else}
        <ChipList title={m.queueTitle} emptyText={m.emptyText} items={queueItems} />
        <CodePanel lines={cyclePseudocode} active={player.frame.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        {#if edges.length}
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
            {#each edges as e, k (k)}
              <li>
                <label class="flex items-center justify-between gap-2 text-sm">
                  <span class="font-mono">{edgeName(e)}</span>
                  <input
                    type="number"
                    min="1"
                    max={MAX_WEIGHT}
                    step="1"
                    class="field w-16"
                    aria-label={m.weightAria(edgeName(e))}
                    value={e.weight ?? 1}
                    onchange={(ev) => setWeight(k, ev)}
                  />
                </label>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-slate-600">{m.noEdges}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
