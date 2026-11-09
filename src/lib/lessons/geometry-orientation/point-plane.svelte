<script>
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /** @typedef {import('./plane-types.js').PlanePoint} PlanePoint */
  /** @typedef {import('./plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {import('./plane-types.js').PlanePolygon} PlanePolygon */
  /** @typedef {import('./plane-types.js').PlaneMark} PlaneMark */

  /**
   * A coordinate plane with the y axis pointing up, as in geometry. Points snap to whole
   * coordinates. With `onmove` they drag with the pointer and nudge with Shift + arrows, plain
   * arrows rove between them, Delete calls `onremove`, Enter or Space calls `onselect`, and a
   * press on empty ground calls `onadd`. Fractions are fine for segments, polygons and marks,
   * which are drawn from each frame of the trace.
   * @type {{
   *   ariaLabel: string,
   *   xMax: number,
   *   yMax: number,
   *   points?: PlanePoint[],
   *   segments?: PlaneSegment[],
   *   polygons?: PlanePolygon[],
   *   marks?: PlaneMark[],
   *   labelOf?: (point: PlanePoint) => string,
   *   onmove?: ((id: number, x: number, y: number) => void) | null,
   *   onadd?: ((x: number, y: number) => void) | null,
   *   onremove?: ((id: number) => void) | null,
   *   onselect?: ((id: number) => void) | null,
   *   selected?: number | null,
   *   speed?: number,
   * }}
   */
  let {
    ariaLabel,
    xMax,
    yMax,
    points = [],
    segments = [],
    polygons = [],
    marks = [],
    labelOf = (p) => `${p.label} (${p.x}, ${p.y})`,
    onmove = null,
    onadd = null,
    onremove = null,
    onselect = null,
    selected = null,
    speed = 1,
  } = $props();

  const UNIT = 40;
  const MARGIN = 26;
  const R = 13;
  const width = $derived(2 * MARGIN + xMax * UNIT);
  const height = $derived(2 * MARGIN + yMax * UNIT);
  /** @param {number} x */
  const sx = (x) => MARGIN + x * UNIT;
  /** @param {number} y */
  const sy = (y) => MARGIN + (yMax - y) * UNIT;
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const interactive = $derived(onmove !== null || onselect !== null);

  /** @type {SVGSVGElement | undefined} */
  let svg = $state();
  let focusId = $state(/** @type {number | null} */ (null));

  /** @param {PlanePoint} p */
  const live = (p) => !p.fixed && interactive;
  const order = $derived(points.filter(live).map((p) => p.id));
  const tabStop = $derived(
    [focusId, selected, order[0]].find((id) => id != null && order.includes(id)) ?? null,
  );

  const STROKE = /** @type {Record<VisualState, string>} */ ({
    '': 'stroke-slate-500',
    compare: 'stroke-state-compare',
    swap: 'stroke-state-swap',
    sorted: 'stroke-state-sorted',
    active: 'stroke-state-active',
    frontier: 'stroke-state-frontier',
    visited: 'stroke-state-visited',
    path: 'stroke-state-path',
    pruned: 'stroke-slate-300',
  });

  /**
   * The grid point under a pointer, clamped to the plane. The drawing keeps its aspect ratio, so
   * the bounding box maps straight onto the viewBox.
   * @param {PointerEvent | MouseEvent} e
   */
  function gridAt(e) {
    const box = svg?.getBoundingClientRect();
    if (!box || box.width === 0) return null;
    const px = ((e.clientX - box.left) / box.width) * width;
    const py = ((e.clientY - box.top) / box.height) * height;
    return {
      x: Math.max(0, Math.min(xMax, Math.round((px - MARGIN) / UNIT))),
      y: Math.max(0, Math.min(yMax, Math.round(yMax - (py - MARGIN) / UNIT))),
    };
  }

  // The plane captures the pointer so a drag keeps going off the dot, and the click that follows
  // a release then lands on the plane, so a press that never moved selects on release.
  let drag = /** @type {{ id: number, moved: boolean } | null} */ (null);
  /** The dot a press just ended on, so a click that may still follow does not act twice. */
  let released = /** @type {number | null} */ (null);

  /** @param {PointerEvent} e @param {PlanePoint} p */
  function onPointPointerDown(e, p) {
    released = null;
    if (e.button !== 0 || !live(p)) return;
    focusId = p.id;
    drag = { id: p.id, moved: false };
    svg?.setPointerCapture?.(e.pointerId);
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (!drag || !onmove) return;
    const spot = gridAt(e);
    const p = points.find((q) => q.id === drag?.id);
    if (!spot || !p || (spot.x === p.x && spot.y === p.y)) return;
    drag.moved = true;
    onmove(p.id, spot.x, spot.y);
  }

  function onPointerUp() {
    const press = drag;
    drag = null;
    if (!press) return;
    released = press.id;
    if (!press.moved) onselect?.(press.id);
  }

  /** @param {PlanePoint} p */
  function onPointClick(p) {
    const handled = released === p.id;
    released = null;
    if (!handled && live(p)) onselect?.(p.id);
  }

  /** @param {number} id */
  function focusPoint(id) {
    focusId = id;
    queueMicrotask(() =>
      /** @type {SVGElement | null | undefined} */ (
        svg?.querySelector(`[data-point="${id}"]`)
      )?.focus(),
    );
  }

  /** @param {KeyboardEvent} e @param {PlanePoint} p */
  function onKeydown(e, p) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect?.(p.id);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && onremove) {
      e.preventDefault();
      const at = order.indexOf(p.id);
      const after = order[at + 1] ?? order[at - 1] ?? null;
      onremove(p.id);
      // A refused removal keeps the point, so the focus only moves when it really left.
      queueMicrotask(() => {
        if (after !== null && !order.includes(p.id)) focusPoint(after);
      });
      return;
    }
    const dirs = /** @type {Record<string, [number, number]>} */ ({
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    });
    const d = dirs[e.key];
    if (!d) return;
    e.preventDefault();
    if (e.shiftKey && onmove) {
      const x = Math.max(0, Math.min(xMax, p.x + d[0]));
      const y = Math.max(0, Math.min(yMax, p.y + d[1]));
      if (x !== p.x || y !== p.y) onmove(p.id, x, y);
      return;
    }
    const at = order.indexOf(p.id) + (d[0] > 0 || d[1] > 0 ? 1 : -1);
    focusPoint(order[Math.max(0, Math.min(order.length - 1, at))]);
  }

  /** @param {MouseEvent} e */
  function onGround(e) {
    const spot = gridAt(e);
    if (spot) onadd?.(spot.x, spot.y);
  }

  /** The three corners of an arrow head at the end of a segment, in canvas units. */
  /** @param {PlaneSegment} s */
  function headOf(s) {
    const x = sx(s.x2);
    const y = sy(s.y2);
    const dx = x - sx(s.x1);
    const dy = y - sy(s.y1);
    const len = Math.hypot(dx, dy);
    if (len === 0) return '';
    const ux = dx / len;
    const uy = dy / len;
    const tipX = x - ux * R;
    const tipY = y - uy * R;
    const baseX = tipX - ux * 10;
    const baseY = tipY - uy * 10;
    return `${tipX},${tipY} ${baseX - uy * 5},${baseY + ux * 5} ${baseX + uy * 5},${baseY - ux * 5}`;
  }

  const xTicks = $derived(Array.from({ length: xMax + 1 }, (_, i) => i));
  const yTicks = $derived(Array.from({ length: yMax + 1 }, (_, i) => i));
</script>

<svg
  bind:this={svg}
  viewBox="0 0 {width} {height}"
  role={interactive ? 'group' : 'img'}
  aria-label={ariaLabel}
  style="max-width: {width * 1.25}px"
  class="mx-auto block h-auto w-full rounded-lg border border-slate-200 bg-slate-50 select-none"
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={() => (drag = null)}
>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <rect
    x="0"
    y="0"
    {width}
    {height}
    fill="transparent"
    class={onadd ? 'cursor-crosshair' : ''}
    data-testid="plane-ground"
    onclick={onGround}
  />
  <g aria-hidden="true" class="pointer-events-none">
    {#each xTicks as x (x)}
      <line
        x1={sx(x)}
        y1={sy(0)}
        x2={sx(x)}
        y2={sy(yMax)}
        stroke-width={x === 0 ? 1.5 : 1}
        class={x === 0 ? 'stroke-slate-400' : 'stroke-slate-200'}
      />
      {#if x % 2 === 0}
        <text
          x={sx(x)}
          y={sy(0) + 16}
          text-anchor="middle"
          font-size="10"
          class="fill-slate-500 tabular-nums">{x}</text
        >
      {/if}
    {/each}
    {#each yTicks as y (y)}
      <line
        x1={sx(0)}
        y1={sy(y)}
        x2={sx(xMax)}
        y2={sy(y)}
        stroke-width={y === 0 ? 1.5 : 1}
        class={y === 0 ? 'stroke-slate-400' : 'stroke-slate-200'}
      />
      {#if y % 2 === 0}
        <text
          x={sx(0) - 8}
          y={sy(y)}
          text-anchor="end"
          dominant-baseline="central"
          font-size="10"
          class="fill-slate-500 tabular-nums">{y}</text
        >
      {/if}
    {/each}

    {#each polygons as poly (poly.key)}
      <polygon
        points={poly.pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
        fill-opacity="0.28"
        fill-rule="evenodd"
        class="{STATE_FILL[poly.state]} {fade}"
      />
    {/each}

    {#each segments as s (s.key)}
      {@const state = s.state ?? ''}
      <line
        x1={sx(s.x1)}
        y1={sy(s.y1)}
        x2={sx(s.x2)}
        y2={sy(s.y2)}
        stroke-width={s.thick ? 4 : 2}
        stroke-dasharray={s.dashed ? '6 4' : undefined}
        stroke-linecap="round"
        class="{STROKE[state]} {fade}"
      />
      {#if s.arrow}
        <polygon points={headOf(s)} class="{STATE_FILL[state]} {fade}" />
      {/if}
      {#if s.label}
        <text
          x={(sx(s.x1) + sx(s.x2)) / 2}
          y={(sy(s.y1) + sy(s.y2)) / 2}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="11"
          font-weight="600"
          stroke="white"
          stroke-width="3"
          paint-order="stroke"
          class="fill-slate-800">{s.label}</text
        >
      {/if}
    {/each}

    {#each marks as mark (mark.key)}
      {@const x = sx(mark.x)}
      {@const y = sy(mark.y)}
      <circle cx={x} cy={y} r="8" stroke-width="2" class="fill-white stroke-state-swap" />
      <line
        x1={x - 5}
        y1={y - 5}
        x2={x + 5}
        y2={y + 5}
        stroke-width="2.5"
        class="stroke-state-swap"
      />
      <line
        x1={x - 5}
        y1={y + 5}
        x2={x + 5}
        y2={y - 5}
        stroke-width="2.5"
        class="stroke-state-swap"
      />
      {#if mark.label}
        <text
          {x}
          y={y - 14}
          text-anchor="middle"
          font-size="11"
          font-weight="600"
          stroke="white"
          stroke-width="3"
          paint-order="stroke"
          class="fill-slate-900">{mark.label}</text
        >
      {/if}
    {/each}
  </g>

  {#each points as p (p.id)}
    {@const state = p.state ?? ''}
    {@const x = sx(p.x)}
    {@const y = sy(p.y)}
    {@const isLive = live(p)}
    {@const isSelected = selected === p.id}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g
      role={isLive ? 'button' : 'img'}
      tabindex={isLive ? (tabStop === p.id ? 0 : -1) : undefined}
      aria-label={labelOf(p)}
      aria-pressed={isLive && onselect ? isSelected : undefined}
      data-point={p.id}
      class="outline-none [&:focus-visible>.dot]:stroke-teal-700 [&:focus-visible>.dot]:stroke-[4] {isLive
        ? 'cursor-grab touch-none'
        : ''}"
      onfocus={() => {
        if (isLive) focusId = p.id;
      }}
      onpointerdown={(e) => onPointPointerDown(e, p)}
      onclick={() => onPointClick(p)}
      onkeydown={(e) => {
        if (isLive) onKeydown(e, p);
      }}
    >
      {#if isLive}
        <circle cx={x} cy={y} r={R + 8} fill="transparent" />
      {/if}
      <circle
        cx={x}
        cy={y}
        r={R}
        stroke-width={isSelected ? 3.5 : state === '' ? 1.5 : 2.5}
        class="dot {STATE_FILL[state]} {isSelected ? 'stroke-teal-700' : stateStroke(state)} {fade}"
      />
      <text
        {x}
        {y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="12"
        font-weight="600"
        class={STATE_TEXT[state]}>{p.label}</text
      >
      {#if p.note}
        <text
          {x}
          y={p.y >= yMax ? y + R + 12 : y - R - 5}
          text-anchor="middle"
          font-size="10"
          stroke="white"
          stroke-width="3"
          paint-order="stroke"
          class="fill-slate-700 tabular-nums"
          aria-hidden="true">{p.note}</text
        >
      {/if}
    </g>
  {/each}
</svg>
