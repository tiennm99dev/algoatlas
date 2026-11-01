<script>
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * A square board of buttons with row and column numbers, drawn as a chess board or with heavy
   * Sudoku box lines. Arrows move the focus and Enter or Space picks a square.
   * @type {{
   *   size: number,
   *   boxSide?: number,
   *   checkered?: boolean,
   *   cellOf: (r: number, c: number) => {
   *     text: string,
   *     state: VisualState,
   *     mark?: string,
   *     strong?: boolean,
   *     label: string,
   *   },
   *   ariaLabel: string,
   *   onselect: (r: number, c: number) => void,
   *   speed?: number,
   * }}
   */
  let { size, boxSide = 0, checkered = false, cellOf, ariaLabel, onselect, speed = 1 } = $props();

  const CELL = 44;
  const HEAD = 20;

  const span = $derived(HEAD + size * CELL + 2);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const indices = $derived(Array.from({ length: size }, (_, i) => i));
  /** @param {number} i */
  const at = (i) => HEAD + i * CELL + 1;
  /** Lines between Sudoku boxes, inner ones only. */
  const boxLines = $derived(
    boxSide ? indices.filter((i) => i > 0 && i % boxSide === 0).map((i) => at(i)) : [],
  );

  let focus = $state(/** @type {[number, number]} */ ([0, 0]));
  const stop = $derived(
    /** @type {[number, number]} */ ([Math.min(focus[0], size - 1), Math.min(focus[1], size - 1)]),
  );
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  /** @param {KeyboardEvent} e @param {number} r @param {number} c */
  function onKeydown(e, r, c) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect(r, c);
      return;
    }
    let [nr, nc] = [r, c];
    if (e.key === 'ArrowUp') nr--;
    else if (e.key === 'ArrowDown') nr++;
    else if (e.key === 'ArrowLeft') nc--;
    else if (e.key === 'ArrowRight') nc++;
    else return;
    e.preventDefault();
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
    focus = [nr, nc];
    /** @type {SVGElement | null | undefined} */ (
      svg?.querySelector(`[data-square="${nr}-${nc}"]`)
    )?.focus();
  }
</script>

<ScrollFrame>
  <svg
    bind:this={svg}
    viewBox="0 0 {span} {span}"
    role="group"
    aria-label={ariaLabel}
    class="mx-auto block h-auto"
    style="width: {span}px; max-width: 100%;"
  >
    {#each indices as i (i)}
      <text
        x={at(i) + CELL / 2}
        y={HEAD / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        font-weight="600"
        class="fill-slate-600"
        aria-hidden="true">{i}</text
      >
      <text
        x={HEAD / 2}
        y={at(i) + CELL / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        font-weight="600"
        class="fill-slate-600"
        aria-hidden="true">{i}</text
      >
    {/each}
    {#each indices as r (r)}
      {#each indices as c (c)}
        {@const cell = cellOf(r, c)}
        {@const dark = checkered && (r + c) % 2 === 1}
        <g
          data-square="{r}-{c}"
          role="button"
          tabindex={stop[0] === r && stop[1] === c ? 0 : -1}
          aria-label={cell.label}
          class="cursor-pointer outline-none [&:focus-visible>rect]:stroke-teal-700 [&:focus-visible>rect]:stroke-[3]"
          onclick={() => onselect(r, c)}
          onkeydown={(e) => onKeydown(e, r, c)}
          onfocus={() => (focus = [r, c])}
        >
          <rect
            x={at(c)}
            y={at(r)}
            width={CELL}
            height={CELL}
            stroke-width={cell.state === '' ? 1 : 2}
            class="{cell.state === '' && dark
              ? 'fill-slate-200'
              : STATE_FILL[cell.state]} {cell.state === ''
              ? 'stroke-slate-300'
              : stateStroke(cell.state)} {fade}"
          />
          <text
            x={at(c) + CELL / 2}
            y={at(r) + CELL / 2}
            text-anchor="middle"
            dominant-baseline="central"
            font-size={cell.strong ? 20 : 17}
            font-weight={cell.strong ? 700 : 500}
            class={STATE_TEXT[cell.state]}>{cell.text}</text
          >
          {#if cell.mark}
            <text
              x={at(c) + CELL - 8}
              y={at(r) + 9}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="10"
              font-weight="700"
              stroke="white"
              stroke-width="3"
              paint-order="stroke"
              class="fill-slate-900"
              aria-hidden="true">{cell.mark}</text
            >
          {/if}
        </g>
      {/each}
    {/each}
    {#each boxLines as pos (pos)}
      <line
        x1={pos}
        x2={pos}
        y1={at(0)}
        y2={at(size)}
        stroke-width="3"
        class="pointer-events-none stroke-slate-800"
      />
      <line
        y1={pos}
        y2={pos}
        x1={at(0)}
        x2={at(size)}
        stroke-width="3"
        class="pointer-events-none stroke-slate-800"
      />
    {/each}
  </svg>
</ScrollFrame>
