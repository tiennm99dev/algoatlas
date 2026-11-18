<script>
  import { t } from '$lib/i18n/index.js';
  import { resolve } from '$app/paths';
  import { levels } from '$lib/curriculum/index.js';
  import { lessonPath, topicPath } from '$lib/lessons/paths.js';

  let { data } = $props();

  const copy = t();
  const first = $derived(data.lessons[0]);
  const sections = $derived(
    levels.map((l) => ({
      ...l,
      topics: l.chapters.map((c) => ({
        ...c,
        written: data.lessons.filter((lesson) => lesson.topic === c.slug),
      })),
    })),
  );
</script>

<svelte:head>
  <title>{copy.site.title} — {copy.site.tagline}</title>
  <meta name="description" content={copy.site.description} />
</svelte:head>

<section class="decor-column mx-auto max-w-5xl px-4 py-12 text-center">
  <div class="decor-spot mx-auto mb-4 size-24" aria-hidden="true"></div>
  <h1 class="mb-4 text-3xl font-semibold tracking-tight text-slate-900">{copy.site.tagline}</h1>
  <p class="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">{copy.site.description}</p>
  <a
    href={resolve(/** @type {'/'} */ (lessonPath(first)))}
    class="btn-primary mt-8 px-6 py-3 text-base"
    >{copy.hub.startCta(copy.topics[first.topic].title)} <span aria-hidden="true">→</span></a
  >
</section>

<section class="decor-column mx-auto max-w-5xl px-4 pb-12">
  <h2 class="mb-6 text-center text-2xl font-bold text-slate-900">{copy.hub.howTitle}</h2>
  <ol class="grid gap-6 md:grid-cols-3">
    {#each copy.hub.how as step, i (i)}
      <li class="rounded-[var(--card-radius)] border border-teal-200 bg-teal-50 p-5 text-teal-900">
        <div class="mb-2 text-sm font-semibold text-teal-800">{i + 1}</div>
        <h3 class="mb-1 text-lg font-bold text-teal-800">{step.title}</h3>
        <p class="text-sm leading-relaxed">{step.body}</p>
      </li>
    {/each}
  </ol>
</section>

<section class="decor-column mx-auto max-w-5xl px-4 pb-12" aria-labelledby="topics-title">
  <h2 id="topics-title" class="mb-6 text-center text-2xl font-bold text-slate-900">
    {copy.hub.topicsTitle}
  </h2>
  {#each sections as section (section.level)}
    <section id="level-{section.level}" class="mb-12 scroll-mt-4 last:mb-0">
      <h3 class="mb-4 text-xl font-bold text-slate-900">
        <span class="text-slate-500">{copy.hub.levelLabel(section.level)} ·</span>
        {section.title}
      </h3>
      <ul class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {#each section.topics as topic (topic.slug)}
          <li
            class={[
              'flex flex-col rounded-[var(--card-radius)] border bg-white p-3 transition hover:border-teal-600 hover:shadow-sm',
              topic.written.length ? 'border-slate-200' : 'border-dashed border-slate-300',
            ]}
          >
            <a
              href={resolve(/** @type {'/'} */ (topicPath(topic.slug)))}
              class="group focus-ring mb-2 rounded"
            >
              <h4 class="text-lg font-bold text-slate-900 group-hover:text-teal-700">
                {topic.title}
              </h4>
              <span class="text-xs text-slate-500"
                >{copy.hub.lessonCount(topic.written.length, topic.lessons.length)}</span
              >
            </a>
            <p class="flex-1 text-sm leading-relaxed text-slate-500">{topic.blurb}</p>
            {#if topic.written.length}
              <ul class="mt-4 space-y-1 text-sm">
                {#each topic.written as lesson (lesson.slug)}
                  <li>
                    <a
                      href={resolve(/** @type {'/'} */ (lessonPath(lesson)))}
                      class="focus-ring rounded font-medium text-teal-700 hover:underline"
                      ><span aria-hidden="true">→</span> {lesson.title}</a
                    ><span class="ml-1 text-xs text-slate-500">· {lesson.level}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</section>

<section class="decor-column mx-auto max-w-5xl px-4 pb-20">
  <a
    href={resolve(/** @type {'/'} */ ('/thuat-ngu/'))}
    class="focus-ring block rounded-[var(--card-radius)] border border-teal-200 bg-teal-50 p-5 text-teal-900 hover:border-teal-600"
  >
    <h2 class="mb-1 text-xl font-bold text-teal-800 underline underline-offset-4">
      {copy.glossary.title}
    </h2>
    <p class="text-sm leading-relaxed">{copy.glossary.homeBody}</p>
  </a>
</section>
