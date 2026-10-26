<script>
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, rovingStep, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @typedef {import('./diagram-types.js').DiagramNode} DiagramNode */
  /** @typedef {import('./diagram-types.js').DiagramPointer} DiagramPointer */

  /**
   * Linked nodes drawn as boxes with a value and pointer fields, at positions the lesson
   * chooses, so a pointer can be shown mid-rewire: a new node waiting below the row, an arrow
   * flipped backwards, a tail looping back to the middle. Named variables hang above the node
   * they point at; variables holding null are listed under the drawing. With `onselect` the
   * nodes become a roving-focus set of buttons in array order.
   * @type {{
   *   nodes: DiagramNode[],
   *   ariaLabel: string,
   *   pointers?: DiagramPointer[],
   *   doubly?: boolean,
   *   nullLabel?: string,
   *   onselect?: ((id: number) => void) | null,
   *   selected?: number | null,
   *   speed?: number,
   *   scrollLabel?: string,
   * }}
   */
  let {
    nodes,
    ariaLabel,
    pointers = [],
    doubly = false,
    nullLabel = 'null',
    onselect = null,
    selected = null,
    speed = 1,
    scrollLabel,
  } = $props();

  const uid = $props.id();
  const arrowId = `${uid}-arrow`;
  const hotId = `${uid}-hot`;
  const PITCH = 96;
  const H = 36;
  const MARGIN = 10;
  const POINTER_H = 26;
  const MARKERS = [{ hot: false }, { hot: true }];
  const ABOVE_BAND = 30;
  const ROW_GAP = 34;
  const PF = $derived(doubly ? 14 : 0);
  const BX = $derived(doubly ? 40 : 44);
  const NF = $derived(doubly ? 14 : 16);
  const W = $derived(PF + BX + NF);

  const byId = $derived(new Map(nodes.map((n) => [n.id, n])));
  const minCol = $derived(nodes.length ? Math.min(...nodes.map((n) => n.col)) : 0);
  const maxCol = $derived(nodes.length ? Math.max(...nodes.map((n) => n.col)) : 0);
  const rows = $derived([...new Set(nodes.map((n) => n.row))].sort((a, b) => a - b));

  /** Pointers with a target, each with its stack position on that node. */
  const placed = $derived.by(() => {
    /** @type {{name: string, id: number, stack: number, hot: boolean}[]} */
    const out = [];
    for (const p of pointers) {
      if (p.id === null || !byId.has(p.id)) continue;
      const stack = out.filter((q) => q.id === p.id).length;
      out.push({ name: p.name, id: p.id, stack, hot: Boolean(p.hot) });
    }
    return out;
  });
  const nulls = $derived(pointers.filter((p) => p.id === null || !byId.has(p.id)));

  /**
   * How a link is drawn: a straight lane to the neighbour, a short curve, a long rounded
   * route around the row, or a straight line to another row.
   * @param {DiagramNode} from @param {DiagramNode} to @param {'next'|'prev'} kind
   */
  function routeOf(from, to, kind) {
    if (from.row !== to.row) return 'cross';
    const span = to.col - from.col;
    if ((kind === 'next' && span === 1) || (kind === 'prev' && span === -1)) return 'lane';
    return Math.abs(span) <= 1 ? 'curve' : 'around';
  }

  /** Every drawable link with its route, so the row layout can reserve room for arcs. */
  const links = $derived.by(() => {
    /** @type {{key: string, from: DiagramNode, to: DiagramNode, kind: 'next'|'prev', route: string, hot: boolean, stale: boolean}[]} */
    const out = [];
    for (const n of nodes) {
      /** @type {('next'|'prev')[]} */
      const kinds = doubly ? ['next', 'prev'] : ['next'];
      for (const kind of kinds) {
        const target = kind === 'next' ? n.next : n.prev;
        if (target === null || target === undefined) continue;
        const to = byId.get(target);
        if (!to) continue;
        out.push({
          key: `${n.id}-${kind}`,
          from: n,
          to,
          kind,
          route: routeOf(n, to, kind),
          hot: Boolean(kind === 'next' ? n.hotNext : n.hotPrev),
          stale: Boolean(n.stale),
        });
      }
    }
    return out;
  });

  /** Top y of each row's boxes. Each row reserves its pointer stack and any arc above it. */
  const rowTop = $derived.by(() => {
    /** @type {Record<number, number>} */
    const tops = {};
    let y = 4;
    for (const r of rows) {
      const stacks = placed.filter((p) => byId.get(p.id)?.row === r).map((p) => p.stack + 1);
      const band = (stacks.length ? Math.max(...stacks) : 0) * POINTER_H;
      const arcs = links.some((l) => l.from.row === r && l.kind === 'prev' && l.route !== 'lane')
        ? ABOVE_BAND
        : 0;
      y += band + arcs;
      tops[r] = y;
      y += H + ROW_GAP;
    }
    return tops;
  });
  const lastBottom = $derived(rows.length ? (rowTop[rows[rows.length - 1]] ?? 0) + H : 0);
  const aroundY = $derived(lastBottom + 22);
  const hasBelow = $derived(
    links.some(
      (l) =>
        l.kind === 'next' &&
        (l.route === 'around' || (l.route === 'curve' && l.from.row === rows.at(-1))),
    ),
  );

  /** @param {DiagramNode} n */
  const x = (n) => (n.col - minCol) * PITCH + MARGIN;
  /** @param {DiagramNode} n */
  const top = (n) => rowTop[n.row] ?? 0;

  /** Height of the arc band above a node's row, which its pointer labels sit over. @param {number} id */
  function arcsAbove(id) {
    const row = byId.get(id)?.row;
    return links.some((l) => l.from.row === row && l.kind === 'prev' && l.route !== 'lane')
      ? ABOVE_BAND
      : 0;
  }
  /** @param {number} id */
  function pointerX(id) {
    const n = byId.get(id);
    return n ? x(n) + PF + BX / 2 : 0;
  }
  /** @param {number} id @param {number} stack */
  function pointerY(id, stack) {
    const n = byId.get(id);
    return n ? top(n) - 3 - arcsAbove(id) - stack * POINTER_H : 0;
  }

  const vbW = $derived(Math.max(1, (maxCol - minCol) * PITCH + W + 2 * MARGIN));
  const vbH = $derived(nodes.length === 0 ? 40 : lastBottom + (hasBelow ? 34 : 6));

  /** @param {{from: DiagramNode, to: DiagramNode, kind: 'next'|'prev', route: string}} l */
  function pathOf(l) {
    const { from, to, kind } = l;
    const fx = kind === 'next' ? x(from) + PF + BX + NF / 2 : x(from) + PF / 2;
    const ft = top(from);
    const tt = top(to);
    const lane = doubly ? (kind === 'next' ? -6 : 6) : 0;
    if (l.route === 'lane') {
      const y = ft + H / 2 + lane;
      const tx = kind === 'next' ? x(to) - 1 : x(to) + W + 1;
      return `M${fx} ${y} H${tx}`;
    }
    if (l.route === 'cross') {
      const down = tt > ft;
      const sy = down ? ft + H : ft;
      const ty = down ? tt - 1 : tt + H + 1;
      const tx = Math.min(Math.max(fx, x(to) + 8), x(to) + W - 8);
      return `M${fx} ${sy} L${tx} ${ty}`;
    }
    if (kind === 'next') {
      // Below the row: leave the next field downwards and enter the target from beneath.
      const sy = ft + H;
      const tx = x(to) + PF + BX / 2;
      const ty = tt + H + 1;
      if (l.route === 'curve') {
        const d = ft + H + 30;
        return `M${fx} ${sy} C${fx} ${d} ${tx} ${d} ${tx} ${ty}`;
      }
      const r = 8;
      const dir = tx < fx ? -1 : 1;
      return `M${fx} ${sy} V${aroundY - r} Q${fx} ${aroundY} ${fx + dir * r} ${aroundY} H${tx - dir * r} Q${tx} ${aroundY} ${tx} ${aroundY - r} V${ty}`;
    }
    // A prev link that is not to the left neighbour arcs above the row.
    const sy = ft;
    const tx = x(to) + W - 10;
    const ty = tt - 1;
    const upper = ft - ABOVE_BAND + 6;
    if (l.route === 'curve') return `M${fx} ${sy} C${fx} ${upper} ${tx} ${upper} ${tx} ${ty}`;
    const r = 8;
    const dir = tx < fx ? -1 : 1;
    return `M${fx} ${sy} V${upper + r} Q${fx} ${upper} ${fx + dir * r} ${upper} H${tx - dir * r} Q${tx} ${upper} ${tx} ${upper + r} V${ty}`;
  }

  const fade = $derived(speed < 8 ? 'transition-colors' : '');

  // svelte-ignore state_referenced_locally
  let focusIndex = $state(
    Math.max(
      0,
      nodes.findIndex((n) => n.id === selected),
    ),
  );
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  /** @param {KeyboardEvent} e @param {number} i */
  function onKeydown(e, i) {
    if (!onselect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect(nodes[i].id);
      return;
    }
    const next = rovingStep(e.key, i, nodes.length);
    if (next === null) return;
    e.preventDefault();
    focusIndex = next;
    /** @type {SVGElement | null | undefined} */ (
      svg?.querySelector(`[data-index="${next}"]`)
    )?.focus();
  }
</script>

{#snippet field(/** @type {{fx: number, y: number, w: number, isNull: boolean}} */ f)}
  {@const { fx, y, w, isNull } = f}
  <rect
    x={fx}
    {y}
    width={w}
    height={H}
    rx="3"
    stroke-width="1.5"
    class="fill-slate-100 stroke-slate-400"
  />
  {#if isNull}
    <line
      x1={fx + 2}
      y1={y + H - 3}
      x2={fx + w - 2}
      y2={y + 3}
      class="stroke-slate-500"
      stroke-width="1.5"
    />
  {/if}
{/snippet}

{#snippet box(/** @type {DiagramNode} */ n)}
  {@const s = n.state ?? ''}
  {@const bx = x(n)}
  {@const by = top(n)}
  {@const isSel = selected !== null && n.id === selected}
  {#if doubly}
    {@render field({ fx: bx, y: by, w: PF, isNull: n.prev === null || n.prev === undefined })}
  {/if}
  <rect
    x={bx + PF}
    y={by}
    width={BX}
    height={H}
    rx="5"
    stroke-width={isSel ? 3 : 1.5}
    stroke-dasharray={n.stale ? '4 3' : undefined}
    class="{STATE_FILL[s]} {isSel ? 'stroke-teal-700' : stateStroke(s)} {fade}"
  />
  {@render field({ fx: bx + PF + BX, y: by, w: NF, isNull: n.next === null })}
  <text
    x={bx + PF + BX / 2}
    y={by + H / 2}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={n.label.length > 3 ? 10 : 13}
    font-weight="600"
    class={STATE_TEXT[s]}>{n.label}</text
  >
  {#if n.marker}
    <text
      x={bx + PF + BX - 3}
      y={by - 1}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      font-weight="700"
      stroke="white"
      stroke-width="3"
      paint-order="stroke"
      class="fill-slate-900"
      aria-hidden="true">{n.marker}</text
    >
  {/if}
{/snippet}

<ScrollFrame label={scrollLabel}>
  <svg
    bind:this={svg}
    viewBox="0 0 {vbW} {vbH}"
    role={onselect ? 'group' : 'img'}
    aria-label={ariaLabel}
    class="block h-auto"
    style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 360)}px"
  >
    <defs>
      {#each MARKERS as mk (mk.hot)}
        <marker
          id={mk.hot ? hotId : arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" class={mk.hot ? 'fill-teal-700' : 'fill-slate-600'} />
        </marker>
      {/each}
    </defs>

    {#each links as l (l.key)}
      <path
        d={pathOf(l)}
        class="fill-none {l.hot
          ? 'stroke-teal-700'
          : l.stale
            ? 'stroke-slate-400'
            : 'stroke-slate-600'}"
        stroke-width={l.hot ? 2.5 : 1.5}
        stroke-dasharray={l.stale && !l.hot ? '4 3' : undefined}
        marker-end="url(#{l.hot ? hotId : arrowId})"
        data-link={l.key}
        aria-hidden="true"
      />
    {/each}

    {#each nodes as n, i (n.id)}
      {#if onselect}
        <g
          data-index={i}
          data-node={n.id}
          role="button"
          tabindex={i === focusIndex ? 0 : -1}
          aria-label={n.title}
          aria-pressed={n.id === selected}
          class="cursor-pointer outline-none [&:focus-visible>rect]:stroke-teal-700"
          onclick={() => onselect(n.id)}
          onkeydown={(e) => onKeydown(e, i)}
          onfocus={() => (focusIndex = i)}
        >
          {@render box(n)}
        </g>
      {:else}
        <g data-node={n.id}>
          <title>{n.title}</title>
          {@render box(n)}
        </g>
      {/if}
    {/each}

    {#each placed as p (p.name)}
      {@const cx = pointerX(p.id)}
      {@const y = pointerY(p.id, p.stack)}
      {@const arcs = arcsAbove(p.id)}
      <g aria-hidden="true" data-pointer={p.name}>
        {#if arcs}
          <line x1={cx} y1={y} x2={cx} y2={y + arcs} class="stroke-slate-400" stroke-width="1" />
        {/if}
        <path d="M{cx} {y} l-5 -7 h10 z" class={p.hot ? 'fill-teal-700' : 'fill-slate-700'} />
        <text
          x={cx}
          y={y - 15}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="11"
          font-weight={p.hot ? 700 : 600}
          class={p.hot ? 'fill-teal-800' : 'fill-slate-800'}>{p.name}</text
        >
      </g>
    {/each}
  </svg>
</ScrollFrame>
{#if nulls.length}
  <p class="mt-2 font-mono text-xs text-slate-600" data-testid="null-pointers">
    {nulls.map((p) => `${p.name} → ${nullLabel}`).join(' · ')}
  </p>
{/if}
