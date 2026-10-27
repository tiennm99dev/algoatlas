<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import { graphShape, letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    bellmanFordPseudocode,
    bellmanFordTrace,
  } from '$lib/algo-engine/bellman-ford.js';
  import { en as m } from '$lib/lessons/bellman-ford/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'negative' | 'good' | 'cycle'} Preset */

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 50, y: 150, label: 'S' },
    { id: 1, x: 170, y: 60, label: 'A' },
    { id: 2, x: 170, y: 240, label: 'B' },
    { id: 3, x: 320, y: 250, label: 'C' },
    { id: 4, x: 420, y: 120, label: 'D' },
  ];
  /** @param {number} da  Weight of D → A. @returns {GraphEdge[]} */
  const listOrder = (da) => [
    { from: 3, to: 4, weight: 3 },
    { from: 2, to: 3, weight: -2 },
    { from: 1, to: 2, weight: 2 },
    { from: 0, to: 1, weight: 6 },
    { from: 0, to: 2, weight: 7 },
    { from: 1, to: 3, weight: 5 },
    { from: 2, to: 4, weight: -3 },
    { from: 4, to: 1, weight: da },
  ];
  /** @type {Record<Preset, GraphEdge[]>} */
  const PRESETS = {
    negative: listOrder(4),
    good: [3, 4, 2, 5, 1, 6, 0, 7].map((k) => listOrder(4)[k]),
    cycle: listOrder(-1),
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));

  let preset = $state(/** @type {Preset} */ ('negative'));
  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(PRESETS.negative);
  let sourceId = $state(0);
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));

  const build = () =>
    bellmanFordTrace({ ids: nodes.map((n) => n.id), edges, source: order.indexOf(sourceId) });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, names));
  const cycleSet = $derived(new Set(frame.cycle));

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
    if (!nodes.some((n) => n.id === sourceId)) sourceId = order[0] ?? 0;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built) rebuild();
  }

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    nodes = DEFAULT_NODES;
    edges = PRESETS[p];
    sourceId = 0;
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

  const live = $derived(frame.kind !== 'start' && frame.kind !== 'done' && frame.current >= 0);

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (frame.kind === 'cycle' && cycleSet.has(i)) return 'path';
    if (live && i === frame.current) return 'compare';
    if (live && i === frame.neighbor) return frame.kind === 'improve' ? 'swap' : 'active';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    const s = stateAt(i);
    const parts = [];
    if (order[i] === sourceId) parts.push(m.states.source);
    if (s === 'path') parts.push(m.states.cycle);
    if (s === 'compare') parts.push(m.states.tail);
    if (s === 'swap') parts.push(m.states.write);
    if (s === 'active') parts.push(m.states.head);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    if (frame.kind === 'cycle' && cycleSet.has(a) && cycleSet.has(b)) {
      const c = frame.cycle;
      if (c[(c.indexOf(a) + 1) % c.length] === b) return 'path';
    }
    if (k === frame.edge) return 'active';
    if (frame.parent[b] === a) return 'visited';
    return '';
  }

  const liveRow = $derived(frame.table.length - 1);
  /** @param {number} r @param {number} c @returns {VisualState} */
  function cellState(r, c) {
    if (r === liveRow && c === frame.neighbor && frame.kind !== 'done') {
      if (frame.kind === 'cycle') return 'path';
      if (frame.kind === 'improve') return 'swap';
      return 'compare';
    }
    if (
      r >= 1 &&
      r <= frame.round &&
      r < names.length &&
      frame.table[r][c] !== frame.table[r - 1][c]
    )
      return 'frontier';
    return '';
  }
  /** @param {number} r @param {number} c */
  function cellName(r, c) {
    const s = cellState(r, c);
    const state =
      s === 'path'
        ? m.states.flagged
        : s === 'swap'
          ? m.states.write
          : s === 'frontier'
            ? m.states.changed
            : '';
    return m.cellLabel(names[c], m.rowHeader(r, names.length), m.show(frame.table[r][c]), state);
  }

  const legend = [
    ['bg-state-compare', m.legend.tail],
    ['bg-state-swap', m.legend.write],
    ['bg-state-active', m.legend.head],
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
    <button type="button" class="btn-outline" onclick={() => load(preset)}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
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
          markerOf={(id) => (id === sourceId ? 's' : '')}
          noteOf={(id) => m.dNote(frame.dist[order.indexOf(id)])}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], frame.dist[i], stateName(i));
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">s</span>{m.states.source}
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
          <dt class="text-xs text-slate-500">{m.stats.relaxations}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.relaxations}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.updates}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.updates}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.round}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {m.roundStat(frame.round, Math.max(0, names.length - 1))}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.cycleTitle}
        emptyText={m.emptyText}
        items={frame.cycle.map((v) => ({ label: names[v] }))}
      />
      <CodePanel lines={bellmanFordPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.tableTitle}</h2>
        <DpTable
          values={frame.table.map((row) => row.map(m.show))}
          ariaLabel={m.tableAria}
          rowHeaders={frame.table.map((_, r) => m.rowHeader(r, names.length))}
          colHeaders={names}
          stateOf={cellState}
          labelOf={cellName}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-frontier"></span>{m.legend.changed}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-swap"></span>{m.legend.write}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-path"></span>{m.states.flagged}
          </li>
        </ul>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        {#if edges.length}
          <ol class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            {#each edges as e, k (k)}
              <li
                class="flex items-center justify-between gap-2 rounded px-1 text-sm {k ===
                frame.edge
                  ? 'bg-amber-50'
                  : ''}"
              >
                <span class="font-mono">{k + 1}. {edgeName(e)}</span>
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
              </li>
            {/each}
          </ol>
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
