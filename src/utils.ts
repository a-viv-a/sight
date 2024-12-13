import { useSearchParams } from "@solidjs/router"
import { Accessor } from "solid-js"

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

export const readFirst = <T>(v: T | T[]): T =>
  Array.isArray(v)
    ? v[0]
    : v
  
/**
stores a seed in search params for splitmix wrapped by helper to allow random behavior to be consistent on SSR and hydration

WARNING: this will return independent random generators seeded on the same input when called multiple times on the same page!
need to encorperate uniqueID or input offset or global "nth call" state to fix this

based on https://underscorejs.org/docs/modules/random.html
*/
export const useRandom = () => {
  const [searchParams, setSearchParams] = useSearchParams<{ seed: string | string[] }>()

  let seed = searchParams.seed
  if (seed === undefined) {
    seed = Math.floor(Math.random() * Math.pow(36, 6)).toString(36)
    setSearchParams({ seed })
  }

  const random = splitmix32(parseInt(readFirst(seed), 36))

  return (min: number, max?: number) => {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(random() * (max - min + 1));
  }
}


export const narrow = <A, B extends A>(accessor: Accessor<A>, guard: (v: A) => v is B): B | null => {
  const val = accessor()
  if (guard(val)) {
    return val
  }
  return null
}
