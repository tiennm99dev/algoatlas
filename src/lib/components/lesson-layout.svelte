<script>
  import { t } from '$lib/i18n/index.js';
  import { resolve } from '$app/paths';
  import { lessonPath, lessons, topicPath } from '$lib/lessons/registry.js';

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
  // Previous and next follow the global registry order, so the lessons form one path.
  const at = $derived(lessons.findIndex((l) => l.slug === lesson.slug));
  const prev = $derived(lessons[at - 1]);
  const next = $derived(lessons[at + 1]);
</script>

<svelte:head>
  <title>{lesson.title} — {copy.site.title}</title>
  <meta name="description" content={lesson.summary ?? lesson.intro} />
</svelte:head>

<article class="mx-auto max-w-5xl px-4 py-8">
  <nav class="mb-4 text-sm">
    <a
      href={resolve(/** @type {'/'} */ (topicPath(lesson.topic)))}
      class="focus-ring rounded text-teal-700 hover:underline"
      ><span aria-hidden="true">←</span> {copy.lessonChrome.backToTopic(topic.title)}</a
    >
  </nav>

  <header class="mb-6 max-w-3xl">
    <div class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
      {topic.title} · {lesson.level}
    </div>
    <h1 class="mt-1 mb-2 text-3xl font-bold text-slate-900">{lesson.title}</h1>
    <p class="leading-relaxed text-slate-700">{lesson.intro}</p>
    <p class="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
      <strong class="font-semibold">{copy.lessonChrome.tryIt}</strong>
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
      <p class="mb-3 text-xs text-slate-500">{copy.lessonChrome.complexityNote}</p>
      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full bg-white text-sm">
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
                <td class="px-3 py-2 font-mono font-semibold whitespace-nowrap text-slate-900"
                  >{big}</td
                >
                <td class="px-3 py-2 text-slate-600">{why}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <nav
    aria-label={copy.lessonChrome.lessonNavLabel}
    class="mt-10 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2"
  >
    {#if prev}
      <a
        href={resolve(/** @type {'/'} */ (lessonPath(prev)))}
        class="focus-ring rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-600"
      >
        <span class="block text-xs text-slate-500"
          ><span aria-hidden="true">←</span> {copy.lessonChrome.previous}</span
        >
        <span class="font-semibold text-slate-900">{prev.title}</span>
      </a>
    {/if}
    {#if next}
      <a
        href={resolve(/** @type {'/'} */ (lessonPath(next)))}
        class="focus-ring rounded-xl border border-teal-200 bg-teal-50 p-4 hover:border-teal-600 sm:col-start-2 sm:text-right"
      >
        <span class="block text-xs text-teal-800"
          >{copy.lessonChrome.next} <span aria-hidden="true">→</span></span
        >
        <span class="font-semibold text-slate-900">{next.title}</span>
        <span class="mt-1 block text-sm text-slate-600">{lesson.nextTeaser}</span>
      </a>
    {:else}
      <p class="text-sm text-slate-500 sm:col-start-2 sm:text-right">
        {lesson.nextTeaser}
        <a href={resolve('/')} class="focus-ring rounded text-teal-700 hover:underline"
          >{copy.lessonChrome.backToHub}</a
        >
      </p>
    {/if}
  </nav>
</article>
