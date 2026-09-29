<script>
  import { t } from '$lib/i18n/index.js';
  import { resolve } from '$app/paths';
  import { topicPath } from '$lib/lessons/registry.js';

  /**
   * @type {{
   *   lesson: import('$lib/lessons/registry.js').LessonCopy,
   *   children: import('svelte').Snippet,
   * }}
   */
  let { lesson, children } = $props();

  const copy = t();
  const topic = $derived(copy.topics[lesson.topic]);
  const complexityHead = $derived(lesson.complexityHead ?? copy.lessonChrome.complexityHead);
</script>

<svelte:head>
  <title>{lesson.title} — {copy.site.title}</title>
  <meta name="description" content={lesson.intro} />
</svelte:head>

<article class="mx-auto max-w-5xl px-4 py-8">
  <nav class="mb-4 text-sm">
    <a
      href={resolve(/** @type {'/'} */ (topicPath(lesson.topic)))}
      class="focus-ring rounded text-teal-700 hover:underline"
      ><span aria-hidden="true">←</span> {copy.lessonChrome.backToTopic}</a
    >
  </nav>

  <header class="mb-6 max-w-3xl">
    <div class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
      {topic.title} · {lesson.level}
    </div>
    <h1 class="mt-1 mb-2 text-3xl font-bold text-slate-900">{lesson.title}</h1>
    <p class="leading-relaxed text-slate-700">{lesson.intro}</p>
    <p class="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
      {lesson.instruction}
    </p>
  </header>

  <!-- Clicking anywhere in the visualizer focuses this wrapper, so the Space shortcut
       works here without stealing page scrolling from the text below. -->
  <div data-player-scope tabindex="-1" class="outline-none">
    {@render children()}
  </div>

  <div class="mt-10 grid gap-8 md:grid-cols-2">
    <section>
      <h2 class="mb-3 text-lg font-bold text-slate-900">{copy.lessonChrome.takeawaysTitle}</h2>
      <ul class="list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
        {#each lesson.takeaways as item, i (i)}
          <li>{item}</li>
        {/each}
      </ul>
    </section>
    <section>
      <h2 class="mb-3 text-lg font-bold text-slate-900">{copy.lessonChrome.complexityTitle}</h2>
      <table class="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
        <thead class="bg-slate-100 text-left text-slate-600">
          <tr>
            {#each complexityHead as h, i (i)}
              <th class="px-3 py-2 font-semibold">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each lesson.complexity as [kase, big, why], i (i)}
            <tr class="border-t border-slate-200">
              <td class="px-3 py-2 text-slate-700">{kase}</td>
              <td class="px-3 py-2 font-mono font-semibold text-slate-900">{big}</td>
              <td class="px-3 py-2 text-slate-600">{why}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  </div>

  <footer class="mt-10 border-t border-slate-200 pt-4 text-sm text-slate-500">
    {lesson.nextTeaser}
  </footer>
</article>
