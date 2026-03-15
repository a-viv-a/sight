import { createUniqueId, type JSX } from "solid-js";

// splitmix32! yum!
export const splitmix32 = (a: number) =>
  () => {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }

/**
 * Provides a stable seeded PRNG across SSR and hydration.
 *
 * On SSR: generates a random seed, embeds it in a hidden span.
 * On hydration: reads the seed from the DOM.
 * On client-only: generates a fresh seed.
 *
 * Returns a random(min, max?) helper and a SeedEmbed component
 * that must be rendered in the consumer's JSX.
 *
 * WARNING: multiple calls on the same page produce independent
 * generators seeded on different values — but each instance is
 * internally consistent across SSR/hydration.
 */
export const useRandom = (): {
  random: (min: number, max?: number) => number;
  SeedEmbed: () => JSX.Element;
} => {
  const id = createUniqueId()

  const seed = (() => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id)
      if (el?.dataset.seed) {
        return parseInt(el.dataset.seed, 36)
      }
    }
    return Math.floor(Math.random() * Math.pow(36, 6))
  })()

  const rng = splitmix32(seed)

  const SeedEmbed = () => <span id={id} data-seed={seed.toString(36)} hidden />

  const random = (min: number, max?: number) => {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(rng() * (max - min + 1));
  }

  return { random, SeedEmbed }
}
