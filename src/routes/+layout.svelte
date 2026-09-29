<script>
  import '../app.css';
  import { asset, resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { topicPath } from '$lib/lessons/registry.js';

  let { children } = $props();
  const copy = t();
</script>

<div class="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <a href={resolve('/')} class="flex items-center gap-2 text-xl font-bold tracking-tight text-teal-700">
        <img src={asset('/favicon.svg')} alt="" class="size-7" />
        {copy.site.title}
      </a>
      <nav aria-label={copy.lessonChrome.navLabel} class="hidden sm:block">
        <ul class="flex gap-4 text-sm font-medium text-slate-600">
          {#each copy.topicOrder as key (key)}
            <li><a href={resolve(/** @type {'/'} */ (topicPath(key)))} class="hover:text-teal-700">{copy.topics[key].title}</a></li>
          {/each}
        </ul>
      </nav>
    </div>
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-6 text-sm text-slate-500">
      <span>© {new Date().getFullYear()}</span>
      <a href="https://github.com/tiennm99" class="text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">tiennm99</a>
      <span aria-hidden="true">·</span>
      <a href="https://github.com/tiennm99dev/algoatlas/blob/main/LICENSE" class="text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">Apache-2.0</a>
      <span aria-hidden="true">·</span>
      <a href="https://github.com/tiennm99dev/algoatlas" class="text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">Source</a>
    </div>
  </footer>
</div>
