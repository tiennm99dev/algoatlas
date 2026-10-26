<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    backwardEdges,
    dfsTopoPseudocode,
    dfsTopoTrace,
    kahnPseudocode,
    kahnTrace,
  } from '$lib/algo-engine/topological-sort.js';
  import { en as m } from '$lib/lessons/topological-sort/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @param {number} id */
  const letter = (id) => (id < 26 ? String.fromCharCode(65 + id) : `V${id}`);

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 60, y: 70, label: 'A' },
    { id: 1, x: 170, y: 40, label: 'B' },
    { id: 2, x: 290, y: 40, label: 'C' },
    { id: 3, x: 60, y: 230, label: 'D' },
    { id: 4, x: 230, y: 200, label: 'E' },
    { id: 5, x: 400, y: 80, label: 'F' },
    { id: 6, x: 410, y: 230, label: 'G' },
  ];
  /** @type {GraphEdge[]} */
  const DEFAULT_EDGES = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 5 },
    { from: 0, to: 4 },
    { from: 3, to: 4 },
    { from: 4, to: 6 },
    { from: 5, to: 6 },
  ];

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  let algo = $state(/** @type {'kahn' | 'dfs'} */ ('kahn'));

  const build = () =>
    (algo === 'kahn' ? kahnTrace : dfsTopoTrace)({ ids: nodes.map((n) => n.id), edges });

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const pseudocode = $derived(algo === 'kahn' ? kahnPseudocode : dfsTopoPseudocode);

  /** The frame's edge as vertex indices. */
  const edge = $derived.by(() => {
    const e = frame.edge >= 0 ? edges[frame.edge] : undefined;
    return e ? { from: order.indexOf(e.from), to: order.indexOf(e.to) } : null;
  });
  const narration = $derived(m.describe(frame, names, algo, edge));
  const usedSet = $derived(new Set(frame.used));
  const cycleSet = $derived(new Set(frame.cycle));
  const backward = $derived(
    frame.kind === 'done' ? backwardEdges(frame.result, { ids: order, edges }) : null,
  );

  /** @param {GraphNode[]} ns @param {GraphEdge[]} es */
  const shape = (ns, es) => JSON.stringify([ns.map((n) => n.id), es.map((e) => [e.from, e.to])]);
  let built = shape(DEFAULT_NODES, DEFAULT_EDGES);

  function rebuild() {
    built = shape(nodes, edges);
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (shape(nodes, edges) !== built) rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    rebuild();
  }

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (cycleSet.has(i) && frame.kind === 'cycle') return 'path';
    if (i === frame.current && frame.kind !== 'done') return 'active';
    if (frame.status[i] === 2) return algo === 'kahn' ? 'sorted' : 'visited';
    if (frame.status[i] === 1) return 'frontier';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    if (s === 'path') return algo === 'kahn' ? m.states.stuck : m.states.cycle;
    if (s === 'active') return m.states.current;
    if (s === 'sorted') return m.states.placed;
    if (s === 'visited') return m.states.finished;
    if (s === 'frontier') return algo === 'kahn' ? m.states.queued : m.states.inProgress;
    return '';
  }

  /** @param {number} i */
  function marker(i) {
    const at = frame.order.indexOf(i);
    return at >= 0 ? String(at + 1) : '';
  }

  /** @param {number} i */
  function note(i) {
    if (algo === 'kahn') return frame.status[i] === 2 ? '' : m.inNote(frame.indeg[i]);
    const at = frame.order.indexOf(i);
    return at >= 0 ? m.finishNote(at + 1) : '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    // DFS reports the cycle in order. Kahn only knows which vertices got stuck, some of them
    // merely behind the cycle, so its edges are not marked.
    if (frame.kind === 'cycle' && algo === 'dfs' && cycleSet.has(a) && cycleSet.has(b)) {
      const c = frame.cycle;
      const at = c.indexOf(a);
      if (c[(at + 1) % c.length] === b) return 'path';
    }
    if (k === frame.edge) return 'active';
    return usedSet.has(k) ? 'visited' : '';
  }

  const pendingItems = $derived(
    (algo === 'kahn' ? frame.pending : frame.pending.toReversed()).map((v) => ({
      label: names[v],
    })),
  );
  const orderItems = $derived(
    frame.order.map((v, i) => ({ label: names[v], hot: i === frame.order.length - 1 })),
  );

  const legend = $derived([
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.pending],
    [algo === 'kahn' ? 'bg-state-sorted' : 'bg-state-visited', m.legend.done],
    ['bg-state-path', algo === 'kahn' ? m.legend.stuck : m.legend.cycle],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algoLabel}
      name="algo"
      options={[
        { value: 'kahn', label: m.algos.kahn },
        { value: 'dfs', label: m.algos.dfs },
      ]}
      bind:value={algo}
      onchange={rebuild}
    />
    <button type="button" class="btn-outline" onclick={reset}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          bind:nodes
          bind:edges
          ariaLabel={m.graphAria}
          directed
          editable
          maxNodes={MAX_NODES}
          nodeState={(id) => stateAt(order.indexOf(id))}
          {edgeState}
          markerOf={(id) => marker(order.indexOf(id))}
          noteOf={(id) => note(order.indexOf(id))}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateName(i), note(i));
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
            <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.edgeDone}
          </li>
        </ul>
        <p class="mt-2 text-xs text-slate-600">
          <span class="font-semibold">{m.tasksTitle}:</span>
          {nodes
            .filter((n) => m.tasks[n.id])
            .map((n) => `${n.label} ${m.tasks[n.id]}`)
            .join(' · ')}
        </p>
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
          <dt class="text-xs text-slate-500">{m.stats.placed}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.order.length} / {names.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.edgesSeen} / {edges.length}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.backward}</dt>
          <dd class="text-2xl font-bold tabular-nums">{backward ?? '—'}</dd>
        </div>
      </dl>
      <ChipList
        title={algo === 'kahn' ? m.queueLabel : m.stackLabel}
        emptyText={m.emptyText}
        items={pendingItems}
      />
      <ChipList
        title={algo === 'kahn' ? m.orderLabel : m.finishLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={orderItems}
      />
      {#if frame.kind === 'done'}
        <ChipList
          title={m.resultLabel}
          emptyText={m.emptyText}
          items={frame.result.map((v) => ({ label: names[v] }))}
        />
      {/if}
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
