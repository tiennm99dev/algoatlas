<script>
  /**
   * An interactive cell grid with pointer painting and roving-focus keyboard navigation.
   * Below the sm breakpoint it is drawn transposed so cells stay wide enough to touch.
   * @type {{
   *   rows: number,
   *   cols: number,
   *   cellState: (cell: number) => {cls: string, mark: string, label: string},
   *   gridLabel: string,
   *   initialFocus: number,
   *   speed: number,
   *   onPaintStart: (cell: number) => boolean | null,
   *   onPaint: (cell: number, on: boolean) => void,
   *   onEdit: (cell: number) => void,
   * }}
   */
  let {
    rows: ROWS,
    cols: COLS,
    cellState,
    gridLabel,
    initialFocus,
    speed,
    onPaintStart,
    onPaint,
    onEdit,
  } = $props();

  const at = (/** @type {number} */ r, /** @type {number} */ c) => r * COLS + c;

  // svelte-ignore state_referenced_locally
  let focusIndex = $state(initialFocus);
  /** @type {HTMLElement | undefined} */
  let grid;

  // Below the sm breakpoint the grid is drawn transposed (rows across, columns down) so cells
  // stay wide enough to touch. Only the drawing changes: cell indices and labels do not.
  let transposed = $state(false);
  $effect(() => {
    const narrow = window.matchMedia('(max-width: 639px)');
    const update = () => (transposed = narrow.matches);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  });
  const shownRows = $derived(transposed ? COLS : ROWS);
  const shownCols = $derived(transposed ? ROWS : COLS);
  /** Cell index at a drawn position. @param {number} dr @param {number} dc */
  const shown = (dr, dc) => (transposed ? at(dc, dr) : at(dr, dc));

  /** Whether a drag is painting on (true) or erasing (false); null when no drag is active. */
  let painting = /** @type {boolean | null} */ (null);

  /** @param {PointerEvent} e */
  function cellFromPoint(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]');
    return el ? Number(/** @type {HTMLElement} */ (el).dataset.cell) : -1;
  }

  /** @param {PointerEvent} e */
  function onPointerDown(e) {
    if (e.button !== 0) return;
    const cell = cellFromPoint(e);
    if (cell < 0) return;
    e.preventDefault();
    painting = onPaintStart(cell);
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (painting === null) return;
    // A release outside the window never reaches pointerup; stop once no button is held.
    if ((e.buttons & 1) === 0) {
      painting = null;
      return;
    }
    const cell = cellFromPoint(e);
    if (cell >= 0) onPaint(cell, painting);
  }

  /** @param {KeyboardEvent} e @param {number} cell */
  function onCellKeydown(e, cell) {
    const r = Math.floor(cell / COLS);
    const c = cell % COLS;
    // Work in drawn coordinates so the arrows follow the screen when the grid is transposed.
    let [dr, dc] = transposed ? [c, r] : [r, c];
    if (e.key === 'ArrowUp') dr--;
    else if (e.key === 'ArrowDown') dr++;
    else if (e.key === 'ArrowLeft') dc--;
    else if (e.key === 'ArrowRight') dc++;
    else return;
    e.preventDefault();
    if (dr < 0 || dr >= shownRows || dc < 0 || dc >= shownCols) return;
    focusIndex = shown(dr, dc);
    /** @type {HTMLElement | null | undefined} */ (
      grid?.querySelector(`[data-cell="${focusIndex}"]`)
    )?.focus();
  }
</script>

<svelte:window onpointerup={() => (painting = null)} onpointercancel={() => (painting = null)} />

<!-- touch-pan-y keeps vertical swipes scrolling the page; sideways drags still paint. -->
<div
  role="grid"
  tabindex="-1"
  aria-label={gridLabel}
  class="grid touch-pan-y gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 select-none"
  style="grid-template-columns: 1.5rem repeat({shownCols}, minmax(0, 1fr));"
  bind:this={grid}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
>
  <!-- Axis numbers let the (row,col) narration be read off the grid (on phones the row
       index runs across the top). Screen readers get coordinates from each cell's label
       instead, so the whole axis row is hidden from them. -->
  <div class="contents" aria-hidden="true">
    <span class="bg-white"></span>
    {#each { length: shownCols } as _, dc (dc)}
      <span class="bg-white text-center text-[10px] leading-5 text-slate-500 tabular-nums"
        >{dc}</span
      >
    {/each}
  </div>
  {#each { length: shownRows } as _, dr (dr)}
    <div role="row" class="contents">
      <span
        class="flex items-center justify-center bg-white text-[10px] text-slate-500 tabular-nums"
        aria-hidden="true">{dr}</span
      >
      {#each { length: shownCols } as _, dc (dc)}
        {@const cell = shown(dr, dc)}
        {@const s = cellState(cell)}
        <div role="gridcell" class="flex">
          <button
            data-cell={cell}
            tabindex={cell === focusIndex ? 0 : -1}
            aria-label={s.label}
            class="flex aspect-square w-full cursor-pointer items-center justify-center text-xs font-semibold tabular-nums focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset {s.cls} {speed <
            8
              ? 'transition-colors'
              : ''}"
            onclick={(e) => e.detail === 0 && onEdit(cell)}
            onfocus={() => (focusIndex = cell)}
            onkeydown={(e) => onCellKeydown(e, cell)}>{s.mark}</button
          >
        </div>
      {/each}
    </div>
  {/each}
</div>
