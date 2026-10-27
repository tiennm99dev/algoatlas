<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { heapForest } from '$lib/components/tree-layout.js';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    dijkstraPseudocode,
    dijkstraTrace,
  } from '$lib/algo-engine/dijkstra-general.js';
  import { en as m } from '$lib/lessons/dijkstra-general/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @param {number} id */
  const letter = (id) => (id < 26 ? String.fromCharCode(65 + id) : `V${id}`);

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
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 1 },
    { from: 2, to: 1, weight: 2 },
    { from: 1, to: 3, weight: 5 },
    { from: 2, to: 3, weight: 8 },
    { from: 2, to: 4, weight: 10 },
    { from: 3, to: 4, weight: 2 },
    { from: 3, to: 5, weight: 6 },
    { from: 4, to: 5, weight: 3 },
  ];

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  let sourceId = $state(0);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));

  const build = () =>
    dijkstraTrace({
      ids: nodes.map((n) => n.id),
      edges,
      source: order.indexOf(sourceId),
    });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, names));

  /** @param {GraphNode[]} ns @param {GraphEdge[]} es */
  const shape = (ns, es) =>
    JSON.stringify([ns.map((n) => n.id), es.map((e) => [e.from, e.to, e.weight])]);
  let built = shape(DEFAULT_NODES, DEFAULT_EDGES);

  function rebuild() {
    built = shape(nodes, edges);
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (!nodes.some((n) => n.id === sourceId)) sourceId = order[0] ?? 0;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (shape(nodes, edges) !== built) rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    sourceId = 0;
    rebuild();
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || w < 0 || w > MAX_WEIGHT) {
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

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (frame.kind !== 'done' && i === frame.current) return 'active';
    if (i === frame.neighbor) return 'compare';
    if (frame.settled[i]) return 'sorted';
    if (frame.heap.some((e) => e.v === i)) return 'frontier';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    const parts = [];
    if (order[i] === sourceId) parts.push(m.states.source);
    if (s === 'active') parts.push(m.states.current);
    if (s === 'compare') parts.push(m.states.neighbor);
    if (frame.settled[i]) parts.push(m.states.settled);
    else if (s === 'frontier') parts.push(m.states.queued);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    if (k === frame.edge) return 'active';
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    if (frame.parent[b] === a || frame.parent[a] === b) return 'visited';
    return '';
  }

  /** @param {number} slot */
  const isStale = (slot) => {
    const e = frame.heap[slot];
    return e.d > frame.dist[e.v];
  };
  /** @param {number} slot @returns {VisualState} */
  const slotState = (slot) => (slot === frame.pushedAt ? 'active' : isStale(slot) ? 'visited' : '');

  const forest = $derived(
    heapForest(
      frame.heap.map((e) => e.d),
      frame.heap.length,
      (i) => ({
        state: slotState(i),
        marker: names[frame.heap[i].v],
        note: isStale(i) ? m.staleTag : `[${i}]`,
      }),
    ),
  );
  const heapItems = $derived(
    frame.heap.map((e, i) => ({
      label: `${m.entry(e, names)}${isStale(i) ? ` ${m.staleTag}` : ''}`,
      hot: i === frame.pushedAt,
    })),
  );
  const orderItems = $derived(
    frame.order.map((v, i) => ({
      label: `${names[v]} ${frame.dist[v]}`,
      hot: i === frame.order.length - 1 && frame.kind === 'settle',
    })),
  );

  const legend = [
    ['bg-state-active', m.legend.current],
    ['bg-state-compare', m.legend.neighbor],
    ['bg-state-frontier', m.legend.queued],
    ['bg-state-sorted', m.legend.settled],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sourceLabel}
      <select
        name="source"
        class="field"
        value={sourceId}
        onchange={(e) => {
          sourceId = Number(e.currentTarget.value);
          rebuild();
        }}
      >
        {#each order as id, i (id)}
          <option value={id}>{names[i]}</option>
        {/each}
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
            const at = frame.order.indexOf(order.indexOf(id));
            return at >= 0 ? String(at + 1) : '';
          }}
          noteOf={(id) => m.dNote(frame.dist[order.indexOf(id)])}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], frame.dist[i], stateName(i));
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
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.edgeNow}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.tree}
          </li>
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.pushes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pops}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.pops}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.stale}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.stale}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.relaxations}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.relaxations}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.maxHeap}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.maxHeap}</dd>
        </div>
      </dl>
      <ChipList
        title={m.heapArrayTitle}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={heapItems}
        limit={60}
      />
      <ChipList
        title={m.orderTitle}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={orderItems}
      />
      <CodePanel lines={dijkstraPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.heapTitle}</h2>
        <TreeView
          roots={forest}
          binary
          ariaLabel={m.heapAria(frame.heap, names)}
          emptyText={m.heapAria([], names)}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.pushed}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-visited"></span>{m.legend.stale}
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
                    min="0"
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
