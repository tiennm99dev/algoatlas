<script>
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { layoutForest } from '$lib/components/tree-layout.js';
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/algo-engine/aho-corasick.js').AcNode} AcNode */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * A trie with its failure links (dashed curves) and output links (dotted curves) on top of the
   * tree edges, which the shared tree view cannot draw. Node ids are stable, so a node keeps its
   * identity as the trie grows.
   * @type {{
   *   nodes: AcNode[],
   *   ariaLabel: string,
   *   stateOf: (id: number) => VisualState,
   *   markerOf: (id: number) => string,
   *   labelOf: (id: number) => string,
   *   showRootLinks: boolean,
   *   hotLink: number,
   *   speed?: number,
   * }}
   */
  let {
    nodes,
    ariaLabel,
    stateOf,
    markerOf,
    labelOf,
    showRootLinks,
    hotLink,
    speed = 1,
  } = $props();

  const COL = 52;
  const ROW = 70;
  const R = 17;
  const TOP = R + 14;
  const fade = $derived(speed < 8 ? 'transition-colors' : '');

  /** @param {number} id @returns {TreeNode} */
  function treeOf(id) {
    const n = nodes[id];
    return {
      id,
      label: n.letter,
      edgeLabel: n.letter,
      children: Object.keys(n.next)
        .sort()
        .map((c) => treeOf(n.next[c])),
    };
  }

  const layout = $derived(layoutForest([treeOf(0)]));
  const width = $derived(Math.max(4, layout.columns) * COL);
  const height = $derived(Math.max(2, layout.levels) * ROW);

  /** @param {number} id */
  const cx = (id) => /** @type {{x: number}} */ (layout.byId.get(id)).x * COL + COL / 2;
  /** @param {number} id */
  const cy = (id) => /** @type {{depth: number}} */ (layout.byId.get(id)).depth * ROW + TOP;

  /**
   * A curve from one node to another that stops at the node's rim.
   * @param {number} from @param {number} to @param {number} bow
   */
  function curve(from, to, bow) {
    const [x0, y0, x1, y1] = [cx(from), cy(from), cx(to), cy(to)];
    const [dx, dy] = [x1 - x0, y1 - y0];
    const len = Math.hypot(dx, dy) || 1;
    const qx = (x0 + x1) / 2 - (dy / len) * bow * Math.min(len, 90);
    const qy = (y0 + y1) / 2 + (dx / len) * bow * Math.min(len, 90);
    /** @param {number} x @param {number} y @param {number} gap */
    const rim = (x, y, gap) => {
      const d = Math.hypot(qx - x, qy - y) || 1;
      return [x + ((qx - x) / d) * gap, y + ((qy - y) / d) * gap];
    };
    const [sx, sy] = rim(x0, y0, R);
    const [ex, ey] = rim(x1, y1, R + 3);
    return `M ${sx} ${sy} Q ${qx} ${qy} ${ex} ${ey}`;
  }

  const failLinks = $derived(
    nodes.filter(
      (n) =>
        n.id !== 0 &&
        n.fail !== null &&
        layout.byId.has(n.fail) &&
        (showRootLinks || n.fail !== 0 || n.id === hotLink),
    ),
  );
  const outLinks = $derived(nodes.filter((n) => n.out !== null && layout.byId.has(n.out)));
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
        id="ac-fail"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M 0 0 L 8 4 L 0 8 z" class="fill-rose-600" />
      </marker>
      <marker
        id="ac-out"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M 0 0 L 8 4 L 0 8 z" class="fill-emerald-700" />
      </marker>
    </defs>

    {#each layout.edges as e (e.to)}
      <line
        x1={cx(/** @type {number} */ (e.from))}
        y1={cy(/** @type {number} */ (e.from))}
        x2={cx(/** @type {number} */ (e.to))}
        y2={cy(/** @type {number} */ (e.to))}
        stroke-width="1.5"
        class="stroke-slate-400"
      />
    {/each}

    {#each failLinks as n (n.id)}
      <path
        d={curve(n.id, /** @type {number} */ (n.fail), 0.28)}
        fill="none"
        stroke-width={n.id === hotLink ? 3 : 1.5}
        stroke-dasharray="6 4"
        marker-end="url(#ac-fail)"
        class="stroke-rose-600"
        data-link="fail"
      />
    {/each}
    {#each outLinks as n (n.id)}
      <path
        d={curve(n.id, /** @type {number} */ (n.out), -0.28)}
        fill="none"
        stroke-width="2"
        stroke-dasharray="1.5 4"
        stroke-linecap="round"
        marker-end="url(#ac-out)"
        class="stroke-emerald-700"
        data-link="out"
      />
    {/each}

    {#each nodes as n (n.id)}
      {@const s = stateOf(n.id)}
      {@const marker = markerOf(n.id)}
      <g>
        <title>{labelOf(n.id)}</title>
        <circle
          cx={cx(n.id)}
          cy={cy(n.id)}
          r={R}
          stroke-width={s === '' ? 1.5 : 2.5}
          class="{STATE_FILL[s]} {stateStroke(s)} {fade}"
        />
        {#if n.word !== null}
          <circle
            cx={cx(n.id)}
            cy={cy(n.id)}
            r={R - 4}
            fill="none"
            stroke-width="1.5"
            class={stateStroke(s === '' ? 'visited' : s)}
          />
        {/if}
        <text
          x={cx(n.id)}
          y={cy(n.id)}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="13"
          font-weight="600"
          class={STATE_TEXT[s]}>{n.id === 0 ? '·' : n.letter}</text
        >
        {#if marker}
          <text
            x={cx(n.id) + R - 3}
            y={cy(n.id) - R + 3}
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
