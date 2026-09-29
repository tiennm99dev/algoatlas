<script>
  import { tick, untrack } from 'svelte';
  import { t } from '$lib/i18n/index.js';
  import { SPEEDS } from '$lib/player/player.svelte.js';

  /** @type {{player: import('$lib/player/player.svelte.js').Player}} */
  let { player } = $props();

  const c = t().controls;

  // Stop autoplay when the lesson unmounts so no timer outlives the page.
  $effect(() => () => player.pause());

  // The narration is muted while playing, so say once where playback stopped.
  let stopped = $state('');
  let wasPlaying = false;
  $effect(() => {
    const playing = player.playing;
    if (wasPlaying && !playing) {
      const message = untrack(() => c.stoppedAt(player.index + 1, player.frames.length));
      // A live region only announces changed text, so clear it before a repeated message.
      stopped = '';
      tick().then(() => (stopped = message));
    }
    wasPlaying = playing;
  });

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const el = /** @type {HTMLElement | null} */ (e.target);
    // Form fields and the editable grid own their arrow keys.
    if (el?.closest('input, select, textarea, [role="grid"]')) return;
    if (e.key === 'ArrowRight') player.step();
    else if (e.key === 'ArrowLeft') player.back();
    // Space toggles only inside the player area so it still scrolls the page elsewhere;
    // on a focused button it already activates that button natively.
    else if (e.key === ' ' && el?.closest('[data-player-scope]') && !el.closest('button'))
      player.toggle();
    else return;
    e.preventDefault();
  }

  // SVG paths on a 24-unit box; text glyphs render as color emoji on some platforms.
  const icons = {
    first: 'M6 5h2v14H6zM20 5v14L10 12z',
    back: 'M15 5v14L6 12z',
    step: 'M9 5v14l9-7z',
    last: 'M16 5h2v14h-2zM4 5v14l10-7z',
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  };
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet icon(/** @type {string} */ d)}
  <svg viewBox="0 0 24 24" class="size-5 fill-current" aria-hidden="true"><path {d} /></svg>
{/snippet}

<!-- Buttons at the trace ends use aria-disabled rather than disabled so focus stays put;
     the player methods are already no-ops at the bounds. -->
<div
  class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg lg:shadow-none"
  role="group"
  aria-label={c.groupLabel}
>
  <div class="flex flex-wrap items-center gap-2">
    <button
      class="btn-icon"
      onclick={() => player.seek(0)}
      aria-disabled={player.atStart}
      aria-label={c.first}
      title={c.first}>{@render icon(icons.first)}</button
    >
    <button
      class="btn-icon"
      onclick={player.back}
      aria-disabled={player.atStart}
      aria-label={c.back}
      title={c.back}>{@render icon(icons.back)}</button
    >
    <button class="btn-primary w-28 justify-center" onclick={player.toggle}>
      {@render icon(player.playing ? icons.pause : icons.play)}
      {player.playing ? c.pause : player.atEnd ? c.replay : c.play}
    </button>
    <button
      class="btn-icon"
      onclick={player.step}
      aria-disabled={player.atEnd}
      aria-label={c.step}
      title={c.step}>{@render icon(icons.step)}</button
    >
    <button
      class="btn-icon"
      onclick={() => player.seek(player.frames.length - 1)}
      aria-disabled={player.atEnd}
      aria-label={c.last}
      title={c.last}>{@render icon(icons.last)}</button
    >

    <label class="ml-auto flex items-center gap-2 text-sm text-slate-600">
      {c.speed}
      <select
        class="field"
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
      class="focus-ring w-full rounded accent-teal-700"
      min="0"
      max={player.frames.length - 1}
      value={player.index}
      aria-label={c.scrub}
      aria-valuetext={c.stepOf(player.index + 1, player.frames.length)}
      oninput={(e) => player.seek(Number(e.currentTarget.value))}
    />
  </label>
  <p class="text-xs text-slate-500 print:hidden">{c.shortcuts}</p>
  <p class="sr-only" role="status">{stopped}</p>
</div>
