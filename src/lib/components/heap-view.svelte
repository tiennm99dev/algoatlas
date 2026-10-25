<script>
  import { t } from '$lib/i18n/index.js';
  import ArrayStrip from './array-strip.svelte';
  import TreeView from './tree-view.svelte';
  import { heapForest } from './tree-layout.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */

  /**
   * An array heap drawn twice: as the implicit binary tree (slot i's children are 2i + 1 and
   * 2i + 2) and as the array itself, so the learner sees that they are the same data. Slots at
   * or after `size` are outside the heap, as in heapsort's sorted tail, and are drawn sorted.
   * With `onselect` both drawings pick a slot index.
   * @type {{
   *   values: number[],
   *   ariaLabel?: string,
   *   size?: number,
   *   stateOf?: (i: number) => VisualState,
   *   markerOf?: (i: number) => string,
   *   onselect?: ((i: number) => void) | null,
   *   selected?: number,
   *   speed?: number,
   * }}
   */
  let {
    values,
    ariaLabel,
    size,
    stateOf = () => '',
    markerOf = () => '',
    onselect = null,
    selected = -1,
    speed = 1,
  } = $props();

  const v = t().visuals;
  const heapSize = $derived(Math.min(size ?? values.length, values.length));
  /** @param {number} i @returns {VisualState} */
  const slotState = (i) => stateOf(i) || (i >= heapSize ? 'sorted' : '');

  const forest = $derived(
    heapForest(values, heapSize, (i) => ({
      state: slotState(i),
      marker: markerOf(i),
      note: `[${i}]`,
    })),
  );
  const summary = $derived(ariaLabel ?? v.heapSummary(values, heapSize));
</script>

<div class="flex flex-col gap-3">
  <TreeView
    roots={forest}
    binary
    ariaLabel={summary}
    labelOf={(node) => {
      const i = Number(node.id);
      const s = slotState(i);
      return `${v.heapSlot(i, node.label)}${s ? `, ${v.states[s]}` : ''}`;
    }}
    onselect={onselect ? (id) => onselect(Number(id)) : null}
    selected={selected >= 0 && selected < heapSize ? selected : null}
    emptyText={v.heapSummary(values, 0)}
    {speed}
  />
  <ArrayStrip
    {values}
    ariaLabel={summary}
    stateOf={slotState}
    {markerOf}
    labelOf={(i) => {
      const s = slotState(i);
      return `${v.heapSlot(i, String(values[i]))}${s ? `, ${i >= heapSize && !stateOf(i) ? v.heapSorted : v.states[s]}` : ''}`;
    }}
    dimmed={(i) => i >= heapSize}
    {onselect}
    {selected}
    {speed}
  />
</div>
