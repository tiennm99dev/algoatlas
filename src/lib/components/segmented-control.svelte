<script>
  /**
   * A radio group styled as a row of toggle buttons.
   * @type {{
   *   legend: string,
   *   name: string,
   *   options: {value: string, label: string}[],
   *   value: string,
   *   onchange?: () => void,
   * }}
   */
  let { legend, name, options, value = $bindable(), onchange } = $props();
</script>

<fieldset>
  <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{legend}</legend
  >
  <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
    {#each options as opt (opt.value)}
      <label
        class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-slate-800 has-checked:bg-teal-700 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700"
      >
        <input
          type="radio"
          class="sr-only"
          {name}
          value={opt.value}
          bind:group={value}
          {onchange}
        />
        {opt.label}
      </label>
    {/each}
  </div>
</fieldset>
