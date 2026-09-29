<script>
  import '../app.css';
  import { asset, resolve } from '$app/paths';
  import { page } from '$app/state';
  import { t } from '$lib/i18n/index.js';
  import { topicPath } from '$lib/lessons/registry.js';

  let { children } = $props();
  const copy = t();

  /** "page" only on the hub itself; lessons inside the topic are "true". @param {string} href */
  function current(href) {
    const path = page.url.pathname;
    if (path === href) return 'page';
    return path.startsWith(href) ? 'true' : undefined;
  }
</script>

<div class="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
  <a
    href="#main"
    class="btn-primary sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
    >{copy.lessonChrome.skipLink}</a
  >
  <header class="border-b border-slate-200 bg-white">
    <div
      class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4"
    >
      <a
        href={resolve('/')}
        class="focus-ring flex items-center gap-2 rounded text-xl font-bold tracking-tight text-teal-700"
      >
        <img src={asset('/favicon.svg')} alt="" class="size-7" />
        {copy.site.title}
      </a>
      <nav aria-label={copy.lessonChrome.navLabel}>
        <ul class="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
          {#each copy.topicOrder as key (key)}
            {@const href = resolve(/** @type {'/'} */ (topicPath(key)))}
            <li>
              <a
                {href}
                class="focus-ring rounded hover:text-teal-700 aria-[current]:font-semibold aria-[current]:text-teal-700 aria-[current]:underline aria-[current]:decoration-2 aria-[current]:underline-offset-4"
                aria-current={current(href)}>{copy.topics[key].title}</a
              >
            </li>
          {/each}
        </ul>
      </nav>
    </div>
  </header>

  <main id="main" tabindex="-1" class="flex-1 outline-none">
    {@render children()}
  </main>

  <footer class="border-t border-slate-200 bg-white">
    <div
      class="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-6 text-sm text-slate-500"
    >
      <span
        >© 2026 <a
          href="https://github.com/tiennm99"
          class="focus-ring rounded text-teal-700 hover:underline">tiennm99</a
        ></span
      >
      <span aria-hidden="true">·</span>
      <a
        href="https://github.com/tiennm99dev/algoatlas/blob/main/LICENSE"
        class="focus-ring rounded text-teal-700 hover:underline">Apache-2.0</a
      >
      <span aria-hidden="true">·</span>
      <a
        href="https://github.com/tiennm99dev/algoatlas"
        class="focus-ring rounded text-teal-700 hover:underline">Source</a
      >
    </div>
  </footer>
</div>
