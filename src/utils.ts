import { Accessor } from "solid-js"

export const narrow = <A, B extends A>(accessor: Accessor<A>, guard: (v: A) => v is B): B | null => {
  const val = accessor()
  if (guard(val)) {
    return val
  }
  return null
}

export const clamp = (min: number, val: number, max: number) => 
  Math.min(max, Math.max(val, min))
