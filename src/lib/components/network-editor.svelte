<script>
  import GraphCanvas from '$lib/components/graph-canvas.svelte';

  /** @typedef {import('$lib/components/graph-editor.js').GraphNode} GraphNode */
  /** @typedef {import('$lib/components/graph-editor.js').GraphEdge} GraphEdge */
  /** @typedef {import('$lib/components/graph-editor.js').Graph} Graph */

  /**
   * The input side of a flow lesson: the shared graph editor (capacities are the edge weights)
   * and one capacity field per edge. Every change hands the new network to `onchange`; a
   * capacity the lesson cannot take is refused through `onrefuse` and the field reverts.
   * @type {{
   *   nodes: GraphNode[],
   *   edges: GraphEdge[],
   *   maxNodes: number,
   *   maxCapacity: number,
   *   text: {
   *     graphAria: string,
   *     edgesTitle: string,
   *     noEdges: string,
   *     capacityAria: (name: string) => string,
   *   },
   *   edgeName: (e: GraphEdge) => string,
   *   onchange: (graph: Graph) => void,
   *   onrefuse: () => void,
   * }}
   */
  let {
    nodes = $bindable(),
    edges = $bindable(),
    maxNodes,
    maxCapacity,
    text,
    edgeName,
    onchange,
    onrefuse,
  } = $props();

  /** @param {number} k @param {Event & {currentTarget: HTMLInputElement}} e */
  function setCapacity(k, e) {
    const raw = e.currentTarget.value.trim();
    const c = Number(raw);
    if (raw === '' || !Number.isInteger(c) || c < 1 || c > maxCapacity) {
      e.currentTarget.value = String(edges[k].weight ?? 1);
      onrefuse();
      return;
    }
    edges = edges.map((x, i) => (i === k ? { ...x, weight: c } : x));
    onchange({ nodes, edges });
  }
</script>

<div class="flex flex-col gap-3">
  <GraphCanvas
    bind:nodes
    bind:edges
    ariaLabel={text.graphAria}
    directed
    weighted
    editable
    {maxNodes}
    {onchange}
  />
  <h3 class="text-xs text-slate-500">{text.edgesTitle}</h3>
  {#if edges.length}
    <ol class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
      {#each edges as e, k (k)}
        <li class="flex items-center justify-between gap-2 px-1 text-sm">
          <span class="font-mono">{edgeName(e)}</span>
          <input
            type="number"
            min="1"
            max={maxCapacity}
            step="1"
            class="field w-16"
            aria-label={text.capacityAria(edgeName(e))}
            value={e.weight ?? 1}
            onchange={(ev) => setCapacity(k, ev)}
          />
        </li>
      {/each}
    </ol>
  {:else}
    <p class="text-sm text-slate-600">{text.noEdges}</p>
  {/if}
</div>
