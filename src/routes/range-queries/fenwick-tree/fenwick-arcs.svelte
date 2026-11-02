<script>
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, rovingStep, stateStroke } from '$lib/components/visual-state.js';
  import { blockStart, lowbit } from '$lib/algo-engine/fenwick-tree.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * The Fenwick array with the blocks its cells cover. The top row is t[1..n], with a dashed stop
   * box at each end for jumps that leave the array. Arcs above it show the index jumps of the
   * running operation. Under each cell is its index in binary with the lowest set bit picked out,
   * then one bar per cell spanning the values it sums, then the values themselves.
   * @type {{
   *   a: number[],
   *   t: number[],
   *   arcs: {from: number, to: number, hot: boolean}[],
   *   stateOf: (i: number) => VisualState,
   *   markerOf: (i: number) => string,
   *   labelOf: (i: number) => string,
   *   ariaLabel: string,
   *   barLabel: (i: number) => string,
   *   stopLow: string,
   *   stopHigh: string,
   *   valuesName: string,
   *   treeName: string,
   *   onselect: (i: number) => void,
   *   selected: number,
   *   speed: number,
   * }}
   */
  let {
    a,
    t,
    arcs,
    stateOf,
    markerOf,
    labelOf,
    ariaLabel,
    barLabel,
    stopLow,
    stopHigh,
    valuesName,
    treeName,
    onselect,
    selected,
    speed,
  } = $props();

  const uid = $props.id();
  const CELL = 40;
  const PITCH = 44;
  const HEAD = 34;
  const ARC_BAND = 86;
  const MARK = 14;
  const BITS_H = 18;
  const BAR_H = 22;

  const n = $derived(t.length - 1);
  const levels = $derived(31 - Math.clz32(Math.max(1, n)) + 1);
  const bitWidth = $derived(n.toString(2).length);
  const treeTop = $derived(ARC_BAND + MARK);
  const bitsTop = $derived(treeTop + CELL + 2);
  const barsTop = $derived(bitsTop + BITS_H + 4);
  const valuesTop = $derived(barsTop + levels * BAR_H + 4);
  const vbW = $derived(HEAD + (n + 2) * PITCH);
  const vbH = $derived(valuesTop + CELL + 2);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');

  /** Left edge of the slot for index i; slot 0 and slot n + 1 are the stop boxes. @param {number} i */
  const x = (i) => HEAD + Math.min(i, n + 1) * PITCH;
  /** @param {number} i */
  const mid = (i) => x(i) + CELL / 2;

  /** Row of a bar: the exponent of the cell's lowest set bit. @param {number} i */
  const barRow = (i) => 31 - Math.clz32(lowbit(i));

  /** @param {number} i */
  const bits = (i) => {
    const text = i.toString(2).padStart(bitWidth, '0');
    const at = text.lastIndexOf('1');
    return { head: text.slice(0, at), low: text[at], tail: text.slice(at + 1) };
  };

  /** A curve above the cells, taller for a longer jump. @param {number} from @param {number} to */
  function arcPath(from, to) {
    const x1 = mid(from);
    const x2 = mid(to);
    const y = treeTop - MARK + 6;
    const rise = Math.min(ARC_BAND * 1.7, 34 + Math.abs(to - from) * 14);
    return `M${x1} ${y} Q${(x1 + x2) / 2} ${y - rise} ${x2} ${y}`;
  }

  const indices = $derived(Array.from({ length: n }, (_, k) => k + 1));

  // svelte-ignore state_referenced_locally
  let focusIndex = $state(Math.max(1, selected));
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  /** @param {KeyboardEvent} e @param {number} i */
  function onKeydown(e, i) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect(i);
      return;
    }
    const next = rovingStep(e.key, i - 1, n);
    if (next === null) return;
    e.preventDefault();
    focusIndex = next + 1;
    /** @type {SVGElement | null | undefined} */ (
      svg?.querySelector(`[data-index="${focusIndex}"]`)
    )?.focus();
  }
</script>

<ScrollFrame>
  <svg
    bind:this={svg}
    viewBox="0 0 {vbW} {vbH}"
    role="group"
    aria-label={ariaLabel}
    class="mx-auto block h-auto"
    style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 520)}px"
  >
    <defs>
      <marker
        id="{uid}-head"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" class="fill-slate-500" />
      </marker>
      <marker
        id="{uid}-hot"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" class="fill-teal-700" />
      </marker>
    </defs>

    <g aria-hidden="true">
      {#each arcs as arc (`${arc.from}-${arc.to}`)}
        <path
          d={arcPath(arc.from, arc.to)}
          fill="none"
          class={arc.hot ? 'stroke-teal-700' : 'stroke-slate-400'}
          stroke-width={arc.hot ? 2.5 : 1.5}
          marker-end="url(#{uid}-{arc.hot ? 'hot' : 'head'})"
        />
      {/each}

      <text
        x={HEAD - 6}
        y={treeTop + CELL / 2}
        text-anchor="end"
        dominant-baseline="central"
        font-size="11"
        font-weight="600"
        class="fill-slate-500">{treeName}</text
      >
      <rect
        x={x(0)}
        y={treeTop + 6}
        width={CELL}
        height={CELL - 12}
        rx="6"
        fill="none"
        stroke-dasharray="4 3"
        class="stroke-slate-400"
      />
      <text
        x={mid(0)}
        y={treeTop + CELL / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        class="fill-slate-500">{stopLow}</text
      >
      <rect
        x={x(n + 1)}
        y={treeTop + 6}
        width={CELL}
        height={CELL - 12}
        rx="6"
        fill="none"
        stroke-dasharray="4 3"
        class="stroke-slate-400"
      />
      <text
        x={mid(n + 1)}
        y={treeTop + CELL / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        class="fill-slate-500">{stopHigh}</text
      >

      {#each indices as i (i)}
        {@const b = bits(i)}
        <text
          x={mid(i)}
          y={bitsTop + BITS_H / 2}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="10"
          font-family="monospace"
          class="fill-slate-500"
          >{b.head}<tspan font-weight="700" text-decoration="underline" class="fill-teal-800"
            >{b.low}</tspan
          >{b.tail}</text
        >
      {/each}

      {#each indices as i (i)}
        {@const s = stateOf(i)}
        {@const start = blockStart(i)}
        <rect
          x={x(start) + 1}
          y={barsTop + barRow(i) * BAR_H}
          width={(i - start + 1) * PITCH - 6}
          height={BAR_H - 4}
          rx="4"
          stroke-width="1.25"
          class="{s === '' ? 'fill-slate-100' : STATE_FILL[s]} {s === ''
            ? 'stroke-slate-300'
            : stateStroke(s)} {fade}"
        />
        <text
          x={x(start) + ((i - start + 1) * PITCH - 4) / 2}
          y={barsTop + barRow(i) * BAR_H + (BAR_H - 4) / 2}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="10"
          class={s === '' ? 'fill-slate-600' : STATE_TEXT[s]}>{barLabel(i)}</text
        >
      {/each}

      <text
        x={HEAD - 6}
        y={valuesTop + CELL / 2}
        text-anchor="end"
        dominant-baseline="central"
        font-size="11"
        font-weight="600"
        class="fill-slate-500">{valuesName}</text
      >
      {#each indices as i (i)}
        <rect
          x={x(i)}
          y={valuesTop}
          width={CELL}
          height={CELL}
          rx="6"
          stroke-width="1.25"
          class="fill-white stroke-slate-300"
        />
        <text
          x={mid(i)}
          y={valuesTop + CELL / 2}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="13"
          class="fill-slate-800">{a[i]}</text
        >
      {/each}
    </g>

    {#each indices as i (i)}
      {@const s = stateOf(i)}
      {@const mark = markerOf(i)}
      <g
        data-index={i}
        role="button"
        tabindex={i === focusIndex ? 0 : -1}
        aria-label={labelOf(i)}
        aria-pressed={i === selected}
        class="cursor-pointer outline-none [&:focus-visible>rect]:stroke-teal-700 [&:focus-visible>rect]:stroke-[3]"
        onclick={() => onselect(i)}
        onkeydown={(e) => onKeydown(e, i)}
        onfocus={() => (focusIndex = i)}
      >
        <rect
          x={x(i)}
          y={treeTop}
          width={CELL}
          height={CELL}
          rx="6"
          stroke-width={i === selected ? 3 : 1.5}
          class="{STATE_FILL[s]} {i === selected ? 'stroke-teal-700' : stateStroke(s)} {fade}"
        />
        <text
          x={mid(i)}
          y={treeTop + CELL / 2}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={String(t[i]).length > 3 ? 11 : 14}
          font-weight="600"
          class={STATE_TEXT[s]}>{t[i]}</text
        >
        {#if mark}
          <text
            x={mid(i)}
            y={treeTop - MARK / 2}
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
      </g>
    {/each}
  </svg>
</ScrollFrame>
