<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_WEIGHT,
    dagLongPseudocode,
    dagShortPseudocode,
    dagTrace,
    zeroOnePseudocode,
    zeroOneTrace,
  } from '$lib/algo-engine/zero-one-bfs-dag.js';
  import { en as m } from '$lib/lessons/zero-one-bfs-dag/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/zero-one-bfs-dag.js').ZeroOneFrame} ZeroOneFrame */
  /** @typedef {import('$lib/algo-engine/zero-one-bfs-dag.js').DagFrame} DagFrame */
  /** @typedef {'zeroOne' | 'short' | 'long'} Mode */

  /** @type {GraphNode[]} */
  const ZO_NODES = [
    { id: 0, x: 50, y: 150, label: 'S' },
    { id: 1, x: 170, y: 60, label: 'A' },
    { id: 2, x: 170, y: 240, label: 'B' },
    { id: 3, x: 290, y: 240, label: 'C' },
    { id: 4, x: 290, y: 60, label: 'D' },
    { id: 5, x: 410, y: 240, label: 'E' },
    { id: 6, x: 430, y: 110, label: 'T' },
  ];
  const ZO_PAIRS = [
    [0, 1],
    [0, 2],
    [2, 1],
    [2, 3],
    [1, 4],
    [3, 4],
    [3, 5],
    [4, 6],
    [5, 6],
  ];
  const ZO_WEIGHTS = [1, 0, 1, 0, 0, 1, 1, 1, 0];

  /** @type {GraphNode[]} */
  const DAG_NODES = [
    { id: 0, x: 45, y: 200, label: 'R' },
    { id: 1, x: 120, y: 90, label: 'S' },
    { id: 2, x: 200, y: 220, label: 'T' },
    { id: 3, x: 285, y: 90, label: 'X' },
    { id: 4, x: 365, y: 220, label: 'Y' },
    { id: 5, x: 440, y: 110, label: 'Z' },
  ];
  const DAG_PAIRS = [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 3],
    [2, 4],
    [2, 5],
    [3, 4],
    [3, 5],
    [4, 5],
  ];
  const DAG_WEIGHTS = [5, 3, 2, 6, 7, 4, 2, -1, 1, -2];

  let mode = $state(/** @type {Mode} */ ('zeroOne'));
  let zoWeights = $state(ZO_WEIGHTS.slice());
  let dagWeights = $state(DAG_WEIGHTS.slice());
  let zoSource = $state(0);
  let dagSource = $state(1);
  let notice = $state({ text: '', at: -1 });

  const isZo = $derived(mode === 'zeroOne');
  const graphNodes = $derived(isZo ? ZO_NODES : DAG_NODES);
  const pairs = $derived(isZo ? ZO_PAIRS : DAG_PAIRS);
  const weights = $derived(isZo ? zoWeights : dagWeights);
  const source = $derived(isZo ? zoSource : dagSource);
  const names = $derived(graphNodes.map((n) => n.label ?? ''));
  /** @type {import('$lib/algo-engine/zero-one-bfs-dag.js').DirEdge[]} */
  const edges = $derived(pairs.map(([from, to], k) => ({ from, to, weight: weights[k] })));

  /** @returns {(ZeroOneFrame | DagFrame)[]} */
  const build = () =>
    isZo
      ? zeroOneTrace({ n: graphNodes.length, edges, source })
      : dagTrace({ n: graphNodes.length, edges, source, longest: mode === 'long' });

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const zo = $derived(isZo ? /** @type {ZeroOneFrame} */ (frame) : null);
  const dag = $derived(isZo ? null : /** @type {DagFrame} */ (frame));
  const narration = $derived.by(() => {
    if (notice.at === player.index) return notice.text;
    if (zo) return m.describeZeroOne(zo, names);
    return dag ? m.describeDag(dag, names, mode === 'long') : '';
  });
  const pseudocode = $derived(
    isZo ? zeroOnePseudocode : mode === 'long' ? dagLongPseudocode : dagShortPseudocode,
  );

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {number} k */
  function toggle(k) {
    zoWeights[k] = 1 - zoWeights[k];
    rebuild();
  }

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setWeight(k, e) {
    const raw = e.currentTarget.value.trim();
    const w = Number(raw);
    if (raw === '' || !Number.isInteger(w) || Math.abs(w) > MAX_WEIGHT) {
      e.currentTarget.value = String(dagWeights[k]);
      notice = { text: m.badWeight(MAX_WEIGHT), at: player.index };
      return;
    }
    dagWeights[k] = w;
    rebuild();
  }

  function resetWeights() {
    if (isZo) zoWeights = ZO_WEIGHTS.slice();
    else dagWeights = DAG_WEIGHTS.slice();
    rebuild();
  }

  /** @param {{from: number, to: number}} e */
  const edgeName = (e) => `${names[e.from]} → ${names[e.to]}`;
  const unreached = $derived(mode === 'long' ? -Infinity : Infinity);

  /** @param {number} v @returns {VisualState} */
  function stateAt(v) {
    const live = frame.kind !== 'done' && frame.kind !== 'start';
    if (live && v === frame.current) return 'active';
    if (v === frame.neighbor) return 'compare';
    if (zo) {
      if (zo.done[v]) return 'sorted';
      if (zo.deque.some((e) => e.v === v)) return 'frontier';
      return '';
    }
    if (dag && dag.pos >= 0 && dag.order.indexOf(v) < dag.pos) return 'sorted';
    if (dag && dag.kind === 'done' && dag.dist[v] !== unreached) return 'sorted';
    return '';
  }

  /** @param {number} v */
  function stateName(v) {
    const s = stateAt(v);
    const parts = [];
    if (v === source) parts.push(m.states.source);
    if (s === 'active') parts.push(m.states.current);
    if (s === 'compare') parts.push(m.states.neighbor);
    if (s === 'frontier') parts.push(m.states.queued);
    if (s === 'sorted') parts.push(zo ? m.states.done : m.states.passed);
    return parts.join(', ');
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const k = pairs.findIndex(([a, b]) => a === e.from && b === e.to);
    if (k === frame.edge) return 'active';
    if (frame.parent[e.to] === e.from) return 'visited';
    return '';
  }

  /** @param {number} i */
  const isStale = (i) => {
    if (!zo) return false;
    const e = zo.deque[i];
    return zo.done[e.v] || e.d > zo.dist[e.v];
  };
  const pushedAt = $derived(
    zo && zo.kind === 'improve' ? (zo.front ? 0 : zo.deque.length - 1) : -1,
  );
  const dequeItems = $derived(
    zo
      ? zo.deque.map((e, i) => ({
          label: `${names[e.v]} ${e.d}`,
          state: /** @type {VisualState} */ (
            i === pushedAt ? 'active' : isStale(i) ? 'visited' : ''
          ),
          marker: isStale(i) ? m.staleTag : '',
        }))
      : [],
  );

  const legend = $derived([
    ['bg-state-active', m.legend.current],
    ['bg-state-compare', m.legend.neighbor],
    ...(isZo ? [['bg-state-frontier', m.legend.queued]] : []),
    ['bg-state-sorted', isZo ? m.legend.done : m.legend.passed],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={[
        { value: 'zeroOne', label: m.modes.zeroOne },
        { value: 'short', label: m.modes.short },
        { value: 'long', label: m.modes.long },
      ]}
      bind:value={mode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sourceLabel}
      <select
        name="source"
        class="field"
        value={source}
        onchange={(e) => {
          const v = Number(e.currentTarget.value);
          if (isZo) zoSource = v;
          else dagSource = v;
          rebuild();
        }}
      >
        {#each graphNodes as n (n.id)}
          <option value={n.id}>{n.label}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={resetWeights}>{m.resetWeights}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          nodes={graphNodes}
          {edges}
          ariaLabel={isZo ? m.graphAria.zeroOne : m.graphAria.dag}
          directed
          weighted
          nodeState={stateAt}
          {edgeState}
          markerOf={(id) => (id === source ? 's' : '')}
          noteOf={(id) => m.dNote(frame.dist[id])}
          labelOf={(n) => m.vertexLabel(names[n.id], frame.dist[n.id], stateName(n.id))}
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
        {#if zo}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.pops}</dt>
            <dd class="text-2xl font-bold tabular-nums">{zo.pops}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.relaxations}</dt>
            <dd class="text-2xl font-bold tabular-nums">{zo.relaxations}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.pushFront}</dt>
            <dd class="text-2xl font-bold tabular-nums">{zo.pushFront}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.pushBack}</dt>
            <dd class="text-2xl font-bold tabular-nums">{zo.pushBack}</dd>
          </div>
        {:else if dag}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.relaxations}</dt>
            <dd class="text-2xl font-bold tabular-nums">{dag.relaxations} / {edges.length}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.updates}</dt>
            <dd class="text-2xl font-bold tabular-nums">{dag.updates}</dd>
          </div>
        {/if}
      </dl>
      {#if zo}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs text-slate-500">{m.dequeTitle}</h2>
          <StackQueueView
            kind="deque"
            items={dequeItems}
            ariaLabel={m.dequeAria(dequeItems.map((it) => it.label))}
            speed={player.speed}
          />
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.pushed}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm bg-state-visited"></span>{m.legend.stale}
            </li>
          </ul>
        </div>
      {:else if dag}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs text-slate-500">{m.orderTitle}</h2>
          <ArrayStrip
            values={dag.order.map((v) => names[v])}
            ariaLabel={m.orderAria}
            stateOf={(i) =>
              i === dag.pos ? 'active' : dag.pos >= 0 && i < dag.pos ? 'sorted' : ''}
            pointers={dag.pos >= 0 ? [{ name: m.pointer, index: dag.pos }] : []}
            speed={player.speed}
          />
        </div>
      {/if}
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div class="min-w-0 lg:col-start-1 lg:row-start-3">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.edgesTitle}</h2>
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
          {#each edges as edge, k (`${mode}-${k}`)}
            <li class="flex items-center justify-between gap-2 text-sm">
              <span class="font-mono">{edgeName(edge)}</span>
              {#if isZo}
                <button
                  type="button"
                  class="btn-secondary font-mono"
                  aria-label={m.toggleAria(edgeName(edge), zoWeights[k])}
                  onclick={() => toggle(k)}>{m.toggleText(zoWeights[k])}</button
                >
              {:else}
                <input
                  type="number"
                  min={-MAX_WEIGHT}
                  max={MAX_WEIGHT}
                  step="1"
                  class="field w-16"
                  aria-label={m.weightAria(edgeName(edge))}
                  value={dagWeights[k]}
                  onchange={(e) => setWeight(k, e)}
                />
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
