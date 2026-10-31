/**
 * Props for `mount` in component tests that the test can change afterwards: assign a field,
 * then `flushSync()`, and the mounted component updates as if its parent re-rendered.
 * @template {Record<string, any>} T
 * @param {T} initial
 * @returns {T}
 */
export function reactiveProps(initial) {
  const props = $state(initial);
  return props;
}
