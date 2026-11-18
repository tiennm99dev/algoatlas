<script>
  import { tick } from 'svelte';
  import { resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { findLesson } from '$lib/curriculum/index.js';
  import { lessonPath } from '$lib/lessons/paths.js';
  import { allTerms, fold, letterOf } from '$lib/glossary/index.js';

  const copy = t();
  const g = copy.glossary;
  const terms = allTerms();
  const byId = new Map(terms.map((e) => [e.id, e]));

  /** The lesson an entry links to, with its title from the curriculum. */
  const entries = terms.map((e) => {
    const [topic, slug] = e.lesson.split('/');
    const plan = findLesson(slug);
    return {
      ...e,
      letter: letterOf(e.term),
      english: e.vi !== undefined,
      // Search reads the names only, never the definition.
      keys: [e.term, e.en ?? '', e.vi ?? '', ...(e.aka ?? [])].map(fold).join('\n'),
      lessonPath: lessonPath({ topic, slug }),
      lessonTitle: plan?.lesson.title ?? e.lesson,
      see: (e.see ?? []).flatMap((id) => {
        const s = byId.get(id);
        return s ? [{ id, term: s.term, english: s.vi !== undefined }] : [];
      }),
    };
  });

  /** One section per letter, in the order the sorted terms first reach it. */
  const letters = [...new Set(entries.map((e) => e.letter))];
  /** @param {string} letter */
  const letterId = (letter) => `chu-${letter === '0–9' ? 'so' : letter.toLowerCase()}`;

  let query = $state('');

  /**
   * Clears the search when it hides the entry a "Xem thêm" link or a hash points at, then
   * scrolls to that entry, which the browser could not do while it was hidden.
   * @param {string} id
   */
  function reveal(id) {
    if (!byId.has(id) || visible.has(id)) return;
    query = '';
    tick().then(() => document.getElementById(id)?.scrollIntoView());
  }
  const needle = $derived(fold(query.trim()));
  const visible = $derived(
    new Set(entries.filter((e) => e.keys.includes(needle)).map((e) => e.id)),
  );
  const shownIn = $derived(
    Object.fromEntries(
      letters.map((l) => [l, entries.filter((e) => e.letter === l && visible.has(e.id)).length]),
    ),
  );
</script>

<!-- A hash change made outside the page's own links can also land on an entry the search hides. -->
<svelte:window onhashchange={() => reveal(decodeURIComponent(location.hash.slice(1)))} />

<svelte:head>
  <title>{g.title} — {copy.site.title}</title>
  <meta name="description" content={g.lead} />
</svelte:head>

<section class="decor-column mx-auto max-w-3xl px-4 py-12">
  <nav class="mb-6 text-sm">
    <a
      href={resolve('/')}
      class="focus-ring rounded text-teal-700 underline-offset-2 hover:underline"
      ><span aria-hidden="true">←</span> {copy.lessonChrome.backToHub}</a
    >
  </nav>

  <header class="mb-6">
    <h1 class="mb-2 text-3xl font-semibold tracking-tight text-slate-900">{g.title}</h1>
    <p class="text-lg text-slate-600">{g.lead}</p>
  </header>

  {#if entries.length === 0}
    <p class="text-slate-600">{g.empty}</p>
  {:else}
    <div class="glossary-search mb-4">
      <label for="glossary-search" class="mb-1 block text-sm font-semibold text-slate-700"
        >{g.searchLabel}</label
      >
      <input
        id="glossary-search"
        type="search"
        bind:value={query}
        autocomplete="off"
        spellcheck="false"
        class="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
      />
      <p role="status" aria-live="polite" class="mt-2 text-sm text-slate-600">
        {g.found(visible.size)}
      </p>
    </div>

    <nav aria-label={g.jumpLabel} class="mb-8">
      <ul class="flex flex-wrap gap-1">
        {#each letters as letter (letter)}
          <li hidden={shownIn[letter] === 0}>
            <a
              href="#{letterId(letter)}"
              class="focus-ring inline-flex min-h-9 min-w-9 items-center justify-center rounded border border-slate-200 bg-white px-2 text-sm font-semibold text-teal-700 underline underline-offset-2 hover:border-teal-600"
              >{letter}</a
            >
          </li>
        {/each}
      </ul>
    </nav>

    {#each letters as letter (letter)}
      <section
        id={letterId(letter)}
        class="glossary-letter mb-8 scroll-mt-4"
        hidden={shownIn[letter] === 0}
        aria-labelledby="{letterId(letter)}-title"
      >
        <h2 id="{letterId(letter)}-title" class="mb-3 text-2xl font-bold text-slate-900">
          {letter}
          <span class="text-sm font-normal text-slate-500">· {g.count(shownIn[letter])}</span>
        </h2>
        <dl class="space-y-3">
          {#each entries.filter((e) => e.letter === letter) as e (e.id)}
            <div
              id={e.id}
              class="glossary-entry rounded-[var(--card-radius)] border border-slate-200 bg-white p-4"
              hidden={!visible.has(e.id)}
            >
              {#if e.english}
                <dt lang="en" class="text-lg font-bold text-slate-900">{e.term}</dt>
                <dd class="mb-1 text-sm text-teal-800">
                  <span class="font-semibold">{g.meaning}</span>
                  {e.vi}
                </dd>
              {:else}
                <dt class="text-lg font-bold text-slate-900">
                  {e.term}
                  <span lang="en" class="ml-1 text-sm font-normal text-slate-500">{e.en}</span>
                </dt>
              {/if}
              <dd class="leading-relaxed text-slate-700">{e.def}</dd>
              <dd class="mt-2 text-sm text-slate-600">
                {g.learnedIn}
                <a
                  href={resolve(/** @type {'/'} */ (e.lessonPath))}
                  class="focus-ring rounded text-teal-700 underline underline-offset-2"
                  >{e.lessonTitle}</a
                >
              </dd>
              {#if e.see.length}
                <dd class="mt-1 text-sm text-slate-600">
                  {g.seeAlso}
                  {#each e.see as s, i (s.id)}{#if i > 0},
                    {/if}<a
                      href="#{s.id}"
                      onclick={() => reveal(s.id)}
                      lang={s.english ? 'en' : undefined}
                      class="focus-ring rounded text-teal-700 underline underline-offset-2"
                      >{s.term}</a
                    >{/each}
                </dd>
              {/if}
            </div>
          {/each}
        </dl>
      </section>
    {/each}
  {/if}
</section>

<style>
  /* An opened anchor gets a left bar as well as a tint, so the highlight does not rely on colour,
     and stops below the top edge instead of under it. */
  .glossary-entry {
    scroll-margin-top: 1rem;
  }
  .glossary-entry:target {
    border-left: 4px solid var(--color-teal-700);
    background: var(--color-teal-50);
  }
</style>
