<script>
  import { rovingStep } from '$lib/components/visual-state.js';

  /**
   * A row of cells where a range is chosen by dragging across it. The cells stretch to fit the
   * card, so the row never scrolls and the pointer position maps straight to an index. The
   * keyboard path is two picks: arrows move, Enter or Space starts the range, then Enter or
   * Space on another cell ends it.
   * @type {{
   *   values: number[],
   *   l: number,
   *   r: number,
   *   anchor: number,
   *   ariaLabel: string,
   *   labelOf: (i: number) => string,
   *   onrange: (l: number, r: number) => void,
   *   onanchor: (i: number) => void,
   * }}
   */
  let { values, l, r, anchor, ariaLabel, labelOf, onrange, onanchor } = $props();

  /** @type {HTMLDivElement | undefined} */
  let row = $state();
  let focusIndex = $state(0);
  // The array can shrink under a remembered index, and one cell must stay in the tab order.
  const tabStop = $derived(Math.min(focusIndex, values.length - 1));
  // Plain, because only the pointer handlers read it.
  let dragFrom = -1;

  /** @param {MouseEvent} e */
  function indexAt(e) {
    const box = /** @type {HTMLDivElement} */ (row).getBoundingClientRect();
    const at = Math.floor(((e.clientX - box.left) / box.width) * values.length);
    return Math.min(values.length - 1, Math.max(0, at));
  }

  /** @param {PointerEvent} e */
  function down(e) {
    e.preventDefault();
    dragFrom = indexAt(e);
    focusIndex = dragFrom;
    /** @type {HTMLDivElement} */ (row).setPointerCapture?.(e.pointerId);
    onrange(dragFrom, dragFrom);
  }

  /** @param {PointerEvent} e */
  function move(e) {
    if (dragFrom < 0) return;
    const at = indexAt(e);
    onrange(Math.min(dragFrom, at), Math.max(dragFrom, at));
  }

  function up() {
    dragFrom = -1;
  }

  /** @param {KeyboardEvent} e @param {number} i */
  function onKeydown(e, i) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (anchor < 0) onanchor(i);
      else onrange(Math.min(anchor, i), Math.max(anchor, i));
      return;
    }
    const next = rovingStep(e.key, i, values.length);
    if (next === null) return;
    e.preventDefault();
    focusIndex = next;
    /** @type {HTMLElement | null | undefined} */ (
      row?.querySelector(`[data-index="${next}"]`)
    )?.focus();
  }
</script>

<div
  bind:this={row}
  role="group"
  aria-label={ariaLabel}
  class="flex cursor-col-resize touch-none gap-0.5 select-none"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  {#each values as value, i (i)}
    {@const inside = i >= l && i <= r}
    <div
      data-index={i}
      role="button"
      tabindex={i === tabStop ? 0 : -1}
      aria-label={labelOf(i)}
      aria-pressed={inside}
      class="focus-ring flex h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-md border text-sm font-semibold tabular-nums {inside
        ? 'border-slate-900 bg-state-frontier text-slate-900'
        : 'border-slate-300 bg-white text-slate-800'} {i === anchor
        ? 'outline-2 outline-teal-700'
        : ''}"
      onkeydown={(e) => onKeydown(e, i)}
      onfocus={() => (focusIndex = i)}
    >
      <span>{value}</span>
      <span class="text-[10px] font-normal text-slate-600">{i}</span>
    </div>
  {/each}
</div>
