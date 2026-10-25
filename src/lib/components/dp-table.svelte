<script>
  import { t } from '$lib/i18n/index.js';
  import ScrollFrame from './scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, stateStroke } from './visual-state.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */
  /** @typedef {[number, number]} Cell */

  /**
   * A dynamic-programming table: rows of values (`null` is a cell not filled yet), optional
   * row and column headers, and arrows from the cells a value was computed from. With
   * `onselect` every cell is a button in one roving-focus grid: arrows move, Home and End
   * jump to the row ends, Enter or Space picks.
   * @type {{
   *   values: (number | string | null)[][],
   *   ariaLabel: string,
   *   rowHeaders?: string[],
   *   colHeaders?: string[],
   *   stateOf?: (r: number, c: number) => VisualState,
   *   markerOf?: (r: number, c: number) => string,
   *   labelOf?: ((r: number, c: number) => string) | null,
   *   arrows?: {from: Cell, to: Cell}[],
   *   onselect?: ((r: number, c: number) => void) | null,
   *   selected?: Cell | null,
   *   speed?: number,
   * }}
   */
  let {
    values,
    ariaLabel,
    rowHeaders = [],
    colHeaders = [],
    stateOf = () => '',
    markerOf = () => '',
    labelOf = null,
    arrows = [],
    onselect = null,
    selected = null,
    speed = 1,
  } = $props();

  const v = t().visuals;
  const uid = $props.id();
  const arrowId = `${uid}-dep`;
  const CELL = 40;
  const HEAD = 28;

  const rows = $derived(values.length);
  const cols = $derived(Math.max(0, ...values.map((r) => r.length)));
  const left = $derived(rowHeaders.length ? HEAD + 8 : 0);
  const top = $derived(colHeaders.length ? HEAD : 0);
  const vbW = $derived(left + Math.max(1, cols) * CELL + 2);
  const vbH = $derived(top + Math.max(1, rows) * CELL + 2);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');

  /** @param {number} c */
  const cx = (c) => left + c * CELL + 1;
  /** @param {number} r */
  const cy = (r) => top + r * CELL + 1;
  /** @param {number} r @param {number} c */
  const shown = (r, c) => {
    const val = values[r]?.[c];
    return val === null || val === undefined ? '' : String(val);
  };
  /** @param {number} r @param {number} c */
  const isSelected = (r, c) => selected !== null && selected[0] === r && selected[1] === c;

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    if (labelOf) return labelOf(r, c);
    const s = stateOf(r, c);
    return v.dpCell(r, c, shown(r, c), s ? v.states[s] : '');
  }

  // Arrow from the centre of one cell to the edge of another, stopping short of the target.
  /** @param {{from: Cell, to: Cell}} a */
  function arrowLine(a) {
    const x1 = cx(a.from[1]) + CELL / 2;
    const y1 = cy(a.from[0]) + CELL / 2;
    const x2 = cx(a.to[1]) + CELL / 2;
    const y2 = cy(a.to[0]) + CELL / 2;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const k = (CELL / 2 - 4) / len;
    const dx = (x2 - x1) * k;
    const dy = (y2 - y1) * k;
    // Both ends stop near the cell edges so the arrow never covers a value.
    return { x1: x1 + dx, y1: y1 + dy, x2: x2 - dx, y2: y2 - dy };
  }

  // svelte-ignore state_referenced_locally
  let focus = $state(/** @type {Cell} */ (selected ? [...selected] : [0, 0]));
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  /** @param {KeyboardEvent} e @param {number} r @param {number} c */
  function onKeydown(e, r, c) {
    if (!onselect) return;
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
    else if (e.key === 'Home') nc = 0;
    else if (e.key === 'End') nc = (values[r]?.length ?? 1) - 1;
    else return;
    e.preventDefault();
    if (nr < 0 || nr >= rows || nc < 0 || nc >= (values[nr]?.length ?? 0)) return;
    focus = [nr, nc];
    /** @type {SVGElement | null | undefined} */ (
      svg?.querySelector(`[data-cell="${nr}-${nc}"]`)
    )?.focus();
  }
</script>

{#snippet box(/** @type {number} */ r, /** @type {number} */ c)}
  {@const s = stateOf(r, c)}
  {@const mark = markerOf(r, c)}
  {@const text = shown(r, c)}
  <rect
    x={cx(c)}
    y={cy(r)}
    width={CELL}
    height={CELL}
    stroke-width={isSelected(r, c) ? 3 : s === '' ? 1 : 2}
    class="{s === '' && text === '' ? 'fill-slate-50' : STATE_FILL[s]} {isSelected(r, c)
      ? 'stroke-teal-700'
      : s === ''
        ? 'stroke-slate-300'
        : stateStroke(s)} {fade}"
  />
  <text
    x={cx(c) + CELL / 2}
    y={cy(r) + CELL / 2}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={text.length > 3 ? 10 : 13}
    font-weight="600"
    class={STATE_TEXT[s]}>{text}</text
  >
  {#if mark}
    <text
      x={cx(c) + CELL - 7}
      y={cy(r) + 8}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="10"
      font-weight="700"
      stroke="white"
      stroke-width="3"
      paint-order="stroke"
      class="fill-slate-900"
      aria-hidden="true">{mark}</text
    >
  {/if}
{/snippet}

<ScrollFrame>
  <svg
    bind:this={svg}
    viewBox="0 0 {vbW} {vbH}"
    role={onselect ? 'group' : 'img'}
    aria-label={onselect ? `${ariaLabel} ${v.dpKeys}` : ariaLabel}
    class="mx-auto block h-auto"
    style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 360)}px"
  >
    <defs>
      <marker
        id={arrowId}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" class="fill-rose-700" />
      </marker>
    </defs>

    {#each colHeaders as h, c (c)}
      <text
        x={cx(c) + CELL / 2}
        y={HEAD / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        font-weight="600"
        class="fill-slate-600"
        aria-hidden="true">{h}</text
      >
    {/each}
    {#each rowHeaders as h, r (r)}
      <text
        x={left - 8}
        y={cy(r) + CELL / 2}
        text-anchor="end"
        dominant-baseline="central"
        font-size="11"
        font-weight="600"
        class="fill-slate-600"
        aria-hidden="true">{h}</text
      >
    {/each}

    {#each values as row, r (r)}
      {#each row as _, c (c)}
        {#if onselect}
          <g
            data-cell="{r}-{c}"
            role="button"
            tabindex={focus[0] === r && focus[1] === c ? 0 : -1}
            aria-label={cellLabel(r, c)}
            aria-pressed={isSelected(r, c)}
            class="cursor-pointer outline-none [&:focus-visible>rect]:stroke-teal-700 [&:focus-visible>rect]:stroke-[3]"
            onclick={() => onselect(r, c)}
            onkeydown={(e) => onKeydown(e, r, c)}
            onfocus={() => (focus = [r, c])}
          >
            {@render box(r, c)}
          </g>
        {:else}
          <g>
            <title>{cellLabel(r, c)}</title>
            {@render box(r, c)}
          </g>
        {/if}
      {/each}
    {/each}

    {#each arrows as a, i (i)}
      {@const l = arrowLine(a)}
      <line
        x1={l.x1}
        y1={l.y1}
        x2={l.x2}
        y2={l.y2}
        class="stroke-rose-700"
        stroke-width="2"
        marker-end="url(#{arrowId})"
        pointer-events="none"
        aria-hidden="true"
      />
    {/each}
  </svg>
</ScrollFrame>
