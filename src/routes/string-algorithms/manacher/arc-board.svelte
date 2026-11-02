<script>
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/algo-engine/manacher.js').ManacherFrame} ManacherFrame */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * The separated string as a row of cells with one arc per palindrome over it: thin for a
   * finished radius, bold for the centre in hand, dashed for its mirror. A band outlines the
   * palindrome that reaches furthest.
   * @type {{
   *   frame: ManacherFrame,
   *   ariaLabel: string,
   *   stateOf: (c: number) => VisualState,
   *   markerOf: (c: number) => string,
   *   labelOf: (c: number) => string,
   *   centreMark: string,
   *   rightMark: string,
   *   rowP: string,
   *   rowIndex: string,
   *   speed?: number,
   * }}
   */
  let {
    frame,
    ariaLabel,
    stateOf,
    markerOf,
    labelOf,
    centreMark,
    rightMark,
    rowP,
    rowIndex,
    speed = 1,
  } = $props();

  const CELL = 28;
  const SIDE = 22;
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const n = $derived(frame.t.length);
  // The arc area is sized for the longest possible radius, so the row never jumps.
  const SCALE = 0.42;
  const base = $derived(Math.max(44, (Math.floor(n / 2) * CELL + 16) * SCALE) + 6);
  const width = $derived(SIDE + n * CELL + 4);
  const height = $derived(base + CELL + 66);

  /** @param {number} c */
  const cx = (c) => SIDE + c * CELL + CELL / 2;

  /** @param {number} centre @param {number} radius */
  function arc(centre, radius) {
    const rx = radius * CELL;
    return `M ${cx(centre) - rx} ${base} A ${rx} ${rx * SCALE} 0 0 1 ${cx(centre) + rx} ${base}`;
  }

  const hasBand = $derived(frame.r > 0);
  const bandLeft = $derived(2 * frame.c - frame.r);
</script>

<ScrollFrame>
  <svg
    role="img"
    aria-label={ariaLabel}
    viewBox="0 0 {width} {height}"
    class="mx-auto block"
    style="width: 100%; min-width: {n * 22 + SIDE}px; max-width: {width}px"
  >
    {#each frame.p as radius, c (c)}
      {#if radius !== null && radius > 0 && c !== frame.i}
        <path
          d={arc(c, radius)}
          fill="none"
          stroke-width="1"
          class="stroke-slate-400"
          data-arc="done"
        />
      {/if}
    {/each}
    {#if frame.mirror >= 0 && (frame.p[frame.mirror] ?? 0) > 0}
      <path
        d={arc(frame.mirror, frame.p[frame.mirror] ?? 0)}
        fill="none"
        stroke-width="2"
        stroke-dasharray="5 4"
        class="stroke-state-compare"
        data-arc="mirror"
      />
    {/if}
    {#if frame.i >= 0 && frame.value > 0}
      <path
        d={arc(frame.i, frame.value)}
        fill="none"
        stroke-width="3"
        class="stroke-state-active"
        data-arc="current"
      />
    {/if}

    {#each [...frame.t] as letter, c (c)}
      {@const s = stateOf(c)}
      {@const radius = frame.p[c]}
      <g>
        <title>{labelOf(c)}</title>
        <rect
          x={SIDE + c * CELL + 1}
          y={base + 4}
          width={CELL - 2}
          height={CELL - 2}
          rx="3"
          stroke-width={s === '' ? 1 : 2}
          class="{STATE_FILL[s]} {stateStroke(s)} {fade}"
        />
        <text
          x={cx(c)}
          y={base + 4 + (CELL - 2) / 2}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={letter === '#' ? 11 : 14}
          font-weight={letter === '#' ? 400 : 700}
          class={s === '' && letter === '#' ? 'fill-slate-500' : STATE_TEXT[s]}>{letter}</text
        >
        <text
          x={cx(c)}
          y={base + CELL + 15}
          text-anchor="middle"
          font-size="12"
          font-weight="700"
          class="fill-slate-900"
          aria-hidden="true">{markerOf(c)}</text
        >
        <text
          x={cx(c)}
          y={base + CELL + 29}
          text-anchor="middle"
          font-size="11"
          font-weight="700"
          class="fill-slate-700"
          aria-hidden="true"
          >{hasBand && c === frame.c ? centreMark : ''}{hasBand && c === frame.r
            ? rightMark
            : ''}</text
        >
        <text
          x={cx(c)}
          y={base + CELL + 44}
          text-anchor="middle"
          font-size="12"
          class="fill-slate-900"
          aria-hidden="true">{radius ?? ''}</text
        >
        <text
          x={cx(c)}
          y={base + CELL + 58}
          text-anchor="middle"
          font-size="9"
          class="fill-slate-500"
          aria-hidden="true">{c}</text
        >
      </g>
    {/each}
    {#if hasBand}
      <rect
        x={SIDE + bandLeft * CELL - 1}
        y={base + 1}
        width={(frame.r - bandLeft + 1) * CELL + 2}
        height={CELL + 4}
        rx="5"
        fill="none"
        stroke-width="2.5"
        class="stroke-state-frontier"
        data-band="true"
      />
    {/if}
    <text
      x="2"
      y={base + CELL + 44}
      font-size="11"
      font-weight="600"
      class="fill-slate-500"
      aria-hidden="true">{rowP}</text
    >
    <text x="2" y={base + CELL + 58} font-size="10" class="fill-slate-500" aria-hidden="true"
      >{rowIndex}</text
    >
  </svg>
</ScrollFrame>
