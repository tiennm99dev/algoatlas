<script>
  import { flushSync } from 'svelte';
  import { resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { findLesson } from '$lib/curriculum/index.js';
  import { lessonPath } from '$lib/lessons/paths.js';
  import { allTerms, fold, letterOf } from '$lib/glossary/index.js';

  /*
   * The entry list carries almost no classes: the style block below styles it from the `gl`
   * class on each letter's list, so the prerendered page stays small.
   */
  const copy = t();
  const g = copy.glossary;
  const terms = allTerms();
  const byId = new Map(terms.map((e) => [e.id, e]));

  /** The lesson an entry links to, with its title from the curriculum. */
  const entries = terms.map((e) => {
    const [topic, slug] = e.lesson.split('/');
    const plan = findLesson(slug);
    const counterpart = e.vi ?? e.en ?? '';
    return {
      ...e,
      letter: letterOf(e.term),
      english: e.vi !== undefined,
      // The other-language name, shown only when it says something the term does not.
      counterpart: fold(counterpart) === fold(e.term) ? '' : counterpart,
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
  const needle = $derived(fold(query.trim()));
  const visible = $derived(
    new Set(entries.filter((e) => e.keys.includes(needle)).map((e) => e.id)),
  );
  const shownIn = $derived(
    Object.fromEntries(
      letters.map((l) => [l, entries.filter((e) => e.letter === l && visible.has(e.id)).length]),
    ),
  );

  /**
   * Clears the search before an in-page link is followed, so the letter or term it points at
   * is on the page when the browser scrolls to it.
   */
  function showAll() {
    if (query) flushSync(() => (query = ''));
  }

  /** A hash change made outside the page's own links can also land on an entry the search hides. */
  function onHashChange() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!query || !byId.has(id) || visible.has(id)) return;
    showAll();
    document.getElementById(id)?.scrollIntoView();
  }
</script>

<svelte:window onhashchange={onHashChange} />

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
              onclick={showAll}
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
        <dl class="gl">
          {#each entries.filter((e) => e.letter === letter) as e (e.id)}
            <div id={e.id} hidden={!visible.has(e.id)}>
              {#if e.english}
                <dt lang="en">
                  {e.term}
                  {#if e.counterpart}<span lang="vi">({e.counterpart})</span>{/if}
                </dt>
              {:else}
                <dt>
                  {e.term}
                  {#if e.counterpart}<span lang="en">({e.counterpart})</span>{/if}
                </dt>
              {/if}
              <dd>{e.def}</dd>
              {#if e.aka?.length}
                <dd>{g.aka} {e.aka.join(', ')}</dd>
              {/if}
              <dd class="in">
                <span>{g.learnedIn}</span>
                <a href={resolve(/** @type {'/'} */ (e.lessonPath))}>{e.lessonTitle}</a>
              </dd>
              {#if e.see.length}
                <dd class="see">
                  <span>{g.seeAlso}</span>
                  {#each e.see as s (s.id)}
                    <a href="#{s.id}" onclick={showAll} lang={s.english ? 'en' : undefined}
                      >{s.term}</a
                    >
                  {/each}
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
  /*
   * One rule set per element kind of the entry list: a compact card per entry, the teal link
   * with its focus ring, and the `:target` highlight, a left bar as well as a tint, so it does
   * not rely on colour.
   */
  .gl {
    display: grid;
    gap: calc(var(--spacing) * 3);
  }
  .gl > :global(div) {
    scroll-margin-top: calc(var(--spacing) * 4);
    border: 1px solid var(--color-slate-200);
    border-radius: var(--card-radius);
    background-color: var(--color-white);
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 4);
  }
  .gl > :global(div:target) {
    border-left-width: 4px;
    border-left-color: var(--color-teal-700);
    background-color: var(--color-teal-50);
  }
  .gl :global(dt) {
    font-size: var(--text-lg);
    line-height: var(--text-lg--line-height);
    font-weight: 700;
    color: var(--color-slate-900);
  }
  .gl :global(dt span) {
    margin-left: calc(var(--spacing) * 1);
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--color-slate-600);
  }
  .gl :global(dd) {
    margin-top: calc(var(--spacing) * 1);
    font-size: var(--text-sm);
    color: var(--color-slate-600);
  }
  .gl :global(dt + dd) {
    font-size: var(--text-base);
    line-height: 1.625;
    color: var(--color-slate-700);
  }
  .gl :global(dd.in) {
    display: flex;
    align-items: center;
    column-gap: calc(var(--spacing) * 2);
  }
  .gl :global(dd.in span) {
    flex-shrink: 0;
  }
  .gl :global(dd.see) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: calc(var(--spacing) * 3);
    margin-top: 0;
  }
  .gl :global(a) {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    min-height: calc(var(--spacing) * 8);
    border-radius: 0.25rem;
    color: var(--color-teal-700);
    text-decoration-line: underline;
    text-underline-offset: 2px;
  }
  .gl :global(a:hover) {
    color: var(--color-teal-900);
  }
  /* The site's `focus-ring` utility. */
  .gl :global(a:focus-visible) {
    outline: 2px solid var(--color-teal-700);
    outline-offset: 2px;
  }
</style>
