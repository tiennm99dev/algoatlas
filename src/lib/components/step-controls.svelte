<script>
  import { t } from '$lib/i18n/index.js';
  import { SPEEDS } from '$lib/player/player.svelte.js';

  /**
   * @type {{
   *   player: import('$lib/player/player.svelte.js').Player,
   *   locked?: boolean,
   * }}
   * `locked` blocks moving forward, e.g. while a quiz question is open.
   */
  let { player, locked = false } = $props();

  const c = t().controls;
  const btn =
    'inline-flex items-center justify-center size-10 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-teal-600';

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    const el = /** @type {HTMLElement | null} */ (e.target);
    if (el?.closest('input, select, textarea, button, [role="grid"]')) return;
    if (e.key === 'ArrowRight' && !locked) player.step();
    else if (e.key === 'ArrowLeft') player.back();
    else if (e.key === ' ' && !locked) player.toggle();
    else return;
    e.preventDefault();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3" role="group" aria-label={c.groupLabel}>
  <div class="flex flex-wrap items-center gap-2">
    <button class={btn} onclick={() => player.seek(0)} disabled={player.atStart} aria-label={c.first} title={c.first}>⏮</button>
    <button class={btn} onclick={player.back} disabled={player.atStart} aria-label={c.back} title={c.back}>◀</button>
    <button
      class="{btn} w-20 border-teal-600 bg-teal-600 font-semibold text-white hover:bg-teal-700"
      onclick={player.toggle}
      disabled={locked}
      aria-label={player.playing ? c.pause : c.play}
    >{player.playing ? '⏸ ' + c.pause : '▶ ' + c.play}</button>
    <button class={btn} onclick={player.step} disabled={player.atEnd || locked} aria-label={c.step} title={c.step}>▶</button>
    <button class={btn} onclick={() => player.seek(player.frames.length - 1)} disabled={player.atEnd || locked} aria-label={c.last} title={c.last}>⏭</button>

    <label class="ml-auto flex items-center gap-2 text-sm text-slate-600">
      {c.speed}
      <select
        class="rounded-md border border-slate-300 bg-white px-2 py-1"
        value={player.speed}
        onchange={(e) => (player.speed = Number(e.currentTarget.value))}
      >
        {#each SPEEDS as s (s)}
          <option value={s}>{s}×</option>
        {/each}
      </select>
    </label>
  </div>

  <label class="flex items-center gap-3 text-sm text-slate-600">
    <span class="shrink-0 tabular-nums">{c.stepOf(player.index + 1, player.frames.length)}</span>
    <input
      type="range"
      class="w-full accent-teal-600"
      min="0"
      max={player.frames.length - 1}
      value={player.index}
      disabled={locked}
      aria-label={c.scrub}
      oninput={(e) => player.seek(Number(e.currentTarget.value))}
    />
  </label>
  <p class="hidden text-xs text-slate-400 sm:block">{c.shortcuts}</p>
</div>
