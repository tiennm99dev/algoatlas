<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { MAX_NODES, MAX_WEIGHT, primPseudocode, primTrace } from '$lib/algo-engine/prim.js';
  import { en as m } from '$lib/lessons/prim/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/prim.js').PrimVariant} PrimVariant */
  /** @typedef {'sparse' | 'dense'} Preset */

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 50, y: 150, label: 'A' },
    { id: 1, x: 170, y: 55, label: 'B' },
    { id: 2, x: 170, y: 245, label: 'C' },
    { id: 3, x: 300, y: 110, label: 'D' },
    { id: 4, x: 320, y: 250, label: 'E' },
    { id: 5, x: 435, y: 160, label: 'F' },
  ];
  /** @type {Record<Preset, GraphEdge[]>} */
  const PRESETS = {
    sparse: [
      { from: 0, to: 1, weight: 3 },
      { from: 0, to: 2, weight: 4 },
      { from: 1, to: 2, weight: 2 },
      { from: 1, to: 3, weight: 5 },
      { from: 2, to: 3, weight: 6 },
      { from: 2, to: 4, weight: 8 },
      { from: 3, to: 4, weight: 7 },
      { from: 3, to: 5, weight: 9 },
      { from: 4, to: 5, weight: 1 },
    ],
    dense: [
      { from: 0, to: 1, weight: 3 },
      { from: 0, to: 2, weight: 4 },
      { from: 0, to: 3, weight: 7 },
      { from: 0, to: 4, weight: 9 },
      { from: 0, to: 5, weight: 8 },
      { from: 1, to: 2, weight: 2 },
      { from: 1, to: 3, weight: 5 },
      { from: 1, to: 4, weight: 6 },
      { from: 1, to: 5, weight: 9 },
      { from: 2, to: 3, weight: 6 },
      { from: 2, to: 4, weight: 8 },
      { from: 2, to: 5, weight: 7 },
      { from: 3, to: 4, weight: 7 },
      { from: 3, to: 5, weight: 9 },
      { from: 4, to: 5, weight: 1 },
    ],
  };

  let variant = $state(/** @type {PrimVariant} */ ('heap'));
  let preset = $state(/** @type {Preset} */ ('sparse'));
  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(PRESETS.sparse);
  let startId = $state(0);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  /** Each input edge by its ends' vertex numbers. */
  const info = $derived(
    edges.map((e) => ({ u: order.indexOf(e.from), v: order.indexOf(e.to), w: e.weight ?? 1 })),
  );

  const build = () =>
    primTrace({
      ids: nodes.map((n) => n.id),
      edges,
      start: order.indexOf(startId),
      variant,
    });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, info),
  );

  let built = graphShape(DEFAULT_NODES, PRESETS.sparse);

  function rebuild() {
    built = graphShape(nodes, edges);
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (!nodes.some((n) => n.id === startId)) startId = order[0] ?? 0;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built) rebuild();
  }

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    nodes = DEFAULT_NODES;
    edges = PRESETS[p];
    if (!nodes.some((n) => n.id === startId)) startId = 0;
    rebuild();
  }

  function reset() {
    startId = 0;
    load('sparse');
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

  const live = $derived(frame.kind !== 'start' && frame.kind !== 'done');
  /** Vertices one edge away from the tree: far ends in the heap, or a finite key. */
  const frontier = $derived(
    new Set(
      frame.variant === 'heap'
        ? frame.heap.map((e) => e.to).filter((v) => !frame.inTree[v])
        : frame.key.flatMap((k, v) => (k < Infinity && !frame.inTree[v] ? [v] : [])),
    ),
  );

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (live && i === frame.current) return 'active';
    if (live && i === frame.neighbor && frame.kind !== 'add') return 'compare';
    if (frame.inTree[i]) return 'sorted';
    if (frontier.has(i)) return 'frontier';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    const parts = [];
    if (order[i] === startId) parts.push(m.states.start);
    if (s === 'active') parts.push(m.states.current);
    if (s === 'compare') parts.push(m.states.neighbor);
    if (frame.inTree[i]) parts.push(m.states.tree);
    else if (frontier.has(i)) parts.push(m.states.frontier);
    return parts.join(', ');
  }

  const treeEdges = $derived(new Set(frame.parentEdge.filter((k, v) => k >= 0 && frame.inTree[v])));
  const waiting = $derived(
    new Set(
      frame.variant === 'heap'
        ? frame.heap.filter((e) => !frame.inTree[e.to]).map((e) => e.edge)
        : frame.parentEdge.filter((k, v) => k >= 0 && !frame.inTree[v]),
    ),
  );

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    if (live && k === frame.edge) return frame.kind === 'stale' ? 'swap' : 'active';
    if (treeEdges.has(k)) return 'sorted';
    if (waiting.has(k)) return 'frontier';
    return '';
  }

  const heapItems = $derived(
    frame.heap.map((e) => ({
      label: m.heapChip(e, names, frame.inTree[e.to]),
      hot: frame.kind === 'push' && e.edge === frame.edge,
    })),
  );
  const keyItems = $derived(
    frame.key.flatMap((key, v) => {
      if (frame.inTree[v]) return [];
      const k = frame.parentEdge[v];
      const via = k >= 0 ? names[info[k].u === v ? info[k].v : info[k].u] : '';
      return [
        {
          label: m.keyChip(names[v], key, via),
          hot: frame.kind === 'improve' && frame.neighbor === v,
        },
      ];
    }),
  );
  const addedItems = $derived(
    frame.added.map((v, i) => ({
      label: names[v],
      hot: frame.kind === 'add' && i === frame.added.length - 1,
    })),
  );

  const stats = $derived(
    frame.variant === 'heap'
      ? [
          [m.stats.comparisons, frame.comparisons],
          [m.stats.examined, frame.examined],
          [m.stats.pushes, frame.pushes],
          [m.stats.pops, frame.pops],
          [m.stats.stale, frame.stale],
          [m.stats.weight, frame.weight],
        ]
      : [
          [m.stats.comparisons, frame.comparisons],
          [m.stats.examined, frame.examined],
          [m.stats.weight, frame.weight],
        ],
  );

  const legend = [
    ['bg-state-active', m.legend.current],
    ['bg-state-compare', m.legend.neighbor],
    ['bg-state-frontier', m.legend.frontier],
    ['bg-state-sorted', m.legend.tree],
  ];
  const edgeLegend = [
    ['bg-state-active', m.legend.edgeNow],
    ['bg-state-swap', m.legend.edgeStale],
    ['bg-state-sorted', m.legend.treeEdge],
    ['bg-state-frontier', m.legend.candidate],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.variantLabel}
      name="variant"
      options={[
        { value: 'heap', label: m.variants.heap },
        { value: 'array', label: m.variants.array },
      ]}
      bind:value={variant}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.startLabel}
      <select
        name="start"
        class="field"
        value={startId}
        onchange={(e) => {
          startId = Number(e.currentTarget.value);
          rebuild();
        }}
      >
        {#each order as id, i (id)}
          <option value={id}>{names[i]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => load(/** @type {Preset} */ (e.currentTarget.value))}
      >
        <option value="sparse">{m.presets.sparse}</option>
        <option value="dense">{m.presets.dense}</option>
      </select>
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
          markerOf={(id) => {
            const at = frame.added.indexOf(order.indexOf(id));
            return at >= 0 ? String(at + 1) : '';
          }}
          noteOf={(id) => {
            const i = order.indexOf(id);
            return frame.variant === 'array' && !frame.inTree[i] ? m.keyNote(frame.key[i]) : '';
          }}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateName(i), frame.added.indexOf(i) + 1);
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          {#each edgeLegend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">1 2 3</span>{m.legend.order}
          </li>
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
        {#each stats as [label, value], i (label)}
          <div
            class="rounded-xl border border-slate-200 bg-white p-3 {i === stats.length - 1 &&
            stats.length % 2
              ? 'col-span-2'
              : ''}"
          >
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        {/each}
      </dl>
      {#if frame.variant === 'heap'}
        <ChipList
          title={m.heapTitle}
          emptyText={m.emptyText}
          hotLabel={m.hotLabel}
          items={heapItems}
          limit={60}
        />
      {:else}
        <ChipList
          title={m.keysTitle}
          emptyText={m.emptyText}
          hotLabel={m.hotLabel}
          items={keyItems}
        />
      {/if}
      <ChipList
        title={m.addedTitle}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={addedItems}
      />
      <CodePanel lines={primPseudocode[frame.variant]} active={frame.lines} />
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
