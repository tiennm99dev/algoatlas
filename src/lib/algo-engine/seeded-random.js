/**
 * One seeded generator for every engine that draws random input or coin flips: the linear
 * congruential generator from Numerical Recipes. The same seed always gives the same sequence,
 * so a prerendered page and its hydrated copy agree, and stored answers stay reproducible.
 */

/**
 * A generator of numbers in [0, 1) from a whole-number seed.
 * @param {number} seed
 * @returns {() => number}
 */
export function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
