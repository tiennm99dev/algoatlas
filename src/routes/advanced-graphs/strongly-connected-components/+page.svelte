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
    condensation,
    kosarajuPseudocode,
    kosarajuTrace,
    tarjanPseudocode,
    tarjanTrace,
  } from '$lib/algo-engine/strongly-connected-components.js';
  import { en as m } from '$lib/lessons/strongly-connected-components/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const W = 480;
  const H = 300;

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 50, y: 70, label: 'A' },
    { id: 1, x: 160, y: 50, label: 'B' },
    { id: 2, x: 90, y: 190, label: 'C' },
    { id: 3, x: 260, y: 100, label: 'D' },
    { id: 4, x: 350, y: 40, label: 'E' },
    { id: 5, x: 320, y: 200, label: 'F' },
    { id: 6, x: 430, y: 255, label: 'G' },
    { id: 7, x: 440, y: 120, label: 'H' },
  ];
  /** @type {GraphEdge[]} */
  const DEFAULT_EDGES = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 1, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 5, to: 3 },
    { from: 6, to: 5 },
    { from: 6, to: 7 },
    { from: 7, to: 6 },
  ];

  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  let algo = $state(/** @type {'tarjan' | 'kosaraju'} */ ('tarjan'));

  const build = () =>
    (algo === 'tarjan' ? tarjanTrace : kosarajuTrace)({ ids: nodes.map((n) => n.id), edges });

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const pseudocode = $derived(algo === 'tarjan' ? tarjanPseudocode : kosarajuPseudocode);
  const narration = $derived(m.describe(frame, names, algo));
  const poppedSet = $derived(new Set(frame.popped));
  const visited = $derived(frame.tin.filter((t) => t >= 0).length);

  /** Members of each component found so far, by number - 1. */
  const groups = $derived.by(() => {
    /** @type {number[][]} */
    const out = Array.from({ length: frame.count }, () => []);
    frame.comp.forEach((c, v) => c > 0 && out[c - 1].push(v));
    return out;
  });

  /** The condensation, drawn once every vertex has a component. */
  const condensed = $derived.by(() => {
    if (frame.kind !== 'done') return null;
    const dag = condensation({ ids: order, edges }, frame.comp);
    /** @type {GraphNode[]} */
    const cnodes = [];
    dag.members.forEach((list, k) => {
      const pts = list.map((v) => /** @type {GraphNode} */ (nodes.find((n) => n.id === order[v])));
      let x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      let y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      // Two components can share a centre; nudge until the circles do not overlap.
      while (cnodes.some((c) => Math.hypot(c.x - x, c.y - y) < 44)) {
        x = Math.min(W - 24, x + 46);
        if (x >= W - 24) y = Math.min(H - 24, y + 46);
      }
      cnodes.push({ id: k + 1, x, y, label: m.compName(k + 1) });
    });
    return {
      nodes: cnodes,
      edges: dag.edges.map(([a, b]) => ({ from: a, to: b })),
      members: dag.members.map((list) => list.map((v) => names[v]).join(' ')),
    };
  });

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
    if (i < 0) return '';
    if (poppedSet.has(i) && frame.kind === 'root') return 'path';
    if (i === frame.current && frame.kind !== 'done') return 'active';
    if (frame.comp[i] > 0) return 'sorted';
    if (frame.status[i] === 1) return 'frontier';
    if (frame.status[i] === 2) return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    if (s === 'path') return m.states.popped;
    if (s === 'active') return m.states.current;
    if (s === 'frontier') return algo === 'tarjan' ? m.states.open : m.states.path;
    if (s === 'visited') return algo === 'tarjan' ? m.states.waiting : m.states.finished;
    return '';
  }

  /** @param {number} i */
  function note(i) {
    if (algo === 'tarjan') return frame.tin[i] >= 0 ? m.tinLow(frame.tin[i], frame.low[i]) : '';
    const at = frame.finished.indexOf(i);
    return at >= 0 && frame.pass === 1 ? m.finishNote(at + 1) : '';
  }

  /** @param {number} i */
  function detail(i) {
    if (algo === 'tarjan')
      return frame.tin[i] >= 0 ? m.tinLowLabel(frame.tin[i], frame.low[i]) : '';
    const at = frame.finished.indexOf(i);
    return at >= 0 ? m.finishLabel(at + 1) : '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    if (k === frame.edge && frame.kind !== 'done') return 'active';
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    if (frame.comp[a] > 0 && frame.comp[a] === frame.comp[b]) return 'sorted';
    return '';
  }

  const stackItems = $derived(
    frame.stack.toReversed().map((v, i) => ({ label: names[v], hot: i === 0 })),
  );
  const compItems = $derived(
    groups.map((list, k) => ({
      label: m.compChip(k + 1, list.map((v) => names[v]).join(' ')),
      hot: frame.kind === 'root' && k === frame.count - 1,
    })),
  );

  const legend = $derived([
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.open],
    ['bg-state-visited', algo === 'tarjan' ? m.legend.waiting : m.legend.finished],
    ['bg-state-path', m.legend.popped],
    ['bg-state-sorted', m.legend.done],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algoLabel}
      name="algo"
      options={[
        { value: 'tarjan', label: m.algos.tarjan },
        { value: 'kosaraju', label: m.algos.kosaraju },
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
          width={W}
          height={H}
          maxNodes={MAX_NODES}
          nodeState={(id) => stateAt(order.indexOf(id))}
          {edgeState}
          markerOf={(id) => {
            const c = frame.comp[order.indexOf(id)];
            return c > 0 ? String(c) : '';
          }}
          noteOf={(id) => note(order.indexOf(id))}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateName(i), detail(i), frame.comp[i]);
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
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.edge}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-sorted"></span>{m.legend.inside}
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
          <dt class="text-xs text-slate-500">{m.stats.comps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.count}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.edgesSeen}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.time}</dt>
          <dd class="text-2xl font-bold tabular-nums">{visited} / {names.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pass}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {algo === 'tarjan' ? 1 : frame.pass} / {algo === 'tarjan' ? 1 : 2}
          </dd>
        </div>
      </dl>
      <ChipList
        title={algo === 'tarjan' ? m.stackLabel : m.callLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={stackItems}
      />
      {#if algo === 'kosaraju'}
        <ChipList
          title={m.finishTitle}
          emptyText={m.emptyText}
          items={frame.finished.map((v) => ({
            label: names[v],
            hot: frame.pass === 2 && v === frame.current,
          }))}
        />
      {/if}
      <ChipList
        title={m.compsLabel}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={compItems}
      />
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-4 rounded-xl border border-slate-200 bg-white p-3">
    <h2 class="mb-2 text-sm font-semibold text-slate-700">{m.condensedTitle}</h2>
    {#if condensed}
      <GraphCanvas
        nodes={condensed.nodes}
        edges={condensed.edges}
        ariaLabel={m.condensedAria}
        directed
        width={W}
        height={H}
        nodeState={() => 'sorted'}
        noteOf={(id) => condensed.members[id - 1] ?? ''}
        labelOf={(n) => m.compLabel(n.id, condensed.members[n.id - 1] ?? '')}
      />
      <p class="mt-2 text-sm text-slate-700">
        {m.condensedSummary(condensed.nodes.length, condensed.edges.length)}
      </p>
    {:else}
      <p class="text-sm text-slate-600">{m.condensedWait}</p>
    {/if}
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
