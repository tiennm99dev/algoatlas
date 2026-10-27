<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    MAX_WEIGHT,
    floydPseudocode,
    floydWarshallTrace,
    pathOf,
  } from '$lib/algo-engine/floyd-warshall.js';
  import { en as m } from '$lib/lessons/floyd-warshall/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'start' | 'cycle'} Preset */

  /** @param {number} id */
  const letter = (id) => (id < 26 ? String.fromCharCode(65 + id) : `V${id}`);

  /** @type {GraphNode[]} */
  const DEFAULT_NODES = [
    { id: 0, x: 90, y: 70, label: 'A' },
    { id: 1, x: 390, y: 70, label: 'B' },
    { id: 2, x: 90, y: 230, label: 'C' },
    { id: 3, x: 390, y: 230, label: 'D' },
  ];
  /** @param {number} db  Weight of D → B. @returns {GraphEdge[]} */
  const edgesWith = (db) => [
    { from: 0, to: 2, weight: -2 },
    { from: 2, to: 3, weight: 2 },
    { from: 3, to: 1, weight: db },
    { from: 1, to: 0, weight: 4 },
    { from: 1, to: 2, weight: 3 },
  ];
  /** @type {Record<Preset, GraphEdge[]>} */
  const PRESETS = { start: edgesWith(-1), cycle: edgesWith(-5) };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));

  let preset = $state(/** @type {Preset} */ ('start'));
  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(PRESETS.start);
  /** Picked pair as vertex indices [from, to]. */
  let picked = $state(/** @type {[number, number]} */ ([3, 0]));
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));

  const build = () => floydWarshallTrace({ ids: nodes.map((n) => n.id), edges });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, names));
  const comparing = $derived(frame.kind === 'improve' || frame.kind === 'keep');
  const negSet = $derived(new Set(frame.negative));

  /** @param {GraphNode[]} ns @param {GraphEdge[]} es */
  const shape = (ns, es) =>
    JSON.stringify([ns.map((n) => n.id), es.map((e) => [e.from, e.to, e.weight])]);
  let built = shape(DEFAULT_NODES, PRESETS.start);

  function rebuild() {
    built = shape(nodes, edges);
    notice = { text: '', at: -1 };
    const n = nodes.length;
    if (picked[0] >= n || picked[1] >= n) picked = [Math.max(0, n - 1), 0];
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (shape(nodes, edges) !== built) rebuild();
  }

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    nodes = DEFAULT_NODES;
    edges = PRESETS[p];
    picked = [3, 0];
    rebuild();
  }

  /** Jumps to the start of the next phase, or to the end. */
  function nextK() {
    player.pause();
    const at = player.frames.findIndex((f, i) => i > player.index && f.kind === 'phase');
    player.seek(at >= 0 ? at : player.frames.length - 1);
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

  /** A pair that can reach and leave a vertex on a negative cycle has no shortest path. */
  const undefinedPair = $derived(
    frame.negative.some(
      (v) => frame.dist[picked[0]]?.[v] < Infinity && frame.dist[v]?.[picked[1]] < Infinity,
    ),
  );
  const path = $derived(undefinedPair ? [] : pathOf(frame.next, picked[0], picked[1]));
  const pathEdges = $derived(new Set(path.slice(1).map((v, i) => `${path[i]}-${v}`)));

  /** @param {number} v @returns {VisualState} */
  function stateAt(v) {
    if (frame.kind === 'negative' && negSet.has(v)) return 'path';
    if (frame.k === v && frame.kind !== 'done') return 'active';
    if (comparing && (v === frame.i || v === frame.j)) return 'compare';
    return '';
  }

  /** @param {number} v */
  function stateName(v) {
    const s = stateAt(v);
    if (s === 'path') return m.states.negative;
    if (s === 'active') return m.states.k;
    if (s === 'compare') return m.states.end;
    return '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    return pathEdges.has(`${a}-${b}`) ? 'path' : '';
  }

  /** @param {number} r @param {number} c @returns {VisualState} */
  function cellState(r, c) {
    if (frame.kind === 'negative' && r === c && frame.dist[r][r] < 0) return 'path';
    if (comparing) {
      if (r === frame.i && c === frame.j) return frame.kind === 'improve' ? 'swap' : 'active';
      if ((r === frame.i && c === frame.k) || (r === frame.k && c === frame.j)) return 'compare';
    }
    if (frame.k >= 0 && frame.kind !== 'done' && frame.kind !== 'negative')
      if (r === frame.k || c === frame.k) return 'frontier';
    return '';
  }

  /** @param {number} r @param {number} c */
  function cellName(r, c) {
    const s = cellState(r, c);
    const state = {
      '': '',
      path: m.states.negative,
      swap: m.states.write,
      active: m.states.kept,
      compare: m.states.input,
      frontier: m.states.rowcol,
      sorted: '',
      visited: '',
    }[s];
    const pick = r === picked[0] && c === picked[1] ? m.states.picked : '';
    return m.cellLabel(
      names[r],
      names[c],
      m.show(frame.dist[r][c]),
      [state, pick].filter(Boolean).join(', '),
    );
  }

  /** @type {{from: [number, number], to: [number, number]}[]} */
  const arrows = $derived(
    comparing
      ? /** @type {[number, number][]} */ ([
          [frame.i, frame.k],
          [frame.k, frame.j],
        ])
          .filter(([r, c]) => r !== frame.i || c !== frame.j)
          .map((from) => ({ from, to: [frame.i, frame.j] }))
      : [],
  );

  const vertexLegend = [
    ['bg-state-active', m.legend.k],
    ['bg-state-compare', m.legend.ends],
    ['bg-state-path', m.legend.negative],
  ];
  const cellLegend = [
    ['bg-state-frontier', m.legend.rowcol],
    ['bg-state-compare', m.legend.inputs],
    ['bg-state-swap', m.legend.write],
    ['bg-state-active', m.legend.kept],
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
    <button type="button" class="btn-secondary" onclick={nextK}>{m.nextK}</button>
    <button type="button" class="btn-outline" onclick={() => load(preset)}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4">
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs text-slate-500">{m.matrixTitle}</h2>
          <DpTable
            values={frame.dist.map((row) => row.map(m.show))}
            ariaLabel={m.matrixAria}
            rowHeaders={names}
            colHeaders={names}
            stateOf={cellState}
            labelOf={cellName}
            {arrows}
            onselect={(r, c) => (picked = [r, c])}
            selected={picked}
            speed={player.speed}
          />
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each cellLegend as [cls, label], i (i)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm {cls}"></span>{label}
              </li>
            {/each}
          </ul>
        </div>
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
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
            labelOf={(n) => {
              const i = order.indexOf(n.id);
              return m.vertexLabel(names[i], stateName(i));
            }}
            onchange={onGraphChange}
            speed={player.speed}
          />
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each vertexLegend as [cls, label], i (i)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm {cls}"></span>{label}
              </li>
            {/each}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-path"></span>{m.legend.path}
            </li>
          </ul>
        </div>
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
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.comparisons} / {names.length ** 3}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.updates}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.updates}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.phase}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.k >= 0 ? names[frame.k] : '—'}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
        <h2 class="mb-2 text-xs text-slate-500">{m.pathTitle}</h2>
        <p>
          {m.pathText(
            names[picked[0]] ?? '',
            names[picked[1]] ?? '',
            path.map((v) => names[v]),
            frame.dist[picked[0]]?.[picked[1]] ?? Infinity,
          )}
        </p>
      </div>
      <ChipList
        title={m.allowedTitle}
        emptyText={m.emptyText}
        items={names.slice(0, frame.k + 1).map((label, i) => ({ label, hot: i === frame.k }))}
      />
      <CodePanel lines={floydPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="min-w-0 lg:col-start-1 lg:row-start-3">
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
                    min={-MAX_WEIGHT}
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
