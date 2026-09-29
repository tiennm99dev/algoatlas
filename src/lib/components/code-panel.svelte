<script>
  import { t } from '$lib/i18n/index.js';

  /** @type {{lines: string[], active: number[]}} */
  let { lines, active } = $props();

  const title = t().lessonChrome.pseudocodeTitle;
  const headingId = $props.id();
</script>

<section
  aria-labelledby={headingId}
  class="overflow-hidden rounded-xl bg-slate-900 text-sm text-slate-300 print:bg-white print:text-slate-900"
>
  <h2
    id={headingId}
    class="border-b border-slate-700 px-4 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase"
  >
    {title}
  </h2>
  <!-- Long lines wrap under their own text rather than scrolling, so nothing needs a scroll focus stop. -->
  <ol class="py-2 font-mono">
    {#each lines as line, i (i)}
      {@const on = active.includes(i)}
      <li
        class="flex gap-3 px-4 py-0.5 break-words whitespace-pre-wrap transition-colors duration-75 {on
          ? 'bg-teal-500/25 text-white print:text-slate-900'
          : ''}"
        aria-current={on ? 'step' : undefined}
      >
        <span class="w-4 shrink-0 text-right text-slate-500 select-none" aria-hidden="true"
          >{i + 1}</span
        ><span class="min-w-0">{line}</span>
      </li>
    {/each}
  </ol>
</section>
