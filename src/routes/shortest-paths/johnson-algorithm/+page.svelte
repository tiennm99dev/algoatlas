<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    johnsonPseudocode,
    johnsonTrace,
  } from '$lib/algo-engine/johnson-algorithm.js';
  import { en as m } from '$lib/lessons/johnson-algorithm/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'negative' | 'cycle' | 'positive'} Preset */

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 60, y: 150, label: 'A' },
    { id: 1, x: 220, y: 50, label: 'B' },
    { id: 2, x: 400, y: 50, label: 'C' },
    { id: 3, x: 400, y: 250, label: 'D' },
    { id: 4, x: 220, y: 250, label: 'E' },
  ];
  /** @param {number} dc  Weight of D → C. @param {boolean} [positive] @returns {GraphEdge[]} */
  const edgesWith = (dc, positive = false) =>
    [
      [0, 1, 3],
      [0, 2, 8],
      [0, 4, -4],
      [1, 3, 1],
      [1, 4, 7],
      [2, 1, 4],
      [3, 0, 2],
      [3, 2, dc],
      [4, 3, 6],
    ].map(([from, to, weight]) => ({ from, to, weight: positive ? Math.abs(weight) : weight }));
  /** @type {Record<Preset, GraphEdge[]>} */
  const PRESETS = {
    negative: edgesWith(-5),
    cycle: edgesWith(-6),
    positive: edgesWith(5, true),
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));

  let preset = $state(/** @type {Preset} */ ('negative'));
  let view = $state(/** @type {'w' | 'wp'} */ ('w'));
  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(PRESETS.negative);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const weights = $derived(edges.map((e) => e.weight ?? 1));

  const build = () => johnsonTrace({ ids: nodes.map((n) => n.id), edges });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, weights),
  );
  const cycleSet = $derived(new Set(frame.cycle));
  const settledSet = $derived(new Set(frame.settled));
  const inDijkstra = $derived(frame.source >= 0);
  const reweightedEdges = $derived(
    edges.map((e, k) => {
      const wp = frame.reweighted[k];
      return wp === null ? { from: e.from, to: e.to } : { from: e.from, to: e.to, weight: wp };
    }),
  );

  let built = graphShape(DEFAULT_NODES, PRESETS.negative);

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

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    nodes = DEFAULT_NODES;
    edges = PRESETS[p];
    rebuild();
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || Math.abs(w) > MAX_WEIGHT) {
      e.currentTarget.value = String(edges[k].weight ?? 1);
      notice = { text: m.badWeight(MAX_WEIGHT), at: player.index };
      return;
    }
    edges = edges.map((x, i) => (i === k ? { ...x, weight: w } : x));
    rebuild();
  }

  /** @param {GraphEdge} e */
  const edgeName = (e) =>
    `${names[order.indexOf(e.from)] ?? e.from} → ${names[order.indexOf(e.to)] ?? e.to}`;

  const phase = $derived.by(() => {
    switch (frame.kind) {
      case 'start':
        return m.phases.start;
      case 'cycle':
        return m.phases.cycle;
      case 'reweight':
        return m.phases.reweight;
      case 'done':
        return frame.cycle.length ? m.phases.cycle : m.phases.done;
      default:
        return inDijkstra ? m.phases.dijkstra(names[frame.source]) : m.phases.bf;
    }
  });

  const edgeKinds = new Set(['bf-lower', 'cycle', 'reweight', 'lower']);
  const live = $derived(edgeKinds.has(frame.kind));

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (cycleSet.has(i)) return 'path';
    if (live && i === frame.neighbor) return frame.kind === 'reweight' ? 'compare' : 'swap';
    if (live && i === frame.current) return 'compare';
    if (frame.kind === 'settle' && i === frame.current) return 'active';
    if (inDijkstra && settledSet.has(i)) return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    const parts = [];
    if (inDijkstra && i === frame.source) parts.push(m.states.source);
    if (s === 'path') parts.push(m.states.cycle);
    if (s === 'compare') parts.push(m.states.tail);
    if (s === 'swap') parts.push(m.states.write);
    if (s === 'active' || s === 'visited') parts.push(m.states.settled);
    return parts.join(', ');
  }

  /** @param {number} i */
  function noteAt(i) {
    if (inDijkstra) return m.dNote(frame.dPrime[i]);
    return frame.h[i] === Infinity ? '' : m.hNote(frame.h[i]);
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    if (frame.cycle.length && cycleSet.has(a) && cycleSet.has(b)) {
      const c = frame.cycle;
      if (c[(c.indexOf(a) + 1) % c.length] === b) return 'path';
    }
    if (live && k === frame.edge) return 'active';
    if (inDijkstra && frame.parent[b] === a) return 'visited';
    return '';
  }

  /** The row of the run that just finished. @param {number} r @returns {VisualState} */
  function cellState(r) {
    if (frame.kind === 'row' && r === frame.source) return 'sorted';
    return '';
  }
  /** @param {number} r @param {number} c */
  const cellName = (r, c) =>
    m.cellLabel(names[r], names[c], m.show(frame.matrix[r][c]), cellState(r) ? m.states.row : '');

  const legend = [
    ['bg-state-compare', m.legend.tail],
    ['bg-state-swap', m.legend.write],
    ['bg-state-visited', m.legend.settled],
    ['bg-state-path', m.legend.cycle],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => load(/** @type {Preset} */ (e.currentTarget.value))}
      >
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl
      legend={m.viewLabel}
      name="view"
      options={[
        { value: 'w', label: m.views.w },
        { value: 'wp', label: m.views.wp },
      ]}
      bind:value={view}
    />
    <button type="button" class="btn-outline" onclick={() => load(preset)}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        {#if view === 'w'}
          <GraphCanvas
            bind:nodes
            bind:edges
            ariaLabel={m.graphAria}
            directed
            weighted
            editable
            maxNodes={MAX_NODES}
            nodeState={(id) => stateAt(order.indexOf(id))}
            {edgeState}
            markerOf={(id) => (inDijkstra && order.indexOf(id) === frame.source ? 's' : '')}
            noteOf={(id) => noteAt(order.indexOf(id))}
            labelOf={(n) => {
              const i = order.indexOf(n.id);
              return m.vertexLabel(names[i], noteAt(i), stateName(i));
            }}
            onchange={onGraphChange}
            speed={player.speed}
          />
        {:else}
          <GraphCanvas
            {nodes}
            edges={reweightedEdges}
            ariaLabel={m.graphAriaReweighted}
            directed
            weighted
            nodeState={(id) => stateAt(order.indexOf(id))}
            {edgeState}
            markerOf={(id) => (inDijkstra && order.indexOf(id) === frame.source ? 's' : '')}
            noteOf={(id) => noteAt(order.indexOf(id))}
            labelOf={(n) => {
              const i = order.indexOf(n.id);
              return m.vertexLabel(names[i], noteAt(i), stateName(i));
            }}
            speed={player.speed}
          />
        {/if}
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">s</span>{m.legend.source}
          </li>
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
          <dt class="text-xs text-slate-500">{m.stats.bfChecks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.bfChecks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.dijkstraChecks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.dijkstraChecks}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.phase}</dt>
          <dd class="text-lg font-bold">{phase}</dd>
        </div>
      </dl>
      <ChipList
        title={m.potentialsTitle}
        emptyText={m.potentialsEmpty}
        hotLabel={m.hotLabel}
        items={frame.h.some((x) => x !== Infinity)
          ? frame.h.map((x, i) => ({
              label: m.potentialChip(names[i], x),
              hot: frame.kind === 'bf-lower' && i === frame.neighbor,
            }))
          : []}
      />
      {#if frame.cycle.length}
        <ChipList
          title={m.cycleTitle}
          emptyText=""
          items={frame.cycle.map((v) => ({ label: names[v] }))}
        />
      {/if}
      <CodePanel lines={johnsonPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        {#if edges.length}
          <div class="overflow-x-auto">
            <table class="w-full text-sm tabular-nums">
              <thead>
                <tr class="text-left text-xs text-slate-500">
                  {#each m.edgeHead as head, i (i)}
                    <th scope="col" class="px-1 py-1 font-semibold">{head}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each edges as e, k (k)}
                  {@const a = order.indexOf(e.from)}
                  {@const b = order.indexOf(e.to)}
                  <tr class="border-t border-slate-100 {k === frame.edge ? 'bg-amber-50' : ''}">
                    <th scope="row" class="px-1 py-1 text-left font-mono font-normal"
                      >{edgeName(e)}</th
                    >
                    <td class="px-1 py-1">
                      <input
                        type="number"
                        min={-MAX_WEIGHT}
                        max={MAX_WEIGHT}
                        step="1"
                        class="field w-16"
                        aria-label={m.weightAria(edgeName(e))}
                        value={e.weight ?? 1}
                        onchange={(ev) => setWeight(k, ev)}
                      />
                    </td>
                    <td class="px-1 py-1">{m.show(frame.h[a] ?? null)}</td>
                    <td class="px-1 py-1">{m.show(frame.h[b] ?? null)}</td>
                    <td class="px-1 py-1 font-semibold">{m.show(frame.reweighted[k] ?? null)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-sm text-slate-600">{m.noEdges}</p>
        {/if}
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.matrixTitle}</h2>
        <DpTable
          values={frame.matrix.map((row) => row.map((x) => (x === null ? null : m.show(x))))}
          ariaLabel={m.matrixAria}
          rowHeaders={names}
          colHeaders={names}
          stateOf={cellState}
          labelOf={cellName}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-sorted"></span>{m.legend.row}
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
