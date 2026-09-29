<script>
  import { t } from '$lib/i18n/index.js';
  import { resolve } from '$app/paths';
  import { lessonPath, lessonsByTopic, topicPath } from '$lib/lessons/registry.js';

  const copy = t();
  const topics = copy.topicOrder.map((key) => ({
    key,
    ...copy.topics[key],
    lessons: lessonsByTopic(key),
  }));
</script>

<svelte:head>
  <title>{copy.site.title} — {copy.site.tagline}</title>
  <meta name="description" content={copy.site.description} />
</svelte:head>

<section class="mx-auto max-w-5xl px-4 py-16 text-center">
  <h1 class="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl">{copy.site.tagline}</h1>
  <p class="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">{copy.site.description}</p>
  <a
    href={resolve(/** @type {'/'} */ (lessonPath(topics[0].lessons[0])))}
    class="btn-primary mt-8 px-6 py-3 text-base"
    >{copy.hub.startCta} <span aria-hidden="true">→</span></a
  >
</section>

<section class="mx-auto max-w-5xl px-4 pb-12">
  <h2 class="mb-6 text-center text-2xl font-bold text-slate-900">{copy.hub.howTitle}</h2>
  <ol class="grid gap-6 md:grid-cols-3">
    {#each copy.hub.how as step, i (i)}
      <li class="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-teal-900">
        <div class="mb-2 text-sm font-semibold text-teal-800">{i + 1}</div>
        <h3 class="mb-1 text-lg font-bold text-teal-800">{step.title}</h3>
        <p class="text-sm leading-relaxed">{step.body}</p>
      </li>
    {/each}
  </ol>
</section>

<section class="mx-auto max-w-5xl px-4 pb-20">
  <h2 class="mb-6 text-center text-2xl font-bold text-slate-900">{copy.hub.topicsTitle}</h2>
  <ul class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {#each topics as topic (topic.key)}
      <li
        class="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-sm"
      >
        <a
          href={resolve(/** @type {'/'} */ (topicPath(topic.key)))}
          class="group focus-ring mb-2 flex items-center justify-between rounded"
        >
          <h3 class="text-lg font-bold text-slate-900 group-hover:text-teal-700">{topic.title}</h3>
          <span class="text-xs text-slate-500">{copy.hub.lessonCount(topic.lessons.length)}</span>
        </a>
        <p class="mb-4 flex-1 text-sm leading-relaxed text-slate-500">{topic.blurb}</p>
        <ul class="space-y-1 text-sm">
          {#each topic.lessons as lesson (lesson.slug)}
            <li>
              <a
                href={resolve(/** @type {'/'} */ (lessonPath(lesson)))}
                class="focus-ring rounded font-medium text-teal-700 hover:underline"
                ><span aria-hidden="true">→</span> {lesson.title}</a
              ><span class="ml-1 text-xs text-slate-500">· {lesson.level}</span>
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</section>
