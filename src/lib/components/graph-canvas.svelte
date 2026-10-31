<script>
  import { t } from '$lib/i18n/index.js';
  import SegmentedControl from './segmented-control.svelte';
  import {
    addNode,
    degree,
    findEdge,
    moveNode,
    nodeName,
    notePlace,
    removeEdge,
    removeNode,
    toggleEdge,
  } from './graph-editor.js';
  import { STATE_FILL, STATE_TEXT, stateStroke } from './visual-state.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */
  /** @typedef {import('./graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('./graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('./graph-editor.js').Graph} Graph */
  /** @typedef {'move' | 'connect' | 'remove'} Tool */

  /**
   * A graph drawn at fixed node positions (no force layout, so nothing drifts between frames).
   * Read-only it is a labelled picture; with `onselect` the nodes are buttons (pick a start
   * node); with `editable` a toolbar adds nodes, connects or disconnects pairs, deletes nodes
   * and edges, and nodes drag with the pointer or nudge with Shift + arrows. Every edit
   * updates the bound `nodes` and `edges` and calls `onchange`, so the page rebuilds its trace.
   * @type {{
   *   nodes: GraphNode[],
   *   edges: GraphEdge[],
   *   ariaLabel: string,
   *   directed?: boolean,
   *   weighted?: boolean,
   *   editable?: boolean,
   *   width?: number,
   *   height?: number,
   *   maxNodes?: number,
   *   nodeState?: (id: number) => VisualState,
   *   edgeState?: (edge: GraphEdge) => VisualState,
   *   markerOf?: (id: number) => string,
   *   noteOf?: (id: number) => string,
   *   labelOf?: ((node: GraphNode) => string) | null,
   *   onselect?: ((id: number) => void) | null,
   *   selected?: number | null,
   *   onchange?: ((graph: Graph) => void) | null,
   *   speed?: number,
   * }}
   */
  let {
    nodes = $bindable(),
    edges = $bindable(),
    ariaLabel,
    directed = false,
    weighted = false,
    editable = false,
    width = 480,
    height = 300,
    maxNodes = 12,
    nodeState = () => '',
    edgeState = () => '',
    markerOf = () => '',
    noteOf = () => '',
    labelOf = null,
    onselect = null,
    selected = null,
    onchange = null,
    speed = 1,
  } = $props();

  const g = t().visuals.graph;
  const states = t().visuals.states;
  const uid = $props.id();
  const R = 18;
  const bounds = $derived({ width, height, margin: R + 4 });
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const interactive = $derived(editable || onselect !== null);

  let tool = $state(/** @type {Tool} */ ('move'));
  let weight = $state(1);
  /** Node picked as the start of a new edge in the connect tool. */
  let pending = $state(/** @type {number | null} */ (null));
  let notice = $state('');
  let focusId = $state(/** @type {number | null} */ (null));
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  const sorted = $derived(nodes.toSorted((a, b) => a.id - b.id));
  const byId = $derived(new Map(nodes.map((n) => [n.id, n])));
  const tabStop = $derived(
    [focusId, selected, sorted[0]?.id].find((id) => id != null && byId.has(id)) ?? null,
  );

  /** @param {Graph} next */
  function commit(next) {
    nodes = next.nodes;
    edges = next.edges;
    onchange?.(next);
  }

  function add() {
    const next = addNode({ nodes, edges }, bounds, { maxNodes, gap: 2 * R + 24 });
    if (!next) {
      notice = g.full;
      return;
    }
    notice = '';
    commit(next);
  }

  /** @param {number} id */
  function act(id) {
    if (tool === 'connect' && editable) {
      if (pending === null) {
        pending = id;
        notice = g.pickTarget(nodeName(/** @type {GraphNode} */ (byId.get(id))));
        return;
      }
      const res = toggleEdge({ nodes, edges }, pending, id, {
        directed,
        weight: weighted ? weight : undefined,
      });
      if (!res) {
        notice = g.selfLoop;
        pending = null;
        return;
      }
      pending = null;
      notice = '';
      commit(res.graph);
    } else if (tool === 'remove' && editable) {
      const order = sorted.map((n) => n.id);
      const at = order.indexOf(id);
      const after = order[at + 1] ?? order[at - 1] ?? null;
      notice = '';
      commit(removeNode({ nodes, edges }, id));
      focusId = after;
      if (after !== null) focusNode(after);
    } else {
      onselect?.(id);
    }
  }

  /** @param {number} id */
  function focusNode(id) {
    queueMicrotask(() =>
      /** @type {SVGElement | null | undefined} */ (
        svg?.querySelector(`[data-node="${id}"]`)
      )?.focus(),
    );
  }

  /** @param {KeyboardEvent} e @param {number} id */
  function onKeydown(e, id) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      act(id);
      return;
    }
    if (e.key === 'Escape' && pending !== null) {
      e.preventDefault();
      pending = null;
      notice = '';
      return;
    }
    const dirs = /** @type {Record<string, [number, number]>} */ ({
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    });
    const d = dirs[e.key];
    if (!d) return;
    e.preventDefault();
    if (e.shiftKey && editable) {
      const n = /** @type {GraphNode} */ (byId.get(id));
      commit(moveNode({ nodes, edges }, id, { x: n.x + d[0] * 10, y: n.y + d[1] * 10 }, bounds));
      return;
    }
    const order = sorted.map((n) => n.id);
    const at = order.indexOf(id) + (d[0] + d[1] > 0 ? 1 : -1);
    const next = order[Math.max(0, Math.min(order.length - 1, at))];
    focusId = next;
    focusNode(next);
  }

  // Pointer drags move a node in the move tool; a press that barely moves is a click. The
  // canvas captures the pointer so a drag keeps going off the node, and browsers then send
  // the release's click to the canvas, not the node, so the release itself acts on the node.
  let drag = /** @type {{id: number, x: number, y: number, moved: boolean} | null} */ (null);
  /** The node a press just ended on, so the click that may follow the release does not act. */
  let released = /** @type {number | null} */ (null);

  /** @param {PointerEvent} e */
  function toCanvas(e) {
    const m = svg?.getScreenCTM?.();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  /** @param {PointerEvent} e @param {number} id */
  function onNodePointerDown(e, id) {
    released = null;
    if (e.button !== 0 || !editable || tool !== 'move') return;
    drag = { id, x: e.clientX, y: e.clientY, moved: false };
    svg?.setPointerCapture?.(e.pointerId);
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 3) return;
    drag.moved = true;
    const p = toCanvas(e);
    if (!p) return;
    commit(moveNode({ nodes, edges }, drag.id, p, bounds));
  }

  function onPointerUp() {
    const press = drag;
    drag = null;
    if (!press) return;
    released = press.id;
    if (!press.moved) act(press.id);
  }

  function cancelDrag() {
    drag = null;
  }

  /** @param {number} id */
  function onNodeClick(id) {
    const handled = released === id;
    released = null;
    if (!handled) act(id);
  }

  /** @param {number} i */
  function onEdgeClick(i) {
    if (!editable || tool !== 'remove') return;
    notice = '';
    commit(removeEdge({ nodes, edges }, i));
  }

  /** Line between two node centres, trimmed to the circles and offset for two-way pairs. */
  /** @param {GraphEdge} e */
  function edgeLine(e) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return null;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const twoWay = directed && findEdge(edges, e.to, e.from, true) >= 0;
    const off = twoWay ? 5 : 0;
    const ox = -uy * off;
    const oy = ux * off;
    const tail = directed ? R + 4 : R;
    return {
      x1: a.x + ux * R + ox,
      y1: a.y + uy * R + oy,
      x2: b.x - ux * tail + ox,
      y2: b.y - uy * tail + oy,
      mx: (a.x + b.x) / 2 + ox * 2.4,
      my: (a.y + b.y) / 2 + oy * 2.4,
    };
  }

  /** @param {GraphEdge} e */
  function edgeName(e) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    return [a ? nodeName(a) : String(e.from), b ? nodeName(b) : String(e.to)];
  }

  /** @param {GraphNode} n */
  function nodeLabel(n) {
    if (labelOf) return labelOf(n);
    const s = nodeState(n.id);
    return g.node(nodeName(n), s ? states[s] : '', degree(edges, n.id));
  }

  const EDGE_STROKE = /** @type {Record<VisualState, string>} */ ({
    '': 'stroke-slate-400',
    compare: 'stroke-state-compare',
    swap: 'stroke-state-swap',
    sorted: 'stroke-state-sorted',
    active: 'stroke-state-active',
    frontier: 'stroke-state-frontier',
    visited: 'stroke-state-visited',
    path: 'stroke-state-path',
  });

  const summary = $derived(`${ariaLabel} ${g.summary(nodes.length, edges.length, directed)}`);
  const toolOptions = [
    { value: 'move', label: g.move },
    { value: 'connect', label: g.connect },
    { value: 'remove', label: g.remove },
  ];
</script>

{#snippet nodeShape(/** @type {GraphNode} */ n)}
  {@const s = nodeState(n.id)}
  {@const isSelected = selected !== null && n.id === selected}
  {@const isPending = pending === n.id}
  {@const mark = markerOf(n.id)}
  {@const note = noteOf(n.id)}
  <circle
    cx={n.x}
    cy={n.y}
    r={R}
    stroke-width={isSelected || isPending ? 3.5 : s === '' ? 1.5 : 2.5}
    stroke-dasharray={isPending ? '4 3' : undefined}
    class="{STATE_FILL[s]} {isSelected || isPending ? 'stroke-teal-700' : stateStroke(s)} {fade}"
  />
  <text
    x={n.x}
    y={n.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size="13"
    font-weight="600"
    class={STATE_TEXT[s]}>{nodeName(n)}</text
  >
  {#if mark}
    <text
      x={n.x + R - 2}
      y={n.y - R + 2}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      font-weight="700"
      stroke="white"
      stroke-width="3"
      paint-order="stroke"
      class="fill-slate-900"
      aria-hidden="true">{mark}</text
    >
  {/if}
  {#if note}
    {@const spot = notePlace({ nodes, edges }, n.id, R)}
    <text
      x={spot.x}
      y={spot.y}
      text-anchor={spot.anchor}
      dominant-baseline="central"
      font-size="10"
      stroke="white"
      stroke-width="3"
      paint-order="stroke"
      class="fill-slate-700"
      aria-hidden="true">{note}</text
    >
  {/if}
{/snippet}

<div class="flex flex-col gap-3">
  {#if editable}
    <div class="flex flex-wrap items-end gap-3">
      <SegmentedControl
        legend={g.tools}
        name="{uid}-tool"
        options={toolOptions}
        bind:value={tool}
        onchange={() => {
          pending = null;
          notice = '';
        }}
      />
      <button
        type="button"
        class="btn-outline"
        aria-disabled={nodes.length >= maxNodes}
        onclick={add}>{g.addNode}</button
      >
      {#if weighted}
        <label
          class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          {g.weight}
          <input
            type="number"
            min="1"
            max="99"
            step="1"
            class="field w-20"
            value={weight}
            onchange={(e) => {
              const n = Number(e.currentTarget.value);
              if (Number.isInteger(n) && n >= 1 && n <= 99) weight = n;
              else e.currentTarget.value = String(weight);
            }}
          />
        </label>
      {/if}
    </div>
  {/if}

  <svg
    bind:this={svg}
    viewBox="0 0 {width} {height}"
    role={interactive ? 'group' : 'img'}
    aria-label={interactive ? `${summary} ${g.keys}` : summary}
    style="max-width: {width * 1.25}px"
    class="mx-auto block h-auto w-full touch-none rounded-lg border border-slate-200 bg-slate-50 select-none"
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={cancelDrag}
  >
    <defs>
      <marker
        id="{uid}-head"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerUnits="userSpaceOnUse"
        markerWidth="11"
        markerHeight="11"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" class="fill-slate-600" />
      </marker>
    </defs>

    {#each edges as e, i (i)}
      {@const l = edgeLine(e)}
      {@const s = edgeState(e)}
      {#if l}
        <g>
          <line
            aria-hidden="true"
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            class="{EDGE_STROKE[s]} {fade}"
            stroke-width={s === '' ? 2 : 4}
            marker-end={directed ? `url(#${uid}-head)` : undefined}
          />
          {#if editable && tool === 'remove'}
            <!-- A wide invisible stroke makes thin edges easy to hit; in the delete tool each
                 edge is also a button, so keyboard users can remove it. -->
            <line
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="transparent"
              stroke-width="14"
              role="button"
              tabindex="0"
              aria-label={g.removeEdge(edgeName(e), directed)}
              class="cursor-pointer outline-none focus-visible:stroke-teal-700/40"
              onclick={() => onEdgeClick(i)}
              onkeydown={(ev) => {
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                ev.preventDefault();
                onEdgeClick(i);
              }}
            />
          {/if}
          {#if weighted && e.weight !== undefined}
            <text
              x={l.mx}
              y={l.my}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="12"
              font-weight="700"
              stroke="white"
              stroke-width="4"
              paint-order="stroke"
              class="fill-slate-800"
              aria-hidden="true">{e.weight}</text
            >
          {/if}
        </g>
      {/if}
    {/each}

    {#each sorted as n (n.id)}
      {#if interactive}
        <g
          data-node={n.id}
          role="button"
          tabindex={n.id === tabStop ? 0 : -1}
          aria-label={nodeLabel(n)}
          aria-pressed={onselect && !editable ? n.id === selected : undefined}
          class="outline-none [&:focus-visible>circle]:stroke-teal-700 [&:focus-visible>circle]:stroke-[4] {editable &&
          tool === 'move'
            ? 'cursor-grab'
            : 'cursor-pointer'}"
          onpointerdown={(e) => onNodePointerDown(e, n.id)}
          onclick={() => onNodeClick(n.id)}
          onkeydown={(e) => onKeydown(e, n.id)}
          onfocus={() => (focusId = n.id)}
        >
          {@render nodeShape(n)}
        </g>
      {:else}
        <g>
          <title>{nodeLabel(n)}</title>
          {@render nodeShape(n)}
        </g>
      {/if}
    {/each}
  </svg>
  {#if editable}
    <p class="min-h-5 text-sm text-slate-700" role="status">{notice}</p>
  {/if}
</div>
