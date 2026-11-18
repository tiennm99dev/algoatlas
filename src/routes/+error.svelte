<script>
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { t } from '$lib/i18n/index.js';

  const copy = t();
  const missing = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{copy.notFound.title} — {copy.site.title}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="decor-column mx-auto max-w-3xl px-4 py-16 text-center">
  <h1 class="mb-4 text-3xl font-semibold tracking-tight text-slate-900">
    {missing ? copy.notFound.title : copy.notFound.other(page.status)}
  </h1>
  <p class="mb-8 leading-relaxed text-slate-600">{copy.notFound.body}</p>
  <a href={resolve('/')} class="btn-primary px-6 py-3 text-base">{copy.notFound.home}</a>
</section>
