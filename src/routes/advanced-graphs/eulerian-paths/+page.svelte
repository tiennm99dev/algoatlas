<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { MAX_NODES, eulerPseudocode, eulerTrace } from '$lib/algo-engine/eulerian-paths.js';
  import { en as m } from '$lib/lessons/eulerian-paths/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 50, y: 60, label: 'A' },
    { id: 1, x: 50, y: 240, label: 'B' },
    { id: 2, x: 160, y: 150, label: 'C' },
    { id: 3, x: 260, y: 50, label: 'D' },
    { id: 4, x: 290, y: 210, label: 'E' },
    { id: 5, x: 430, y: 130, label: 'F' },
    { id: 6, x: 430, y: 270, label: 'G' },
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
    { from: 6, to: 4 },
  ];

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);

  const build = () => eulerTrace({ ids: nodes.map((n) => n.id), edges });

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const narration = $derived(m.describe(frame, names));
  const oddSet = $derived(new Set(frame.odd));
  const stackSet = $derived(new Set(frame.stack));
  const routeSet = $derived(new Set(frame.route));
  const trailSet = $derived(new Set(frame.trail));
  const routeEdgeSet = $derived(new Set(frame.routeEdges));
  const walking = $derived(frame.kind === 'walk' || frame.kind === 'pop');
  const pen = $derived(frame.stack.length ? frame.stack[frame.stack.length - 1] : -1);

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
    if (walking || frame.kind === 'pick') {
      if (i === pen) return 'active';
      if (stackSet.has(i)) return 'frontier';
      if (routeSet.has(i)) return 'sorted';
      return '';
    }
    if (frame.kind === 'done' && frame.reason === '') return frame.degree[i] > 0 ? 'sorted' : '';
    return oddSet.has(i) ? 'compare' : '';
  }

  /** @param {number} i */
  function stateNames(i) {
    const out = [];
    if (i === frame.start) out.push(m.states.start);
    const s = stateAt(i);
    if (s === 'active') out.push(m.states.pen);
    else if (s === 'frontier') out.push(m.states.stack);
    else if (s === 'sorted') out.push(m.states.done);
    if (oddSet.has(i)) out.push(m.states.odd);
    return out;
  }

  /** @param {number} i */
  function note(i) {
    if (frame.kind === 'start' || frame.reason !== '') return m.degNote(frame.degree[i]);
    if (frame.kind === 'done') return m.degNote(frame.degree[i]);
    return frame.degree[i] > 0 ? m.leftNote(frame.left[i]) : '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.indexOf(e);
    if (k === frame.edge && walking) return 'active';
    if (routeEdgeSet.has(k)) return 'sorted';
    if (trailSet.has(k)) return 'visited';
    return '';
  }

  const legend = [
    ['bg-state-active', m.legend.pen],
    ['bg-state-frontier', m.legend.stack],
    ['bg-state-sorted', m.legend.done],
    ['bg-state-compare', m.legend.odd],
  ];
  const edgeLegend = [
    ['bg-state-active', m.legend.edge],
    ['bg-state-visited', m.legend.trail],
    ['bg-state-sorted', m.legend.route],
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
          markerOf={(id) => (order.indexOf(id) === frame.start ? m.startMark : '')}
          noteOf={(id) => note(order.indexOf(id))}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateNames(i), note(i));
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
            <span class="font-bold text-slate-900">{m.startMark}</span>{m.states.start}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.used}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.used} / {edges.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.odd}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.odd.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.stack.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.detours}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.detours}</dd>
        </div>
      </dl>
      <ChipList
        title={m.stackLabel}
        emptyText={m.emptyText}
        hotLabel={m.states.pen}
        items={frame.stack.map((v, i) => ({ label: names[v], hot: i === frame.stack.length - 1 }))}
      />
      <ChipList
        title={m.routeLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={frame.route.map((v, i) => ({
          label: names[v],
          hot: frame.kind === 'pop' && i === frame.route.length - 1,
        }))}
      />
      {#if frame.kind === 'done' && frame.reason === ''}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs text-slate-500">{m.pathLabel}</h2>
          <p class="font-mono text-sm text-slate-900">{m.arrows(names, frame.path)}</p>
        </div>
      {/if}
      <CodePanel lines={eulerPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
