<script>
  import { t } from '$lib/i18n/index.js';
  import ScrollFrame from './scroll-frame.svelte';
  import { layoutForest, treeNeighbor } from './tree-layout.js';
  import { STATE_FILL, STATE_TEXT, stateStroke } from './visual-state.js';

  /** @typedef {import('./tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('./tree-layout.js').PlacedNode} PlacedNode */

  /**
   * A binary or n-ary tree, or a forest of them, drawn as circles and edges from plain node
   * data (see `TreeNode` in tree-layout.js). Each node carries its own state, marker, note and
   * edge label. With `onselect` the nodes become buttons: arrows walk the tree (Up parent,
   * Down first child, Left/Right siblings) and Enter or Space picks.
   * @type {{
   *   roots: TreeNode[],
   *   ariaLabel: string,
   *   binary?: boolean,
   *   labelOf?: ((node: TreeNode, depth: number) => string) | null,
   *   onselect?: ((id: string | number) => void) | null,
   *   selected?: string | number | null,
   *   emptyText?: string,
   *   speed?: number,
   * }}
   */
  let {
    roots,
    ariaLabel,
    binary = false,
    labelOf = null,
    onselect = null,
    selected = null,
    emptyText,
    speed = 1,
  } = $props();

  const v = t().visuals;
  const COL = 44;
  const ROW = 64;
  const R = 17;
  const TOP = R + 10;

  const layout = $derived(layoutForest(roots, { binary }));
  const vbW = $derived(Math.max(1, layout.columns) * COL);
  const vbH = $derived(Math.max(1, layout.levels) * ROW);
  const fade = $derived(speed < 8 ? 'transition-colors' : '');
  const hasNotes = $derived(layout.nodes.some((p) => p.node.note));

  /** @param {string | number} id */
  const placed = (id) => /** @type {PlacedNode} */ (layout.byId.get(id));
  /** @param {PlacedNode} p */
  const cx = (p) => p.x * COL + COL / 2;
  /** @param {PlacedNode} p */
  const cy = (p) => p.depth * ROW + TOP;

  /** @param {PlacedNode} p */
  function nodeLabel(p) {
    if (labelOf) return labelOf(p.node, p.depth);
    const s = p.node.state ?? '';
    return v.treeNode(p.node.label, s ? v.states[s] : '', p.depth);
  }

  /** @type {string | number | null} */
  let focusId = $state(null);
  // The roving stop is the selected node, else the last focused one, else the first root.
  const tabStop = $derived(
    [focusId, selected, layout.roots[0]].find((id) => id !== null && layout.byId.has(id)) ?? null,
  );
  /** @type {SVGSVGElement | undefined} */
  let svg = $state();

  /** @param {KeyboardEvent} e @param {string | number} id */
  function onKeydown(e, id) {
    if (!onselect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect(id);
      return;
    }
    if (!e.key.startsWith('Arrow')) return;
    e.preventDefault();
    const next = treeNeighbor(layout, id, e.key);
    if (next === null) return;
    focusId = next;
    const i = layout.nodes.findIndex((p) => p.id === next);
    /** @type {SVGElement | null | undefined} */ (
      svg?.querySelector(`[data-node="${i}"]`)
    )?.focus();
  }
</script>

{#snippet circle(/** @type {PlacedNode} */ p)}
  {@const s = p.node.state ?? ''}
  {@const isSelected = selected !== null && p.id === selected}
  <circle
    cx={cx(p)}
    cy={cy(p)}
    r={R}
    stroke-width={isSelected ? 3.5 : s === '' ? 1.5 : 2.5}
    class="{STATE_FILL[s]} {isSelected ? 'stroke-teal-700' : stateStroke(s)} {fade}"
  />
  <text
    x={cx(p)}
    y={cy(p)}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={p.node.label.length > 3 ? 10 : 13}
    font-weight="600"
    class={STATE_TEXT[s]}>{p.node.label}</text
  >
  {#if p.node.marker}
    <text
      x={cx(p) + R - 3}
      y={cy(p) - R + 3}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      font-weight="700"
      stroke="white"
      stroke-width="3"
      stroke-linejoin="round"
      paint-order="stroke"
      class="fill-slate-900"
      aria-hidden="true">{p.node.marker}</text
    >
  {/if}
  {#if p.node.note}
    <text
      x={cx(p)}
      y={cy(p) + R + 9}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="10"
      stroke="white"
      stroke-width="3"
      paint-order="stroke"
      class="fill-slate-600"
      aria-hidden="true">{p.node.note}</text
    >
  {/if}
{/snippet}

{#if layout.nodes.length === 0}
  <p class="py-6 text-center text-sm text-slate-500">{emptyText ?? v.emptyTree}</p>
{:else}
  <ScrollFrame>
    <svg
      bind:this={svg}
      viewBox="0 0 {vbW} {vbH + (hasNotes ? 6 : 0)}"
      role={onselect ? 'group' : 'img'}
      aria-label={onselect ? `${ariaLabel} ${v.treeKeys}` : ariaLabel}
      class="mx-auto block h-auto"
      style="width: {vbW * 1.15}px; max-width: 100%; min-width: {Math.min(vbW * 0.85, 360)}px"
    >
      {#each layout.edges as e (e.to)}
        {@const a = placed(e.from)}
        {@const b = placed(e.to)}
        {@const onPath = (b.node.state ?? '') === 'path' && (a.node.state ?? '') === 'path'}
        <line
          x1={cx(a)}
          y1={cy(a)}
          x2={cx(b)}
          y2={cy(b)}
          class={onPath ? 'stroke-amber-500' : 'stroke-slate-400'}
          stroke-width={onPath ? 3 : 1.5}
          aria-hidden="true"
        />
        {#if e.label}
          <text
            x={(cx(a) + cx(b)) / 2}
            y={(cy(a) + cy(b)) / 2}
            text-anchor="middle"
            dominant-baseline="central"
            font-size="11"
            font-weight="600"
            stroke="white"
            stroke-width="4"
            paint-order="stroke"
            class="fill-slate-700"
            aria-hidden="true">{e.label}</text
          >
        {/if}
      {/each}
      {#each layout.nodes as p, i (p.id)}
        {#if onselect}
          <g
            data-node={i}
            role="button"
            tabindex={p.id === tabStop ? 0 : -1}
            aria-label={nodeLabel(p)}
            aria-pressed={p.id === selected}
            class="cursor-pointer outline-none [&:focus-visible>circle]:stroke-teal-700 [&:focus-visible>circle]:stroke-[4]"
            onclick={() => onselect(p.id)}
            onkeydown={(e) => onKeydown(e, p.id)}
            onfocus={() => (focusId = p.id)}
          >
            {@render circle(p)}
          </g>
        {:else}
          <g>
            <title>{nodeLabel(p)}</title>
            {@render circle(p)}
          </g>
        {/if}
      {/each}
    </svg>
  </ScrollFrame>
{/if}
