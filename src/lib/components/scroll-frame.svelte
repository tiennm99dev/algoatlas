<script>
  import { t } from '$lib/i18n/index.js';

  /**
   * Horizontal scroller for a drawing that keeps a readable minimum width. It joins the tab
   * order only while its content overflows, because a scrollable region must be reachable by
   * keyboard and a non-scrolling one should not cost a tab stop.
   * @type {{ label?: string, children: import('svelte').Snippet }}
   */
  let { label, children } = $props();

  /** @type {HTMLElement | undefined} */
  let el = $state();
  let overflowing = $state(false);

  $effect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const target = el;
    const update = () => (overflowing = target.scrollWidth > target.clientWidth + 1);
    const ro = new ResizeObserver(update);
    ro.observe(target);
    if (target.firstElementChild) ro.observe(target.firstElementChild);
    update();
    return () => ro.disconnect();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={el}
  class="focus-ring overflow-x-auto rounded"
  tabindex={overflowing ? 0 : undefined}
  role="group"
  aria-label={label ?? t().visuals.scroller}
>
  {@render children()}
</div>
