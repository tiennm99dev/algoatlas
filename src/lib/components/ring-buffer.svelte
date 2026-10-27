<script>
  import { STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  /**
   * A circular buffer drawn as a ring: slot 0 at the top, indices running clockwise, so the
   * slot after C − 1 is visibly slot 0 again. `head` and `tail` point in from the middle.
   * @type {{
   *   labels: string[],
   *   ariaLabel: string,
   *   head: number,
   *   tail: number,
   *   headLabel: string,
   *   tailLabel: string,
   *   titleOf: (i: number) => string,
   *   stateOf?: (i: number) => VisualState,
   *   markerOf?: (i: number) => string,
   *   dimmed?: (i: number) => boolean,
   *   speed?: number,
   * }}
   */
  let {
    labels,
    ariaLabel,
    head,
    tail,
    headLabel,
    tailLabel,
    titleOf,
    stateOf = () => '',
    markerOf = () => '',
    dimmed = () => false,
    speed = 1,
  } = $props();

  const SIZE = 300;
  const MID = SIZE / 2;
  const R = 102;
  const W = 46;
  const H = 34;

  const n = $derived(labels.length);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');

  /** Point at radius r in the direction of slot i. @param {number} i @param {number} r */
  function polar(i, r) {
    const a = (-90 + (360 * i) / n) * (Math.PI / 180);
    return { x: MID + r * Math.cos(a), y: MID + r * Math.sin(a) };
  }

  const pointers = $derived([
    { name: headLabel, slot: head, r: 64, cls: 'fill-teal-800', line: 'stroke-teal-800' },
    { name: tailLabel, slot: tail, r: 36, cls: 'fill-amber-800', line: 'stroke-amber-800' },
  ]);
</script>

<svg
  viewBox="0 0 {SIZE} {SIZE}"
  role="img"
  aria-label={ariaLabel}
  class="mx-auto block h-auto w-full"
  style="max-width: {SIZE}px"
>
  <circle cx={MID} cy={MID} r={R} class="fill-none stroke-slate-200" stroke-width="10" />
  {#each labels as label, i (i)}
    {@const p = polar(i, R)}
    {@const q = polar(i, R + 32)}
    {@const s = stateOf(i)}
    {@const mark = markerOf(i)}
    <g opacity={dimmed(i) ? 0.4 : 1}>
      <title>{titleOf(i)}</title>
      <rect
        x={p.x - W / 2}
        y={p.y - H / 2}
        width={W}
        height={H}
        rx="5"
        stroke-width={s === '' ? 1.5 : 2.5}
        stroke-dasharray={label === '' ? '4 3' : undefined}
        class="{STATE_FILL[s]} {stateStroke(s)} {fade}"
      />
      <text
        x={p.x}
        y={p.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="14"
        font-weight="600"
        class={STATE_TEXT[s]}>{label}</text
      >
      {#if mark}
        <text
          x={p.x + W / 2 - 5}
          y={p.y - H / 2 + 2}
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
    <text
      x={q.x}
      y={q.y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      class="fill-slate-500"
      aria-hidden="true">{i}</text
    >
  {/each}
  {#each pointers as ptr (ptr.name)}
    {@const from = polar(ptr.slot, ptr.r + 9)}
    {@const to = polar(ptr.slot, R - H / 2 - 4)}
    {@const at = polar(ptr.slot, ptr.r)}
    <g aria-hidden="true">
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke-width="2"
        class={ptr.line}
        data-pointer={ptr.name}
      />
      <circle cx={to.x} cy={to.y} r="3" class={ptr.cls} />
      <text
        x={at.x}
        y={at.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        font-weight="700"
        stroke="white"
        stroke-width="3"
        paint-order="stroke"
        class={ptr.cls}>{ptr.name}</text
      >
    </g>
  {/each}
</svg>
