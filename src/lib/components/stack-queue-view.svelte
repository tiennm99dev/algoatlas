<script>
  import { t } from '$lib/i18n/index.js';
  import ScrollFrame from './scroll-frame.svelte';
  import { STATE_FILL, STATE_TEXT, stateStroke } from './visual-state.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */

  /**
   * A stack drawn as a column (top at the top) or a queue or deque drawn as a row (front on
   * the left), with the open ends labelled. `items` run bottom to top for a stack and front to
   * back otherwise. `capacity` draws the unused slots of a fixed-size array as dashed boxes.
   * @type {{
   *   kind: 'stack' | 'queue' | 'deque',
   *   items: {label: string, state?: VisualState, marker?: string}[],
   *   ariaLabel?: string,
   *   capacity?: number,
   *   speed?: number,
   * }}
   */
  let { kind, items, ariaLabel, capacity = 0, speed = 1 } = $props();

  const v = t().visuals;
  const W = 64;
  const H = 32;
  const GAP = 4;
  const LABEL = 44;

  const vertical = $derived(kind === 'stack');
  const slots = $derived(Math.max(items.length, capacity, 1));
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const vbW = $derived(vertical ? W + 2 * LABEL : 2 * LABEL + slots * (W + GAP) - GAP);
  const vbH = $derived(vertical ? slots * (H + GAP) - GAP + 4 : H + 24);

  /** Box position of slot i, counted from the bottom (stack) or the front (queue). @param {number} i */
  function at(i) {
    return vertical
      ? { x: LABEL, y: (slots - 1 - i) * (H + GAP) + 2 }
      : { x: LABEL + i * (W + GAP), y: 4 };
  }

  const summary = $derived(
    ariaLabel ??
      v.containerSummary(
        kind,
        items.map((it) => it.label),
      ),
  );
  const ends = $derived(
    vertical
      ? [
          { text: v.top, show: items.length > 0, ...at(items.length - 1) },
          { text: v.bottom, show: items.length > 1, ...at(0) },
        ]
      : [
          { text: v.front, show: items.length > 0, ...at(0) },
          { text: v.back, show: items.length > 1, ...at(items.length - 1) },
        ],
  );
</script>

<ScrollFrame>
  <svg
    viewBox="0 0 {vbW} {vbH}"
    role="img"
    aria-label={summary}
    class="mx-auto block h-auto"
    style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 320)}px"
  >
    {#each { length: slots } as _, i (i)}
      {@const p = at(i)}
      {@const item = items[i]}
      {#if item}
        {@const s = item.state ?? ''}
        <g>
          <title>{item.label}{s ? `, ${v.states[s]}` : ''}</title>
          <rect
            x={p.x}
            y={p.y}
            width={W}
            height={H}
            rx="5"
            stroke-width={s === '' ? 1.5 : 2.5}
            class="{STATE_FILL[s]} {stateStroke(s)} {fade}"
          />
          <text
            x={p.x + W / 2}
            y={p.y + H / 2}
            text-anchor="middle"
            dominant-baseline="central"
            font-size={item.label.length > 6 ? 10 : 13}
            font-weight="600"
            class={STATE_TEXT[s]}>{item.label}</text
          >
          {#if item.marker}
            <text
              x={p.x + W - 6}
              y={p.y + 2}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="11"
              font-weight="700"
              stroke="white"
              stroke-width="3"
              paint-order="stroke"
              class="fill-slate-900"
              aria-hidden="true">{item.marker}</text
            >
          {/if}
        </g>
      {:else}
        <rect
          x={p.x}
          y={p.y}
          width={W}
          height={H}
          rx="5"
          stroke-dasharray="4 3"
          stroke-width="1.5"
          class="fill-none stroke-slate-300"
          aria-hidden="true"
        />
      {/if}
    {/each}

    {#each ends as end (end.text)}
      {#if end.show}
        <text
          x={vertical ? LABEL + W + 6 : end.x + W / 2}
          y={vertical ? end.y + H / 2 : end.y + H + 2}
          text-anchor={vertical ? 'start' : 'middle'}
          dominant-baseline={vertical ? 'central' : 'hanging'}
          font-size="11"
          font-weight="600"
          class="fill-slate-600"
          aria-hidden="true">{end.text}</text
        >
      {/if}
    {/each}
  </svg>
</ScrollFrame>
