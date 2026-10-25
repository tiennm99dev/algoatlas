<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    BUCKETS,
    SNIPPETS,
    doublingSizes,
    doublingTrace,
    gradePlacement,
    snippetById,
  } from '$lib/algo-engine/practice-complexity.js';
  import { en as m } from '$lib/lessons/practice-complexity/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-complexity.js').Bucket} Bucket */
  /** @typedef {import('$lib/algo-engine/practice-complexity.js').SnippetId} SnippetId */
  /** @typedef {import('$lib/algo-engine/practice-complexity.js').Snippet} Snippet */

  // A fixed first state keeps the prerendered HTML and the hydrated page identical.
  const emptyPlacement = () =>
    /** @type {Record<SnippetId, Bucket | null>} */ (
      Object.fromEntries(SNIPPETS.map((s) => [s.id, null]))
    );
  let placement = $state(emptyPlacement());
  /** @type {SnippetId | null} */
  let picked = $state(null);
  let measured = $state(SNIPPETS[0].id);
  let checked = $state(false);
  let revealed = $state(false);
  let status = $state('');

  const player = createPlayer(doublingTrace(SNIPPETS[0].id));
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame, m.cards[frame.id]));
  const grade = $derived(gradePlacement(placement));
  const tray = $derived(SNIPPETS.filter((s) => placement[s.id] === null));
  const sizes = $derived(doublingSizes(measured));
  const current = $derived(frame.rows.at(-1));

  /** @param {SnippetId} id */
  function pick(id) {
    if (picked === id) {
      picked = null;
      status = '';
      return;
    }
    picked = id;
    status = m.picked(m.cards[id]);
    if (measured !== id) {
      measured = id;
      player.load(doublingTrace(id));
    }
  }

  /** @param {Bucket | null} bucket */
  function place(bucket) {
    if (picked === null) {
      status = m.noPick;
      return;
    }
    const id = picked;
    placement[id] = bucket;
    picked = null;
    checked = false;
    revealed = false;
    status = bucket === null ? m.backToTray(m.cards[id]) : m.moved(m.cards[id], m.buckets[bucket]);
  }

  function check() {
    checked = true;
    status =
      grade.right === grade.total ? m.allRight : m.score(grade.right, grade.total, tray.length);
  }

  function reveal() {
    for (const s of SNIPPETS) placement[s.id] = s.bucket;
    picked = null;
    checked = true;
    revealed = true;
    status = m.revealed;
  }

  function reset() {
    placement = emptyPlacement();
    picked = null;
    checked = false;
    revealed = false;
    status = '';
  }

  /** @param {DragEvent} e @param {SnippetId} id */
  function dragStart(e, id) {
    e.dataTransfer?.setData('text/plain', id);
    if (picked !== id) pick(id);
  }

  /** @param {DragEvent} e @param {Bucket | null} bucket */
  function drop(e, bucket) {
    e.preventDefault();
    place(bucket);
  }

  /** @param {Snippet} s */
  function verdictOf(s) {
    if (!checked) return '';
    const v = grade.verdicts[s.id];
    return v === 'unplaced' ? '' : v;
  }

  /** @param {Snippet} s */
  function cardLabel(s) {
    const at = placement[s.id];
    const v = verdictOf(s);
    return m.cardLabel(
      m.cards[s.id],
      at === null ? m.inTray : m.inBucket(m.buckets[at]),
      picked === s.id,
      v ? m.verdicts[v] : '',
    );
  }

  /** @param {number} r @param {number} c */
  function cell(r, c) {
    const row = frame.rows[r];
    if (!row) return '';
    const v = c === 0 ? row.count : c === 1 ? row.ratio : row.diff;
    return v === null ? m.dash : m.fmt(v);
  }
</script>

{#snippet card(/** @type {Snippet} */ s)}
  {@const v = verdictOf(s)}
  <li>
    <button
      type="button"
      draggable="true"
      class="w-full rounded-lg border-2 bg-white p-2 text-left {picked === s.id
        ? 'border-teal-700 ring-2 ring-teal-700'
        : v === 'right'
          ? 'border-emerald-700'
          : v === 'wrong'
            ? 'border-rose-700'
            : 'border-slate-300'}"
      aria-pressed={picked === s.id}
      aria-label={cardLabel(s)}
      onclick={() => pick(s.id)}
      ondragstart={(e) => dragStart(e, s.id)}
    >
      <span class="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
        <span>{picked === s.id ? '▶ ' : ''}{m.cards[s.id]}</span>
        {#if v}
          <span class={v === 'right' ? 'text-emerald-800' : 'text-rose-800'}>{m.verdicts[v]}</span>
        {/if}
      </span>
      <code class="mt-1 block font-mono text-xs break-words whitespace-pre-wrap text-slate-900"
        >{s.code.join('\n')}</code
      >
      {#if revealed || v === 'right'}
        <span class="mt-1 block text-xs text-slate-600">{m.why[s.id]}</span>
      {/if}
    </button>
  </li>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <button type="button" class="btn-primary" onclick={check}>{m.check}</button>
    <button type="button" class="btn-outline" onclick={reveal}>{m.reveal}</button>
    <button type="button" class="btn-outline" onclick={reset}>{m.reset}</button>
    <p class="min-h-6 text-sm font-semibold text-slate-700" role="status">{status}</p>
  </div>

  <div class="mb-6 grid gap-4 lg:grid-cols-[18rem_1fr]">
    <section
      class="rounded-xl border border-slate-200 bg-slate-50 p-3"
      aria-label={m.trayTitle}
      ondragover={(e) => e.preventDefault()}
      ondrop={(e) => drop(e, null)}
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.trayTitle}
        </h2>
        <button
          type="button"
          class="btn-outline px-2 py-1 text-xs"
          aria-disabled={picked === null}
          aria-label={m.toTrayLabel}
          onclick={() => place(null)}>{m.toTray}</button
        >
      </div>
      <ul class="flex flex-col gap-2">
        {#each tray as s (s.id)}
          {@render card(s)}
        {:else}
          <li class="text-sm text-slate-500">{m.trayEmpty}</li>
        {/each}
      </ul>
    </section>

    <div class="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {#each BUCKETS as b (b)}
        <section
          class="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3"
          aria-label={m.buckets[b]}
          ondragover={(e) => e.preventDefault()}
          ondrop={(e) => drop(e, b)}
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="font-mono text-sm font-bold text-slate-800">{m.buckets[b]}</h2>
            <button
              type="button"
              class="btn-outline px-2 py-1 text-xs"
              aria-disabled={picked === null}
              aria-label={m.putHereLabel(m.buckets[b])}
              onclick={() => place(b)}>{m.putHere}</button
            >
          </div>
          <ul class="flex flex-col gap-2">
            {#each SNIPPETS.filter((s) => placement[s.id] === b) as s (s.id)}
              {@render card(s)}
            {:else}
              <li class="text-xs text-slate-400">{m.bucketEmpty}</li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.measureTitle}
        </h2>
        <p class="mb-2 text-sm font-semibold text-slate-800">{m.measuring(m.cards[measured])}</p>
        <div class="overflow-x-auto">
          <table class="w-full text-right text-sm tabular-nums" aria-label={m.tableAria}>
            <thead>
              <tr class="text-xs text-slate-500">
                <th scope="col" class="px-2 py-1 text-left">{m.stats.n}</th>
                {#each m.cols as c (c)}
                  <th scope="col" class="px-2 py-1">{c}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each sizes as n, r (n)}
                {@const hot = frame.kind === 'measure' && r === frame.rows.length - 1}
                <tr
                  class="border-t border-slate-100 {hot ? `${STATE_BG.active} text-white` : ''}"
                  aria-current={hot ? 'step' : undefined}
                >
                  <th scope="row" class="px-2 py-1 text-left font-mono font-normal"
                    >{hot ? '▶ ' : ''}{m.rowHead(n)}</th
                  >
                  {#each m.cols as _, c (c)}
                    <td class="px-2 py-1">{cell(r, c)}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.n}</dt>
          <dd class="text-2xl font-bold tabular-nums">{current ? m.fmt(current.n) : m.dash}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.count}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {current ? m.fmt(current.count) : m.dash}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.ratio}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {current?.ratio != null ? `× ${m.fmt(current.ratio)}` : m.dash}
          </dd>
        </div>
      </dl>
      <CodePanel lines={snippetById(measured).code} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
