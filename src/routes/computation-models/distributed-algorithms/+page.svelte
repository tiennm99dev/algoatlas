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
    MAX_UID,
    floodMaxTrace,
    floodPseudocode,
    randomUids,
  } from '$lib/algo-engine/distributed-algorithms.js';
  import { en as m } from '$lib/lessons/distributed-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/distributed-algorithms.js').FloodVariant} FloodVariant */
  /** @typedef {keyof typeof m.presets} Preset */
  /** @typedef {{nodes: GraphNode[], edges: GraphEdge[], uids: number[]}} Network */

  /**
   * @param {[number, number][]} spots
   * @param {[number, number][]} pairs
   * @param {number[]} uids
   * @returns {Network}
   */
  const networkOf = (spots, pairs, uids) => ({
    nodes: spots.map(([x, y], id) => ({ id, x, y, label: letter(id) })),
    edges: pairs.map(([from, to]) => ({ from, to })),
    uids,
  });

  /** @type {Record<Preset, Network>} */
  const PRESETS = {
    ring: networkOf(
      [
        [240, 35],
        [350, 95],
        [350, 205],
        [240, 255],
        [130, 205],
        [130, 95],
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
      ],
      [3, 7, 2, 9, 4, 6],
    ),
    path: networkOf(
      [
        [40, 140],
        [120, 140],
        [200, 140],
        [280, 140],
        [360, 140],
        [440, 140],
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ],
      [5, 1, 8, 3, 6, 2],
    ),
    tree: networkOf(
      [
        [240, 35],
        [130, 125],
        [350, 125],
        [70, 225],
        [190, 225],
        [300, 225],
        [420, 225],
      ],
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [2, 6],
      ],
      [4, 8, 1, 6, 9, 2, 5],
    ),
    mesh: networkOf(
      [
        [100, 40],
        [240, 40],
        [380, 40],
        [100, 140],
        [240, 140],
        [380, 140],
        [100, 240],
        [240, 240],
        [380, 240],
      ],
      [
        [0, 1],
        [1, 2],
        [3, 4],
        [4, 5],
        [6, 7],
        [7, 8],
        [0, 3],
        [3, 6],
        [1, 4],
        [4, 7],
        [2, 5],
        [5, 8],
      ],
      [12, 5, 31, 7, 20, 3, 15, 9, 26],
    ),
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));
  const VARIANT_OPTIONS = /** @type {FloodVariant[]} */ (['change', 'every']).map((value) => ({
    value,
    label: m.variants[value],
  }));
  const ID_OPTIONS = /** @type {('unique'|'equal')[]} */ (['unique', 'equal']).map((value) => ({
    value,
    label: m.idModes[value],
  }));

  let nodes = $state.raw(PRESETS.ring.nodes);
  let edges = $state.raw(PRESETS.ring.edges);
  /** UID of each node, by node id. */
  let uidById = $state.raw(
    /** @type {Record<number, number>} */ (Object.fromEntries(PRESETS.ring.uids.entries())),
  );
  let variant = $state(/** @type {FloodVariant} */ ('change'));
  let idMode = $state('unique');

  const order = $derived(nodes.map((n) => n.id).toSorted((a, b) => a - b));
  const names = $derived(order.map((id) => nodes.find((n) => n.id === id)?.label ?? letter(id)));
  const uids = $derived(order.map((id) => (idMode === 'equal' ? 1 : uidById[id])));

  const build = () =>
    floodMaxTrace(
      {
        ids: nodes.map((n) => n.id),
        edges,
        uids: nodes
          .map((n) => n.id)
          .toSorted((a, b) => a - b)
          .map((id) => (idMode === 'equal' ? 1 : uidById[id])),
      },
      variant,
    );
  const player = createPlayer(
    floodMaxTrace(
      {
        ids: PRESETS.ring.nodes.map((n) => n.id),
        edges: PRESETS.ring.edges,
        uids: PRESETS.ring.uids,
      },
      'change',
    ),
  );
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame, names, uids, variant));
  const final = $derived(player.frames[player.frames.length - 1]);
  const showLeaders = $derived(frame.kind === 'decide' || frame.kind === 'done');
  const sendingSet = $derived(new Set(frame.kind === 'send' ? frame.senders : []));
  const updatedSet = $derived(new Set(frame.kind === 'receive' ? frame.updated : []));
  const leaderSet = $derived(new Set(showLeaders ? frame.leaders : []));
  const links = $derived(
    new Set(frame.kind === 'send' ? frame.messages.map((x) => `${x.from}>${x.to}`) : []),
  );

  let built = graphShape(PRESETS.ring.nodes, PRESETS.ring.edges, false);

  function rebuild() {
    built = graphShape(nodes, edges, false);
    player.load(build());
  }

  /** @param {{nodes: GraphNode[], edges: GraphEdge[]}} g */
  function onGraphChange(g) {
    const next = { ...uidById };
    const used = Object.values(next);
    for (const n of g.nodes) {
      if (next[n.id] !== undefined) continue;
      let u = 1;
      while (used.includes(u) && u < MAX_UID) u++;
      next[n.id] = u;
      used.push(u);
    }
    uidById = next;
    nodes = g.nodes.map((n) => (n.label ? n : { ...n, label: letter(n.id) }));
    edges = g.edges;
    // Dragging a node only moves the drawing; keep the current step.
    if (graphShape(nodes, edges, false) !== built) rebuild();
  }

  /** @param {Preset} key */
  function load(key) {
    nodes = PRESETS[key].nodes;
    edges = PRESETS[key].edges;
    uidById = Object.fromEntries(PRESETS[key].uids.entries());
    rebuild();
  }

  function shuffle() {
    const fresh = randomUids(order.length);
    uidById = Object.fromEntries(order.map((id, i) => [id, fresh[i]]));
    idMode = 'unique';
    rebuild();
  }

  /** @param {number} i @returns {VisualState} */
  function stateAt(i) {
    if (leaderSet.has(i)) return 'sorted';
    if (updatedSet.has(i)) return 'active';
    if (sendingSet.has(i)) return 'frontier';
    if (frame.max[i] === final.max[i] && frame.kind !== 'start') return 'visited';
    return '';
  }

  /** @param {number} i */
  function stateName(i) {
    if (leaderSet.has(i)) return m.states.leader;
    if (updatedSet.has(i)) return m.states.updated;
    if (sendingSet.has(i)) return m.states.sending;
    if (stateAt(i) === 'visited') return m.states.knows;
    return '';
  }

  /** @param {number} i */
  function marker(i) {
    if (leaderSet.has(i)) return m.markers.leader;
    if (updatedSet.has(i)) return m.markers.updated;
    return '';
  }

  /** @param {GraphEdge} e @returns {VisualState} */
  function edgeState(e) {
    const a = order.indexOf(e.from);
    const b = order.indexOf(e.to);
    if (links.has(`${a}>${b}`) || links.has(`${b}>${a}`)) return 'frontier';
    if (frame.parent[a] === b || frame.parent[b] === a) return 'path';
    return '';
  }

  const messageItems = $derived(
    frame.kind === 'send' || frame.kind === 'receive'
      ? frame.messages.map((x) => ({
          label: m.message(names[x.from], names[x.to], x.value),
          hot: frame.kind === 'receive' && frame.parent[x.to] === x.from && updatedSet.has(x.to),
        }))
      : [],
  );
</script>

{#snippet stat(/** @type {string} */ label, /** @type {string | number} */ value)}
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold tabular-nums">{value}</dd>
  </div>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.presetLabel}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each PRESET_KEYS as key (key)}
          <button type="button" class="btn-outline" onclick={() => load(key)}
            >{m.presets[key]}</button
          >
        {/each}
      </div>
    </fieldset>
    <SegmentedControl
      legend={m.variantLabel}
      name="variant"
      options={VARIANT_OPTIONS}
      bind:value={variant}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.idsLabel}
      name="ids"
      options={ID_OPTIONS}
      bind:value={idMode}
      onchange={rebuild}
    />
    <button type="button" class="btn-secondary" onclick={shuffle}>{m.shuffle}</button>
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
          markerOf={(id) => marker(order.indexOf(id))}
          noteOf={(id) => {
            const i = order.indexOf(id);
            return i < 0 || i >= frame.max.length ? '' : m.note(uids[i], frame.max[i]);
          }}
          labelOf={(n) => {
            const i = order.indexOf(n.id);
            return m.nodeLabel(names[i], uids[i], frame.max[i] ?? uids[i], stateName(i));
          }}
          onchange={onGraphChange}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-frontier"></span>{m.legend.sending}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"></span>{m.legend.updated}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-visited"></span>{m.legend.knows}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-sorted"></span>{m.legend.leader}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-frontier"></span>{m.legend.message}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1 w-3 rounded-sm bg-state-path"></span>{m.legend.tree}
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

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {@render stat(m.stats.round, m.round(frame.round, frame.rounds))}
        {@render stat(
          m.stats.thisRound,
          frame.kind === 'send' || frame.kind === 'receive' ? frame.messages.length : 0,
        )}
        {@render stat(m.stats.sent, frame.sent)}
        {@render stat(m.stats.leaders, showLeaders ? frame.leaders.length : '—')}
      </dl>
      <ChipList
        title={m.messagesTitle}
        items={messageItems}
        emptyText={m.messagesEmpty}
        hotLabel={m.hotMessage}
      />
      <CodePanel lines={floodPseudocode(variant)} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
