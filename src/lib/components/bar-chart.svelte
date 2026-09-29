<script>
  import { flip } from 'svelte/animate';
  import { prefersReducedMotion } from 'svelte/motion';

  /**
   * A row of value bars, with an optional second row of slots beneath it (for example
   * merge buffers). Every height is a share of the largest value across both rows.
   * @type {{
   *   items: {id: number, value: number}[],
   *   stateOf: (i: number) => string,
   *   markerOf?: (i: number) => string,
   *   dimmed?: (i: number) => boolean,
   *   aux?: ({id: number, value: number} | null)[] | null,
   *   auxStateOf?: (i: number) => string,
   *   auxMarkerOf?: ((i: number) => string) | null,
   *   ariaLabel: string,
   *   auxLabel?: string,
   *   speed: number,
   * }}
   */
  let {
    items,
    stateOf,
    markerOf = () => '',
    dimmed = () => false,
    aux = null,
    auxStateOf = () => 'bg-slate-400',
    auxMarkerOf = null,
    ariaLabel,
    auxLabel = '',
    speed,
  } = $props();

  const maxValue = $derived(
    Math.max(1, ...items.map((it) => it.value), ...(aux ?? []).map((it) => it?.value ?? 0)),
  );
  const labelled = $derived(items.length <= 20);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
</script>

<div class="flex h-72 gap-1" role="img" aria-label={ariaLabel}>
  {#each items as item, i (item.id)}
    <!-- Label, bar area, and marker are separate rows so the bar height is a true share of its own area. Only the bar dims, so the value label keeps its contrast. -->
    <div
      class="flex min-w-0 flex-1 flex-col"
      animate:flip={{ duration: prefersReducedMotion.current ? 0 : 200 }}
    >
      <span class="h-5 shrink-0 text-center text-xs text-slate-600 tabular-nums"
        >{labelled ? item.value : ''}</span
      >
      <div class="relative flex-1">
        <div
          class="absolute inset-x-0 bottom-0 rounded-t {stateOf(i)} {fade} {dimmed(i)
            ? 'opacity-40'
            : ''}"
          style="height: {(item.value / maxValue) * 100}%"
        ></div>
      </div>
      <span class="h-5 shrink-0 text-center text-sm leading-5 font-bold text-slate-700"
        >{labelled ? markerOf(i) : ''}</span
      >
    </div>
  {/each}
</div>

{#if aux}
  <div class="mt-2 flex {auxMarkerOf ? 'h-28' : 'h-24'} gap-1" role="img" aria-label={auxLabel}>
    {#each aux as slot, i (i)}
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="h-5 shrink-0 text-center text-xs text-slate-600 tabular-nums"
          >{labelled && slot ? slot.value : ''}</span
        >
        <div class="relative flex-1">
          {#if slot}
            <div
              class="absolute inset-x-0 bottom-0 rounded-t {auxStateOf(i)} {fade}"
              style="height: {(slot.value / maxValue) * 100}%"
            ></div>
          {/if}
        </div>
        {#if auxMarkerOf}
          <span class="h-5 shrink-0 text-center text-sm leading-5 font-bold text-slate-700"
            >{labelled && slot ? auxMarkerOf(i) : ''}</span
          >
        {/if}
      </div>
    {/each}
  </div>
{/if}
