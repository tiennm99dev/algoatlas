<script>
  import { t } from '$lib/i18n/index.js';
  import ArrayStrip from './array-strip.svelte';
  import TreeView from './tree-view.svelte';
  import { parentForest } from './tree-layout.js';

  /** @typedef {import('./visual-state.js').VisualState} VisualState */

  /**
   * A disjoint-set forest from its parent array: each root (`parent[i] === i`) heads one set's
   * tree, and the parent array itself is drawn beneath so path compression and union by rank
   * show up in both. `noteOf` captions a node (rank or size). With `onselect` both drawings
   * pick an element.
   * @type {{
   *   parent: number[],
   *   ariaLabel?: string,
   *   stateOf?: (i: number) => VisualState,
   *   markerOf?: (i: number) => string,
   *   noteOf?: (i: number) => string,
   *   showParentRow?: boolean,
   *   onselect?: ((i: number) => void) | null,
   *   selected?: number,
   *   speed?: number,
   * }}
   */
  let {
    parent,
    ariaLabel,
    stateOf = () => '',
    markerOf = () => '',
    noteOf = () => '',
    showParentRow = true,
    onselect = null,
    selected = -1,
    speed = 1,
  } = $props();

  const v = t().visuals;
  const forest = $derived(
    parentForest(parent, (i) => ({ state: stateOf(i), marker: markerOf(i), note: noteOf(i) })),
  );
  const summary = $derived(ariaLabel ?? v.ufSummary(forest.length, parent.length));

  /** @param {number} i */
  function label(i) {
    const s = stateOf(i);
    return `${v.ufParent(i, parent[i])}${s ? `, ${v.states[s]}` : ''}`;
  }
</script>

<div class="flex flex-col gap-3">
  <TreeView
    roots={forest}
    ariaLabel={summary}
    labelOf={(node) => label(Number(node.id))}
    onselect={onselect ? (id) => onselect(Number(id)) : null}
    selected={selected >= 0 ? selected : null}
    {speed}
  />
  {#if showParentRow}
    <div class="flex items-start gap-2">
      <span class="pt-5 text-xs text-slate-500" aria-hidden="true">{v.parentRow}</span>
      <div class="min-w-0 flex-1">
        <ArrayStrip
          values={parent}
          ariaLabel={summary}
          stateOf={(i) => stateOf(i)}
          labelOf={label}
          {onselect}
          {selected}
          {speed}
        />
      </div>
    </div>
  {/if}
</div>
