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
    COVER_PRESETS,
    MAX_NODES,
    coverTrace,
    greedyPseudocode,
    harmonic,
    matchingPseudocode,
  } from '$lib/algo-engine/approximation-algorithms.js';
  import { en as m } from '$lib/lessons/approximation-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/approximation-algorithms.js').CoverAlgorithm} CoverAlgorithm */
  /** @typedef {import('$lib/algo-engine/approximation-algorithms.js').CoverPreset} CoverPreset */

  /** @param {CoverPreset} p */
  const nodesOf = (p) =>
    /** @type {GraphNode[]} */ (p.spots.map(([x, y], id) => ({ id, x, y, label: letter(id) })));
  /** @param {CoverPreset} p */
  const edgesOf = (p) => /** @type {GraphEdge[]} */ (p.pairs.map(([from, to]) => ({ from, to })));

  const FIRST = COVER_PRESETS[0];
  const ALGORITHMS = /** @type {CoverAlgorithm[]} */ (['matching', 'greedy']);

  let nodes = $state.raw(nodesOf(FIRST));
  let edges = $state.raw(edgesOf(FIRST));
  let algorithm = $state(/** @type {CoverAlgorithm} */ ('matching'));
  let preset = $state(FIRST.key);

  const build = () => coverTrace({ ids: nodes.map((n) => n.id), edges }, algorithm);
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const narration = $derived(m.describe(frame, names));

  let built = graphShape(nodesOf(FIRST), edgesOf(FIRST), false);

  function rebuild() {
    built = graphShape(nodes, edges, false);
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (graphShape(nodes, edges, false) === built) return;
    preset = '';
    rebuild();
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = COVER_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    nodes = nodesOf(p);
    edges = edgesOf(p);
    rebuild();
  }

  const coverSet = $derived(new Set(frame.cover));
  const optSet = $derived(new Set(frame.optimum));
  const matchSet = $derived(new Set(frame.matching));
  const current = $derived.by(() => {
    if (frame.vertex >= 0) return new Set([frame.vertex]);
    if (frame.edge >= 0) return new Set(frame.edges[frame.edge]);
    return new Set();
  });

  /** @param {number} id @returns {VisualState} */
  function nodeState(id) {
    const i = order.indexOf(id);
    if (current.has(i) && frame.kind !== 'done') return 'active';
    if (coverSet.has(i)) return 'sorted';
    return '';
  }

  /** @param {number} id */
  function stateName(id) {
    const i = order.indexOf(id);
    const parts = [];
    if (current.has(i) && frame.kind !== 'done') parts.push(m.states.current);
    if (coverSet.has(i)) parts.push(m.states.cover);
    if (optSet.has(i)) parts.push(m.states.optimum);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e */
  function edgeIndex(e) {
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    return frame.edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const i = edgeIndex(e);
    if (i < 0) return '';
    if (i === frame.edge && frame.kind !== 'done') return 'active';
    if (matchSet.has(i)) return 'path';
    if (frame.covered[i]) return 'visited';
    return '';
  }

  /** Δ, the largest degree, which sets the greedy guarantee. */
  const delta = $derived.by(() => {
    const d = Array.from({ length: order.length }, () => 0);
    for (const [u, v] of frame.edges) {
      d[u]++;
      d[v]++;
    }
    return Math.max(0, ...d);
  });
  /** How many vertices the current step added to the cover. */
  const fresh = $derived(frame.kind === 'take' ? 2 : frame.kind === 'pick' ? 1 : 0);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.algorithmLabel}
      name="algorithm"
      options={ALGORITHMS.map((v) => ({ value: v, label: m.algorithms[v] }))}
      bind:value={algorithm}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each COVER_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
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
          {nodeState}
          {edgeState}
          markerOf={(id) => (optSet.has(order.indexOf(id)) ? m.markers.optimum : '')}
          noteOf={(id) =>
            algorithm === 'greedy' && frame.kind !== 'done'
              ? m.degreeNote(frame.degree[order.indexOf(id)] ?? 0)
              : ''}
          labelOf={(n) => m.vertexLabel(n.label ?? letter(n.id), stateName(n.id))}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.current}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-sorted"></span>{m.legend.cover}
          </li>
          <li>{m.legend.optimum}</li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.edge}
          </li>
          {#if algorithm === 'matching'}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm bg-state-path"></span>{m.legend.matched}
            </li>
          {/if}
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-visited"></span>{m.legend.covered}
          </li>
        </ul>
        {#if algorithm === 'greedy'}
          <p class="mt-1 text-xs text-slate-600">{m.degreeHint}</p>
        {/if}
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cover}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="cover">{frame.cover.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.optimum}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="optimum">
            {frame.optimum.length}
          </dd>
        </div>
        {#if algorithm === 'matching'}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.matched}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="side">
              {frame.matching.length}
            </dd>
            <dd class="text-xs text-slate-600">{m.matchedNote(frame.matching.length)}</dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.picks}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="side">
              {frame.cover.length}
            </dd>
            <dd class="text-xs text-slate-600">{m.greedyNote(delta, harmonic(delta))}</dd>
          </div>
        {/if}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.ratio}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="ratio">
            {frame.kind === 'done' ? m.ratio(frame.cover.length, frame.optimum.length) : '—'}
          </dd>
          <dd class="text-xs text-slate-600">{m.ratioNote[algorithm]}</dd>
        </div>
      </dl>
      <ChipList
        title={m.coverTitle}
        emptyText={m.coverEmpty}
        items={frame.cover.map((v, i) => ({
          label: names[v],
          hot: i >= frame.cover.length - fresh,
        }))}
      />
      <CodePanel
        lines={algorithm === 'matching' ? matchingPseudocode : greedyPseudocode}
        active={frame.lines}
      />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
