import { useSearchParams } from "@solidjs/router"
import { Accessor } from "solid-js"
import { getRequestEvent } from "solid-js/web"
import { H3EventContext } from "vinxi/server"
import { IS_PRODUCTION } from "~/mode"

export const event = async () => {
  const event = getRequestEvent()
  if (event === undefined) {
    throw new Error("missing event details")
  }

  let cf = event?.nativeEvent.context.cloudflare
  if (cf === undefined) {
    if (IS_PRODUCTION)
      throw new Error("missing cloudflare event details")

    console.warn("mocking out cloudflare with wrangler platform proxy")
    cf = await (await import("wrangler")).getPlatformProxy() as H3EventContext["Cloudflare"]
  }
  if (event.request === undefined) {
    throw new Error("missing request details")
  }
  return { env: cf.env, ...event }
}

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

export type RatelimitBacking<K> = {
  readKey: (key: K) => Promise<number | null>
  writeKey: (key: K, tat: number) => Promise<void>
  getTime: () => number
}

export type RatelimitConfig = {
  /** should be greater than 1... */
  limit: number
  /** period of limit in ms */
  period: number
}

// https://blog.ian.stapletoncordas.co/2018/12/understanding-generic-cell-rate-limiting
export const ratelimit = async <K>(
  key: K,
  arrivedAt: number,
  cfg: RatelimitConfig,
  backing: RatelimitBacking<K>
): Promise<{ accept: true } | { accept: false, retryAfter: number }> => {

  const quantity = 1
  // amount allowed per period
  const emissionInterval = cfg.period / cfg.limit
  const delayVariationTolerance = cfg.period
  const increment = emissionInterval * quantity

  // tat is theoretical arrival time
  const tat = await backing.readKey(key) ?? arrivedAt
  const newTat = Math.max(tat, arrivedAt) + increment
  const allowAt = newTat - delayVariationTolerance

  const remaining = Math.floor(
    ((arrivedAt - allowAt) / emissionInterval) + 0.5
  )

  if (remaining < 1) {
    return { accept: false, retryAfter: (allowAt - arrivedAt) / 1e3 }
  }

  await backing.writeKey(key, newTat)
  return { accept: true }
}

export const d1backing = (env: Wenv) => ({
  readKey: async (key) => env.DB.prepare(
    `SELECT tat FROM Ratelimits WHERE key = ?`
  ).bind(key).first<number>("tat"),
  writeKey: async (key, tat) => {
    env.DB.prepare(
      `INSERT INTO Ratelimits (key, tat) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET tat=?2`
    ).bind(key, tat).run()
  },
  getTime: Date.now,
} satisfies RatelimitBacking<string>)

// 2.5 actions per hour 
export const restrictiveRatelimit = {
  limit: 15,
  // 6 hours
  period: 2.16e7
} satisfies RatelimitConfig

export const narrow = <A, B extends A>(accessor: Accessor<A>, guard: (v: A) => v is B): B | null => {
  const val = accessor()
  if (guard(val)) {
    return val
  }
  return null
}
