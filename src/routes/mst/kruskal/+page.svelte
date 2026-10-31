<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { parentForest } from '$lib/components/tree-layout.js';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    edgeList,
    kruskalPseudocode,
    kruskalTrace,
  } from '$lib/algo-engine/kruskal.js';
  import { en as m } from '$lib/lessons/kruskal/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

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

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const info = $derived(edgeList(order, edges).list);

  const build = () => kruskalTrace({ ids: nodes.map((n) => n.id), edges });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, info),
  );

  let built = graphShape(DEFAULT_NODES, DEFAULT_EDGES);

  function rebuild() {
    built = graphShape(nodes, edges);
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built) rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    rebuild();
  }

  function randomWeights() {
    edges = edges.map((e) => ({ ...e, weight: 1 + Math.floor(Math.random() * 9) }));
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

  /**
   * Root of vertex i in this frame's forest; the page only reads the links.
   * @param {number} i
   */
  function rootOf(i) {
    let r = i;
    for (let guard = 0; frame.parent[r] !== r && guard < frame.parent.length; guard++)
      r = frame.parent[r];
    return r;
  }

  const live = $derived(frame.kind === 'accept' || frame.kind === 'reject');
  /** @param {number} i */
  const isEnd = (i) => live && (i === frame.u || i === frame.v);

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    if (live && k === frame.edge) return frame.kind === 'accept' ? 'active' : 'swap';
    if (frame.status[k] === 'tree') return 'sorted';
    if (frame.status[k] === 'cycle') return 'visited';
    return '';
  }

  /** @param {number} k */
  function mark(k) {
    if (live && k === frame.edge) return '→';
    if (frame.status[k] === 'tree') return '✓';
    if (frame.status[k] === 'cycle') return '✗';
    return '';
  }
  /** @param {number} k */
  function rowClass(k) {
    if (live && k === frame.edge)
      return frame.kind === 'accept' ? 'bg-state-active text-white' : 'bg-state-swap text-white';
    if (frame.status[k] === 'tree') return 'bg-state-sorted text-white';
    if (frame.status[k] === 'cycle') return 'text-slate-400 line-through';
    return '';
  }
  /** @param {number} k */
  function statusName(k) {
    if (live && k === frame.edge) return m.status.current;
    if (frame.status[k] === 'tree') return m.status.tree;
    if (frame.status[k] === 'cycle') return m.status.cycle;
    return m.status.pending;
  }

  const forest = $derived(
    parentForest(frame.parent, (i) => ({
      label: names[i],
      state: isEnd(i) ? 'active' : '',
      note: m.rankNote(frame.rank[i]),
    })),
  );

  const stats = $derived([
    [m.stats.considered, frame.considered],
    [m.stats.accepted, frame.accepted],
    [m.stats.rejected, frame.rejected],
    [m.stats.components, frame.components],
    [m.stats.finds, frame.finds],
    [m.stats.weight, frame.weight],
  ]);

  const edgeLegend = [
    ['bg-state-active', m.legend.edgeAccept],
    ['bg-state-swap', m.legend.edgeReject],
    ['bg-state-sorted', m.legend.tree],
    ['bg-state-visited', m.legend.rejected],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <button type="button" class="btn-outline" onclick={randomWeights}>{m.randomWeights}</button>
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
          nodeState={(id) => (isEnd(order.indexOf(id)) ? 'active' : '')}
          {edgeState}
          markerOf={(id) => names[rootOf(order.indexOf(id))] ?? ''}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], names[rootOf(i)], isEnd(i));
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.ends}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">A</span>{m.legend.root}
          </li>
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-3">
      <dl class="grid grid-cols-2 gap-3">
        {#each stats as [label, value] (label)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        {/each}
      </dl>
      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.sortedTitle}</h2>
        {#if frame.sorted.length}
          <ol class="flex flex-col gap-1 font-mono text-sm" aria-label={m.sortedAria}>
            {#each frame.sorted as k, pos (k)}
              <li
                class="flex items-center gap-2 rounded px-2 py-0.5 {rowClass(k)}"
                aria-label={m.sortedItem(edgeName(edges[k]), info[k].w, statusName(k))}
              >
                <span class="w-5 text-right text-xs opacity-70" aria-hidden="true">{pos + 1}</span>
                <span class="flex-1" aria-hidden="true">{edgeName(edges[k])}</span>
                <span class="tabular-nums" aria-hidden="true">{info[k].w}</span>
                <span class="w-4 text-center font-bold" aria-hidden="true">{mark(k)}</span>
              </li>
            {/each}
          </ol>
          <p class="mt-2 text-xs text-slate-500">{m.legend.marks}</p>
        {:else}
          <p class="text-sm text-slate-600">{m.noSorted}</p>
        {/if}
      </section>
      <CodePanel lines={kruskalPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.forestTitle}</h2>
        <TreeView
          roots={forest}
          ariaLabel={m.forestAria(forest.length)}
          emptyText={m.noVertices}
          labelOf={(node) => {
            const i = Number(node.id);
            return m.forestNode(names[i], names[frame.parent[i]]);
          }}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.ends}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">r</span>{m.legend.rank}
          </li>
        </ul>
      </div>

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
