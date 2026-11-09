/**
 * Number-theory helpers shared by the number theory lessons, so each lesson engine uses one
 * tested copy:
 *
 * - `gcd`: the greatest common divisor by Euclid's algorithm (gcd(a, 0) = a).
 * - `isPrime`: primality by trial division, false for anything below 2 or not an integer.
 * - `powMod`: a^e mod m by repeated squaring, for moduli small enough that a product of two
 *   residues stays an exact integer.
 */

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gcd(a, b) {
  let [x, y] = [Math.abs(a), Math.abs(b)];
  while (y > 0) [x, y] = [y, x % y];
  return x;
}

/** @param {number} n */
export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/**
 * @param {number} a
 * @param {number} e  A whole exponent, 0 or more.
 * @param {number} m  A modulus of 1 or more.
 */
export function powMod(a, e, m) {
  let result = 1 % m;
  let x = ((a % m) + m) % m;
  for (let left = e; left > 0; left = Math.floor(left / 2)) {
    if (left % 2 === 1) result = (result * x) % m;
    x = (x * x) % m;
  }
  return result;
}
