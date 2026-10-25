<script>
  import { t } from '$lib/i18n/index.js';
  import ScrollFrame from './scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, rovingStep, stateStroke } from './visual-state.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */

  /**
   * A singly or doubly linked list as boxes and arrows, in list order from the head. Named
   * pointers (`head`, `prev`, `curr`) hang above their node; an index equal to the length
   * points at the trailing null. Circular lists draw the wrap-around link underneath. With
   * `onselect` the nodes become a roving-focus row of buttons.
   * @type {{
   *   nodes: {id: string | number, label: string, state?: VisualState, marker?: string}[],
   *   ariaLabel?: string,
   *   pointers?: {name: string, index: number}[],
   *   doubly?: boolean,
   *   circular?: boolean,
   *   onselect?: ((i: number) => void) | null,
   *   selected?: number,
   *   speed?: number,
   * }}
   */
  let {
    nodes,
    ariaLabel,
    pointers = [],
    doubly = false,
    circular = false,
    onselect = null,
    selected = -1,
    speed = 1,
  } = $props();

  const v = t().visuals;
  const uid = $props.id();
  const arrowId = `${uid}-arrow`;
  const BOX = 44;
  const LINK = 14;
  const H = 36;
  const GAP = 34;
  const PITCH = BOX + LINK + GAP;
  const POINTER_H = 28;

  const pointerRows = $derived.by(() => {
    return pointers.map((p, i) => ({
      ...p,
      row: pointers.slice(0, i).filter((q) => q.index === p.index).length,
    }));
  });
  const pointerBand = $derived(
    pointerRows.length ? (Math.max(...pointerRows.map((p) => p.row)) + 1) * POINTER_H : 0,
  );
  const top = $derived(pointerBand + 4);
  const showNull = $derived(!circular || nodes.length === 0);
  const slots = $derived(nodes.length + (showNull ? 1 : 0));
  const vbW = $derived(Math.max(1, slots) * PITCH - GAP + 4);
  const vbH = $derived(top + H + (circular && nodes.length > 0 ? 30 : 6));
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  /** @param {number} i */
  const x = (i) => i * PITCH + 2;
  const mid = $derived(top + H / 2);

  const summary = $derived(
    [
      ariaLabel ??
        v.listSummary(
          nodes.map((n) => n.label),
          doubly,
          circular,
        ),
      ...pointers.map((p) => v.pointer(p.name, p.index)),
    ].join('. '),
  );

  /** @param {number} i */
  function nodeLabel(i) {
    const s = nodes[i].state ?? '';
    return v.cell(i, nodes[i].label, s ? v.states[s] : '');
  }

  // svelte-ignore state_referenced_locally
  let focusIndex = $state(Math.max(0, selected));
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  /** @param {KeyboardEvent} e @param {number} i */
  function onKeydown(e, i) {
    if (!onselect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect(i);
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

{#snippet box(/** @type {number} */ i)}
  {@const n = nodes[i]}
  {@const s = n.state ?? ''}
  <rect
    x={x(i)}
    y={top}
    width={BOX}
    height={H}
    rx="5"
    stroke-width={i === selected ? 3 : 1.5}
    class="{STATE_FILL[s]} {i === selected ? 'stroke-teal-700' : stateStroke(s)} {fade}"
  />
  <rect
    x={x(i) + BOX}
    y={top}
    width={LINK}
    height={H}
    rx="3"
    stroke-width="1.5"
    class="fill-slate-100 stroke-slate-400"
  />
  <text
    x={x(i) + BOX / 2}
    y={mid}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={n.label.length > 4 ? 10 : 13}
    font-weight="600"
    class={STATE_TEXT[s]}>{n.label}</text
  >
  {#if n.marker}
    <text
      x={x(i) + BOX - 4}
      y={top - 1}
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

<ScrollFrame>
  <svg
    bind:this={svg}
    viewBox="0 0 {vbW} {vbH}"
    role={onselect ? 'group' : 'img'}
    aria-label={summary}
    class="block h-auto"
    style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 360)}px"
  >
    <defs>
      <marker
        id={arrowId}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" class="fill-slate-600" />
      </marker>
    </defs>

    {#each nodes as _, i (i)}
      {@const from = x(i) + BOX + LINK / 2}
      {@const to = x(i + 1)}
      {#if i < nodes.length - 1 || showNull}
        <line
          x1={from}
          y1={doubly ? mid - 6 : mid}
          x2={to - 1}
          y2={doubly ? mid - 6 : mid}
          class="stroke-slate-600"
          stroke-width="1.5"
          marker-end="url(#{arrowId})"
          aria-hidden="true"
        />
      {/if}
      {#if doubly && i > 0}
        <line
          x1={x(i)}
          y1={mid + 6}
          x2={x(i - 1) + BOX + LINK + 1}
          y2={mid + 6}
          class="stroke-slate-600"
          stroke-width="1.5"
          marker-end="url(#{arrowId})"
          aria-hidden="true"
        />
      {/if}
    {/each}

    {#if circular && nodes.length > 0}
      {@const last = x(nodes.length - 1) + BOX + LINK / 2}
      <path
        d="M{last} {mid} V{top + H + 18} H{x(0) + BOX / 2} V{top + H + 1}"
        class="fill-none stroke-slate-600"
        stroke-width="1.5"
        marker-end="url(#{arrowId})"
        aria-hidden="true"
      />
    {/if}

    {#each nodes as n, i (n.id)}
      {#if onselect}
        <g
          data-index={i}
          role="button"
          tabindex={i === focusIndex ? 0 : -1}
          aria-label={nodeLabel(i)}
          aria-pressed={i === selected}
          class="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-teal-700 [&:focus-visible>rect:first-child]:stroke-[3]"
          onclick={() => onselect(i)}
          onkeydown={(e) => onKeydown(e, i)}
          onfocus={() => (focusIndex = i)}
        >
          {@render box(i)}
        </g>
      {:else}
        <g>
          <title>{nodeLabel(i)}</title>
          {@render box(i)}
        </g>
      {/if}
    {/each}

    {#if showNull}
      {@const nx = x(nodes.length)}
      <g aria-hidden="true">
        <rect
          x={nx}
          y={top + 6}
          width={BOX}
          height={H - 12}
          rx="4"
          stroke-dasharray="4 3"
          class="fill-none stroke-slate-400"
          stroke-width="1.5"
        />
        <text
          x={nx + BOX / 2}
          y={mid}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="11"
          class="fill-slate-500">{v.nullLabel}</text
        >
      </g>
    {/if}

    {#each pointerRows as p, pi (pi)}
      {@const cx = x(p.index) + BOX / 2}
      {@const y = top - 4 - p.row * POINTER_H}
      <g aria-hidden="true">
        <path d="M{cx} {y} l-5 -7 h10 z" class="fill-slate-700" />
        <text
          x={cx}
          y={y - 15}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="11"
          font-weight="600"
          class="fill-slate-800">{p.name}</text
        >
      </g>
    {/each}
  </svg>
</ScrollFrame>
