<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    cutPseudocode,
    cutTrace,
  } from '$lib/algo-engine/bridges-articulation-points.js';
  import { en as m } from '$lib/lessons/bridges-articulation-points/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 50, y: 60, label: 'A' },
    { id: 1, x: 50, y: 230, label: 'B' },
    { id: 2, x: 150, y: 150, label: 'C' },
    { id: 3, x: 230, y: 50, label: 'D' },
    { id: 4, x: 260, y: 200, label: 'E' },
    { id: 5, x: 360, y: 150, label: 'F' },
    { id: 6, x: 440, y: 60, label: 'G' },
    { id: 7, x: 440, y: 250, label: 'H' },
  ];
  /** @type {GraphEdge[]} */
  const DEFAULT_EDGES = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 2 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 7, to: 5 },
  ];

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);

  const build = () => cutTrace({ ids: nodes.map((n) => n.id), edges });

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const narration = $derived(m.describe(frame, names));
  const cutSet = $derived(new Set(frame.cuts));
  const bridgeSet = $derived(new Set(frame.bridges));
  const treeSet = $derived(new Set(frame.tree));
  const backSet = $derived(new Set(frame.backEdges));
  const visited = $derived(frame.tin.filter((t) => t >= 0).length);

  let built = graphShape(DEFAULT_NODES, DEFAULT_EDGES, false);

  function rebuild() {
    built = graphShape(nodes, edges, false);
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges, false) !== built) rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    rebuild();
  }

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (i === frame.current && frame.kind !== 'done') return 'active';
    if (cutSet.has(i)) return 'swap';
    if (frame.status[i] === 1) return 'frontier';
    if (frame.status[i] === 2) return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateNames(i) {
    const out = [];
    if (i === frame.current && frame.kind !== 'done') out.push(m.states.current);
    if (cutSet.has(i)) out.push(m.states.cut);
    if (frame.status[i] === 1) out.push(m.states.path);
    else if (frame.status[i] === 2) out.push(m.states.finished);
    return out;
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.indexOf(e);
    if (k === frame.edge && frame.kind !== 'done' && frame.kind !== 'enter') return 'active';
    if (bridgeSet.has(k)) return 'swap';
    if (treeSet.has(k)) return 'visited';
    if (backSet.has(k)) return 'frontier';
    return '';
  }

  /** @param {number} k */
  function edgeLabel(k) {
    const e = edges[k];
    return m.edgeName(names[order.indexOf(e.from)], names[order.indexOf(e.to)]);
  }

  const pathItems = $derived(
    order
      .map((_, i) => i)
      .filter((i) => frame.status[i] === 1)
      .toSorted((a, b) => frame.tin[b] - frame.tin[a])
      .map((i, k) => ({ label: names[i], hot: k === 0 })),
  );
  const lastBridge = $derived(frame.kind === 'return' && frame.isBridge ? frame.edge : -1);
  const lastCut = $derived(
    (frame.kind === 'return' || frame.kind === 'root') && frame.isCut ? frame.current : -1,
  );

  const legend = [
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.path],
    ['bg-state-visited', m.legend.finished],
    ['bg-state-swap', m.legend.cut],
  ];
  const edgeLegend = [
    ['bg-state-active', m.legend.edge],
    ['bg-state-visited', m.legend.tree],
    ['bg-state-frontier', m.legend.back],
    ['bg-state-swap', m.legend.bridge],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <button type="button" class="btn-outline" onclick={reset}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          editable
          maxNodes={MAX_NODES}
          nodeState={(id) => stateAt(order.indexOf(id))}
          {edgeState}
          markerOf={(id) => (cutSet.has(order.indexOf(id)) ? m.cutMark : '')}
          noteOf={(id) => {
            const i = order.indexOf(id);
            return frame.tin[i] >= 0 ? m.tinLow(frame.tin[i], frame.low[i]) : '';
          }}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateNames(i), frame.tin[i], frame.low[i]);
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bridges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.bridges.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cuts}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.cuts.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.visited}</dt>
          <dd class="text-2xl font-bold tabular-nums">{visited} / {names.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks} / {2 * edges.length}</dd>
        </div>
      </dl>
      <ChipList
        title={m.pathLabel}
        emptyText={m.noneText}
        hotLabel={m.states.current}
        items={pathItems}
      />
      <ChipList
        title={m.bridgesLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={frame.bridges.map((k) => ({ label: edgeLabel(k), hot: k === lastBridge }))}
      />
      <ChipList
        title={m.cutsLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={frame.cuts.map((i) => ({ label: names[i], hot: i === lastCut }))}
      />
      <CodePanel lines={cutPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
