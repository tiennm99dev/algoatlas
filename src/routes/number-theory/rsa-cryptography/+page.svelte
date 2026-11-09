<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    KEY_DIGITS,
    MAX_PRIME,
    MIN_PRIME,
    RSA_PRESETS,
    attackPseudocode,
    attackTrace,
    rsaPseudocode,
    rsaTrace,
    smallestExponent,
    trialYearsExponent,
    validExponent,
  } from '$lib/algo-engine/rsa-cryptography.js';
  import { en as m } from '$lib/lessons/rsa-cryptography/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import { isPrime } from '$lib/algo-engine/number-theory.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.modes} Mode */
  /** @typedef {keyof typeof RSA_PRESETS} Preset */
  /** @typedef {keyof typeof m.bitStates} BitRole */
  /** @typedef {keyof typeof m.labels} ValueName */
  /** @typedef {import('$lib/algo-engine/rsa-cryptography.js').RsaFrame} RsaFrame */

  const MODE_OPTIONS = /** @type {Mode[]} */ (Object.keys(m.modes)).map((value) => ({
    value,
    label: m.modes[value],
  }));
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(RSA_PRESETS));
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  /** @type {Record<BitRole, VisualState>} */
  const BIT_STATE = { current: 'active', used: 'sorted', skipped: 'pruned', waiting: '' };
  /** The value each step has just found, for the “new” mark. */
  /** @type {Partial<Record<RsaFrame['kind'], ValueName>>} */
  const NEW_VALUE = {
    modulus: 'n',
    phi: 'phi',
    public: 'e',
    private: 'd',
    cipher: 'c',
    recovered: 'recovered',
  };

  const START = RSA_PRESETS.classic;
  /** @param {number} p @param {number} q @param {number} e @param {number} M */
  const cipherOf = (p, q, e, M) =>
    /** @type {number} */ (/** @type {RsaFrame} */ (rsaTrace(p, q, e, M).at(-1)).c);

  let mode = $state(/** @type {Mode} */ ('owner'));
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let p = $state(START.p);
  let q = $state(START.q);
  let e = $state(START.e);
  let M = $state(START.M);
  let pDraft = $state(/** @type {number | null} */ (START.p));
  let qDraft = $state(/** @type {number | null} */ (START.q));
  let eDraft = $state(/** @type {number | null} */ (START.e));
  let MDraft = $state(/** @type {number | null} */ (START.M));

  const rsaPlayer = createPlayer(rsaTrace(START.p, START.q, START.e, START.M));
  const attackPlayer = createPlayer(
    attackTrace(START.p * START.q, START.e, cipherOf(START.p, START.q, START.e, START.M)),
  );
  const f = $derived(rsaPlayer.frame);
  const af = $derived(attackPlayer.frame);
  const player = $derived(mode === 'owner' ? rsaPlayer : attackPlayer);

  let notice = $state({ text: '', at: -1, mode: /** @type {Mode} */ ('owner') });
  const narration = $derived.by(() => {
    if (notice.mode === mode && notice.at === player.index) return notice.text;
    return mode === 'owner' ? m.describe(f) : m.describeAttack(af);
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index, mode };
  }

  function rebuild() {
    const c = cipherOf(p, q, e, M);
    rsaPlayer.load(rsaTrace(p, q, e, M));
    attackPlayer.load(attackTrace(p * q, e, c));
    notice = { text: '', at: -1, mode };
  }

  /**
   * New primes can leave e or M out of range for the new φ and n, so both are brought back into
   * range and the page says so.
   */
  function rebuildForPrimes() {
    const phi = (p - 1) * (q - 1);
    /** @type {string[]} */
    const notes = [];
    if (!validExponent(e, phi)) {
      e = eDraft = smallestExponent(phi);
      notes.push(m.exponentChanged(e));
    }
    if (M >= p * q) {
      M = MDraft = M % (p * q);
      notes.push(m.messageChanged(M));
    }
    preset = '';
    rebuild();
    if (notes.length) say(notes.join(' '));
  }

  /** @param {number | null} v @param {number} other */
  const validPrime = (v, other) =>
    wholeInRange(v, MIN_PRIME, MAX_PRIME) && isPrime(/** @type {number} */ (v)) && v !== other;

  function commitP() {
    if (!validPrime(pDraft, q)) {
      pDraft = p;
      say(m.primeError(MIN_PRIME, MAX_PRIME));
      return;
    }
    if (pDraft === p) return;
    p = /** @type {number} */ (pDraft);
    rebuildForPrimes();
  }

  function commitQ() {
    if (!validPrime(qDraft, p)) {
      qDraft = q;
      say(m.primeError(MIN_PRIME, MAX_PRIME));
      return;
    }
    if (qDraft === q) return;
    q = /** @type {number} */ (qDraft);
    rebuildForPrimes();
  }

  function commitE() {
    const phi = (p - 1) * (q - 1);
    if (eDraft === null || !validExponent(eDraft, phi)) {
      eDraft = e;
      say(m.exponentError(phi));
      return;
    }
    if (eDraft === e) return;
    e = eDraft;
    preset = '';
    rebuild();
  }

  function commitM() {
    if (!wholeInRange(MDraft, 0, p * q - 1)) {
      MDraft = M;
      say(m.messageError(p * q));
      return;
    }
    if (MDraft === M) return;
    M = /** @type {number} */ (MDraft);
    preset = '';
    rebuild();
  }

  /** @param {Preset} key */
  function loadPreset(key) {
    preset = key;
    p = pDraft = RSA_PRESETS[key].p;
    q = qDraft = RSA_PRESETS[key].q;
    e = eDraft = RSA_PRESETS[key].e;
    M = MDraft = RSA_PRESETS[key].M;
    rebuild();
  }

  const fresh = $derived(NEW_VALUE[f.kind] ?? '');
  const power = $derived(f.power);
  const powerKind = $derived(f.kind === 'decrypt' ? 'decrypt' : 'encrypt');
  const width = $derived(power ? power.bits.length : 0);
  // Strip cell i holds the bit with weight 2^(width − 1 − i), as the exponent is written highest first.
  const weightOf = (/** @type {number} */ i) => width - 1 - i;

  /** @param {number} i @returns {BitRole} */
  function bitRole(i) {
    if (!power) return 'waiting';
    const weight = weightOf(i);
    if (weight === power.k) return 'current';
    if (weight > power.k) return 'waiting';
    return power.bits[i] === 1 ? 'used' : 'skipped';
  }

  const check = $derived(
    f.d !== null && f.phi !== null ? String((f.e * f.d) % f.phi) : m.checkWaiting,
  );
  const match = $derived(
    f.recovered === null ? m.matchWaiting : f.recovered === f.M ? m.matchYes : m.matchNo,
  );
  const digits = $derived(f.n === null ? m.checkWaiting : String(f.n).length);

  const scale = KEY_DIGITS.map((d) => ({
    digits: m.scaleName(d),
    trials: m.scaleTrials(d),
    time: m.scaleTime(d, trialYearsExponent(d)),
  }));
</script>

{#snippet value(/** @type {ValueName} */ name, /** @type {number | null} */ v)}
  <div
    class="flex items-baseline justify-between gap-2 rounded-md px-2 py-1 {fresh === name
      ? 'bg-amber-50 font-semibold'
      : ''}"
  >
    <dt class="font-mono text-sm text-slate-600">{m.labels[name]}</dt>
    <dd class="text-right font-mono tabular-nums text-slate-900" data-testid={`v-${name}`}>
      {v === null ? m.unknown : v.toLocaleString('en-US')}
      {#if fresh === name}<span class="ml-1 text-xs text-amber-800">{m.justFound}</span>{/if}
    </dd>
  </div>
{/snippet}

{#snippet attackValue(/** @type {keyof typeof m.recovered} */ name, /** @type {number | null} */ v)}
  <div class="flex items-baseline justify-between gap-2 px-2 py-1">
    <dt class="font-mono text-sm text-slate-600">{m.recovered[name]}</dt>
    <dd class="text-right font-mono tabular-nums text-slate-900" data-testid={`a-${name}`}>
      {v === null ? m.unknown : v.toLocaleString('en-US')}
    </dd>
  </div>
{/snippet}

{#snippet stat(
  /** @type {string} */ label,
  /** @type {string | number} */ v,
  /** @type {string} */ id,
  wide = false,
)}
  <div class="rounded-xl border border-slate-200 bg-white p-3 {wide ? 'col-span-2' : ''}">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-xl font-bold break-all tabular-nums" data-testid={id}>{v}</dd>
  </div>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl legend={m.modeLegend} name="mode" options={MODE_OPTIONS} bind:value={mode} />
  </div>

  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.p}
      <input
        type="number"
        name="p"
        min={MIN_PRIME}
        max={MAX_PRIME}
        class="field w-24 tabular-nums"
        bind:value={pDraft}
        onchange={commitP}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.q}
      <input
        type="number"
        name="q"
        min={MIN_PRIME}
        max={MAX_PRIME}
        class="field w-24 tabular-nums"
        bind:value={qDraft}
        onchange={commitQ}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.e}
      <input
        type="number"
        name="e"
        min="2"
        class="field w-28 tabular-nums"
        bind:value={eDraft}
        onchange={commitE}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.M}
      <input
        type="number"
        name="M"
        min="0"
        max={p * q - 1}
        class="field w-32 tabular-nums"
        bind:value={MDraft}
        onchange={commitM}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(ev) => loadPreset(/** @type {Preset} */ (ev.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as key (key)}
          <option value={key}>{m.presets[key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {#if mode === 'owner'}
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-emerald-300 bg-white p-3">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-emerald-800 uppercase">
              {m.publicTitle}
            </h2>
            <dl>
              {@render value('n', f.n)}
              {@render value(
                'e',
                f.kind === 'start' || f.kind === 'modulus' || f.kind === 'phi' ? null : f.e,
              )}
              {@render value('c', f.c)}
            </dl>
          </div>
          <div class="rounded-xl border border-rose-300 bg-white p-3">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-rose-800 uppercase">
              {m.privateTitle}
            </h2>
            <dl>
              {@render value('p', f.p)}
              {@render value('q', f.q)}
              {@render value('phi', f.phi)}
              {@render value('d', f.d)}
            </dl>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.messageTitle}
            </h2>
            <dl>
              {@render value('M', f.M)}
              {@render value('recovered', f.recovered)}
            </dl>
          </div>
        </div>

        {#if power}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.powerTitle[powerKind]}
            </h2>
            <ArrayStrip
              values={power.bits}
              ariaLabel={m.bitsAria(power.exponent)}
              stateOf={(i) => BIT_STATE[bitRole(i)]}
              markerOf={(i) => m.bitMarkers[bitRole(i)]}
              labelOf={(i) => m.bitLabel(weightOf(i), power.bits[i], m.bitStates[bitRole(i)])}
              showIndices={false}
              pointers={[{ name: m.bitPointer, index: width - 1 - power.k }]}
              speed={player.speed}
            />
            <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {#each LEGEND as role (role)}
                <li class="flex items-center gap-1.5">
                  <span
                    class="size-3 rounded-sm border border-slate-700 {STATE_BG[BIT_STATE[role]]}"
                  ></span>{m.legend[role]}
                </li>
              {/each}
            </ul>
          </div>
        {:else if f.euclid.length > 0}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.euclidTitle}
            </h2>
            <ScrollFrame>
              <table class="w-full text-right text-sm tabular-nums">
                <thead>
                  <tr class="text-xs text-slate-500">
                    <th scope="col" class="px-2 py-1 font-semibold">{m.euclidHead.q}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.euclidHead.r}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.euclidHead.t}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each f.euclid as row, i (i)}
                    <tr
                      class="border-t border-slate-100 {f.kind === 'euclid' &&
                      i === f.euclid.length - 1
                        ? 'bg-amber-50 font-semibold'
                        : ''}"
                    >
                      <td class="px-2 py-1">{i < 2 ? '' : row.q}</td>
                      <td class="px-2 py-1">{row.r.toLocaleString('en-US')}</td>
                      <td class="px-2 py-1">{String(row.t).replace('-', '−')}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </ScrollFrame>
          </div>
        {/if}
      {:else}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.attackTitle}
          </h2>
          <p class="mb-2 text-sm text-slate-600">{m.attackIntro}</p>
          <p
            class="mb-3 font-mono text-xl font-semibold tabular-nums text-slate-900"
            data-testid="attack-line"
          >
            {m.attackLine(af)}
          </p>
          <dl class="grid gap-x-4 sm:grid-cols-2">
            {@render attackValue('p', af.p)}
            {@render attackValue('q', af.q)}
            {@render attackValue('phi', af.phi)}
            {@render attackValue('d', af.d)}
            {@render attackValue('M', af.M)}
          </dl>
        </div>
      {/if}

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {#if mode === 'owner'}
          {@render stat(m.stats.multiplications, f.multiplications, 'multiplications')}
          {@render stat(m.stats.check, check, 'check')}
          {@render stat(m.stats.match, match, 'match')}
          {@render stat(m.stats.size, digits, 'digits')}
        {:else}
          {@render stat(m.attackStats.trials, af.trials, 'trials')}
          {@render stat(m.attackStats.owner, 1, 'owner')}
        {/if}
      </dl>
      {#if mode === 'owner'}
        <CodePanel lines={rsaPseudocode} active={f.lines} />
      {:else}
        <CodePanel lines={attackPseudocode} active={af.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#key mode}
        <StepControls {player} />
      {/key}
    </div>
  </div>

  {#if mode === 'attacker'}
    <div class="mt-4 min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.scaleTitle}
      </h2>
      <ScrollFrame>
        <table class="w-full text-left text-sm tabular-nums" data-testid="scale">
          <thead>
            <tr class="text-xs text-slate-500">
              <th scope="col" class="px-2 py-1 font-semibold">{m.scaleHead.digits}</th>
              <th scope="col" class="px-2 py-1 font-semibold">{m.scaleHead.trials}</th>
              <th scope="col" class="px-2 py-1 font-semibold">{m.scaleHead.time}</th>
            </tr>
          </thead>
          <tbody>
            {#each scale as row (row.digits)}
              <tr class="border-t border-slate-100">
                <td class="px-2 py-1">{row.digits}</td>
                <td class="px-2 py-1 whitespace-nowrap">{row.trials}</td>
                <td class="px-2 py-1">{row.time}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </ScrollFrame>
      <p class="mt-2 text-sm text-slate-600">{m.scaleNote}</p>
    </div>
  {/if}

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
