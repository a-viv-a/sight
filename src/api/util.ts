import { getRequestEvent } from "solid-js/web"

export const event = () => {
  const event = getRequestEvent()
  if (event === undefined) {
    throw new Error("missing event details")
  }
  const cf = event?.nativeEvent.context.cloudflare
  if (cf === undefined) {
    throw new Error("missing cloudflare event details")
  }
  if (event.request === undefined) {
    throw new Error("missing request details")
  }
  return { env: cf.env, ...event }
}


type RatelimitBacking<K> = {
  readKey: (key: K) => Promise<number | null>
  writeKey: (key: K, tat: number) => Promise<boolean>
  getTime: () => number
}

type RatelimitConfig = {
  limit: number
  period: number
}

const ratelimit = async <K>(
  key: K,
  arrivedAt: number,
  quantity = 1,
  cfg: RatelimitConfig,
  backing: RatelimitBacking<K>
): Promise<{ accept: true } | { accept: false, retryAfter: number }> => {

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
    backing.writeKey(key, tat)
    return { accept: false, retryAfter: emissionInterval - (arrivedAt - allowAt)}
  }

  backing.writeKey(key, newTat)
  return { accept: true }
}
