<script>
  import { resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { topicPath } from '$lib/lessons/registry.js';

  let { data } = $props();

  const copy = t();
  const stub = $derived(data.stub);
  const topic = $derived(stub && copy.topics[stub.topic]);
</script>

<svelte:head>
  <!-- Old lesson URLs redirect with a meta refresh, so the redirect works without any script. -->
  {#if data.redirect}
    <title>{copy.moved.title} — {copy.site.title}</title>
    <meta http-equiv="refresh" content="0; url={resolve(/** @type {'/'} */ (data.redirect))}" />
    <link rel="canonical" href={resolve(/** @type {'/'} */ (data.redirect))} />
  {:else if stub}
    <title>{stub.lesson.title} — {copy.site.title}</title>
    <meta name="description" content={copy.stub.metaDescription(stub.lesson.title)} />
  {/if}
  <meta name="robots" content="noindex" />
</svelte:head>

{#if data.redirect}
  <section class="mx-auto max-w-3xl px-4 py-16 text-center">
    <h1 class="mb-4 text-3xl font-bold text-slate-900">{copy.moved.title}</h1>
    <p class="mb-8 leading-relaxed text-slate-600">{copy.moved.body}</p>
    <a href={resolve(/** @type {'/'} */ (data.redirect))} class="btn-primary px-6 py-3 text-base"
      >{copy.moved.link} <span aria-hidden="true">→</span></a
    >
  </section>
{:else if stub && topic}
  <article class="mx-auto max-w-5xl px-4 py-8">
    <nav class="mb-4 text-sm">
      <a
        href={resolve(/** @type {'/'} */ (topicPath(stub.topic)))}
        class="focus-ring rounded text-teal-700 hover:underline"
        ><span aria-hidden="true">←</span> {copy.lessonChrome.backToTopic(topic.title)}</a
      >
    </nav>

    <header class="mb-8 max-w-3xl">
      <div class="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        <span class="text-slate-500">{topic.title} · {copy.stub.kinds[stub.lesson.kind]}</span>
        <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900"
          >{copy.hub.comingSoon}</span
        >
      </div>
      <h1 class="mt-1 mb-2 text-3xl font-bold text-slate-900">{stub.lesson.title}</h1>
      <p class="leading-relaxed text-slate-700">{copy.stub.notice}</p>
    </header>

    <div class="grid gap-8 md:grid-cols-2">
      <section>
        <h2 class="mb-3 text-lg font-bold text-slate-900">{copy.stub.keyIdeasTitle}</h2>
        <ul class="list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
          {#each stub.lesson.keyIdeas as idea, i (i)}
            <li>{idea}</li>
          {/each}
        </ul>
      </section>
      <section>
        <h2 class="mb-3 text-lg font-bold text-slate-900">{copy.stub.interactiveTitle}</h2>
        <p
          class="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 leading-relaxed text-slate-700"
        >
          {stub.lesson.interactiveIdea}
        </p>
      </section>
    </div>

    <nav
      aria-label={copy.lessonChrome.lessonNavLabel}
      class="mt-10 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2"
    >
      {#if stub.prev}
        <a
          href={resolve(/** @type {'/'} */ (stub.prev.path))}
          class="focus-ring rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-600"
        >
          <span class="block text-xs text-slate-500"
            ><span aria-hidden="true">←</span> {copy.lessonChrome.previous}</span
          >
          <span class="font-semibold text-slate-900">{stub.prev.title}</span>
        </a>
      {/if}
      {#if stub.next}
        <a
          href={resolve(/** @type {'/'} */ (stub.next.path))}
          class="focus-ring rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-600 sm:col-start-2 sm:text-right"
        >
          <span class="block text-xs text-slate-500"
            >{copy.lessonChrome.next} <span aria-hidden="true">→</span></span
          >
          <span class="font-semibold text-slate-900">{stub.next.title}</span>
        </a>
      {:else}
        <p class="text-sm text-slate-500 sm:col-start-2 sm:text-right">
          <a href={resolve('/')} class="focus-ring rounded text-teal-700 hover:underline"
            >{copy.lessonChrome.backToHub}</a
          >
        </p>
      {/if}
    </nav>
  </article>
{/if}
