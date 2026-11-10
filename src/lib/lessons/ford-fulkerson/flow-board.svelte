<script>
  import { notePlace } from '$lib/components/graph-editor.js';
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @typedef {import('./board-types.js').BoardArc} BoardArc */

  /**
   * A flow network drawn at fixed vertex positions (the same 480 × 300 canvas as the network
   * editor). Read-only: every arrow carries a label, and two arrows between the same pair bow
   * apart so both labels stay readable.
   * @type {{
   *   points: {x: number, y: number, label: string}[],
   *   arcs: BoardArc[],
   *   ariaLabel: string,
   *   nodeState?: (i: number) => VisualState,
   *   markerOf?: (i: number) => string,
   *   noteOf?: (i: number) => string,
   *   labelOf: (i: number) => string,
   *   width?: number,
   *   height?: number,
   *   speed?: number,
   * }}
   */
  let {
    points,
    arcs,
    ariaLabel,
    nodeState = () => '',
    markerOf = () => '',
    noteOf = () => '',
    labelOf,
    width = 480,
    height = 300,
    speed = 1,
  } = $props();

  const R = 18;
  const uid = $props.id();
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const graph = $derived({
    nodes: points.map((p, id) => ({ id, x: p.x, y: p.y })),
    edges: arcs.map((a) => ({ from: a.from, to: a.to })),
  });

  const ARC_STROKE = /** @type {Record<VisualState, string>} */ ({
    '': 'stroke-slate-400',
    compare: 'stroke-state-compare',
    swap: 'stroke-state-swap',
    sorted: 'stroke-state-sorted',
    active: 'stroke-state-active',
    frontier: 'stroke-state-frontier',
    visited: 'stroke-state-visited',
    path: 'stroke-state-path',
    pruned: 'stroke-slate-300',
  });

  /** Arrow trimmed to the circles, bowed sideways when the reverse arrow is drawn too. */
  /** @param {BoardArc} arc */
  function shape(arc) {
    const a = points[arc.from];
    const b = points[arc.to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const twoWay = arcs.some((o) => o.from === arc.to && o.to === arc.from);
    const off = twoWay ? 7 : 0;
    const ox = -uy * off;
    const oy = ux * off;
    return {
      x1: a.x + ux * R + ox,
      y1: a.y + uy * R + oy,
      x2: b.x - ux * (R + 4) + ox,
      y2: b.y - uy * (R + 4) + oy,
      mx: (a.x + b.x) / 2 + ox * 2.2,
      my: (a.y + b.y) / 2 + oy * 2.2,
    };
  }
</script>

<svg
  role="img"
  aria-label={ariaLabel}
  viewBox="0 0 {width} {height}"
  style="max-width: {width * 1.25}px"
  class="mx-auto block h-auto w-full rounded-lg border border-slate-200 bg-slate-50 select-none"
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
      orient="auto"
    >
      <path d="M0 0 L10 5 L0 10 z" class="fill-slate-600" />
    </marker>
  </defs>

  {#each arcs as arc, k (k)}
    {@const l = shape(arc)}
    <g data-arc="{arc.from}-{arc.to}" data-state={arc.state} opacity={arc.dim ? 0.35 : 1}>
      <title>{arc.title}</title>
      <line
        x1={l.x1}
        y1={l.y1}
        x2={l.x2}
        y2={l.y2}
        class="{ARC_STROKE[arc.state]} {fade}"
        stroke-width={arc.state === '' ? 2 : 4}
        stroke-dasharray={arc.dashed ? '6 4' : undefined}
        marker-end="url(#{uid}-head)"
      />
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
        aria-hidden="true">{arc.label}</text
      >
    </g>
  {/each}

  {#each points as p, i (i)}
    {@const s = nodeState(i)}
    {@const mark = markerOf(i)}
    {@const note = noteOf(i)}
    <g data-vertex={i}>
      <title>{labelOf(i)}</title>
      <circle
        cx={p.x}
        cy={p.y}
        r={R}
        stroke-width={s === '' ? 1.5 : 2.5}
        class="{STATE_FILL[s]} {stateStroke(s)} {fade}"
      />
      <text
        x={p.x}
        y={p.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="13"
        font-weight="600"
        class={STATE_TEXT[s]}>{p.label}</text
      >
      {#if mark}
        <text
          x={p.x + R - 2}
          y={p.y - R + 2}
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
        {@const spot = notePlace(graph, i, R)}
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
    </g>
  {/each}
</svg>
