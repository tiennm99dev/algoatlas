<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_OPS,
    MAX_WEIGHT,
    relaxPseudocode,
    relaxationTrace,
    shortestDistances,
    treePath,
  } from '$lib/algo-engine/shortest-path-properties.js';
  import { en as m } from '$lib/lessons/shortest-path-properties/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'path' | 'list' | 'reverse' | 'twice'} Preset */

  const SOURCE = 0;
  /** @type {GraphNode[]} */
  const NODES = [
    { id: 0, x: 50, y: 150, label: 'S' },
    { id: 1, x: 190, y: 55, label: 'A' },
    { id: 2, x: 190, y: 245, label: 'B' },
    { id: 3, x: 330, y: 55, label: 'C' },
    { id: 4, x: 430, y: 200, label: 'D' },
  ];
  const DEFAULT_WEIGHTS = [6, 2, 3, 2, 7, 1, 9];
  const PAIRS = [
    [0, 1],
    [0, 2],
    [2, 1],
    [1, 3],
    [2, 3],
    [3, 4],
    [2, 4],
  ];
  const ALL = PAIRS.map((_, k) => k);
  /** @type {Record<Preset, number[]>} */
  const PRESETS = {
    path: [1, 2, 3, 5],
    list: ALL,
    reverse: ALL.toReversed(),
    twice: [...ALL.toReversed(), ...ALL.toReversed()],
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));
  const names = NODES.map((n) => n.label ?? '');

  let weights = $state(DEFAULT_WEIGHTS.slice());
  let ops = $state(PRESETS.list.slice());
  let preset = $state(/** @type {Preset | ''} */ ('list'));
  let target = $state(4);
  let notice = $state({ text: '', at: -1 });

  /** @type {import('$lib/algo-engine/shortest-path-properties.js').WeightedEdge[]} */
  const edges = $derived(PAIRS.map(([from, to], k) => ({ from, to, weight: weights[k] })));

  const build = () =>
    relaxationTrace({ n: NODES.length, edges: edges, source: SOURCE, ops: ops.slice() });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const truth = $derived(shortestDistances(NODES.length, edges, SOURCE));
  const current = $derived(frame.edge >= 0 ? edges[frame.edge] : null);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, names, current, NODES.length),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuilds the trace and shows the frame of relaxation `op`, or the end. */
  function rebuild(op = -1) {
    notice = { text: '', at: -1 };
    player.load(build());
    if (op >= 0) player.seek(op + 1);
    else player.seek(player.frames.length - 1);
  }

  /** @param {number} k */
  function relax(k) {
    if (ops.length >= MAX_OPS) {
      say(m.opsFull(MAX_OPS));
      return;
    }
    ops = [...ops, k];
    preset = '';
    rebuild(ops.length - 1);
  }

  function undo() {
    if (!ops.length) return;
    ops = ops.slice(0, -1);
    preset = '';
    rebuild();
  }

  function clear() {
    ops = [];
    preset = '';
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    preset = /** @type {Preset} */ (e.currentTarget.value);
    ops = PRESETS[preset].slice();
    player.load(build());
    notice = { text: '', at: -1 };
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || w < 0 || w > MAX_WEIGHT) {
      e.currentTarget.value = String(weights[k]);
      say(m.badWeight(MAX_WEIGHT));
      return;
    }
    weights[k] = w;
    const at = player.index;
    player.load(build());
    player.seek(at);
    notice = { text: '', at: -1 };
  }

  function resetWeights() {
    weights = DEFAULT_WEIGHTS.slice();
    rebuild();
  }

  /** @param {number} k */
  const edgeName = (k) => `${names[PAIRS[k][0]]} → ${names[PAIRS[k][1]]}`;

  const path = $derived(treePath(frame.parent, SOURCE, target));
  const pathWeights = $derived(
    path.slice(1).map((v, i) => {
      const k = PAIRS.findIndex(([a, b]) => a === path[i] && b === v);
      return weights[k];
    }),
  );
  const prefix = $derived(pathWeights.reduce((acc, w) => [...acc, acc[acc.length - 1] + w], [0]));
  const pathEdges = $derived(new Set(path.slice(1).map((v, i) => `${path[i]}-${v}`)));

  /** @param {number} v @returns {VisualState} */
  function stateAt(v) {
    if (current && frame.kind === 'relax') {
      if (v === current.from) return 'compare';
      if (v === current.to) return frame.improved ? 'swap' : 'compare';
    }
    if (frame.dist[v] === truth[v] && frame.dist[v] !== Infinity) return 'sorted';
    return '';
  }

  /** @param {number} v */
  function stateName(v) {
    const parts = [];
    if (v === SOURCE) parts.push(m.states.source);
    if (current && frame.kind === 'relax') {
      if (v === current.from) parts.push(m.states.read);
      if (v === current.to) parts.push(frame.improved ? m.states.write : m.states.unchanged);
    }
    if (frame.dist[v] === truth[v] && frame.dist[v] !== Infinity) parts.push(m.states.exact);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    if (current && frame.kind === 'relax' && e.from === current.from && e.to === current.to)
      return 'active';
    if (pathEdges.has(`${e.from}-${e.to}`)) return 'path';
    if (frame.parent[e.to] === e.from) return 'visited';
    return '';
  }

  const opItems = $derived(ops.map((k, i) => ({ label: edgeName(k), hot: i === frame.op })));

  const legend = [
    ['bg-state-compare', m.legend.read],
    ['bg-state-swap', m.legend.write],
    ['bg-state-sorted', m.legend.exact],
  ];
  const edgeLegend = [
    ['bg-state-active', m.legend.edgeNow],
    ['bg-state-visited', m.legend.tree],
    ['bg-state-path', m.legend.path],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" aria-disabled={!ops.length} onclick={undo}
      >{m.undo}</button
    >
    <button type="button" class="btn-outline" onclick={clear}>{m.clear}</button>
    <button type="button" class="btn-outline" onclick={resetWeights}>{m.resetWeights}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          nodes={NODES}
          {edges}
          ariaLabel={m.graphAria}
          directed
          weighted
          nodeState={stateAt}
          {edgeState}
          markerOf={(id) => (id === SOURCE ? 's' : '')}
          noteOf={(id) => m.dNote(frame.dist[id])}
          labelOf={(n) => m.vertexLabel(names[n.id], frame.dist[n.id], stateName(n.id))}
          onselect={(id) => (target = id)}
          selected={target}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="font-mono font-bold">s</span>{m.legend.source}
          </li>
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
          <dt class="text-xs text-slate-500">{m.stats.exact}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.exact} / {NODES.length}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
        <h2 class="mb-2 text-xs text-slate-500">{m.pathTitle}: {names[target]}</h2>
        {#if path.length}
          <p>
            {m.pathText(
              names[target],
              path.map((v) => names[v]),
              pathWeights,
              frame.dist[target],
              truth[target],
            )}
          </p>
          {#if prefix[prefix.length - 1] === truth[target] && path.length > 1}
            <p class="mt-2 text-slate-600">
              {m.substructure(
                path.map((v) => names[v]),
                prefix,
              )}
            </p>
          {/if}
        {:else}
          <p>{m.noPath(names[target])}</p>
        {/if}
      </div>
      <ChipList
        title={m.sequenceTitle}
        emptyText={m.emptyText}
        hotLabel={m.hotLabel}
        items={opItems}
        limit={MAX_OPS}
      />
      <CodePanel lines={relaxPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        <table class="w-full text-sm">
          <thead class="sr-only">
            <tr>
              {#each m.edgeHead as h, i (i)}
                <th>{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each ALL as k (k)}
              <tr class={frame.edge === k ? 'bg-amber-50' : ''}>
                <td class="py-1 pr-2 font-mono">{edgeName(k)}</td>
                <td class="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    max={MAX_WEIGHT}
                    step="1"
                    class="field w-20"
                    aria-label={m.weightAria(edgeName(k))}
                    value={weights[k]}
                    onchange={(e) => setWeight(k, e)}
                  />
                </td>
                <td class="py-1 text-right">
                  <button
                    type="button"
                    class="btn-secondary"
                    aria-label={m.relaxAria(edgeName(k))}
                    onclick={() => relax(k)}>{m.relax}</button
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
