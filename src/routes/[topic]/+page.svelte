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
    <a href={resolve('/')} class="text-teal-700 hover:underline">{copy.lessonChrome.backToHub}</a>
  </nav>

  <header class="mb-8">
    <h1 class="mb-2 text-4xl font-bold text-slate-900">{topic.title}</h1>
    <p class="text-lg text-slate-600">{topic.blurb}</p>
  </header>

  <ul class="grid gap-4 md:grid-cols-2">
    {#each lessons as lesson (lesson.slug)}
      <li>
        <a
          href={resolve(/** @type {'/'} */ (lessonPath(lesson)))}
          class="block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-500 hover:shadow-sm"
        >
          <div class="mb-2 flex items-baseline justify-between gap-3">
            <span class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{lesson.level}</span>
            <span class="text-xs text-emerald-700">{copy.status.live}</span>
          </div>
          <h2 class="mb-1 text-lg font-bold text-slate-900">{lesson.title}</h2>
          <p class="text-sm leading-relaxed text-slate-600">{lesson.intro}</p>
        </a>
      </li>
    {/each}
  </ul>
</section>
