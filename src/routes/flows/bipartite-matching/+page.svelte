<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_SIDE,
    hopcroftKarpPseudocode,
    kuhnPseudocode,
    matchingTrace,
  } from '$lib/algo-engine/bipartite-matching.js';
  import { en as m } from '$lib/lessons/bipartite-matching/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/bipartite-matching.js').Pair} Pair */
  /** @typedef {import('$lib/algo-engine/bipartite-matching.js').MatchMethod} MatchMethod */
  /** @typedef {'chain' | 'detours' | 'hall'} Preset */

  /** Right vertex r is drawn as graph node RIGHT + r. */
  const RIGHT = 10;

  /** @type {Record<Preset, {left: number, right: number, edges: Pair[]}>} */
  const PRESETS = {
    chain: {
      left: 4,
      right: 4,
      edges: [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 1],
        [2, 2],
        [3, 2],
        [3, 3],
      ],
    },
    detours: {
      left: 5,
      right: 5,
      edges: [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
        [2, 3],
        [3, 2],
        [3, 4],
        [4, 0],
        [4, 3],
      ],
    },
    hall: {
      left: 4,
      right: 3,
      edges: [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
        [2, 2],
        [3, 1],
      ],
    },
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));
  const SIZES = Array.from({ length: MAX_SIDE }, (_, i) => i + 1);

  let preset = $state(/** @type {Preset} */ ('chain'));
  let method = $state(/** @type {MatchMethod} */ ('kuhn'));
  let left = $state(PRESETS.chain.left);
  let right = $state(PRESETS.chain.right);
  let pairs = $state.raw(PRESETS.chain.edges);

  const build = () => matchingTrace({ left, right, edges: pairs, method });
  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame, method));
  const pseudocode = $derived(method === 'kuhn' ? kuhnPseudocode : hopcroftKarpPseudocode);

  const rebuild = () => player.load(build());

  /** @param {Preset} p */
  function load(p) {
    preset = p;
    left = PRESETS[p].left;
    right = PRESETS[p].right;
    pairs = PRESETS[p].edges;
    rebuild();
  }

  /** @param {number} l @param {number} r */
  const has = (l, r) => pairs.some(([a, b]) => a === l && b === r);

  /** @param {number} l @param {number} r */
  function toggle(l, r) {
    pairs = has(l, r)
      ? pairs.filter(([a, b]) => a !== l || b !== r)
      : [...pairs, /** @type {Pair} */ ([l, r])].toSorted((x, y) => x[0] - y[0] || x[1] - y[1]);
    rebuild();
  }

  /** @param {'left' | 'right'} side @param {Event & {currentTarget: HTMLSelectElement}} e */
  function resize(side, e) {
    const n = Number(e.currentTarget.value);
    if (side === 'left') left = n;
    else right = n;
    pairs = pairs.filter(([l, r]) => l < left && r < right);
    rebuild();
  }

  /** @param {number} n @param {number} i */
  const yOf = (n, i) => 150 + (i - (n - 1) / 2) * 48;
  const nodes = $derived([
    ...Array.from({ length: left }, (_, i) => ({
      id: i,
      x: 110,
      y: yOf(left, i),
      label: m.leftName(i),
    })),
    ...Array.from({ length: right }, (_, j) => ({
      id: RIGHT + j,
      x: 370,
      y: yOf(right, j),
      label: m.rightName(j),
    })),
  ]);
  const edges = $derived(pairs.map(([l, r]) => ({ from: l, to: RIGHT + r })));

  /** Edges of the alternating path, as "l-r" keys. */
  const pathEdges = $derived(
    new Set(
      frame.path.slice(1).map((x, i) => {
        const prev = frame.path[i];
        return i % 2 === 0 ? `${prev}-${x}` : `${x}-${prev}`;
      }),
    ),
  );
  const searching = $derived(frame.kind !== 'start' && frame.kind !== 'done');

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const l = e.from;
    const r = e.to - RIGHT;
    if (searching && l === frame.at && r === frame.right) return 'active';
    if (pathEdges.has(`${l}-${r}`)) return 'path';
    if (frame.matchL[l] === r) return 'sorted';
    return '';
  }

  /** @param {number} id @returns {VisualState} */
  function nodeState(id) {
    if (id < RIGHT) {
      if (searching && (id === frame.at || (frame.at < 0 && id === frame.root))) return 'active';
      return frame.matchL[id] >= 0 ? 'sorted' : '';
    }
    const r = id - RIGHT;
    if (searching && r === frame.right) return 'compare';
    if (method === 'kuhn' && searching && frame.visited[r]) return 'visited';
    return frame.matchR[r] >= 0 ? 'sorted' : '';
  }

  /** @param {GraphNode} n */
  function vertexLabel(n) {
    const s = nodeState(n.id);
    const matched = n.id < RIGHT ? frame.matchL[n.id] >= 0 : frame.matchR[n.id - RIGHT] >= 0;
    const parts = [matched ? m.states.matched : m.states.free];
    if (s === 'active') parts.push(m.states.now);
    if (s === 'compare') parts.push(m.states.looked);
    if (s === 'visited') parts.push(m.states.visited);
    return m.vertexLabel(n.label ?? '', parts.join(', '));
  }

  /** @param {number} r @param {number} c @returns {VisualState} */
  const cellState = (r, c) => (frame.matchL[r] === c ? 'sorted' : '');

  const methodOptions = [
    { value: 'kuhn', label: m.methods.kuhn },
    { value: 'hk', label: m.methods.hk },
  ];

  const legend = [
    ['bg-state-active', m.legend.now],
    ['bg-state-compare', m.legend.looked],
    ['bg-state-visited', m.legend.visited],
    ['bg-state-sorted', m.legend.matched],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={methodOptions}
      bind:value={method}
      onchange={rebuild}
    />
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
      {m.leftLabel}
      <select name="left" class="field" value={left} onchange={(e) => resize('left', e)}>
        {#each SIZES as n (n)}
          <option value={n}>{n}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.rightLabel}
      <select name="right" class="field" value={right} onchange={(e) => resize('right', e)}>
        {#each SIZES as n (n)}
          <option value={n}>{n}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-outline" onclick={() => load(preset)}>{m.resetGraph}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GraphCanvas
          {nodes}
          {edges}
          ariaLabel={m.graphAria}
          {nodeState}
          {edgeState}
          noteOf={(id) => (method === 'hk' && id < RIGHT ? m.layerNote(frame.layer[id]) : '')}
          labelOf={vertexLabel}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-active"></span>{m.legend.edgeNow}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-path"></span>{m.legend.path}
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
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.size}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.searches[method]}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.phases}</dd>
        </div>
      </dl>
      <ChipList
        title={m.pathTitle}
        emptyText={m.emptyPath}
        items={frame.path.map((x, i) => ({
          label: i % 2 ? m.rightName(x) : m.leftName(x),
          hot: i === frame.path.length - 1 && frame.kind !== 'flip',
        }))}
      />
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
    <div
      class="min-w-0 rounded-xl border border-slate-200 bg-white p-3 lg:col-start-1 lg:row-start-3"
    >
      <h2 class="mb-2 text-xs text-slate-500">{m.tableTitle}</h2>
      <DpTable
        values={Array.from({ length: left }, (_, r) =>
          Array.from({ length: right }, (_, c) => (has(r, c) ? '✓' : '')),
        )}
        ariaLabel={m.tableAria}
        rowHeaders={Array.from({ length: left }, (_, i) => m.leftName(i))}
        colHeaders={Array.from({ length: right }, (_, i) => m.rightName(i))}
        stateOf={cellState}
        labelOf={(r, c) =>
          m.cellLabel(m.leftName(r), m.rightName(c), has(r, c), frame.matchL[r] === c)}
        onselect={toggle}
        speed={player.speed}
      />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
