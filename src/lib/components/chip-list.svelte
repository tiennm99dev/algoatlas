<script>
  /**
   * A titled card listing queue or stack contents as chips. Duplicates are legal, so chips
   * are keyed by position.
   * @type {{
   *   title: string,
   *   items: {label: string, hot?: boolean}[],
   *   emptyText: string,
   *   limit?: number,
   * }}
   */
  let { title, items, emptyText, limit = 18 } = $props();
</script>

<div class="rounded-xl border border-slate-200 bg-white p-3">
  <h2 class="mb-2 text-xs text-slate-500">{title}</h2>
  <ol class="flex flex-wrap gap-1 font-mono text-xs">
    {#each items.slice(0, limit) as item, i (i)}
      <li
        class="rounded px-1.5 py-0.5 {item.hot
          ? 'bg-sky-700 text-white'
          : 'bg-sky-100 text-sky-900'}"
      >
        {item.label}
      </li>
    {:else}
      <li class="text-slate-500">{emptyText}</li>
    {/each}
    {#if items.length > limit}<li class="text-slate-500">
        +{items.length - limit}
      </li>{/if}
  </ol>
</div>
