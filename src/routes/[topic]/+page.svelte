<script>
  import { resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { lessonPath, lessonsByTopic } from '$lib/lessons/registry.js';

  let { data } = $props();

  const copy = t();
  const topic = $derived(copy.topics[data.topic]);
  const lessons = $derived(lessonsByTopic(data.topic));
</script>

<svelte:head>
  <title>{topic.title} — {copy.site.title}</title>
  <meta name="description" content={topic.blurb} />
</svelte:head>

<section class="mx-auto max-w-5xl px-4 py-12">
  <nav class="mb-6 text-sm">
    <a href={resolve('/')} class="focus-ring rounded text-teal-700 hover:underline"
      ><span aria-hidden="true">←</span> {copy.lessonChrome.backToHub}</a
    >
  </nav>

  <header class="mb-8">
    <h1 class="mb-2 text-4xl font-bold text-slate-900">{topic.title}</h1>
    <p class="text-lg text-slate-600">{topic.blurb}</p>
  </header>

  <ul class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each lessons as lesson (lesson.slug)}
      <!-- The title link stretches over the whole card, so the link is named by the title alone. -->
      <li
        class="relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600 hover:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700"
      >
        <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {lesson.level}
        </div>
        <h2 class="mb-1 text-lg font-bold text-slate-900">
          <a
            href={resolve(/** @type {'/'} */ (lessonPath(lesson)))}
            class="outline-none after:absolute after:inset-0 after:rounded-2xl">{lesson.title}</a
          >
        </h2>
        <p class="text-sm leading-relaxed text-slate-600">{lesson.intro}</p>
      </li>
    {/each}
  </ul>
</section>
