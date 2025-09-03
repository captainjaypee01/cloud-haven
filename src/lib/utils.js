import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Return a random subset of `arr` in random order.
 * - Size k is chosen uniformly from [0..n] (or [1..n] if allowEmpty = false).
 * - Order is uniformly random (Fisher–Yates).
 *
 * @param {string[]} arr
 * @param {{allowEmpty?: boolean, rng?: () => number}} [opts]
 * @returns {string[]}
 */
export function randomSubset(arr, opts = {}) {
  const { allowEmpty = true, rng = Math.random } = opts;
  const n = arr.length;
  if (n === 0) return [];

  // Copy then Fisher–Yates shuffle
  const a = arr.slice();
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  const minK = allowEmpty ? 0 : 1;
  const k = Math.floor(rng() * (n - minK + 1)) + minK; // uniform k
  return a.slice(0, k);
}