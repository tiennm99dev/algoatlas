<script>
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/algo-engine/regular-expressions-nfa.js').Nfa} Nfa */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * An NFA on the grid its construction chose: edges carry their letter or ε, loops and skips
   * bow around the piece they repeat, and only the states and edges built so far are drawn.
   * @type {{
   *   nfa: Nfa,
   *   visibleStates: number,
   *   visibleEdges: number,
   *   taken: number[],
   *   ariaLabel: string,
   *   stateOf: (id: number) => VisualState,
   *   markerOf: (id: number) => string,
   *   labelOf: (id: number) => string,
   *   edgeLabelOf: (k: number) => string,
   *   speed?: number,
   * }}
   */
  let {
    nfa,
    visibleStates,
    visibleEdges,
    taken,
    ariaLabel,
    stateOf,
    markerOf,
    labelOf,
    edgeLabelOf,
    speed = 1,
  } = $props();

  const COL = 62;
  const ROW = 58;
  const R = 15;
  const MARGIN = 34;
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const width = $derived(nfa.width * COL + 2 * MARGIN);
  const height = $derived(nfa.height * ROW + 2 * MARGIN);

  /** @param {number} id */
  const px = (id) => nfa.states[id].x * COL + MARGIN;
  /** @param {number} id */
  const py = (id) => nfa.states[id].y * ROW + MARGIN;

  /** A path trimmed to the state rims, and where its label sits. @param {number} k */
  function edgeShape(k) {
    const e = nfa.edges[k];
    const [x0, y0, x1, y1] = [px(e.from), py(e.from), px(e.to), py(e.to)];
    const peak = e.bend * ROW;
    // A quadratic curve peaks halfway to its control point.
    const qx = (x0 + x1) / 2;
    const qy = (y0 + y1) / 2 + 2 * peak;
    /** @param {number} x @param {number} y @param {number} gap */
    const rim = (x, y, gap) => {
      const d = Math.hypot(qx - x, qy - y) || 1;
      return [x + ((qx - x) / d) * gap, y + ((qy - y) / d) * gap];
    };
    const [sx, sy] = rim(x0, y0, R);
    const [ex, ey] = rim(x1, y1, R + 3);
    return {
      d: `M ${sx} ${sy} Q ${qx} ${qy} ${ex} ${ey}`,
      lx: qx,
      ly: (y0 + y1) / 2 + peak - (peak === 0 ? 6 : 0),
    };
  }
</script>

<ScrollFrame>
  <svg
    role="img"
    aria-label={ariaLabel}
    viewBox="0 0 {width} {height}"
    class="mx-auto block"
    style="min-width: {width}px; max-width: {width}px"
  >
    <defs>
      <marker
        id="nfa-arrow"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 8 4 L 0 8 z" class="fill-slate-500" />
      </marker>
      <marker
        id="nfa-hot"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="5"
        markerHeight="5"
        orient="auto"
      >
        <path d="M 0 0 L 8 4 L 0 8 z" class="fill-state-active" />
      </marker>
    </defs>

    <line
      x1={px(nfa.start) - 30}
      y1={py(nfa.start)}
      x2={px(nfa.start) - R - 3}
      y2={py(nfa.start)}
      stroke-width="1.5"
      marker-end="url(#nfa-arrow)"
      class="stroke-slate-500"
    />

    {#each nfa.edges.slice(0, visibleEdges) as e, k (k)}
      {@const shape = edgeShape(k)}
      {@const hot = taken.includes(k)}
      <g data-edge={k} data-hot={hot}>
        <title>{edgeLabelOf(k)}</title>
        <path
          d={shape.d}
          fill="none"
          stroke-width={hot ? 3 : 1.5}
          marker-end={hot ? 'url(#nfa-hot)' : 'url(#nfa-arrow)'}
          class={hot ? 'stroke-state-active' : 'stroke-slate-500'}
        />
        <text
          x={shape.lx}
          y={shape.ly}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={e.label === 'ε' ? 11 : 14}
          font-weight={e.label === 'ε' ? 400 : 700}
          stroke="white"
          stroke-width="3"
          stroke-linejoin="round"
          paint-order="stroke"
          class={e.label === 'ε' ? 'fill-slate-500' : 'fill-slate-900'}
          aria-hidden="true">{e.label}</text
        >
      </g>
    {/each}

    {#each nfa.states.slice(0, visibleStates) as st (st.id)}
      {@const s = stateOf(st.id)}
      {@const marker = markerOf(st.id)}
      <g data-state={st.id}>
        <title>{labelOf(st.id)}</title>
        <circle
          cx={px(st.id)}
          cy={py(st.id)}
          r={R}
          stroke-width={s === '' ? 1.5 : 2.5}
          class="{STATE_FILL[s]} {stateStroke(s)} {fade}"
        />
        {#if st.id === nfa.accept && visibleStates === nfa.states.length}
          <circle
            cx={px(st.id)}
            cy={py(st.id)}
            r={R - 3.5}
            fill="none"
            stroke-width="1.5"
            class={stateStroke(s === '' ? 'visited' : s)}
          />
        {/if}
        <text
          x={px(st.id)}
          y={py(st.id)}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="11"
          font-weight="600"
          class={STATE_TEXT[s]}>{st.id}</text
        >
        {#if marker}
          <text
            x={px(st.id) + R - 2}
            y={py(st.id) - R + 2}
            text-anchor="middle"
            dominant-baseline="central"
            font-size="11"
            font-weight="700"
            stroke="white"
            stroke-width="3"
            stroke-linejoin="round"
            paint-order="stroke"
            class="fill-slate-900"
            aria-hidden="true">{marker}</text
          >
        {/if}
      </g>
    {/each}
  </svg>
</ScrollFrame>
