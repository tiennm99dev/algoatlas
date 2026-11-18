<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n/index.js';
  import PracticeQuestion from './practice-question.svelte';

  /**
   * A quiz of answer-checked questions (number, choice, multi, text, order). Solved questions
   * get a per-viewer tick kept in localStorage under `id`; the block works the same when
   * storage is blocked, it just forgets on reload.
   * @type {{
   *   exercises: import('./answer-check.js').Exercise[],
   *   id: string,
   *   title?: string,
   * }}
   */
  let { exercises, id, title } = $props();

  const c = t().practice;
  const headingId = $props.id();
  const storageKey = $derived(`algorithmally:practice:${id}`);
  // The site was called AlgoAtlas; progress saved under that name moves to the new key once.
  const legacyKey = $derived(`algoatlas:practice:${id}`);

  /** @type {number[]} */
  let solved = $state([]);
  // Bumped by reset so every question remounts with empty inputs.
  let round = $state(0);

  // Read after hydration so the prerendered HTML never depends on one viewer's storage.
  onMount(() => {
    migrate(legacyKey, storageKey);
    solved = load(storageKey, exercises.length);
  });

  /** Copies progress from `from` to `to` when `to` is empty, then drops `from`.
   * @param {string} from @param {string} to */
  function migrate(from, to) {
    try {
      const old = localStorage.getItem(from);
      if (old === null) return;
      if (localStorage.getItem(to) === null) localStorage.setItem(to, old);
      localStorage.removeItem(from);
    } catch {
      // Blocked storage: nothing to move.
    }
  }

  /** @param {string} key @param {number} n @returns {number[]} */
  function load(key, n) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(raw)
        ? [...new Set(raw)].filter((i) => Number.isInteger(i) && i >= 0 && i < n)
        : [];
    } catch {
      return [];
    }
  }

  /** @param {number[]} next */
  function save(next) {
    solved = next;
    try {
      if (next.length === 0) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Private windows and blocked storage: the tick lasts until reload.
    }
  }

  /** @param {number} i */
  function markSolved(i) {
    if (!solved.includes(i)) save([...solved, i].sort((a, b) => a - b));
  }

  function reset() {
    save([]);
    round++;
  }
</script>

<section aria-labelledby={headingId}>
  <div class="mb-3 flex flex-wrap items-baseline gap-3">
    <h2 id={headingId} class="text-lg font-bold text-slate-900">{title ?? c.title}</h2>
    <span class="text-sm text-slate-600 tabular-nums"
      >{c.progress(solved.length, exercises.length)}</span
    >
    <button
      type="button"
      class="btn-outline ml-auto"
      aria-disabled={solved.length === 0}
      onclick={() => solved.length > 0 && reset()}>{c.resetProgress}</button
    >
  </div>
  {#key round}
    <ol class="flex flex-col gap-4">
      {#each exercises as exercise, i (i)}
        <PracticeQuestion
          {exercise}
          index={i}
          total={exercises.length}
          solved={solved.includes(i)}
          onsolve={() => markSolved(i)}
        />
      {/each}
    </ol>
  {/key}
</section>
