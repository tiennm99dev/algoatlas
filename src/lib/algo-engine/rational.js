/**
 * Exact rational arithmetic for engines whose steps a learner checks by hand. Every fraction is
 * kept in lowest terms with a positive denominator, so equal values compare equal field by field.
 */

import { gcd } from './number-theory.js';

/**
 * A fraction num/den in lowest terms with den > 0.
 * @typedef {object} Frac
 * @property {number} num
 * @property {number} den
 */

/** @param {number} num @param {number} [den] @returns {Frac} */
export function frac(num, den = 1) {
  if (den === 0) throw new Error('zero denominator');
  const g = gcd(num, den) || 1;
  const sign = den < 0 ? -1 : 1;
  return { num: (sign * num) / g + 0, den: (sign * den) / g };
}

/** @param {Frac} p @param {Frac} q */
export const fadd = (p, q) => frac(p.num * q.den + q.num * p.den, p.den * q.den);
/** @param {Frac} p @param {Frac} q */
export const fsub = (p, q) => frac(p.num * q.den - q.num * p.den, p.den * q.den);
/** @param {Frac} p @param {Frac} q */
export const fmul = (p, q) => frac(p.num * q.num, p.den * q.den);
/** @param {Frac} p @param {Frac} q */
export const fdiv = (p, q) => frac(p.num * q.den, p.den * q.num);
/** @param {Frac} p */
export const isZero = (p) => p.num === 0;
/** Compares p and q: negative, zero or positive. @param {Frac} p @param {Frac} q */
export const fcmp = (p, q) => p.num * q.den - q.num * p.den;
/** @param {Frac} p */
export const fabs = (p) => frac(Math.abs(p.num), p.den);
/** @param {Frac} p */
export const fvalue = (p) => p.num / p.den;
