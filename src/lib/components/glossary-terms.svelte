<script>
  import { resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { termsForLesson } from '$lib/glossary/index.js';

  /** @type {{ topic: string, slug: string }} */
  let { topic, slug } = $props();

  const g = t().glossary;
  const page = resolve(/** @type {'/'} */ ('/thuat-ngu/'));
  const terms = $derived(termsForLesson(topic, slug));
</script>

<!-- The terms this lesson teaches, each linking to its entry on the glossary page; a lesson that
     teaches none shows nothing. -->
{#if terms.length}
  <section class="glossary-terms mt-10 min-w-0" aria-labelledby="glossary-terms-title">
    <h2 id="glossary-terms-title" class="mb-3 text-lg font-bold text-slate-900">
      {g.lessonTitle}
    </h2>
    <ul class="space-y-1 leading-relaxed text-slate-700">
      {#each terms as e (e.id)}
        <li>
          <a
            href="{page}#{e.id}"
            lang={e.vi !== undefined ? 'en' : undefined}
            class="focus-ring rounded font-semibold text-teal-700 underline underline-offset-2"
            >{e.term}</a
          >:
          {#if e.vi !== undefined}{e.vi}{:else}<span lang="en">{e.en}</span>{/if}
        </li>
      {/each}
    </ul>
    <p class="mt-2 text-sm">
      <a href={page} class="focus-ring rounded text-teal-700 underline underline-offset-2"
        >{g.viewAll}</a
      >
    </p>
  </section>
{/if}
