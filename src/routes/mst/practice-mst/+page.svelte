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
    MAX_WEIGHT,
    bottleneckPseudocode,
    bottleneckTrace,
    edgeInfo,
    judgeTree,
    minimumTree,
    secondBestPseudocode,
    secondBestTrace,
  } from '$lib/algo-engine/practice-mst.js';
  import { en as m } from '$lib/lessons/practice-mst/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/practice-mst.js').BottleneckFrame} BottleneckFrame */
  /** @typedef {import('$lib/algo-engine/practice-mst.js').SecondBestFrame} SecondBestFrame */
  /** @typedef {import('$lib/algo-engine/practice-mst.js').TreeVerdict} TreeVerdict */
  /** @typedef {'predict' | 'bottleneck' | 'second'} Mode */

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

  let mode = $state(/** @type {Mode} */ ('predict'));
  let nodes = $state.raw(DEFAULT_NODES);
  let edges = $state.raw(DEFAULT_EDGES);
  let sourceId = $state(0);
  let targetId = $state(5);
  /** Input edge indices the learner ticked as their tree. */
  let picked = $state.raw(/** @type {number[]} */ ([]));
  let verdict = $state(/** @type {TreeVerdict | null} */ (null));
  let notice = $state({ text: '', at: -1 });

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const info = $derived(edgeInfo(order, edges).list);
  const mst = $derived(minimumTree(order, edges));
  const pickedSet = $derived(new Set(picked));
  const pickedWeight = $derived(picked.reduce((s, k) => s + (info[k]?.w ?? 0), 0));

  /** @returns {(BottleneckFrame | SecondBestFrame)[]} */
  const build = () =>
    mode === 'second'
      ? secondBestTrace({ ids: order, edges })
      : bottleneckTrace({
          ids: order,
          edges,
          source: order.indexOf(sourceId),
          target: order.indexOf(targetId),
        });
  const player = createPlayer(build());
  const bf = $derived(mode === 'bottleneck' ? /** @type {BottleneckFrame} */ (player.frame) : null);
  const sf = $derived(mode === 'second' ? /** @type {SecondBestFrame} */ (player.frame) : null);
  const narration = $derived(
    notice.at === player.index && mode !== 'predict'
      ? notice.text
      : bf
        ? m.describeBottleneck(bf, names, info)
        : sf
          ? m.describeSecond(sf, names, info)
          : '',
  );
  /** Text shown under the graph in Predict mode. */
  const predictText = $derived(
    notice.at === -2 ? notice.text : verdict ? m.verdict(verdict, names, info) : m.predictHelp,
  );

  let built = graphShape(DEFAULT_NODES, DEFAULT_EDGES);
  /** The edge list the ticks refer to, without weights. */
  let pickShape = graphShape(DEFAULT_NODES, DEFAULT_EDGES, false);

  function rebuild() {
    built = graphShape(nodes, edges);
    notice = { text: '', at: -1 };
    verdict = null;
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    if (!nodes.some((n) => n.id === sourceId)) sourceId = order[0] ?? 0;
    if (!nodes.some((n) => n.id === targetId)) targetId = order.at(-1) ?? 0;
    // Edge indices shift when an edge or vertex goes, so the ticks would point elsewhere.
    const shape = graphShape(nodes, edges, false);
    if (shape !== pickShape) picked = [];
    pickShape = shape;
    // Dragging a vertex only moves the drawing; keep the current step.
    if (graphShape(nodes, edges) !== built) rebuild();
  }

  function reset() {
    nodes = DEFAULT_NODES;
    edges = DEFAULT_EDGES;
    sourceId = 0;
    targetId = 5;
    picked = [];
    pickShape = graphShape(nodes, edges, false);
    rebuild();
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || w < 1 || w > MAX_WEIGHT) {
      e.currentTarget.value = String(edges[k].weight ?? 1);
      notice = { text: m.badWeight(MAX_WEIGHT), at: mode === 'predict' ? -2 : player.index };
      return;
    }
    edges = edges.map((x, i) => (i === k ? { ...x, weight: w } : x));
    rebuild();
  }

  /** @param {number} k @param {boolean} on */
  function pick(k, on) {
    picked = on ? [...picked.filter((x) => x !== k), k] : picked.filter((x) => x !== k);
    verdict = null;
    notice = { text: '', at: -1 };
  }

  function check() {
    notice = { text: '', at: -1 };
    verdict = judgeTree(order, edges, picked);
  }

  /** @param {GraphEdge} e */
  const edgeName = (e) =>
    `${names[order.indexOf(e.from)] ?? e.from} — ${names[order.indexOf(e.to)] ?? e.to}`;

  const pathNodes = $derived(new Set(bf?.path ?? []));
  const pathEdges = $derived(new Set(bf?.pathEdges ?? sf?.pathEdges ?? []));

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (bf) {
      if (i === bf.source || i === bf.target) return 'active';
      if (pathNodes.has(i)) return 'path';
    }
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    if (!bf) return '';
    const parts = [];
    if (i === bf.source) parts.push(m.states.source);
    if (i === bf.target) parts.push(m.states.target);
    if (pathNodes.has(i) && i !== bf.source && i !== bf.target) parts.push(m.states.onPath);
    return parts.join(', ');
  }

  /** @param {number} id */
  function markerOf(id) {
    if (!bf) return '';
    const i = order.indexOf(id);
    return i === bf.source ? 's' : i === bf.target ? 't' : '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = edges.findIndex((x) => x.from === e.from && x.to === e.to);
    if (mode === 'predict') {
      if (verdict?.kind === 'heavier' && k === verdict.add) return 'active';
      if (verdict && (k === verdict.drop || k === verdict.closing)) return 'swap';
      return pickedSet.has(k) ? 'path' : '';
    }
    if (bf) {
      if (pathEdges.has(k)) return 'path';
      if (k === bf.edge) return bf.kind === 'reject' ? 'swap' : 'active';
      if (bf.status[k] === 'tree') return 'sorted';
      if (bf.status[k] === 'cycle') return 'visited';
      return '';
    }
    if (sf) {
      const add = sf.kind === 'done' ? sf.bestAdd : sf.edge;
      const drop = sf.kind === 'done' ? sf.bestDrop : sf.drop;
      if (k === add) return 'active';
      if (k === drop) return 'swap';
      if (sf.kind !== 'done' && pathEdges.has(k)) return 'path';
      if (sf.tree.includes(k)) return 'sorted';
    }
    return '';
  }

  const sortedItems = $derived(
    (bf?.sorted ?? []).map((k) => ({
      label: m.sortedChip(info[k], names, bf?.status[k] ? m.marks[bf.status[k]] : ''),
      hot: k === bf?.edge,
    })),
  );
  const swapItems = $derived(
    sf
      ? /** @type {SecondBestFrame[]} */ (player.frames.slice(0, player.index + 1))
          .filter((f) => f.kind === 'better' || f.kind === 'worse')
          .map((f) => ({
            label: m.swapChip(info[f.edge], info[f.drop], f.candidate, names),
            hot: f.edge === sf.edge,
          }))
      : [],
  );

  const stats = $derived(
    bf
      ? [
          [m.stats.considered, bf.considered],
          [m.stats.bottleneck, m.show(bf.bottleneck)],
          [m.stats.pathEdges, bf.pathEdges.length],
          [m.stats.mst, mst.components > 1 ? m.none : mst.weight],
        ]
      : sf
        ? [
            [m.stats.mst, m.show(sf.mst)],
            [m.stats.checked, sf.checked],
            [m.stats.best, m.show(sf.best)],
          ]
        : [],
  );

  const legend = $derived(
    mode === 'predict'
      ? [
          ['bg-state-path', m.legend.picked],
          ['bg-state-active', m.legend.swapIn],
          ['bg-state-swap', m.legend.flagged],
        ]
      : mode === 'bottleneck'
        ? [
            ['bg-state-active', m.legend.now],
            ['bg-state-swap', m.legend.skipNow],
            ['bg-state-sorted', m.legend.tree],
            ['bg-state-visited', m.legend.rejected],
            ['bg-state-path', m.legend.path],
          ]
        : [
            ['bg-state-sorted', m.legend.tree],
            ['bg-state-path', m.legend.path],
            ['bg-state-active', m.legend.add],
            ['bg-state-swap', m.legend.drop],
          ],
  );
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={[
        { value: 'predict', label: m.modes.predict },
        { value: 'bottleneck', label: m.modes.bottleneck },
        { value: 'second', label: m.modes.second },
      ]}
      bind:value={mode}
      onchange={rebuild}
    />
    {#if mode === 'bottleneck'}
      {#each [['source', m.sourceLabel], ['target', m.targetLabel]] as [field, label] (field)}
        <label
          class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          {label}
          <select
            name={field}
            class="field"
            value={field === 'source' ? sourceId : targetId}
            onchange={(e) => {
              const id = Number(e.currentTarget.value);
              if (field === 'source') sourceId = id;
              else targetId = id;
              rebuild();
            }}
          >
            {#each order as id, i (id)}
              <option value={id}>{names[i]}</option>
            {/each}
          </select>
        </label>
      {/each}
    {:else if mode === 'predict'}
      <button type="button" class="btn-primary" onclick={check}>{m.check}</button>
      <button
        type="button"
        class="btn-outline"
        aria-disabled={picked.length === 0}
        onclick={() => {
          if (!picked.length) return;
          picked = [];
          verdict = null;
        }}>{m.clear}</button
      >
    {/if}
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
          {markerOf}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.vertexLabel(names[i], stateName(i));
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#if mode === 'bottleneck'}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm bg-state-active"></span><span
                class="font-mono font-bold">s t</span
              >{m.legend.source}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm bg-state-path"></span>{m.legend.pathVertex}
            </li>
          {/if}
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="h-1 w-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
        </ul>
      </div>

      {#if mode === 'predict'}
        <div
          class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
          aria-live="polite"
        >
          <p>{predictText}</p>
          <p class="mt-1 text-sm text-slate-600">
            {m.pickedSummary(picked.length, Math.max(0, order.length - 1), pickedWeight)}
          </p>
        </div>
      {:else}
        <p
          class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
          aria-live={player.playing ? 'off' : 'polite'}
        >
          {narration}
        </p>
      {/if}
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-3">
      {#if stats.length}
        <dl class="grid grid-cols-2 gap-3">
          {#each stats as [label, value], i (label)}
            <div
              class="rounded-xl border border-slate-200 bg-white p-3 {i === stats.length - 1 &&
              stats.length % 2
                ? 'col-span-2'
                : ''}"
            >
              <dt class="text-xs text-slate-500">{label}</dt>
              <dd class="text-2xl font-bold tabular-nums">{value}</dd>
            </div>
          {/each}
        </dl>
      {/if}
      {#if bf}
        <ChipList
          title={m.sortedTitle}
          emptyText={m.emptyText}
          hotLabel={m.hotLabel}
          items={sortedItems}
        />
        <CodePanel lines={bottleneckPseudocode} active={bf.lines} />
      {:else if sf}
        <ChipList
          title={m.candidatesTitle}
          emptyText={m.emptyText}
          hotLabel={m.hotLabel}
          items={swapItems}
        />
        <CodePanel lines={secondBestPseudocode} active={sf.lines} />
      {/if}
    </div>
    {#if mode !== 'predict'}
      <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
        <StepControls {player} />
      </div>
    {/if}
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        {#if edges.length}
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">
            {#each edges as e, k (k)}
              <li class="flex items-center justify-between gap-2 text-sm">
                <label class="flex items-center gap-2">
                  {#if mode === 'predict'}
                    <input
                      type="checkbox"
                      aria-label={m.pickAria(edgeName(e))}
                      checked={pickedSet.has(k)}
                      onchange={(ev) => pick(k, ev.currentTarget.checked)}
                    />
                  {/if}
                  <span class="font-mono">{edgeName(e)}</span>
                </label>
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
