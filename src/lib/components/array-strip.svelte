<script>
  import { t } from '$lib/i18n/index.js';
  import ScrollFrame from './scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, rovingStep, stateStroke } from './visual-state.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */

  /**
   * A row of array cells with index labels, named pointers beneath (`i`, `lo`, `hi`; an index
   * equal to the length points one past the end) and half-open windows `[from, to)` bracketed
   * above. With `onselect` the cells become a roving-focus row of buttons: arrows and
   * Home/End move, Enter or Space picks.
   * @type {{
   *   values: (number | string)[],
   *   ariaLabel: string,
   *   stateOf?: (i: number) => VisualState,
   *   markerOf?: (i: number) => string,
   *   labelOf?: ((i: number) => string) | null,
   *   dimmed?: (i: number) => boolean,
   *   pointers?: {name: string, index: number}[],
   *   windows?: {from: number, to: number, label: string}[],
   *   showIndices?: boolean,
   *   onselect?: ((i: number) => void) | null,
   *   selected?: number,
   *   speed?: number,
   * }}
   */
  let {
    values,
    ariaLabel,
    stateOf = () => '',
    markerOf = () => '',
    labelOf = null,
    dimmed = () => false,
    pointers = [],
    windows = [],
    showIndices = true,
    onselect = null,
    selected = -1,
    speed = 1,
  } = $props();

  const v = t().visuals;
  const CELL = 40;
  const GAP = 4;
  const PITCH = CELL + GAP;
  const BRACKET = 18;
  const INDEX_H = 14;
  const POINTER_H = 30;
  const MARK_H = 14;

  // Windows that overlap stack into separate bracket rows.
  const windowRows = $derived.by(() => {
    /** @type {number[]} */
    const rowEnds = [];
    return windows.map((w) => {
      let row = rowEnds.findIndex((end) => end <= w.from);
      if (row < 0) row = rowEnds.push(0) - 1;
      rowEnds[row] = w.to;
      return { ...w, row };
    });
  });
  const windowBand = $derived(
    windowRows.length ? (Math.max(...windowRows.map((w) => w.row)) + 1) * BRACKET : 0,
  );

  // Pointers on the same index stack downwards.
  const pointerRows = $derived.by(() => {
    return pointers.map((p, i) => ({
      ...p,
      row: pointers.slice(0, i).filter((q) => q.index === p.index).length,
    }));
  });
  const pointerBand = $derived(
    pointerRows.length ? (Math.max(...pointerRows.map((p) => p.row)) + 1) * POINTER_H : 0,
  );

  const slots = $derived(
    Math.max(values.length, ...pointers.map((p) => p.index + 1), ...windows.map((w) => w.to), 1),
  );
  const top = $derived(windowBand + MARK_H);
  const cellsBottom = $derived(top + CELL);
  const indexY = $derived(cellsBottom + (showIndices ? INDEX_H : 0));
  const vbW = $derived(slots * PITCH - GAP);
  const vbH = $derived(indexY + pointerBand + 2);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');

  /** @param {number} i */
  const x = (i) => i * PITCH;

  /** @param {number} i */
  function cellLabel(i) {
    if (labelOf) return labelOf(i);
    const s = stateOf(i);
    return v.cell(i, String(values[i]), s ? v.states[s] : '');
  }

  const summary = $derived(
    [
      ariaLabel,
      ...pointers.map((p) => v.pointer(p.name, p.index)),
      ...windows.map((w) => v.window(w.label, w.from, w.to)),
    ].join('. '),
  );

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
    const next = rovingStep(e.key, i, values.length);
    if (next === null) return;
    e.preventDefault();
    focusIndex = next;
    /** @type {SVGElement | null | undefined} */ (
      svg?.querySelector(`[data-index="${next}"]`)
    )?.focus();
  }
</script>

{#snippet cell(/** @type {number | string} */ value, /** @type {number} */ i)}
  {@const s = stateOf(i)}
  {@const mark = markerOf(i)}
  <rect
    x={x(i)}
    y={top}
    width={CELL}
    height={CELL}
    rx="6"
    stroke-width={i === selected ? 3 : 1.5}
    class="{STATE_FILL[s]} {i === selected ? 'stroke-teal-700' : stateStroke(s)} {fade}"
  />
  <text
    x={x(i) + CELL / 2}
    y={top + CELL / 2}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={String(value).length > 3 ? 11 : 14}
    font-weight="600"
    class={STATE_TEXT[s]}>{value}</text
  >
  {#if mark}
    <text
      x={x(i) + CELL / 2}
      y={top - MARK_H / 2}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      font-weight="700"
      class="fill-slate-900"
      aria-hidden="true">{mark}</text
    >
  {/if}
{/snippet}

<ScrollFrame>
  <svg
    bind:this={svg}
    viewBox="-2 0 {vbW + 4} {vbH}"
    role={onselect ? 'group' : 'img'}
    aria-label={summary}
    class="mx-auto block h-auto"
    style="width: {vbW + 4}px; max-width: 100%; min-width: {Math.min(vbW, 360)}px"
  >
    {#each windowRows as w, wi (wi)}
      {@const y = windowBand - (w.row + 1) * BRACKET + 4}
      {@const x1 = x(w.from)}
      {@const x2 = x(w.to) - GAP}
      <g aria-hidden="true">
        <path
          d="M{x1} {y + 10} V{y + 4} H{x2} V{y + 10}"
          class="fill-none stroke-teal-700"
          stroke-width="1.5"
        />
        <text
          x={(x1 + x2) / 2}
          {y}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="10"
          stroke="white"
          stroke-width="3"
          paint-order="stroke"
          class="fill-teal-800">{w.label}</text
        >
      </g>
    {/each}

    {#each values as value, i (i)}
      {#if onselect}
        <g
          data-index={i}
          role="button"
          tabindex={i === focusIndex ? 0 : -1}
          aria-label={cellLabel(i)}
          aria-pressed={i === selected}
          class="cursor-pointer outline-none [&:focus-visible>rect]:stroke-teal-700 [&:focus-visible>rect]:stroke-[3]"
          opacity={dimmed(i) ? 0.4 : 1}
          onclick={() => onselect(i)}
          onkeydown={(e) => onKeydown(e, i)}
          onfocus={() => (focusIndex = i)}
        >
          {@render cell(value, i)}
        </g>
      {:else}
        <g opacity={dimmed(i) ? 0.4 : 1}>
          <title>{cellLabel(i)}</title>
          {@render cell(value, i)}
        </g>
      {/if}
    {/each}

    {#if showIndices}
      {#each { length: slots } as _, i (i)}
        <text
          x={x(i) + CELL / 2}
          y={cellsBottom + INDEX_H / 2 + 1}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="10"
          class="fill-slate-500"
          aria-hidden="true">{i}</text
        >
      {/each}
    {/if}

    {#each pointerRows as p, pi (pi)}
      {@const cx = x(p.index) + CELL / 2}
      {@const y = indexY + p.row * POINTER_H}
      <g aria-hidden="true">
        <path d="M{cx} {y + 2} l-5 7 h10 z" class="fill-slate-700" />
        <text
          x={cx}
          y={y + 19}
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
